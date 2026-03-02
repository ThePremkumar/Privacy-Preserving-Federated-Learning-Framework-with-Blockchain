"""
API Router for Patient Management (MongoDB based)
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any, Optional
from app.core.dependencies import get_current_user, require_role
from app.core.mongodb import patient_repo
from pydantic import BaseModel, Field
from datetime import datetime

router = APIRouter(prefix="/patients", tags=["patients"])

class PatientCreate(BaseModel):
    name: str
    age: int
    gender: str
    medical_history: List[str] = []
    current_symptoms: List[str] = []
    clinical_note: Optional[str] = None

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_patient(patient: PatientCreate, current_user: Dict[str, Any] = Depends(require_role(["doctor", "hospital"]))):
    """Register a new patient"""
    patient_data = patient.model_dump()
    patient_data["hospital_id"] = current_user.get("hospital_id")
    patient_data["created_by"] = current_user.get("user_id")
    
    patient_id = await patient_repo.insert_one(patient_data)
    return {"id": patient_id, "message": "Patient registered successfully"}

@router.get("/", response_model=List[Dict[str, Any]])
async def list_patients(current_user: Dict[str, Any] = Depends(get_current_user)):
    """List patients for the current hospital/doctor"""
    role = current_user.get("role")
    if role in ["super_admin", "admin"]:
        return await patient_repo.find_many({})
    
    hospital_id = current_user.get("hospital_id")
    return await patient_repo.find_many({"hospital_id": hospital_id})

@router.get("/{patient_id}")
async def get_patient(patient_id: str, current_user: Dict[str, Any] = Depends(get_current_user)):
    """Get patient details"""
    patient = await patient_repo.find_one({"_id": patient_id})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Check access (Hospital-level isolation)
    if current_user.get("role") not in ["super_admin", "admin"]:
        if patient.get("hospital_id") != current_user.get("hospital_id"):
            raise HTTPException(status_code=403, detail="Permission denied")
            
    return patient
