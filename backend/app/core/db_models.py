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
