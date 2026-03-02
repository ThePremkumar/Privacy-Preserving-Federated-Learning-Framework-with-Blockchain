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
from utils.metrics import MetricsTracker
from utils.config import Config

def main():
    """
    Basic federated learning example
    """
    print("=== Basic Federated Learning Example ===")
    
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
    
    # Initialize trainer
    trainer = FederatedTrainer(
        server=server,
        clients=clients,
        device=device,
        rounds=config.get('training.rounds'),
        client_fraction=config.get('training.client_fraction')
    )
    
    # Initialize metrics tracker
    metrics_tracker = MetricsTracker()
    
    # Train federated model
    print("Starting federated training...")
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
    
    # Print final results
    print("\n=== Training Complete ===")
    final_test_loss, final_test_accuracy = server.evaluate_global_model(test_loader)
    print(f"Final Test Loss: {final_test_loss:.4f}")
    print(f"Final Test Accuracy: {final_test_accuracy:.2f}%")
    
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
        metrics_tracker.save_metrics('results/basic_federated_metrics.json')
        metrics_tracker.plot_training_curves('results/basic_federated_curves.png')
    
    if config.get('logging.save_model'):
        os.makedirs('models', exist_ok=True)
        trainer.save_global_model('models/basic_federated_model.pth')

if __name__ == "__main__":
    main()
