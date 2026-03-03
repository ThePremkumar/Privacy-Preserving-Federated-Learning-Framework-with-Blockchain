import jwt
import bcrypt
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from enum import Enum
import secrets
import logging

logger = logging.getLogger(__name__)

class UserRole(Enum):
    """User roles for the federated learning system"""
    SUPER_ADMIN = "super_admin"
    ADMIN = "admin"
    HOSPITAL = "hospital"
    DOCTOR = "doctor"

class Permission(Enum):
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

@dataclass
class User:
    """User data class"""
    id: str
    username: str
    email: str
    role: UserRole
    hospital_id: Optional[str] = None
    is_active: bool = True
    created_at: datetime = None
    last_login: datetime = None
    permissions: List[Permission] = None
    
    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.utcnow()
        if self.permissions is None:
            self.permissions = self._get_default_permissions()
    
    def _get_default_permissions(self) -> List[Permission]:
        """Get default permissions based on role"""
        role_permissions = {
            UserRole.SUPER_ADMIN: [
                Permission.MANAGE_HOSPITALS,
                Permission.MANAGE_USERS,
                Permission.VIEW_GLOBAL_MODEL,
                Permission.MONITOR_TRAINING,
                Permission.VIEW_AUDIT_TRAIL,
                Permission.GENERATE_REPORTS,
                Permission.VERIFY_INTEGRITY
            ],
            UserRole.ADMIN: [
                Permission.MANAGE_HOSPITALS,
                Permission.VIEW_GLOBAL_MODEL,
                Permission.MONITOR_TRAINING,
                Permission.VIEW_AUDIT_TRAIL,
                Permission.GENERATE_REPORTS
            ],
            UserRole.HOSPITAL: [
                Permission.MANAGE_USERS,
                Permission.UPLOAD_DATA,
                Permission.TRAIN_MODEL,
                Permission.SUBMIT_WEIGHTS,
                Permission.VIEW_AUDIT_TRAIL
            ],
            UserRole.DOCTOR: [
                Permission.VIEW_PREDICTIONS,
                Permission.VIEW_ANOMALIES,
                Permission.ACCESS_PATIENT_DATA
            ]
        }
        return role_permissions.get(self.role, [])

@dataclass
class Hospital:
    """Hospital data class"""
    id: str
    name: str
    contact_email: str
    address: str
    is_active: bool = True
    created_at: datetime = None
    compliance_certificates: List[str] = None
    
    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.utcnow()
        if self.compliance_certificates is None:
            self.compliance_certificates = []

