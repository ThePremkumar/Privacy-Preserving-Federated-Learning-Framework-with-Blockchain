import torch
import sys
import os

# Add src to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'src'))

from models.cnn import CNNModel
from data.dataloader import FederatedDataLoader
from federated.client import FederatedClient
from federated.server import FederatedServer
from federated.trainer import FederatedTrainer
from privacy.differential_privacy import DifferentialPrivacy
from utils.metrics import MetricsTracker
from utils.config import Config

class PrivateFederatedTrainer(FederatedTrainer):
    """
    Federated trainer with differential privacy
    """
    def __init__(self, server, clients, privacy_mechanism, device='cpu', rounds=10, client_fraction=1.0):
        super().__init__(server, clients, device, rounds, client_fraction)
        self.privacy_mechanism = privacy_mechanism
    
    def train_round(self, round_num: int, local_epochs: int = 5):
        """
        Execute one round of privacy-preserving federated training
        """
        print(f"\n--- Private Round {round_num + 1}/{self.rounds} ---")
        
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
            
            # Apply differential privacy
            private_params = self.privacy_mechanism.apply_privacy(updated_params)
            client_parameters.append(private_params)
            
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
        
        # Store round metrics
        round_metrics = {
            'round': round_num,
            'selected_clients': len(selected_clients),
            'client_metrics': client_metrics,
            'aggregation_method': 'fed_avg',
            'privacy_enabled': True,
            'epsilon': self.privacy_mechanism.epsilon,
            'delta': self.privacy_mechanism.delta
        }
        
        self.training_history.append(round_metrics)
        self.server.save_round_history(round_num, round_metrics)
        
        return round_metrics

def main():
    """
    Privacy-preserving federated learning example
    """
    print("=== Privacy-Preserving Federated Learning Example ===")
    
    # Configuration
    config = Config()
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"Using device: {device}")
    
    # Load data
    print("Loading data...")
    data_loader = FederatedDataLoader(
        dataset_name=config.get('data.dataset'),
        num_clients=config.get('data.num_clients'),
        batch_size=config.get('data.batch_size')
    )
    
    train_dataset, test_dataset = data_loader.load_data()
    client_datasets = data_loader.split_data(train_dataset)
    test_loader = data_loader.get_test_dataloader(test_dataset)
    
    print(f"Loaded {len(train_dataset)} training samples")
    print(f"Loaded {len(test_dataset)} test samples")
    print(f"Split data among {len(client_datasets)} clients")
    
    # Initialize model
    print("Initializing model...")
    model = CNNModel(num_classes=config.get('model.num_classes'))
    
    # Initialize server
    server = FederatedServer(model, device=device)
    
    # Initialize clients
    print("Initializing clients...")
    clients = []
    for i, client_dataset in enumerate(client_datasets):
        client_train_loader = data_loader.get_client_dataloader(client_dataset)
        client = FederatedClient(
            client_id=i,
            model=model,
            train_loader=client_train_loader,
            device=device,
            learning_rate=config.get('training.learning_rate')
        )
        clients.append(client)
    
    # Initialize privacy mechanism
    privacy_mechanism = DifferentialPrivacy(
        epsilon=config.get('privacy.epsilon'),
        delta=config.get('privacy.delta'),
        clip_norm=config.get('privacy.clip_norm')
    )
    
    print(f"Privacy parameters: ε={privacy_mechanism.epsilon}, δ={privacy_mechanism.delta}")
    
    # Initialize private trainer
    trainer = PrivateFederatedTrainer(
        server=server,
        clients=clients,
        privacy_mechanism=privacy_mechanism,
        device=device,
        rounds=config.get('training.rounds'),
        client_fraction=config.get('training.client_fraction')
    )
    
    # Initialize metrics tracker
    metrics_tracker = MetricsTracker()
    
    # Train federated model with privacy
    print("Starting privacy-preserving federated training...")
    training_history = trainer.train(
        local_epochs=config.get('training.local_epochs'),
        eval_test_loader=test_loader
    )
    
    # Track metrics
    for round_metrics in training_history:
        metrics_tracker.add_round_metrics(
            round_metrics['round'],
            round_metrics
        )
    
    # Compute total privacy spent
    total_epsilon, total_delta = privacy_mechanism.compute_privacy_spent(
        num_rounds=config.get('training.rounds'),
        client_fraction=config.get('training.client_fraction')
    )
    
    # Print final results
    print("\n=== Training Complete ===")
    final_test_loss, final_test_accuracy = server.evaluate_global_model(test_loader)
    print(f"Final Test Loss: {final_test_loss:.4f}")
    print(f"Final Test Accuracy: {final_test_accuracy:.2f}%")
    print(f"Total Privacy Spent: ε={total_epsilon:.4f}, δ={total_delta:.8f}")
    
    # Print statistics
    stats = metrics_tracker.compute_statistics()
    print("\n=== Training Statistics ===")
    if 'accuracy' in stats:
        acc_stats = stats['accuracy']
        print(f"Accuracy - Final: {acc_stats['final']:.2f}%, Max: {acc_stats['max']:.2f}%, Mean: {acc_stats['mean']:.2f}%")
    
    if 'loss' in stats:
        loss_stats = stats['loss']
        print(f"Loss - Final: {loss_stats['final']:.4f}, Min: {loss_stats['min']:.4f}, Mean: {loss_stats['mean']:.4f}")
    
    # Save results
    if config.get('logging.save_metrics'):
        os.makedirs('results', exist_ok=True)
        metrics_tracker.save_metrics('results/private_federated_metrics.json')
        metrics_tracker.plot_training_curves('results/private_federated_curves.png')
    
    if config.get('logging.save_model'):
        os.makedirs('models', exist_ok=True)
        trainer.save_global_model('models/private_federated_model.pth')

if __name__ == "__main__":
    main()
