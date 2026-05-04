# Dataset Requirements

## Filename Convention
<!-- updated: 2026-05-04 -->
### Format: {hospital_slug}_{data_type}_{YYYY-MM-DD}.csv

| Part | Format | Example |
|------|--------|---------|
| hospital_slug | Lowercase, no spaces | himsr, apollo |
| data_type | Snake_case, approved list | patient_records |
| date | YYYY-MM-DD | 2026-05-04 |

### Approved data_type values
- `patient_records`
- `disease_prediction`
- `training_dataset`
- `clinical_export`
- `federated_training`

### Valid and invalid examples
- ✅ `himsr_patient_records_2026-05-04.csv`
- ❌ `healthcare_dataset.csv` (Missing slug and date)
- ❌ `CMS_COVID_data.csv` (Contains blocked keywords)

## Upload Validation
<!-- updated: 2026-05-04 -->
### Keyword blocklist
Blocked keywords (case-insensitive):
`covid`, `nursing_home`, `cms`, `census`, `billing_only`, `public_health`, `population_study`, `cdc_`, `who_`, `nhs_`, `medicare_export`, `medicaid_export`.

### Hospital slug mismatch check
Extracts prefix and compares with authenticated `hospital_id`.

### Organization type mismatch check
| Org Type | Expected data_type |
|----------|-------------------|
| Heart hospital | cardiac_records |
| Neuro center | neuro_records |
| Multispecialty | patient_records |

### Duplicate upload detection
Uses SHA-256 hash comparison across hospital node history.

### Auto-rename suggestion
Suggests `{node_slug}_patient_records_{today}.csv` for invalid filenames.

## Column Requirements
<!-- updated: 2026-05-04 -->
### Required columns by organization type
- General: Age, Gender, Symptoms, Diagnosis.
- Specialized: Vitals relevant to the specialty (e.g., BP for Cardiac).

### Target column detection
Automated detection of outcome/label columns (e.g., `Result`, `Diagnosis`).

### Columns that are always dropped
`ID`, `Name`, `Social Security`, `Phone`.

### Columns that are always anonymized in privacy mode
`Doctor ID`, `Location`, `Visit Date`.

## Signal Requirements
<!-- updated: 2026-05-04 -->
### Minimum feature-label correlation thresholds
- r > 0.15 for key features.

### Minimum spread by feature type
- Features must show variance > 0.05.

### How to verify signal before training
Use the **Analyze CSV** tool in the Training Assistant.

## Synthetic Data Generation
<!-- updated: 2026-05-04 -->
### Per-condition distributions (age, billing, medication, test results)
- Synthetic data generated with clinical correlations (e.g., Age ↔ Diagnosis).

### Minimum spread requirements for DP epsilon=1.0
- Data must have sufficient variety to remain useful after noise injection.

## Changelog
<!-- updated: 2026-05-04 -->
- 2026-05-04 — Established dataset naming convention and upload validation rules.
