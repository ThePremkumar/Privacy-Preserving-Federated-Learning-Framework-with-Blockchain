"""
Doctor Operations API
"""

from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
import logging
from app.core.dependencies import get_current_user, require_role

router = APIRouter()

@router.get("/patients")
async def get_patients(current_user: Dict[str, Any] = Depends(require_role(["doctor"]))):
    """Get patients list for the doctor"""
    return {"patients": [], "doctor_id": current_user.get('user_id', 'unknown')}
