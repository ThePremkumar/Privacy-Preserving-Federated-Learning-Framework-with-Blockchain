"""
System Administration API – Full user CRUD, analytics, and audit data.
"""

from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import func as sa_func
from datetime import datetime
import logging
import bcrypt

from app.core.dependencies import get_current_user, require_role
from app.core.database import SessionLocal
from app.core import db_models

logger = logging.getLogger(__name__)
router = APIRouter()


# ── Pydantic schemas ──

class UpdateUserRequest(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None


class ResetPasswordRequest(BaseModel):
    new_password: str


class ChangeOwnPasswordRequest(BaseModel):
    current_password: str
    new_password: str


class SystemConfig(BaseModel):
    version: str = "1.0.0"
    status: str = "active"


# ══════════════════════════════════════════════════════════
# USER MANAGEMENT (CRUD)
# ══════════════════════════════════════════════════════════

@router.get("/users")
async def list_all_users(
    current_user: Dict[str, Any] = Depends(require_role(["super_admin", "admin"])),
):
    """List all users. Admins see all except super_admins; super_admin sees everyone."""
    db = SessionLocal()
    try:
        query = db.query(db_models.User)
        if current_user.get("role") == "admin":
            # admin cannot see super_admin users
            query = query.filter(db_models.User.role != db_models.UserRole.SUPER_ADMIN)
        users = query.order_by(db_models.User.created_at.desc()).all()
        return [_user_dict(u) for u in users]
    finally:
        db.close()


@router.get("/users/{user_id}")
async def get_user(
    user_id: str,
    current_user: Dict[str, Any] = Depends(require_role(["super_admin", "admin"])),
):
    """Get a single user by ID."""
    db = SessionLocal()
    try:
        u = db.query(db_models.User).filter(db_models.User.id == user_id).first()
        if not u:
            raise HTTPException(status_code=404, detail="User not found")
        # admin cannot view super_admin
        if current_user.get("role") == "admin" and u.role == db_models.UserRole.SUPER_ADMIN:
            raise HTTPException(status_code=403, detail="Cannot view super admin")
        return _user_dict(u)
    finally:
        db.close()


@router.put("/users/{user_id}")
async def update_user(
    user_id: str,
    req: UpdateUserRequest,
    current_user: Dict[str, Any] = Depends(require_role(["super_admin", "admin"])),
):
    """Update a user's email, role, or active status."""
    db = SessionLocal()
    try:
        u = db.query(db_models.User).filter(db_models.User.id == user_id).first()
        if not u:
            raise HTTPException(status_code=404, detail="User not found")

        # Guard: admin cannot modify super_admin users
        if current_user.get("role") == "admin" and u.role == db_models.UserRole.SUPER_ADMIN:
            raise HTTPException(status_code=403, detail="Admins cannot modify Super Admin users")

        # Guard: admin cannot promote anyone to super_admin
        if current_user.get("role") == "admin" and req.role == "super_admin":
            raise HTTPException(status_code=403, detail="Admins cannot assign super_admin role")

        # Guard: cannot demote yourself
        if u.id == current_user.get("user_id") and req.role and req.role != u.role.value:
            raise HTTPException(status_code=400, detail="You cannot change your own role")

        if req.email is not None:
            u.email = req.email
        if req.role is not None:
            try:
                u.role = db_models.UserRole(req.role)
            except ValueError:
                raise HTTPException(status_code=400, detail=f"Invalid role: {req.role}")
        if req.is_active is not None:
            u.is_active = req.is_active
        db.commit()
        db.refresh(u)

        logger.info(f"User {u.username} updated by {current_user.get('username')}")
        return {"message": "User updated", "user": _user_dict(u)}
    except HTTPException:
        raise
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(exc))
    finally:
        db.close()


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    current_user: Dict[str, Any] = Depends(require_role(["super_admin", "admin"])),
):
    """Delete a user permanently."""
    db = SessionLocal()
    try:
        u = db.query(db_models.User).filter(db_models.User.id == user_id).first()
        if not u:
            raise HTTPException(status_code=404, detail="User not found")

        # Guard: cannot delete yourself
        if u.id == current_user.get("user_id"):
            raise HTTPException(status_code=400, detail="You cannot delete yourself")

        # Guard: admin cannot delete super_admin
        if current_user.get("role") == "admin" and u.role == db_models.UserRole.SUPER_ADMIN:
            raise HTTPException(status_code=403, detail="Admins cannot delete Super Admin users")

        username = u.username
        db.delete(u)
        db.commit()
        logger.info(f"User {username} deleted by {current_user.get('username')}")
        return {"message": f"User {username} deleted"}
    except HTTPException:
        raise
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(exc))
    finally:
        db.close()


