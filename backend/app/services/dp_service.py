"""
Differential Privacy Service for Federated Learning Healthcare Platform
Enterprise-grade privacy protection with configurable epsilon-delta
"""

import numpy as np
import torch
from typing import Dict, Any, Optional, Tuple
import logging
from datetime import datetime

from ..core.config import DP_CONFIG
from ..core.security import audit_logger

logger = logging.getLogger(__name__)

class DifferentialPrivacyService:
    """Enterprise differential privacy service"""
    
    def __init__(self):
        self.epsilon_default = DP_CONFIG["epsilon_default"]
        self.delta_default = DP_CONFIG["delta_default"]
        self.max_privacy_budget = DP_CONFIG["max_privacy_budget"]
        self.noise_scale = DP_CONFIG["noise_scale"]
        
        # Privacy accounting
        self.privacy_ledger = {}
    
    async def add_noise(
        self,
        data: np.ndarray,
        num_samples: int,
        epsilon: Optional[float] = None,
        delta: Optional[float] = None,
        sensitivity: float = 1.0
    ) -> np.ndarray:
        """Add differential privacy noise to data"""
        try:
            # Use default values if not provided
            eps = epsilon or self.epsilon_default
            dlt = delta or self.delta_default
            
            # Calculate noise scale
            sigma = self._calculate_noise_scale(eps, dlt, sensitivity, num_samples)
            
            # Add Gaussian noise
            noise = np.random.normal(0, sigma, data.shape)
            
            # Apply noise
            noisy_data = data + noise * self.noise_scale
            
            logger.info(f"Added DP noise: epsilon={eps}, delta={dlt}, sigma={sigma:.6f}")
            
            return noisy_data
            
        except Exception as e:
            logger.error(f"Failed to add DP noise: {e}")
            raise
    
    def _calculate_noise_scale(
        self,
        epsilon: float,
        delta: float,
        sensitivity: float,
        num_samples: int
    ) -> float:
        """Calculate noise scale for Gaussian mechanism"""
        # Gaussian mechanism noise scale
        # sigma = sensitivity * sqrt(2 * ln(1.25/delta)) / epsilon
        
        if epsilon <= 0:
            raise ValueError("Epsilon must be positive")
        
        if delta <= 0 or delta >= 1:
            raise ValueError("Delta must be in (0, 1)")
        
        # Calculate noise scale
        noise_scale = sensitivity * np.sqrt(2 * np.log(1.25 / delta)) / epsilon
        
        # Adjust for dataset size
        noise_scale = noise_scale / np.sqrt(num_samples)
        
        return noise_scale
    
    async def apply_dp_to_weights(
        self,
        weights: np.ndarray,
        num_samples: int,
        epsilon: float,
        delta: float
    ) -> Tuple[np.ndarray, Dict[str, Any]]:
        """Apply differential privacy to model weights"""
        try:
            # Calculate sensitivity for model weights
            sensitivity = self._calculate_weight_sensitivity(weights, num_samples)
            
            # Add noise
            noisy_weights = await self.add_noise(
                weights,
                num_samples,
                epsilon,
                delta,
                sensitivity
            )
            
            # Calculate privacy metrics
            privacy_info = {
                "epsilon": epsilon,
                "delta": delta,
                "sensitivity": sensitivity,
                "noise_scale": self._calculate_noise_scale(epsilon, delta, sensitivity, num_samples),
                "num_samples": num_samples,
                "timestamp": datetime.utcnow().isoformat()
            }
            
            return noisy_weights, privacy_info
            
        except Exception as e:
            logger.error(f"Failed to apply DP to weights: {e}")
            raise
    
    def _calculate_weight_sensitivity(self, weights: np.ndarray, num_samples: int) -> float:
        """Calculate sensitivity for model weights"""
        # For bounded weights, sensitivity is max possible change
        # This is a simplified calculation
        
        # Assume weights are bounded by [-1, 1]
        max_weight_change = 2.0  # From -1 to 1
        
        # Sensitivity scales with dataset size
        sensitivity = max_weight_change / num_samples
        
        return sensitivity
    
    async def apply_dp_to_gradients(
        self,
        gradients: np.ndarray,
        num_samples: int,
        epsilon: float,
        delta: float,
        gradient_norm_bound: float = 1.0
    ) -> Tuple[np.ndarray, Dict[str, Any]]:
        """Apply differential privacy to gradients with clipping"""
        try:
            # Gradient clipping
            clipped_gradients = self._clip_gradients(gradients, gradient_norm_bound)
            
            # Calculate sensitivity for clipped gradients
            sensitivity = gradient_norm_bound / num_samples
            
            # Add noise
            noisy_gradients = await self.add_noise(
                clipped_gradients,
                num_samples,
                epsilon,
                delta,
                sensitivity
            )
            
            # Calculate privacy metrics
            privacy_info = {
                "epsilon": epsilon,
                "delta": delta,
                "sensitivity": sensitivity,
                "gradient_norm_bound": gradient_norm_bound,
                "clipped": np.linalg.norm(gradients) > gradient_norm_bound,
                "num_samples": num_samples,
                "timestamp": datetime.utcnow().isoformat()
            }
            
            return noisy_gradients, privacy_info
            
        except Exception as e:
            logger.error(f"Failed to apply DP to gradients: {e}")
            raise
    
    def _clip_gradients(self, gradients: np.ndarray, norm_bound: float) -> np.ndarray:
        """Clip gradients to bound their norm"""
        grad_norm = np.linalg.norm(gradients)
        
        if grad_norm > norm_bound:
            clipped_gradients = gradients * (norm_bound / grad_norm)
        else:
            clipped_gradients = gradients
        
        return clipped_gradients
    
    async def compose_privacy_losses(
        self,
        privacy_losses: list
    ) -> Tuple[float, float]:
        """Compose multiple privacy losses using advanced composition"""
        try:
            total_epsilon = 0.0
            total_delta = 0.0
            
            for loss in privacy_losses:
                eps = loss.get("epsilon", 0)
                dlt = loss.get("delta", 0)
                k = loss.get("num_compositions", 1)
                
                # Advanced composition theorem
                total_epsilon += eps * k
                total_delta += dlt * k
            
            return total_epsilon, total_delta
            
        except Exception as e:
            logger.error(f"Failed to compose privacy losses: {e}")
            raise
    
    async def check_privacy_budget(
        self,
        hospital_id: str,
        requested_epsilon: float,
        requested_delta: float
    ) -> bool:
        """Check if hospital has sufficient privacy budget"""
        try:
            current_usage = self.privacy_ledger.get(hospital_id, {"epsilon": 0.0, "delta": 0.0})
            
            total_epsilon = current_usage["epsilon"] + requested_epsilon
            total_delta = current_usage["delta"] + requested_delta
            
            return total_epsilon <= self.max_privacy_budget
            
        except Exception as e:
            logger.error(f"Failed to check privacy budget: {e}")
            return False
    
    async def update_privacy_ledger(
        self,
        hospital_id: str,
        epsilon_used: float,
        delta_used: float,
        round_number: int
    ):
        """Update privacy ledger for hospital"""
        try:
            current = self.privacy_ledger.get(hospital_id, {"epsilon": 0.0, "delta": 0.0})
            
            self.privacy_ledger[hospital_id] = {
                "epsilon": current["epsilon"] + epsilon_used,
                "delta": current["delta"] + delta_used,
                "last_updated": datetime.utcnow().isoformat(),
                "last_round": round_number
            }
            
            # Log privacy usage
            audit_logger.log_privacy_usage(
                user_id=hospital_id,
                hospital_id=hospital_id,
                epsilon_used=epsilon_used,
                delta_used=delta_used,
                round_number=round_number
            )
            
            logger.info(f"Updated privacy ledger for {hospital_id}: "
                       f"epsilon={self.privacy_ledger[hospital_id]['epsilon']:.6f}, "
                       f"delta={self.privacy_ledger[hospital_id]['delta']:.6f}")
            
        except Exception as e:
            logger.error(f"Failed to update privacy ledger: {e}")
    
    async def get_privacy_usage(self, hospital_id: str) -> Dict[str, Any]:
        """Get privacy usage for hospital"""
        try:
            usage = self.privacy_ledger.get(hospital_id, {"epsilon": 0.0, "delta": 0.0})
            
            return {
                "hospital_id": hospital_id,
                "epsilon_used": usage["epsilon"],
                "delta_used": usage["delta"],
                "epsilon_remaining": max(0, self.max_privacy_budget - usage["epsilon"]),
                "budget_percentage": (usage["epsilon"] / self.max_privacy_budget) * 100,
                "last_updated": usage.get("last_updated"),
                "last_round": usage.get("last_round")
            }
            
        except Exception as e:
            logger.error(f"Failed to get privacy usage: {e}")
            return {}
    
    async def get_all_privacy_usage(self) -> Dict[str, Dict[str, Any]]:
        """Get privacy usage for all hospitals"""
        usage_dict = {}
        
        for hospital_id in self.privacy_ledger:
            usage_dict[hospital_id] = await self.get_privacy_usage(hospital_id)
        
        return usage_dict
    
    def calculate_optimal_epsilon(
        self,
        target_accuracy: float,
        num_samples: int,
        max_epsilon: Optional[float] = None
    ) -> float:
        """Calculate optimal epsilon for target accuracy"""
        try:
            # This is a simplified calculation
            # In practice, this would be based on empirical studies
            
            max_eps = max_epsilon or self.epsilon_default
            
            # Lower epsilon = more privacy = less accuracy
            # Higher epsilon = less privacy = more accuracy
            
            # Simple linear relationship (in practice, this is more complex)
            if target_accuracy >= 0.95:
                return max_eps
            elif target_accuracy >= 0.90:
                return max_eps * 0.8
            elif target_accuracy >= 0.85:
                return max_eps * 0.6
            else:
                return max_eps * 0.4
                
        except Exception as e:
            logger.error(f"Failed to calculate optimal epsilon: {e}")
            return self.epsilon_default
    
    async def validate_dp_parameters(
        self,
        epsilon: float,
        delta: float,
        num_samples: int
    ) -> Dict[str, Any]:
        """Validate differential privacy parameters"""
        try:
            validation_result = {
                "is_valid": True,
                "warnings": [],
                "recommendations": []
            }
            
            # Check epsilon
            if epsilon <= 0:
                validation_result["is_valid"] = False
                validation_result["warnings"].append("Epsilon must be positive")
            elif epsilon > 10:
                validation_result["warnings"].append("High epsilon value provides weak privacy guarantee")
            
            # Check delta
            if delta <= 0 or delta >= 1:
                validation_result["is_valid"] = False
                validation_result["warnings"].append("Delta must be in (0, 1)")
            elif delta > 1e-3:
                validation_result["warnings"].append("High delta value provides weak privacy guarantee")
            
            # Check sample size
            if num_samples < 10:
                validation_result["warnings"].append("Small sample size may affect privacy guarantee")
            
            # Recommendations
            if epsilon > 1.0:
                validation_result["recommendations"].append("Consider using epsilon <= 1.0 for stronger privacy")
            
            if delta > 1e-6:
                validation_result["recommendations"].append("Consider using delta <= 1e-6 for stronger privacy")
            
            return validation_result
            
        except Exception as e:
            logger.error(f"Failed to validate DP parameters: {e}")
            return {"is_valid": False, "error": str(e)}

# Global service instance
dp_service = DifferentialPrivacyService()
