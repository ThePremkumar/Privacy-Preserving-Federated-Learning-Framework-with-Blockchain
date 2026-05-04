# API Reference

## Authentication
<!-- updated: 2026-05-04 -->
- `POST /api/v1/auth/login` - Authenticate and get JWT
- `GET /api/v1/auth/me` - Get current session info
- `POST /api/v1/auth/register` - Register new node admin/doctor
- `PUT /api/v1/auth/me` - Update profile (email)

## Data Upload
<!-- updated: 2026-05-04 -->
- `POST /api/v1/data/upload-csv` - Upload dataset with filename validation
  - Params: `confirm_warning` (bool), `suggested_filename` (str)
- `GET /api/v1/data/uploads` - Fetch upload history

## Training Lifecycle
<!-- updated: 2026-05-04 -->
- `POST /api/v1/training/analyze-csv` - Run readiness check on upload
- `POST /api/v1/training/start` - Start local training
  - Params: `force` (bool) to bypass filename mismatch
- `GET /api/v1/training/job/{id}` - Poll job status
- `GET /api/v1/training/my-jobs` - List jobs for current hospital

## Federated Learning
<!-- updated: 2026-05-04 -->
- `POST /api/v1/training/aggregate` - FedAvg aggregation (SuperAdmin)

## Blockchain & Compliance
<!-- updated: 2026-05-04 -->
- `GET /api/v1/blockchain/clinical-audits` - Get immutable audit trail for clinical record events (Doctor/Hospital/Admin)
- `GET /api/v1/admin/blockchain/audit-trail` - Get global training/aggregation audit trail (Admin only)

## Changelog
<!-- updated: 2026-05-04 -->
- 2026-05-04 — Added filename validation and readiness check parameters.
- 2026-05-04 — Added `/blockchain/clinical-audits` for immutable clinical record tracking.

