"""
Training API – handles the full federated training lifecycle:
  1. Hospital starts local training on an uploaded dataset
  2. Training completes → hospital submits result for admin review
  3. Admin/SuperAdmin reviews & approves/rejects
  4. SuperAdmin aggregates approved jobs into the global model
"""

from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from datetime import datetime
import hashlib
import json
import logging
import uuid
import random
import numpy as np

from app.core.dependencies import get_current_user, require_role
from app.core.database import SessionLocal
from app.core.db_models import TrainingJob, AggregationRound, DatasetUpload

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Training"])


# ===========================================================================
# Pydantic schemas
# ===========================================================================

class StartTrainingRequest(BaseModel):
    upload_id: str
    epochs: int = 3
    learning_rate: float = 0.001


class TrainingJobResponse(BaseModel):
    id: str
    hospital_id: str
    upload_id: str
    status: str
    epochs: int
    accuracy: Optional[str] = None
    loss: Optional[str] = None
    num_samples: int
    weights_hash: Optional[str] = None
    epsilon_used: str
    started_at: str
    completed_at: Optional[str] = None
    review_notes: Optional[str] = None
    reviewed_by: Optional[str] = None


class ReviewRequest(BaseModel):
    action: str  # "approve" or "reject"
    notes: str = ""


class AggregateRequest(BaseModel):
    job_ids: List[str]


class AggregationResponse(BaseModel):
    round_id: str
    round_number: int
    participating_hospitals: List[str]
    total_samples: int
    global_accuracy: str
    global_loss: str
    global_weights_hash: str
    blockchain_tx_hash: str


# ===========================================================================
# Hospital: start training
# ===========================================================================

@router.post("/start", response_model=TrainingJobResponse, status_code=status.HTTP_201_CREATED)
async def start_training(
    req: StartTrainingRequest,
    current_user: Dict[str, Any] = Depends(require_role(["hospital"])),
):
    """Hospital node starts local model training on an uploaded dataset."""
    hospital_id = current_user.get("hospital_id", "unknown")
    user_id = current_user.get("user_id", "unknown")

    db = SessionLocal()
    try:
        # Verify that the upload exists and belongs to this hospital
        upload = db.query(DatasetUpload).filter(DatasetUpload.id == req.upload_id).first()
        if not upload:
            raise HTTPException(status_code=404, detail="Dataset upload not found.")
        if upload.hospital_id != hospital_id:
            raise HTTPException(status_code=403, detail="This dataset does not belong to your hospital.")

        # Simulate local model training
        num_samples = upload.record_count or 0
        base_accuracy = 0.82 + random.uniform(0.02, 0.10)
        base_loss = 0.45 - random.uniform(0.05, 0.20)

        # Simulate training improvement over epochs
        for _ in range(req.epochs):
            base_accuracy += random.uniform(0.005, 0.02)
            base_loss -= random.uniform(0.01, 0.03)
        base_accuracy = min(base_accuracy, 0.98)
        base_loss = max(base_loss, 0.05)

        # Generate simulated model weights (in production this would be real torch weights)
        np.random.seed(hash(req.upload_id) % 2**32)
        simulated_weights = np.random.randn(128).tolist()
        weights_json = json.dumps(simulated_weights)
        weights_hash = hashlib.sha256(weights_json.encode()).hexdigest()

        job_id = str(uuid.uuid4())
        job = TrainingJob(
            id=job_id,
            hospital_id=hospital_id,
            upload_id=req.upload_id,
            started_by=user_id,
            status="completed",
            epochs=req.epochs,
            learning_rate=str(req.learning_rate),
            accuracy=f"{base_accuracy:.4f}",
            loss=f"{base_loss:.4f}",
            num_samples=num_samples,
            weights_hash=weights_hash,
            model_weights=weights_json,
            epsilon_used="1.0",
            delta_used="1e-5",
            started_at=datetime.utcnow(),
            completed_at=datetime.utcnow(),
        )
        db.add(job)
        db.commit()
        db.refresh(job)

        logger.info(f"Training completed: job={job_id} hospital={hospital_id} acc={base_accuracy:.4f}")

        return _job_to_response(job)
    except HTTPException:
        raise
    except Exception as exc:
        db.rollback()
        logger.error(f"start_training error: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))
    finally:
        db.close()


# ===========================================================================
# Hospital: submit training result for review
# ===========================================================================

@router.post("/{job_id}/submit-for-review")
async def submit_for_review(
    job_id: str,
    current_user: Dict[str, Any] = Depends(require_role(["hospital"])),
):
    """Hospital submits a completed training job for admin/superadmin review."""
    db = SessionLocal()
    try:
        job = db.query(TrainingJob).filter(TrainingJob.id == job_id).first()
        if not job:
            raise HTTPException(status_code=404, detail="Training job not found.")
        if job.hospital_id != current_user.get("hospital_id"):
            raise HTTPException(status_code=403, detail="This job does not belong to your hospital.")
        if job.status != "completed":
            raise HTTPException(status_code=400, detail=f"Job status is '{job.status}', must be 'completed' to submit.")

        job.status = "submitted"
        db.commit()
        logger.info(f"Job {job_id} submitted for review by hospital {job.hospital_id}")

        return {"message": "Training results submitted for admin review.", "job_id": job_id, "status": "submitted"}
    except HTTPException:
        raise
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(exc))
    finally:
        db.close()


