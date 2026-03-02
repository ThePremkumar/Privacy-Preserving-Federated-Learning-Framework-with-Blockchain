"""
Hospital Operations API
"""

from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
import logging
from app.api.auth import get_current_user

router = APIRouter()

@router.get("/status")
async def get_hospital_status(current_user: Any = Depends(get_current_user)):
    """Get hospital operational status"""
    return {"status": "operational", "hospital_id": getattr(current_user, 'hospital_id', 'unknown')}
