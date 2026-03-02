"""
Federated Learning Models for Healthcare Platform
Wraps base models for federated operations and tracks training rounds.
"""

import torch
import torch.nn as nn
import numpy as np
from typing import List, Dict, Any, Optional
from datetime import datetime
from dataclasses import dataclass

from .lstm import LSTMModel

class FederatedModel:
    """Wrapper for models using federated learning"""
    
    def __init__(self, input_dim: int = 784, hidden_dim: int = 128, output_dim: int = 10):
        self.model = LSTMModel(input_size=input_dim, hidden_size=hidden_dim, num_classes=output_dim)
        self.input_dim = input_dim
        self.hidden_dim = hidden_dim
        self.output_dim = output_dim

    def get_weights(self) -> np.ndarray:
        """Get all model weights as a single flattened numpy array for transmission"""
        params = [p.data.cpu().numpy().flatten() for p in self.model.parameters()]
        return np.concatenate(params)

    def set_weights(self, flat_weights: np.ndarray):
        """Set model weights from a flattened numpy array"""
        start = 0
        for p in self.model.parameters():
            shape = p.shape
            size = p.numel()
            new_p = torch.from_numpy(flat_weights[start:start+size]).reshape(shape)
            p.data.copy_(new_p)
            start += size

    def get_parameter_count(self) -> int:
        """Get total number of parameters"""
        return sum(p.numel() for p in self.model.parameters())

@dataclass
class FederatedRound:
    """Tracks state of a single federated learning round"""
    round_number: int
    status: str
    start_time: datetime
    global_model_weights: np.ndarray
    participating_hospitals: List[str]
    min_participants: int
    max_participants: int
    end_time: Optional[datetime] = None
    aggregation_result: Optional[Dict[str, Any]] = None
