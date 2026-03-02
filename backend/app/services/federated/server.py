import torch
import copy
import numpy as np
from typing import List, Dict, Any

class FederatedServer:
    def __init__(self, model, device='cpu'):
        self.global_model = model
        self.device = device
        self.client_weights = {}
        self.round_history = []
    
    def fed_avg_aggregation(self, client_parameters: List[List[torch.Tensor]], 
                           client_weights: List[float] = None) -> List[torch.Tensor]:
        """
        Federated Averaging aggregation
        """
        if client_weights is None:
            client_weights = [1.0 / len(client_parameters)] * len(client_parameters)
        
        # Initialize aggregated parameters
        aggregated_params = []
        
        # Get number of parameter layers
        num_layers = len(client_parameters[0])
        
        for layer_idx in range(num_layers):
            # Initialize layer parameters
            layer_params = torch.zeros_like(client_parameters[0][layer_idx])
            
            # Weighted average across clients
            for client_idx, client_param in enumerate(client_parameters):
                weight = client_weights[client_idx]
                layer_params += weight * client_param[layer_idx]
            
            aggregated_params.append(layer_params)
        
        return aggregated_params
    
    def aggregate_clients(self, client_parameters: List[List[torch.Tensor]], 
                         aggregation_method: str = 'fed_avg') -> List[torch.Tensor]:
        """
        Aggregate client model parameters
        """
        if aggregation_method == 'fed_avg':
            return self.fed_avg_aggregation(client_parameters)
        else:
            raise ValueError(f"Unsupported aggregation method: {aggregation_method}")
    
    def update_global_model(self, aggregated_parameters: List[torch.Tensor]):
        """
        Update global model with aggregated parameters
        """
        self.global_model.set_parameters(aggregated_parameters)
    
    def evaluate_global_model(self, test_loader):
        """
        Evaluate global model on test data
        """
        self.global_model.eval()
        test_loss = 0
        correct = 0
        total = 0
        criterion = torch.nn.CrossEntropyLoss()
        
        with torch.no_grad():
            for data, target in test_loader:
                data, target = data.to(self.device), target.to(self.device)
                output = self.global_model(data)
                test_loss += criterion(output, target).item()
                pred = output.argmax(dim=1, keepdim=True)
                correct += pred.eq(target.view_as(pred)).sum().item()
                total += target.size(0)
        
        test_loss /= len(test_loader)
        accuracy = 100. * correct / total
        return test_loss, accuracy
    
    def get_global_parameters(self):
        """
        Get current global model parameters
        """
        return self.global_model.get_parameters()
    
    def set_global_parameters(self, parameters):
        """
        Set global model parameters
        """
        self.global_model.set_parameters(parameters)
    
    def save_round_history(self, round_num: int, metrics: Dict[str, Any]):
        """
        Save metrics for current round
        """
        self.round_history.append({
            'round': round_num,
            'metrics': metrics
        })
