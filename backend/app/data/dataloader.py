import torch
from torch.utils.data import DataLoader, TensorDataset
from torchvision import datasets, transforms
import numpy as np

class FederatedDataLoader:
    def __init__(self, dataset_name='mnist', num_clients=10, batch_size=32):
        self.dataset_name = dataset_name
        self.num_clients = num_clients
        self.batch_size = batch_size
        self.transform = transforms.Compose([
            transforms.ToTensor(),
            transforms.Normalize((0.1307,), (0.3081,))
        ])
        
    def load_data(self):
        if self.dataset_name == 'mnist':
            train_dataset = datasets.MNIST('./data', train=True, download=True, transform=self.transform)
            test_dataset = datasets.MNIST('./data', train=False, download=True, transform=self.transform)
        elif self.dataset_name == 'cifar10':
            train_dataset = datasets.CIFAR10('./data', train=True, download=True, transform=self.transform)
            test_dataset = datasets.CIFAR10('./data', train=False, download=True, transform=self.transform)
        elif self.dataset_name == 'synthetic_tabular':
            # Create synthetic data for testing
            X = torch.randn(100, 20)
            y = torch.randint(0, 10, (100,))
            dataset = TensorDataset(X, y)
            return dataset, dataset
        else:
            raise ValueError(f"Unsupported dataset: {self.dataset_name}")
        
        return train_dataset, test_dataset

    def load_mnist(self, data_dir='./data', num_clients=10, alpha=1.0):
        # Implementation for Simulation
        train_data, test_data = self.load_data()
        client_datasets = self.split_data(train_data)
        client_loaders = {i: self.get_client_dataloader(d) for i, d in enumerate(client_datasets)}
        return client_loaders, self.get_test_dataloader(test_data)

    def load_cifar10(self, data_dir='./data', num_clients=10, alpha=1.0):
        self.dataset_name = 'cifar10'
        return self.load_mnist(data_dir, num_clients, alpha)

    def load_synthetic_tabular(self, n_samples=1000, n_features=20, n_classes=10, num_clients=10, alpha=1.0):
        X = torch.randn(n_samples, n_features)
        y = torch.randint(0, n_classes, (n_samples,))
        dataset = TensorDataset(X, y)
        self.num_clients = num_clients
        client_datasets = self.split_data(dataset)
        client_loaders = {i: self.get_client_dataloader(d) for i, d in enumerate(client_datasets)}
        return client_loaders, self.get_test_dataloader(dataset)
    
    def split_data(self, dataset):
        # Split dataset into non-iid partitions for federated learning
        num_samples = len(dataset)
        samples_per_client = num_samples // self.num_clients
        
        client_datasets = []
        indices = np.random.permutation(num_samples)
        
        for i in range(self.num_clients):
            start_idx = i * samples_per_client
            if i == self.num_clients - 1:
                end_idx = num_samples
            else:
                end_idx = (i + 1) * samples_per_client
            
            client_indices = indices[start_idx:end_idx]
            client_data = torch.utils.data.Subset(dataset, client_indices)
            client_datasets.append(client_data)
        
        return client_datasets
    
    def get_client_dataloader(self, client_dataset):
        return DataLoader(client_dataset, batch_size=self.batch_size, shuffle=True)
    
    def get_test_dataloader(self, test_dataset):
        return DataLoader(test_dataset, batch_size=self.batch_size, shuffle=False)
