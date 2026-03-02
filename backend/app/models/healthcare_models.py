import torch
import torch.nn as nn
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
import pickle
from typing import Dict, List, Tuple, Any

class LogisticRegressionMedical(nn.Module):
    """
    Logistic Regression model for binary disease prediction
    """
    
    def __init__(self, input_size: int, hidden_size: int = 64, num_classes: int = 2):
        super(LogisticRegressionMedical, self).__init__()
        self.input_size = input_size
        self.hidden_size = hidden_size
        self.num_classes = num_classes
        
        # Neural network for medical prediction
        self.fc1 = nn.Linear(input_size, hidden_size)
        self.relu = nn.ReLU()
        self.dropout = nn.Dropout(0.2)
        self.fc2 = nn.Linear(hidden_size, num_classes)
        
        # Initialize weights
        self._initialize_weights()
    
    def _initialize_weights(self):
        """Initialize weights for better convergence"""
        for m in self.modules():
            if isinstance(m, nn.Linear):
                nn.init.xavier_uniform_(m.weight)
                nn.init.constant_(m.bias, 0)
    
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Forward pass
        
        Args:
            x: Input tensor of shape (batch_size, input_size)
            
        Returns:
            Output tensor of shape (batch_size, num_classes)
        """
        x = self.fc1(x)
        x = self.relu(x)
        x = self.dropout(x)
        x = self.fc2(x)
        return x
    
    def predict_proba(self, x: torch.Tensor) -> torch.Tensor:
        """
        Predict class probabilities
        
        Args:
            x: Input tensor
            
        Returns:
            Probability tensor
        """
        logits = self.forward(x)
        probabilities = torch.softmax(logits, dim=1)
        return probabilities
    
    def predict(self, x: torch.Tensor) -> torch.Tensor:
        """
        Predict class labels
        
        Args:
            x: Input tensor
            
        Returns:
            Predicted class labels
        """
        probabilities = self.predict_proba(x)
        predictions = torch.argmax(probabilities, dim=1)
        return predictions
    
    def get_parameters(self) -> List[torch.Tensor]:
        """
        Get model parameters for federated learning
        
        Returns:
            List of parameter tensors
        """
        return [p.data.clone() for p in self.parameters()]
    
    def set_parameters(self, parameters: List[torch.Tensor]) -> None:
        """
        Set model parameters for federated learning
        
        Args:
            parameters: List of parameter tensors
        """
        for p, new_p in zip(self.parameters(), parameters):
            p.data.copy_(new_p)


class RandomForestMedical:
    """
    Random Forest model for multi-class disease classification
    """
    
    def __init__(self, n_estimators: int = 100, max_depth: int = 10, random_state: int = 42):
        self.n_estimators = n_estimators
        self.max_depth = max_depth
        self.random_state = random_state
        self.model = RandomForestClassifier(
            n_estimators=n_estimators,
            max_depth=max_depth,
            random_state=random_state
        )
        self.scaler = StandardScaler()
        self.is_fitted = False
        
    def fit(self, X: np.ndarray, y: np.ndarray) -> None:
        """
        Fit the Random Forest model
        
        Args:
            X: Training features
            y: Training labels
        """
        # Standardize features
        X_scaled = self.scaler.fit_transform(X)
        
        # Fit model
        self.model.fit(X_scaled, y)
        self.is_fitted = True
        
    def predict(self, X: np.ndarray) -> np.ndarray:
        """
        Make predictions
        
        Args:
            X: Test features
            
        Returns:
            Predicted labels
        """
        if not self.is_fitted:
            raise ValueError("Model must be fitted before making predictions")
            
        X_scaled = self.scaler.transform(X)
        return self.model.predict(X_scaled)
    
    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        """
        Predict class probabilities
        
        Args:
            X: Test features
            
        Returns:
            Class probabilities
        """
        if not self.is_fitted:
            raise ValueError("Model must be fitted before making predictions")
            
        X_scaled = self.scaler.transform(X)
        return self.model.predict_proba(X_scaled)
    
    def get_feature_importance(self) -> np.ndarray:
        """
        Get feature importance scores
        
        Returns:
            Feature importance array
        """
        if not self.is_fitted:
            raise ValueError("Model must be fitted before getting feature importance")
            
        return self.model.feature_importances_
    
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
            'n_estimators': self.n_estimators,
            'max_depth': self.max_depth,
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
        self.n_estimators = parameters['n_estimators']
        self.max_depth = parameters['max_depth']
        self.random_state = parameters['random_state']
        self.is_fitted = True
    
    def save_model(self, filepath: str) -> None:
        """
        Save model to disk
        
        Args:
            filepath: Path to save the model
        """
        model_data = {
            'model': self.model,
            'scaler': self.scaler,
            'n_estimators': self.n_estimators,
            'max_depth': self.max_depth,
            'random_state': self.random_state,
            'is_fitted': self.is_fitted
        }
        
        with open(filepath, 'wb') as f:
            pickle.dump(model_data, f)
    
    def load_model(self, filepath: str) -> None:
        """
        Load model from disk
        
        Args:
            filepath: Path to load the model from
        """
        with open(filepath, 'rb') as f:
            model_data = pickle.load(f)
        
        self.model = model_data['model']
        self.scaler = model_data['scaler']
        self.n_estimators = model_data['n_estimators']
        self.max_depth = model_data['max_depth']
        self.random_state = model_data['random_state']
        self.is_fitted = model_data['is_fitted']


class MedicalEnsembleModel:
    """
    Ensemble model combining multiple medical prediction models
    """
    
    def __init__(self, models: List[Any], weights: List[float] = None):
        self.models = models
        self.weights = weights if weights else [1.0 / len(models)] * len(models)
        self.is_fitted = False
        
    def fit(self, X: np.ndarray, y: np.ndarray) -> None:
        """
        Fit all models in the ensemble
        
        Args:
            X: Training features
            y: Training labels
        """
        for model in self.models:
            if hasattr(model, 'fit'):
                model.fit(X, y)
        
        self.is_fitted = True
    
    def predict(self, X: np.ndarray) -> np.ndarray:
        """
        Make ensemble predictions
        
        Args:
            X: Test features
            
        Returns:
            Ensemble predictions
        """
        if not self.is_fitted:
            raise ValueError("Models must be fitted before making predictions")
        
        predictions = []
        for model in self.models:
            if hasattr(model, 'predict'):
                pred = model.predict(X)
                predictions.append(pred)
        
        # Weighted voting
        ensemble_pred = np.zeros_like(predictions[0])
        for i, pred in enumerate(predictions):
            ensemble_pred += self.weights[i] * pred
        
        return np.round(ensemble_pred).astype(int)
    
    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        """
        Make ensemble probability predictions
        
        Args:
            X: Test features
            
        Returns:
            Ensemble probability predictions
        """
        if not self.is_fitted:
            raise ValueError("Models must be fitted before making predictions")
        
        probabilities = []
        for model in self.models:
            if hasattr(model, 'predict_proba'):
                prob = model.predict_proba(X)
                probabilities.append(prob)
        
        # Weighted averaging of probabilities
        ensemble_prob = np.zeros_like(probabilities[0])
        for i, prob in enumerate(probabilities):
            ensemble_prob += self.weights[i] * prob
        
        return ensemble_prob


class DiseaseProgressionModel(nn.Module):
    """
    LSTM model for disease progression prediction
    """
    
    def __init__(self, input_size: int, hidden_size: int = 128, num_layers: int = 2, 
                 num_classes: int = 3, dropout: float = 0.2):
        super(DiseaseProgressionModel, self).__init__()
        self.hidden_size = hidden_size
        self.num_layers = num_layers
        self.num_classes = num_classes
        
        # LSTM layers
        self.lstm = nn.LSTM(
            input_size, hidden_size, num_layers, 
            batch_first=True, dropout=dropout if num_layers > 1 else 0
        )
        
        # Attention mechanism
        self.attention = nn.MultiheadAttention(
            embed_dim=hidden_size, 
            num_heads=8, 
            dropout=dropout,
            batch_first=True
        )
        
        # Classification layers
        self.fc1 = nn.Linear(hidden_size, hidden_size // 2)
        self.relu = nn.ReLU()
        self.dropout = nn.Dropout(dropout)
        self.fc2 = nn.Linear(hidden_size // 2, num_classes)
        
        # Initialize weights
        self._initialize_weights()
    
    def _initialize_weights(self):
        """Initialize weights for better convergence"""
        for m in self.modules():
            if isinstance(m, nn.Linear):
                nn.init.xavier_uniform_(m.weight)
                nn.init.constant_(m.bias, 0)
            elif isinstance(m, nn.LSTM):
                for name, param in m.named_parameters():
                    if 'weight_ih' in name:
                        nn.init.xavier_uniform_(param.data)
                    elif 'weight_hh' in name:
                        nn.init.orthogonal_(param.data)
                    elif 'bias' in name:
                        param.data.fill_(0)
    
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Forward pass
        
        Args:
            x: Input tensor of shape (batch_size, seq_len, input_size)
            
        Returns:
            Output tensor of shape (batch_size, num_classes)
        """
        # LSTM forward pass
        lstm_out, (h_n, c_n) = self.lstm(x)
        
        # Apply attention
        attn_out, _ = self.attention(lstm_out, lstm_out, lstm_out)
        
        # Use the last time step
        final_out = attn_out[:, -1, :]
        
        # Classification
        out = self.fc1(final_out)
        out = self.relu(out)
        out = self.dropout(out)
        out = self.fc2(out)
        
        return out
    
    def predict_progression_stage(self, x: torch.Tensor) -> torch.Tensor:
        """
        Predict disease progression stage
        
        Args:
            x: Input tensor
            
        Returns:
            Predicted progression stage
        """
        logits = self.forward(x)
        probabilities = torch.softmax(logits, dim=1)
        predictions = torch.argmax(probabilities, dim=1)
        return predictions
    
    def get_parameters(self) -> List[torch.Tensor]:
        """
        Get model parameters for federated learning
        
        Returns:
            List of parameter tensors
        """
        return [p.data.clone() for p in self.parameters()]
    
    def set_parameters(self, parameters: List[torch.Tensor]) -> None:
        """
        Set model parameters for federated learning
        
        Args:
            parameters: List of parameter tensors
        """
        for p, new_p in zip(self.parameters(), parameters):
            p.data.copy_(new_p)


