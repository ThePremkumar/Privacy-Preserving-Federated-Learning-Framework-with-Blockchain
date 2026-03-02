import json
from typing import Dict, Any

class Config:
    def __init__(self, config_path: str = None):
        """
        Initialize configuration
        
        Args:
            config_path: Path to configuration JSON file
        """
        # Default configuration
        self.config = {
            "model": {
                "type": "cnn",
                "num_classes": 10
            },
            "data": {
                "dataset": "mnist",
                "num_clients": 10,
                "batch_size": 32
            },
            "training": {
                "rounds": 10,
                "local_epochs": 5,
                "learning_rate": 0.01,
                "client_fraction": 1.0
            },
            "privacy": {
                "enabled": False,
                "epsilon": 1.0,
                "delta": 1e-5,
                "clip_norm": 1.0
            },
            "server": {
                "host": "localhost",
                "port": 5000
            },
            "logging": {
                "level": "INFO",
                "save_metrics": True,
                "save_model": True
            }
        }
        
        if config_path:
            self.load_config(config_path)
    
    def load_config(self, config_path: str):
        """
        Load configuration from JSON file
        """
        try:
            with open(config_path, 'r') as f:
                loaded_config = json.load(f)
            
            # Update default config with loaded config
            self._update_config(self.config, loaded_config)
            print(f"Configuration loaded from {config_path}")
        
        except FileNotFoundError:
            print(f"Config file {config_path} not found, using defaults")
        except json.JSONDecodeError as e:
            print(f"Error parsing config file: {e}, using defaults")
    
    def save_config(self, config_path: str):
        """
        Save current configuration to JSON file
        """
        with open(config_path, 'w') as f:
            json.dump(self.config, f, indent=2)
        print(f"Configuration saved to {config_path}")
    
    def _update_config(self, base_config: Dict, new_config: Dict):
        """
        Recursively update configuration
        """
        for key, value in new_config.items():
            if key in base_config and isinstance(base_config[key], dict) and isinstance(value, dict):
                self._update_config(base_config[key], value)
            else:
                base_config[key] = value
    
    def get(self, key_path: str, default=None):
        """
        Get configuration value using dot notation
        
        Args:
            key_path: Dot-separated path (e.g., "model.type")
            default: Default value if key not found
        """
        keys = key_path.split('.')
        value = self.config
        
        try:
            for key in keys:
                value = value[key]
            return value
        except (KeyError, TypeError):
            return default
    
    def set(self, key_path: str, value):
        """
        Set configuration value using dot notation
        
        Args:
            key_path: Dot-separated path (e.g., "model.type")
            value: Value to set
        """
        keys = key_path.split('.')
        config = self.config
        
        # Navigate to the parent of the target key
        for key in keys[:-1]:
            if key not in config:
                config[key] = {}
            config = config[key]
        
        # Set the final value
        config[keys[-1]] = value
    
    def to_dict(self) -> Dict[str, Any]:
        """
        Get configuration as dictionary
        """
        return self.config.copy()
    
    def print_config(self):
        """
        Print current configuration
        """
        print("Current Configuration:")
        print(json.dumps(self.config, indent=2))
