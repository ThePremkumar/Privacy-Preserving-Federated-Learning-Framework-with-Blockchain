"""
Authentication API for Federated Learning Healthcare Platform
Enterprise-grade authentication with JWT and RBAC
"""

from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
import logging
import os

from app.services.auth_service import AuthenticationService, UserRole, User, Permission

logger = logging.getLogger(__name__)

router = APIRouter()
security = HTTPBearer()

# Initialize auth service (in a real app, use dependency injection or singleton)
secret_key = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
auth_service = AuthenticationService(secret_key)

# Pydantic models
class LoginRequest(BaseModel):
    username: str
    password: str

class RegisterUserRequest(BaseModel):
    username: str
    email: str
    password: str
    role: str
    hospital_id: Optional[str] = None

class RegisterHospitalRequest(BaseModel):
    name: str
    contact_email: str
    address: str

# Authentication dependencies
def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)) -> User:
    """Get current authenticated user"""
    token = credentials.credentials
    payload = auth_service.verify_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = auth_service.get_user_by_id(payload.get('user_id'))
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )
    
    return user

def require_permission(permission: Permission):
    """Decorator to require specific permission"""
    def permission_checker(current_user: User = Depends(get_current_user)):
        if not auth_service.check_permission(current_user, permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        return current_user
    return permission_checker

@router.post("/login")
async def login(login_data: LoginRequest):
    """Authenticate user and return tokens"""
    try:
        result = auth_service.authenticate(login_data.username, login_data.password)
        if not result:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username or password"
            )
        return result
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.post("/register")
async def register_user(user_data: RegisterUserRequest, current_user: User = Depends(require_permission(Permission.MANAGE_USERS))):
    """Register a new user (admin only)"""
    try:
        # Validate role
        try:
            role = UserRole(user_data.role)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid role. Must be one of: {[r.value for r in UserRole]}"
            )
        
        user = auth_service.register_user(
            username=user_data.username,
            email=user_data.email,
            password=user_data.password,
            role=role,
            hospital_id=user_data.hospital_id
        )
        
        return {
            "message": "User registered successfully",
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "role": user.role.value,
                "hospital_id": user.hospital_id
            }
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Registration error: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.post("/register-hospital")
async def register_hospital(hospital_data: RegisterHospitalRequest, current_user: User = Depends(require_permission(Permission.MANAGE_HOSPITALS))):
    """Register a new hospital (admin only)"""
    try:
        hospital = auth_service.register_hospital(
            name=hospital_data.name,
            contact_email=hospital_data.contact_email,
            address=hospital_data.address
        )
        
        return {
            "message": "Hospital registered successfully",
            "hospital": {
                "id": hospital.id,
                "name": hospital.name,
                "contact_email": hospital.contact_email,
                "address": hospital.address
            }
        }
    except Exception as e:
        logger.error(f"Hospital registration error: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.get("/me")
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information"""
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "role": current_user.role.value,
        "hospital_id": current_user.hospital_id,
        "permissions": [p.value for p in current_user.permissions],
        "is_active": current_user.is_active
    }