# ===========================================================================
# Hospital: list own training jobs
# ===========================================================================

@router.get("/my-jobs", response_model=List[TrainingJobResponse])
async def get_my_training_jobs(
    current_user: Dict[str, Any] = Depends(require_role(["hospital"])),
):
    """List all training jobs belonging to the current hospital."""
    db = SessionLocal()
    try:
        jobs = (
            db.query(TrainingJob)
            .filter(TrainingJob.hospital_id == current_user.get("hospital_id"))
            .order_by(TrainingJob.started_at.desc())
            .all()
        )
        return [_job_to_response(j) for j in jobs]
    finally:
        db.close()


# ===========================================================================
# Admin / Super Admin: list all submitted jobs for review
# ===========================================================================

@router.get("/pending-reviews", response_model=List[TrainingJobResponse])
async def get_pending_reviews(
    current_user: Dict[str, Any] = Depends(require_role(["super_admin", "admin"])),
):
    """Get all training jobs submitted for review."""
    db = SessionLocal()
    try:
        jobs = (
            db.query(TrainingJob)
            .filter(TrainingJob.status == "submitted")
            .order_by(TrainingJob.completed_at.desc())
            .all()
        )
        return [_job_to_response(j) for j in jobs]
    finally:
        db.close()


# ===========================================================================
# Admin / Super Admin: review a training job
# ===========================================================================

@router.post("/{job_id}/review")
async def review_training_job(
    job_id: str,
    req: ReviewRequest,
    current_user: Dict[str, Any] = Depends(require_role(["super_admin", "admin"])),
):
    """Approve or reject a submitted training job."""
    if req.action not in ("approve", "reject"):
        raise HTTPException(status_code=400, detail="Action must be 'approve' or 'reject'.")

    db = SessionLocal()
    try:
        job = db.query(TrainingJob).filter(TrainingJob.id == job_id).first()
        if not job:
            raise HTTPException(status_code=404, detail="Training job not found.")
        if job.status != "submitted":
            raise HTTPException(status_code=400, detail=f"Job status is '{job.status}', must be 'submitted' to review.")

        job.status = "approved" if req.action == "approve" else "rejected"
        job.review_notes = req.notes
        job.reviewed_by = current_user.get("user_id")
        job.reviewed_at = datetime.utcnow()
        db.commit()

        logger.info(f"Job {job_id} {job.status} by {current_user.get('username')}")

        return {"message": f"Training job {job.status}.", "job_id": job_id, "status": job.status}
    except HTTPException:
        raise
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(exc))
    finally:
        db.close()


# ===========================================================================
# Admin / Super Admin: list all jobs (any status)
# ===========================================================================

@router.get("/all-jobs", response_model=List[TrainingJobResponse])
async def get_all_training_jobs(
    current_user: Dict[str, Any] = Depends(require_role(["super_admin", "admin"])),
):
    """Get all training jobs across hospitals."""
    db = SessionLocal()
    try:
        jobs = db.query(TrainingJob).order_by(TrainingJob.started_at.desc()).all()
        return [_job_to_response(j) for j in jobs]
    finally:
        db.close()


# ===========================================================================
# Super Admin: aggregate approved jobs into the global model
# ===========================================================================

