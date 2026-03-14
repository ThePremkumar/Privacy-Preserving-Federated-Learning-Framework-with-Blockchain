"""
Healthcare Model Trainer
========================
Real training pipeline for the healthcare CSV dataset.
Trains a neural network on all 15 detected CSV columns to predict
Medical Condition (6-class classification).

Models supported:
  1. HealthcareMLP (primary)     – multi-layer perceptron with batch-norm & dropout
  2. HealthcareLogistic          – simple logistic baseline
  3. RandomForest (sklearn)      – ensemble baseline

Training features:
  - Full epoch-level train/val/test reporting
  - Early stopping with patience
  - Learning rate scheduling
  - Per-class metrics (precision, recall, F1)
  - Confusion matrix generation
  - Model checkpointing (best val accuracy)
  - Integration with federated learning pipeline
"""

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
import numpy as np
import pandas as pd
import json
import time
import os
import hashlib
import logging
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    accuracy_score,
    f1_score,
)

from .healthcare_preprocessor import HealthcareDataProcessor

logger = logging.getLogger("HealthcareTrainer")


# ══════════════════════════════════════════════════════════════════════════════
# Model Architectures
# ══════════════════════════════════════════════════════════════════════════════

class HealthcareMLP(nn.Module):
    """
    Production-grade MLP for medical condition prediction.
    Architecture: Input → [Linear→BN→ReLU→Dropout] × 4 → Output
    """

    def __init__(self, input_dim: int, num_classes: int = 6,
                 hidden_dims: List[int] = None, dropout: float = 0.2):
        super().__init__()
        if hidden_dims is None:
            hidden_dims = [512, 256, 128, 64]

        layers: List[nn.Module] = []
        prev_dim = input_dim

        for h_dim in hidden_dims:
            layers.extend([
                nn.Linear(prev_dim, h_dim),
                nn.BatchNorm1d(h_dim),
                nn.ReLU(inplace=True),
                nn.Dropout(dropout),
            ])
            prev_dim = h_dim

        layers.append(nn.Linear(prev_dim, num_classes))
        self.network = nn.Sequential(*layers)
        self._initialize_weights()

    def _initialize_weights(self):
        for m in self.modules():
            if isinstance(m, nn.Linear):
                nn.init.kaiming_normal_(m.weight, nonlinearity="relu")
                if m.bias is not None:
                    nn.init.constant_(m.bias, 0)
            elif isinstance(m, nn.BatchNorm1d):
                nn.init.constant_(m.weight, 1)
                nn.init.constant_(m.bias, 0)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.network(x)

    def get_parameters(self) -> List[torch.Tensor]:
        return [p.data.clone() for p in self.parameters()]

    def set_parameters(self, parameters: List[torch.Tensor]):
        for p, new_p in zip(self.parameters(), parameters):
            p.data.copy_(new_p)


# ══════════════════════════════════════════════════════════════════════════════
# Trainer
# ══════════════════════════════════════════════════════════════════════════════

