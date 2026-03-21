import torch
import copy
from typing import List, Dict, Any
from .client import FederatedClient
from .server import FederatedServer

class FederatedTrainer:
    def __init__(self, server: FederatedServer, clients: List[FederatedClient], 
                 device='cpu', rounds=10, client_fraction=1.0):
        self.server = server
        self.clients = clients
        self.device = device
        self.rounds = rounds
        self.client_fraction = client_fraction
        self.training_history = []
    
    def select_clients(self) -> List[FederatedClient]:
        """
        Select a subset of clients for training in current round
        """
        num_selected = max(1, int(len(self.clients) * self.client_fraction))
        selected_indices = torch.randperm(len(self.clients))[:num_selected]
        return [self.clients[i] for i in selected_indices]
    
    def train_round(self, round_num: int, local_epochs: int = 10) -> Dict[str, Any]:
        """
        Execute one round of federated training
        """
        print(f"\n--- Round {round_num + 1}/{self.rounds} ---")
        
        # Select clients for this round
        selected_clients = self.select_clients()
        print(f"Selected {len(selected_clients)} clients for training")
        
        # Send global model to selected clients
        global_parameters = self.server.get_global_parameters()
        client_parameters = []
        client_metrics = []
        
        # Train on selected clients
        for client in selected_clients:
            print(f"Training Client {client.client_id}")
            
            # Set client model to global parameters
            client.set_model_parameters(global_parameters)
            
            # Local training
            train_losses = client.train(epochs=local_epochs)
            
            # Get updated parameters
            updated_params = client.get_model_parameters()
            client_parameters.append(updated_params)
            
            # Store client metrics
            client_metrics.append({
                'client_id': client.client_id,
                'train_losses': train_losses,
                'final_loss': train_losses[-1] if train_losses else 0
            })
        
        # Aggregate client parameters
        aggregated_parameters = self.server.aggregate_clients(client_parameters)
        
        # Update global model
        self.server.update_global_model(aggregated_parameters)
        
        # Evaluate global model
        # Note: This would require a test_loader to be passed
        # For now, we'll skip evaluation in the trainer
        
        # Store round metrics
        round_metrics = {
            'round': round_num,
            'selected_clients': len(selected_clients),
            'client_metrics': client_metrics,
            'aggregation_method': 'fed_avg'
        }
        
        self.training_history.append(round_metrics)
        self.server.save_round_history(round_num, round_metrics)
        
        return round_metrics
    
    def train(self, local_epochs: int = 10, eval_test_loader=None) -> List[Dict[str, Any]]:
        """
        Execute complete federated training process
        """
        print(f"Starting Federated Training for {self.rounds} rounds")
        print(f"Total clients: {len(self.clients)}")
        print(f"Client fraction per round: {self.client_fraction}")
        
        for round_num in range(self.rounds):
            round_metrics = self.train_round(round_num, local_epochs)
            
            # Evaluate global model if test loader is provided
            if eval_test_loader is not None:
                test_loss, test_accuracy = self.server.evaluate_global_model(eval_test_loader)
                round_metrics['test_loss'] = test_loss
                round_metrics['test_accuracy'] = test_accuracy
                print(f"Global Model - Test Loss: {test_loss:.4f}, Test Accuracy: {test_accuracy:.2f}%")
        
        print("\nFederated Training Complete!")
        return self.training_history
    
    def get_training_history(self) -> List[Dict[str, Any]]:
        """
        Get complete training history
        """
        return self.training_history
    
    def save_global_model(self, filepath: str):
        """
        Save the global model
        """
        torch.save(self.server.global_model.state_dict(), filepath)
        print(f"Global model saved to {filepath}")
    
    def load_global_model(self, filepath: str):
        """
        Load a global model
        """
        self.server.global_model.load_state_dict(torch.load(filepath))
        print(f"Global model loaded from {filepath}")
