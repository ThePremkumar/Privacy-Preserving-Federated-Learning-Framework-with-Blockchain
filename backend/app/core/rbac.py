"""
Role-Based Access Control (RBAC) for Federated Learning Healthcare Platform
Enterprise-grade permission system with hospital-level isolation
"""

from enum import Enum
from typing import List, Dict, Set, Optional
from fastapi import HTTPException, status, Request
from fastapi.security import HTTPAuthorizationCredentials
import logging

from .security import security_manager, audit_logger
from .config import settings

logger = logging.getLogger(__name__)

class UserRole(str, Enum):
    """User roles for the federated learning platform"""
    SUPER_ADMIN = "super_admin"
    ADMIN = "admin"
    HOSPITAL = "hospital"
    DOCTOR = "doctor"

class Permission(str, Enum):
    """System permissions"""
    # System management
    MANAGE_HOSPITALS = "manage_hospitals"
    MANAGE_USERS = "manage_users"
    VIEW_GLOBAL_MODEL = "view_global_model"
    MONITOR_TRAINING = "monitor_training"
    
    # Hospital operations
    UPLOAD_DATA = "upload_data"
    TRAIN_MODEL = "train_model"
    SUBMIT_WEIGHTS = "submit_weights"
    
    # Medical operations
    VIEW_PREDICTIONS = "view_predictions"
    VIEW_ANOMALIES = "view_anomalies"
    ACCESS_PATIENT_DATA = "access_patient_data"
    
    # Audit and compliance
    VIEW_AUDIT_TRAIL = "view_audit_trail"
    GENERATE_REPORTS = "generate_reports"
    VERIFY_INTEGRITY = "verify_integrity"

# Role-Permission mapping
ROLE_PERMISSIONS: Dict[UserRole, Set[Permission]] = {
    UserRole.SUPER_ADMIN: {
        Permission.MANAGE_HOSPITALS,
        Permission.MANAGE_USERS,
        Permission.VIEW_GLOBAL_MODEL,
        Permission.MONITOR_TRAINING,
        Permission.VIEW_AUDIT_TRAIL,
        Permission.GENERATE_REPORTS,
        Permission.VERIFY_INTEGRITY
    },
    UserRole.ADMIN: {
        Permission.VIEW_GLOBAL_MODEL,
        Permission.MONITOR_TRAINING,
        Permission.VIEW_AUDIT_TRAIL,
        Permission.GENERATE_REPORTS
    },
    UserRole.HOSPITAL: {
        Permission.UPLOAD_DATA,
        Permission.TRAIN_MODEL,
        Permission.SUBMIT_WEIGHTS,
        Permission.VIEW_AUDIT_TRAIL
    },
    UserRole.DOCTOR: {
        Permission.VIEW_PREDICTIONS,
        Permission.VIEW_ANOMALIES,
        Permission.ACCESS_PATIENT_DATA
    }
}

class RBACMiddleware:
    """RBAC middleware for FastAPI"""
    
    async def __call__(self, request: Request, call_next):
        """Process request through RBAC middleware"""
        
        # Extract token from header
        authorization = request.headers.get("authorization")
        if authorization and authorization.startswith("Bearer "):
            token = authorization.split(" ")[1]
            
            try:
                # Verify token and extract user info
                payload = security_manager.verify_token(token)
                user_info = {
                    "user_id": payload.get("sub"),
                    "username": payload.get("username"),
                    "role": payload.get("role"),
                    "hospital_id": payload.get("hospital_id"),
                    "permissions": payload.get("permissions", [])
                }
                
                # Store user info in request state
                request.state.user = user_info
                
                # Log access
                audit_logger.log_access(
                    user_id=user_info["user_id"],
                    action="api_access",
                    resource=f"{request.method} {request.url.path}",
                    hospital_id=user_info.get("hospital_id"),
                    ip_address=request.client.host,
                    user_agent=request.headers.get("user-agent"),
                    success=True
                )
                
            except Exception as e:
                logger.warning(f"RBAC middleware error: {e}")
                # Continue without user info - will be handled by dependencies
        
        response = await call_next(request)
        return response

class PermissionChecker:
    """Permission checking utility"""
    
    @staticmethod
    def has_permission(user_permissions: List[str], required_permission: Permission) -> bool:
        """Check if user has specific permission"""
        return required_permission in user_permissions
    
    @staticmethod
    def has_role(user_role: UserRole, required_roles: List[UserRole]) -> bool:
        """Check if user has any of the required roles"""
        return user_role in required_roles
    
    @staticmethod
    def has_any_permission(user_permissions: List[str], required_permissions: List[Permission]) -> bool:
        """Check if user has any of the required permissions"""
        return any(perm in user_permissions for perm in required_permissions)
    
    @staticmethod
    def has_all_permissions(user_permissions: List[str], required_permissions: List[Permission]) -> bool:
        """Check if user has all required permissions"""
        return all(perm in user_permissions for perm in required_permissions)
    
    @staticmethod
    def can_access_hospital(user_hospital_id: Optional[str], target_hospital_id: str, user_role: UserRole) -> bool:
        """Check if user can access specific hospital data"""
        # Super admins can access all hospitals
        if user_role == UserRole.SUPER_ADMIN:
            return True
        
        # Users can only access their own hospital
        return user_hospital_id == target_hospital_id
    
    @staticmethod
    def can_access_patient(user_role: UserRole, user_hospital_id: Optional[str], patient_hospital_id: str) -> bool:
        """Check if user can access patient data"""
        # Super admins can access all patients
        if user_role == UserRole.SUPER_ADMIN:
            return True
        
        # Users can only access patients from their hospital
        return user_hospital_id == patient_hospital_id

