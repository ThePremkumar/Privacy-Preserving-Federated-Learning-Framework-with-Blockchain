"""
Advanced example with custom configuration and multiple experiments
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'src'))

from simulation.simulation import FederatedLearningSimulation
import json

def run_comparison_experiments():
    """Run multiple experiments to compare different settings"""
    
    # Experiment configurations
    experiments = [
        {
            "name": "IID_FedAvg",
            "config": {
                "dataset": "cifar10",
                "num_clients": 4,
                "num_rounds": 30,
                "local_epochs": 5,
                "client_fraction": 1.0,
                "alpha": 10.0,  # High alpha = IID
                "aggregation_strategy": "fedavg",
                "seed": 42,
                "experiment_dir": "./experiments"
            }
        },
        {
            "name": "NonIID_FedAvg",
            "config": {
                "dataset": "cifar10",
                "num_clients": 4,
                "num_rounds": 30,
                "local_epochs": 5,
                "client_fraction": 1.0,
                "alpha": 0.5,  # Low alpha = Non-IID
                "aggregation_strategy": "fedavg",
                "seed": 42,
                "experiment_dir": "./experiments"
            }
        },
        {
            "name": "Partial_Participation",
            "config": {
                "dataset": "cifar10",
                "num_clients": 8,
                "num_rounds": 30,
                "local_epochs": 5,
                "client_fraction": 0.5,  # Only 50% of clients participate
                "alpha": 0.5,
                "aggregation_strategy": "fedavg",
                "seed": 42,
                "experiment_dir": "./experiments"
            }
        },
        {
            "name": "MNIST_Example",
            "config": {
                "dataset": "mnist",
                "num_clients": 4,
                "num_rounds": 20,
                "local_epochs": 3,
                "client_fraction": 1.0,
                "alpha": 0.3,
                "aggregation_strategy": "fedavg",
                "seed": 42,
                "experiment_dir": "./experiments"
            }
        }
    ]
    
    results = []
    
    print("Running Comparison Experiments")
    print("=" * 60)
    
    for exp in experiments:
        print(f"\nRunning: {exp['name']}")
        print("-" * 40)
        
        # Create experiment subdirectory
        exp['config']['experiment_dir'] = f"./experiments/{exp['name']}"
        
        # Run simulation
        sim = FederatedLearningSimulation(exp['config'])
        result = sim.run_simulation()
        
        # Store results
        results.append({
            "name": exp['name'],
            "final_accuracy": result['final_accuracy'],
            "final_loss": result['final_loss'],
            "total_rounds": result['total_rounds'],
            "total_time": result['total_time'],
            "communication_cost": result['communication_cost']['total_cost_mb'],
            "experiment_dir": sim.exp_dir
        })
        
        print(f"Final Accuracy: {result['final_accuracy']:.2f}%")
        print(f"Communication Cost: {result['communication_cost']['total_cost_mb']:.2f} MB")
    
    # Print comparison table
    print("\n" + "=" * 60)
    print("EXPERIMENT COMPARISON")
    print("=" * 60)
    
    print(f"{'Experiment':<20} {'Accuracy':<12} {'Loss':<10} {'Rounds':<8} {'Time (s)':<10} {'Comm Cost (MB)':<15}")
    print("-" * 75)
    
    for result in results:
        print(f"{result['name']:<20} {result['final_accuracy']:<12.2f} "
              f"{result['final_loss']:<10.4f} {result['total_rounds']:<8} "
              f"{result['total_time']:<10.2f} {result['communication_cost']:<15.2f}")
    
    # Save comparison results
    with open("./experiments/comparison_results.json", 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\nComparison results saved to: ./experiments/comparison_results.json")
    print("To view individual experiments, run the dashboard and select the experiment directories.")

def run_synthetic_data_example():
    """Run example with synthetic tabular data"""
    
    config = {
        "dataset": "synthetic_tabular",
        "num_clients": 6,
        "num_rounds": 25,
        "local_epochs": 10,
        "client_fraction": 1.0,
        "alpha": 0.3,
        "aggregation_strategy": "fedavg",
        "seed": 42,
        "experiment_dir": "./experiments/synthetic_example",
        "n_samples": 5000,
        "n_features": 15,
        "n_classes": 5
    }
    
    print("Running Synthetic Data Example")
    print("=" * 50)
    print(f"Number of Samples: {config['n_samples']}")
    print(f"Number of Features: {config['n_features']}")
    print(f"Number of Classes: {config['n_classes']}")
    print(f"Number of Clients: {config['num_clients']}")
    print("=" * 50)
    
    sim = FederatedLearningSimulation(config)
    results = sim.run_simulation()
    
    print(f"\nFinal Accuracy: {results['final_accuracy']:.2f}%")
    print(f"Final Loss: {results['final_loss']:.4f}")
    print(f"Total Time: {results['total_time']:.2f} seconds")

def main():
    """Main function to run advanced examples"""
    
    print("Federated Learning - Advanced Examples")
    print("=" * 60)
    print("1. Run comparison experiments")
    print("2. Run synthetic data example")
    print("3. Run both")
    print("=" * 60)
    
    choice = input("Enter your choice (1/2/3): ").strip()
    
    if choice == "1":
        run_comparison_experiments()
    elif choice == "2":
        run_synthetic_data_example()
    elif choice == "3":
        run_comparison_experiments()
        print("\n" + "=" * 60)
        run_synthetic_data_example()
    else:
        print("Invalid choice. Running comparison experiments...")
        run_comparison_experiments()

if __name__ == "__main__":
    main()
