"""
HealthConnect Platform Configuration - Global Catalog
Three-tier data model: Organization Type -> Specializations -> Departments
"""

ORGANIZATION_CATALOG = {
    "General clinic": {
        "specializations": ["General Medicine", "Family Medicine", "Internal Medicine", "Preventive Care", "Geriatrics"],
        "departments": ["OPD", "Emergency", "ICU", "Pharmacy", "Laboratory", "Radiology", "General Ward"]
    },
    "Heart hospital": {
        "specializations": ["Cardiology", "Cardiac Surgery", "Interventional Cardiology", "Electrophysiology", "Heart Failure"],
        "departments": ["Cath Lab", "Cardiac ICU", "Echocardiography", "Cardiac Rehab", "Cardiac Surgery OT"]
    },
    "Neuro center": {
        "specializations": ["Neurology", "Neurosurgery", "Neuro-oncology", "Epileptology", "Stroke Medicine", "Neuro-rehabilitation"],
        "departments": ["Neuro ICU", "EEG Lab", "Stroke Unit", "MRI Suite", "Neurosurgery OT"]
    },
    "Ortho & spine": {
        "specializations": ["Orthopedics", "Spine Surgery", "Sports Medicine", "Joint Replacement", "Rheumatology", "Physiotherapy"],
        "departments": ["Orthopedic OT", "Joint Clinic", "Spine OPD", "Physiotherapy", "Plaster Room"]
    },
    "Maternity & child": {
        "specializations": ["Obstetrics", "Gynecology", "Neonatology", "Pediatrics", "Pediatric Surgery", "Lactation"],
        "departments": ["Labour Ward", "NICU", "Pediatric ICU", "Antenatal OPD", "Gynec OT", "Pediatric OPD"]
    },
    "Cancer center": {
        "specializations": ["Medical Oncology", "Surgical Oncology", "Radiation Oncology", "Hemato-oncology", "Palliative Care"],
        "departments": ["Chemotherapy", "Radiation Therapy", "Bone Marrow Transplant", "Palliative Ward", "Nuclear Medicine"]
    },
    "Eye hospital": {
        "specializations": ["Ophthalmology", "Retina & Vitreous", "Glaucoma", "Cornea", "Oculoplasty", "Pediatric Ophthalmology"],
        "departments": ["OT Suite", "Retina Clinic", "Refraction", "Contact Lens Clinic", "Laser Centre"]
    },
    "Multispecialty": {
        "specializations": [
            "General Medicine", "Cardiology", "Neurology", "Orthopedics", 
            "Gastroenterology", "Pulmonology", "Nephrology", "Endocrinology", 
            "Dermatology", "Psychiatry"
        ],
        "departments": [
            "Emergency", "ICU", "OPD", "OT Complex", "Blood Bank", 
            "Laboratory", "Radiology", "Dietetics"
        ]
    }
}

# Mapping of specializations to suggested departments (for cascade filtering)
# If a specialization isn't listed, all departments are shown.
SPECIALIZATION_TO_DEPARTMENTS = {
    "Cardiology": ["Cath Lab", "Cardiac ICU", "Echocardiography", "Cardiac Rehab"],
    "Cardiac Surgery": ["Cardiac Surgery OT", "Cardiac ICU"],
    "Neurology": ["Neuro ICU", "EEG Lab", "Stroke Unit", "MRI Suite"],
    "Neurosurgery": ["Neurosurgery OT", "Neuro ICU"],
    "Orthopedics": ["Orthopedic OT", "Joint Clinic", "Plaster Room"],
    "Obstetrics": ["Labour Ward", "Antenatal OPD"],
    "Neonatology": ["NICU"],
    "Pediatrics": ["Pediatric ICU", "Pediatric OPD"],
    "Ophthalmology": ["OT Suite", "Retina Clinic", "Laser Centre"],
    "General Medicine": ["OPD", "Emergency", "General Ward"],
    "Medical Oncology": ["Chemotherapy", "Palliative Ward"],
    "Radiation Oncology": ["Radiation Therapy", "Nuclear Medicine"],
}
