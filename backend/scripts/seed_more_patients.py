import sys
import os
import uuid
import bcrypt
import json
import random
from datetime import datetime

# Add the parent directory to sys.path to import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal, engine, init_db
from app.core.db_models import User, UserRole, Hospital, Department
from app.core.mongodb import patient_repo

async def seed_data():
    # Ensure DB tables and initial hospitals are created
    init_db()
    
    db = SessionLocal()
    try:
        print("Seeding Extensive Tamil Nadu Doctors and Patients...")
        
        doctors = db.query(User).filter(User.role == UserRole.DOCTOR).all()
        if not doctors:
            print("No doctors found. Please run the previous seeding script first or ensure hospitals are seeded.")
            return

        tamil_first_names = [
            "Anjali", "Balaji", "Chitra", "Dinesh", "Eshwari", "Ganesh", "Hema", "Indira", "Jeeva", "Karthik",
            "Latha", "Murali", "Nandhini", "Priya", "Rajesh", "Shanthi", "Tamilselvan", "Uma", "Velu", "Yamuna",
            "Senthil", "Vignesh", "Arun", "Suresh", "Ramesh", "Deepa", "Kavita", "Saritha", "Manikandan", "Vijay"
        ]
        tamil_last_names = ["S.", "K.", "M.", "R.", "V.", "A.", "P.", "L.", "J.", "T.", "B.", "C.", "G.", "N.", "W."]
        
        symptoms_list = [
            "Fever, Headache", "Chest pain, Breathlessness", "Joint pain, Fatigue", "Frequent urination, Thirst",
            "Dizziness, Blurred vision", "Abdominal pain", "Cough, Sore throat", "Back pain", "Nausea", "Skin rash"
        ]
        
        medical_histories = [
            ["Hypertension"], ["Diabetes"], ["Hypertension", "Diabetes"], ["Arthritis"], ["Asthma"],
            ["Thyroid"], ["Heart disease"], [], ["Obesity"], ["Anemia"]
        ]

        risk_profiles = [
            {"type": "High Risk", "age_range": (65, 85), "bp_range": (150, 180), "sugar_range": (180, 280), "test": "Abnormal", "adm": "Emergency"},
            {"type": "Moderate Risk", "age_range": (40, 64), "bp_range": (130, 155), "sugar_range": (130, 190), "test": "Inconclusive", "adm": "Urgent"},
            {"type": "Normal Risk", "age_range": (18, 39), "bp_range": (110, 125), "sugar_range": (80, 120), "test": "Normal", "adm": "Elective"}
        ]

        for doctor in doctors:
            print(f"  Generating mixed-risk patients for Dr. {doctor.username}...")
            num_patients = random.randint(8, 12)
            
            for i in range(num_patients):
                # Pick a random profile to ensure mixture
                profile = random.choice(risk_profiles)
                
                name = f"{random.choice(tamil_first_names)} {random.choice(tamil_last_names)}"
                age = random.randint(*profile["age_range"])
                gender = random.choice(["Male", "Female"])
                phone = f"{random.randint(6000000000, 9999999999)}"
                address = random.choice(["Chennai", "Madurai", "Coimbatore", "Vellore", "Salem", "Trichy", "Hosur", "Erode"])
                
                # Check if patient already exists
                existing = await patient_repo.find_many({"name": name, "phone": phone})
                if existing:
                    continue

                patient_data = {
                    "name": name,
                    "age": age,
                    "gender": gender,
                    "phone": phone,
                    "address": address,
                    "blood_type": random.choice(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]),
                    "insurance": random.choice(["Aetna", "Blue Cross", "Cigna", "Medicare", "UnitedHealthcare"]),
                    "billing_amount": random.randint(500, 45000),
                    "admission_type": profile["adm"],
                    "medication": random.choice(["Aspirin", "Ibuprofen", "Paracetamol", "Penicillin", "Lipitor"]),
                    "test_results": profile["test"],
                    "current_symptoms": random.choice(symptoms_list),
                    "blood_pressure": f"{random.randint(*profile['bp_range'])}/{random.randint(80, 110)}",
                    "sugar_level": str(random.randint(*profile["sugar_range"])),
                    "heart_rate": random.randint(60, 110),
                    "temperature": round(random.uniform(98.0, 102.5), 1),
                    "medical_history": random.choice(medical_histories),
                    "hospital_id": doctor.hospital_id,
                    "created_by": doctor.id,
                    "patient_id_manual": f"PAT-{str(uuid.uuid4())[:8].upper()}",
                    "status": "active",
                    "reports": [],
                    "diagnosis_notes": f"Mixed risk profile: {profile['type']}",
                    "created_at": datetime.utcnow().isoformat()
                }
                
                await patient_repo.insert_one(patient_data)
            
            print(f"    Added {num_patients} patients.")

        print("Seeding complete!")
        
    except Exception as e:
        db.rollback()
        print(f"Error seeding data: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    import asyncio
    asyncio.run(seed_data())
