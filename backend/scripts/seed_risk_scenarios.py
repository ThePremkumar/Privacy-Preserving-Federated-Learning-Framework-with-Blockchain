import sys
import os
import uuid
import random
from datetime import datetime

# Add the parent directory to sys.path to import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal, init_db
from app.core.db_models import User, UserRole
from app.core.mongodb import patient_repo

async def seed_scenarios():
    # Ensure DB tables are initialized
    init_db()
    
    db = SessionLocal()
    try:
        print("Seeding Clinical Risk Scenarios (High, Moderate, Low)...")
        
        doctors = db.query(User).filter(User.role == UserRole.DOCTOR).all()
        if not doctors:
            print("No doctors found. Please ensure users are seeded.")
            return

        scenarios = [
            {
                "suffix": "Low Risk",
                "age": 24,
                "blood_type": "O+",
                "insurance": "Medicare",
                "billing_amount": 1200,
                "admission_type": "Elective",
                "medication": "Paracetamol",
                "test_results": "Normal",
                "medical_history": [],
                "symptoms": "Annual physical checkup",
                "bp": "115/75",
                "sugar": "95",
                "heart_rate": 68
            },
            {
                "suffix": "Moderate Risk",
                "age": 48,
                "blood_type": "B+",
                "insurance": "Aetna",
                "billing_amount": 8500,
                "admission_type": "Urgent",
                "medication": "Ibuprofen",
                "test_results": "Inconclusive",
                "medical_history": ["Hypertension"],
                "symptoms": "Mild persistent chest discomfort",
                "bp": "145/95",
                "sugar": "140",
                "heart_rate": 82
            },
            {
                "suffix": "High Risk",
                "age": 76,
                "blood_type": "AB-",
                "insurance": "Blue Cross",
                "billing_amount": 28000,
                "admission_type": "Emergency",
                "medication": "Lipitor",
                "test_results": "Abnormal",
                "medical_history": ["Heart disease", "Diabetes"],
                "symptoms": "Shortness of breath and palpitations",
                "bp": "170/110",
                "sugar": "230",
                "heart_rate": 105
            }
        ]

        tamil_names = ["Anjali", "Karthik", "Priya", "Rajesh", "Senthil", "Deepa"]

        for doctor in doctors:
            print(f"  Adding scenarios for Dr. {doctor.username}...")
            for s in scenarios:
                name = f"{random.choice(tamil_names)} {s['suffix']}"
                phone = f"{random.randint(6000000000, 9999999999)}"
                
                patient_data = {
                    "name": name,
                    "age": s["age"],
                    "gender": random.choice(["Male", "Female"]),
                    "phone": phone,
                    "address": random.choice(["Chennai", "Madurai", "Coimbatore"]),
                    "blood_type": s["blood_type"],
                    "insurance": s["insurance"],
                    "billing_amount": s["billing_amount"],
                    "admission_type": s["admission_type"],
                    "medication": s["medication"],
                    "test_results": s["test_results"],
                    "current_symptoms": s["symptoms"],
                    "blood_pressure": s["bp"],
                    "sugar_level": s["sugar"],
                    "heart_rate": s["heart_rate"],
                    "temperature": 98.6 if s["suffix"] == "Low Risk" else 100.2,
                    "medical_history": s["medical_history"],
                    "hospital_id": doctor.hospital_id,
                    "created_by": doctor.id,
                    "patient_id_manual": f"PAT-SCN-{str(uuid.uuid4())[:6].upper()}",
                    "status": "active",
                    "reports": [],
                    "created_at": datetime.utcnow().isoformat()
                }
                
                await patient_repo.insert_one(patient_data)
        
        print("Scenario seeding complete!")
        
    except Exception as e:
        print(f"Error seeding scenarios: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    import asyncio
    asyncio.run(seed_scenarios())
