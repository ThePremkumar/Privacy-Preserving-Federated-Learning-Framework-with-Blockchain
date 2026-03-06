from fastapi import FastAPI, HTTPException, Depends, status, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import torch
import numpy as np
from datetime import datetime
import logging
import os
from contextlib import asynccontextmanager

# Import our modules
from ..models.lstm import LSTMModel
from ..models.isolation_forest import IsolationForestTorch, HealthcareAnomalyDetector
from ..models.healthcare_models import LogisticRegressionMedical, RandomForestMedical, MedicalRiskAssessment
from ..federated.server import FederatedServer
from ..blockchain.audit_service import BlockchainAuditService, AuditTrailManager
from ..auth.auth_service import AuthenticationService, User, UserRole, Permission

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Security
security = HTTPBearer()

# Global variables
auth_service = None
blockchain_service = None
audit_manager = None
federated_server = None
global_model = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    global auth_service, blockchain_service, audit_manager, federated_server, global_model
    
    logger.info("Starting Federated Learning Backend...")
    
    # Initialize authentication service
    secret_key = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
    auth_service = AuthenticationService(secret_key)
    
    # Initialize blockchain service
    blockchain_url = os.getenv("BLOCKCHAIN_URL", "http://localhost:8545")
    contract_address = os.getenv("CONTRACT_ADDRESS")
    private_key = os.getenv("BLOCKCHAIN_PRIVATE_KEY")
    
    blockchain_service = BlockchainAuditService(blockchain_url, contract_address, private_key)
    audit_manager = AuditTrailManager(blockchain_service)
    
    # Initialize global model
    global_model = LSTMModel(input_size=784, hidden_size=128, num_classes=10)
    federated_server = FederatedServer(global_model)
    
    logger.info("Backend initialization complete")
    
    yield
    
    logger.info("Shutting down Federated Learning Backend...")

