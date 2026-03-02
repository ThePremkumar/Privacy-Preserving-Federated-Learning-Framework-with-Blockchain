"""
Test cases for federated learning simulation
"""

import unittest
import torch
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'src'))

from simulation.simulation import FederatedLearningSimulation

class TestFederatedLearningSimulation(unittest.TestCase):
    """Test cases for FederatedLearningSimulation"""
    
    def setUp(self):
        self.config = {
            "dataset": "synthetic_tabular",
            "num_clients": 2,
            "num_rounds": 2,
            "local_epochs": 1,
            "client_fraction": 1.0,
            "alpha": 1.0,
            "aggregation_strategy": "fedavg",
            "seed": 42,
            "experiment_dir": "./test_experiments",
            "n_samples": 100,
            "n_features": 10,
            "n_classes": 3
        }
    
    def test_initialization(self):
        """Test simulation initialization"""
        sim = FederatedLearningSimulation(self.config)
        self.assertIsNotNone(sim.data_loader)
        self.assertIsNotNone(sim.metrics_tracker)
        self.assertIsNotNone(sim.comm_tracker)
    
    def test_data_setup(self):
        """Test data setup"""
        sim = FederatedLearningSimulation(self.config)
        model_type, model_config = sim.setup_data()
        
        self.assertEqual(model_type, "mlp")
        self.assertIn("input_dim", model_config)
        self.assertEqual(model_config["input_dim"], 10)
    
    def test_client_setup(self):
        """Test client setup"""
        sim = FederatedLearningSimulation(self.config)
        model_type, model_config = sim.setup_data()
        sim.setup_clients(model_type, model_config)
        
        self.assertEqual(len(sim.clients), 2)
        self.assertIn("client_0", sim.clients)
        self.assertIn("client_1", sim.clients)
    
    def test_server_setup(self):
        """Test server setup"""
        sim = FederatedLearningSimulation(self.config)
        model_type, model_config = sim.setup_data()
        sim.setup_server(model_type, model_config)
        
        self.assertIsNotNone(sim.server)
        self.assertEqual(sim.server.round_num, 0)

if __name__ == '__main__':
    unittest.main()
