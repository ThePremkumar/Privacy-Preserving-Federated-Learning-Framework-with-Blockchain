# Notification System

## Event Types
<!-- updated: 2026-05-04 -->
- `training_completed`: Success notification with accuracy metrics.
- `training_failed`: Error alert with stack trace summary.
- `referral_received`: Alert for hospital admins when a doctor refers a patient.
- `profile_updated`: Security alert when email/password is changed.

## WebSocket Mappings
<!-- updated: 2026-05-04 -->
Real-time events are pushed via `ws://localhost:8001/ws/{user_id}`.

## Sound Catalog
<!-- updated: 2026-05-04 -->
| Severity | Sound Asset | Trigger |
|----------|-------------|---------|
| Success  | `success.mp3` | Job completion, upload success |
| Warning  | `warning.mp3` | Filename mismatch, low accuracy |
| Error    | `error.mp3`   | Training crash, auth failure |

## Changelog
<!-- updated: 2026-05-04 -->
- 2026-05-04 — Initialized notification system mappings.
