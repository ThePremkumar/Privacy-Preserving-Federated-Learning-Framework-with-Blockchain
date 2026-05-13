"""
SQLAlchemy models for PostgreSQL-based entities (Users, Roles, Hospitals, Audit Logs).
"""

from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Enum, JSON, Integer, Float, Text
from sqlalchemy.orm import relationship
from .database import Base
from datetime import datetime
import uuid
from typing import List
import enum

class UserRole(str, enum.Enum):
    SUPER_ADMIN = "super_admin"
    ADMIN = "admin"
    HOSPITAL = "hospital"
    DOCTOR = "doctor"

class Hospital(Base):
    __tablename__ = "hospitals"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, unique=True, index=True, nullable=False)
    contact_email = Column(String, nullable=False)
    address = Column(String)
    organization_type = Column(String, default="Hospital")
    admin_name = Column(String, nullable=True)
    contact_phone = Column(String, nullable=True)
    city = Column(String, nullable=True)
    state = Column(String, nullable=True)
    country = Column(String, default="India")
    zip_code = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # NEW fields for dynamic identity
    short_name = Column(String, nullable=True)
    logo_initials = Column(String, nullable=True)  # e.g. "HI", "AH", "AI"
    pincode = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    website = Column(String, nullable=True)
    lat = Column(Float, nullable=True)
    lng = Column(Float, nullable=True)
    department_count = Column(Integer, default=0)
    
    # Cascade Catalog (Dynamic Identity)
    active_specializations = Column(JSON, nullable=True) # Selected from global catalog
    active_departments = Column(JSON, nullable=True)     # Selected from global catalog

    # Relationships
    users = relationship("User", back_populates="hospital")
    departments = relationship("Department", back_populates="hospital")

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.DOCTOR)
    hospital_id = Column(String, ForeignKey("hospitals.id"), nullable=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True) # Primary department
    
    # Multi-tier Identity
    specializations = Column(JSON, nullable=True) # List of strings
    department_ids = Column(JSON, nullable=True)  # List of integers (department IDs)
    
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)
    
    # First-Time Login / Security
    is_first_login = Column(Boolean, default=True)
    password_changed_at = Column(DateTime, nullable=True)
    auto_password_expires_at = Column(DateTime, nullable=True)
    failed_login_attempts = Column(Integer, default=0)
    locked_until = Column(DateTime, nullable=True)
    
    # Relationships
    hospital = relationship("Hospital", back_populates="users")
    department = relationship("Department", back_populates="doctors", foreign_keys=[department_id])

