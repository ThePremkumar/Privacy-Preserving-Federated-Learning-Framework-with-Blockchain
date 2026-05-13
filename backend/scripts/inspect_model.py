import torch
import os
import numpy as np

# Check common paths
paths = [
    "data/trained_models/healthcare_model.pt",
    "../data/trained_models/healthcare_model.pt",
    "backend/data/trained_models/healthcare_model.pt"
]

model_path = None
for p in paths:
    if os.path.exists(p):
        model_path = p
        break

if model_path:
    print(f"Loading model from {model_path}")
    # Using weights_only=False for inspection of old checkpoints
    checkpoint = torch.load(model_path, map_location=torch.device('cpu'), weights_only=False)
    print("Keys in checkpoint:", checkpoint.keys())
    
    # Check state dict to infer dimensions
    state_dict = checkpoint['model_state_dict']
    print("\nLayer shapes:")
    for key in sorted(state_dict.keys()):
        if 'weight' in key:
            print(f"{key:40s}: {state_dict[key].shape}")
else:
    print("Model file not found. Checked:", paths)
