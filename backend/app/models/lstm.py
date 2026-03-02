import torch
import torch.nn as nn

class LSTMModel(nn.Module):
    def __init__(self, input_size=784, hidden_size=128, num_layers=2, num_classes=10):
        super(LSTMModel, self).__init__()
        self.hidden_size = hidden_size
        self.num_layers = num_layers
        self.lstm = nn.LSTM(input_size, hidden_size, num_layers, batch_first=True)
        self.fc = nn.Linear(hidden_size, num_classes)
    
    def forward(self, x):
        # Reshape input for LSTM: (batch, seq_len, input_size)
        x = x.view(x.size(0), 1, -1)
        
        # Set initial hidden and cell states
        h0 = torch.zeros(self.num_layers, x.size(0), self.hidden_size).to(x.device)
        c0 = torch.zeros(self.num_layers, x.size(0), self.hidden_size).to(x.device)
        
        # Forward propagate LSTM
        out, _ = self.lstm(x, (h0, c0))
        
        # Decode the hidden state of the last time step
        out = self.fc(out[:, -1, :])
        return out
    
    def get_parameters(self):
        return [p.data.clone() for p in self.parameters()]
    
    def set_parameters(self, parameters):
        for p, new_p in zip(self.parameters(), parameters):
            p.data.copy_(new_p)
