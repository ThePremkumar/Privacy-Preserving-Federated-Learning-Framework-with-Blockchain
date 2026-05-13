"""
API Router for Patient Management (MongoDB based)
Expanded with update, delete, and search endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query
from typing import List, Dict, Any, Optional
from app.core.dependencies import get_current_user, require_role
from app.core.mongodb import patient_repo
from app.core.database import SessionLocal, get_db
from app.core.db_models import User, UserRole, Notification, AuditLog, PatientReferralReview
from pydantic import BaseModel, Field
from datetime import datetime
import os
import uuid
import hashlib
import json
import time
from app.services.blockchain.audit_service import ClinicalRecord
from app.core.logic import calculate_composite_risk
from app.core.mongodb import prediction_repo

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

class PatientUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    current_symptoms: Optional[str] = None
    diagnosis_notes: Optional[str] = None
    blood_pressure: Optional[str] = None
    sugar_level: Optional[str] = None
    heart_rate: Optional[int] = None
    temperature: Optional[float] = None
    medical_history: Optional[List[str]] = None

class NoteRequest(BaseModel):
    note: Optional[str] = ""

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_patient(patient: PatientCreate, current_user: Dict[str, Any] = Depends(require_role(["doctor", "hospital"]))):
    """Register a new patient with comprehensive medical data"""
    patient_data = patient.model_dump()
    patient_data["hospital_id"] = current_user.get("hospital_id")
    patient_data["created_by"] = current_user.get("user_id")
    patient_data["created_at"] = datetime.utcnow().isoformat()
    patient_data["updated_at"] = datetime.utcnow().isoformat()
    patient_data["status"] = "active"
    patient_data["reports"] = []
    
    patient_id = await patient_repo.insert_one(patient_data)
    
    # Log to Blockchain
    try:
        record = ClinicalRecord(
            record_id=f"REG-{patient_id[:8].upper()}",
            hospital_id=current_user.get("hospital_id"),
            patient_id=patient_id,
            action="registration",
            data_hash=hashlib.sha256(json.dumps(patient_data, default=str).encode()).hexdigest(),
            timestamp=int(time.time()),
            metadata={"name": patient.name, "created_by": current_user.get("username")}
        )
        blockchain_service.log_clinical_record(record)
    except Exception as e:
        print(f"Blockchain logging failed: {e}")

    return {"id": patient_id, "message": "Patient registered successfully"}

@router.patch("/{patient_id}")
async def update_patient(
    patient_id: str, 
    updates: PatientUpdate, 
    current_user: Dict[str, Any] = Depends(require_role(["doctor", "hospital"]))
):
    """Update an existing patient record"""
    patient = await patient_repo.find_one({"_id": patient_id})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    if patient.get("hospital_id") != current_user.get("hospital_id"):
        raise HTTPException(status_code=403, detail="Permission denied")
    
    # Apply only non-None updates
    update_data = {k: v for k, v in updates.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    update_data["updated_at"] = datetime.utcnow().isoformat()
    update_data["updated_by"] = current_user.get("user_id")
    
    # Merge updates into existing patient
    for key, value in update_data.items():
        patient[key] = value
    
    patient_repo.data[patient_id] = patient
    patient_repo._save()
    
    # Log to Blockchain
    try:
        record = ClinicalRecord(
            record_id=f"UPD-{patient_id[:8].upper()}-{int(time.time())}",
            hospital_id=current_user.get("hospital_id"),
            patient_id=patient_id,
            action="update",
            data_hash=hashlib.sha256(json.dumps(update_data, default=str).encode()).hexdigest(),
            timestamp=int(time.time()),
            metadata={"updated_fields": list(update_data.keys()), "updated_by": current_user.get("username")}
        )
        blockchain_service.log_clinical_record(record)
    except Exception as e:
        print(f"Blockchain logging failed: {e}")
    
    return {"message": "Patient updated successfully", "updated_fields": list(update_data.keys())}

@router.delete("/{patient_id}")
async def delete_patient(
    patient_id: str, 
    current_user: Dict[str, Any] = Depends(require_role(["doctor", "hospital"]))
):
    """Soft-delete a patient record (marks as inactive)"""
    patient = await patient_repo.find_one({"_id": patient_id})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    if patient.get("hospital_id") != current_user.get("hospital_id"):
        raise HTTPException(status_code=403, detail="Permission denied")
    
    # Soft delete — mark as inactive with audit trail
    patient["status"] = "deleted"
    patient["deleted_at"] = datetime.utcnow().isoformat()
    patient["deleted_by"] = current_user.get("user_id")
    
    patient_repo.data[patient_id] = patient
    patient_repo._save()
    
    return {"message": "Patient record deleted successfully"}

@router.post("/{patient_id}/upload-report")
async def upload_patient_report(
    patient_id: str, 
    file: UploadFile = File(...),
    current_user: Dict[str, Any] = Depends(require_role(["doctor", "hospital"]))
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
        "uploaded_by": current_user.get("user_id"),
        "type": file.content_type
    }
    
    # Update patient record in MongoDB
    reports = patient.get("reports", [])
    reports.append(report_meta)
    
    patient["reports"] = reports
    patient_repo.data[patient_id] = patient
    patient_repo._save()
    
    # Log to Blockchain
    try:
        record = ClinicalRecord(
            record_id=f"REP-{file_id[:8].upper()}",
            hospital_id=current_user.get("hospital_id"),
            patient_id=patient_id,
            action="report_upload",
            data_hash=hashlib.sha256(content).hexdigest(),
            timestamp=int(time.time()),
            metadata={"filename": file.filename, "type": file.content_type}
        )
        blockchain_service.log_clinical_record(record)
    except Exception as e:
        print(f"Blockchain logging failed: {e}")
    
    return {"message": "Report uploaded successfully", "report": report_meta}

@router.get("/", response_model=List[Dict[str, Any]])
async def list_patients(
    department_id: Optional[int] = Query(None),
    current_user: Dict[str, Any] = Depends(require_role(["doctor", "hospital"]))
):
    """List active patients for the current hospital/doctor. Optionally filter by department."""
    hospital_id = current_user.get("hospital_id")
    
    # If department_id is provided, we need to filter by doctors in that department
    filter_criteria = {"hospital_id": hospital_id}
    
    if department_id:
        db = SessionLocal()
        try:
            # Find all doctors in this department
            doctors = db.query(User).filter(
                User.hospital_id == hospital_id,
                User.department_id == department_id
            ).all()
            doctor_ids = [d.id for d in doctors]
            
            # MongoDB simulation find_many doesn't support $in easily in our mock
            # so we'll fetch all and filter manually for simplicity in this mock repo
            all_patients = await patient_repo.find_many({"hospital_id": hospital_id})
            results = [p for p in all_patients if p.get("created_by") in doctor_ids and p.get("status", "active") != "deleted"]
            return results
        finally:
            db.close()
    
    # Default: show all patients for hospital
    all_patients = await patient_repo.find_many({"hospital_id": hospital_id})
    all_preds = await prediction_repo.find_many({"hospital_id": hospital_id})
    
    results = []
    for p in all_patients:
        if p.get("status", "active") == "deleted":
            continue
            
        # Add composite risk info
        patient_preds = [pr for pr in all_preds if pr.get("patient_id") == str(p.get("_id"))]
        latest_ai_score = patient_preds[0].get("results", {}).get("risk_score") if patient_preds else None
        
        p["clinical_risk"] = calculate_composite_risk(p.get("medical_history", []), latest_ai_score)
        results.append(p)
        
    return results

class ReviewSubmit(BaseModel):
    status: str
    admin_notes: str
    priority: str

@router.get("/referrals")
async def get_referrals(
    status: Optional[str] = Query(None),
    unread: Optional[bool] = Query(None),
    current_user: Dict[str, Any] = Depends(require_role(["hospital"]))
):
    """Get all patient referrals sent to this hospital admin"""
    db = SessionLocal()
    try:
        query = db.query(PatientReferralReview).join(
            Notification, PatientReferralReview.notification_id == Notification.id
        ).filter(
            Notification.user_id == current_user.get("user_id")
        )
        
        if status:
            query = query.filter(PatientReferralReview.status == status)
        if unread is not None:
            query = query.filter(Notification.is_read == (not unread if not unread else False))
            
        referrals = query.all()
        result = []
        for ref in referrals:
            patient = await patient_repo.find_one({"_id": ref.patient_id})
            doctor = db.query(User).filter(User.id == ref.sent_by).first()
            
            result.append({
                "id": ref.id,
                "notification_id": ref.notification_id,
                "status": ref.status,
                "admin_notes": ref.admin_notes,
                "priority": ref.priority,
                "created_at": ref.created_at.isoformat() if ref.created_at else None,
                "patient": patient,
                "sending_doctor": {"name": doctor.username if doctor else "Unknown"},
                "notification": {
                    "is_read": ref.notification.is_read if ref.notification else False,
                    "message": ref.notification.message if ref.notification else ""
                }
            })
        return result
    finally:
        db.close()

@router.get("/referrals/{referral_id}")
async def get_referral(
    referral_id: str,
    current_user: Dict[str, Any] = Depends(require_role(["hospital"]))
):
    db = SessionLocal()
    try:
        ref = db.query(PatientReferralReview).filter(PatientReferralReview.id == referral_id).first()
        if not ref:
            raise HTTPException(status_code=404, detail="Referral not found")
        
        patient = await patient_repo.find_one({"_id": ref.patient_id})
        doctor = db.query(User).filter(User.id == ref.sent_by).first()
        
        return {
            "id": ref.id,
            "status": ref.status,
            "admin_notes": ref.admin_notes,
            "priority": ref.priority,
            "created_at": ref.created_at.isoformat() if ref.created_at else None,
            "patient": patient,
            "sending_doctor": {"name": doctor.username if doctor else "Unknown"},
            "notification": {
                "message": ref.notification.meta_data.get('note', '') if ref.notification and ref.notification.meta_data else ''
            }
        }
    finally:
        db.close()

@router.post("/referrals/{referral_id}/review")
async def submit_referral_review(
    referral_id: str,
    review: ReviewSubmit,
    current_user: Dict[str, Any] = Depends(require_role(["hospital"]))
):
    db = SessionLocal()
    try:
        ref = db.query(PatientReferralReview).filter(PatientReferralReview.id == referral_id).first()
        if not ref:
            raise HTTPException(status_code=404, detail="Referral not found")
            
        ref.status = review.status
        ref.admin_notes = review.admin_notes
        ref.priority = review.priority
        ref.reviewed_by = current_user.get("user_id")
        ref.reviewed_at = datetime.utcnow()
        
        # Create notification for doctor
        patient = await patient_repo.find_one({"_id": ref.patient_id})
        doctor_notification = Notification(
            user_id=ref.sent_by,
            type="referral_reviewed",
            title=f"Referral Reviewed: {patient.get('name') if patient else 'Patient'}",
            message=f"Admin reviewed your referral. Note: {review.admin_notes} | Priority: {review.priority.capitalize()}",
            meta_data={"referral_id": referral_id, "patient_id": ref.patient_id}
        )
        db.add(doctor_notification)
        db.commit()
        return {"success": True}
    finally:
        db.close()

@router.patch("/referrals/{referral_id}/read")
async def mark_referral_read(
    referral_id: str,
    current_user: Dict[str, Any] = Depends(require_role(["hospital"]))
):
    db = SessionLocal()
    try:
        ref = db.query(PatientReferralReview).filter(PatientReferralReview.id == referral_id).first()
        if not ref:
            raise HTTPException(status_code=404, detail="Referral not found")
            
        if ref.notification:
            ref.notification.is_read = True
            db.commit()
        return {"success": True}
    finally:
        db.close()
@router.get("/{patient_id}")
async def get_patient(patient_id: str, current_user: Dict[str, Any] = Depends(require_role(["doctor", "hospital"]))):
    """Get patient details"""
    patient = await patient_repo.find_one({"_id": patient_id})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Check access (Hospital-level isolation)
    if patient.get("hospital_id") != current_user.get("hospital_id"):
        raise HTTPException(status_code=403, detail="Permission denied")
            
    return patient

@router.post("/{patient_id}/send-to-admin")
async def send_to_admin(
    patient_id: str,
    note_request: NoteRequest,
    current_user: Dict[str, Any] = Depends(require_role(["doctor"]))
):
    """Send patient details to hospital admin for review"""
    # 1. Verify patient exists and belongs to doctor's hospital
    patient = await patient_repo.find_one({"_id": patient_id})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    hospital_id = current_user.get("hospital_id")
    if patient.get("hospital_id") != hospital_id:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    # 2. Find the hospital's admin
    db = SessionLocal()
    try:
        admin_user = db.query(User).filter(
            User.hospital_id == hospital_id,
            User.role == UserRole.HOSPITAL,
            User.is_active == True
        ).first()
        
        if not admin_user:
            raise HTTPException(status_code=404, detail="Hospital admin not found")
        
        # 3. Create Audit Log
        audit = AuditLog(
            user_id=current_user.get("user_id"),
            action="patient_details_sent",
            resource=f"patient:{patient_id}",
            details={
                "sent_to": admin_user.email,
                "note": note_request.note,
                "patient_name": patient.get("name")
            }
        )
        db.add(audit)
        
        # 4. Create Notification
        notification = Notification(
            user_id=admin_user.id,
            type="patient_referral",
            title=f"Patient referral from Dr. {current_user.get('username')}",
            message=f"Patient {patient.get('name')} (ID: {patient.get('patient_id_manual') or patient_id}) details shared. Note: {note_request.note}",
            meta_data={
                "patient_id": patient_id,
                "sent_by": current_user.get("user_id"),
                "note": note_request.note
            }
        )
        db.add(notification)
        db.flush()
        
        # 5. Create Patient Referral Review
        referral = PatientReferralReview(
            notification_id=notification.id,
            patient_id=patient_id,
            sent_by=current_user.get("user_id"),
            status="pending",
            priority="normal"
        )
        db.add(referral)
        db.commit()
        
        return {
            "success": True,
            "sent_to": admin_user.email,
            "sent_at": datetime.utcnow().isoformat(),
            "patient_id": patient_id
        }
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()