class HealthcareTrainer:
    """
    Full training loop with early stopping, LR scheduling, and rich metrics.
    """

    def __init__(
        self,
        model: nn.Module,
        device: str = "cpu",
        learning_rate: float = 0.001,
        weight_decay: float = 1e-4,
    ):
        self.model = model.to(device)
        self.device = device
        self.criterion = nn.CrossEntropyLoss()
        self.optimizer = optim.Adam(
            model.parameters(), lr=learning_rate, weight_decay=weight_decay
        )
        self.scheduler = optim.lr_scheduler.ReduceLROnPlateau(
            self.optimizer, mode="min", factor=0.5, patience=3
        )
        self.history: List[Dict[str, Any]] = []
        self.best_val_acc = 0.0
        self.best_model_state = None

    # ──────────────────────────────────────────────────────────────────────
    # Train one epoch
    # ──────────────────────────────────────────────────────────────────────

    def _train_epoch(self, loader: DataLoader) -> Tuple[float, float]:
        self.model.train()
        total_loss = 0.0
        correct = 0
        total = 0

        for X_batch, y_batch in loader:
            X_batch = X_batch.to(self.device)
            y_batch = y_batch.to(self.device)

            self.optimizer.zero_grad()
            outputs = self.model(X_batch)
            loss = self.criterion(outputs, y_batch)
            loss.backward()
            torch.nn.utils.clip_grad_norm_(self.model.parameters(), max_norm=1.0)
            self.optimizer.step()

            total_loss += loss.item() * X_batch.size(0)
            preds = outputs.argmax(dim=1)
            correct += (preds == y_batch).sum().item()
            total += y_batch.size(0)

        avg_loss = total_loss / total
        accuracy = 100.0 * correct / total
        return avg_loss, accuracy

    # ──────────────────────────────────────────────────────────────────────
    # Evaluate
    # ──────────────────────────────────────────────────────────────────────

    def _evaluate(self, loader: DataLoader) -> Tuple[float, float, np.ndarray, np.ndarray]:
        self.model.eval()
        total_loss = 0.0
        all_preds = []
        all_labels = []

        with torch.no_grad():
            for X_batch, y_batch in loader:
                X_batch = X_batch.to(self.device)
                y_batch = y_batch.to(self.device)

                outputs = self.model(X_batch)
                loss = self.criterion(outputs, y_batch)

                total_loss += loss.item() * X_batch.size(0)
                preds = outputs.argmax(dim=1)
                all_preds.extend(preds.cpu().numpy())
                all_labels.extend(y_batch.cpu().numpy())

        all_preds = np.array(all_preds)
        all_labels = np.array(all_labels)
        avg_loss = total_loss / len(all_labels)
        accuracy = 100.0 * accuracy_score(all_labels, all_preds)

        return avg_loss, accuracy, all_preds, all_labels

    # ──────────────────────────────────────────────────────────────────────
    # Full training
    # ──────────────────────────────────────────────────────────────────────

    def train(
        self,
        train_loader: DataLoader,
        val_loader: DataLoader,
        epochs: int = 30,
        patience: int = 7,
    ) -> List[Dict[str, Any]]:
        """Run full training with early stopping."""
        logger.info(f"Starting training for {epochs} epochs (patience={patience})")
        no_improve = 0

        for epoch in range(1, epochs + 1):
            start_t = time.time()

            # Train
            train_loss, train_acc = self._train_epoch(train_loader)

            # Validate
            val_loss, val_acc, _, _ = self._evaluate(val_loader)

            # LR schedule
            self.scheduler.step(val_loss)
            current_lr = self.optimizer.param_groups[0]["lr"]

            elapsed = time.time() - start_t

            # Record
            record = {
                "epoch": epoch,
                "train_loss": round(train_loss, 4),
                "train_acc":  round(train_acc, 2),
                "val_loss":   round(val_loss, 4),
                "val_acc":    round(val_acc, 2),
                "lr":         current_lr,
                "time_s":     round(elapsed, 2),
            }
            self.history.append(record)

            logger.info(
                f"Epoch {epoch:3d}/{epochs} | "
                f"Train Loss: {train_loss:.4f}  Acc: {train_acc:.2f}% | "
                f"Val Loss: {val_loss:.4f}  Acc: {val_acc:.2f}% | "
                f"LR: {current_lr:.6f} | {elapsed:.1f}s"
            )

            # Check improvement
            if val_acc > self.best_val_acc:
                self.best_val_acc = val_acc
                self.best_model_state = {k: v.clone() for k, v in self.model.state_dict().items()}
                no_improve = 0
                logger.info(f"  ✓ New best val accuracy: {val_acc:.2f}%")
            else:
                no_improve += 1
                if no_improve >= patience:
                    logger.info(f"  ✗ Early stopping after {patience} epochs without improvement")
                    break

        # Restore best model
        if self.best_model_state is not None:
            self.model.load_state_dict(self.best_model_state)
            logger.info(f"Restored best model (val acc: {self.best_val_acc:.2f}%)")

        return self.history

    # ──────────────────────────────────────────────────────────────────────
    # Final test evaluation
    # ──────────────────────────────────────────────────────────────────────

    def evaluate_final(
        self,
        test_loader: DataLoader,
        class_names: List[str] = None,
    ) -> Dict[str, Any]:
        """Full evaluation on held-out test set with per-class metrics."""
        test_loss, test_acc, preds, labels = self._evaluate(test_loader)

        report = classification_report(
            labels, preds,
            target_names=class_names,
            output_dict=True,
            zero_division=0,
        )
        cm = confusion_matrix(labels, preds).tolist()
        f1 = f1_score(labels, preds, average="weighted")

        result = {
            "test_loss":          round(test_loss, 4),
            "test_accuracy":      round(test_acc, 2),
            "weighted_f1":        round(float(f1), 4),
            "classification_report": report,
            "confusion_matrix":   cm,
            "num_test_samples":   len(labels),
        }

        logger.info(
            f"TEST RESULTS — Accuracy: {test_acc:.2f}% | "
            f"Loss: {test_loss:.4f} | F1: {f1:.4f}"
        )
        if class_names:
            logger.info(f"Per-class metrics:")
            for cls in class_names:
                if cls in report:
                    r = report[cls]
                    logger.info(
                        f"  {cls:15s}  P={r['precision']:.3f}  R={r['recall']:.3f}  F1={r['f1-score']:.3f}"
                    )

        return result


