"""
Doctor Operations API — Expanded with analytics, clinical reports, and patient management
"""

from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
import logging
from datetime import datetime, timedelta
from app.core.dependencies import get_current_user, require_role
from app.core.mongodb import patient_repo, prediction_repo
from app.core.database import SessionLocal
from app.core.logic import calculate_composite_risk
router = APIRouter(tags=["doctor"])

@router.get("/summary")
async def get_doctor_summary(current_user: Dict[str, Any] = Depends(require_role(["doctor", "hospital"]))):
    """
    Get aggregated summary metrics for the doctor's dashboard.
    Includes patient count, record count, anomalies, and performance.
    """
    hospital_id = current_user.get("hospital_id")
    
    # 1. Get from MongoDB (Patients)
    total_patients = await patient_repo.count_documents({"hospital_id": hospital_id})
    all_patients = await patient_repo.find_many({"hospital_id": hospital_id})
    
    # 2. Get from MongoDB (Predictions)
    recent_predictions = await prediction_repo.find_many(
        {"hospital_id": hospital_id},
        limit=5,
        sort=[("timestamp", -1)]
    )
    
    # 3. Calculate Anomaly Count (Risk Score > 7)
    all_preds = await prediction_repo.find_many({"hospital_id": hospital_id})
    anomaly_count = sum(1 for p in all_preds if p.get("results", {}).get("risk_assessment", {}).get("urgency_score", 0) > 7
                        or p.get("results", {}).get("risk_score", 0) > 7.5)
    
    # 4. Get from SQLite (Dataset Uploads)
    db = SessionLocal()
    try:
        total_uploads = db.query(DatasetUpload).filter(DatasetUpload.hospital_id == hospital_id).count()
        latest_job = db.query(TrainingJob).filter(
            TrainingJob.hospital_id == hospital_id, 
            TrainingJob.status == "completed"
        ).order_by(TrainingJob.completed_at.desc()).first()
        
        # 5. Calculate demographics
        gender_dist = {}
        age_groups = {"0-18": 0, "19-35": 0, "36-55": 0, "56-75": 0, "75+": 0}
        risk_dist = {"low": 0, "moderate": 0, "high": 0}
        
        for p in all_patients:
            # Gender
            gender = p.get("gender", "Unknown")
            gender_dist[gender] = gender_dist.get(gender, 0) + 1
            
            # Age groups
            age = p.get("age", 0)
            if age <= 18:
                age_groups["0-18"] += 1
            elif age <= 35:
                age_groups["19-35"] += 1
            elif age <= 55:
                age_groups["36-55"] += 1
            elif age <= 75:
                age_groups["56-75"] += 1
            else:
                age_groups["75+"] += 1
            
            # Unified Risk Assessment
            history = p.get("medical_history", [])
            # Find latest prediction for this patient to factor into summary risk
            patient_preds = [pr for pr in all_preds if pr.get("patient_id") == str(p.get("_id"))]
            latest_ai_score = patient_preds[0].get("results", {}).get("risk_score") if patient_preds else None
            
            risk_info = calculate_composite_risk(history, latest_ai_score)
            risk_dist[risk_info["level"].lower()] += 1
        
        # 6. Prediction type breakdown
        pred_types = {}
        for pred in all_preds:
            ptype = pred.get("type", "unknown")
            pred_types[ptype] = pred_types.get(ptype, 0) + 1
        
        # 7. Patient registration trend (last 6 months)
        from dateutil.relativedelta import relativedelta
        import calendar
        
        patient_trend = []
        today = datetime.utcnow()
        for i in range(5, -1, -1):
            target_month = today - relativedelta(months=i)
            month_name = calendar.month_abbr[target_month.month]
            
            # Count patients created in this month
            count = 0
            for p in all_patients:
                created_str = p.get("created_at")
                if created_str:
                    try:
                        dt = datetime.fromisoformat(created_str)
                        if dt.year == target_month.year and dt.month == target_month.month:
                            count += 1
                    except ValueError:
                        pass
            
            patient_trend.append({"month": month_name, "patients": count})

        recent_patients_data = []
        for p in recent_patients:
            history = p.get("medical_history", [])
            patient_preds = [pr for pr in all_preds if pr.get("patient_id") == str(p.get("_id"))]
            latest_ai_score = patient_preds[0].get("results", {}).get("risk_score") if patient_preds else None
            risk_info = calculate_composite_risk(history, latest_ai_score)
            
            recent_patients_data.append({
                "id": str(p.get("_id")),
                "name": p.get("name"),
                "age": p.get("age"),
                "gender": p.get("gender"),
                "risk": risk_info["level"],
                "symptoms": p.get("current_symptoms", "")
            })
        
        return {
            "total_patients": total_patients,
            "total_uploads": total_uploads,
            "anomaly_count": anomaly_count,
            "active_predictions": len(all_preds),
            "total_reports": sum(len(p.get("reports", [])) for p in all_patients),
            "latest_accuracy": latest_job.accuracy if latest_job else "0.00",
            "gender_distribution": gender_dist,
            "age_groups": age_groups,
            "risk_distribution": risk_dist,
            "prediction_types": pred_types,
            "patient_trend": patient_trend,
            "recent_patients": recent_patients_data,
            "recent_activity": [
                {
                    "id": str(p.get("_id")),
                    "type": p.get("type"),
                    "patient_id": p.get("patient_id"),
                    "patient_name": p.get("patient_name", ""),
                    "timestamp": p.get("timestamp", datetime.utcnow().isoformat()),
                    "prediction": p.get("results", {}).get("prediction", ""),
                    "risk_score": p.get("results", {}).get("risk_score", 0)
                } for p in recent_predictions
            ]
        }
    finally:
        db.close()

