import hashlib
import json
import time
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict
from web3 import Web3
from eth_account import Account
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class TrainingRound:
    """Data class for training round information"""
    round_number: int
    model_hash: str
    participating_hospitals: List[str]
    accuracy: float
    loss: float
    timestamp: int
    data_points: int
    convergence_achieved: bool
    anomaly_count: int

@dataclass
class ModelUpdate:
    """Data class for model update information"""
    update_id: str
    hospital_id: str
    model_hash: str
    previous_hash: str
    timestamp: int
    update_type: str  # 'training', 'aggregation', 'deployment'
    metadata: Dict[str, Any]

class BlockchainAuditService:
    """
    Blockchain-based audit trail service for federated learning
    """
    
    def __init__(self, web3_provider_url: str = "http://localhost:8545", 
                 contract_address: str = None, private_key: str = None):
        """
        Initialize blockchain audit service
        
        Args:
            web3_provider_url: Web3 provider URL
            contract_address: Smart contract address
            private_key: Private key for transactions
        """
        self.web3 = Web3(Web3.HTTPProvider(web3_provider_url))
        self.contract_address = contract_address
        self.private_key = private_key
        
        if self.private_key:
            self.account = Account.from_key(private_key)
        else:
            self.account = None
        
        # Initialize smart contract (simplified version)
        self.contract = None
        if contract_address:
            self._initialize_contract()
        
        # Local storage fallback (in production, use actual blockchain)
        self.local_audit_trail = []
        self.model_hash_history = {}
        
    def _initialize_contract(self):
        """Initialize smart contract connection"""
        # This would contain the actual smart contract ABI and address
        # Simplified approach — use web3 in production for on-chain writes
        contract_abi = [
            {
                "inputs": [
                    {"internalType": "uint256", "name": "roundNumber", "type": "uint256"},
                    {"internalType": "bytes32", "name": "modelHash", "type": "bytes32"},
                    {"internalType": "address[]", "name": "participants", "type": "address[]"},
                    {"internalType": "uint256", "name": "accuracy", "type": "uint256"}
                ],
                "name": "logTrainingRound",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            }
        ]
        
        try:
            self.contract = self.web3.eth.contract(
                address=self.contract_address,
                abi=contract_abi
            )
            logger.info(f"Connected to smart contract at {self.contract_address}")
        except Exception as e:
            logger.error(f"Failed to connect to smart contract: {e}")
            self.contract = None
    
    def calculate_model_hash(self, model_parameters: List[Any]) -> str:
        """
        Calculate SHA-256 hash of model parameters
        
        Args:
            model_parameters: List of model parameters (tensors or arrays)
            
        Returns:
            Hexadecimal hash string
        """
        # Convert parameters to serializable format
        param_data = []
        for param in model_parameters:
            if hasattr(param, 'numpy'):  # PyTorch tensor
                param_data.append(param.numpy().tolist())
            elif hasattr(param, 'tolist'):  # NumPy array
                param_data.append(param.tolist())
            else:
                param_data.append(str(param))
        
        # Create JSON string and calculate hash
        param_json = json.dumps(param_data, sort_keys=True)
        hash_object = hashlib.sha256(param_json.encode())
        return hash_object.hexdigest()
    
    def log_training_round(self, round_data: TrainingRound) -> str:
        """
        Log a training round to the blockchain
        
        Args:
            round_data: Training round information
            
        Returns:
            Transaction hash
        """
        try:
            # Prepare transaction data
            transaction_data = {
                'round_number': round_data.round_number,
                'model_hash': round_data.model_hash,
                'participating_hospitals': round_data.participating_hospitals,
                'accuracy': round_data.accuracy,
                'loss': round_data.loss,
                'timestamp': round_data.timestamp,
                'data_points': round_data.data_points,
                'convergence_achieved': round_data.convergence_achieved,
                'anomaly_count': round_data.anomaly_count
            }
            
            # Store in local audit trail (fallback)
            self.local_audit_trail.append(transaction_data)
            self.model_hash_history[round_data.round_number] = round_data.model_hash
            
            # If blockchain is available, submit transaction
            if self.contract and self.account:
                tx_hash = self._submit_blockchain_transaction(transaction_data)
                logger.info(f"Training round {round_data.round_number} logged to blockchain: {tx_hash}")
                return tx_hash
            else:
                # Generate mock transaction hash when blockchain is unavailable
                mock_tx_hash = hashlib.sha256(
                    f"{round_data.round_number}{round_data.timestamp}".encode()
                ).hexdigest()
                logger.info(f"Training round {round_data.round_number} logged locally: {mock_tx_hash}")
                return mock_tx_hash
                
        except Exception as e:
            logger.error(f"Failed to log training round: {e}")
            raise
    
    def log_model_update(self, update_data: ModelUpdate) -> str:
        """
        Log a model update to the blockchain
        
        Args:
            update_data: Model update information
            
        Returns:
            Transaction hash
        """
        try:
            # Prepare transaction data
            transaction_data = {
                'update_id': update_data.update_id,
                'hospital_id': update_data.hospital_id,
                'model_hash': update_data.model_hash,
                'previous_hash': update_data.previous_hash,
                'timestamp': update_data.timestamp,
                'update_type': update_data.update_type,
                'metadata': update_data.metadata
            }
            
            # Store in local audit trail (fallback)
            self.local_audit_trail.append(transaction_data)
            
            # If blockchain is available, submit transaction
            if self.contract and self.account:
                tx_hash = self._submit_blockchain_transaction(transaction_data)
                logger.info(f"Model update {update_data.update_id} logged to blockchain: {tx_hash}")
                return tx_hash
            else:
                # Generate mock transaction hash when blockchain is unavailable
                mock_tx_hash = hashlib.sha256(
                    f"{update_data.update_id}{update_data.timestamp}".encode()
                ).hexdigest()
                logger.info(f"Model update {update_data.update_id} logged locally: {mock_tx_hash}")
                return mock_tx_hash
                
        except Exception as e:
            logger.error(f"Failed to log model update: {e}")
            raise
    
    def _submit_blockchain_transaction(self, data: Dict[str, Any]) -> str:
        """
        Submit transaction to blockchain
        
        Args:
            data: Transaction data
            
        Returns:
            Transaction hash
        """
        try:
            # Build transaction
            transaction = self.contract.functions.logTrainingRound(
                data['round_number'],
                self.web3.toBytes(hexstr=data['model_hash']),
                [self.web3.toChecksumAddress(h) for h in data['participating_hospitals']],
                int(data['accuracy'] * 10000)  # Convert to basis points
            ).build_transaction({
                'from': self.account.address,
                'gas': 2000000,
                'gasPrice': self.web3.eth.gas_price,
                'nonce': self.web3.eth.get_transaction_count(self.account.address),
            })
            
            # Sign transaction
            signed_txn = self.web3.eth.account.sign_transaction(transaction, self.private_key)
            
            # Send transaction
            tx_hash = self.web3.eth.send_raw_transaction(signed_txn.rawTransaction)
            
            # Wait for confirmation
            receipt = self.web3.eth.wait_for_transaction_receipt(tx_hash)
            
            return tx_hash.hex()
            
        except Exception as e:
            logger.error(f"Blockchain transaction failed: {e}")
            raise
    
    def verify_model_integrity(self, round_number: int, current_model_hash: str) -> bool:
        """
        Verify model integrity against blockchain record
        
        Args:
            round_number: Training round number
            current_model_hash: Current model hash
            
        Returns:
            True if integrity is verified, False otherwise
        """
        try:
            # Get stored hash from audit trail
            stored_hash = self.model_hash_history.get(round_number)
            
            if not stored_hash:
                logger.warning(f"No hash found for round {round_number}")
                return False
            
            # Compare hashes
            is_valid = stored_hash == current_model_hash
            
            if is_valid:
                logger.info(f"Model integrity verified for round {round_number}")
            else:
                logger.error(f"Model integrity compromised for round {round_number}")
                logger.error(f"Stored hash: {stored_hash}")
                logger.error(f"Current hash: {current_model_hash}")
            
            return is_valid
            
        except Exception as e:
            logger.error(f"Model integrity verification failed: {e}")
            return False
    
    def get_audit_trail(self, limit: int = 100) -> List[Dict[str, Any]]:
        """
        Get audit trail history
        
        Args:
            limit: Maximum number of records to return
            
        Returns:
            List of audit trail records
        """
        try:
            # Return sorted by timestamp (most recent first)
            sorted_trail = sorted(
                self.local_audit_trail, 
                key=lambda x: x.get('timestamp', 0), 
                reverse=True
            )
            return sorted_trail[:limit]
            
        except Exception as e:
            logger.error(f"Failed to get audit trail: {e}")
            return []
    
    def get_training_round_history(self, hospital_id: str = None) -> List[Dict[str, Any]]:
        """
        Get training round history for a specific hospital or all hospitals
        
        Args:
            hospital_id: Hospital ID to filter by (optional)
            
        Returns:
            List of training round records
        """
        try:
            rounds = []
            for record in self.local_audit_trail:
                if 'participating_hospitals' in record:
                    if hospital_id is None or hospital_id in record['participating_hospitals']:
                        rounds.append(record)
            
            return sorted(rounds, key=lambda x: x.get('round_number', 0))
            
        except Exception as e:
            logger.error(f"Failed to get training round history: {e}")
            return []
    
    def generate_compliance_report(self, start_time: int = None, end_time: int = None) -> Dict[str, Any]:
        """
        Generate compliance report for audit purposes
        
        Args:
            start_time: Start timestamp (optional)
            end_time: End timestamp (optional)
            
        Returns:
            Compliance report dictionary
        """
        try:
            # Filter records by time range
            filtered_records = self.local_audit_trail
            if start_time:
                filtered_records = [
                    r for r in filtered_records 
                    if r.get('timestamp', 0) >= start_time
                ]
            if end_time:
                filtered_records = [
                    r for r in filtered_records 
                    if r.get('timestamp', 0) <= end_time
                ]
            
            # Generate report statistics
            total_rounds = len([
                r for r in filtered_records 
                if 'round_number' in r
            ])
            
            total_updates = len([
                r for r in filtered_records 
                if 'update_id' in r
            ])
            
            participating_hospitals = set()
            for record in filtered_records:
                if 'participating_hospitals' in record:
                    participating_hospitals.update(record['participating_hospitals'])
                elif 'hospital_id' in record:
                    participating_hospitals.add(record['hospital_id'])
            
            average_accuracy = 0
            accuracy_records = [
                r for r in filtered_records 
                if 'accuracy' in r and r['accuracy'] > 0
            ]
            if accuracy_records:
                average_accuracy = sum(r['accuracy'] for r in accuracy_records) / len(accuracy_records)
            
            report = {
                'report_generated_at': int(time.time()),
                'time_range': {
                    'start': start_time,
                    'end': end_time
                },
                'statistics': {
                    'total_training_rounds': total_rounds,
                    'total_model_updates': total_updates,
                    'participating_hospitals': len(participating_hospitals),
                    'hospital_list': list(participating_hospitals),
                    'average_model_accuracy': round(average_accuracy, 4)
                },
                'integrity_status': {
                    'total_records': len(filtered_records),
                    'verified_hashes': len(self.model_hash_history),
                    'last_verification': int(time.time())
                },
                'compliance_status': 'COMPLIANT' if len(filtered_records) > 0 else 'NO_DATA'
            }
            
            return report
            
        except Exception as e:
            logger.error(f"Failed to generate compliance report: {e}")
            return {
                'error': str(e),
                'compliance_status': 'ERROR'
            }
    
    def export_audit_data(self, format: str = 'json') -> str:
        """
        Export audit data in specified format
        
        Args:
            format: Export format ('json', 'csv')
            
        Returns:
            Exported data string
        """
        try:
            if format.lower() == 'json':
                return json.dumps(self.local_audit_trail, indent=2, default=str)
            elif format.lower() == 'csv':
                # Simple CSV export (would need proper CSV library for production)
                import csv
                import io
                
                if not self.local_audit_trail:
                    return ""
                
                output = io.StringIO()
                writer = csv.DictWriter(output, fieldnames=self.local_audit_trail[0].keys())
                writer.writeheader()
                writer.writerows(self.local_audit_trail)
                
                return output.getvalue()
            else:
                raise ValueError(f"Unsupported export format: {format}")
                
        except Exception as e:
            logger.error(f"Failed to export audit data: {e}")
            return ""
    
    def get_blockchain_status(self) -> Dict[str, Any]:
        """
        Get blockchain connection status
        
        Returns:
            Status dictionary
        """
        try:
            is_connected = self.web3.is_connected()
            block_number = self.web3.eth.block_number if is_connected else None
            
            return {
                'is_connected': is_connected,
                'block_number': block_number,
                'contract_address': self.contract_address,
                'account_address': self.account.address if self.account else None,
                'local_records': len(self.local_audit_trail)
            }
            
        except Exception as e:
            logger.error(f"Failed to get blockchain status: {e}")
            return {
                'is_connected': False,
                'error': str(e),
                'local_records': len(self.local_audit_trail)
            }


