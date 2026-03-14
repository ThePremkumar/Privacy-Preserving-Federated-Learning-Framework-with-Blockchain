"""
Healthcare CSV Data Preprocessor
=================================
Detects EVERY column in the healthcare CSV, classifies each column type,
applies appropriate encoding/scaling, and produces train-ready tensors.

Supported columns (auto-detected):
  - Name               → dropped (PII, not a feature)
  - Age                → numerical, StandardScaler
  - Gender             → binary label encoding  (Male=1, Female=0)
  - Blood Type         → one-hot encoding       (8 categories)
  - Medical Condition  → **TARGET** label encoding (6 classes)
  - Date of Admission  → feature-engineered (month, day-of-week, quarter)
  - Doctor             → dropped (high cardinality, no predictive value)
  - Hospital           → dropped (high cardinality, no predictive value)
  - Insurance Provider → one-hot encoding        (5 categories)
  - Billing Amount     → numerical, StandardScaler
  - Room Number        → numerical, StandardScaler
  - Admission Type     → one-hot encoding        (3 categories)
  - Discharge Date     → feature-engineered (length of stay in days)
  - Medication         → one-hot encoding        (5 categories)
  - Test Results       → ordinal encoding        (Normal=0, Inconclusive=1, Abnormal=2)
"""

import pandas as pd
import numpy as np
import torch
from torch.utils.data import TensorDataset, DataLoader, random_split
from sklearn.preprocessing import StandardScaler, LabelEncoder, OneHotEncoder
from sklearn.model_selection import train_test_split
from typing import Tuple, Dict, List, Any, Optional
import logging
import os
import json

logger = logging.getLogger("HealthcarePreprocessor")


# ──────────────────────────────────────────────────────────────────────────────
# Column type detection
# ──────────────────────────────────────────────────────────────────────────────

COLUMN_ROLES = {
    "Name":               "drop",            # PII - not a feature
    "Age":                "numerical",
    "Gender":             "binary",
    "Blood Type":         "categorical",
    "Medical Condition":  "target",           # 6-class classification target
    "Date of Admission":  "date_admission",
    "Doctor":             "drop",             # high-cardinality
    "Hospital":           "drop",             # high-cardinality
    "Insurance Provider": "categorical",
    "Billing Amount":     "numerical",
    "Room Number":        "numerical",
    "Admission Type":     "categorical",
    "Discharge Date":     "date_discharge",
    "Medication":         "categorical",
    "Test Results":       "ordinal",
}

# Fixed ordinal map for Test Results
TEST_RESULTS_ORDER = {"Normal": 0, "Inconclusive": 1, "Abnormal": 2}

# Fixed binary map for Gender
GENDER_MAP = {"Female": 0, "Male": 1}

# Medical conditions (target classes)
MEDICAL_CONDITIONS = [
    "Arthritis", "Asthma", "Cancer", "Diabetes", "Hypertension", "Obesity"
]


