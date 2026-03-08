"""
SQLAlchemy models for PostgreSQL-based entities (Users, Roles, Hospitals, Audit Logs).
"""

from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Enum, JSON, Integer
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
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationship with users
    users = relationship("User", back_populates="hospital")

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.DOCTOR)
    hospital_id = Column(String, ForeignKey("hospitals.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)
    
    # Relationship with hospital
    hospital = relationship("Hospital", back_populates="users")

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
    started_by = Column(String)
    status = Column(String, default="pending")  # pending, training, completed, failed, submitted, approved, rejected, aggregated
    epochs = Column(Integer, default=3)
    learning_rate = Column(String, default="0.001")
    accuracy = Column(String, nullable=True)
    loss = Column(String, nullable=True)
    num_samples = Column(Integer, default=0)
    weights_hash = Column(String, nullable=True)
    model_weights = Column(String, nullable=True)  # JSON-serialised flat weights
    epsilon_used = Column(String, default="1.0")
    delta_used = Column(String, default="1e-5")
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
    initiated_by = Column(String, nullable=False)
    status = Column(String, default="completed")
    participating_jobs = Column(String, nullable=True)  # comma-separated job IDs
    participating_hospitals = Column(String, nullable=True)  # comma-separated hospital IDs
    total_samples = Column(Integer, default=0)
    global_accuracy = Column(String, nullable=True)
    global_loss = Column(String, nullable=True)
    global_weights_hash = Column(String, nullable=True)
    blockchain_tx_hash = Column(String, nullable=True)
    epsilon_total = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

