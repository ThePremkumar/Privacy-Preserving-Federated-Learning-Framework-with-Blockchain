"""
System configuration management
"""

import os
from pydantic_settings import BaseSettings
from typing import List, Optional

class Settings(BaseSettings):
    """System settings for the platform"""
    # API Settings
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Federated Learning Healthcare Platform"
    DEBUG: bool = os.getenv("DEBUG", "True").lower() == "true"
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "CHANGE-ME-IN-PRODUCTION")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database (In production, use PostgreSQL or similar)
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./app.db")
    
    # Blockchain
    BLOCKCHAIN_URL: str = os.getenv("BLOCKCHAIN_URL", "http://localhost:8545")
    CONTRACT_ADDRESS: Optional[str] = os.getenv("CONTRACT_ADDRESS")
    BLOCKCHAIN_PRIVATE_KEY: Optional[str] = os.getenv("BLOCKCHAIN_PRIVATE_KEY")
    
    # CORS
    ALLOWED_ORIGINS: List[str] = ["*"]
    ALLOWED_HOSTS: List[str] = ["*"]
    
    # Federated Server Configuration
    FEDERATED_MIN_PARTICIPANTS: int = 3
    FEDERATED_MAX_PARTICIPANTS: int = 10

settings = Settings()

# Differential Privacy Configuration
DP_CONFIG = {
    "epsilon_default": 1.0,
    "delta_default": 1e-5,
    "max_privacy_budget": 10.0,
    "clipping_norm": 1.5,
    "noise_multiplier": 1.0,
    "noise_scale": 0.1
}

# Machine Learning Model Configuration
MODEL_CONFIG = {
    "input_dim": 784,
    "hidden_dim": 128,
    "output_dim": 10,
    "batch_size": 32,
    "epochs_per_round": 10,
    "learning_rate": 0.001
}

# Advanced Blockchain Configuration
BLOCKCHAIN_CONFIG = {
    "rpc_url": settings.BLOCKCHAIN_URL,
    "chain_id": 1337,  # Ganache/Localhost default
    "gas_limit": 3000000,
    "contract_address": settings.CONTRACT_ADDRESS,
    "private_key": settings.BLOCKCHAIN_PRIVATE_KEY
}
