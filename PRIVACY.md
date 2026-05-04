# Differential Privacy & Anonymization

## DP Parameters
<!-- updated: 2026-05-04 -->
| Parameter | Default | Description |
|-----------|---------|-------------|
| `epsilon (ε)` | 1.0 | Privacy budget |
| `delta (δ)` | 1e-5 | Failure probability |

## Anonymization Rules
<!-- updated: 2026-05-04 -->
- Automatic stripping of `Patient Name`, `Contact`, `Address`.
- Generalization of `Age` (into 10-year bins) in identified mode.

## Blockchain Integrity
<!-- updated: 2026-05-04 -->
- Every clinical event (Registration, Update, Report Upload) is hashed (SHA-256) and recorded on an immutable ledger.
- Provides a tamper-proof audit trail for HIPAA/GDPR compliance verification.

## Changelog
<!-- updated: 2026-05-04 -->
- 2026-05-04 — Initialized differential privacy rules.
- 2026-05-04 — Integrated Blockchain Clinical Audit Ledger for immutable data tracking.

