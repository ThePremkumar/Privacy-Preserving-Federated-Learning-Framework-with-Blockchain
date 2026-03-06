import torch
import numpy as np
from typing import List, Tuple

class DifferentialPrivacy:
    def __init__(self, epsilon=1.0, delta=1e-5, sensitivity=1.0, clip_norm=1.0):
        """
        Initialize Differential Privacy mechanism
        
        Args:
            epsilon: Privacy budget parameter
            delta: Failure probability parameter
            sensitivity: Sensitivity of the function
            clip_norm: Clipping norm for gradients
        """
        self.epsilon = epsilon
        self.delta = delta
        self.sensitivity = sensitivity
        self.clip_norm = clip_norm
    
    def clip_gradients(self, gradients: List[torch.Tensor]) -> List[torch.Tensor]:
        """
        Clip gradients to bound sensitivity
        """
        clipped_gradients = []
        
        for grad in gradients:
            # Calculate L2 norm
            grad_norm = torch.norm(grad)
            
            # Clip if norm exceeds threshold
            if grad_norm > self.clip_norm:
                grad = grad * (self.clip_norm / grad_norm)
            
            clipped_gradients.append(grad)
        
        return clipped_gradients
    
    def add_gaussian_noise(self, parameters: List[torch.Tensor]) -> List[torch.Tensor]:
        """
        Add Gaussian noise to parameters for (ε, δ)-differential privacy
        """
        noisy_parameters = []
        
        # Calculate noise scale
        sigma = self.sensitivity * np.sqrt(2 * np.log(1.25 / self.delta)) / self.epsilon
        
        for param in parameters:
            # Add Gaussian noise
            noise = torch.randn_like(param) * sigma
            noisy_param = param + noise
            noisy_parameters.append(noisy_param)
        
        return noisy_parameters
    
    def apply_privacy(self, parameters: List[torch.Tensor]) -> List[torch.Tensor]:
        """
        Apply complete differential privacy mechanism
        """
        # Clip gradients
        clipped_params = self.clip_gradients(parameters)
        
        # Add noise
        noisy_params = self.add_gaussian_noise(clipped_params)
        
        return noisy_params
    
    def compute_privacy_spent(self, num_rounds: int, client_fraction: float = 1.0) -> Tuple[float, float]:
        """
        Compute total privacy spent after training
        
        Args:
            num_rounds: Number of training rounds
            client_fraction: Fraction of clients selected per round
            
        Returns:
            Tuple of (total_epsilon, total_delta)
        """
        # Advanced composition theorem
        total_epsilon = np.sqrt(2 * num_rounds * np.log(1/self.delta)) * self.epsilon
        total_delta = num_rounds * self.delta
        
        # Account for client sampling
        if client_fraction < 1.0:
            total_epsilon *= client_fraction
        
        return total_epsilon, total_delta

class SecureAggregation:
    def __init__(self, num_clients: int):
        """
        Initialize Secure Aggregation mechanism
        
        Args:
            num_clients: Number of participating clients
        """
        self.num_clients = num_clients
    
    def mask_parameters(self, parameters: List[torch.Tensor], client_id: int) -> List[torch.Tensor]:
        """
        Apply masking to parameters for secure aggregation
        """
        # In a real implementation, this would use cryptographic techniques
        # Apply a random mask for secure aggregation
        masked_parameters = []
        
        for param in parameters:
            # Generate client-specific mask
            mask = torch.randn_like(param) * 0.01
            masked_param = param + mask
            masked_parameters.append(masked_param)
        
        return masked_parameters
    
    def unmask_parameters(self, masked_parameters: List[List[torch.Tensor]]) -> List[torch.Tensor]:
        """
        Remove masks from aggregated parameters
        """
        # In a real implementation, this would involve cryptographic unmasking
        # Average the masked parameters for aggregation
        if not masked_parameters:
            return []
        
        num_clients = len(masked_parameters)
        num_layers = len(masked_parameters[0])
        
        unmasked_parameters = []
        for layer_idx in range(num_layers):
            layer_sum = torch.zeros_like(masked_parameters[0][layer_idx])
            for client_params in masked_parameters:
                layer_sum += client_params[layer_idx]
            
            # Average and remove estimated mask contribution
            layer_avg = layer_sum / num_clients
            unmasked_parameters.append(layer_avg)
        
        return unmasked_parameters
