import torch
import torch.nn as nn
import torch.nn.functional as F
from typing import Dict, Any

class FederatedCNN(nn.Module):
    """CNN model for federated learning on image data"""
    
    def __init__(self, num_classes: int = 10):
        super(FederatedCNN, self).__init__()
        self.conv1 = nn.Conv2d(3, 32, kernel_size=3, padding=1)
        self.conv2 = nn.Conv2d(32, 64, kernel_size=3, padding=1)
        self.conv3 = nn.Conv2d(64, 128, kernel_size=3, padding=1)
        self.pool = nn.MaxPool2d(2, 2)
        self.dropout = nn.Dropout(0.25)
        self.fc1 = nn.Linear(128 * 4 * 4, 512)
        self.fc2 = nn.Linear(512, num_classes)
    
    def forward(self, x):
        x = self.pool(F.relu(self.conv1(x)))
        x = self.pool(F.relu(self.conv2(x)))
        x = self.pool(F.relu(self.conv3(x)))
        x = x.view(-1, 128 * 4 * 4)
        x = self.dropout(x)
        x = F.relu(self.fc1(x))
        x = self.dropout(x)
        x = self.fc2(x)
        return x
    
    def get_parameters(self) -> Dict[str, Any]:
        """Get model parameters for federated learning"""
        return {name: param.data.clone() for name, param in self.named_parameters()}
    
    def set_parameters(self, parameters: Dict[str, Any]) -> None:
        """Set model parameters from federated learning"""
        for name, param in self.named_parameters():
            param.data = parameters[name].clone()

class FederatedMLP(nn.Module):
    """MLP model for federated learning on tabular data"""
    
    def __init__(self, input_dim: int, hidden_dims: list = [128, 64], num_classes: int = 10):
        super(FederatedMLP, self).__init__()
        layers = []
        
        # Input layer
        layers.append(nn.Linear(input_dim, hidden_dims[0]))
        layers.append(nn.ReLU())
        layers.append(nn.Dropout(0.2))
        
        # Hidden layers
        for i in range(len(hidden_dims) - 1):
            layers.append(nn.Linear(hidden_dims[i], hidden_dims[i + 1]))
            layers.append(nn.ReLU())
            layers.append(nn.Dropout(0.2))
        
        # Output layer
        layers.append(nn.Linear(hidden_dims[-1], num_classes))
        
        self.network = nn.Sequential(*layers)
    
    def forward(self, x):
        return self.network(x)
    
    def get_parameters(self) -> Dict[str, Any]:
        """Get model parameters for federated learning"""
        return {name: param.data.clone() for name, param in self.named_parameters()}
    
    def set_parameters(self, parameters: Dict[str, Any]) -> None:
        """Set model parameters from federated learning"""
        for name, param in self.named_parameters():
            param.data = parameters[name].clone()