@router.post("/aggregate", response_model=AggregationResponse)
async def aggregate_models(
    req: AggregateRequest,
    current_user: Dict[str, Any] = Depends(require_role(["super_admin"])),
):
    """Aggregate approved training jobs into the global model using FedAvg."""
    if not req.job_ids:
        raise HTTPException(status_code=400, detail="No job IDs provided.")

    db = SessionLocal()
    try:
        jobs = db.query(TrainingJob).filter(TrainingJob.id.in_(req.job_ids)).all()
        if not jobs:
            raise HTTPException(status_code=404, detail="No matching jobs found.")

        # Ensure all jobs are approved
        not_approved = [j.id for j in jobs if j.status != "approved"]
        if not_approved:
            raise HTTPException(
                status_code=400,
                detail=f"Jobs {not_approved} are not in 'approved' status.",
            )

        # ── FedAvg aggregation ──
        total_samples = sum(j.num_samples for j in jobs)
        if total_samples == 0:
            total_samples = 1  # avoid division by zero

        # Parse weights from each job
        all_weights = []
        job_samples = []
        for j in jobs:
            w = json.loads(j.model_weights) if j.model_weights else [0.0] * 128
            all_weights.append(np.array(w))
            job_samples.append(j.num_samples or 1)

        # Weighted average
        aggregated = np.zeros_like(all_weights[0])
        for w, n in zip(all_weights, job_samples):
            aggregated += (n / total_samples) * w

        # Compute global metrics (averaged)
        accuracies = [float(j.accuracy) for j in jobs if j.accuracy]
        losses = [float(j.loss) for j in jobs if j.loss]
        global_acc = sum(accuracies) / len(accuracies) if accuracies else 0.0
        global_loss = sum(losses) / len(losses) if losses else 0.0

        # Simulated improvement from aggregation
        global_acc = min(global_acc + 0.02, 0.99)
        global_loss = max(global_loss - 0.02, 0.02)

        global_weights_hash = hashlib.sha256(json.dumps(aggregated.tolist()).encode()).hexdigest()
        blockchain_tx_hash = f"0x{hashlib.sha256(f'{global_weights_hash}_{datetime.utcnow().isoformat()}'.encode()).hexdigest()}"

        # Determine round number
        last_round = db.query(AggregationRound).order_by(AggregationRound.round_number.desc()).first()
        round_number = (last_round.round_number + 1) if last_round else 1

        participating_hospitals = list(set(j.hospital_id for j in jobs))
        epsilon_total = sum(float(j.epsilon_used) for j in jobs if j.epsilon_used)

        # Save aggregation round
        agg = AggregationRound(
            id=str(uuid.uuid4()),
            round_number=round_number,
            initiated_by=current_user.get("user_id", "unknown"),
            status="completed",
            participating_jobs=",".join(j.id for j in jobs),
            participating_hospitals=",".join(participating_hospitals),
            total_samples=total_samples,
            global_accuracy=f"{global_acc:.4f}",
            global_loss=f"{global_loss:.4f}",
            global_weights_hash=global_weights_hash,
            blockchain_tx_hash=blockchain_tx_hash,
            epsilon_total=f"{epsilon_total:.2f}",
        )
        db.add(agg)

        # Mark jobs as aggregated
        for j in jobs:
            j.status = "aggregated"
        db.commit()

        logger.info(f"Aggregation round {round_number} completed: {len(jobs)} jobs, acc={global_acc:.4f}")

        return AggregationResponse(
            round_id=agg.id,
            round_number=round_number,
            participating_hospitals=participating_hospitals,
            total_samples=total_samples,
            global_accuracy=f"{global_acc:.4f}",
            global_loss=f"{global_loss:.4f}",
            global_weights_hash=global_weights_hash,
            blockchain_tx_hash=blockchain_tx_hash,
        )
    except HTTPException:
        raise
    except Exception as exc:
        db.rollback()
        logger.error(f"aggregate error: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))
    finally:
        db.close()


# ===========================================================================
# Admin / Super Admin: aggregation history
# ===========================================================================

@router.get("/aggregation-history")
async def get_aggregation_history(
    current_user: Dict[str, Any] = Depends(require_role(["super_admin", "admin"])),
):
    """Get all aggregation rounds."""
    db = SessionLocal()
    try:
        rounds = db.query(AggregationRound).order_by(AggregationRound.round_number.desc()).all()
        return [
            {
                "id": r.id,
                "round_number": r.round_number,
                "status": r.status,
                "participating_hospitals": r.participating_hospitals.split(",") if r.participating_hospitals else [],
                "total_samples": r.total_samples,
                "global_accuracy": r.global_accuracy,
                "global_loss": r.global_loss,
                "global_weights_hash": r.global_weights_hash,
                "blockchain_tx_hash": r.blockchain_tx_hash,
                "epsilon_total": r.epsilon_total,
                "created_at": r.created_at.isoformat() if r.created_at else "",
            }
            for r in rounds
        ]
    finally:
        db.close()


# ===========================================================================
# Helpers
# ===========================================================================

def _job_to_response(job: TrainingJob) -> TrainingJobResponse:
    return TrainingJobResponse(
        id=job.id,
        hospital_id=job.hospital_id,
        upload_id=job.upload_id,
        status=job.status,
        epochs=job.epochs,
        accuracy=job.accuracy,
        loss=job.loss,
        num_samples=job.num_samples,
        weights_hash=job.weights_hash,
        epsilon_used=job.epsilon_used or "1.0",
        started_at=job.started_at.isoformat() if job.started_at else "",
        completed_at=job.completed_at.isoformat() if job.completed_at else None,
        review_notes=job.review_notes,
        reviewed_by=job.reviewed_by,
    )
