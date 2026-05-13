
import asyncio
import json
import os
import random
import uuid
from datetime import datetime, timedelta

# Setup absolute paths for the mock MongoDB
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PATIENTS_JSON = os.path.join(BASE_DIR, "data", "mongodb", "patients.json")
PREDICTIONS_JSON = os.path.join(BASE_DIR, "data", "mongodb", "predictions.json")

RISK_MAPPING = {
    "High Risk": {
        "symptoms": ["Acute chest pain", "Severe shortness of breath", "Constant dizziness", "Palpitations"],
        "bp": (160, 185),
        "sugar": (220, 310),
        "ai_score": (0.85, 0.98),
        "urgency": (8, 10)
    },
    "Moderate Risk": {
        "symptoms": ["Persistent dry cough", "Recurrent fatigue", "Mild abdominal pain", "Occasional headache"],
        "bp": (135, 155),
        "sugar": (140, 195),
        "ai_score": (0.45, 0.75),
        "urgency": (5, 7)
    },
    "Normal Risk": {
        "symptoms": ["Slight throat irritation", "Seasonal allergies", "General checkup request"],
        "bp": (115, 128),
        "sugar": (90, 135),
        "ai_score": (0.15, 0.40),
        "urgency": (2, 4)
    },
    "Low Risk": {
        "symptoms": ["None reported", "Routine screening", "Follow-up visit"],
        "bp": (110, 122),
        "sugar": (75, 110),
        "ai_score": (0.05, 0.20),
        "urgency": (1, 2)
    }
}

async def sync_history():
    print(f"Synchronizing Patient Records with AI Prediction History...")
    
    if not os.path.exists(PATIENTS_JSON):
        print(f"Error: {PATIENTS_JSON} not found.")
        return

    # Load Patients
    with open(PATIENTS_JSON, "r") as f:
        patients = json.load(f)

    # Initialize/Load Predictions
    predictions = {}
    if os.path.exists(PREDICTIONS_JSON):
        with open(PREDICTIONS_JSON, "r") as f:
            try:
                predictions = json.load(f)
            except:
                predictions = {}

    total_patients = len(patients)
    print(f"Processing {total_patients} patients...")

    categories = list(RISK_MAPPING.keys())
    
    for pid, p in patients.items():
        # 1. Select a random risk category
        cat_name = random.choice(categories)
        profile = RISK_MAPPING[cat_name]
        
        # 2. Update Patient Clinical Data
        p["current_symptoms"] = random.choice(profile["symptoms"])
        p["blood_pressure"] = f"{random.randint(*profile['bp'])}/{random.randint(85, 105)}"
        p["sugar_level"] = str(random.randint(*profile["sugar"]))
        p["diagnosis_notes"] = f"AI Risk Assessment: {cat_name}. Symptoms updated based on predictive analysis."
        p["updated_at"] = datetime.utcnow().isoformat()
        
        # 3. Create a matching AI Prediction Record
        pred_id = str(uuid.uuid4())
        timestamp = (datetime.utcnow() - timedelta(hours=random.randint(1, 48))).isoformat()
        
        # We'll add both an NLP analysis and a Risk Prediction record
        risk_score = round(random.uniform(*profile["ai_score"]), 2)
        urgency = random.randint(*profile["urgency"])
        
        # NLP Analysis Result
        nlp_record = {
            "_id": pred_id,
            "patient_id": pid,
            "patient_name": p.get("name"),
            "doctor_id": p.get("created_by"),
            "hospital_id": p.get("hospital_id"),
            "type": "nlp_analysis",
            "timestamp": timestamp,
            "results": {
                "symptoms": [p["current_symptoms"]],
                "clinical_entities": ["Hypertension" if "High" in cat_name else "Observation"],
                "sentiment": "NEGATIVE/DETERIORATING" if "High" in cat_name else "NEUTRAL/STABLE",
                "risk_assessment": {
                    "is_emergency": "High" in cat_name,
                    "urgency_score": urgency,
                    "risk_level": cat_name.split()[0] # High, Moderate, etc
                },
                "summary": f"Clinical assessment for {p.get('name')}: Detected symptoms: {p['current_symptoms']}. Patient status is consistent with {cat_name}."
            }
        }
        
        predictions[pred_id] = nlp_record

    # Save Patients
    with open(PATIENTS_JSON, "w") as f:
        json.dump(patients, f, indent=4)
        
    # Save Predictions
    with open(PREDICTIONS_JSON, "w") as f:
        json.dump(predictions, f, indent=4)
    
    print(f"Sync complete. Updated {total_patients} patients and generated corresponding AI Prediction history.")

if __name__ == "__main__":
    asyncio.run(sync_history())