class HealthcareDataProcessor:
    """
    End-to-end CSV → Tensor pipeline for the healthcare dataset.
    Fully detects every column, encodes / scales, and returns
    PyTorch DataLoaders ready for training.
    """

    def __init__(self):
        self.scaler = StandardScaler()
        self.label_encoder = LabelEncoder()
        self.one_hot_encoders: Dict[str, OneHotEncoder] = {}
        self.feature_names: List[str] = []
        self.num_classes: int = 0
        self.num_features: int = 0
        self.column_report: Dict[str, Any] = {}
        self._is_fitted = False

    # ──────────────────────────────────────────────────────────────────────
    # Public API
    # ──────────────────────────────────────────────────────────────────────

    def detect_columns(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Analyse every column in the DataFrame and return a detection report.
        """
        report = {}
        for col in df.columns:
            role = COLUMN_ROLES.get(col, "unknown")
            info: Dict[str, Any] = {
                "role":       role,
                "dtype":      str(df[col].dtype),
                "null_count": int(df[col].isnull().sum()),
                "unique":     int(df[col].nunique()),
            }

            if df[col].dtype in ("int64", "float64"):
                info["min"] = float(df[col].min())
                info["max"] = float(df[col].max())
                info["mean"] = float(df[col].mean())
                info["std"] = float(df[col].std())
            else:
                vals = df[col].value_counts().head(10).to_dict()
                info["top_values"] = {str(k): int(v) for k, v in vals.items()}

            report[col] = info

        self.column_report = report
        logger.info(f"Detected {len(report)} columns: "
                    + ", ".join(f"{c} ({r['role']})" for c, r in report.items()))
        return report

    def fit_transform(
        self,
        df: pd.DataFrame,
        target_col: str = "Medical Condition",
    ) -> Tuple[np.ndarray, np.ndarray]:
        """
        Fit encoders/scalers on the full DataFrame and return (X, y) arrays.
        """
        df = df.copy()
        self.detect_columns(df)

        # ── Encode target ─────────────────────────────────────────────────
        self.label_encoder.fit(sorted(df[target_col].unique()))
        y = self.label_encoder.transform(df[target_col])
        self.num_classes = len(self.label_encoder.classes_)
        logger.info(f"Target classes ({self.num_classes}): {list(self.label_encoder.classes_)}")

        # ── Build feature matrix ──────────────────────────────────────────
        feature_frames: List[pd.DataFrame] = []
        feature_name_parts: List[str] = []

        for col in df.columns:
            role = COLUMN_ROLES.get(col, "unknown")

            if role == "drop" or role == "target":
                continue

            elif role == "numerical":
                feature_frames.append(df[[col]].astype(float))
                feature_name_parts.append(col)

            elif role == "binary":
                mapped = df[col].map(GENDER_MAP).fillna(0).astype(float)
                feature_frames.append(mapped.to_frame(col))
                feature_name_parts.append(col)

            elif role == "ordinal":
                mapped = df[col].map(TEST_RESULTS_ORDER).fillna(1).astype(float)
                feature_frames.append(mapped.to_frame(col))
                feature_name_parts.append(col)

            elif role == "categorical":
                ohe = OneHotEncoder(sparse_output=False, handle_unknown="ignore")
                encoded = ohe.fit_transform(df[[col]])
                cat_names = [f"{col}_{cat}" for cat in ohe.categories_[0]]
                enc_df = pd.DataFrame(encoded, columns=cat_names, index=df.index)
                feature_frames.append(enc_df)
                feature_name_parts.extend(cat_names)
                self.one_hot_encoders[col] = ohe

            elif role == "date_admission":
                dt = pd.to_datetime(df[col], errors="coerce")
                feat_df = pd.DataFrame({
                    "admission_month":     dt.dt.month.fillna(1).astype(float),
                    "admission_dayofweek": dt.dt.dayofweek.fillna(0).astype(float),
                    "admission_quarter":   dt.dt.quarter.fillna(1).astype(float),
                }, index=df.index)
                feature_frames.append(feat_df)
                feature_name_parts.extend(["admission_month", "admission_dayofweek", "admission_quarter"])

            elif role == "date_discharge":
                # Compute length-of-stay from admission and discharge dates
                admit_dt = pd.to_datetime(df.get("Date of Admission", ""), errors="coerce")
                discharge_dt = pd.to_datetime(df[col], errors="coerce")
                los = (discharge_dt - admit_dt).dt.days.fillna(0).astype(float)
                los_df = pd.DataFrame({"length_of_stay": los}, index=df.index)
                feature_frames.append(los_df)
                feature_name_parts.append("length_of_stay")

            else:
                # Unknown column – skip with warning
                logger.warning(f"Unknown column '{col}' skipped during preprocessing")

        X_raw = pd.concat(feature_frames, axis=1).values.astype(np.float32)

        # ── Scale numerical features ──────────────────────────────────────
        X = self.scaler.fit_transform(X_raw).astype(np.float32)

        self.feature_names = feature_name_parts
        self.num_features = X.shape[1]
        self._is_fitted = True

        logger.info(f"Feature matrix: {X.shape[0]} samples × {X.shape[1]} features")
        logger.info(f"Features: {self.feature_names}")

        return X, y

    def transform(self, df: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray]:
        """
        Transform new data using already-fitted encoders/scalers.
        """
        if not self._is_fitted:
            raise RuntimeError("Call fit_transform() first.")

        df = df.copy()
        target_col = "Medical Condition"
        y = self.label_encoder.transform(df[target_col])

        feature_frames: List[pd.DataFrame] = []

        for col in df.columns:
            role = COLUMN_ROLES.get(col, "unknown")

            if role in ("drop", "target"):
                continue
            elif role == "numerical":
                feature_frames.append(df[[col]].astype(float))
            elif role == "binary":
                mapped = df[col].map(GENDER_MAP).fillna(0).astype(float)
                feature_frames.append(mapped.to_frame(col))
            elif role == "ordinal":
                mapped = df[col].map(TEST_RESULTS_ORDER).fillna(1).astype(float)
                feature_frames.append(mapped.to_frame(col))
            elif role == "categorical":
                ohe = self.one_hot_encoders[col]
                encoded = ohe.transform(df[[col]])
                cat_names = [f"{col}_{cat}" for cat in ohe.categories_[0]]
                enc_df = pd.DataFrame(encoded, columns=cat_names, index=df.index)
                feature_frames.append(enc_df)
            elif role == "date_admission":
                dt = pd.to_datetime(df[col], errors="coerce")
                feat_df = pd.DataFrame({
                    "admission_month":     dt.dt.month.fillna(1).astype(float),
                    "admission_dayofweek": dt.dt.dayofweek.fillna(0).astype(float),
                    "admission_quarter":   dt.dt.quarter.fillna(1).astype(float),
                }, index=df.index)
                feature_frames.append(feat_df)
            elif role == "date_discharge":
                admit_dt = pd.to_datetime(df.get("Date of Admission", ""), errors="coerce")
                discharge_dt = pd.to_datetime(df[col], errors="coerce")
                los = (discharge_dt - admit_dt).dt.days.fillna(0).astype(float)
                los_df = pd.DataFrame({"length_of_stay": los}, index=df.index)
                feature_frames.append(los_df)

        X_raw = pd.concat(feature_frames, axis=1).values.astype(np.float32)
        X = self.scaler.transform(X_raw).astype(np.float32)
        return X, y

    def create_dataloaders(
        self,
        X: np.ndarray,
        y: np.ndarray,
        test_size: float = 0.2,
        val_size: float = 0.1,
        batch_size: int = 64,
        num_workers: int = 0,
    ) -> Dict[str, DataLoader]:
        """
        Split data and create train/val/test DataLoaders.
        """
        # First split: train+val  vs  test
        X_trainval, X_test, y_trainval, y_test = train_test_split(
            X, y, test_size=test_size, random_state=42, stratify=y
        )

        # Second split: train  vs  val
        relative_val = val_size / (1 - test_size)
        X_train, X_val, y_train, y_val = train_test_split(
            X_trainval, y_trainval, test_size=relative_val, random_state=42, stratify=y_trainval
        )

        def _make_loader(X_np, y_np, shuffle):
            ds = TensorDataset(
                torch.FloatTensor(X_np),
                torch.LongTensor(y_np),
            )
            return DataLoader(ds, batch_size=batch_size, shuffle=shuffle, num_workers=num_workers)

        loaders = {
            "train": _make_loader(X_train, y_train, shuffle=True),
            "val":   _make_loader(X_val,   y_val,   shuffle=False),
            "test":  _make_loader(X_test,  y_test,  shuffle=False),
        }

        logger.info(
            f"DataLoaders created — train: {len(X_train)}, val: {len(X_val)}, test: {len(X_test)} "
            f"(batch_size={batch_size})"
        )

        return loaders

    def create_federated_loaders(
        self,
        X: np.ndarray,
        y: np.ndarray,
        num_clients: int = 4,
        test_size: float = 0.2,
        batch_size: int = 64,
        alpha: float = 0.5,
    ) -> Tuple[Dict[str, DataLoader], DataLoader]:
        """
        Split data into federated client loaders using Dirichlet distribution
        for non-IID partition (compatible with existing FL pipeline).
        """
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=42, stratify=y
        )

        # Dirichlet split for non-IID
        client_indices = self._dirichlet_split(y_train, num_clients, alpha)

        client_loaders = {}
        for i, indices in enumerate(client_indices):
            ds = TensorDataset(
                torch.FloatTensor(X_train[indices]),
                torch.LongTensor(y_train[indices]),
            )
            client_loaders[f"client_{i}"] = DataLoader(ds, batch_size=batch_size, shuffle=True)
            logger.info(f"Client {i}: {len(indices)} samples")

        test_ds = TensorDataset(torch.FloatTensor(X_test), torch.LongTensor(y_test))
        test_loader = DataLoader(test_ds, batch_size=batch_size, shuffle=False)

        return client_loaders, test_loader

    def get_report(self) -> Dict[str, Any]:
        """Return the full column detection report."""
        return {
            "columns": self.column_report,
            "num_features": self.num_features,
            "num_classes": self.num_classes,
            "feature_names": self.feature_names,
            "class_names": list(self.label_encoder.classes_) if self._is_fitted else [],
            "is_fitted": self._is_fitted,
        }

    # ──────────────────────────────────────────────────────────────────────
    # Internal helpers
    # ──────────────────────────────────────────────────────────────────────

    @staticmethod
    def _dirichlet_split(labels: np.ndarray, num_clients: int, alpha: float) -> List[np.ndarray]:
        """Non-IID split using Dirichlet distribution."""
        num_classes = len(np.unique(labels))
        client_indices: List[List[int]] = [[] for _ in range(num_clients)]

        for c in range(num_classes):
            class_idx = np.where(labels == c)[0]
            np.random.shuffle(class_idx)

            proportions = np.random.dirichlet(np.repeat(alpha, num_clients))
            counts = (proportions * len(class_idx)).astype(int)
            # Fix rounding so total equals class count
            counts[-1] = len(class_idx) - counts[:-1].sum()

            start = 0
            for i in range(num_clients):
                client_indices[i].extend(class_idx[start:start + counts[i]].tolist())
                start += counts[i]

        return [np.array(idx) for idx in client_indices]
