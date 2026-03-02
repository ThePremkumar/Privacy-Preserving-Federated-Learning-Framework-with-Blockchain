"""
Security utilities for JWT, hashing, and audit logging
"""

from datetime import datetime, timedelta
import hashlib
from typing import Any, Dict, Optional, Union
from jose import jwt, JWTError
from passlib.context import CryptContext
import logging
from app.core.config import settings

# Configure logging
logger = logging.getLogger(__name__)

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against its hashed version"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Get the salted hash of a password"""
    return pwd_context.hash(password)

def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Create a new JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def create_refresh_token(data: Dict[str, Any]) -> str:
    """Create a long-lived JWT refresh token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=30)
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def decode_token(token: str) -> Optional[Dict[str, Any]]:
    """Decode and verify a JWT token"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError as e:
        logger.warning(f"Failed to decode token: {e}")
        return None

class AuditLogger:
    """Enterprise audit logger for compliance"""
    def log_access(self, user_id: str, action: str, resource: str, success: bool, details: Optional[Dict] = None):
        """Log a security or access event"""
        event = {
            "timestamp": datetime.utcnow().isoformat(),
            "user_id": user_id,
            "action": action,
            "resource": resource,
            "success": success,
            "details": details or {}
        }
        logger.info(f"AUDIT EVENT: {event}")

    def log_privacy_usage(self, user_id: str, hospital_id: str, epsilon_used: float, delta_used: float, round_number: int):
        """Log differential privacy budget consumption"""
        event = {
            "timestamp": datetime.utcnow().isoformat(),
            "user_id": user_id,
            "hospital_id": hospital_id,
            "epsilon": epsilon_used,
            "delta": delta_used,
            "round": round_number,
            "action": "privacy_consumption"
        }
        logger.info(f"PRIVACY EVENT: {event}")

def compute_data_hash(data: str) -> str:
    """Compute SHA-256 hash of arbitrary string data"""
    return hashlib.sha256(data.encode()).hexdigest()

audit_logger = AuditLogger()
