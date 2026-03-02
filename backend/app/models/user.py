from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    SUPER_ADMIN = "super_admin"
    ADMIN = "admin"
    HOSPITAL = "hospital"
    DOCTOR = "doctor"

class UserBase(BaseModel):
    username: str
    email: EmailStr
    role: UserRole
    hospital_id: Optional[str] = None
    is_active: bool = True

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: str
    created_at: datetime
    last_login: Optional[datetime] = None

    class Config:
        from_attributes = True
