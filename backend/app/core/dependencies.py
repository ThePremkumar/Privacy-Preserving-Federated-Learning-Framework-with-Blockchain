"""
FastAPI Request dependencies for authentication and authorization.
"""

from typing import List, Optional, Dict, Any, Union
from fastapi import Request, HTTPException, Depends, Security, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import logging
from app.core.security import decode_token
from app.models.user import User

logger = logging.getLogger(__name__)
security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)) -> Dict[str, Any]:
    """Extract and verify the current user from JWT token."""
    token = credentials.credentials
    payload = decode_token(token)
    
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Return user data from token payload
    return {
        "user_id": payload.get("sub"),
        "username": payload.get("username"),
        "email": payload.get("email"),
        "role": payload.get("role"),
        "hospital_id": payload.get("hospital_id"),
        "permissions": payload.get("permissions", [])
    }

def require_role(allowed_roles: List[str]):
    """FastAPI dependency to enforce role-based access control."""
    async def role_checker(current_user: Dict[str, Any] = Depends(get_current_user)):
        if current_user.get("role") not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions to access this resource"
            )
        return current_user
    return role_checker

def require_permission(permission: str):
    """FastAPI dependency for granular permission checking."""
    async def permission_checker(current_user: Dict[str, Any] = Depends(get_current_user)):
        if permission not in current_user.get("permissions", []):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Missing required permission: {permission}"
            )
        return current_user
    return permission_checker
