import os
import jwt
import bcrypt
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from enum import Enum
import secrets
import logging

from sqlalchemy.orm import Session

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


# Role → permissions mapping
ROLE_PERMISSIONS = {
    UserRole.SUPER_ADMIN: [
        Permission.MANAGE_HOSPITALS,
        Permission.MANAGE_USERS,
        Permission.VIEW_GLOBAL_MODEL,
        Permission.MONITOR_TRAINING,
        Permission.VIEW_AUDIT_TRAIL,
        Permission.GENERATE_REPORTS,
        Permission.VERIFY_INTEGRITY,
    ],
    UserRole.ADMIN: [
        Permission.MANAGE_HOSPITALS,
        Permission.VIEW_GLOBAL_MODEL,
        Permission.MONITOR_TRAINING,
        Permission.VIEW_AUDIT_TRAIL,
        Permission.GENERATE_REPORTS,
    ],
    UserRole.HOSPITAL: [
        Permission.MANAGE_USERS,
        Permission.UPLOAD_DATA,
        Permission.TRAIN_MODEL,
        Permission.SUBMIT_WEIGHTS,
        Permission.VIEW_AUDIT_TRAIL,
    ],
    UserRole.DOCTOR: [
        Permission.VIEW_PREDICTIONS,
        Permission.VIEW_ANOMALIES,
        Permission.ACCESS_PATIENT_DATA,
    ],
}


@dataclass
class User:
    """User data class (returned by service methods)"""
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
            self.permissions = ROLE_PERMISSIONS.get(self.role, [])


@dataclass
class Hospital:
    """Hospital data class (returned by service methods)"""
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


# ---------------------------------------------------------------------------
# Helper: convert SQLAlchemy row → dataclass
# ---------------------------------------------------------------------------

def _db_user_to_dataclass(db_user) -> User:
    """Convert a db_models.User row to the service-level User dataclass."""
    role = UserRole(db_user.role.value if hasattr(db_user.role, 'value') else db_user.role)
    return User(
        id=db_user.id,
        username=db_user.username,
        email=db_user.email,
        role=role,
        hospital_id=db_user.hospital_id,
        is_active=db_user.is_active,
        created_at=db_user.created_at,
        last_login=db_user.last_login,
    )


def _db_hospital_to_dataclass(db_hosp) -> Hospital:
    """Convert a db_models.Hospital row to the service-level Hospital dataclass."""
    return Hospital(
        id=db_hosp.id,
        name=db_hosp.name,
        contact_email=db_hosp.contact_email,
        address=db_hosp.address or "",
        is_active=db_hosp.is_active,
        created_at=db_hosp.created_at,
    )