class Department(Base):
    __tablename__ = "departments"
    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(String, ForeignKey("hospitals.id"), nullable=False)
    name = Column(String, nullable=False)
    code = Column(String, nullable=True)      # e.g. "CARDIO", "ORTHO"
    description = Column(Text, nullable=True)
    head_doctor_id = Column(String, ForeignKey("users.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(String, ForeignKey("users.id"), nullable=True)

    hospital = relationship("Hospital", back_populates="departments")
    doctors = relationship("User", back_populates="department", foreign_keys="User.department_id")

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"))
    action = Column(String, index=True)
    resource = Column(String)
    success = Column(Boolean, default=True)
    details = Column(JSON, nullable=True)
    ip_address = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)


class DatasetUpload(Base):
    __tablename__ = "dataset_uploads"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    filename = Column(String, nullable=False)
    hospital_id = Column(String, index=True)
    uploaded_by = Column(String)
    record_count = Column(Integer, default=0)
    columns = Column(String, nullable=True)
    sha256_hash = Column(String, nullable=True)
    status = Column(String, default="completed")
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    records = relationship("DatasetRecord", back_populates="upload")


class DatasetRecord(Base):
    __tablename__ = "dataset_records"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    upload_id = Column(String, ForeignKey("dataset_uploads.id"), index=True)
    row_index = Column(Integer)
    data = Column(String)  # JSON-stringified row data

    upload = relationship("DatasetUpload", back_populates="records")


class TrainingJob(Base):
    """A local training job run by a hospital node."""
    __tablename__ = "training_jobs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    hospital_id = Column(String, index=True, nullable=False)
    upload_id = Column(String, ForeignKey("dataset_uploads.id"), nullable=False)
    source_filename = Column(String, nullable=True) # The filename at the time of training
    started_by = Column(String)
    status = Column(String, default="pending")  # pending, training, completed, failed, submitted, approved, rejected, aggregated
    training_source = Column(String, default="csv")  # csv, direct_db
    privacy_mode = Column(String, default="anonymized")  # anonymized, identified
    is_anonymized = Column(Boolean, default=True)
    epochs = Column(Integer, default=50)
    learning_rate = Column(String, default="0.001")
    accuracy = Column(String, nullable=True)
    loss = Column(String, nullable=True)
    num_samples = Column(Integer, default=0)
    weights_hash = Column(String, nullable=True)
    model_weights = Column(String, nullable=True)  # JSON-serialised flat weights
    epsilon_used = Column(String, default="1.0")
    delta_used = Column(String, default="1e-5")
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    department_name = Column(String, nullable=True)
    doctor_id = Column(String, nullable=True)
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    review_notes = Column(String, nullable=True)
    reviewed_by = Column(String, nullable=True)
    reviewed_at = Column(DateTime, nullable=True)


class AggregationRound(Base):
    """A global aggregation round performed by super admin."""
    __tablename__ = "aggregation_rounds"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    round_number = Column(Integer, nullable=False)
    global_model_version = Column(Integer, default=1)
    initiated_by = Column(String, nullable=False)
    status = Column(String, default="completed")
    
    # Audit Data
    contributing_jobs = Column(JSON, nullable=True)  # List of training job IDs
    contributing_nodes = Column(JSON, nullable=True) # List of hospital IDs
    node_weights = Column(JSON, nullable=True)      # Dict of {hospital_id: weight_fraction}
    
    total_samples = Column(Integer, default=0)
    global_accuracy = Column(String, nullable=True)
    global_loss = Column(String, nullable=True)
    global_weights_hash = Column(String, nullable=True)
    
    # Blockchain
    blockchain_tx_hash = Column(String, nullable=True)
    blockchain_status = Column(String, default="confirmed") # confirmed, pending, failed
    
    # Privacy
    privacy_epsilon = Column(Float, default=1.0)
    epsilon_total = Column(String, nullable=True) # sum of epsilon across contributing jobs
    
    # Metadata
    notes = Column(String, nullable=True)
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    duration_seconds = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Notification(Base):
    """Platform notifications for real-time updates."""
    __tablename__ = "notifications"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), index=True, nullable=True) # Null for global broadcast
    type = Column(String, nullable=False) # e.g. 'training_submitted', 'prediction_high_risk'
    severity = Column(String, default="info") # info, success, warning, critical
    title = Column(String, nullable=False)
    message = Column(String, nullable=False)
    sound = Column(String, default="chime") # chime, success, warning, critical, ping, silent
    target_roles = Column(JSON, nullable=True) # List of roles for broadcast
    is_read = Column(Boolean, default=False)
    meta_data = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")


class PatientReferralReview(Base):
    """Admin reviews for patient referrals."""
    __tablename__ = "patient_referral_reviews"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    notification_id = Column(String, ForeignKey("notifications.id"))
    patient_id = Column(String, index=True) # MongoDB ID
    reviewed_by = Column(String, ForeignKey("users.id"), nullable=True) # Admin
    sent_by = Column(String, ForeignKey("users.id")) # Doctor
    status = Column(String, default="pending")  # pending, reviewed, flagged
    admin_notes = Column(String, nullable=True)
    priority = Column(String, default="normal")
    reviewed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    notification = relationship("Notification")
    reviewer = relationship("User", foreign_keys=[reviewed_by])
    sender = relationship("User", foreign_keys=[sent_by])


class AccessRequest(Base):
    __tablename__ = "access_requests"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    request_type = Column(String, nullable=False) # 'new_user' or 'new_hospital'
    full_name = Column(String, nullable=True) # User's name or Contact Person Name
    designation = Column(String, nullable=True) # Role
    hospital_name = Column(String, nullable=True)
    location = Column(String, nullable=True)
    contact_number = Column(String, nullable=True)
    email = Column(String, nullable=False)
    num_users = Column(Integer, nullable=True) # For hospital
    hospital_id = Column(String, nullable=True) # To link request to a hospital
    reason = Column(String, nullable=True)
    status = Column(String, default="pending") # pending, approved, rejected
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
