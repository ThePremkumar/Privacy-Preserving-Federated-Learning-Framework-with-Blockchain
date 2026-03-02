import torch
import time
import logging
from typing import Dict, List, Any, Optional
from ..client.client import FederatedClient
from ..server.server import FederatedServer
from ..data.data_loader import FederatedDataLoader
from ..utils.utils import MetricsTracker, CommunicationCostTracker, set_random_seeds, create_experiment_directory

class FederatedLearningSimulation:
    """Main simulation class for federated learning"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.setup_logging()
        
        # Set random seeds for reproducibility
        set_random_seeds(config.get("seed", 42))
        
        # Initialize components
        self.data_loader = FederatedDataLoader()
        self.server = None
        self.clients = {}
        
        # Tracking
        self.metrics_tracker = MetricsTracker()
        self.comm_tracker = CommunicationCostTracker()
        
        # Create experiment directory
        self.exp_dir = create_experiment_directory(config.get("experiment_dir", "./experiments"))
        
        self.logger.info(f"Initialized federated learning simulation in {self.exp_dir}")
    
    def setup_logging(self):
        """Setup logging configuration"""
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        self.logger = logging.getLogger("FederatedSimulation")
    
    def setup_data(self):
        """Setup and load data for federated learning"""
        dataset = self.config.get("dataset", "cifar10")
        num_clients = self.config.get("num_clients", 4)
        alpha = self.config.get("alpha", 0.5)  # Non-IID parameter
        
        self.logger.info(f"Loading {dataset} dataset for {num_clients} clients with alpha={alpha}")
        
        if dataset == "cifar10":
            self.client_loaders, self.test_loader = self.data_loader.load_cifar10(
                data_dir=f"{self.exp_dir}/data",
                num_clients=num_clients,
                alpha=alpha
            )
            model_config = {"num_classes": 10}
            model_type = "cnn"
            
        elif dataset == "mnist":
            self.client_loaders, self.test_loader = self.data_loader.load_mnist(
                data_dir=f"{self.exp_dir}/data",
                num_clients=num_clients,
                alpha=alpha
            )
            model_config = {"num_classes": 10}
            model_type = "cnn"
            
        elif dataset == "synthetic_tabular":
            self.client_loaders, self.test_loader = self.data_loader.load_synthetic_tabular(
                n_samples=self.config.get("n_samples", 10000),
                n_features=self.config.get("n_features", 20),
                n_classes=self.config.get("n_classes", 10),
                num_clients=num_clients,
                alpha=alpha
            )
            model_config = {
                "input_dim": self.config.get("n_features", 20),
                "hidden_dims": [128, 64],
                "num_classes": self.config.get("n_classes", 10)
            }
            model_type = "mlp"
            
        else:
            raise ValueError(f"Unsupported dataset: {dataset}")
        
        return model_type, model_config
    
    def setup_clients(self, model_type: str, model_config: Dict[str, Any]):
        """Initialize federated clients"""
        client_fraction = self.config.get("client_fraction", 1.0)
        num_selected = max(1, int(len(self.client_loaders) * client_fraction))
        
        for client_id, loader in self.client_loaders.items():
            # Only select a fraction of clients
            if len(self.clients) < num_selected:
                self.clients[client_id] = FederatedClient(
                    client_id=client_id,
                    model_type=model_type,
                    **model_config
                )
        
        self.logger.info(f"Initialized {len(self.clients)} clients")
    
    def setup_server(self, model_type: str, model_config: Dict[str, Any]):
        """Initialize federated server"""
        self.server = FederatedServer(model_type=model_type, **model_config)
        self.logger.info("Initialized federated server")
    
    def run_round(self, round_num: int) -> Dict[str, Any]:
        """Run a single federated learning round"""
        self.logger.info(f"Starting round {round_num}")
        
        # Send global model to clients
        global_params = self.server.get_global_parameters()
        client_updates = []
        client_metrics = []
        
        # Client training
        for client_id, client in self.clients.items():
            # Set global model parameters
            client.set_model_parameters(global_params)
            
            # Train locally
            train_metrics = client.train(
                self.client_loaders[client_id],
                epochs=self.config.get("local_epochs", 5)
            )
            
            # Get updated parameters
            updated_params = client.get_model_parameters()
            
            # Store client update
            client_updates.append({
                "client_id": client_id,
                "parameters": updated_params,
                "num_samples": train_metrics.get("num_samples", 0)
            })
            
            client_metrics.append(train_metrics)
            
            self.logger.info(f"Client {client_id} - Accuracy: {train_metrics['accuracy']:.2f}%, "
                           f"Loss: {train_metrics['loss']:.4f}")
        
        # Server aggregation
        aggregated_params = self.server.aggregate_updates(
            client_updates,
            strategy=self.config.get("aggregation_strategy", "fedavg")
        )
        
        # Update global model
        self.server.update_global_model(aggregated_params)
        
        # Track communication cost
        comm_cost = self.comm_tracker.track_round_cost(len(self.clients), global_params)
        
        # Evaluate global model
        global_metrics = self.server.evaluate_global_model(self.test_loader)
        
        # Update metrics tracker
        self.metrics_tracker.update_round_metrics(
            round_num, global_metrics, client_metrics, comm_cost
        )
        
        return {
            "round": round_num,
            "global_metrics": global_metrics,
            "client_metrics": client_metrics,
            "communication_cost": comm_cost
        }
    
    def run_simulation(self) -> Dict[str, Any]:
        """Run the complete federated learning simulation"""
        self.logger.info("Starting federated learning simulation")
        
        # Setup
        model_type, model_config = self.setup_data()
        self.setup_server(model_type, model_config)
        self.setup_clients(model_type, model_config)
        
        # Training rounds
        num_rounds = self.config.get("num_rounds", 50)
        round_results = []
        
        start_time = time.time()
        
        for round_num in range(num_rounds):
            round_result = self.run_round(round_num)
            round_results.append(round_result)
            
            # Early stopping if convergence achieved
            if round_num > 10:  # Check after 10 rounds
                recent_accs = [r["global_metrics"]["accuracy"] 
                             for r in round_results[-5:]]
                if all(acc > 95.0 for acc in recent_accs):  # 95% accuracy threshold
                    self.logger.info(f"Early stopping at round {round_num} - convergence achieved")
                    break
        
        total_time = time.time() - start_time
        
        # Final evaluation
        final_metrics = self.server.evaluate_global_model(self.test_loader)
        
        # Generate visualizations and save results
        self.save_results()
        
        # Summary
        summary = {
            "total_rounds": len(round_results),
            "final_accuracy": final_metrics["accuracy"],
            "final_loss": final_metrics["loss"],
            "total_time": total_time,
            "communication_cost": self.comm_tracker.get_cost_summary(),
            "config": self.config
        }
        
        self.logger.info(f"Simulation completed - Final accuracy: {final_metrics['accuracy']:.2f}%, "
                        f"Total time: {total_time:.2f}s")
        
        return summary
    
    def save_results(self):
        """Save simulation results and visualizations"""
        # Save metrics
        self.metrics_tracker.save_metrics(f"{self.exp_dir}/metrics.json")
        
        # Generate plots
        self.metrics_tracker.plot_training_curves(f"{self.exp_dir}/training_curves.png")
        self.metrics_tracker.plot_client_performance(f"{self.exp_dir}/client_performance.png")
        
        # Save configuration
        import json
        with open(f"{self.exp_dir}/config.json", 'w') as f:
            json.dump(self.config, f, indent=2)
        
        self.logger.info(f"Results saved to {self.exp_dir}")