@router.get("/patients")
async def get_doctor_patients(current_user: Dict[str, Any] = Depends(require_role(["doctor", "hospital"]))):
    """List all patients assigned to the doctor's facility"""
    hospital_id = current_user.get("hospital_id")
    patients = await patient_repo.find_many({"hospital_id": hospital_id})
    return patients

@router.get("/hospital-doctors")
async def get_hospital_doctors(current_user: Dict[str, Any] = Depends(require_role(["doctor", "hospital", "admin", "super_admin"]))):
    """List all doctors in the current hospital."""
    hospital_id = current_user.get("hospital_id")
    if not hospital_id:
        raise HTTPException(status_code=400, detail="Hospital ID not found in session")
    
    db = SessionLocal()
    try:
        from app.core.db_models import User
        doctors = db.query(User).filter(
            User.hospital_id == hospital_id,
            User.role == "doctor"
        ).all()
        return [
            {
                "id": d.id,
                "name": d.username,
                "username": d.username,
                "department_id": d.department_id,
            } for d in doctors
        ]
    finally:
        db.close()

# New: List all doctors (admin/super_admin access)
@router.get("/doctors")
async def list_doctors(limit: int = 100, offset: int = 0, current_user: Dict[str, Any] = Depends(require_role(["admin", "super_admin"]))):
    """Retrieve paginated list of all doctors across hospitals."""
    from app.core.dependencies import auth_service
    result = auth_service.get_all_doctors(limit=limit, offset=offset)
    return result

# New: Get doctor details by user ID
@router.get("/doctors/{doctor_id}")
async def get_doctor_detail(doctor_id: str, current_user: Dict[str, Any] = Depends(require_role(["admin", "super_admin"]))):
    """Fetch a specific doctor's profile and assigned hospital."""
    from app.core.dependencies import auth_service
    doctor = auth_service.get_user_by_id(doctor_id)
    if not doctor or doctor.role != UserRole.DOCTOR:
        raise HTTPException(status_code=404, detail="Doctor not found")
    return doctor

# New: Deactivate a doctor (admin/super_admin)
@router.delete("/doctors/{doctor_id}")
async def deactivate_doctor(doctor_id: str, current_user: Dict[str, Any] = Depends(require_role(["admin", "super_admin"]))):
    """Deactivate a doctor account."""
    from app.core.dependencies import auth_service
    # Retrieve username via user ID
    doctor = auth_service.get_user_by_id(doctor_id)
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    success = auth_service.deactivate_user(doctor.username)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to deactivate")
    return {"status": "deactivated"}



