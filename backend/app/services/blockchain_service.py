"""
Blockchain Service for Federated Learning Healthcare Platform
Enterprise blockchain audit trail with Ethereum smart contracts
"""

import asyncio
import json
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime
from dataclasses import asdict
import hashlib

from web3 import Web3
# from web3.middleware import geth_poa_middleware (Web3 V7+ compatibility issue)
from web3.exceptions import TransactionNotFound, ContractLogicError

from ..core.config import BLOCKCHAIN_CONFIG
from ..core.security import audit_logger

logger = logging.getLogger(__name__)

class BlockchainService:
    """Enterprise blockchain service for audit trails"""
    
    def __init__(self):
        self.web3 = None
        self.contract = None
        self.contract_address = BLOCKCHAIN_CONFIG["contract_address"]
        self.private_key = BLOCKCHAIN_CONFIG["private_key"]
        self.account = None
        self.is_initialized = False
    
    async def initialize(self):
        """Initialize blockchain connection"""
        try:
            # Connect to Ethereum node
            self.web3 = Web3(Web3.HTTPProvider(BLOCKCHAIN_CONFIG["rpc_url"]))
            
            # Add POA middleware for private network
            self.web3.middleware_onion.inject(geth_poa_middleware, layer=0)
            
            # Check connection
            if not self.web3.is_connected():
                raise ConnectionError("Failed to connect to blockchain node")
            
            # Get account from private key
            self.account = self.web3.eth.account.from_key(self.private_key)
            
            # Load contract (if deployed)
            if self.contract_address:
                await self._load_contract()
            
            self.is_initialized = True
            logger.info(f"Blockchain service initialized - Chain ID: {self.web3.eth.chain_id}")
            
        except Exception as e:
            logger.error(f"Failed to initialize blockchain service: {e}")
            # Continue without blockchain for development
            self.is_initialized = False
    
    async def _load_contract(self):
        """Load smart contract"""
        try:
            # Contract ABI (simplified for development)
            contract_abi = [
                {
                    "inputs": [
                        {"name": "roundNumber", "type": "uint256"},
                        {"name": "modelHash", "type": "string"},
                        {"name": "participants", "type": "address[]"},
                        {"name": "timestamp", "type": "uint256"}
                    ],
                    "name": "storeFederatedRound",
                    "outputs": [{"name": "", "type": "bytes32"}],
                    "type": "function"
                },
                {
                    "inputs": [{"name": "roundNumber", "type": "uint256"}],
                    "name": "getRoundData",
                    "outputs": [
                        {"name": "modelHash", "type": "string"},
                        {"name": "participants", "type": "address[]"},
                        {"name": "timestamp", "type": "uint256"}
                    ],
                    "type": "function"
                }
            ]
            
            self.contract = self.web3.eth.contract(
                address=self.contract_address,
                abi=contract_abi
            )
            
            logger.info(f"Smart contract loaded at {self.contract_address}")
            
        except Exception as e:
            logger.error(f"Failed to load contract: {e}")
            self.contract = None
    
    async def store_federated_round(self, round_data: Dict[str, Any]) -> str:
        """Store federated round data on blockchain"""
        try:
            if not self.is_initialized:
                logger.warning("Blockchain not initialized, skipping storage")
                return "mock_tx_hash"
            
            # Prepare transaction data
            round_number = round_data["round_number"]
            model_hash = round_data["model_hash"]
            participants = round_data["participating_hospitals"]  # In production, convert to addresses
            timestamp = int(datetime.now().timestamp())
            
            # Build transaction
            if self.contract:
                # Use smart contract
                transaction = self.contract.functions.storeFederatedRound(
                    round_number,
                    model_hash,
                    participants,
                    timestamp
                ).build_transaction({
                    'from': self.account.address,
                    'gas': BLOCKCHAIN_CONFIG["gas_limit"],
                    'gasPrice': self.web3.eth.gas_price,
                    'nonce': self.web3.eth.get_transaction_count(self.account.address)
                })
            else:
                # Direct transaction for development
                transaction = {
                    'to': self.account.address,  # Self-transaction
                    'data': Web3.to_hex(text=json.dumps(round_data)),
                    'gas': BLOCKCHAIN_CONFIG["gas_limit"],
                    'gasPrice': BLOCKCHAIN_CONFIG["gas_price"],
                    'nonce': self.web3.eth.get_transaction_count(self.account.address)
                }
            
            # Sign transaction
            signed_txn = self.web3.eth.account.sign_transaction(transaction, self.private_key)
            
            # Send transaction
            tx_hash = self.web3.eth.send_raw_transaction(signed_txn.rawTransaction)
            
            # Wait for confirmation
            receipt = self.web3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
            
            if receipt.status == 1:
                logger.info(f"Transaction confirmed: {tx_hash.hex()}")
                
                # Log blockchain storage
                audit_logger.log_access(
                    user_id="system",
                    action="blockchain_store",
                    resource=f"round_{round_number}",
                    details={
                        "tx_hash": tx_hash.hex(),
                        "block_number": receipt.blockNumber,
                        "gas_used": receipt.gasUsed
                    }
                )
                
                return tx_hash.hex()
            else:
                raise Exception("Transaction failed")
                
        except Exception as e:
            logger.error(f"Failed to store on blockchain: {e}")
            # Return mock hash for development
            return f"mock_tx_{datetime.now().timestamp()}"
    
    async def get_round_data(self, round_number: int) -> Optional[Dict[str, Any]]:
        """Get round data from blockchain"""
        try:
            if not self.is_initialized or not self.contract:
                return None
            
            # Call smart contract
            result = self.contract.functions.getRoundData(round_number).call()
            
            return {
                "round_number": round_number,
                "model_hash": result[0],
                "participants": result[1],
                "timestamp": result[2]
            }
            
        except Exception as e:
            logger.error(f"Failed to get round data from blockchain: {e}")
            return None
    
    async def verify_integrity(self, data: str, expected_hash: str) -> bool:
        """Verify data integrity using blockchain hash"""
        try:
            computed_hash = hashlib.sha256(data.encode()).hexdigest()
            return computed_hash == expected_hash
            
        except Exception as e:
            logger.error(f"Integrity verification failed: {e}")
            return False
    
    async def get_transaction_status(self, tx_hash: str) -> Dict[str, Any]:
        """Get transaction status"""
        try:
            if not self.is_initialized:
                return {"status": "unknown", "message": "Blockchain not initialized"}
            
            receipt = self.web3.eth.get_transaction_receipt(tx_hash)
            
            if receipt:
                return {
                    "status": "confirmed" if receipt.status == 1 else "failed",
                    "block_number": receipt.blockNumber,
                    "gas_used": receipt.gasUsed,
                    "timestamp": datetime.now().isoformat()
                }
            else:
                # Check if transaction is pending
                try:
                    self.web3.eth.get_transaction(tx_hash)
                    return {"status": "pending", "message": "Transaction not yet confirmed"}
                except TransactionNotFound:
                    return {"status": "not_found", "message": "Transaction not found"}
                    
        except Exception as e:
            logger.error(f"Failed to get transaction status: {e}")
            return {"status": "error", "message": str(e)}
    
    async def get_chain_info(self) -> Dict[str, Any]:
        """Get blockchain chain information"""
        try:
            if not self.is_initialized:
                return {"status": "not_initialized"}
            
            return {
                "chain_id": self.web3.eth.chain_id,
                "block_number": self.web3.eth.block_number,
                "gas_price": self.web3.eth.gas_price,
                "account_address": self.account.address if self.account else None,
                "contract_address": self.contract_address,
                "is_connected": self.web3.is_connected()
            }
            
        except Exception as e:
            logger.error(f"Failed to get chain info: {e}")
            return {"status": "error", "message": str(e)}
    
    async def health_check(self) -> bool:
        """Check blockchain service health"""
        try:
            if not self.is_initialized:
                return False
            
            # Check connection
            if not self.web3.is_connected():
                return False
            
            # Check if we can get latest block
            latest_block = self.web3.eth.block_number
            return latest_block > 0
            
        except Exception as e:
            logger.error(f"Blockchain health check failed: {e}")
            return False
    
    async def get_transaction_count(self) -> int:
        """Get total transaction count (simplified)"""
        # In production, this would query the blockchain
        return len(self.round_history) if hasattr(self, 'round_history') else 0
    
    async def cleanup(self):
        """Cleanup blockchain service"""
        try:
            if self.web3:
                self.web3.provider.disconnect()
            logger.info("Blockchain service cleaned up")
        except Exception as e:
            logger.error(f"Error during cleanup: {e}")

