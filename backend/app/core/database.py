"""
Database configuration and SQLAlchemy initialization.
Supports PostgreSQL for users and roles, with SQLite fallback.
"""

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from .config import settings
import logging

logger = logging.getLogger(__name__)

# SQLAlchemy setup
DATABASE_URL = settings.DATABASE_URL

# For SQLite, we need to allow same-thread access
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    DATABASE_URL, connect_args=connect_args
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    """Dependency for getting DB session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Initialize database tables"""
    try:
        # Import models to register them with Base before creating tables
        from app.core import db_models  # noqa: F401 – registers User, Hospital, AuditLog, DatasetUpload, DatasetRecord
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