# ══════════════════════════════════════════════════════════════════════════════
# High-level orchestrator
# ══════════════════════════════════════════════════════════════════════════════

def train_healthcare_csv(
    csv_path: str,
    epochs: int = 50,
    batch_size: int = 64,
    learning_rate: float = 0.001,
    patience: int = 10,
    device: str = None,
    save_dir: str = None,
) -> Dict[str, Any]:
    """
    Complete pipeline: load CSV → detect columns → preprocess → train → evaluate.

    Trains both neural network (HealthcareMLP) and sklearn ensemble models
    (RandomForest, GradientBoosting) to provide comprehensive results.

    Returns a rich result dict with column detection, training history,
    test metrics, and model weights hash.
    """
    from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
    from sklearn.metrics import accuracy_score as sk_accuracy

    if device is None:
        device = "cuda" if torch.cuda.is_available() else "cpu"

    logger.info(f"═══ Healthcare CSV Training Pipeline ═══")
    logger.info(f"CSV: {csv_path}")
    logger.info(f"Device: {device}")

    # ── 1. Load CSV ───────────────────────────────────────────────────────
    df = pd.read_csv(csv_path)
    logger.info(f"Loaded {df.shape[0]} rows × {df.shape[1]} columns")

    # ── 2. Detect & preprocess ────────────────────────────────────────────
    processor = HealthcareDataProcessor()
    X, y = processor.fit_transform(df)
    column_report = processor.get_report()

    # ── 3. Create dataloaders ─────────────────────────────────────────────
    loaders = processor.create_dataloaders(
        X, y, test_size=0.2, val_size=0.1, batch_size=batch_size
    )

    # ── 4. Build neural network model ─────────────────────────────────────
    model = HealthcareMLP(
        input_dim=processor.num_features,
        num_classes=processor.num_classes,
        hidden_dims=[512, 256, 128, 64],
        dropout=0.2,
    )
    param_count = sum(p.numel() for p in model.parameters())
    logger.info(f"Model: HealthcareMLP | Parameters: {param_count:,}")

    # ── 5. Train neural network ───────────────────────────────────────────
    trainer = HealthcareTrainer(
        model=model,
        device=device,
        learning_rate=learning_rate,
    )
    history = trainer.train(
        train_loader=loaders["train"],
        val_loader=loaders["val"],
        epochs=epochs,
        patience=patience,
    )

    # ── 6. Evaluate neural network ────────────────────────────────────────
    test_results = trainer.evaluate_final(
        test_loader=loaders["test"],
        class_names=list(processor.label_encoder.classes_),
    )

    # ── 6b. Train & evaluate sklearn ensemble models ──────────────────────
    from sklearn.model_selection import train_test_split as sk_split
    X_train_sk, X_test_sk, y_train_sk, y_test_sk = sk_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    sklearn_results = {}
    # Random Forest
    try:
        logger.info("Training Random Forest classifier...")
        rf = RandomForestClassifier(n_estimators=200, max_depth=15, random_state=42, n_jobs=-1)
        rf.fit(X_train_sk, y_train_sk)
        rf_preds = rf.predict(X_test_sk)
        rf_acc = sk_accuracy(y_test_sk, rf_preds) * 100
        rf_report = classification_report(
            y_test_sk, rf_preds,
            target_names=list(processor.label_encoder.classes_),
            output_dict=True, zero_division=0,
        )
        # Feature importance
        feat_imp = sorted(
            zip(processor.feature_names, rf.feature_importances_),
            key=lambda x: x[1], reverse=True
        )
        sklearn_results["random_forest"] = {
            "accuracy": round(rf_acc, 2),
            "classification_report": rf_report,
            "feature_importance": [{"feature": f, "importance": round(float(v), 4)} for f, v in feat_imp],
        }
        logger.info(f"Random Forest accuracy: {rf_acc:.2f}%")
    except Exception as e:
        logger.warning(f"Random Forest training failed: {e}")

    # Gradient Boosting
    try:
        logger.info("Training Gradient Boosting classifier...")
        gb = GradientBoostingClassifier(
            n_estimators=150, max_depth=5, learning_rate=0.1, random_state=42
        )
        gb.fit(X_train_sk, y_train_sk)
        gb_preds = gb.predict(X_test_sk)
        gb_acc = sk_accuracy(y_test_sk, gb_preds) * 100
        gb_report = classification_report(
            y_test_sk, gb_preds,
            target_names=list(processor.label_encoder.classes_),
            output_dict=True, zero_division=0,
        )
        sklearn_results["gradient_boosting"] = {
            "accuracy": round(gb_acc, 2),
            "classification_report": gb_report,
        }
        logger.info(f"Gradient Boosting accuracy: {gb_acc:.2f}%")
    except Exception as e:
        logger.warning(f"Gradient Boosting training failed: {e}")

    # ── 7. Compute model weights hash ─────────────────────────────────────
    weights_list = [p.data.cpu().numpy().tolist() for p in model.parameters()]
    weights_json = json.dumps(weights_list, separators=(",", ":"))
    weights_hash = hashlib.sha256(weights_json.encode()).hexdigest()

    # ── 8. Save model (optional) ──────────────────────────────────────────
    model_path = None
    if save_dir:
        os.makedirs(save_dir, exist_ok=True)
        model_path = os.path.join(save_dir, "healthcare_model.pt")
        torch.save({
            "model_state_dict": model.state_dict(),
            "num_features": processor.num_features,
            "num_classes": processor.num_classes,
            "feature_names": processor.feature_names,
            "class_names": list(processor.label_encoder.classes_),
            "training_history": history,
            "test_results": test_results,
        }, model_path)
        logger.info(f"Model saved to {model_path}")

    # ── 9. Assemble result ────────────────────────────────────────────────
    result = {
        "status": "completed",
        "timestamp": datetime.utcnow().isoformat(),
        "csv_path": csv_path,
        "dataset": {
            "total_samples": int(df.shape[0]),
            "total_columns": int(df.shape[1]),
            "num_features": processor.num_features,
            "num_classes": processor.num_classes,
            "class_names": list(processor.label_encoder.classes_),
            "feature_names": processor.feature_names,
        },
        "column_detection": column_report,
        "model": {
            "architecture": "HealthcareMLP",
            "hidden_dims": [512, 256, 128, 64],
            "parameter_count": param_count,
            "dropout": 0.2,
        },
        "sklearn_models": sklearn_results,
        "training": {
            "epochs_completed": len(history),
            "batch_size": batch_size,
            "learning_rate": learning_rate,
            "best_val_accuracy": round(trainer.best_val_acc, 2),
            "history": history,
        },
        "test_results": test_results,
        "weights_hash": weights_hash,
        "model_path": model_path,
    }

    logger.info("═══ Training Pipeline Complete ═══")
    return result
