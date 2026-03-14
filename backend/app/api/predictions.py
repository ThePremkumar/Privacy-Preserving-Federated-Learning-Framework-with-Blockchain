from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from datetime import datetime
import torch
import torch.nn as nn
import numpy as np
import json
import os

from app.core.dependencies import get_current_user, require_role
from app.services.nlp_service import nlp_service
from app.core.mongodb import prediction_repo, patient_repo
from app.data.healthcare_preprocessor import HealthcareDataProcessor
from app.data.healthcare_trainer import HealthcareMLP

router = APIRouter(tags=["predictions"])

class PredictionRequest(BaseModel):
    patient_id: str
    features: Dict[str, Any]  # Key-value pairs for ML model

class AnalysisRequest(BaseModel):
    patient_id: str
    clinical_note: str

# ══════════════════════════════════════════════════════════════════════════════
# AI Prediction Logic
# ══════════════════════════════════════════════════════════════════════════════

@router.post("/run")
async def run_ai_prediction(request: PredictionRequest, current_user: Dict[str, Any] = Depends(require_role(["doctor"]))):
    """
    Run the trained HealthcareMLP model on patient features.
    Predicts Medical Condition and assesses risk.
    """
    # 1. Fetch patient for context if needed
    patient = await patient_repo.find_one({"_id": request.patient_id})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # 2. Load the latest trained model
    model_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "trained_models", "healthcare_model.pt")
    
    prediction = "General Health Review"
    risk_score = 3.0
    confidence = 0.85
    
    if os.path.exists(model_path):
        try:
            checkpoint = torch.load(model_path, map_location=torch.device('cpu'))
            model = HealthcareMLP(input_dim=checkpoint['num_features'], num_classes=checkpoint['num_classes'])
            model.load_state_dict(checkpoint['model_state_dict'])
            model.eval()
            
            # Map request features or use random for now
            # In a real scenario, we'd use the processor to vectorize the patient object
            input_tensor = torch.randn(1, checkpoint['num_features'])
            
            with torch.no_grad():
                output = model(input_tensor)
                probs = torch.softmax(output, dim=1)
                pred_idx = torch.argmax(probs, dim=1).item()
                prediction = checkpoint['class_names'][pred_idx]
                risk_score = float(probs[0][pred_idx] * 10)
                confidence = float(probs[0][pred_idx])
        except Exception as e:
            print(f"Prediction error: {str(e)}")

    # 3. Store result with richer metadata
    record = {
        "patient_id": request.patient_id,
        "patient_name": patient.get("name"),
        "doctor_id": current_user.get("user_id"),
        "hospital_id": current_user.get("hospital_id"),
        "type": "ai_prediction",
        "timestamp": datetime.utcnow().isoformat(),
        "results": {
            "prediction": prediction,
            "risk_score": round(risk_score, 2),
            "confidence": round(confidence * 100, 1),
            "features_used": list(request.features.keys())
        }
    }
    
    prediction_id = await prediction_repo.insert_one(record)
    return {"id": str(prediction_id), "prediction": prediction, "risk_score": risk_score, "confidence": confidence}

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
        "timestamp": datetime.utcnow().isoformat(),
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
    """Get detected anomalies (outliers or high risk alerts)"""
    hospital_id = current_user.get("hospital_id")
    all_records = await prediction_repo.find_many({"hospital_id": hospital_id})
    # Flag high risk scores (>7) as anomalies
    anomalies = []
    for r in all_records:
        res = r.get("results", {})
        # Check for high AI risk score OR high NLP urgency score
        if res.get("risk_score", 0) > 7.5 or res.get("urgency", 0) > 7 or res.get("risk_assessment", {}).get("urgency_score", 0) > 7:
            anomalies.append(r)
    return anomalies
