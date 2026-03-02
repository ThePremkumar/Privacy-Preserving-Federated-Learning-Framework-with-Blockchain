import torch
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from typing import Dict, List, Any, Tuple
import json
import os
from datetime import datetime
import logging

class MetricsTracker:
    """Track and visualize federated learning metrics"""
    
    def __init__(self, save_dir: str = "./results"):
        self.save_dir = save_dir
        self.metrics_history = {
            "round": [],
            "global_accuracy": [],
            "global_loss": [],
            "client_accuracies": [],
            "client_losses": [],
            "communication_costs": []
        }
        
        # Create save directory if it doesn't exist
        os.makedirs(save_dir, exist_ok=True)
        
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger("MetricsTracker")
    
    def update_round_metrics(self, round_num: int, global_metrics: Dict[str, float],
                           client_metrics: List[Dict[str, float]], 
                           communication_cost: float = 0.0):
        """Update metrics for a training round"""
        self.metrics_history["round"].append(round_num)
        self.metrics_history["global_accuracy"].append(global_metrics.get("accuracy", 0.0))
        self.metrics_history["global_loss"].append(global_metrics.get("loss", 0.0))
        self.metrics_history["communication_costs"].append(communication_cost)
        
        # Store client metrics
        round_client_accs = [cm.get("accuracy", 0.0) for cm in client_metrics]
        round_client_losses = [cm.get("loss", 0.0) for cm in client_metrics]
        
        self.metrics_history["client_accuracies"].append(round_client_accs)
        self.metrics_history["client_losses"].append(round_client_losses)
        
        self.logger.info(f"Round {round_num} - Global Accuracy: {global_metrics.get('accuracy', 0.0):.2f}%, "
                        f"Global Loss: {global_metrics.get('loss', 0.0):.4f}")
    
    def plot_training_curves(self, save_path: str = None):
        """Plot training curves for global model"""
        if save_path is None:
            save_path = os.path.join(self.save_dir, "training_curves.png")
        
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(15, 5))
        
        # Plot accuracy
        ax1.plot(self.metrics_history["round"], self.metrics_history["global_accuracy"], 
                'b-', label='Global Accuracy', linewidth=2)
        ax1.set_xlabel('Round')
        ax1.set_ylabel('Accuracy (%)')
        ax1.set_title('Global Model Accuracy')
        ax1.grid(True, alpha=0.3)
        ax1.legend()
        
        # Plot loss
        ax2.plot(self.metrics_history["round"], self.metrics_history["global_loss"], 
                'r-', label='Global Loss', linewidth=2)
        ax2.set_xlabel('Round')
        ax2.set_ylabel('Loss')
        ax2.set_title('Global Model Loss')
        ax2.grid(True, alpha=0.3)
        ax2.legend()
        
        plt.tight_layout()
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        plt.close()
        
        self.logger.info(f"Training curves saved to {save_path}")
    
    def plot_client_performance(self, save_path: str = None):
        """Plot client performance over rounds"""
        if save_path is None:
            save_path = os.path.join(self.save_dir, "client_performance.png")
        
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(15, 5))
        
        # Prepare data for plotting
        rounds = self.metrics_history["round"]
        client_accuracies = self.metrics_history["client_accuracies"]
        client_losses = self.metrics_history["client_losses"]
        
        if client_accuracies:
            num_clients = len(client_accuracies[0])
            
            # Plot client accuracies
            for client_idx in range(num_clients):
                acc_history = [round_acc[client_idx] if client_idx < len(round_acc) else 0 
                              for round_acc in client_accuracies]
                ax1.plot(rounds, acc_history, label=f'Client {client_idx}', alpha=0.7)
            
            ax1.set_xlabel('Round')
            ax1.set_ylabel('Accuracy (%)')
            ax1.set_title('Client Accuracy Over Rounds')
            ax1.grid(True, alpha=0.3)
            ax1.legend()
            
            # Plot client losses
            for client_idx in range(num_clients):
                loss_history = [round_loss[client_idx] if client_idx < len(round_loss) else 0 
                               for round_loss in client_losses]
                ax2.plot(rounds, loss_history, label=f'Client {client_idx}', alpha=0.7)
            
            ax2.set_xlabel('Round')
            ax2.set_ylabel('Loss')
            ax2.set_title('Client Loss Over Rounds')
            ax2.grid(True, alpha=0.3)
            ax2.legend()
        
        plt.tight_layout()
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        plt.close()
        
        self.logger.info(f"Client performance plots saved to {save_path}")
    
    def save_metrics(self, save_path: str = None):
        """Save metrics to JSON file"""
        if save_path is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            save_path = os.path.join(self.save_dir, f"metrics_{timestamp}.json")
        
        with open(save_path, 'w') as f:
            json.dump(self.metrics_history, f, indent=2)
        
        self.logger.info(f"Metrics saved to {save_path}")
    
    def load_metrics(self, load_path: str):
        """Load metrics from JSON file"""
        with open(load_path, 'r') as f:
            self.metrics_history = json.load(f)
        
        self.logger.info(f"Metrics loaded from {load_path}")
    
    def get_final_metrics(self) -> Dict[str, Any]:
        """Get final summary metrics"""
        if not self.metrics_history["round"]:
            return {}
        
        return {
            "total_rounds": len(self.metrics_history["round"]),
            "final_global_accuracy": self.metrics_history["global_accuracy"][-1],
            "final_global_loss": self.metrics_history["global_loss"][-1],
            "best_global_accuracy": max(self.metrics_history["global_accuracy"]),
            "total_communication_cost": sum(self.metrics_history["communication_costs"]),
            "average_client_accuracy": np.mean(self.metrics_history["client_accuracies"][-1]) if self.metrics_history["client_accuracies"] else 0.0
        }

