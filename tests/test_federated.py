import unittest
import torch
import sys
import os

# Add src to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'src'))

from models.cnn import CNNModel
from federated.client import FederatedClient
from federated.server import FederatedServer
from federated.trainer import FederatedTrainer
from data.dataloader import FederatedDataLoader

class TestFederated(unittest.TestCase):
    def setUp(self):
        self.device = torch.device('cpu')
        self.num_clients = 3
        self.batch_size = 4
        
        # Create dummy data
        self.data_loader = FederatedDataLoader(
            dataset_name='mnist',
            num_clients=self.num_clients,
            batch_size=self.batch_size
        )
        
        # Create dummy datasets
        train_dataset, test_dataset = self.data_loader.load_data()
        # Use only a small subset for testing
        small_train = torch.utils.data.Subset(train_dataset, range(100))
        small_test = torch.utils.data.Subset(test_dataset, range(50))
        
        self.client_datasets = self.data_loader.split_data(small_train)
        self.test_loader = self.data_loader.get_test_dataloader(small_test)
        
        # Initialize model
        self.model = CNNModel(num_classes=10)
        
        # Initialize server
        self.server = FederatedServer(self.model, device=self.device)
        
        # Initialize clients
        self.clients = []
        for i, client_dataset in enumerate(self.client_datasets):
            client_train_loader = self.data_loader.get_client_dataloader(client_dataset)
            client = FederatedClient(
                client_id=i,
                model=self.model,
                train_loader=client_train_loader,
                device=self.device,
                learning_rate=0.01
            )
            self.clients.append(client)
    
    def test_client_training(self):
        """Test individual client training"""
        client = self.clients[0]
        
        # Get initial parameters
        initial_params = client.get_model_parameters()
        
        # Train for 1 epoch
        losses = client.train(epochs=1)
        
        # Get updated parameters
        updated_params = client.get_model_parameters()
        
        # Parameters should have changed
        for init, updated in zip(initial_params, updated_params):
            self.assertFalse(torch.equal(init, updated))
        
        # Should have loss values
        self.assertEqual(len(losses), 1)
        self.assertIsInstance(losses[0], float)
    
    def test_server_aggregation(self):
        """Test server parameter aggregation"""
        # Get parameters from all clients
        client_parameters = []
        for client in self.clients:
            # Train each client for 1 epoch
            client.train(epochs=1)
            params = client.get_model_parameters()
            client_parameters.append(params)
        
        # Aggregate parameters
        aggregated_params = self.server.aggregate_clients(client_parameters)
        
        # Should have same number of parameter layers
        self.assertEqual(len(aggregated_params), len(client_parameters[0]))
        
        # Aggregated parameters should be different from individual clients
        for client_params in client_parameters:
            for client_param, agg_param in zip(client_params, aggregated_params):
                self.assertFalse(torch.equal(client_param, agg_param))
    
    def test_federated_trainer(self):
        """Test federated training process"""
        trainer = FederatedTrainer(
            server=self.server,
            clients=self.clients,
            device=self.device,
            rounds=2,
            client_fraction=1.0
        )
        
        # Train for 2 rounds
        history = trainer.train(local_epochs=1, eval_test_loader=self.test_loader)
        
        # Should have metrics for 2 rounds
        self.assertEqual(len(history), 2)
        
        # Each round should have required metrics
        for round_metrics in history:
            self.assertIn('round', round_metrics)
            self.assertIn('selected_clients', round_metrics)
            self.assertIn('client_metrics', round_metrics)
            self.assertIn('test_loss', round_metrics)
            self.assertIn('test_accuracy', round_metrics)
    
    def test_model_evaluation(self):
        """Test model evaluation"""
        # Evaluate initial model
        test_loss, test_accuracy = self.server.evaluate_global_model(self.test_loader)
        
        # Should get reasonable values
        self.assertIsInstance(test_loss, float)
        self.assertIsInstance(test_accuracy, float)
        self.assertGreaterEqual(test_accuracy, 0)
        self.assertLessEqual(test_accuracy, 100)

if __name__ == '__main__':
    unittest.main()
