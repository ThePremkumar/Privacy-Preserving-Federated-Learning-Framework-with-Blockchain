"""
Doctor Operations API
"""

from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
import logging
from datetime import datetime # Added for datetime.utcnow()
from datetime import datetime
from app.core.dependencies import get_current_user, require_role
from app.core.mongodb import patient_repo, prediction_repo
from app.core.database import SessionLocal
from app.core.db_models import DatasetUpload, TrainingJob

router = APIRouter(tags=["doctor"])

@router.get("/summary")
async def get_doctor_summary(current_user: Dict[str, Any] = Depends(require_role(["doctor"]))):
    """
    Get aggregated summary metrics for the doctor's dashboard.
    Includes patient count, record count, anomalies, and performance.
    """
    hospital_id = current_user.get("hospital_id")
    
    # 1. Get from MongoDB (Patients)
    total_patients = await patient_repo.count_documents({"hospital_id": hospital_id})
    
    # 2. Get from MongoDB (Recent Predictions/Analyses)
    recent_predictions = await prediction_repo.find_many(
        {"hospital_id": hospital_id},
        limit=5,
        sort=[("timestamp", -1)]
    )
    
    # 3. Calculate Anomaly Count (Risk Score > 7)
    all_preds = await prediction_repo.find_many({"hospital_id": hospital_id})
    anomaly_count = sum(1 for p in all_preds if p.get("results", {}).get("risk_assessment", {}).get("urgency_score", 0) > 7)
    
    # 4. Get from SQLite (Dataset Uploads)
    db = SessionLocal()
    try:
        total_uploads = db.query(DatasetUpload).filter(DatasetUpload.hospital_id == hospital_id).count()
        latest_job = db.query(TrainingJob).filter(
            TrainingJob.hospital_id == hospital_id, 
            TrainingJob.status == "completed"
        ).order_by(TrainingJob.completed_at.desc()).first()
        
        return {
            "total_patients": total_patients,
            "total_uploads": total_uploads,
            "anomaly_count": anomaly_count,
            "active_predictions": len(recent_predictions),
            "latest_accuracy": latest_job.accuracy if latest_job else "0.00",
            "recent_activity": [
                {
                    "id": str(p.get("_id")),
                    "type": p.get("type"),
                    "patient_id": p.get("patient_id"),
                    "timestamp": p.get("timestamp", datetime.utcnow().isoformat())
                } for p in recent_predictions
            ]
        }
    finally:
        db.close()

@router.get("/patients")
async def get_doctor_patients(current_user: Dict[str, Any] = Depends(require_role(["doctor"]))):
    """List all patients assigned to the doctor's facility"""
    hospital_id = current_user.get("hospital_id")
    patients = await patient_repo.find_many({"hospital_id": hospital_id})
    return patients
