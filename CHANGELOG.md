# Changelog

## 2026-05-04
<!-- updated: 2026-05-04 -->
- Added dataset filename convention: {hospital_slug}_{data_type}_{YYYY-MM-DD}.csv
- Added upload validation keyword blocklist (covid, nursing_home, cms, etc.)
- Added hospital slug mismatch validation on upload
- Added duplicate upload SHA-256 detection
- Added auto-rename suggestion on filename warning
- Added Training Readiness Check (Record count, Column presence, Signal quality)
- Added storage of source_filename in training_jobs records
- Added Parquet caching for DB reconstruction overhead
- Added num_workers=4 DataLoader configuration for speed
- Added high-velocity training parameters (50 epochs, 128 batch size)
- Added organization type cascade (type → specialization → department)
- Added Interactive Hospital Network Map with Leaflet.js
- Fixed random baseline trap in training diagnostics
- Fixed 404 job retrieval errors in polling dashboard
- Fixed database schema synchronization for departmental identity
- Modernized Patient Registry UI with "High-Tech Anti-Gravity" design language (Glassmorphism, Neon accents).
- Fixed 403 Forbidden authorization error for Doctor roles accessing hospital staff lists.
- Implemented Blockchain Clinical Audit Trail for patient registrations, updates, and report uploads.
- Fixed Blockchain Audit Dashboard metrics (Aggregation Rounds, Training Submissions, Total Samples Verified).
- Added immutable cryptographic proof modal for clinical data verification.
- Integrated singleton Blockchain service for cross-module audit consistency.
