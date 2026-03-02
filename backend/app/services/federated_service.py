"""
Federated Learning Service for Healthcare Platform
Enterprise-grade federated learning with differential privacy and blockchain audit
"""

import asyncio
import numpy as np
import torch
import torch.nn as nn
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timedelta
import logging
import json
from dataclasses import dataclass, asdict
import hashlib

from ..core.config import settings, DP_CONFIG, MODEL_CONFIG
from ..core.security import audit_logger, compute_data_hash
from ..models.federated import FederatedModel, FederatedRound
from ..services.blockchain_service import blockchain_service
from ..services.dp_service import dp_service

logger = logging.getLogger(__name__)

@dataclass
class HospitalUpdate:
    """Hospital model update for federated aggregation"""
    hospital_id: str
    weights: np.ndarray
    num_samples: int
    epsilon_used: float
    delta_used: float
    timestamp: datetime
    round_number: int
    update_hash: str

@dataclass
class AggregationResult:
    """Result of federated aggregation"""
    global_weights: np.ndarray
    participating_hospitals: List[str]
    total_samples: int
    epsilon_total: float
    delta_total: float
    round_number: int
    accuracy: Optional[float] = None
    loss: Optional[float] = None
    blockchain_tx_hash: Optional[str] = None

class FederatedLearningService:
    """Enterprise federated learning service"""
    
    def __init__(self):
        self.global_model = None
        self.current_round = None
        self.hospital_updates = {}
        self.round_history = []
        self.privacy_budget_usage = {}
        
        # Initialize global model
        self._initialize_global_model()
    
    async def initialize(self):
        """Initialize the federated learning service"""
        logger.info("Initializing Federated Learning Service...")
        
        # Load latest global model if exists
        await self._load_latest_model()
        
        # Initialize privacy budgets
        await self._initialize_privacy_budgets()
        
        logger.info("Federated Learning Service initialized")
    
    def _initialize_global_model(self):
        """Initialize the global model"""
        self.global_model = FederatedModel(
            input_dim=MODEL_CONFIG["input_dim"],
            hidden_dim=MODEL_CONFIG["hidden_dim"],
            output_dim=MODEL_CONFIG["output_dim"]
        )
        logger.info(f"Global model initialized with {self.global_model.get_parameter_count()} parameters")
    
    async def _load_latest_model(self):
        """Load the latest global model from storage"""
        # In production, load from database or file storage
        logger.info("Loading latest global model...")
        # Implementation would load model weights from storage
        pass
    
    async def _initialize_privacy_budgets(self):
        """Initialize privacy budgets for all hospitals"""
        # In production, load from database
        logger.info("Initializing privacy budgets...")
        # Implementation would load privacy budgets from database
        pass
    
    async def start_new_round(self, initiator_id: str) -> Dict[str, Any]:
        """Start a new federated learning round"""
        try:
            # Check if there's an active round
            if self.current_round and self.current_round.status == "active":
                raise ValueError("A round is already in progress")
            
            # Create new round
            round_number = len(self.round_history) + 1
            self.current_round = FederatedRound(
                round_number=round_number,
                status="active",
                start_time=datetime.utcnow(),
                global_model_weights=self.global_model.get_weights(),
                participating_hospitals=[],
                min_participants=settings.FEDERATED_MIN_PARTICIPANTS,
                max_participants=settings.FEDERATED_MAX_PARTICIPANTS
            )
            
            # Broadcast global model to hospitals
            await self._broadcast_global_model()
            
            # Log round start
            audit_logger.log_access(
                user_id=initiator_id,
                action="start_federated_round",
                resource=f"round_{round_number}",
                details={"round_number": round_number}
            )
            
            logger.info(f"Started federated round {round_number}")
            
            return {
                "round_number": round_number,
                "status": "active",
                "global_model_hash": compute_data_hash(str(self.global_model.get_weights().tolist())),
                "start_time": self.current_round.start_time.isoformat()
            }
            
        except Exception as e:
            logger.error(f"Failed to start new round: {e}")
            raise
    
    async def submit_hospital_update(
        self,
        hospital_id: str,
        weights: List[float],
        num_samples: int,
        epsilon_used: float,
        delta_used: float
    ) -> Dict[str, Any]:
        """Submit hospital model update"""
        try:
            # Validate current round
            if not self.current_round or self.current_round.status != "active":
                raise ValueError("No active round")
            
            # Check if hospital already submitted
            if hospital_id in self.hospital_updates:
                raise ValueError("Hospital already submitted update for this round")
            
            # Check privacy budget
            await self._check_privacy_budget(hospital_id, epsilon_used, delta_used)
            
            # Create update
            weights_array = np.array(weights)
            update_hash = compute_data_hash(f"{hospital_id}_{weights_array.tobytes()}")
            
            update = HospitalUpdate(
                hospital_id=hospital_id,
                weights=weights_array,
                num_samples=num_samples,
                epsilon_used=epsilon_used,
                delta_used=delta_used,
                timestamp=datetime.utcnow(),
                round_number=self.current_round.round_number,
                update_hash=update_hash
            )
            
            # Store update
            self.hospital_updates[hospital_id] = update
            
            # Update privacy budget
            await self._update_privacy_budget(hospital_id, epsilon_used, delta_used)
            
            # Check if ready for aggregation
            if len(self.hospital_updates) >= self.current_round.min_participants:
                await self._aggregate_updates()
            
            logger.info(f"Received update from hospital {hospital_id} for round {self.current_round.round_number}")
            
            return {
                "round_number": self.current_round.round_number,
                "status": "received",
                "update_hash": update_hash,
                "participants_count": len(self.hospital_updates)
            }
            
        except Exception as e:
            logger.error(f"Failed to submit hospital update: {e}")
            raise
    
    async def _check_privacy_budget(self, hospital_id: str, epsilon: float, delta: float):
        """Check if hospital has sufficient privacy budget"""
        current_budget = self.privacy_budget_usage.get(hospital_id, {"epsilon": 0.0, "delta": 0.0})
        
        if (current_budget["epsilon"] + epsilon) > DP_CONFIG["max_privacy_budget"]:
            raise ValueError(f"Insufficient privacy budget for hospital {hospital_id}")
        
        return True
    
    async def _update_privacy_budget(self, hospital_id: str, epsilon: float, delta: float):
        """Update privacy budget usage"""
        current = self.privacy_budget_usage.get(hospital_id, {"epsilon": 0.0, "delta": 0.0})
        
        self.privacy_budget_usage[hospital_id] = {
            "epsilon": current["epsilon"] + epsilon,
            "delta": current["delta"] + delta
        }
        
        # Log privacy usage
        audit_logger.log_privacy_usage(
            user_id=hospital_id,
            hospital_id=hospital_id,
            epsilon_used=epsilon,
            delta_used=delta,
            round_number=self.current_round.round_number
        )
    
    async def _aggregate_updates(self):
        """Aggregate hospital updates using FedAvg"""
        try:
            logger.info(f"Aggregating {len(self.hospital_updates)} hospital updates...")
            
            # Calculate total samples
            total_samples = sum(update.num_samples for update in self.hospital_updates.values())
            
            # Calculate weighted average
            weighted_weights = np.zeros_like(next(iter(self.hospital_updates.values())).weights)
            
            for update in self.hospital_updates.values():
                weight = update.num_samples / total_samples
                weighted_weights += weight * update.weights
            
            # Apply differential privacy to aggregated weights
            dp_weights = await dp_service.add_noise(weighted_weights, total_samples)
            
            # Update global model
            self.global_model.set_weights(dp_weights)
            
            # Create aggregation result
            result = AggregationResult(
                global_weights=dp_weights,
                participating_hospitals=list(self.hospital_updates.keys()),
                total_samples=total_samples,
                epsilon_total=sum(update.epsilon_used for update in self.hospital_updates.values()),
                delta_total=sum(update.delta_used for update in self.hospital_updates.values()),
                round_number=self.current_round.round_number
            )
            
            # Evaluate model (simplified)
            result.accuracy = await self._evaluate_model()
            result.loss = await self._calculate_loss()
            
            # Store on blockchain
            result.blockchain_tx_hash = await self._store_on_blockchain(result)
            
            # Update round status
            self.current_round.status = "completed"
            self.current_round.end_time = datetime.utcnow()
            self.current_round.participating_hospitals = result.participating_hospitals
            self.current_round.aggregation_result = asdict(result)
            
            # Add to history
            self.round_history.append(self.current_round)
            
            # Clear updates for next round
            self.hospital_updates.clear()
            
            logger.info(f"Round {result.round_number} completed with accuracy: {result.accuracy:.4f}")
            
        except Exception as e:
            logger.error(f"Aggregation failed: {e}")
            self.current_round.status = "failed"
            raise
    
    async def _evaluate_model(self) -> float:
        """Evaluate global model accuracy"""
        # In production, evaluate on test dataset
        # For now, return simulated accuracy
        base_accuracy = 0.85
        improvement = len(self.round_history) * 0.01
        return min(base_accuracy + improvement, 0.98)
    
    async def _calculate_loss(self) -> float:
        """Calculate model loss"""
        # In production, calculate on test dataset
        # For now, return simulated loss
        base_loss = 0.5
        reduction = len(self.round_history) * 0.02
        return max(base_loss - reduction, 0.1)
    
    async def _store_on_blockchain(self, result: AggregationResult) -> str:
        """Store aggregation result on blockchain"""
        try:
            # Prepare blockchain data
            blockchain_data = {
                "round_number": result.round_number,
                "model_hash": compute_data_hash(result.global_weights.tolist()),
                "participating_hospitals": result.participating_hospitals,
                "total_samples": result.total_samples,
                "epsilon_used": result.epsilon_total,
                "delta_used": result.delta_total,
                "accuracy": result.accuracy,
                "timestamp": datetime.utcnow().isoformat()
            }
            
            # Store on blockchain
            tx_hash = await blockchain_service.store_federated_round(blockchain_data)
            
            logger.info(f"Stored round {result.round_number} on blockchain: {tx_hash}")
            return tx_hash
            
        except Exception as e:
            logger.error(f"Failed to store on blockchain: {e}")
            return None
    
    async def _broadcast_global_model(self):
        """Broadcast global model to participating hospitals"""
        # In production, use WebSocket or message queue
        model_data = {
            "round_number": self.current_round.round_number,
            "model_weights": self.global_model.get_weights().tolist(),
            "model_hash": compute_data_hash(str(self.global_model.get_weights().tolist())),
            "timestamp": datetime.utcnow().isoformat()
        }
        
        logger.info(f"Broadcasting global model for round {self.current_round.round_number}")
        # Implementation would broadcast to hospitals
    
    async def get_round_status(self, round_number: Optional[int] = None) -> Dict[str, Any]:
        """Get status of federated round"""
        if round_number is None:
            round_number = self.current_round.round_number if self.current_round else len(self.round_history)
        
        # Find round
        target_round = None
        if self.current_round and self.current_round.round_number == round_number:
            target_round = self.current_round
        else:
            target_round = next((r for r in self.round_history if r.round_number == round_number), None)
        
        if not target_round:
            raise ValueError(f"Round {round_number} not found")
        
        return {
            "round_number": target_round.round_number,
            "status": target_round.status,
            "start_time": target_round.start_time.isoformat(),
            "end_time": target_round.end_time.isoformat() if target_round.end_time else None,
            "participating_hospitals": target_round.participating_hospitals,
            "min_participants": target_round.min_participants,
            "max_participants": target_round.max_participants,
            "aggregation_result": target_round.aggregation_result
        }
    
    async def get_global_model_info(self) -> Dict[str, Any]:
        """Get global model information"""
        return {
            "model_version": len(self.round_history),
            "parameter_count": self.global_model.get_parameter_count(),
            "model_hash": compute_data_hash(str(self.global_model.get_weights().tolist())),
            "last_updated": self.current_round.end_time.isoformat() if self.current_round else None,
            "current_round": self.current_round.round_number if self.current_round else None
        }
    
    async def get_round_count(self) -> int:
        """Get total number of completed rounds"""
        return len(self.round_history)
    
    async def get_privacy_budget_usage(self) -> Dict[str, Dict[str, float]]:
        """Get privacy budget usage for all hospitals"""
        return self.privacy_budget_usage

# Global service instance
federated_service = FederatedLearningService()
