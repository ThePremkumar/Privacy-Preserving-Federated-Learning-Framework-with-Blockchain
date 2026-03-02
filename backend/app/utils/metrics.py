import torch
import numpy as np
import matplotlib.pyplot as plt
from typing import List, Dict, Any
import json

class MetricsTracker:
    def __init__(self):
        self.metrics_history = []
        self.round_numbers = []
        self.accuracies = []
        self.losses = []
        self.client_losses = []
    
    def add_round_metrics(self, round_num: int, metrics: Dict[str, Any]):
        """
        Add metrics for a training round
        """
        self.round_numbers.append(round_num)
        self.metrics_history.append(metrics)
        
        # Extract test accuracy and loss if available
        if 'test_accuracy' in metrics:
            self.accuracies.append(metrics['test_accuracy'])
        if 'test_loss' in metrics:
            self.losses.append(metrics['test_loss'])
        
        # Extract client losses
        if 'client_metrics' in metrics:
            round_client_losses = []
            for client_metric in metrics['client_metrics']:
                if 'final_loss' in client_metric:
                    round_client_losses.append(client_metric['final_loss'])
            self.client_losses.append(round_client_losses)
    
    def plot_training_curves(self, save_path: str = None):
        """
        Plot training curves for accuracy and loss
        """
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 4))
        
        # Plot accuracy
        if self.accuracies:
            ax1.plot(self.round_numbers, self.accuracies, 'b-', linewidth=2)
            ax1.set_xlabel('Round')
            ax1.set_ylabel('Test Accuracy (%)')
            ax1.set_title('Global Model Accuracy')
            ax1.grid(True)
        
        # Plot loss
        if self.losses:
            ax2.plot(self.round_numbers, self.losses, 'r-', linewidth=2)
            ax2.set_xlabel('Round')
            ax2.set_ylabel('Test Loss')
            ax2.set_title('Global Model Loss')
            ax2.grid(True)
        
        plt.tight_layout()
        
        if save_path:
            plt.savefig(save_path)
            print(f"Training curves saved to {save_path}")
        else:
            plt.show()
    
    def plot_client_losses(self, save_path: str = None):
        """
        Plot client training losses
        """
        if not self.client_losses:
            print("No client loss data available")
            return
        
        plt.figure(figsize=(10, 6))
        
        # Plot each client's loss
        num_clients = len(self.client_losses[0]) if self.client_losses else 0
        for client_idx in range(num_clients):
            client_losses = [round_losses[client_idx] if client_idx < len(round_losses) else np.nan 
                           for round_losses in self.client_losses]
            plt.plot(self.round_numbers, client_losses, alpha=0.7, label=f'Client {client_idx}')
        
        plt.xlabel('Round')
        plt.ylabel('Training Loss')
        plt.title('Client Training Losses')
        plt.legend(bbox_to_anchor=(1.05, 1), loc='upper left')
        plt.grid(True)
        plt.tight_layout()
        
        if save_path:
            plt.savefig(save_path)
            print(f"Client loss plot saved to {save_path}")
        else:
            plt.show()
    
    def compute_statistics(self) -> Dict[str, Any]:
        """
        Compute statistical summaries of training
        """
        stats = {}
        
        if self.accuracies:
            stats['accuracy'] = {
                'final': self.accuracies[-1] if self.accuracies else 0,
                'max': max(self.accuracies) if self.accuracies else 0,
                'min': min(self.accuracies) if self.accuracies else 0,
                'mean': np.mean(self.accuracies) if self.accuracies else 0,
                'std': np.std(self.accuracies) if self.accuracies else 0
            }
        
        if self.losses:
            stats['loss'] = {
                'final': self.losses[-1] if self.losses else 0,
                'max': max(self.losses) if self.losses else 0,
                'min': min(self.losses) if self.losses else 0,
                'mean': np.mean(self.losses) if self.losses else 0,
                'std': np.std(self.losses) if self.losses else 0
            }
        
        if self.client_losses:
            # Compute client-wise statistics
            all_client_losses = [loss for round_losses in self.client_losses for loss in round_losses]
            stats['client_losses'] = {
                'mean': np.mean(all_client_losses) if all_client_losses else 0,
                'std': np.std(all_client_losses) if all_client_losses else 0,
                'min': min(all_client_losses) if all_client_losses else 0,
                'max': max(all_client_losses) if all_client_losses else 0
            }
        
        return stats
    
    def save_metrics(self, filepath: str):
        """
        Save metrics to JSON file
        """
        metrics_data = {
            'round_numbers': self.round_numbers,
            'accuracies': self.accuracies,
            'losses': self.losses,
            'client_losses': self.client_losses,
            'statistics': self.compute_statistics()
        }
        
        with open(filepath, 'w') as f:
            json.dump(metrics_data, f, indent=2)
        
        print(f"Metrics saved to {filepath}")
    
    def load_metrics(self, filepath: str):
        """
        Load metrics from JSON file
        """
        with open(filepath, 'r') as f:
            metrics_data = json.load(f)
        
        self.round_numbers = metrics_data.get('round_numbers', [])
        self.accuracies = metrics_data.get('accuracies', [])
        self.losses = metrics_data.get('losses', [])
        self.client_losses = metrics_data.get('client_losses', [])
        
        print(f"Metrics loaded from {filepath}")

def compute_model_similarity(model1_params: List[torch.Tensor], 
                           model2_params: List[torch.Tensor]) -> float:
    """
    Compute cosine similarity between two models
    """
    if len(model1_params) != len(model2_params):
        raise ValueError("Models must have same number of parameters")
    
    # Flatten all parameters
    params1 = torch.cat([p.flatten() for p in model1_params])
    params2 = torch.cat([p.flatten() for p in model2_params])
    
    # Compute cosine similarity
    similarity = torch.cosine_similarity(params1.unsqueeze(0), params2.unsqueeze(0))
    return similarity.item()

def compute_parameter_norm(parameters: List[torch.Tensor]) -> float:
    """
    Compute L2 norm of model parameters
    """
    total_norm = 0
    for param in parameters:
        total_norm += param.norm().item() ** 2
    return np.sqrt(total_norm)
