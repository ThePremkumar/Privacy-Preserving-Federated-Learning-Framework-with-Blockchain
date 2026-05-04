import os
from app.services.blockchain.audit_service import BlockchainAuditService

blockchain_url = os.getenv("BLOCKCHAIN_URL", "http://localhost:8545")
contract_address = os.getenv("CONTRACT_ADDRESS")
private_key = os.getenv("BLOCKCHAIN_PRIVATE_KEY")

# Singleton instance
blockchain_service = BlockchainAuditService(blockchain_url, contract_address, private_key)

def get_blockchain_service():
    return blockchain_service
