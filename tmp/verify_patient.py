import asyncio
import os
import sys

# Add the project directory to sys.path
sys.path.append(os.getcwd())

from app.core.mongodb import patient_repo

async def check_patient():
    print("Searching for patient 'Alexander Smith'...")
    patients = await patient_repo.find_many({"name": {"$regex": "Alexander Smith", "$options": "i"}})
    if not patients:
        print("No patient found with that name.")
    else:
        for p in patients:
            print(f"Found Patient: {p.get('name')} | ID: {p.get('patient_id_manual')} | Hospital: {p.get('hospital_id')}")
            print(f"Vitals: BP={p.get('blood_pressure')}, Sugar={p.get('sugar_level')}")

if __name__ == "__main__":
    asyncio.run(check_patient())
