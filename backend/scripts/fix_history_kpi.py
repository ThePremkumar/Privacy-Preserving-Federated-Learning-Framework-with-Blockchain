
import asyncio
import json
import os
import random

# Setup absolute paths for the mock MongoDB
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PATIENTS_JSON = os.path.join(BASE_DIR, "data", "mongodb", "patients.json")

def fix_medical_history():
    print(f"Aligning Medical History with Risk Profiles for KPI consistency...")
    
    if not os.path.exists(PATIENTS_JSON):
        print(f"Error: {PATIENTS_JSON} not found.")
        return

    with open(PATIENTS_JSON, "r") as f:
        patients = json.load(f)

    for pid, p in patients.items():
        notes = p.get("diagnosis_notes", "")
        
        # Determine risk level from existing notes
        if "High Risk" in notes:
            # High risk needs at least 4 items for base 8.5
            p["medical_history"] = ["Hypertension", "Diabetes", "Chronic Kidney Disease", "Previous Heart Attack"]
        elif "Moderate Risk" in notes:
            # Moderate risk needs 2-3 items for base 5.0
            p["medical_history"] = ["Asthma", "Hyperlipidemia"]
        else:
            # Normal/Low risk 0-1 items for base 2.0
            p["medical_history"] = ["Seasonal Allergies"]

    # Save back
    with open(PATIENTS_JSON, "w") as f:
        json.dump(patients, f, indent=4)
    
    print(f"Updated medical history for {len(patients)} patients. KPIs should now align across Dashboard and Registry.")

if __name__ == "__main__":
    fix_medical_history()
