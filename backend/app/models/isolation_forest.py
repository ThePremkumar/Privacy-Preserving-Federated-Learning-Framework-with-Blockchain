import torch
import torch.nn as nn
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import pickle
from typing import Dict, List, Tuple, Any

class IsolationForestAnomalyDetector:
    """
    Isolation Forest model for anomaly detection in healthcare data
    """
    
    def __init__(self, contamination: float = 0.1, random_state: int = 42):
        self.contamination = contamination
        self.random_state = random_state
        self.model = IsolationForest(
            contamination=contamination,
            random_state=random_state,
            n_estimators=100
        )
        self.scaler = StandardScaler()
        self.is_fitted = False
        
    def fit(self, X: np.ndarray) -> None:
        """
        Fit the Isolation Forest model on training data
        
        Args:
            X: Training data features
        """
        # Standardize the data
        X_scaled = self.scaler.fit_transform(X)
        
        # Fit the model
        self.model.fit(X_scaled)
        self.is_fitted = True
        
    def predict(self, X: np.ndarray) -> np.ndarray:
        """
        Predict anomalies (-1 for anomalies, 1 for normal)
        
        Args:
            X: Test data features
            
        Returns:
            Array of predictions (-1 for anomalies, 1 for normal)
        """
        if not self.is_fitted:
            raise ValueError("Model must be fitted before making predictions")
            
        # Standardize the data
        X_scaled = self.scaler.transform(X)
        
        # Make predictions
        predictions = self.model.predict(X_scaled)
        
        return predictions
    
    def predict_anomaly_scores(self, X: np.ndarray) -> np.ndarray:
        """
        Get anomaly scores (lower scores indicate more anomalous)
        
        Args:
            X: Test data features
            
        Returns:
            Array of anomaly scores
        """
        if not self.is_fitted:
            raise ValueError("Model must be fitted before making predictions")
            
        # Standardize the data
        X_scaled = self.scaler.transform(X)
        
        # Get anomaly scores
        scores = self.model.decision_function(X_scaled)
        
        return scores
    
    def get_anomaly_details(self, X: np.ndarray, threshold: float = None) -> Dict[str, Any]:
        """
        Get detailed anomaly information
        
        Args:
            X: Test data features
            threshold: Anomaly threshold (if None, use model's default)
            
        Returns:
            Dictionary with anomaly details
        """
        predictions = self.predict(X)
        scores = self.predict_anomaly_scores(X)
        
        if threshold is None:
            # Use median score as threshold
            threshold = np.median(scores)
        
        anomalies = predictions == -1
        anomaly_indices = np.where(anomalies)[0]
        
        return {
            'predictions': predictions,
            'anomaly_scores': scores,
            'anomaly_indices': anomaly_indices,
            'num_anomalies': len(anomaly_indices),
            'anomaly_rate': len(anomaly_indices) / len(X),
            'threshold': threshold,
            'high_risk_indices': anomaly_indices[scores[anomalies] < threshold]
        }
    
    def save_model(self, filepath: str) -> None:
        """
        Save the model and scaler to disk
        
        Args:
            filepath: Path to save the model
        """
        model_data = {
            'model': self.model,
            'scaler': self.scaler,
            'contamination': self.contamination,
            'random_state': self.random_state,
            'is_fitted': self.is_fitted
        }
        
        with open(filepath, 'wb') as f:
            pickle.dump(model_data, f)
    
    def load_model(self, filepath: str) -> None:
        """
        Load the model and scaler from disk
        
        Args:
            filepath: Path to load the model from
        """
        with open(filepath, 'rb') as f:
            model_data = pickle.load(f)
        
        self.model = model_data['model']
        self.scaler = model_data['scaler']
        self.contamination = model_data['contamination']
        self.random_state = model_data['random_state']
        self.is_fitted = model_data['is_fitted']
    
    def get_parameters(self) -> Dict[str, Any]:
        """
        Get model parameters for federated learning
        
        Returns:
            Dictionary of model parameters
        """
        if not self.is_fitted:
            raise ValueError("Model must be fitted before getting parameters")
            
        return {
            'tree_params': [tree.tree_.__getstate__() for tree in self.model.estimators_],
            'scaler_mean': self.scaler.mean_,
            'scaler_scale': self.scaler.scale_,
            'contamination': self.contamination,
            'random_state': self.random_state
        }
    
    def set_parameters(self, parameters: Dict[str, Any]) -> None:
        """
        Set model parameters for federated learning
        
        Args:
            parameters: Dictionary of model parameters
        """
        # Set tree parameters
        for i, tree in enumerate(self.model.estimators_):
            tree.tree_.__setstate__(parameters['tree_params'][i])
        
        # Set scaler parameters
        self.scaler.mean_ = parameters['scaler_mean']
        self.scaler.scale_ = parameters['scaler_scale']
        
        # Set other parameters
        self.contamination = parameters['contamination']
        self.random_state = parameters['random_state']
        self.is_fitted = True


