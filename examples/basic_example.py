"""
Basic example of federated learning simulation
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'src'))

from simulation.simulation import FederatedLearningSimulation

def main():
    """Run a basic federated learning example"""
    
    # Configuration
    config = {
        "dataset": "cifar10",
        "num_clients": 4,
        "num_rounds": 20,
        "local_epochs": 5,
        "client_fraction": 1.0,
        "alpha": 0.5,  # Non-IID parameter
        "aggregation_strategy": "fedavg",
        "seed": 42,
        "experiment_dir": "./experiments"
    }
    
    print("Starting Federated Learning Simulation")
    print("=" * 50)
    print(f"Dataset: {config['dataset']}")
    print(f"Number of Clients: {config['num_clients']}")
    print(f"Number of Rounds: {config['num_rounds']}")
    print(f"Local Epochs: {config['local_epochs']}")
    print("=" * 50)
    
    # Create and run simulation
    sim = FederatedLearningSimulation(config)
    results = sim.run_simulation()
    
    # Print results
    print("\nSimulation Results:")
    print("=" * 50)
    print(f"Total Rounds: {results['total_rounds']}")
    print(f"Final Accuracy: {results['final_accuracy']:.2f}%")
    print(f"Final Loss: {results['final_loss']:.4f}")
    print(f"Total Time: {results['total_time']:.2f} seconds")
    print(f"Communication Cost: {results['communication_cost']['total_cost_mb']:.2f} MB")
    print("=" * 50)
    
    print(f"\nResults saved to: {sim.exp_dir}")
    print(f"To view the dashboard, run: streamlit run src/visualization/dashboard.py")

if __name__ == "__main__":
    main()
