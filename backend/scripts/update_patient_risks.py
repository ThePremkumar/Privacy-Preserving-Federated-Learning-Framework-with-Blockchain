
import asyncio
import json
import os
import random
import uuid
from datetime import datetime

# Setup absolute paths for the mock MongoDB
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PATIENTS_JSON = os.path.join(BASE_DIR, "data", "mongodb", "patients.json")

RISK_PROFILES = [
    {
        "label": "High Risk",
        "age_range": (65, 85),
        "bp_sys": (160, 190),
        "bp_dia": (95, 110),
        "sugar": (200, 320),
        "test": "Abnormal",
        "admission": "Emergency",
        "symptoms": ["Chest pain", "Shortness of breath", "Severe headache", "Confusion"]
    },
    {
        "label": "Moderate Risk",
        "age_range": (45, 64),
        "bp_sys": (140, 155),
        "bp_dia": (85, 95),
        "sugar": (140, 190),
        "test": "Inconclusive",
        "admission": "Urgent",
        "symptoms": ["Fatigue", "Mild dizziness", "Persistent cough", "Joint pain"]
    },
    {
        "label": "Normal Risk",
        "age_range": (25, 44),
        "bp_sys": (115, 130),
        "bp_dia": (75, 85),
        "sugar": (90, 130),
        "test": "Normal",
        "admission": "Elective",
        "symptoms": ["Routine checkup", "Slight cold", "Allergy symptoms"]
    },
    {
        "label": "Low Risk",
        "age_range": (18, 30),
        "bp_sys": (110, 120),
        "bp_dia": (70, 80),
        "sugar": (70, 100),
        "test": "Normal",
        "admission": "Outpatient",
        "symptoms": ["Physical fitness check", "Preventative screening"]
    }
]

async def update_all_patients():
    print(f"Updating all patient records to mixed risk profiles...")
    
    if not os.path.exists(PATIENTS_JSON):
        print(f"Error: {PATIENTS_JSON} not found.")
        return

    with open(PATIENTS_JSON, "r") as f:
        try:
            data = json.load(f)
        except Exception as e:
            print(f"Error loading JSON: {e}")
            return

    total = len(data)
    print(f"Found {total} patients. Re-assigning clinical risk profiles...")

    for pid, p in data.items():
        # Select a random profile
        profile = random.choice(RISK_PROFILES)
        
        # Update clinical fields to match profile
        p["age"] = random.randint(*profile["age_range"])
        p["blood_pressure"] = f"{random.randint(*profile['bp_sys'])}/{random.randint(*profile['bp_dia'])}"
        p["sugar_level"] = str(random.randint(*profile["sugar"]))
        p["test_results"] = profile["test"]
        p["admission_type"] = profile["admission"]
        
        # Add profile-specific symptoms if not already present or replace them
        if random.random() > 0.3: # 70% chance to update symptoms for realism
            p["current_symptoms"] = random.choice(profile["symptoms"])
            
        p["diagnosis_notes"] = f"Clinical Assessment: {profile['label']}. Updated at {datetime.utcnow().strftime('%Y-%m-%d %H:%M')}"
        p["updated_at"] = datetime.utcnow().isoformat()
        
        # Ensure model-required fields exist
        if "blood_type" not in p: p["blood_type"] = random.choice(["O+", "A+", "B+", "AB+"])
        if "medication" not in p: p["medication"] = random.choice(["None", "Aspirin", "Metformin", "Lisinopril"])
        if "heart_rate" not in p: p["heart_rate"] = random.randint(60, 100)
        if "temperature" not in p: p["temperature"] = round(random.uniform(97.5, 99.5), 1)

    # Save back to file
    with open(PATIENTS_JSON, "w") as f:
        json.dump(data, f, indent=4)
    
    print(f"Successfully updated {total} patients across all doctors to a mixture of risk levels.")

if __name__ == "__main__":
    asyncio.run(update_all_patients())
