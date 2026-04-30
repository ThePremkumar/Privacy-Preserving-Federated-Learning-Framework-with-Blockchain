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

# Use the global singleton (same secret key as security.py)
from app.services.auth_service import auth_service

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
    organization_type: str = "Hospital"
    admin_name: str
    contact_phone: Optional[str] = None
    city: str
    state: str
    country: str = "India"
    zip_code: Optional[str] = None
    is_active: bool = True

class UpdateHospitalRequest(BaseModel):
    name: Optional[str] = None
    contact_email: Optional[str] = None
    address: Optional[str] = None
    organization_type: Optional[str] = None
    admin_name: Optional[str] = None
    contact_phone: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    zip_code: Optional[str] = None
    is_active: Optional[bool] = None

class UpdateProfileRequest(BaseModel):
    email: EmailStr

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
        
        # Role-based registration restrictions
        if current_user.role == UserRole.HOSPITAL:
            if role != UserRole.DOCTOR:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Hospital nodes can only register doctor specialists."
                )
            # Hospital nodes must register to their own hospital
            target_hospital_id = current_user.hospital_id
        else:
            target_hospital_id = user_data.hospital_id
            
        user = auth_service.register_user(
            username=user_data.username,
            email=user_data.email,
            password=user_data.password,
            role=role,
            hospital_id=target_hospital_id
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
            address=hospital_data.address,
            organization_type=hospital_data.organization_type,
            admin_name=hospital_data.admin_name,
            contact_phone=hospital_data.contact_phone,
            city=hospital_data.city,
            state=hospital_data.state,
            country=hospital_data.country,
            zip_code=hospital_data.zip_code,
            is_active=hospital_data.is_active
        )
        
        return {
            "message": "Hospital registered successfully",
            "hospital": {
                "id": hospital.id,
                "name": hospital.name,
                "contact_email": hospital.contact_email,
                "address": hospital.address,
                "organization_type": hospital.organization_type,
                "admin_name": hospital.admin_name,
                "contact_phone": hospital.contact_phone,
                "city": hospital.city,
                "state": hospital.state,
                "country": hospital.country,
                "is_active": hospital.is_active
            }
        }
    except Exception as e:
        logger.error(f"Hospital registration error: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.put("/hospitals/{hospital_id}")
async def update_hospital(hospital_id: str, hospital_data: UpdateHospitalRequest, current_user: User = Depends(require_permission(Permission.MANAGE_HOSPITALS))):
    """Update an existing hospital (admin only)"""
    try:
        hospital = auth_service.update_hospital(
            hospital_id=hospital_id,
            name=hospital_data.name,
            contact_email=hospital_data.contact_email,
            address=hospital_data.address,
            organization_type=hospital_data.organization_type,
            admin_name=hospital_data.admin_name,
            contact_phone=hospital_data.contact_phone,
            city=hospital_data.city,
            state=hospital_data.state,
            country=hospital_data.country,
            zip_code=hospital_data.zip_code,
            is_active=hospital_data.is_active
        )
        
        if not hospital:
            raise HTTPException(status_code=404, detail="Hospital not found")
            
        return {
            "message": "Hospital updated successfully",
            "hospital": {
                "id": hospital.id,
                "name": hospital.name,
                "contact_email": hospital.contact_email,
                "address": hospital.address,
                "organization_type": hospital.organization_type,
                "admin_name": hospital.admin_name,
                "contact_phone": hospital.contact_phone,
                "city": hospital.city,
                "state": hospital.state,
                "country": hospital.country,
                "is_active": hospital.is_active
            }
        }
    except Exception as e:
        logger.error(f"Hospital update error: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.delete("/hospitals/{hospital_id}")
async def delete_hospital(hospital_id: str, current_user: User = Depends(require_permission(Permission.MANAGE_HOSPITALS))):
    """Delete a hospital (admin only). Associated users will be disassociated."""
    try:
        success = auth_service.delete_hospital(hospital_id)
        if not success:
            raise HTTPException(status_code=404, detail="Hospital not found")
        return {"message": "Hospital deleted successfully", "hospital_id": hospital_id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Hospital delete error: {e}")
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
        "hospital": {
            "name": getattr(current_user, "hospital").name if getattr(current_user, "hospital", None) else None
        } if current_user.hospital_id else None,
        "permissions": [p.value for p in current_user.permissions],
        "is_active": current_user.is_active
    }

@router.put("/me")
async def update_current_user_profile(profile_data: UpdateProfileRequest, current_user: User = Depends(get_current_user)):
    """Update current user profile (only email allowed)"""
    from app.core.database import SessionLocal
    from app.core.db_models import User as DBUser, Notification, UserRole as DBUserRole
    import asyncio
    
    db = SessionLocal()
    try:
        db_user = db.query(DBUser).filter(DBUser.id == current_user.id).first()
        if not db_user:
            raise HTTPException(status_code=404, detail="User not found")
            
        old_email = db_user.email
        db_user.email = profile_data.email
        db.commit()
        
        # Determine targets for notification
        # hospital admin, admin, super admin
        targets = db.query(DBUser).filter(
            (DBUser.role == DBUserRole.SUPER_ADMIN) | 
            (DBUser.role == DBUserRole.ADMIN) | 
            ((DBUser.role == DBUserRole.HOSPITAL) & (DBUser.hospital_id == current_user.hospital_id))
        ).all()
        
        for target in targets:
            notif = Notification(
                title="Profile Update",
                message=f"User {current_user.username} changed their email from {old_email} to {profile_data.email}.",
                type="info",
                user_id=target.id
            )
            db.add(notif)
            
        db.commit()
        
        # Send WebSocket notification to targets
        try:
            from app.api.websockets import manager
            message = {
                "type": "notification",
                "title": "Profile Update",
                "message": f"User {current_user.username} changed their email to {profile_data.email}.",
                "notification_type": "info"
            }
            for target in targets:
                # Wrap it in asyncio.create_task or run immediately since it's an async endpoint
                asyncio.create_task(manager.send_personal_message(message, target.id))
        except ImportError:
            pass
            
        return {"message": "Profile updated successfully", "email": profile_data.email}
    except Exception as e:
        db.rollback()
        logger.error(f"Profile update error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()

@router.get("/users")
async def get_users(current_user: User = Depends(require_permission(Permission.MANAGE_USERS))):
    """Get users (filtered based on role)"""
    if current_user.role == UserRole.HOSPITAL:
        result = auth_service.get_users_by_hospital(current_user.hospital_id)
    else:
        result = auth_service.get_all_users()
        
    return [
        {
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "role": u.role.value,
            "hospital_id": u.hospital_id,
            "hospital_name": getattr(u, "hospital").name if getattr(u, "hospital", None) else None,
            "is_active": u.is_active,
            "created_at": u.created_at
        }
        for u in result.get("items", [])
    ]

@router.get("/hospitals")
async def get_hospitals(current_user: User = Depends(require_permission(Permission.MANAGE_HOSPITALS))):
    """Get all hospitals (admin only)"""
    result = auth_service.get_all_hospitals()
    hospitals = [
        {
            "id": h.id,
            "name": h.name,
            "contact_email": h.contact_email,
            "address": h.address,
            "organization_type": h.organization_type,
            "admin_name": h.admin_name,
            "contact_phone": h.contact_phone,
            "city": h.city,
            "state": h.state,
            "country": h.country,
            "zip_code": h.zip_code,
            "is_active": h.is_active
        }
        for h in result.get("items", [])
    ]
    return {
        "total": result.get("total", 0),
        "items": hospitals
    }

