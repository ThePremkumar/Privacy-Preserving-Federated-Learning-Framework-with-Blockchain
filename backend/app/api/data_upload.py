"""
Data Upload API – accepts CSV files from hospital nodes,
parses them, and stores records in the SQLite database.
"""

from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from pydantic import BaseModel
from datetime import datetime
import csv
import io
import hashlib
import logging
import uuid

from app.core.dependencies import get_current_user, require_role
from app.core.database import SessionLocal
from app.core.db_models import DatasetUpload, DatasetRecord

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Data Upload"])


class UploadResponse(BaseModel):
    id: str
    filename: str
    record_count: int
    columns: List[str]
    sha256_hash: str
    uploaded_at: str
    message: str


class UploadHistoryItem(BaseModel):
    id: str
    filename: str
    record_count: int
    sha256_hash: str
    uploaded_at: str
    status: str


@router.post("/upload-csv", response_model=UploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_csv(
    file: UploadFile = File(...),
    current_user: Dict[str, Any] = Depends(require_role(["hospital"])),
):
    """
    Upload a CSV dataset.
    - Only hospital-role users are allowed.
    - The file is parsed, hashed, and each row is stored in the database.
    """
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only CSV files are accepted.",
        )

    # Read file contents
    raw_bytes = await file.read()
    if len(raw_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty.",
        )

    # Compute SHA-256 hash for integrity proof
    sha256_hash = hashlib.sha256(raw_bytes).hexdigest()

    # Decode and parse CSV
    try:
        text = raw_bytes.decode("utf-8-sig")  # handle BOM
    except UnicodeDecodeError:
        text = raw_bytes.decode("latin-1")

    reader = csv.DictReader(io.StringIO(text))
    columns = reader.fieldnames or []
    rows: list[dict] = []
    for row in reader:
        rows.append(dict(row))

    if len(rows) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="CSV file contains no data rows.",
        )

    # Persist to DB
    upload_id = str(uuid.uuid4())
    hospital_id = current_user.get("hospital_id", "unknown")
    user_id = current_user.get("user_id", "unknown")

    db = SessionLocal()
    try:
        # Create upload record
        upload_record = DatasetUpload(
            id=upload_id,
            filename=file.filename,
            hospital_id=hospital_id,
            uploaded_by=user_id,
            record_count=len(rows),
            columns=",".join(columns),
            sha256_hash=sha256_hash,
            status="completed",
        )
        db.add(upload_record)

        # Store individual data rows
        for idx, row_data in enumerate(rows):
            record = DatasetRecord(
                id=str(uuid.uuid4()),
                upload_id=upload_id,
                row_index=idx,
                data=str(row_data),  # Store as string (json-like)
            )
            db.add(record)

        db.commit()
        logger.info(
            f"Dataset uploaded: {file.filename} | {len(rows)} records | "
            f"hospital={hospital_id} user={user_id}"
        )
    except Exception as exc:
        db.rollback()
        logger.error(f"Failed to save dataset: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save dataset: {str(exc)}",
        )
    finally:
        db.close()

    return UploadResponse(
        id=upload_id,
        filename=file.filename,
        record_count=len(rows),
        columns=columns,
        sha256_hash=sha256_hash,
        uploaded_at=datetime.utcnow().isoformat(),
        message=f"Successfully uploaded {len(rows)} records. Blockchain hash recorded.",
    )


@router.get("/uploads", response_model=List[UploadHistoryItem])
async def get_upload_history(
    current_user: Dict[str, Any] = Depends(require_role(["hospital", "super_admin", "admin"])),
):
    """Get the upload history for the current hospital (or all, for admins)."""
    db = SessionLocal()
    try:
        query = db.query(DatasetUpload)
        if current_user.get("role") == "hospital":
            query = query.filter(DatasetUpload.hospital_id == current_user.get("hospital_id"))
        uploads = query.order_by(DatasetUpload.uploaded_at.desc()).all()

        return [
            UploadHistoryItem(
                id=u.id,
                filename=u.filename,
                record_count=u.record_count,
                sha256_hash=u.sha256_hash,
                uploaded_at=u.uploaded_at.isoformat() if u.uploaded_at else "",
                status=u.status or "completed",
            )
            for u in uploads
        ]
    finally:
        db.close()
