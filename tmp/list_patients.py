import asyncio
import os
import sys

# Add the project directory to sys.path
sys.path.append(os.getcwd())

from app.core.mongodb import patient_repo

async def list_all():
    print("Listing all patients in MongoDB...")
    patients = await patient_repo.find_many({})
    print(f"Total patients: {len(patients)}")
    for p in patients:
        print(f"- {p.get('name')} (ID: {p.get('patient_id_manual') or p.get('_id')})")

if __name__ == "__main__":
    asyncio.run(list_all())
