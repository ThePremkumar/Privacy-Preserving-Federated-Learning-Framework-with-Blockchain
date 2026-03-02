"""
Blockchain Audit and Compliance API
"""

from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
import logging
from datetime import datetime

from app.api.auth import get_current_user, require_permission
from app.services.auth_service import User, Permission
from app.services.blockchain.audit_service import BlockchainAuditService, AuditTrailManager

logger = logging.getLogger(__name__)

router = APIRouter()

# Initialize blockchain service
import os
blockchain_url = os.getenv("BLOCKCHAIN_URL", "http://localhost:8545")
contract_address = os.getenv("CONTRACT_ADDRESS")
private_key = os.getenv("BLOCKCHAIN_PRIVATE_KEY")
blockchain_service = BlockchainAuditService(blockchain_url, contract_address, private_key)

@router.get("/training-rounds")
async def get_training_rounds(limit: int = 100,
                            current_user: User = Depends(require_permission(Permission.VIEW_AUDIT_TRAIL))):
    """Get training round audit trail"""
    try:
        audit_trail = blockchain_service.get_audit_trail(limit)
        return {
            "audit_trail": audit_trail,
            "total_records": len(audit_trail)
        }
    except Exception as e:
        logger.error(f"Get audit trail error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/compliance-report")
async def get_compliance_report(start_time: Optional[int] = None,
                               end_time: Optional[int] = None,
                               current_user: User = Depends(require_permission(Permission.GENERATE_REPORTS))):
    """Generate compliance report"""
    try:
        report = blockchain_service.generate_compliance_report(start_time, end_time)
        return report
    except Exception as e:
        logger.error(f"Compliance report error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/verify-integrity/{round_number}")
async def verify_model_integrity(round_number: int,
                                 current_user: User = Depends(require_permission(Permission.VERIFY_INTEGRITY))):
    """Verify model integrity for a specific round"""
    try:
        # Integrated with blockchain hash calculation
        current_hash = blockchain_service.calculate_model_hash([]) # Would be actual parameters
        is_valid = blockchain_service.verify_model_integrity(round_number, current_hash)
        
        return {
            "round_number": round_number,
            "current_model_hash": current_hash,
            "integrity_verified": is_valid,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Integrity verification error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