@router.get("/patient/{patient_id}/timeline")
async def get_patient_timeline(patient_id: str, current_user: Dict[str, Any] = Depends(require_role(["doctor", "hospital"]))):
    """Get complete patient timeline including predictions, reports, and notes"""
    hospital_id = current_user.get("hospital_id")
    
    patient = await patient_repo.find_one({"_id": patient_id})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    if patient.get("hospital_id") != hospital_id:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    # Get all predictions for this patient
    all_preds = await prediction_repo.find_many({"hospital_id": hospital_id})
    patient_preds = [p for p in all_preds if p.get("patient_id") == patient_id]
    
    # Build timeline
    timeline = []
    
    # Patient registration event
    timeline.append({
        "type": "registration",
        "title": "Patient Registered",
        "description": f"{patient.get('name')} was registered in the system",
        "timestamp": patient.get("created_at", datetime.utcnow().isoformat()),
        "icon": "user_plus"
    })
    
    # Reports
    for report in patient.get("reports", []):
        timeline.append({
            "type": "report",
            "title": f"Report Uploaded: {report.get('filename', 'Document')}",
            "description": f"File type: {report.get('type', 'Unknown')}",
            "timestamp": report.get("uploaded_at", datetime.utcnow().isoformat()),
            "icon": "file",
            "metadata": report
        })
    
    # Predictions
    for pred in patient_preds:
        pred_type = pred.get("type", "unknown")
        results = pred.get("results", {})
        if pred_type == "ai_prediction":
            timeline.append({
                "type": "prediction",
                "title": f"AI Prediction: {results.get('prediction', 'N/A')}",
                "description": f"Risk Score: {results.get('risk_score', 0)} | Confidence: {results.get('confidence', 0)}%",
                "timestamp": pred.get("timestamp", datetime.utcnow().isoformat()),
                "icon": "brain",
                "metadata": results
            })
        elif pred_type == "nlp_analysis":
            timeline.append({
                "type": "nlp",
                "title": "NLP Clinical Note Analysis",
                "description": f"Urgency: {results.get('urgency', 'N/A')}",
                "timestamp": pred.get("timestamp", datetime.utcnow().isoformat()),
                "icon": "file_search",
                "metadata": results
            })
    
    # Sort by timestamp descending
    timeline.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
    
    return {
        "patient": patient,
        "timeline": timeline,
        "prediction_count": len(patient_preds),
        "report_count": len(patient.get("reports", [])),
    }