@router.post("/users/{user_id}/reset-password")
async def reset_user_password(
    user_id: str,
    req: ResetPasswordRequest,
    current_user: Dict[str, Any] = Depends(require_role(["super_admin", "admin"])),
):
    """Reset a user's password. SuperAdmin can reset anyone. Admin cannot reset super_admin."""
    if len(req.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    db = SessionLocal()
    try:
        u = db.query(db_models.User).filter(db_models.User.id == user_id).first()
        if not u:
            raise HTTPException(status_code=404, detail="User not found")

        # Guard: admin cannot reset super_admin password
        if current_user.get("role") == "admin" and u.role == db_models.UserRole.SUPER_ADMIN:
            raise HTTPException(status_code=403, detail="Admins cannot reset Super Admin passwords")

        # Guard: admin cannot reset other admin passwords (only super_admin can)
        if current_user.get("role") == "admin" and u.role == db_models.UserRole.ADMIN and u.id != current_user.get("user_id"):
            raise HTTPException(status_code=403, detail="Admins cannot reset other Admin passwords")

        # Hash and set new password
        salt = bcrypt.gensalt()
        u.password_hash = bcrypt.hashpw(req.new_password.encode("utf-8"), salt).decode("utf-8")
        db.commit()

        logger.info(f"Password reset for {u.username} by {current_user.get('username')}")
        return {"message": f"Password for {u.username} has been reset successfully"}
    except HTTPException:
        raise
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(exc))
    finally:
        db.close()


@router.post("/change-password")
async def change_own_password(
    req: ChangeOwnPasswordRequest,
    current_user: Dict[str, Any] = Depends(require_role(["super_admin", "admin", "hospital", "doctor"])),
):
    """Change your own password. Requires current password verification."""
    if len(req.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    db = SessionLocal()
    try:
        u = db.query(db_models.User).filter(db_models.User.id == current_user.get("user_id")).first()
        if not u:
            raise HTTPException(status_code=404, detail="User not found")

        # Verify current password
        if not bcrypt.checkpw(req.current_password.encode("utf-8"), u.password_hash.encode("utf-8")):
            raise HTTPException(status_code=400, detail="Current password is incorrect")

        # Hash and set new password
        salt = bcrypt.gensalt()
        u.password_hash = bcrypt.hashpw(req.new_password.encode("utf-8"), salt).decode("utf-8")
        db.commit()

        logger.info(f"Password changed by {u.username}")
        return {"message": "Password changed successfully"}
    except HTTPException:
        raise
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(exc))
    finally:
        db.close()


# ══════════════════════════════════════════════════════════
# ANALYTICS / REPORTS DATA
# ══════════════════════════════════════════════════════════

@router.get("/analytics/overview")
async def analytics_overview(
    current_user: Dict[str, Any] = Depends(require_role(["super_admin", "admin"])),
):
    """Platform-wide analytics overview for dashboards & reports."""
    db = SessionLocal()
    try:
        total_users = db.query(db_models.User).count()
        total_hospitals = db.query(db_models.Hospital).count()
        total_uploads = db.query(db_models.DatasetUpload).count()
        total_training = db.query(db_models.TrainingJob).count()
        total_aggregations = db.query(db_models.AggregationRound).count()

        # Count by role
        roles = {}
        for role in db_models.UserRole:
            roles[role.value.lower()] = db.query(db_models.User).filter(db_models.User.role == role).count()

        # Count by training status
        statuses = {}
        for s in ["pending", "training", "completed", "submitted", "approved", "rejected", "aggregated"]:
            statuses[s] = db.query(db_models.TrainingJob).filter(db_models.TrainingJob.status == s).count()

        # Latest aggregation
        latest = db.query(db_models.AggregationRound).order_by(db_models.AggregationRound.round_number.desc()).first()

        # Total records across uploads
        total_records = db.query(
            sa_func.sum(db_models.DatasetUpload.record_count)
        ).scalar() or 0

        return {
            "total_users": total_users,
            "total_hospitals": total_hospitals,
            "total_uploads": total_uploads,
            "total_training_jobs": total_training,
            "total_aggregation_rounds": total_aggregations,
            "total_records": total_records,
            "users_by_role": roles,
            "training_by_status": statuses,
            "latest_global_accuracy": latest.global_accuracy if latest else None,
            "latest_global_loss": latest.global_loss if latest else None,
            "latest_round": latest.round_number if latest else 0,
        }
    finally:
        db.close()


