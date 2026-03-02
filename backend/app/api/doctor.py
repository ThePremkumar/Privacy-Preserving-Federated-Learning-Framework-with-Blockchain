"""
Doctor Operations API
"""

from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
import logging
from app.api.auth import get_current_user

router = APIRouter()

@router.get("/patients")
async def get_patients(current_user: Any = Depends(get_current_user)):
    """Get patients list for the doctor"""
    return {"patients": [], "doctor_id": getattr(current_user, 'id', 'unknown')}
