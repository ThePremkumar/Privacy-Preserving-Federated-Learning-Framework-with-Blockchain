import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
import copy
import numpy as np

class FederatedClient:
    def __init__(self, client_id, model, train_loader, device='cpu', learning_rate=0.01):
        self.client_id = client_id
        self.model = copy.deepcopy(model)
        self.train_loader = train_loader
        self.device = device
        self.optimizer = optim.SGD(self.model.parameters(), lr=learning_rate)
        self.criterion = nn.CrossEntropyLoss()
        self.model.to(device)
    
    def train(self, epochs=10):
        self.model.train()
        epoch_losses = []
        
        for epoch in range(epochs):
            total_loss = 0.0
            num_batches = 0
            
            for batch_idx, (data, target) in enumerate(self.train_loader):
                data, target = data.to(self.device), target.to(self.device)
                
                self.optimizer.zero_grad()
                output = self.model(data)
                loss = self.criterion(output, target)
                loss.backward()
                self.optimizer.step()
                
                total_loss += loss.item()
                num_batches += 1
            
            avg_loss = total_loss / num_batches
            epoch_losses.append(avg_loss)
            print(f"Client {self.client_id} - Epoch {epoch+1}/{epochs}, Loss: {avg_loss:.4f}")
        
        return epoch_losses
    
    def get_model_parameters(self):
        return self.model.get_parameters()
    
    def set_model_parameters(self, parameters):
        self.model.set_parameters(parameters)
    
    def evaluate(self, test_loader):
        self.model.eval()
        test_loss = 0
        correct = 0
        total = 0
        
        with torch.no_grad():
            for data, target in test_loader:
                data, target = data.to(self.device), target.to(self.device)
                output = self.model(data)
                test_loss += self.criterion(output, target).item()
                pred = output.argmax(dim=1, keepdim=True)
                correct += pred.eq(target.view_as(pred)).sum().item()
                total += target.size(0)
        
        test_loss /= len(test_loader)
        accuracy = 100. * correct / total
        return test_loss, accuracy
