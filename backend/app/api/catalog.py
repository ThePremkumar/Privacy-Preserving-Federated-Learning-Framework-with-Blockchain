from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, List, Any
from app.core.constants import ORGANIZATION_CATALOG, SPECIALIZATION_TO_DEPARTMENTS
from app.core.dependencies import get_current_user

router = APIRouter(tags=["catalog"])

@router.get("/organization-types")
async def get_organization_types():
    """Get the built-in catalog of organization types, specializations, and departments."""
    return ORGANIZATION_CATALOG

@router.get("/specialization-map")
async def get_specialization_map():
    """Get the mapping of specializations to suggested departments."""
    return SPECIALIZATION_TO_DEPARTMENTS

@router.get("/node-catalog")
@router.get("/node-active")
async def get_node_catalog(hospital_id: str = None, current_user: Any = Depends(get_current_user)):
    """Get the active catalog for the current user's hospital node."""
    from app.core.database import SessionLocal
    from app.core.db_models import Hospital
    
    # Use provided hospital_id if admin/super_admin, otherwise force current_user's hospital
    target_hospital_id = hospital_id if (current_user.role in ["admin", "super_admin"] and hospital_id) else current_user.hospital_id
    
    if not target_hospital_id:
        return {"specializations": [], "departments": []}
        
    db = SessionLocal()
    try:
        hospital = db.query(Hospital).filter(Hospital.id == target_hospital_id).first()
        if not hospital:
            return {"specializations": [], "departments": []}
            
        return {
            "type": hospital.organization_type,
            "specializations": hospital.active_specializations or [],
            "departments": hospital.active_departments or []
        }
    finally:
        db.close()
