import pandas as pd
import numpy as np
import random
import argparse
from datetime import datetime, timedelta

def generate_correlated_data(row_count=55500):
    print(f"Generating {row_count} rows with injected correlations...")

    conditions = ["Arthritis", "Asthma", "Cancer", "Diabetes", "Hypertension", "Obesity"]
    medications = ["Aspirin", "Ibuprofen", "Lipitor", "Paracetamol", "Penicillin"]
    test_results = ["Normal", "Abnormal", "Inconclusive"]
    admission_types = ["Emergency", "Urgent", "Elective"]
    genders = ["Male", "Female"]
    blood_types = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]
    insurance_providers = ["Medicare", "Blue Cross", "Aetna", "UnitedHealthcare", "Cigna"]

    # 1. Age Correlations (mean, std)
    age_params = {
        "Arthritis": (64, 8),
        "Hypertension": (60, 9),
        "Diabetes": (55, 10),
        "Cancer": (58, 11),
        "Obesity": (38, 10),
        "Asthma": (32, 12)
    }

    # 2. Billing Correlations (mean, std)
    billing_params = {
        "Cancer": (45000, 9000),
        "Diabetes": (28000, 6000),
        "Hypertension": (22000, 5000),
        "Arthritis": (18000, 4000),
        "Obesity": (13000, 3000),
        "Asthma": (12000, 3000)
    }

    # 3. Medication (Dominant Drug, 65%)
    med_params = {
        "Arthritis": "Ibuprofen",
        "Hypertension": "Lipitor",
        "Diabetes": "Aspirin",
        "Cancer": "Paracetamol",
        "Asthma": "Penicillin",
        "Obesity": "Aspirin"
    }
    
    if "Metformin" not in medications:
        medications.append("Metformin")
        med_params["Diabetes"] = "Metformin"

    # 4. Test Results (Abnormal, Normal, Inconclusive)
    test_params = {
        "Cancer": [0.78, 0.12, 0.10],
        "Diabetes": [0.65, 0.20, 0.15],
        "Hypertension": [0.58, 0.25, 0.17],
        "Arthritis": [0.45, 0.35, 0.20],
        "Asthma": [0.50, 0.30, 0.20],
        "Obesity": [0.40, 0.40, 0.20]
    }

    # 5. Admission Type (Emergency, Urgent, Elective)
    admission_params = {
        "Cancer": [0.55, 0.30, 0.15],
        "Arthritis": [0.15, 0.25, 0.60],
        "Asthma": [0.50, 0.35, 0.15],
        "Hypertension": [0.35, 0.45, 0.20],
        "Diabetes": [0.30, 0.40, 0.30],
        "Obesity": [0.20, 0.30, 0.50]
    }

    data = []
    
    # Names pools
    first_names = ["James", "Mary", "Robert", "Patricia", "John", "Jennifer", "Michael", "Linda", "William", "Elizabeth"]
    last_names = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez"]
    doctors = [f"Dr. {fn} {ln}" for fn in first_names for ln in last_names[:5]]
    hospitals = ["Central Hospital", "City Medical Center", "General Clinic", "St. Jude", "Grace Hospital"]

    for i in range(row_count):
        condition = random.choice(conditions)
        
        # Age
        mean_age, std_age = age_params[condition]
        age = int(np.random.normal(mean_age, std_age))
        age = max(18, min(85, age))

        # Billing
        mean_bill, std_bill = billing_params[condition]
        billing = np.random.normal(mean_bill, std_bill)
        billing = max(1000.0, billing)

        # Medication
        if random.random() < 0.65:
            med = med_params[condition]
        else:
            others = [m for m in medications if m != med_params[condition]]
            med = random.choice(others)

        # Test Results
        test_res = np.random.choice(test_results, p=test_params[condition])

        # Admission Type
        adm_type = np.random.choice(admission_types, p=admission_params[condition])

        # Random non-predictive fields
        name = f"{random.choice(first_names)} {random.choice(last_names)}"
        gender = random.choice(genders)
        blood = random.choice(blood_types)
        ins = random.choice(insurance_providers)
        room = random.randint(100, 500)
        doctor = random.choice(doctors)
        hospital = random.choice(hospitals)
        
        # Dates
        admit_date = datetime(2020, 1, 1) + timedelta(days=random.randint(0, 1500))
        discharge_date = admit_date + timedelta(days=random.randint(1, 20))

        data.append({
            "Name": name,
            "Age": age,
            "Gender": gender,
            "Blood Type": blood,
            "Medical Condition": condition,
            "Date of Admission": admit_date.strftime("%Y-%m-%d"),
            "Doctor": doctor,
            "Hospital": hospital,
            "Insurance Provider": ins,
            "Billing Amount": round(billing, 2),
            "Room Number": room,
            "Admission Type": adm_type,
            "Discharge Date": discharge_date.strftime("%Y-%m-%d"),
            "Medication": med,
            "Test Results": test_res
        })

    df = pd.DataFrame(data)
    
    print("\nVerification of Injected Correlations:")
    print("-" * 40)
    print("Means by Medical Condition:")
    stats = df.groupby("Medical Condition")[["Age", "Billing Amount"]].mean()
    print(stats)
    
    # Save
    output_path = "backend/data/healthcare_dataset.csv"
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    df.to_csv(output_path, index=False)
    print(f"\nSuccessfully generated {row_count} rows at {output_path}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate synthetic healthcare data.")
    parser.add_argument("--rows", type=int, default=55500, help="Number of rows to generate")
    args = parser.parse_args()
    
    import os
    generate_correlated_data(args.rows)
