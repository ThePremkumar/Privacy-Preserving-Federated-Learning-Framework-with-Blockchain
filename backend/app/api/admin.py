"""
System Administration API
"""

from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
import logging
from app.core.dependencies import get_current_user, require_role

router = APIRouter()

@router.get("/config")
async def get_system_config(current_user: Dict[str, Any] = Depends(require_role(["super_admin", "admin"]))):
    """Get global system configuration"""
    return {"version": "1.0.0", "status": "active"}
