import json
import os

patients_path = "./data/mongodb/patients.json"

if os.path.exists(patients_path):
    with open(patients_path, "r") as f:
        patients = json.load(f)
    
    # Harish Raj ID: e5aafe70-3558-47c3-931d-d8bfd48639c3
    target_doctor_id = "e5aafe70-3558-47c3-931d-d8bfd48639c3"
    
    updated = False
    for p_id, p in patients.items():
        if p.get("created_by") == "db84156b-f1f5-4ade-bc4a-84cbb33b4ed4":
            p["created_by"] = target_doctor_id
            updated = True
            print(f"Updated patient {p.get('name')} (ID: {p_id}) to doctor {target_doctor_id}")
            
    if updated:
        with open(patients_path, "w") as f:
            json.dump(patients, f, indent=4)
        print("Successfully updated orphaned patient records.")
    else:
        print("No orphaned records found with the specific ID.")
else:
    print("Patients file not found.")
