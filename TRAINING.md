# Training Configuration & Diagnostics

## Training Parameters (defaults table)
<!-- updated: 2026-05-04 -->
| Parameter | Default | Description |
|-----------|---------|-------------|
| `epochs` | 50 | Training epochs for local model training |
| `learning_rate` | 0.001 | Optimizer learning rate |
| `batch_size` | 128 | Mini-batch size (optimized for speed) |
| `patience` | 50 | Early stopping patience (high for stability) |
| `dropout` | 0.3 | Dropout rate for regularization |
| `epsilon (ε)` | 1.0 | Differential privacy budget per round |

## Data Source Options (DB export vs CSV upload)
<!-- updated: 2026-05-04 -->
- **CSV Upload**: Hospitals upload pre-prepared CSV datasets. Validated against naming conventions and node specialty.
- **Direct DB Export**: Real-time export from the hospital node's patient database. Auto-anonymized before training starts.

## Privacy Mode (anonymized vs identified)
<!-- updated: 2026-05-04 -->
- **Anonymized**: PII auto-stripped. Required for global federated aggregation.
- **Identified**: Includes doctor identifiers and higher precision. Restricted to local node analysis.

## Dataset Filename Convention
<!-- updated: 2026-05-04 -->
Format: `{hospital_slug}_{data_type}_{YYYY-MM-DD}.csv`
- See [DATASET.md](./DATASET.md) for full details.

## Upload Validation Rules
<!-- updated: 2026-05-04 -->
- **Keyword Blocklist**: Prevents training on administrative datasets (COVID, CMS, Census).
- **Slug Mismatch**: Ensures dataset belongs to the uploading node.
- **Org Type Mismatch**: Cross-checks data type against node specialty (e.g., Cardiac vs Neuro).

## Speed Diagnostics
<!-- updated: 2026-05-04 -->
### Baseline expectations
- 55,500 records should train 50 epochs in < 60 seconds on standard CPU.

### DB reconstruction overhead fix
- Replaced iterative row insertion with batch processing.

### DataLoader parallelism fix
- Configured `num_workers=4` for concurrent data fetching.

### Parquet caching implementation
- Implemented `.parquet` caching for frequent training on the same data.

## Accuracy Diagnostics
<!-- updated: 2026-05-04 -->
### Random baseline trap
- Target Accuracy: `100 / num_classes`
- If accuracy ≈ baseline, verify feature signal spread.

### Loss ceiling reference table
| Classes | ln(N) Ceiling |
|---------|---------------|
| 2       | 0.6931        |
| 6       | 1.7917        |
| 10      | 2.3026        |

### Signal strength requirements
- Minimum correlation of 0.2 between target and at least 3 features.

### Minimum correlation thresholds for DP epsilon=1.0
- Signal must overcome noise floor injected by Gaussian mechanism.

## Post-Training Report Interpretation
- Confusion Matrix: Identifies class-specific misclassification.
- Precision/Recall/F1: Balance of sensitivity and specificity.

## Recommended Configurations by Dataset Size
- < 1,000 records: Reduce epochs to 10, epsilon to 5.0.
- > 50,000 records: Standard 50 epochs, epsilon 1.0.

## Changelog
<!-- updated: 2026-05-04 -->
- 2026-05-04 — Initialized TRAINING.md with speed and accuracy diagnostic rules.
