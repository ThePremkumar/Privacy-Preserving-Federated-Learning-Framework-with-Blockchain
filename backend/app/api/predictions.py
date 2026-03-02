"""
API Router for Healthcare Predictions and NLP Analysis
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any, Optional
from app.core.dependencies import get_current_user, require_role
from app.services.nlp_service import nlp_service
from app.core.mongodb import prediction_repo
from pydantic import BaseModel
import torch
import numpy as np

router = APIRouter(prefix="/predictions", tags=["predictions"])

class AnalysisRequest(BaseModel):
    patient_id: str
    clinical_note: str

@router.post("/analyze-note")
async def analyze_medical_note(request: AnalysisRequest, current_user: Dict[str, Any] = Depends(require_role(["doctor"]))):
    """Perform NLP analysis on a clinical note and store the results"""
    analysis = nlp_service.analyze_medical_note(request.clinical_note)
    
    # Store in MongoDB (Predictions collection)
    record = {
        "patient_id": request.patient_id,
        "doctor_id": current_user.get("user_id"),
        "hospital_id": current_user.get("hospital_id"),
        "type": "nlp_analysis",
        "results": analysis
    }
    
    analysis_id = await prediction_repo.insert_one(record)
    return {"id": analysis_id, "analysis": analysis}

@router.get("/")
async def list_predictions(current_user: Dict[str, Any] = Depends(require_role(["doctor"]))):
    """List all predictions/analyses for the current context"""
    hospital_id = current_user.get("hospital_id")
    return await prediction_repo.find_many({"hospital_id": hospital_id})

@router.get("/anomalies")
async def get_anomalies(current_user: Dict[str, Any] = Depends(require_role(["doctor"]))):
    """Get detected anomalies (outliers)"""
    hospital_id = current_user.get("hospital_id")
    # In a real app, this would filter by type='anomaly' or score threshold
    all_records = await prediction_repo.find_many({"hospital_id": hospital_id})
    # Mocking anomaly filtering for demo
    return [r for r in all_records if r.get("results", {}).get("risk_assessment", {}).get("urgency_score", 0) > 7]
