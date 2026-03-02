import unittest
import torch
import sys
import os

# Add src to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'src'))

from models.cnn import CNNModel
from models.lstm import LSTMModel

class TestModels(unittest.TestCase):
    def setUp(self):
        self.batch_size = 4
        self.num_classes = 10
        self.device = torch.device('cpu')
    
    def test_cnn_model_forward(self):
        """Test CNN model forward pass"""
        model = CNNModel(num_classes=self.num_classes)
        
        # Test input shape for MNIST (1, 28, 28)
        x = torch.randn(self.batch_size, 1, 28, 28)
        output = model(x)
        
        self.assertEqual(output.shape, (self.batch_size, self.num_classes))
    
    def test_cnn_model_parameters(self):
        """Test CNN model parameter getting/setting"""
        model = CNNModel(num_classes=self.num_classes)
        
        # Get parameters
        original_params = model.get_parameters()
        self.assertEqual(len(original_params), len(list(model.parameters())))
        
        # Set parameters
        model.set_parameters(original_params)
        
        # Verify parameters are the same
        new_params = model.get_parameters()
        for orig, new in zip(original_params, new_params):
            self.assertTrue(torch.equal(orig, new))
    
    def test_lstm_model_forward(self):
        """Test LSTM model forward pass"""
        model = LSTMModel(num_classes=self.num_classes)
        
        # Test input shape for flattened MNIST (784)
        x = torch.randn(self.batch_size, 784)
        output = model(x)
        
        self.assertEqual(output.shape, (self.batch_size, self.num_classes))
    
    def test_lstm_model_parameters(self):
        """Test LSTM model parameter getting/setting"""
        model = LSTMModel(num_classes=self.num_classes)
        
        # Get parameters
        original_params = model.get_parameters()
        self.assertEqual(len(original_params), len(list(model.parameters())))
        
        # Set parameters
        model.set_parameters(original_params)
        
        # Verify parameters are the same
        new_params = model.get_parameters()
        for orig, new in zip(original_params, new_params):
            self.assertTrue(torch.equal(orig, new))

if __name__ == '__main__':
    unittest.main()