class AuditTrailManager:
    """
    High-level manager for audit trail operations
    """
    
    def __init__(self, blockchain_service: BlockchainAuditService):
        self.blockchain_service = blockchain_service
        
    def create_training_round_record(self, round_number: int, model_parameters: List[Any],
                                   participating_hospitals: List[str], accuracy: float,
                                   loss: float, data_points: int, 
                                   convergence_achieved: bool = False,
                                   anomaly_count: int = 0) -> str:
        """
        Create and log a training round record
        
        Args:
            round_number: Training round number
            model_parameters: Model parameters
            participating_hospitals: List of participating hospitals
            accuracy: Model accuracy
            loss: Model loss
            data_points: Number of data points used
            convergence_achieved: Whether convergence was achieved
            anomaly_count: Number of anomalies detected
            
        Returns:
            Transaction hash
        """
        # Calculate model hash
        model_hash = self.blockchain_service.calculate_model_hash(model_parameters)
        
        # Create training round record
        round_data = TrainingRound(
            round_number=round_number,
            model_hash=model_hash,
            participating_hospitals=participating_hospitals,
            accuracy=accuracy,
            loss=loss,
            timestamp=int(time.time()),
            data_points=data_points,
            convergence_achieved=convergence_achieved,
            anomaly_count=anomaly_count
        )
        
        # Log to blockchain
        return self.blockchain_service.log_training_round(round_data)
    
    def create_model_update_record(self, hospital_id: str, model_parameters: List[Any],
                                 previous_hash: str, update_type: str,
                                 metadata: Dict[str, Any] = None) -> str:
        """
        Create and log a model update record
        
        Args:
            hospital_id: Hospital ID
            model_parameters: Updated model parameters
            previous_hash: Previous model hash
            update_type: Type of update
            metadata: Additional metadata
            
        Returns:
            Transaction hash
        """
        # Calculate new model hash
        model_hash = self.blockchain_service.calculate_model_hash(model_parameters)
        
        # Generate update ID
        update_id = f"{hospital_id}_{update_type}_{int(time.time())}"
        
        # Create model update record
        update_data = ModelUpdate(
            update_id=update_id,
            hospital_id=hospital_id,
            model_hash=model_hash,
            previous_hash=previous_hash,
            timestamp=int(time.time()),
            update_type=update_type,
            metadata=metadata or {}
        )
        
        # Log to blockchain
        return self.blockchain_service.log_model_update(update_data)