class CommunicationCostTracker:
    """Track communication costs in federated learning"""
    
    def __init__(self):
        self.round_costs = []
        self.total_cost = 0.0
    
    def calculate_model_size(self, model_parameters: Dict[str, torch.Tensor]) -> int:
        """Calculate model size in bytes"""
        total_size = 0
        for param in model_parameters.values():
            total_size += param.numel() * param.element_size()
        return total_size
    
    def track_round_cost(self, num_clients: int, model_parameters: Dict[str, torch.Tensor]) -> float:
        """Track communication cost for a round"""
        model_size_mb = self.calculate_model_size(model_parameters) / (1024 * 1024)
        
        # Assume bidirectional communication (server -> clients, clients -> server)
        round_cost = model_size_mb * num_clients * 2  # MB
        
        self.round_costs.append(round_cost)
        self.total_cost += round_cost
        
        return round_cost
    
    def get_cost_summary(self) -> Dict[str, float]:
        """Get communication cost summary"""
        return {
            "total_cost_mb": self.total_cost,
            "average_cost_per_round": np.mean(self.round_costs) if self.round_costs else 0.0,
            "total_rounds": len(self.round_costs)
        }

def set_random_seeds(seed: int = 42):
    """Set random seeds for reproducibility"""
    torch.manual_seed(seed)
    torch.cuda.manual_seed(seed)
    torch.cuda.manual_seed_all(seed)
    np.random.seed(seed)
    torch.backends.cudnn.deterministic = True
    torch.backends.cudnn.benchmark = False

def create_experiment_directory(base_dir: str = "./experiments") -> str:
    """Create a new experiment directory with timestamp"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    exp_dir = os.path.join(base_dir, f"experiment_{timestamp}")
    os.makedirs(exp_dir, exist_ok=True)
    return exp_dir

def save_model_checkpoint(model, optimizer, round_num: int, save_path: str):
    """Save model checkpoint"""
    torch.save({
        'round': round_num,
        'model_state_dict': model.state_dict(),
        'optimizer_state_dict': optimizer.state_dict(),
    }, save_path)

def load_model_checkpoint(model, optimizer, checkpoint_path: str):
    """Load model checkpoint"""
    checkpoint = torch.load(checkpoint_path)
    model.load_state_dict(checkpoint['model_state_dict'])
    if optimizer:
        optimizer.load_state_dict(checkpoint['optimizer_state_dict'])
    return checkpoint['round']