class AuthenticationService:
    """
    Authentication and authorization service for federated learning
    """
    
    def __init__(self, secret_key: str, token_expiry_hours: int = 24):
        """
        Initialize authentication service
        
        Args:
            secret_key: Secret key for JWT tokens
            token_expiry_hours: Token expiry time in hours
        """
        self.secret_key = secret_key
        self.token_expiry = timedelta(hours=token_expiry_hours)
        
        # In-memory storage (in production, use database)
        self.users: Dict[str, User] = {}
        self.hospitals: Dict[str, Hospital] = {}
        self.refresh_tokens: Dict[str, str] = {}
        
        # Initialize default admin user
        self._initialize_default_admin()
    
    def _initialize_default_admin(self):
        """Initialize default users for all roles (demo/dev mode)"""
        self._password_hashes = {}
        
        # 1. Super Admin
        super_admin = User(
            id="admin_001",
            username="superadmin",
            email="admin@federated-learning.com",
            role=UserRole.SUPER_ADMIN
        )
        self.users[super_admin.username] = super_admin
        self._password_hashes[super_admin.username] = self._hash_password("admin123")
        
        # 2. Admin
        admin = User(
            id="admin_002",
            username="admin",
            email="admin@healthconnect.io",
            role=UserRole.ADMIN
        )
        self.users[admin.username] = admin
        self._password_hashes[admin.username] = self._hash_password("admin123")
        
        # 3. Demo Hospital
        demo_hospital = Hospital(
            id="hospital_001",
            name="Mayo Clinic Research",
            contact_email="admin@mayo.edu",
            address="Rochester, MN"
        )
        self.hospitals[demo_hospital.id] = demo_hospital
        
        # Second hospital
        demo_hospital_2 = Hospital(
            id="hospital_002",
            name="Johns Hopkins Medical",
            contact_email="fl-admin@jhmi.edu",
            address="Baltimore, MD"
        )
        self.hospitals[demo_hospital_2.id] = demo_hospital_2
        
        # 4. Hospital Admin
        hospital_admin = User(
            id="user_003",
            username="hospital_admin",
            email="admin@mayo.edu",
            role=UserRole.HOSPITAL,
            hospital_id="hospital_001"
        )
        self.users[hospital_admin.username] = hospital_admin
        self._password_hashes[hospital_admin.username] = self._hash_password("admin123")
        
        # 5. Doctor
        doctor = User(
            id="user_004",
            username="dr_chen",
            email="v.chen@mayo.edu",
            role=UserRole.DOCTOR,
            hospital_id="hospital_001"
        )
        self.users[doctor.username] = doctor
        self._password_hashes[doctor.username] = self._hash_password("admin123")
        
        logger.info("Demo users initialized: superadmin, admin, hospital_admin, dr_chen (all password: admin123)")
    
    def _hash_password(self, password: str) -> str:
        """Hash password using bcrypt"""
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
        return hashed.decode('utf-8')
    
    def _verify_password(self, password: str, hashed: str) -> bool:
        """Verify password against hash"""
        return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
    
    def register_user(self, username: str, email: str, password: str, 
                     role: UserRole, hospital_id: str = None) -> User:
        """
        Register a new user
        
        Args:
            username: Username
            email: Email address
            password: Plain text password
            role: User role
            hospital_id: Hospital ID (required for hospital and doctor roles)
            
        Returns:
            Created user object
        """
        # Validate input
        if username in self.users:
            raise ValueError("Username already exists")
        
        if role in [UserRole.HOSPITAL, UserRole.DOCTOR] and not hospital_id:
            raise ValueError("Hospital ID is required for this role")
        
        if role == UserRole.HOSPITAL and hospital_id not in self.hospitals:
            raise ValueError("Hospital does not exist")
        
        # Create user
        user = User(
            id=f"user_{len(self.users) + 1:03d}",
            username=username,
            email=email,
            role=role,
            hospital_id=hospital_id
        )
        
        # Hash and store password
        hashed_password = self._hash_password(password)
        self._password_hashes = getattr(self, '_password_hashes', {})
        self._password_hashes[username] = hashed_password
        
        # Store user
        self.users[username] = user
        
        logger.info(f"User registered: {username} with role {role.value}")
        return user
    
    def authenticate(self, username: str, password: str) -> Optional[Dict[str, Any]]:
        """
        Authenticate user and return tokens
        
        Args:
            username: Username
            password: Plain text password
            
        Returns:
            Dictionary with tokens and user info, or None if authentication fails
        """
        # Get user
        user = self.users.get(username)
        if not user or not user.is_active:
            return None
        
        # Verify password
        password_hashes = getattr(self, '_password_hashes', {})
        hashed_password = password_hashes.get(username)
        if not hashed_password or not self._verify_password(password, hashed_password):
            return None
        
        # Update last login
        user.last_login = datetime.utcnow()
        
        # Generate tokens
        access_token = self._generate_access_token(user)
        refresh_token = self._generate_refresh_token(user)
        
        # Store refresh token
        self.refresh_tokens[refresh_token] = username
        
        return {
            'access_token': access_token,
            'refresh_token': refresh_token,
            'token_type': 'bearer',
            'expires_in': int(self.token_expiry.total_seconds()),
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'role': user.role.value,
                'hospital_id': user.hospital_id,
                'permissions': [p.value for p in user.permissions]
            }
        }
    
    def _generate_access_token(self, user: User) -> str:
        """Generate JWT access token"""
        payload = {
            'user_id': user.id,
            'username': user.username,
            'role': user.role.value,
            'hospital_id': user.hospital_id,
            'permissions': [p.value for p in user.permissions],
            'exp': datetime.utcnow() + self.token_expiry,
            'iat': datetime.utcnow(),
            'type': 'access'
        }
        return jwt.encode(payload, self.secret_key, algorithm='HS256')
    
    def _generate_refresh_token(self, user: User) -> str:
        """Generate refresh token"""
        payload = {
            'user_id': user.id,
            'username': user.username,
            'exp': datetime.utcnow() + timedelta(days=30),
            'iat': datetime.utcnow(),
            'type': 'refresh'
        }
        return jwt.encode(payload, self.secret_key, algorithm='HS256')
    
    def verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        """
        Verify JWT token and return payload
        
        Args:
            token: JWT token
            
        Returns:
            Token payload if valid, None otherwise
        """
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=['HS256'])
            return payload
        except jwt.ExpiredSignatureError:
            logger.warning("Token expired")
            return None
        except jwt.InvalidTokenError:
            logger.warning("Invalid token")
            return None
    
    def refresh_access_token(self, refresh_token: str) -> Optional[str]:
        """
        Refresh access token using refresh token
        
        Args:
            refresh_token: Refresh token
            
        Returns:
            New access token if valid, None otherwise
        """
        payload = self.verify_token(refresh_token)
        if not payload or payload.get('type') != 'refresh':
            return None
        
        # Check if refresh token is still valid
        username = self.refresh_tokens.get(refresh_token)
        if not username:
            return None
        
        user = self.users.get(username)
        if not user or not user.is_active:
            return None
        
        # Generate new access token
        return self._generate_access_token(user)
    
    def logout(self, refresh_token: str) -> bool:
        """
        Logout user by invalidating refresh token
        
        Args:
            refresh_token: Refresh token to invalidate
            
        Returns:
            True if successful, False otherwise
        """
        if refresh_token in self.refresh_tokens:
            del self.refresh_tokens[refresh_token]
            return True
        return False
    
    def get_user(self, username: str) -> Optional[User]:
        """Get user by username"""
        return self.users.get(username)
    
    def get_user_by_id(self, user_id: str) -> Optional[User]:
        """Get user by ID"""
        for user in self.users.values():
            if user.id == user_id:
                return user
        return None
    
    def check_permission(self, user: User, permission: Permission) -> bool:
        """
        Check if user has specific permission
        
        Args:
            user: User object
            permission: Permission to check
            
        Returns:
            True if user has permission, False otherwise
        """
        return permission in user.permissions
    
    def check_role_access(self, user: User, required_roles: List[UserRole]) -> bool:
        """
        Check if user has any of the required roles
        
        Args:
            user: User object
            required_roles: List of required roles
            
        Returns:
            True if user has required role, False otherwise
        """
        return user.role in required_roles
    
    def register_hospital(self, name: str, contact_email: str, address: str) -> Hospital:
        """
        Register a new hospital
        
        Args:
            name: Hospital name
            contact_email: Contact email
            address: Hospital address
            
        Returns:
            Created hospital object
        """
        hospital_id = f"hospital_{len(self.hospitals) + 1:03d}"
        
        hospital = Hospital(
            id=hospital_id,
            name=name,
            contact_email=contact_email,
            address=address
        )
        
        self.hospitals[hospital_id] = hospital
        
        logger.info(f"Hospital registered: {name} with ID {hospital_id}")
        return hospital
    
    def get_hospital(self, hospital_id: str) -> Optional[Hospital]:
        """Get hospital by ID"""
        return self.hospitals.get(hospital_id)
    
    def get_all_hospitals(self) -> List[Hospital]:
        """Get all hospitals"""
        return list(self.hospitals.values())
    
    def get_all_users(self) -> List[User]:
        """Get all users"""
        return list(self.users.values())

    
    def get_users_by_role(self, role: UserRole) -> List[User]:
        """Get users by role"""
        return [user for user in self.users.values() if user.role == role]
    
    def get_users_by_hospital(self, hospital_id: str) -> List[User]:
        """Get users by hospital"""
        return [user for user in self.users.values() if user.hospital_id == hospital_id]
    
    def update_user_role(self, username: str, new_role: UserRole) -> bool:
        """
        Update user role
        
        Args:
            username: Username
            new_role: New role
            
        Returns:
            True if successful, False otherwise
        """
        user = self.users.get(username)
        if not user:
            return False
        
        user.role = new_role
        user.permissions = user._get_default_permissions()
        
        logger.info(f"User {username} role updated to {new_role.value}")
        return True
    
    def deactivate_user(self, username: str) -> bool:
        """
        Deactivate user account
        
        Args:
            username: Username
            
        Returns:
            True if successful, False otherwise
        """
        user = self.users.get(username)
        if not user:
            return False
        
        user.is_active = False
        
        # Invalidate all refresh tokens for this user
        tokens_to_remove = []
        for token, user_name in self.refresh_tokens.items():
            if user_name == username:
                tokens_to_remove.append(token)
        
        for token in tokens_to_remove:
            del self.refresh_tokens[token]
        
        logger.info(f"User {username} deactivated")
        return True