@router.post("/clinical-report/{patient_id}")
async def generate_clinical_report(patient_id: str, current_user: Dict[str, Any] = Depends(require_role(["doctor", "hospital"]))):
    """Generate a comprehensive AI-enhanced clinical report for a patient"""
    hospital_id = current_user.get("hospital_id")
    
    patient = await patient_repo.find_one({"_id": patient_id})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    if patient.get("hospital_id") != hospital_id:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    # Gather prediction history
    all_preds = await prediction_repo.find_many({"hospital_id": hospital_id})
    patient_preds = [p for p in all_preds if p.get("patient_id") == patient_id]
    
    # Build structured report
    ai_predictions = [p for p in patient_preds if p.get("type") == "ai_prediction"]
    nlp_analyses = [p for p in patient_preds if p.get("type") == "nlp_analysis"]
    
    # Calculate overall risk (Hybrid: AI + History)
    risk_scores = [p.get("results", {}).get("risk_score", 0) for p in ai_predictions]
    ai_risk = sum(risk_scores) / len(risk_scores) if risk_scores else None
    
    risk_info = calculate_composite_risk(patient.get("medical_history", []), ai_risk)
    risk_level = risk_info["level"]
    avg_risk = risk_info["score"]
    
    # Build AI summary
    conditions = list(set([p.get("results", {}).get("prediction", "") for p in ai_predictions if p.get("results", {}).get("prediction")]))
    
    report = {
        "report_id": f"CR-{patient_id[:8].upper()}-{datetime.utcnow().strftime('%Y%m%d')}",
        "generated_at": datetime.utcnow().isoformat(),
        "generated_by": current_user.get("user_id"),
        "patient": {
            "id": patient_id,
            "name": patient.get("name"),
            "age": patient.get("age"),
            "gender": patient.get("gender"),
            "blood_pressure": patient.get("blood_pressure", "N/A"),
            "sugar_level": patient.get("sugar_level", "N/A"),
            "heart_rate": patient.get("heart_rate", "N/A"),
            "temperature": patient.get("temperature", "N/A"),
            "symptoms": patient.get("current_symptoms", "None reported"),
            "medical_history": patient.get("medical_history", []),
            "diagnosis_notes": patient.get("diagnosis_notes", "")
        },
        "ai_analysis": {
            "total_predictions": len(ai_predictions),
            "total_nlp_analyses": len(nlp_analyses),
            "average_risk_score": round(avg_risk, 2),
            "risk_level": risk_level,
            "detected_conditions": conditions,
            "latest_prediction": ai_predictions[0].get("results", {}) if ai_predictions else None,
        },
        "clinical_summary": (
            f"Patient {patient.get('name')}, {patient.get('age')} years old ({patient.get('gender')}). "
            f"Medical history includes: {', '.join(patient.get('medical_history', [])) or 'None recorded'}. "
            f"Current symptoms: {patient.get('current_symptoms', 'None reported')}. "
            f"AI Risk Assessment: {risk_level} (avg score: {round(avg_risk, 2)}/10). "
            f"{'AI has detected potential conditions: ' + ', '.join(conditions) + '. ' if conditions else ''}"
            f"Total of {len(patient.get('reports', []))} medical reports on file. "
            f"Diagnosis notes: {patient.get('diagnosis_notes', 'None')}"
        ),
        "recommendations": _generate_recommendations(patient, avg_risk, conditions),
        "attached_reports": len(patient.get("reports", [])),
    }
    
    return report


def _generate_recommendations(patient: Dict, avg_risk: float, conditions: list) -> list:
    """Generate AI-based clinical recommendations"""
    recs = []
    
    # Risk-based recommendations
    if avg_risk > 7:
        recs.append({
            "priority": "CRITICAL",
            "text": "Immediate specialist referral recommended due to high risk score",
            "category": "referral"
        })
    elif avg_risk > 4:
        recs.append({
            "priority": "MODERATE",
            "text": "Schedule follow-up appointment within 2 weeks",
            "category": "follow_up"
        })
    
    # Vitals-based recommendations
    bp = patient.get("blood_pressure", "")
    if bp:
        try:
            systolic = int(bp.split("/")[0])
            if systolic > 140:
                recs.append({
                    "priority": "HIGH",
                    "text": "Elevated blood pressure detected. Consider antihypertensive therapy review",
                    "category": "vitals"
                })
        except (ValueError, IndexError):
            pass
    
    heart_rate = patient.get("heart_rate")
    if heart_rate and (heart_rate > 100 or heart_rate < 60):
        recs.append({
            "priority": "MODERATE",
            "text": f"Abnormal heart rate ({heart_rate} BPM). ECG monitoring recommended",
            "category": "vitals"
        })
    
    temperature = patient.get("temperature")
    if temperature and temperature > 38.0:
        recs.append({
            "priority": "HIGH",
            "text": f"Fever detected ({temperature}°C). Infection screening recommended",
            "category": "vitals"
        })
    
    # Condition-based
    for condition in conditions:
        recs.append({
            "priority": "MODERATE",
            "text": f"AI model detected '{condition}' — confirm with diagnostic tests",
            "category": "diagnosis"
        })
    
    # History-based
    history = patient.get("medical_history", [])
    if len(history) > 3:
        recs.append({
            "priority": "LOW",
            "text": "Complex medical history. Comprehensive annual review recommended",
            "category": "preventive"
        })
    
    if not recs:
        recs.append({
            "priority": "LOW",
            "text": "No immediate concerns. Continue routine monitoring",
            "category": "routine"
        })
    
    return recs