class MedicalRiskAssessment:
    """
    Comprehensive risk assessment model combining multiple predictions
    """
    
    def __init__(self, disease_model: Any, anomaly_detector: Any, progression_model: Any):
        self.disease_model = disease_model
        self.anomaly_detector = anomaly_detector
        self.progression_model = progression_model
        
    def assess_patient_risk(self, patient_data: Dict[str, torch.Tensor]) -> Dict[str, Any]:
        """
        Comprehensive patient risk assessment
        
        Args:
            patient_data: Dictionary containing patient data
            
        Returns:
            Dictionary with risk assessment results
        """
        results = {}
        
        # Disease prediction
        if 'clinical_features' in patient_data:
            disease_pred = self.disease_model.predict(patient_data['clinical_features'])
            disease_prob = self.disease_model.predict_proba(patient_data['clinical_features'])
            results['disease_prediction'] = {
                'prediction': disease_pred,
                'probability': disease_prob,
                'risk_level': self._categorize_disease_risk(disease_prob)
            }
        
        # Anomaly detection
        if 'vital_signs' in patient_data:
            anomaly_scores = self.anomaly_detector.predict_anomaly_scores(
                patient_data['vital_signs']
            )
            results['anomaly_assessment'] = {
                'anomaly_scores': anomaly_scores,
                'is_anomalous': anomaly_scores < 0,
                'severity': self._categorize_anomaly_severity(anomaly_scores)
            }
        
        # Disease progression
        if 'time_series' in patient_data:
            progression_pred = self.progression_model.predict_progression_stage(
                patient_data['time_series']
            )
            progression_prob = torch.softmax(
                self.progression_model(patient_data['time_series']), dim=1
            )
            results['progression_prediction'] = {
                'stage': progression_pred,
                'probability': progression_prob,
                'progression_risk': self._categorize_progression_risk(progression_prob)
            }
        
        # Overall risk assessment
        overall_risk = self._calculate_overall_risk(results)
        results['overall_risk'] = overall_risk
        
        return results
    
    def _categorize_disease_risk(self, probabilities: torch.Tensor) -> str:
        """Categorize disease risk based on prediction probabilities"""
        max_prob = torch.max(probabilities).item()
        if max_prob < 0.3:
            return 'LOW'
        elif max_prob < 0.6:
            return 'MEDIUM'
        elif max_prob < 0.8:
            return 'HIGH'
        else:
            return 'VERY_HIGH'
    
    def _categorize_anomaly_severity(self, scores: torch.Tensor) -> str:
        """Categorize anomaly severity"""
        avg_score = torch.mean(scores).item()
        if avg_score > 0:
            return 'NORMAL'
        elif avg_score > -0.2:
            return 'MILD'
        elif avg_score > -0.5:
            return 'MODERATE'
        else:
            return 'SEVERE'
    
    def _categorize_progression_risk(self, probabilities: torch.Tensor) -> str:
        """Categorize disease progression risk"""
        # Assuming class 2 is the most severe stage
        severe_prob = probabilities[:, 2].mean().item()
        if severe_prob < 0.2:
            return 'STABLE'
        elif severe_prob < 0.5:
            return 'PROGRESSING'
        else:
            return 'RAPID_PROGRESSION'
    
    def _calculate_overall_risk(self, results: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate overall patient risk"""
        risk_scores = []
        
        # Disease risk score
        if 'disease_prediction' in results:
            risk_level = results['disease_prediction']['risk_level']
            risk_scores.append(self._risk_level_to_score(risk_level))
        
        # Anomaly risk score
        if 'anomaly_assessment' in results:
            severity = results['anomaly_assessment']['severity']
            risk_scores.append(self._severity_to_score(severity))
        
        # Progression risk score
        if 'progression_prediction' in results:
            prog_risk = results['progression_prediction']['progression_risk']
            risk_scores.append(self._progression_to_score(prog_risk))
        
        # Calculate average risk
        if risk_scores:
            avg_risk = np.mean(risk_scores)
            overall_level = self._score_to_risk_level(avg_risk)
        else:
            avg_risk = 0.0
            overall_level = 'UNKNOWN'
        
        return {
            'risk_score': avg_risk,
            'risk_level': overall_level,
            'recommendations': self._get_recommendations(overall_level)
        }
    
    def _risk_level_to_score(self, risk_level: str) -> float:
        mapping = {'LOW': 0.2, 'MEDIUM': 0.5, 'HIGH': 0.8, 'VERY_HIGH': 1.0}
        return mapping.get(risk_level, 0.0)
    
    def _severity_to_score(self, severity: str) -> float:
        mapping = {'NORMAL': 0.0, 'MILD': 0.3, 'MODERATE': 0.6, 'SEVERE': 1.0}
        return mapping.get(severity, 0.0)
    
    def _progression_to_score(self, progression: str) -> float:
        mapping = {'STABLE': 0.1, 'PROGRESSING': 0.6, 'RAPID_PROGRESSION': 1.0}
        return mapping.get(progression, 0.0)
    
    def _score_to_risk_level(self, score: float) -> str:
        if score < 0.3:
            return 'LOW'
        elif score < 0.6:
            return 'MEDIUM'
        elif score < 0.8:
            return 'HIGH'
        else:
            return 'CRITICAL'
    
    def _get_recommendations(self, risk_level: str) -> List[str]:
        """Get medical recommendations based on risk level"""
        recommendations = {
            'LOW': ['Continue routine monitoring', 'Schedule regular check-ups'],
            'MEDIUM': ['Increase monitoring frequency', 'Consider additional tests'],
            'HIGH': ['Immediate medical consultation', 'Comprehensive evaluation'],
            'CRITICAL': ['Emergency medical attention', 'Intensive monitoring required']
        }
        return recommendations.get(risk_level, ['Consult healthcare provider'])
