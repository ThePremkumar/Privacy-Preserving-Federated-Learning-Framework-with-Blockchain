"""
Synthetic Medical Data Generator for Healthcare Platform
Enterprise-grade GAN-inspired synthetic data generation
"""

import numpy as np
import random
import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Any

class SyntheticDataService:
    """Service to generate realistic synthetic medical data for testing"""
    
    def __init__(self):
        self.conditions = ["Type 2 Diabetes", "Hypertension", "Asthma", "Cardiovascular Risk", "Chronic Kidney Disease"]
        self.symptoms = ["fatigue", "high glucose", "shortness of breath", "chest pain", "joint pain", "blurred vision"]
        self.genders = ["Male", "Female", "Other"]
        self.hospitals = ["Hospital Node A", "Hospital Node B", "Hospital Node C"]

    def generate_patient(self) -> Dict[str, Any]:
        """Generate a single realistic patient profile"""
        age = random.randint(18, 85)
        gender = random.choice(self.genders)
        condition = random.choice(self.conditions)
        
        # Correlated vitals based on condition
        glucose = random.randint(80, 140) if condition != "Type 2 Diabetes" else random.randint(160, 300)
        systolic_bp = random.randint(110, 130) if condition != "Hypertension" else random.randint(145, 190)
        
        patient_id = f"PAT-{random.randint(1000, 9999)}"
        
        return {
            "id": patient_id,
            "name": self._generate_random_name(),
            "age": age,
            "gender": gender,
            "condition": condition,
            "vitals": {
                "glucose": glucose,
                "bp": f"{systolic_bp}/{random.randint(70, 95)}",
                "bmi": round(random.uniform(18.5, 35.0), 1)
            },
            "consent_status": random.choice(["Approved", "Approved", "Pending", "Expired"]),
            "consent_expiry": (datetime.now() + timedelta(days=random.randint(30, 730))).strftime("%Y-%m-%d"),
            "risk_score": random.randint(10, 95),
            "created_at": (datetime.now() - timedelta(days=random.randint(1, 300))).isoformat()
        }

    def generate_clinical_note(self, patient_data: Dict[str, Any]) -> str:
        """Generate a realistic clinical note for a patient"""
        vitals = patient_data["vitals"]
        note = f"Patient {patient_data['id']} presents with {random.choice(self.symptoms)}. " \
               f"Physical examination reveals BP of {vitals['bp']} and BMI of {vitals['bmi']}. " \
               f"Laboratory tests indicate glucose at {vitals['glucose']} mg/dL. " \
               f"Primary diagnosis suspected: {patient_data['condition']}. " \
               f"Follow-up required within 30 days."
        return note

    def _generate_random_name(self) -> str:
        first_names = ["Sam", "Sarah", "Michael", "Emma", "David", "Linda", "James", "Maria", "John", "Patricia"]
        last_names = ["Wilson", "Lee", "Brown", "Watson", "Miller", "Davis", "Garcia", "Rodriguez", "Smith", "Johnson"]
        return f"{random.choice(first_names)} {random.choice(last_names)}"

    def generate_batch(self, size: int = 10) -> List[Dict[str, Any]]:
        """Generate a batch of patients"""
        return [self.generate_patient() for _ in range(size)]

synthetic_data_service = SyntheticDataService()