class HealthcareAnomalyDetector:
    """
    Specialized anomaly detector for healthcare data
    """
    
    def __init__(self, contamination: float = 0.05):
        self.vital_signs_detector = IsolationForestAnomalyDetector(contamination)
        self.lab_results_detector = IsolationForestAnomalyDetector(contamination)
        self.time_series_detector = IsolationForestAnomalyDetector(contamination)
        
    def fit_vital_signs(self, vital_signs_data: np.ndarray) -> None:
        """
        Fit model on vital signs data
        
        Args:
            vital_signs_data: Array of vital signs (heart_rate, blood_pressure, etc.)
        """
        self.vital_signs_detector.fit(vital_signs_data)
        
    def fit_lab_results(self, lab_results_data: np.ndarray) -> None:
        """
        Fit model on lab results data
        
        Args:
            lab_results_data: Array of lab results
        """
        self.lab_results_detector.fit(lab_results_data)
        
    def fit_time_series(self, time_series_data: np.ndarray) -> None:
        """
        Fit model on time series data
        
        Args:
            time_series_data: Array of time series data
        """
        self.time_series_detector.fit(time_series_data)
    
    def detect_anomalies(self, patient_data: Dict[str, np.ndarray]) -> Dict[str, Any]:
        """
        Detect anomalies in patient data
        
        Args:
            patient_data: Dictionary containing different types of patient data
            
        Returns:
            Dictionary with anomaly detection results
        """
        results = {}
        
        # Detect anomalies in vital signs
        if 'vital_signs' in patient_data:
            vital_anomalies = self.vital_signs_detector.get_anomaly_details(
                patient_data['vital_signs']
            )
            results['vital_signs'] = vital_anomalies
        
        # Detect anomalies in lab results
        if 'lab_results' in patient_data:
            lab_anomalies = self.lab_results_detector.get_anomaly_details(
                patient_data['lab_results']
            )
            results['lab_results'] = lab_anomalies
        
        # Detect anomalies in time series
        if 'time_series' in patient_data:
            ts_anomalies = self.time_series_detector.get_anomaly_details(
                patient_data['time_series']
            )
            results['time_series'] = ts_anomalies
        
        # Calculate overall risk score
        total_anomalies = sum(
            result.get('num_anomalies', 0) for result in results.values()
        )
        total_data_points = sum(
            len(patient_data[key]) for key in patient_data.keys()
        )
        
        overall_risk = total_anomalies / max(total_data_points, 1)
        
        results['overall_risk'] = overall_risk
        results['risk_level'] = self._categorize_risk(overall_risk)
        
        return results
    
    def _categorize_risk(self, risk_score: float) -> str:
        """
        Categorize risk level based on risk score
        
        Args:
            risk_score: Overall risk score (0-1)
            
        Returns:
            Risk level category
        """
        if risk_score < 0.1:
            return 'LOW'
        elif risk_score < 0.3:
            return 'MEDIUM'
        elif risk_score < 0.5:
            return 'HIGH'
        else:
            return 'CRITICAL'


# PyTorch wrapper for federated learning compatibility
class IsolationForestTorch(nn.Module):
    """
    PyTorch wrapper for Isolation Forest to work with federated learning framework
    """
    
    def __init__(self, contamination: float = 0.1, random_state: int = 42):
        super(IsolationForestTorch, self).__init__()
        self.detector = IsolationForestAnomalyDetector(contamination, random_state)
        
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Forward pass through the model
        
        Args:
            x: Input tensor
            
        Returns:
            Anomaly scores tensor
        """
        # Convert to numpy for sklearn
        x_np = x.detach().cpu().numpy()
        
        # Get anomaly scores
        scores = self.detector.predict_anomaly_scores(x_np)
        
        # Convert back to tensor
        return torch.tensor(scores, dtype=torch.float32, device=x.device)
    
    def fit(self, x: torch.Tensor) -> None:
        """
        Fit the model
        
        Args:
            x: Training data tensor
        """
        x_np = x.detach().cpu().numpy()
        self.detector.fit(x_np)
    
    def get_parameters(self) -> List[torch.Tensor]:
        """
        Get model parameters for federated learning
        
        Returns:
            List of parameter tensors
        """
        params = self.detector.get_parameters()
        
        # Convert numpy arrays to tensors
        tensors = []
        for key, value in params.items():
            if isinstance(value, np.ndarray):
                tensors.append(torch.tensor(value, dtype=torch.float32))
        
        return tensors
    
    def set_parameters(self, parameters: List[torch.Tensor]) -> None:
        """
        Set model parameters for federated learning
        
        Args:
            parameters: List of parameter tensors
        """
        # Convert tensors to numpy and reconstruct parameters dict
        params = self.detector.get_parameters()
        
        # This is a simplified version - in practice, you'd need more sophisticated
        # parameter handling for sklearn models
        if len(parameters) > 0:
            # Update scaler parameters
            if len(parameters) >= 2:
                params['scaler_mean'] = parameters[0].detach().cpu().numpy()
                params['scaler_scale'] = parameters[1].detach().cpu().numpy()
            
            self.detector.set_parameters(params)
