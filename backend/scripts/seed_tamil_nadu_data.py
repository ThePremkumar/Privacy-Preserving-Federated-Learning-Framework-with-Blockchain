import sys
import os
import uuid
import bcrypt
import json
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
        print("Seeding Tamil Nadu Doctors and Patients...")
        
        hospitals = db.query(Hospital).all()
        hospital_map = {h.id: h for h in hospitals}
        
        # Define Doctors to seed
        doctors_to_seed = [
            # Madurai
            {"username": "dr_meenakshi", "email": "meenakshi@mmcmadurai.org", "hospital_id": "hosp_mmc_madurai", "dept_code": "GM", "name": "Dr. K. Meenakshi"},
            {"username": "dr_alagar", "email": "alagar@mmcmadurai.org", "hospital_id": "hosp_mmc_madurai", "dept_code": "CARDIO", "name": "Dr. P. Alagar"},
            # Vellore
            {"username": "dr_thomas", "email": "thomas@cmcvellore.ac.in", "hospital_id": "hosp_cmc_vellore", "dept_code": "NEURO", "name": "Dr. S. Thomas"},
            {"username": "dr_mary", "email": "mary@cmcvellore.ac.in", "hospital_id": "hosp_cmc_vellore", "dept_code": "PEDS", "name": "Dr. S. Mary"},
            # Coimbatore
            {"username": "dr_maruthu", "email": "maruthu@cmccbe.org", "hospital_id": "hosp_cmc_coimbatore", "dept_code": "ORTHO", "name": "Dr. G. Maruthachalam"},
            {"username": "dr_lakshmi", "email": "lakshmi@cmccbe.org", "hospital_id": "hosp_cmc_coimbatore", "dept_code": "ONCO", "name": "Dr. S. Lakshmi"},
            # Stanley
            {"username": "dr_mani", "email": "mani@stanleymc.ac.in", "hospital_id": "hosp_stanley", "dept_code": "ER", "name": "Dr. V. Mani"},
            {"username": "dr_sugumar", "email": "sugumar@stanleymc.ac.in", "hospital_id": "hosp_stanley", "dept_code": "RADIO", "name": "Dr. J. Sugumar"},
        ]
        
        doctor_user_ids = {}

        for d in doctors_to_seed:
            existing = db.query(User).filter(User.username == d["username"]).first()
            if not existing:
                # Find department ID
                dept = db.query(Department).filter(
                    Department.hospital_id == d["hospital_id"],
                    Department.code == d["dept_code"]
                ).first()
                
                salt = bcrypt.gensalt()
                hashed = bcrypt.hashpw("doctor@123".encode("utf-8"), salt).decode("utf-8")
                
                new_user = User(
                    id=str(uuid.uuid4()),
                    username=d["username"],
                    email=d["email"],
                    password_hash=hashed,
                    role=UserRole.DOCTOR,
                    hospital_id=d["hospital_id"],
                    department_id=dept.id if dept else None,
                    is_active=True,
                    is_first_login=False
                )
                db.add(new_user)
                db.flush()
                doctor_user_ids[d["username"]] = new_user.id
                print(f"  Added Doctor: {d['name']} ({d['username']})")
            else:
                doctor_user_ids[d["username"]] = existing.id
                print(f"  Doctor already exists: {d['username']}")

        db.commit()

        # Seed Patients (MongoDB mock)
        print("Seeding Patients...")
        
        patients_to_seed = [
            {
                "name": "Muthuvel Karunanidhi",
                "age": 68,
                "gender": "Male",
                "phone": "9840012345",
                "address": "Gopalapuram, Chennai",
                "current_symptoms": "Chest pain, Breathlessness",
                "blood_pressure": "150/95",
                "sugar_level": "180",
                "heart_rate": 88,
                "temperature": 98.6,
                "medical_history": ["Hypertension", "Diabetes"],
                "hospital_id": "hosp_stanley",
                "created_by_username": "dr_mani"
            },
            {
                "name": "Selvi Jayalalithaa",
                "age": 65,
                "gender": "Female",
                "phone": "9840054321",
                "address": "Poes Garden, Chennai",
                "current_symptoms": "Fever, Cough",
                "blood_pressure": "130/85",
                "sugar_level": "140",
                "heart_rate": 76,
                "temperature": 101.2,
                "medical_history": ["Diabetes"],
                "hospital_id": "hosp_apollo",
                "created_by_username": "apollo_node_1"
            },
            {
                "name": "Ramasamy Periyar",
                "age": 75,
                "gender": "Male",
                "phone": "9443311223",
                "address": "Erode, Tamil Nadu",
                "current_symptoms": "Joint pain, Fatigue",
                "blood_pressure": "140/90",
                "sugar_level": "120",
                "heart_rate": 72,
                "temperature": 98.4,
                "medical_history": ["Arthritis"],
                "hospital_id": "hosp_cmc_coimbatore",
                "created_by_username": "dr_maruthu"
            },
            {
                "name": "Kamraj Nadar",
                "age": 70,
                "gender": "Male",
                "phone": "9442255667",
                "address": "Virudhunagar, Tamil Nadu",
                "current_symptoms": "Frequent urination, Thirst",
                "blood_pressure": "135/85",
                "sugar_level": "240",
                "heart_rate": 80,
                "temperature": 98.6,
                "medical_history": ["Diabetes"],
                "hospital_id": "hosp_mmc_madurai",
                "created_by_username": "dr_meenakshi"
            },
            {
                "name": "Anbazhagan K.",
                "age": 62,
                "gender": "Male",
                "phone": "9884411223",
                "address": "Anna Nagar, Chennai",
                "current_symptoms": "Dizziness, Blurred vision",
                "blood_pressure": "170/100",
                "sugar_level": "130",
                "heart_rate": 84,
                "temperature": 98.2,
                "medical_history": ["Hypertension"],
                "hospital_id": "hosp_stanley",
                "created_by_username": "dr_sugumar"
            },
            {
                "name": "Senthamizhan Seeman",
                "age": 45,
                "gender": "Male",
                "phone": "9778899001",
                "address": "Sivagangai, Tamil Nadu",
                "current_symptoms": "Abdominal pain",
                "blood_pressure": "120/80",
                "sugar_level": "110",
                "heart_rate": 70,
                "temperature": 98.6,
                "medical_history": [],
                "hospital_id": "hosp_mmc_madurai",
                "created_by_username": "dr_alagar"
            }
        ]

        for p in patients_to_seed:
            existing_patients = await patient_repo.find_many({"name": p["name"], "phone": p["phone"]})
            if not existing_patients:
                creator_username = p.pop("created_by_username")
                creator = db.query(User).filter(User.username == creator_username).first()
                
                patient_data = p
                patient_data["created_by"] = creator.id if creator else None
                patient_data["patient_id_manual"] = f"PAT-{str(uuid.uuid4())[:8].upper()}"
                patient_data["status"] = "active"
                patient_data["reports"] = []
                patient_data["diagnosis_notes"] = "Seeded for testing"
                
                patient_id = await patient_repo.insert_one(patient_data)
                print(f"  Added Patient: {p['name']} (ID: {patient_id})")
            else:
                print(f"  Patient already exists: {p['name']}")

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