# Create FastAPI app
app = FastAPI(
    title="Federated Learning Healthcare API",
    description="Privacy-preserving federated learning framework for healthcare data analytics",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

class TrainingRoundRequest(BaseModel):
    round_number: int
    participating_hospitals: List[str]
    convergence_threshold: float = 0.001

class ModelWeightsSubmission(BaseModel):
    hospital_id: str
    round_number: int
    weights: List[List[float]]
    data_size: int
    accuracy: float
    loss: float

class PatientDataRequest(BaseModel):
    patient_id: str
    vital_signs: List[float]
    lab_results: List[float]
    timestamp: datetime

class PredictionRequest(BaseModel):
    patient_data: Dict[str, List[float]]
    model_type: str = "lstm"

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

# Authentication endpoints
@app.post("/api/v1/auth/login")
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

@app.post("/api/v1/auth/register")
async def register_user(user_data: RegisterUserRequest):
    """Register a new user"""
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

@app.post("/api/v1/auth/register-hospital")
async def register_hospital(hospital_data: RegisterHospitalRequest, 
                          current_user: User = Depends(require_permission(Permission.MANAGE_HOSPITALS))):
    """Register a new hospital"""
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

# Federated learning endpoints
@app.post("/api/v1/federated/start-round")
async def start_training_round(round_data: TrainingRoundRequest,
                             current_user: User = Depends(require_permission(Permission.MONITOR_TRAINING))):
    """Start a new federated learning round"""
    try:
        # Log training round initiation
        tx_hash = audit_manager.create_training_round_record(
            round_number=round_data.round_number,
            model_parameters=federated_server.get_global_parameters(),
            participating_hospitals=round_data.participating_hospitals,
            accuracy=0.0,  # Will be updated after aggregation
            loss=0.0,
            data_points=0,
            convergence_achieved=False
        )
        
        return {
            "message": "Training round started",
            "round_number": round_data.round_number,
            "transaction_hash": tx_hash,
            "participating_hospitals": round_data.participating_hospitals
        }
    except Exception as e:
        logger.error(f"Start training round error: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@app.post("/api/v1/federated/submit-weights")
async def submit_model_weights(weights_data: ModelWeightsSubmission,
                             current_user: User = Depends(require_permission(Permission.SUBMIT_WEIGHTS))):
    """Submit model weights from a hospital"""
    try:
        # Verify hospital authorization
        if current_user.role == UserRole.HOSPITAL and current_user.hospital_id != weights_data.hospital_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to submit weights for this hospital"
            )
        
        # Convert weights to tensors
        weight_tensors = []
        for weight_list in weights_data.weights:
            weight_tensors.append(torch.tensor(weight_list))
        
        # Store weights for aggregation (in production, use proper storage)
        if not hasattr(federated_server, 'submitted_weights'):
            federated_server.submitted_weights = {}
        
        if weights_data.round_number not in federated_server.submitted_weights:
            federated_server.submitted_weights[weights_data.round_number] = []
        
        federated_server.submitted_weights[weights_data.round_number].append({
            'hospital_id': weights_data.hospital_id,
            'weights': weight_tensors,
            'data_size': weights_data.data_size,
            'accuracy': weights_data.accuracy,
            'loss': weights_data.loss
        })
        
        # Log model update
        audit_manager.create_model_update_record(
            hospital_id=weights_data.hospital_id,
            model_parameters=weight_tensors,
            previous_hash="",  # Would track previous hash in production
            update_type="training",
            metadata={
                'round_number': weights_data.round_number,
                'data_size': weights_data.data_size,
                'accuracy': weights_data.accuracy,
                'loss': weights_data.loss
            }
        )
        
        return {
            "message": "Weights submitted successfully",
            "round_number": weights_data.round_number,
            "hospital_id": weights_data.hospital_id
        }
    except Exception as e:
        logger.error(f"Submit weights error: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@app.post("/api/v1/federated/aggregate")
async def aggregate_models(round_number: int,
                          current_user: User = Depends(require_permission(Permission.MONITOR_TRAINING))):
    """Aggregate submitted model weights"""
    try:
        # Get submitted weights for the round
        if not hasattr(federated_server, 'submitted_weights'):
            federated_server.submitted_weights = {}
        
        if round_number not in federated_server.submitted_weights:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No weights submitted for this round"
            )
        
        submissions = federated_server.submitted_weights[round_number]
        
        # Extract weights and data sizes for aggregation
        client_weights = [sub['weights'] for sub in submissions]
        data_sizes = [sub['data_size'] for sub in submissions]
        
        # Perform federated averaging
        aggregated_weights = federated_server.fed_avg_aggregation(client_weights, data_sizes)
        
        # Update global model
        federated_server.update_global_model(aggregated_weights)
        
        # Calculate average metrics
        avg_accuracy = np.mean([sub['accuracy'] for sub in submissions])
        avg_loss = np.mean([sub['loss'] for sub in submissions])
        total_data_points = sum(data_sizes)
        
        # Log aggregation to blockchain
        tx_hash = audit_manager.create_training_round_record(
            round_number=round_number,
            model_parameters=aggregated_weights,
            participating_hospitals=[sub['hospital_id'] for sub in submissions],
            accuracy=avg_accuracy,
            loss=avg_loss,
            data_points=total_data_points,
            convergence_achieved=True
        )
        
        # Clear submitted weights for this round
        del federated_server.submitted_weights[round_number]
        
        return {
            "message": "Model aggregation completed",
            "round_number": round_number,
            "average_accuracy": avg_accuracy,
            "average_loss": avg_loss,
            "total_data_points": total_data_points,
            "transaction_hash": tx_hash
        }
    except Exception as e:
        logger.error(f"Aggregation error: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@app.get("/api/v1/federated/global-model")
async def get_global_model(current_user: User = Depends(require_permission(Permission.VIEW_GLOBAL_MODEL))):
    """Get current global model parameters"""
    try:
        global_params = federated_server.get_global_parameters()
        
        # Convert tensors to lists for JSON serialization
        params_list = []
        for param in global_params:
            params_list.append(param.numpy().tolist())
        
        return {
            "model_parameters": params_list,
            "model_type": "LSTM",
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Get global model error: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# Healthcare prediction endpoints
@app.post("/api/v1/predict/disease")
async def predict_disease(prediction_data: PredictionRequest,
                        current_user: User = Depends(require_permission(Permission.VIEW_PREDICTIONS))):
    """Make disease prediction using global model"""
    try:
        # Convert patient data to tensor
        if prediction_data.model_type == "lstm":
            # Prepare data for LSTM model
            patient_tensor = torch.tensor(prediction_data.patient_data['clinical_features'])
            
            # Reshape for LSTM: (batch_size, seq_len, input_size)
            patient_tensor = patient_tensor.view(1, 1, -1)
            
            # Get prediction
            with torch.no_grad():
                global_model.eval()
                output = global_model(patient_tensor)
                probabilities = torch.softmax(output, dim=1)
                prediction = torch.argmax(probabilities, dim=1)
            
            return {
                "prediction": prediction.item(),
                "probabilities": probabilities.numpy().tolist(),
                "model_type": "LSTM",
                "timestamp": datetime.utcnow().isoformat()
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unsupported model type"
            )
    except Exception as e:
        logger.error(f"Disease prediction error: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@app.post("/api/v1/predict/anomalies")
async def detect_anomalies(patient_data: PatientDataRequest,
                         current_user: User = Depends(require_permission(Permission.VIEW_ANOMALIES))):
    """Detect anomalies in patient data"""
    try:
        # Initialize anomaly detector
        anomaly_detector = HealthcareAnomalyDetector()
        
        # Prepare patient data
        vital_signs = np.array(patient_data.vital_signs).reshape(1, -1)
        lab_results = np.array(patient_data.lab_results).reshape(1, -1)
        
        patient_dict = {
            'vital_signs': vital_signs,
            'lab_results': lab_results
        }
        
        # Fit the detector on the provided data
        # In production, this would be pre-trained
        anomaly_detector.fit_vital_signs(vital_signs)
        anomaly_detector.fit_lab_results(lab_results)
        
        # Detect anomalies
        anomaly_results = anomaly_detector.detect_anomalies(patient_dict)
        
        return {
            "patient_id": patient_data.patient_id,
            "anomaly_results": anomaly_results,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Anomaly detection error: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# Audit and compliance endpoints
@app.get("/api/v1/audit/training-rounds")
async def get_training_rounds(limit: int = 100,
                            current_user: User = Depends(require_permission(Permission.VIEW_AUDIT_TRAIL))):
    """Get training round audit trail"""
    try:
        audit_trail = blockchain_service.get_audit_trail(limit)
        return {
            "audit_trail": audit_trail,
            "total_records": len(audit_trail)
        }
    except Exception as e:
        logger.error(f"Get audit trail error: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@app.get("/api/v1/audit/compliance-report")
async def get_compliance_report(start_time: Optional[int] = None,
                              end_time: Optional[int] = None,
                              current_user: User = Depends(require_permission(Permission.GENERATE_REPORTS))):
    """Generate compliance report"""
    try:
        report = blockchain_service.generate_compliance_report(start_time, end_time)
        return report
    except Exception as e:
        logger.error(f"Compliance report error: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@app.get("/api/v1/audit/verify-integrity/{round_number}")
async def verify_model_integrity(round_number: int,
                                current_user: User = Depends(require_permission(Permission.VERIFY_INTEGRITY))):
    """Verify model integrity for a specific round"""
    try:
        # Get current global model hash
        current_params = federated_server.get_global_parameters()
        current_hash = blockchain_service.calculate_model_hash(current_params)
        
        # Verify against blockchain record
        is_valid = blockchain_service.verify_model_integrity(round_number, current_hash)
        
        return {
            "round_number": round_number,
            "current_model_hash": current_hash,
            "integrity_verified": is_valid,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Integrity verification error: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# System status endpoints
@app.get("/api/v1/status/health")
async def health_check():
    """Health check endpoint"""
    try:
        blockchain_status = blockchain_service.get_blockchain_status()
        
        return {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "blockchain_status": blockchain_status,
            "federated_server": {
                "is_initialized": federated_server is not None,
                "global_model_type": "LSTM"
            }
        }
    except Exception as e:
        logger.error(f"Health check error: {e}")
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }

@app.get("/api/v1/status/hospitals")
async def get_hospitals(current_user: User = Depends(get_current_user)):
    """Get list of registered hospitals"""
    try:
        hospitals = auth_service.get_all_hospitals()
        return {
            "hospitals": [
                {
                    "id": h.id,
                    "name": h.name,
                    "contact_email": h.contact_email,
                    "is_active": h.is_active
                }
                for h in hospitals
            ]
        }
    except Exception as e:
        logger.error(f"Get hospitals error: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# Error handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.detail, "status_code": exc.status_code}
    )

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "status_code": 500}
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