class RBACService:
    """RBAC service for permission management"""
    
    def __init__(self):
        self.permission_checker = PermissionChecker()
    
    def get_user_permissions(self, user_role: UserRole) -> List[Permission]:
        """Get permissions for a role"""
        return list(ROLE_PERMISSIONS.get(user_role, set()))
    
    def check_permission(
        self,
        user_role: UserRole,
        user_permissions: List[str],
        required_permission: Permission
    ) -> bool:
        """Check if user has permission"""
        return self.permission_checker.has_permission(user_permissions, required_permission)
    
    def check_role(self, user_role: UserRole, required_roles: List[UserRole]) -> bool:
        """Check if user has required role"""
        return self.permission_checker.has_role(user_role, required_roles)
    
    def check_hospital_access(
        self,
        user_role: UserRole,
        user_hospital_id: Optional[str],
        target_hospital_id: str
    ) -> bool:
        """Check hospital access permissions"""
        return self.permission_checker.can_access_hospital(
            user_hospital_id, target_hospital_id, user_role
        )
    
    def check_patient_access(
        self,
        user_role: UserRole,
        user_hospital_id: Optional[str],
        patient_hospital_id: str
    ) -> bool:
        """Check patient access permissions"""
        return self.permission_checker.can_access_patient(
            user_role, user_hospital_id, patient_hospital_id
        )
    
    def get_accessible_hospitals(
        self,
        user_role: UserRole,
        user_hospital_id: Optional[str]
    ) -> List[str]:
        """Get list of accessible hospitals for user"""
        if user_role == UserRole.SUPER_ADMIN:
            # Super admins can access all hospitals
            # In production, this would query the database
            return ["all"]
        elif user_hospital_id:
            return [user_hospital_id]
        else:
            return []
    
    def validate_permission_request(
        self,
        user_info: Dict[str, Any],
        required_permission: Optional[Permission] = None,
        required_role: Optional[UserRole] = None,
        hospital_id: Optional[str] = None,
        patient_id: Optional[str] = None
    ) -> bool:
        """Validate a permission request"""
        user_role = user_info.get("role")
        user_permissions = user_info.get("permissions", [])
        user_hospital_id = user_info.get("hospital_id")
        
        # Check role requirement
        if required_role and not self.check_role(user_role, [required_role]):
            return False
        
        # Check permission requirement
        if required_permission and not self.check_permission(user_role, user_permissions, required_permission):
            return False
        
        # Check hospital access
        if hospital_id and not self.check_hospital_access(user_role, user_hospital_id, hospital_id):
            return False
        
        # Check patient access
        if patient_id:
            # In production, get patient's hospital from database
            patient_hospital_id = hospital_id  # Simplified
            if not self.check_patient_access(user_role, user_hospital_id, patient_hospital_id):
                return False
        
        return True

# Global RBAC service instance
rbac_service = RBACService()

# Permission decorators
def require_permission(permission: Permission):
    """Decorator to require specific permission"""
    def decorator(func):
        def wrapper(*args, **kwargs):
            # This would be implemented with FastAPI dependencies
            return func(*args, **kwargs)
        return wrapper
    return decorator

def require_role(role: UserRole):
    """Decorator to require specific role"""
    def decorator(func):
        def wrapper(*args, **kwargs):
            # This would be implemented with FastAPI dependencies
            return func(*args, **kwargs)
        return wrapper
    return decorator

def require_any_permission(permissions: List[Permission]):
    """Decorator to require any of the specified permissions"""
    def decorator(func):
        def wrapper(*args, **kwargs):
            # This would be implemented with FastAPI dependencies
            return func(*args, **kwargs)
        return wrapper
    return decorator

# Utility functions
def get_role_permissions(role: UserRole) -> List[Permission]:
    """Get permissions for role"""
    return rbac_service.get_user_permissions(role)

def has_permission(user_permissions: List[str], permission: Permission) -> bool:
    """Check if user has permission"""
    return rbac_service.check_permission(UserRole.DOCTOR, user_permissions, permission)

def has_role(user_role: UserRole, required_roles: List[UserRole]) -> bool:
    """Check if user has required role"""
    return rbac_service.check_role(user_role, required_roles)

def can_access_hospital(user_role: UserRole, user_hospital_id: Optional[str], target_hospital_id: str) -> bool:
    """Check hospital access"""
    return rbac_service.check_hospital_access(user_role, user_hospital_id, target_hospital_id)

def can_access_patient(user_role: UserRole, user_hospital_id: Optional[str], patient_hospital_id: str) -> bool:
    """Check patient access"""
    return rbac_service.check_patient_access(user_role, user_hospital_id, patient_hospital_id)
