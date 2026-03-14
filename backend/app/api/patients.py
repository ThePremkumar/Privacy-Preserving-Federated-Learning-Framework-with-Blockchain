"""
API Router for Patient Management (MongoDB based)
"""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from typing import List, Dict, Any, Optional
from app.core.dependencies import get_current_user, require_role
from app.core.mongodb import patient_repo
from pydantic import BaseModel, Field
from datetime import datetime
import os
import uuid

router = APIRouter(tags=["patients"])

class PatientCreate(BaseModel):
    name: str
    patient_id_manual: Optional[str] = None
    age: int
    gender: str
    phone: Optional[str] = None
    address: Optional[str] = None
    current_symptoms: Optional[str] = None
    diagnosis_notes: Optional[str] = None
    blood_pressure: Optional[str] = None
    sugar_level: Optional[str] = None
    heart_rate: Optional[int] = None
    temperature: Optional[float] = None
    medical_history: List[str] = []

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_patient(patient: PatientCreate, current_user: Dict[str, Any] = Depends(require_role(["doctor"]))):
    """Register a new patient with comprehensive medical data"""
    patient_data = patient.model_dump()
    patient_data["hospital_id"] = current_user.get("hospital_id")
    patient_data["created_by"] = current_user.get("user_id")
    patient_data["reports"] = [] # To store file metadata later
    
    patient_id = await patient_repo.insert_one(patient_data)
    return {"id": patient_id, "message": "Patient registered successfully"}

@router.post("/{patient_id}/upload-report")
async def upload_patient_report(
    patient_id: str, 
    file: UploadFile = File(...),
    current_user: Dict[str, Any] = Depends(require_role(["doctor"]))
):
    """Upload a medical report (PDF/Image) for a specific patient"""
    patient = await patient_repo.find_one({"_id": patient_id})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    if patient.get("hospital_id") != current_user.get("hospital_id"):
        raise HTTPException(status_code=403, detail="Permission denied")

    # Save file logic
    upload_dir = f"data/uploads/reports/{patient_id}"
    os.makedirs(upload_dir, exist_ok=True)
    
    file_id = str(uuid.uuid4())
    file_ext = os.path.splitext(file.filename)[1]
    file_path = f"{upload_dir}/{file_id}{file_ext}"
    
    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)
        
    report_meta = {
        "id": file_id,
        "filename": file.filename,
        "path": file_path,
        "uploaded_at": datetime.utcnow().isoformat(),
        "type": file.content_type
    }
    
    # Update patient record in MongoDB
    reports = patient.get("reports", [])
    reports.append(report_meta)
    
    # Using our mock repo's update (Wait, does it have update? Let's check)
    # Actually I can just re-save it if our mock repo supports it.
    # Looking at mongodb.py, I have find_one and insert_one (which uses self.data[id] = item)
    # So re-inserting with the same _id will update it.
    
    patient["reports"] = reports
    patient_repo.data[patient_id] = patient
    patient_repo._save()
    
    return {"message": "Report uploaded successfully", "report": report_meta}

@router.get("/", response_model=List[Dict[str, Any]])
async def list_patients(current_user: Dict[str, Any] = Depends(require_role(["doctor"]))):
    """List patients for the current hospital/doctor"""
    hospital_id = current_user.get("hospital_id")
    return await patient_repo.find_many({"hospital_id": hospital_id})

@router.get("/{patient_id}")
async def get_patient(patient_id: str, current_user: Dict[str, Any] = Depends(require_role(["doctor"]))):
    """Get patient details"""
    patient = await patient_repo.find_one({"_id": patient_id})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Check access (Hospital-level isolation)
    if patient.get("hospital_id") != current_user.get("hospital_id"):
        raise HTTPException(status_code=403, detail="Permission denied")
            
    return patient