class RBACMiddleware:
    """
    RBAC middleware for FastAPI
    """
    
    def __init__(self, auth_service: AuthenticationService):
        self.auth_service = auth_service
    
    def require_permission(self, permission: Permission):
        """Decorator to require specific permission"""
        def decorator(func):
            def wrapper(*args, **kwargs):
                # This would be implemented as FastAPI middleware
                # For now, return the function as-is
                return func(*args, **kwargs)
            return wrapper
        return decorator
    
    def require_role(self, roles: List[UserRole]):
        """Decorator to require specific role"""
        def decorator(func):
            def wrapper(*args, **kwargs):
                # This would be implemented as FastAPI middleware
                # For now, return the function as-is
                return func(*args, **kwargs)
            return wrapper
        return decorator
    
    def extract_user_from_token(self, token: str) -> Optional[User]:
        """Extract user from JWT token"""
        payload = self.auth_service.verify_token(token)
        if not payload:
            return None
        
        return self.auth_service.get_user_by_id(payload.get('user_id'))


# Utility functions for FastAPI integration
def create_auth_dependency(auth_service: AuthenticationService):
    """Create FastAPI dependency for authentication"""
    def get_current_user(token: str) -> Optional[User]:
        payload = auth_service.verify_token(token)
        if not payload:
            return None
        return auth_service.get_user_by_id(payload.get('user_id'))
    return get_current_user

def create_permission_dependency(auth_service: AuthenticationService, permission: Permission):
    """Create FastAPI dependency for permission checking"""
    def check_permission(current_user: User = None) -> bool:
        if not current_user:
            return False
        return auth_service.check_permission(current_user, permission)
    return check_permission

# Global instance
from app.core.config import settings
auth_service = AuthenticationService(secret_key=settings.SECRET_KEY)
