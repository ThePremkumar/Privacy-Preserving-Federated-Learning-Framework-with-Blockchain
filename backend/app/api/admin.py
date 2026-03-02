"""
System Administration API
"""

from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
import logging
from app.api.auth import get_current_user

router = APIRouter()

@router.get("/config")
async def get_system_config(current_user: Any = Depends(get_current_user)):
    """Get global system configuration"""
    return {"version": "1.0.0", "status": "active"}
