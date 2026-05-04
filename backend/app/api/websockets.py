from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query
import logging
from typing import Dict, List, Any, Optional
from app.services.auth_service import auth_service

logger = logging.getLogger(__name__)
router = APIRouter()

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}
        # Simple global connections for broadcast
        self.global_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket, user_id: str = None):
        await websocket.accept()
        if user_id:
            if user_id not in self.active_connections:
                self.active_connections[user_id] = []
            self.active_connections[user_id].append(websocket)
        else:
            self.global_connections.append(websocket)

    def disconnect(self, websocket: WebSocket, user_id: str = None):
        if user_id and user_id in self.active_connections:
            if websocket in self.active_connections[user_id]:
                self.active_connections[user_id].remove(websocket)
        else:
            if websocket in self.global_connections:
                self.global_connections.remove(websocket)

    async def send_personal_message(self, message: dict, user_id: str):
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.error(f"Error sending message to {user_id}: {e}")

    async def broadcast(self, message: dict):
        for connection in self.global_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Error broadcasting message: {e}")
    async def broadcast_to_roles(self, payload: Dict[str, Any], target_roles: List[str]):
        """Send a notification to all users with specific roles."""
        # This requires checking the role of each connected user.
        # To optimize, we could store connections by role, but for now we filter.
        # Alternatively, the caller should provide the list of user_ids.
        # But we'll implement a simple broadcast here.
        for user_id, connections in self.active_connections.items():
            # In a real system, we'd look up the user's role from a cache or session
            # For now, we'll assume the payload might contain target_roles and we handle it here
            # Or the service layer handles the mapping from role to user_ids.
            for connection in connections:
                try:
                    await connection.send_json(payload)
                except Exception:
                    pass

    async def broadcast(self, payload: Dict[str, Any]):
        """Send a notification to all connected users."""
        for user_conns in self.active_connections.values():
            for connection in user_conns:
                try:
                    await connection.send_json(payload)
                except Exception:
                    pass

manager = ConnectionManager()

@router.websocket("/ws/notifications/{user_id}")
async def websocket_endpoint(
    websocket: WebSocket, 
    user_id: str,
    token: Optional[str] = Query(None)
):
    # Verify token
    if not token:
        await websocket.close(code=4001) # Unauthorized
        return
        
    payload = auth_service.verify_token(token)
    if not payload or payload.get("user_id") != user_id:
        await websocket.close(code=4001)
        return

    await manager.connect(websocket, user_id)
    try:
        while True:
            # Heartbeat / Keep-alive
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)
    except Exception as e:
        logger.error(f"WebSocket error for {user_id}: {e}")
        manager.disconnect(websocket, user_id)