@router.get("/blockchain/audit-trail")
async def blockchain_audit_trail(
    current_user: Dict[str, Any] = Depends(require_role(["super_admin", "admin"])),
):
    """Get blockchain audit trail from aggregation rounds and training jobs."""
    db = SessionLocal()
    try:
        rounds = db.query(db_models.AggregationRound).order_by(db_models.AggregationRound.created_at.desc()).all()
        jobs = db.query(db_models.TrainingJob).filter(
            db_models.TrainingJob.status.in_(["aggregated", "approved", "submitted"])
        ).order_by(db_models.TrainingJob.completed_at.desc()).all()

        ledger = []

        # Aggregation rounds are on-chain events
        for r in rounds:
            ledger.append({
                "id": r.id,
                "type": "aggregation",
                "round": r.round_number,
                "hash": r.global_weights_hash or "",
                "tx_hash": r.blockchain_tx_hash or "",
                "status": "confirmed",
                "hospitals": r.participating_hospitals.split(",") if r.participating_hospitals else [],
                "samples": r.total_samples,
                "accuracy": r.global_accuracy,
                "loss": r.global_loss,
                "epsilon": r.epsilon_total,
                "timestamp": r.created_at.isoformat() if r.created_at else "",
            })

        # Training jobs that produced weight hashes
        for j in jobs:
            ledger.append({
                "id": j.id,
                "type": "training_submission",
                "round": 0,
                "hash": j.weights_hash or "",
                "tx_hash": "",
                "status": j.status,
                "hospitals": [j.hospital_id],
                "samples": j.num_samples,
                "accuracy": j.accuracy,
                "loss": j.loss,
                "epsilon": j.epsilon_used,
                "timestamp": j.completed_at.isoformat() if j.completed_at else "",
            })

        return sorted(ledger, key=lambda x: x["timestamp"], reverse=True)
    finally:
        db.close()


@router.get("/model-health")
async def model_health(
    current_user: Dict[str, Any] = Depends(require_role(["super_admin", "admin"])),
):
    """Get model health metrics from training history."""
    db = SessionLocal()
    try:
        rounds = db.query(db_models.AggregationRound).order_by(db_models.AggregationRound.round_number.asc()).all()
        jobs = db.query(db_models.TrainingJob).order_by(db_models.TrainingJob.started_at.desc()).limit(20).all()

        accuracy_history = [
            {
                "round": f"R{r.round_number}",
                "accuracy": float(r.global_accuracy) * 100 if r.global_accuracy else 0,
                "loss": float(r.global_loss) if r.global_loss else 0,
                "samples": r.total_samples,
            }
            for r in rounds
        ]

        # Per-hospital performance
        hospital_perf = {}
        for j in jobs:
            hid = j.hospital_id[:8]
            if hid not in hospital_perf:
                hospital_perf[hid] = {"hospital_id": j.hospital_id, "jobs": 0, "avg_accuracy": 0, "total_samples": 0}
            hospital_perf[hid]["jobs"] += 1
            hospital_perf[hid]["total_samples"] += j.num_samples
            if j.accuracy:
                hospital_perf[hid]["avg_accuracy"] += float(j.accuracy)

        for v in hospital_perf.values():
            if v["jobs"] > 0:
                v["avg_accuracy"] = round(v["avg_accuracy"] / v["jobs"] * 100, 1)

        latest = rounds[-1] if rounds else None

        return {
            "accuracy_history": accuracy_history,
            "hospital_performance": list(hospital_perf.values()),
            "total_rounds": len(rounds),
            "total_training_jobs": len(jobs),
            "current_accuracy": float(latest.global_accuracy) * 100 if latest and latest.global_accuracy else 0,
            "current_loss": float(latest.global_loss) if latest and latest.global_loss else 0,
            "privacy_budget_used": sum(float(r.epsilon_total or 0) for r in rounds),
        }
    finally:
        db.close()


@router.get("/config")
async def get_system_config(current_user: Dict[str, Any] = Depends(require_role(["super_admin", "admin"]))):
    """Get global system configuration"""
    return {"version": "1.0.0", "status": "active"}


# ── Helpers ──

def _user_dict(u) -> dict:
    return {
        "id": u.id,
        "username": u.username,
        "email": u.email,
        "role": u.role.value.lower() if u.role else "unknown",
        "hospital_id": u.hospital_id,
        "is_active": u.is_active,
        "created_at": u.created_at.isoformat() if u.created_at else "",
    }
