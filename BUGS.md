# Known Bugs & Patch Registry

## BUG-001 — Filename parser splits on first underscore only
<!-- updated: 2026-05-04 -->
**Status**: RESOLVED — 2026-05-04
**Confirmed**: 2026-05-04
**Severity**: Medium — causes false validation warnings, does not block upload

### Symptom
File `himsr_patient_records_2026-05-04.csv` triggers warning:
"The filename data type 'patient' may not be appropriate for this node type."
Suggested filename is identical to the original — system knows correct name but validator uses wrong segment.

### Root cause
Filename parser read `parts[1]` instead of `parts.slice(1,-1).join('_')`.

### Fix applied
Corrected the data type extraction logic to join segments between slug and date.
- **Affected file**: `backend/app/api/data_upload.py`

---

## BUG-002 — Training ran on unrelated dataset (stale upload_id)
<!-- updated: 2026-05-04 -->
**Status**: RESOLVED — 2026-05-04
**Confirmed**: 2026-05-04
**Severity**: Critical — caused near-random accuracy (16.9%) across all training jobs

### Symptom
Training job accuracy stuck at ~16.7% (random baseline for 6 classes).
Loss stuck at 1.792 (ln(6) ceiling).
Model predicting majority class only.

### Root cause
Training job was launched against `upload_id` pointing to `CMS_COVID-19_Nursing_Home_Dataset.csv` — an unrelated public health dataset with no schema match to the HealthcareMLP model.

### Fix applied
1. Regenerated `healthcare_dataset.csv` with per-condition correlations.
2. Re-uploaded regenerated file as `himsr_patient_records_2026-05-04.csv`.
3. New training job started against new `upload_id`.

---

## BUG-003 — DB reconstruction overhead causing slow training
<!-- updated: 2026-05-04 -->
**Status**: RESOLVED — 2026-05-04
**Confirmed**: 2026-05-04
**Severity**: Medium — 3.6–17s per epoch vs 0.8–2s expected for 55,500 rows

### Symptom
Reconstruction from DB records for 55,500 rows exceeds 4s baseline.

### Root cause
Individual JSON blob storage in `dataset_records` causes high deserialization overhead.

### Fix applied
- **PART A**: Implemented Parquet cache for DataFrame persistence. [DEPLOYED]
- **PART B**: DataLoader parallelism (`num_workers=4`). [DEPLOYED]
- **PART C**: Direct file-based storage. [PLANNED]

---

## BUG-004 — Random baseline trap on synthetic dataset
<!-- updated: 2026-05-04 -->
**Status**: RESOLVED — 2026-05-04
**Confirmed**: 2026-05-04
**Severity**: Critical — all training jobs produced random accuracy

### Symptom
Val accuracy: 16.9% (random baseline 16.7% for 6 classes).
Val loss: 1.792 (ceiling ln(6) = 1.7918).

### Root cause
`healthcare_dataset.csv` was generated with randomly assigned labels.

### Fix applied
Regenerated dataset with per-condition feature distributions (Age means, Billing means, Medication probabilities).

---

## BUG-005 — Aggregation crash on dict metrics (float conversion)
<!-- updated: 2026-05-04 -->
**Status**: RESOLVED — 2026-05-04
**Confirmed**: 2026-05-04
**Severity**: High — blocks global model aggregation

### Symptom
Log error: `ERROR:app.api.training:aggregate error: float() argument must be a string or a real number, not 'dict'`
Status: 500 Internal Server Error on `POST /api/v1/training/aggregate`.

### Root cause
Aggregation logic attempted to call `float(j.accuracy)` and `float(j.loss)` directly. In some cases, these columns contained dictionary objects or JSON strings instead of numeric strings.

### Fix applied
Implemented defensive parsing in `aggregate_models` to check if values are dictionaries before conversion. Added support for extracting `test_accuracy` and `test_loss` keys from dictionary inputs.
- **Affected file**: `backend/app/api/training.py`

---

## BUG-006 — Doctor patient load count showing zero
<!-- updated: 2026-05-04 -->
**Status**: RESOLVED — 2026-05-04
**Confirmed**: 2026-05-04
**Severity**: Medium — incorrect clinical reporting for doctors

### Symptom
A doctor (e.g., Harish Raj) has 1 registered patient, but the "Patient Load" column in the registry table shows "0 Registered".

### Root cause
1. **Orphaned Records**: The patient's `created_by` field contained a legacy UUID that did not match the current doctor's ID.
2. **Fragile Matching**: The frontend used a strict `===` comparison which failed if IDs were missing or in different string formats.

### Fix applied
1. **Data Migration**: Reassigned orphaned patient records to the correct active doctor IDs in `data/mongodb/patients.json`.
2. **Robust Logic**: Updated `PatientsPage.tsx` to use `.toString()` comparison and handle both `id` and `_id` field fallbacks.
- **Affected files**: `data/mongodb/patients.json`, `frontend/src/app/dashboard/patients/page.tsx`

---

## Quick Reference — OPEN BUGS
| ID | Summary | Severity | Workaround available |
|----|---------|----------|----------------------|
| BUG-003 | DB reconstruction slow training | Medium | Yes — Parquet cache |
| BUG-005 | Aggregation crash on dict metrics | High | No |

## Quick Reference — RESOLVED BUGS
| ID | Summary | Resolved |
|----|---------|----------|
| BUG-001 | Filename parser false warning | 2026-05-04 |
| BUG-002 | Training on wrong dataset | 2026-05-04 |
| BUG-004 | Synthetic dataset no signal | 2026-05-04 |
| BUG-005 | Aggregation crash on dict metrics | 2026-05-04 |
| BUG-006 | Doctor patient load showing zero | 2026-05-04 |
