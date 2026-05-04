"""
Database configuration and SQLAlchemy initialization.
Supports PostgreSQL for users and roles, with SQLite fallback.
"""

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from .config import settings
import logging
import uuid

logger = logging.getLogger(__name__)

# SQLAlchemy setup
DATABASE_URL = settings.DATABASE_URL

# For SQLite, we need to allow same-thread access
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    DATABASE_URL, connect_args=connect_args
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    """Dependency for getting DB session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Initialize database tables and seed default data"""
    try:
        # Import models to register them with Base before creating tables
        from app.core import db_models  # noqa: F401
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables initialized successfully")
        _seed_hospitals_and_departments()
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")


def _seed_hospitals_and_departments():
    """Seed hospitals, departments, and hospital node users idempotently."""
    from app.core.db_models import (
        Hospital as DBHospital,
        Department as DBDepartment,
        User as DBUser,
        UserRole as DBUserRole,
    )
    import bcrypt

    hospitals_seed = [
        {
            "id": "hosp_himsr",
            "name": "Hosur Institute of Medical Sciences & Research (HIMSR)",
            "short_name": "HIMSR",
            "contact_email": "admin@himsr.in",
            "address": "Denkanikottai Road, Hosur, Tamil Nadu 635109",
            "city": "Hosur",
            "state": "Tamil Nadu",
            "country": "India",
            "pincode": "635109",
            "phone": "+91 4344 000000",
            "website": "www.himsr.in",
            "lat": 12.7409,
            "lng": 77.8253,
            "logo_initials": "HI",
            "admin_name": "Dr. S. Rajendran",
            "contact_phone": "+91 4344 000000",
            "organization_type": "Hospital",
            # node user credentials
            "node_username": "himsr_node_1",
            "node_password": "node@1",
            "node_email": "node@himsr.in",
        },
        {
            "id": "hosp_apollo",
            "name": "Apollo Hospitals",
            "short_name": "Apollo",
            "contact_email": "admin@apollo.com",
            "address": "21 Greams Road, Chennai 600006",
            "city": "Chennai",
            "state": "Tamil Nadu",
            "country": "India",
            "pincode": "600006",
            "phone": "+91 44 28293333",
            "website": "www.apollohospitals.com",
            "lat": 13.0827,
            "lng": 80.2707,
            "logo_initials": "AH",
            "admin_name": "Dr. Prathap C. Reddy",
            "contact_phone": "+91 44 28293333",
            "organization_type": "Hospital",
            "node_username": "apollo_node_1",
            "node_password": "node@1",
            "node_email": "node@apollo.com",
        },
        {
            "id": "hosp_aiims",
            "name": "AIIMS Delhi",
            "short_name": "AIIMS",
            "contact_email": "admin@aiims.edu",
            "address": "Ansari Nagar, New Delhi 110029",
            "city": "New Delhi",
            "state": "Delhi",
            "country": "India",
            "pincode": "110029",
            "phone": "+91 11 26588500",
            "website": "www.aiims.edu",
            "lat": 28.5672,
            "lng": 77.2100,
            "logo_initials": "AI",
            "admin_name": "Director, AIIMS",
            "contact_phone": "+91 11 26588500",
            "organization_type": "Hospital",
            "node_username": "aiims_node_1",
            "node_password": "node@1",
            "node_email": "node@aiims.edu",
        },
    ]

    default_departments = [
        {"name": "Cardiology",       "code": "CARDIO",  "description": "Heart and cardiovascular care"},
        {"name": "Orthopedics",      "code": "ORTHO",   "description": "Bone, joint, and muscle disorders"},
        {"name": "Neurology",        "code": "NEURO",   "description": "Brain and nervous system disorders"},
        {"name": "Pediatrics",       "code": "PEDS",    "description": "Medical care for children"},
        {"name": "General Medicine", "code": "GM",      "description": "General outpatient and inpatient care"},
        {"name": "Emergency",        "code": "ER",      "description": "Emergency and critical care"},
        {"name": "Radiology",        "code": "RADIO",   "description": "Medical imaging and diagnostics"},
        {"name": "Oncology",         "code": "ONCO",    "description": "Cancer treatment and research"},
    ]

    db = SessionLocal()
    try:
        for h in hospitals_seed:
            node_username = h.pop("node_username")
            node_password = h.pop("node_password")
            node_email = h.pop("node_email")

            # Create hospital if it doesn't exist
            existing_hosp = db.query(DBHospital).filter(DBHospital.id == h["id"]).first()
            if not existing_hosp:
                db_hosp = DBHospital(**h)
                db.add(db_hosp)
                db.flush()  # flush to get the ID
                logger.info(f"Seeded hospital: {h['name']}")
            else:
                logger.info(f"Hospital already exists: {h['name']}")

            hospital_id = h["id"]

            # Create departments for this hospital
            for dept in default_departments:
                existing_dept = db.query(DBDepartment).filter(
                    DBDepartment.hospital_id == hospital_id,
                    DBDepartment.code == dept["code"]
                ).first()
                if not existing_dept:
                    db_dept = DBDepartment(
                        hospital_id=hospital_id,
                        name=dept["name"],
                        code=dept["code"],
                        description=dept["description"],
                        is_active=True,
                    )
                    db.add(db_dept)

            # Create hospital node user
            existing_user = db.query(DBUser).filter(DBUser.username == node_username).first()
            if not existing_user:
                salt = bcrypt.gensalt()
                hashed = bcrypt.hashpw(node_password.encode("utf-8"), salt).decode("utf-8")
                db_user = DBUser(
                    id=str(uuid.uuid4()),
                    username=node_username,
                    email=node_email,
                    password_hash=hashed,
                    role=DBUserRole.HOSPITAL,
                    hospital_id=hospital_id,
                    is_active=True,
                )
                db.add(db_user)
                logger.info(f"Seeded hospital node user: {node_username}")
            else:
                logger.info(f"Hospital node user already exists: {node_username}")

        db.commit()
        logger.info("Hospital and department seeding complete.")
    except Exception as exc:
        db.rollback()
        logger.error(f"Seeding error: {exc}")
    finally:
        db.close()
