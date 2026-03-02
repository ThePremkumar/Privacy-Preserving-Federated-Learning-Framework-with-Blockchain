import torch
from torch.utils.data import DataLoader, TensorDataset, random_split
from torchvision import datasets, transforms
from sklearn.datasets import make_classification, make_regression
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
import numpy as np
from typing import Tuple, Dict, Any
import logging

class FederatedDataLoader:
    """Data loader for federated learning scenarios"""
    
    def __init__(self):
        self.logger = logging.getLogger("FederatedDataLoader")
    
    def load_cifar10(self, data_dir: str = "./data", num_clients: int = 4, 
                    alpha: float = 0.5) -> Tuple[Dict[str, DataLoader], DataLoader]:
        """
        Load CIFAR-10 dataset and split among clients using Dirichlet distribution
        
        Args:
            data_dir: Directory to store/load dataset
            num_clients: Number of clients to split data among
            alpha: Dirichlet distribution parameter for non-IID split
        
        Returns:
            Tuple of (client_loaders, test_loader)
        """
        # Data transformations
        transform_train = transforms.Compose([
            transforms.RandomCrop(32, padding=4),
            transforms.RandomHorizontalFlip(),
            transforms.ToTensor(),
            transforms.Normalize((0.4914, 0.4822, 0.4465), (0.2023, 0.1994, 0.2010)),
        ])
        
        transform_test = transforms.Compose([
            transforms.ToTensor(),
            transforms.Normalize((0.4914, 0.4822, 0.4465), (0.2023, 0.1994, 0.2010)),
        ])
        
        # Load datasets
        train_dataset = datasets.CIFAR10(root=data_dir, train=True, 
                                       download=True, transform=transform_train)
        test_dataset = datasets.CIFAR10(root=data_dir, train=False, 
                                      download=True, transform=transform_test)
        
        # Split training data among clients using Dirichlet distribution
        client_datasets = self._dirichlet_split(train_dataset, num_clients, alpha)
        
        # Create data loaders
        client_loaders = {}
        for i, dataset in enumerate(client_datasets):
            client_loaders[f"client_{i}"] = DataLoader(
                dataset, batch_size=32, shuffle=True, num_workers=2
            )
        
        test_loader = DataLoader(test_dataset, batch_size=100, shuffle=False, num_workers=2)
        
        self.logger.info(f"Loaded CIFAR-10: {len(train_dataset)} training samples, "
                        f"{len(test_dataset)} test samples, split among {num_clients} clients")
        
        return client_loaders, test_loader
    
    def load_mnist(self, data_dir: str = "./data", num_clients: int = 4, 
                  alpha: float = 0.5) -> Tuple[Dict[str, DataLoader], DataLoader]:
        """
        Load MNIST dataset and split among clients using Dirichlet distribution
        """
        # Data transformations
        transform = transforms.Compose([
            transforms.ToTensor(),
            transforms.Normalize((0.1307,), (0.3081,))
        ])
        
        # Load datasets
        train_dataset = datasets.MNIST(root=data_dir, train=True, 
                                     download=True, transform=transform)
        test_dataset = datasets.MNIST(root=data_dir, train=False, 
                                    download=True, transform=transform)
        
        # Split training data among clients
        client_datasets = self._dirichlet_split(train_dataset, num_clients, alpha)
        
        # Create data loaders
        client_loaders = {}
        for i, dataset in enumerate(client_datasets):
            client_loaders[f"client_{i}"] = DataLoader(
                dataset, batch_size=64, shuffle=True, num_workers=2
            )
        
        test_loader = DataLoader(test_dataset, batch_size=1000, shuffle=False, num_workers=2)
        
        self.logger.info(f"Loaded MNIST: {len(train_dataset)} training samples, "
                        f"{len(test_dataset)} test samples, split among {num_clients} clients")
        
        return client_loaders, test_loader
    
    def load_synthetic_tabular(self, n_samples: int = 10000, n_features: int = 20, 
                             n_classes: int = 10, num_clients: int = 4, 
                             alpha: float = 0.5) -> Tuple[Dict[str, DataLoader], DataLoader]:
        """
        Generate synthetic tabular data for federated learning
        
        Args:
            n_samples: Total number of samples
            n_features: Number of features
            n_classes: Number of classes
            num_clients: Number of clients
            alpha: Dirichlet parameter for non-IID split
        
        Returns:
            Tuple of (client_loaders, test_loader)
        """
        # Generate synthetic data
        X, y = make_classification(n_samples=n_samples, n_features=n_features, 
                                   n_classes=n_classes, n_informative=n_features//2, 
                                   random_state=42)
        
        # Split into train and test
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, 
                                                            random_state=42, stratify=y)
        
        # Standardize features
        scaler = StandardScaler()
        X_train = scaler.fit_transform(X_train)
        X_test = scaler.transform(X_test)
        
        # Convert to tensors
        X_train_tensor = torch.FloatTensor(X_train)
        y_train_tensor = torch.LongTensor(y_train)
        X_test_tensor = torch.FloatTensor(X_test)
        y_test_tensor = torch.LongTensor(y_test)
        
        # Create datasets
        train_dataset = TensorDataset(X_train_tensor, y_train_tensor)
        test_dataset = TensorDataset(X_test_tensor, y_test_tensor)
        
        # Split training data among clients
        client_datasets = self._dirichlet_split_tabular(train_dataset, num_clients, alpha)
        
        # Create data loaders
        client_loaders = {}
        for i, dataset in enumerate(client_datasets):
            client_loaders[f"client_{i}"] = DataLoader(
                dataset, batch_size=32, shuffle=True
            )
        
        test_loader = DataLoader(test_dataset, batch_size=100, shuffle=False)
        
        self.logger.info(f"Generated synthetic data: {len(X_train)} training samples, "
                        f"{len(X_test)} test samples, split among {num_clients} clients")
        
        return client_loaders, test_loader
    
    def _dirichlet_split(self, dataset, num_clients: int, alpha: float):
        """Split dataset using Dirichlet distribution for non-IID partition"""
        num_classes = len(dataset.classes)
        num_samples = len(dataset)
        
        # Get labels
        labels = np.array([y for _, y in dataset])
        
        # Initialize client datasets
        client_datasets = [[] for _ in range(num_clients)]
        
        # For each class, distribute samples among clients using Dirichlet
        for c in range(num_classes):
            # Get indices of samples belonging to class c
            class_indices = np.where(labels == c)[0]
            
            # Generate Dirichlet distribution
            proportions = np.random.dirichlet(np.repeat(alpha, num_clients))
            
            # Calculate number of samples for each client
            num_samples_class = len(class_indices)
            client_samples = (proportions * num_samples_class).astype(int)
            
            # Distribute samples
            start_idx = 0
            for i in range(num_clients):
                end_idx = start_idx + client_samples[i]
                selected_indices = class_indices[start_idx:end_idx]
                client_datasets[i].extend(selected_indices)
                start_idx = end_idx
        
        # Create subset datasets
        subset_datasets = []
        for i in range(num_clients):
            indices = client_datasets[i]
            subset = torch.utils.data.Subset(dataset, indices)
            subset_datasets.append(subset)
        
        return subset_datasets
    
    def _dirichlet_split_tabular(self, dataset, num_clients: int, alpha: float):
        """Split tabular dataset using Dirichlet distribution"""
        num_samples = len(dataset)
        labels = np.array([y for _, y in dataset])
        num_classes = len(np.unique(labels))
        
        # Initialize client datasets
        client_datasets = [[] for _ in range(num_clients)]
        
        # For each class, distribute samples among clients using Dirichlet
        for c in range(num_classes):
            # Get indices of samples belonging to class c
            class_indices = np.where(labels == c)[0]
            
            # Generate Dirichlet distribution
            proportions = np.random.dirichlet(np.repeat(alpha, num_clients))
            
            # Calculate number of samples for each client
            num_samples_class = len(class_indices)
            client_samples = (proportions * num_samples_class).astype(int)
            
            # Distribute samples
            start_idx = 0
            for i in range(num_clients):
                end_idx = start_idx + client_samples[i]
                selected_indices = class_indices[start_idx:end_idx]
                client_datasets[i].extend(selected_indices)
                start_idx = end_idx
        
        # Create subset datasets
        subset_datasets = []
        for i in range(num_clients):
            indices = client_datasets[i]
            subset = torch.utils.data.Subset(dataset, indices)
            subset_datasets.append(subset)
        
        return subset_datasets
