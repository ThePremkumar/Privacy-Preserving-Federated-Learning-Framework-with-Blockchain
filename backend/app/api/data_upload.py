"""
Data Upload API – accepts CSV files from hospital nodes,
parses them, and stores records in the SQLite database.
"""

from typing import Dict, Any, List, Optional
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
    confirm_warning: bool = False,
    suggested_filename: Optional[str] = None,
    current_user: Dict[str, Any] = Depends(require_role(["hospital"])),
):
    """
    Upload a CSV dataset.
    - Only hospital-role users are allowed.
    - The file is parsed, hashed, and each row is stored in the database.
    """
    # --- FILENAME VALIDATION & NAMING CONVENTION (SECTION 12) ---
    from app.core.db_models import Hospital, AuditLog
    db_val = SessionLocal()
    hospital = db_val.query(Hospital).filter(Hospital.id == current_user.get("hospital_id")).first()
    node_slug = (hospital.short_name or hospital.name.split()[0]).lower().replace(" ", "") if hospital else "unknown"
    org_type = hospital.organization_type if hospital else "Multispecialty"
    db_val.close()

    filename = suggested_filename if suggested_filename else file.filename
    filename_lower = filename.lower()
    
    warnings = []
    warning_bypassed = False

    # 1. Keyword Blocklist
    blocklist = [
        "covid", "covid-19", "covid19", "nursing_home", "nursinghome", "cms", "cms_", 
        "census", "billing_only", "public_health", "population_study", "cdc_", "who_", 
        "nhs_", "medicare_export", "medicaid_export", "aggregate_report", "research_study"
    ]
    for kw in blocklist:
        if kw in filename_lower:
            warnings.append(f"Warning: This filename contains a keyword ('{kw}') that suggests it may be an unrelated public health or administrative dataset rather than patient records from this node.")
            break

    # 2. Format Pattern: {slug}_{type}_{YYYY-MM-DD}.csv
    import re
    # Pattern: ^[a-z0-9]+_[a-z0-9_]+_\d{4}-\d{2}-\d{2}\.csv$
    pattern = r"^[a-z0-9]+_[a-z0-9_]+_\d{4}-\d{2}-\d{2}\.csv$"
    is_valid_format = bool(re.match(pattern, filename_lower))
    if not is_valid_format:
        warnings.append(f"Filename does not follow the required format: {{hospital_slug}}_{{data_type}}_{{YYYY-MM-DD}}.csv")

    # 3. Hospital Slug Mismatch
    extracted_slug = filename_lower.split('_')[0] if '_' in filename_lower else ""
    if is_valid_format and extracted_slug != node_slug:
        warnings.append(f"Warning: The filename prefix '{extracted_slug}' does not match this node's identifier '{node_slug}'.")

    # 4. Organization Type Mismatch
    if is_valid_format:
        parts = filename_lower.replace(".csv", "").split('_')
        data_type = "_".join(parts[1:-1])
        org_map = {
            "General clinic": ["patient_records", "clinical_export", "training_dataset"],
            "Heart hospital": ["cardiac_records", "patient_records", "training_dataset"],
            "Neuro center": ["neuro_records", "patient_records", "training_dataset"],
            "Ortho & spine": ["ortho_records", "patient_records", "training_dataset"],
            "Maternity & child": ["maternal_records", "patient_records", "training_dataset"],
            "Cancer center": ["oncology_records", "patient_records", "training_dataset"],
            "Eye hospital": ["ophthalmic_records", "patient_records", "training_dataset"],
            "Multispecialty": ["patient_records", "clinical_export", "training_dataset"]
        }
        allowed_types = org_map.get(org_type, ["patient_records", "clinical_export", "training_dataset"])
        if data_type not in allowed_types:
            warnings.append(f"Warning: This node is registered as a {org_type}. The filename data type '{data_type}' may not be appropriate for this node type.")

    # Handle Warnings
    if warnings and not confirm_warning:
        today = datetime.utcnow().strftime("%Y-%m-%d")
        suggestion = f"{node_slug}_patient_records_{today}.csv"
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "message": "Filename validation warnings detected.",
                "warnings": warnings,
                "suggestion": suggestion
            }
        )
    
    if warnings and confirm_warning:
        warning_bypassed = True
    # ------------------------------------------------------------

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
            filename=filename,
            hospital_id=hospital_id,
            uploaded_by=user_id,
            record_count=len(rows),
            columns=",".join(columns),
            sha256_hash=sha256_hash,
            status="completed",
        )
        db.add(upload_record)

        # Audit Log (Section 12)
        audit_action = 'dataset_uploaded'
        audit_details = {
            "filename": filename,
            "sha256_hash": sha256_hash,
            "record_count": len(rows),
            "warning_bypassed": warning_bypassed
        }
        
        # If bypassed warnings, log that too
        if warning_bypassed:
            bypass_audit = AuditLog(
                user_id=user_id,
                action='upload_filename_warning_bypassed',
                resource=f"upload:{upload_id}",
                details={"filename": filename, "warnings": warnings}
            )
            db.add(bypass_audit)

        audit = AuditLog(
            user_id=user_id,
            action=audit_action,
            resource=f"upload:{upload_id}",
            details=audit_details
        )
        db.add(audit)

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
@router.get("/my-uploads", response_model=List[UploadHistoryItem])
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