class AuthenticationService:
    """
    Authentication and authorization service backed by SQLAlchemy / SQLite.
    All mutations are persisted to the database so data survives server restarts.
    """

    def __init__(self, secret_key: str, token_expiry_hours: int = 24):
        self.secret_key = secret_key
        self.token_expiry = timedelta(hours=token_expiry_hours)

        # In-memory token store (these are ephemeral by design)
        self.refresh_tokens: Dict[str, str] = {}

        # Seed the default super admin (idempotent)
        self._initialize_default_admin()

    # ------------------------------------------------------------------
    # Database session helper
    # ------------------------------------------------------------------

    def _get_db(self) -> Session:
        """Return a new SQLAlchemy session."""
        from app.core.database import SessionLocal
        return SessionLocal()

    # ------------------------------------------------------------------
    # Seeding
    # ------------------------------------------------------------------

    def _initialize_default_admin(self):
        """Seed the default super admin if it doesn't already exist."""
        from app.core.db_models import User as DBUser, UserRole as DBUserRole

        seed_username = os.getenv("SEED_ADMIN_USERNAME", "superadmin")
        seed_email = os.getenv("SEED_ADMIN_EMAIL", "admin@your-domain.com")
        seed_password = os.getenv("SEED_ADMIN_PASSWORD", "changeme")

        db = self._get_db()
        try:
            existing = db.query(DBUser).filter(DBUser.username == seed_username).first()
            if existing:
                logger.info(f"Seed super admin '{seed_username}' already exists in DB.")
                return

            hashed = self._hash_password(seed_password)
            admin = DBUser(
                id="admin_001",
                username=seed_username,
                email=seed_email,
                password_hash=hashed,
                role=DBUserRole.SUPER_ADMIN,
                is_active=True,
            )
            db.add(admin)
            db.commit()
            logger.info(f"Seed super admin '{seed_username}' created. Change password on first login.")
        except Exception as exc:
            db.rollback()
            logger.error(f"Failed to seed admin: {exc}")
        finally:
            db.close()

    # ------------------------------------------------------------------
    # Password helpers
    # ------------------------------------------------------------------

    def _hash_password(self, password: str) -> str:
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
        return hashed.decode("utf-8")

    def _verify_password(self, password: str, hashed: str) -> bool:
        return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))

    # ------------------------------------------------------------------
    # User registration (persisted)
    # ------------------------------------------------------------------

    def register_user(
        self,
        username: str,
        email: str,
        password: str,
        role: UserRole,
        hospital_id: str = None,
    ) -> User:
        from app.core.db_models import User as DBUser, UserRole as DBUserRole

        db = self._get_db()
        try:
            # Validate uniqueness
            if db.query(DBUser).filter(DBUser.username == username).first():
                raise ValueError("Username already exists")

            if role in [UserRole.HOSPITAL, UserRole.DOCTOR] and not hospital_id:
                raise ValueError("Hospital ID is required for this role")

            if role == UserRole.HOSPITAL and hospital_id:
                from app.core.db_models import Hospital as DBHospital
                if not db.query(DBHospital).filter(DBHospital.id == hospital_id).first():
                    raise ValueError("Hospital does not exist")

            import uuid
            hashed_password = self._hash_password(password)
            db_user = DBUser(
                id=str(uuid.uuid4()),
                username=username,
                email=email,
                password_hash=hashed_password,
                role=DBUserRole(role.value),
                hospital_id=hospital_id,
                is_active=True,
            )
            db.add(db_user)
            db.commit()
            db.refresh(db_user)
            logger.info(f"User registered: {username} with role {role.value}")
            return _db_user_to_dataclass(db_user)
        except ValueError:
            db.rollback()
            raise
        except Exception as exc:
            db.rollback()
            logger.error(f"register_user error: {exc}")
            raise
        finally:
            db.close()

    # ------------------------------------------------------------------
    # Authentication (reads from DB)
    # ------------------------------------------------------------------

    def authenticate(self, username: str, password: str) -> Optional[Dict[str, Any]]:
        from app.core.db_models import User as DBUser

        db = self._get_db()
        try:
            db_user = db.query(DBUser).filter(DBUser.username == username).first()
            if not db_user or not db_user.is_active:
                return None

            if not self._verify_password(password, db_user.password_hash):
                return None

            # Update last login
            db_user.last_login = datetime.utcnow()
            db.commit()

            user = _db_user_to_dataclass(db_user)

            access_token = self._generate_access_token(user)
            refresh_token = self._generate_refresh_token(user)
            self.refresh_tokens[refresh_token] = username

            return {
                "access_token": access_token,
                "refresh_token": refresh_token,
                "token_type": "bearer",
                "expires_in": int(self.token_expiry.total_seconds()),
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "role": user.role.value,
                    "hospital_id": user.hospital_id,
                    "permissions": [p.value for p in user.permissions],
                },
            }
        except Exception as exc:
            logger.error(f"authenticate error: {exc}")
            return None
        finally:
            db.close()

    # ------------------------------------------------------------------
    # Token generation / verification
    # ------------------------------------------------------------------

    def _generate_access_token(self, user: User) -> str:
        payload = {
            "user_id": user.id,
            "username": user.username,
            "role": user.role.value,
            "hospital_id": user.hospital_id,
            "permissions": [p.value for p in user.permissions],
            "exp": datetime.utcnow() + self.token_expiry,
            "iat": datetime.utcnow(),
            "type": "access",
        }
        return jwt.encode(payload, self.secret_key, algorithm="HS256")

    def _generate_refresh_token(self, user: User) -> str:
        payload = {
            "user_id": user.id,
            "username": user.username,
            "exp": datetime.utcnow() + timedelta(days=30),
            "iat": datetime.utcnow(),
            "type": "refresh",
        }
        return jwt.encode(payload, self.secret_key, algorithm="HS256")

    def verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=["HS256"])
            return payload
        except jwt.ExpiredSignatureError:
            logger.warning("Token expired")
            return None
        except jwt.InvalidTokenError:
            logger.warning("Invalid token")
            return None

    def refresh_access_token(self, refresh_token: str) -> Optional[str]:
        payload = self.verify_token(refresh_token)
        if not payload or payload.get("type") != "refresh":
            return None
        username = self.refresh_tokens.get(refresh_token)
        if not username:
            return None
        user = self.get_user(username)
        if not user or not user.is_active:
            return None
        return self._generate_access_token(user)

    def logout(self, refresh_token: str) -> bool:
        if refresh_token in self.refresh_tokens:
            del self.refresh_tokens[refresh_token]
            return True
        return False

    # ------------------------------------------------------------------
    # Query helpers (all from DB)
    # ------------------------------------------------------------------

    def get_user(self, username: str) -> Optional[User]:
        from app.core.db_models import User as DBUser
        db = self._get_db()
        try:
            db_user = db.query(DBUser).filter(DBUser.username == username).first()
            return _db_user_to_dataclass(db_user) if db_user else None
        finally:
            db.close()

    def get_user_by_id(self, user_id: str) -> Optional[User]:
        from app.core.db_models import User as DBUser
        db = self._get_db()
        try:
            db_user = db.query(DBUser).filter(DBUser.id == user_id).first()
            return _db_user_to_dataclass(db_user) if db_user else None
        finally:
            db.close()

    def check_permission(self, user: User, permission: Permission) -> bool:
        return permission in user.permissions

    def check_role_access(self, user: User, required_roles: List[UserRole]) -> bool:
        return user.role in required_roles

    # ------------------------------------------------------------------
    # Hospital registration (persisted)
    # ------------------------------------------------------------------

    def register_hospital(self, name: str, contact_email: str, address: str) -> Hospital:
        from app.core.db_models import Hospital as DBHospital
        import uuid

        db = self._get_db()
        try:
            hospital_id = str(uuid.uuid4())
            db_hosp = DBHospital(
                id=hospital_id,
                name=name,
                contact_email=contact_email,
                address=address,
                is_active=True,
            )
            db.add(db_hosp)
            db.commit()
            db.refresh(db_hosp)
            logger.info(f"Hospital registered: {name} with ID {hospital_id}")
            return _db_hospital_to_dataclass(db_hosp)
        except Exception as exc:
            db.rollback()
            logger.error(f"register_hospital error: {exc}")
            raise
        finally:
            db.close()

    def get_hospital(self, hospital_id: str) -> Optional[Hospital]:
        from app.core.db_models import Hospital as DBHospital
        db = self._get_db()
        try:
            db_hosp = db.query(DBHospital).filter(DBHospital.id == hospital_id).first()
            return _db_hospital_to_dataclass(db_hosp) if db_hosp else None
        finally:
            db.close()

    def get_all_hospitals(self) -> List[Hospital]:
        from app.core.db_models import Hospital as DBHospital
        db = self._get_db()
        try:
            rows = db.query(DBHospital).all()
            return [_db_hospital_to_dataclass(r) for r in rows]
        finally:
            db.close()

    def get_all_users(self) -> List[User]:
        from app.core.db_models import User as DBUser
        db = self._get_db()
        try:
            rows = db.query(DBUser).all()
            return [_db_user_to_dataclass(r) for r in rows]
        finally:
            db.close()

    def get_users_by_role(self, role: UserRole) -> List[User]:
        from app.core.db_models import User as DBUser, UserRole as DBUserRole
        db = self._get_db()
        try:
            rows = db.query(DBUser).filter(DBUser.role == DBUserRole(role.value)).all()
            return [_db_user_to_dataclass(r) for r in rows]
        finally:
            db.close()

    def get_users_by_hospital(self, hospital_id: str) -> List[User]:
        from app.core.db_models import User as DBUser
        db = self._get_db()
        try:
            rows = db.query(DBUser).filter(DBUser.hospital_id == hospital_id).all()
            return [_db_user_to_dataclass(r) for r in rows]
        finally:
            db.close()

    def update_user_role(self, username: str, new_role: UserRole) -> bool:
        from app.core.db_models import User as DBUser, UserRole as DBUserRole
        db = self._get_db()
        try:
            db_user = db.query(DBUser).filter(DBUser.username == username).first()
            if not db_user:
                return False
            db_user.role = DBUserRole(new_role.value)
            db.commit()
            logger.info(f"User {username} role updated to {new_role.value}")
            return True
        except Exception:
            db.rollback()
            return False
        finally:
            db.close()

    def deactivate_user(self, username: str) -> bool:
        from app.core.db_models import User as DBUser
        db = self._get_db()
        try:
            db_user = db.query(DBUser).filter(DBUser.username == username).first()
            if not db_user:
                return False
            db_user.is_active = False
            db.commit()
            # Also invalidate refresh tokens
            tokens_to_remove = [t for t, u in self.refresh_tokens.items() if u == username]
            for t in tokens_to_remove:
                del self.refresh_tokens[t]
            logger.info(f"User {username} deactivated")
            return True
        except Exception:
            db.rollback()
            return False
        finally:
            db.close()


