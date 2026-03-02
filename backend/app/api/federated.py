"""
Federated Learning API for Healthcare Data Training
Integrated with Differential Privacy and Blockchain Audit Trail.
"""

from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
import logging
from datetime import datetime

from app.core.dependencies import get_current_user, require_role, require_permission
from app.services.federated_service import federated_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/fl", tags=["federated-learning"])

class StartRoundRequest(BaseModel):
    min_participants: int = 3
    max_participants: int = 10

class UpdateSubmission(BaseModel):
    hospital_id: str
    weights: List[float]
    num_samples: int
    epsilon: float
    delta: float

@router.post("/start-round")
async def start_round(request: StartRoundRequest, current_user: Dict[str, Any] = Depends(require_role(["super_admin", "admin"]))):
    """Initiate a new federated learning round"""
    try:
        result = await federated_service.start_new_round(current_user["user_id"])
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/submit-update")
async def submit_update(update: UpdateSubmission, current_user: Dict[str, Any] = Depends(require_permission("submit_weights"))):
    """Submit local model update from a hospital node"""
    # Verify hospital ID matches the user's hospital
    if current_user.get("role") == "hospital" and current_user.get("hospital_id") != update.hospital_id:
        raise HTTPException(status_code=403, detail="Hospital ID mismatch")
        
    try:
        result = await federated_service.submit_hospital_update(
            hospital_id=update.hospital_id,
            weights=update.weights,
            num_samples=update.num_samples,
            epsilon_used=update.epsilon,
            delta_used=update.delta
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/status")
async def get_status(round_number: Optional[int] = None, current_user: Dict[str, Any] = Depends(get_current_user)):
    """Get status of the current or specified training round"""
    try:
        return await federated_service.get_round_status(round_number)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/history")
async def get_history(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Get history of completed training rounds"""
    return federated_service.round_history

@router.get("/latest-model")
async def get_latest_model(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Get current global model information"""
    return await federated_service.get_global_model_info()