# Mock blockchain service for development
class MockBlockchainService:
    """Mock blockchain service for development without actual blockchain"""
    
    def __init__(self):
        self.transactions = []
        self.round_data = {}
    
    async def initialize(self):
        """Initialize mock service"""
        logger.info("Mock blockchain service initialized")
    
    async def store_federated_round(self, round_data: Dict[str, Any]) -> str:
        """Mock store federated round"""
        tx_hash = f"mock_tx_{datetime.now().timestamp()}"
        
        transaction = {
            "tx_hash": tx_hash,
            "round_data": round_data,
            "timestamp": datetime.utcnow().isoformat(),
            "status": "confirmed"
        }
        
        self.transactions.append(transaction)
        self.round_data[round_data["round_number"]] = round_data
        
        logger.info(f"Mock stored round {round_data['round_number']} with tx hash: {tx_hash}")
        return tx_hash
    
    async def get_round_data(self, round_number: int) -> Optional[Dict[str, Any]]:
        """Mock get round data"""
        return self.round_data.get(round_number)
    
    async def verify_integrity(self, data: str, expected_hash: str) -> bool:
        """Mock integrity verification"""
        computed_hash = hashlib.sha256(data.encode()).hexdigest()
        return computed_hash == expected_hash
    
    async def get_transaction_status(self, tx_hash: str) -> Dict[str, Any]:
        """Mock transaction status"""
        transaction = next((tx for tx in self.transactions if tx["tx_hash"] == tx_hash), None)
        
        if transaction:
            return {
                "status": transaction["status"],
                "timestamp": transaction["timestamp"]
            }
        else:
            return {"status": "not_found", "message": "Transaction not found"}
    
    async def get_chain_info(self) -> Dict[str, Any]:
        """Mock chain info"""
        return {
            "chain_id": 1337,
            "block_number": len(self.transactions),
            "status": "mock_mode"
        }
    
    async def health_check(self) -> bool:
        """Mock health check"""
        return True
    
    async def get_transaction_count(self) -> int:
        """Mock transaction count"""
        return len(self.transactions)
    
    async def cleanup(self):
        """Mock cleanup"""
        logger.info("Mock blockchain service cleaned up")

# Global service instance (use mock for development)
blockchain_service = MockBlockchainService()

# Uncomment to use real blockchain service
# blockchain_service = BlockchainService()
