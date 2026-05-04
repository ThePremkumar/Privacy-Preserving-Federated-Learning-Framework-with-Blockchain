"""
Production-ready FastAPI application for Privacy-Preserving Federated Learning Healthcare Platform
Enterprise SaaS Architecture for 100+ hospitals with HIPAA-like compliance
""" 


from fastapi import FastAPI, Request, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import logging
import time
import uuid
from typing import Dict, Any

# Core imports
from app.core.config import settings
from app.core.database import init_db, get_db

# Initialize DB tables before importing services that might seed data
init_db()

from app.api import auth, federated, blockchain, predictions, admin, hospital, doctor, patients, data_upload, training
from app.services.blockchain_service import blockchain_service
from app.services.federated_service import federated_service
from app.services.auth_service import auth_service

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/app.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Request ID middleware
async def add_request_id(request: Request, call_next):
    request_id = str(uuid.uuid4())
    request.state.request_id = request_id
    
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Process-Time"] = str(process_time)
    
    logger.info(
        f"Request {request_id} - {request.method} {request.url.path} - "
        f"Status: {response.status_code} - Time: {process_time:.4f}s"
    )
    
    return response

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan management"""
    # Startup
    logger.info("🚀 Starting Federated Learning Healthcare Platform...")
    
    # Initialize SQLAlchemy database (now handled at top level)
    # init_db()
    
    # Initialize services
    # (In a real app, these might need async initialization)
    logger.info("✅ All services initialized successfully")
    
    yield
    
    # Shutdown
    logger.info("🛑 Shutting down services...")
    logger.info("✅ Services shut down gracefully")

# Create FastAPI application
app = FastAPI(
    title="Federated Learning Healthcare Platform",
    description="Enterprise SaaS for privacy-preserving federated learning with blockchain audit trails",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan
)

# Add middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "http://localhost:8001",
        "http://127.0.0.1:8001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_request_id_middleware(request: Request, call_next):
    request_id = str(uuid.uuid4())
    request.state.request_id = request_id
    
    # Skip logging for OPTIONS requests to reduce noise and potential issues
    if request.method == "OPTIONS":
        return await call_next(request)
        
    start_time = time.time()
    try:
        response = await call_next(request)
        process_time = time.time() - start_time
        
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Process-Time"] = str(process_time)
        
        logger.info(
            f"Request {request_id} - {request.method} {request.url.path} - "
            f"Status: {response.status_code} - Time: {process_time:.4f}s"
        )
        return response
    except Exception as e:
        logger.error(f"Middleware error for request {request_id}: {e}")
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal Server Error", "request_id": request_id}
        )

# Include routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(federated.router, prefix="/api/v1/federated", tags=["Federated Learning"])
app.include_router(blockchain.router, prefix="/api/v1/blockchain", tags=["Blockchain"])
app.include_router(predictions.router, prefix="/api/v1/predictions", tags=["Predictions"])
app.include_router(hospital.router, prefix="/api/v1/hospital", tags=["Hospital Operations"])
app.include_router(doctor.router, prefix="/api/v1/doctor", tags=["Doctor Operations"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["Administration"])
app.include_router(patients.router, prefix="/api/v1/patients", tags=["Patients Project"])
app.include_router(data_upload.router, prefix="/api/v1/data", tags=["Data Upload"])
app.include_router(training.router, prefix="/api/v1/training", tags=["Training"])

from app.api.catalog import router as catalog_router
app.include_router(catalog_router, prefix="/api/v1/catalog", tags=["Catalog"])

from app.api.departments import router as departments_router
app.include_router(departments_router, prefix="/api/v1/orgs", tags=["Departments"])

from app.api.websockets import router as websockets_router
app.include_router(websockets_router, prefix="/api/v1", tags=["WebSockets"])

from app.api.notifications import router as notifications_router
app.include_router(notifications_router, prefix="/api/v1/notifications", tags=["Notifications"])

# Health check endpoints
@app.get("/api/v1/status/health", tags=["System"])
async def health_check():
    """System health check"""
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