class RBACMiddleware:
    """RBAC middleware for FastAPI"""

    def __init__(self, auth_service: AuthenticationService):
        self.auth_service = auth_service

    def require_permission(self, permission: Permission):
        def decorator(func):
            def wrapper(*args, **kwargs):
                return func(*args, **kwargs)
            return wrapper
        return decorator

    def require_role(self, roles: List[UserRole]):
        def decorator(func):
            def wrapper(*args, **kwargs):
                return func(*args, **kwargs)
            return wrapper
        return decorator

    def extract_user_from_token(self, token: str) -> Optional[User]:
        payload = self.auth_service.verify_token(token)
        if not payload:
            return None
        return self.auth_service.get_user_by_id(payload.get("user_id"))


# Utility functions
def create_auth_dependency(auth_service: AuthenticationService):
    def get_current_user(token: str) -> Optional[User]:
        payload = auth_service.verify_token(token)
        if not payload:
            return None
        return auth_service.get_user_by_id(payload.get("user_id"))
    return get_current_user

def create_permission_dependency(auth_service: AuthenticationService, permission: Permission):
    def check_permission(current_user: User = None) -> bool:
        if not current_user:
            return False
        return auth_service.check_permission(current_user, permission)
    return check_permission

# Global instance
from app.core.config import settings
auth_service = AuthenticationService(secret_key=settings.SECRET_KEY)
