"""
Healthcare CSV Data Preprocessor
=================================
Auto-detects column types from any CSV, classifies each column,
applies appropriate encoding/scaling, and produces train-ready tensors.

Two modes:
  1. KNOWN schema  – when columns match the hardcoded COLUMN_ROLES (original
     healthcare dataset with 'Medical Condition' as target).
  2. GENERIC schema – when the dataset has unknown columns, the processor
     automatically infers types (numerical, categorical, text, date, drop)
     and picks a suitable classification target.
"""

import pandas as pd
import numpy as np
import torch
from torch.utils.data import TensorDataset, DataLoader, random_split
from sklearn.preprocessing import StandardScaler, LabelEncoder, OneHotEncoder
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from typing import Tuple, Dict, List, Any, Optional
import logging
import os
import json
import re

logger = logging.getLogger("HealthcarePreprocessor")


# ──────────────────────────────────────────────────────────────────────────────
# Column type detection — hardcoded hints for KNOWN healthcare schema
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

# Columns whose name suggests they are IDs / not useful as features
_ID_PATTERNS = re.compile(
    r"^(id|_id|index|row_?num|serial|sr_?no|unnamed)$", re.IGNORECASE
)

# Max unique-value ratio (unique/total) for a column to qualify as a
# classification target.  Above this it's too high-cardinality.
_MAX_TARGET_CARDINALITY_RATIO = 0.05      # 5 %
_MAX_TARGET_CARDINALITY_ABS   = 100       # hard cap
_MIN_TARGET_CARDINALITY       = 2         # must have at least 2 classes

# For one-hot encoding, columns with more unique values than this get
# text-vectorised (TF-IDF) or dropped instead.
_MAX_ONEHOT_CARDINALITY = 50

# Average token count threshold to consider a column as "long text"
_TEXT_AVG_TOKEN_THRESHOLD = 5


class HealthcareDataProcessor:
    """
    End-to-end CSV → Tensor pipeline.

    Works with *any* CSV:
      • If columns match the hardcoded COLUMN_ROLES → uses domain-specific
        encoding (binary gender map, ordinal test results, etc.).
      • Otherwise → infers types automatically and picks the best target.
    """

    def __init__(self):
        self.scaler = StandardScaler()
        self.label_encoder = LabelEncoder()
        self.one_hot_encoders: Dict[str, OneHotEncoder] = {}
        self.tfidf_encoders: Dict[str, TfidfVectorizer] = {}
        self.feature_names: List[str] = []
        self.num_classes: int = 0
        self.num_features: int = 0
        self.column_report: Dict[str, Any] = {}
        self._is_fitted = False
        self._inferred_roles: Dict[str, str] = {}
        self._target_col: Optional[str] = None

    # ──────────────────────────────────────────────────────────────────────
    # Public API
    # ──────────────────────────────────────────────────────────────────────

    def detect_columns(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Analyse every column in the DataFrame and return a detection report.
        """
        report = {}
        for col in df.columns:
            role = self._inferred_roles.get(col, COLUMN_ROLES.get(col, "unknown"))
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

    # ──────────────────────────────────────────────────────────────────────
    # Auto-inference helpers
    # ──────────────────────────────────────────────────────────────────────

    @staticmethod
    def _is_date_column(series: pd.Series) -> bool:
        """Heuristic: try to parse a sample; if > 60 % parse, it's a date."""
        if series.dtype in ("int64", "float64"):
            return False
        sample = series.dropna().head(200)
        if len(sample) == 0:
            return False
        parsed = pd.to_datetime(sample, errors="coerce", infer_datetime_format=True)
        return parsed.notna().mean() > 0.6

    @staticmethod
    def _is_text_column(series: pd.Series) -> bool:
        """A column is 'text' if the average token count per value is high."""
        sample = series.dropna().astype(str).head(200)
        if len(sample) == 0:
            return False
        avg_tokens = sample.str.split().str.len().mean()
        return avg_tokens >= _TEXT_AVG_TOKEN_THRESHOLD

    def _infer_column_roles(
        self,
        df: pd.DataFrame,
        target_col: Optional[str],
    ) -> Tuple[Dict[str, str], str]:
        """
        Infer a role for every column that isn't in COLUMN_ROLES.
        Returns (roles_dict, chosen_target_column).
        """
        roles: Dict[str, str] = {}
        n = len(df)

        # Step 1 — if target_col exists in the DataFrame, lock it as "target"
        if target_col and target_col in df.columns:
            roles[target_col] = "target"
        else:
            target_col = None  # will pick one below

        # Step 2 — classify every other column
        candidate_targets: List[Tuple[str, int]] = []

        for col in df.columns:
            if col in roles:
                continue
            # Already known?
            if col in COLUMN_ROLES:
                roles[col] = COLUMN_ROLES[col]
                continue

            nunique = df[col].nunique()
            dtype = df[col].dtype

            # ID-like column
            if _ID_PATTERNS.match(col) or (nunique == n and dtype in ("int64", "float64")):
                roles[col] = "drop"
                continue

            # Numerical
            if dtype in ("int64", "float64"):
                roles[col] = "numerical"
                # Also a target candidate if few unique values
                if _MIN_TARGET_CARDINALITY <= nunique <= _MAX_TARGET_CARDINALITY_ABS:
                    candidate_targets.append((col, nunique))
                continue

            # Object / string columns
            if self._is_date_column(df[col]):
                roles[col] = "date_generic"
                continue

            # Low cardinality string → categorical (potential target)
            if nunique <= _MAX_ONEHOT_CARDINALITY:
                if nunique == 2:
                    roles[col] = "binary_auto"
                else:
                    roles[col] = "categorical"
                if _MIN_TARGET_CARDINALITY <= nunique <= _MAX_TARGET_CARDINALITY_ABS:
                    if n > 0 and nunique / n <= _MAX_TARGET_CARDINALITY_RATIO:
                        candidate_targets.append((col, nunique))
                    elif nunique <= 30:
                        # Small absolute cardinality is always ok
                        candidate_targets.append((col, nunique))
                continue

            # High cardinality string — text or drop
            if self._is_text_column(df[col]):
                roles[col] = "text"
            elif nunique > _MAX_ONEHOT_CARDINALITY:
                roles[col] = "drop"
            else:
                roles[col] = "categorical"

        # Step 3 — pick a target if not already set
        if target_col is None:
            if not candidate_targets:
                # Desperate fallback: use any categorical column
                for col, role in roles.items():
                    if role in ("categorical", "binary_auto"):
                        nunique = df[col].nunique()
                        if nunique >= _MIN_TARGET_CARDINALITY:
                            candidate_targets.append((col, nunique))

            if candidate_targets:
                # Prefer columns whose name hints at a target
                target_hints = re.compile(
                    r"(target|label|class|category|condition|result|answer|outcome|diagnosis|type|topic)",
                    re.IGNORECASE,
                )
                hinted = [(c, n) for c, n in candidate_targets if target_hints.search(c)]
                if hinted:
                    # Among hinted, pick the one with moderate cardinality
                    target_col = min(hinted, key=lambda x: abs(x[1] - 6))[0]
                else:
                    target_col = min(candidate_targets, key=lambda x: abs(x[1] - 6))[0]
                roles[target_col] = "target"
            else:
                raise ValueError(
                    "Could not find a suitable classification target column. "
                    f"Columns: {list(df.columns)}"
                )

        logger.info(f"Auto-selected target column: '{target_col}'")
        return roles, target_col

    # ──────────────────────────────────────────────────────────────────────
    # fit_transform
    # ──────────────────────────────────────────────────────────────────────

    def fit_transform(
        self,
        df: pd.DataFrame,
        target_col: str = "Medical Condition",
    ) -> Tuple[np.ndarray, np.ndarray]:
        """
        Fit encoders/scalers on the full DataFrame and return (X, y) arrays.

        If `target_col` is not present in the DataFrame the processor will
        auto-detect a suitable target.
        """
        df = df.copy()

        # ── Decide whether to use hardcoded or inferred roles ─────────────
        known_cols = set(COLUMN_ROLES.keys())
        actual_cols = set(df.columns)
        overlap_ratio = len(known_cols & actual_cols) / max(len(actual_cols), 1)

        if overlap_ratio >= 0.5 and target_col in df.columns:
            # Known healthcare schema → use hardcoded roles
            self._inferred_roles = dict(COLUMN_ROLES)
            self._target_col = target_col
            logger.info("Using KNOWN healthcare schema (hardcoded roles)")
        else:
            # Unknown schema → auto-infer
            logger.info(
                f"Schema mismatch (overlap {overlap_ratio:.0%}) — "
                f"auto-inferring column roles"
            )
            self._inferred_roles, target_col = self._infer_column_roles(df, target_col if target_col in df.columns else None)
            self._target_col = target_col

        self.detect_columns(df)

        # ── Encode target ─────────────────────────────────────────────────
        target_series = df[self._target_col].astype(str)
        self.label_encoder.fit(sorted(target_series.unique()))
        y = self.label_encoder.transform(target_series)
        self.num_classes = len(self.label_encoder.classes_)
        logger.info(f"Target classes ({self.num_classes}): {list(self.label_encoder.classes_)}")

        # ── Build feature matrix ──────────────────────────────────────────
        feature_frames: List[pd.DataFrame] = []
        feature_name_parts: List[str] = []

        for col in df.columns:
            role = self._inferred_roles.get(col, "unknown")

            if role in ("drop", "target"):
                continue

            elif role == "numerical":
                vals = pd.to_numeric(df[col], errors="coerce").fillna(0).astype(float)
                feature_frames.append(vals.to_frame(col))
                feature_name_parts.append(col)

            elif role == "binary":
                mapped = df[col].map(GENDER_MAP).fillna(0).astype(float)
                feature_frames.append(mapped.to_frame(col))
                feature_name_parts.append(col)

            elif role == "binary_auto":
                # Auto-detected binary: map the two values to 0/1
                uniques = sorted(df[col].dropna().unique())
                bmap = {uniques[0]: 0}
                if len(uniques) > 1:
                    bmap[uniques[1]] = 1
                mapped = df[col].map(bmap).fillna(0).astype(float)
                feature_frames.append(mapped.to_frame(col))
                feature_name_parts.append(col)

            elif role == "ordinal":
                mapped = df[col].map(TEST_RESULTS_ORDER).fillna(1).astype(float)
                feature_frames.append(mapped.to_frame(col))
                feature_name_parts.append(col)

            elif role == "categorical":
                ohe = OneHotEncoder(sparse_output=False, handle_unknown="ignore")
                encoded = ohe.fit_transform(df[[col]].astype(str))
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
                admit_dt = pd.to_datetime(df.get("Date of Admission", ""), errors="coerce")
                discharge_dt = pd.to_datetime(df[col], errors="coerce")
                los = (discharge_dt - admit_dt).dt.days.fillna(0).astype(float)
                los_df = pd.DataFrame({"length_of_stay": los}, index=df.index)
                feature_frames.append(los_df)
                feature_name_parts.append("length_of_stay")

            elif role == "date_generic":
                dt = pd.to_datetime(df[col], errors="coerce")
                feat_df = pd.DataFrame({
                    f"{col}_month":     dt.dt.month.fillna(1).astype(float),
                    f"{col}_dayofweek": dt.dt.dayofweek.fillna(0).astype(float),
                    f"{col}_quarter":   dt.dt.quarter.fillna(1).astype(float),
                }, index=df.index)
                feature_frames.append(feat_df)
                names = [f"{col}_month", f"{col}_dayofweek", f"{col}_quarter"]
                feature_name_parts.extend(names)

            elif role == "text":
                # Use TF-IDF to convert text to a fixed-width feature vector
                tfidf = TfidfVectorizer(
                    max_features=50,
                    stop_words="english",
                    dtype=np.float32,
                )
                text_vals = df[col].fillna("").astype(str)
                encoded = tfidf.fit_transform(text_vals).toarray()
                tfidf_names = [f"{col}_tfidf_{i}" for i in range(encoded.shape[1])]
                enc_df = pd.DataFrame(encoded, columns=tfidf_names, index=df.index)
                feature_frames.append(enc_df)
                feature_name_parts.extend(tfidf_names)
                self.tfidf_encoders[col] = tfidf

            else:
                # Unknown column – skip with warning
                logger.warning(f"Unknown column '{col}' skipped during preprocessing")

        if not feature_frames:
            raise ValueError(
                "No usable feature columns found after preprocessing. "
                f"Columns: {list(df.columns)}, Roles: {self._inferred_roles}"
            )

        X_raw = pd.concat(feature_frames, axis=1).values.astype(np.float32)

        # Handle NaN / Inf
        X_raw = np.nan_to_num(X_raw, nan=0.0, posinf=0.0, neginf=0.0)

        # ── Scale features ────────────────────────────────────────────────
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
        target_col = self._target_col or "Medical Condition"
        y = self.label_encoder.transform(df[target_col].astype(str))

        feature_frames: List[pd.DataFrame] = []

        for col in df.columns:
            role = self._inferred_roles.get(col, COLUMN_ROLES.get(col, "unknown"))

            if role in ("drop", "target"):
                continue
            elif role == "numerical":
                vals = pd.to_numeric(df[col], errors="coerce").fillna(0).astype(float)
                feature_frames.append(vals.to_frame(col))
            elif role == "binary":
                mapped = df[col].map(GENDER_MAP).fillna(0).astype(float)
                feature_frames.append(mapped.to_frame(col))
            elif role == "binary_auto":
                uniques = sorted(df[col].dropna().unique())
                bmap = {uniques[0]: 0}
                if len(uniques) > 1:
                    bmap[uniques[1]] = 1
                mapped = df[col].map(bmap).fillna(0).astype(float)
                feature_frames.append(mapped.to_frame(col))
            elif role == "ordinal":
                mapped = df[col].map(TEST_RESULTS_ORDER).fillna(1).astype(float)
                feature_frames.append(mapped.to_frame(col))
            elif role == "categorical":
                ohe = self.one_hot_encoders[col]
                encoded = ohe.transform(df[[col]].astype(str))
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
            elif role == "date_generic":
                dt = pd.to_datetime(df[col], errors="coerce")
                feat_df = pd.DataFrame({
                    f"{col}_month":     dt.dt.month.fillna(1).astype(float),
                    f"{col}_dayofweek": dt.dt.dayofweek.fillna(0).astype(float),
                    f"{col}_quarter":   dt.dt.quarter.fillna(1).astype(float),
                }, index=df.index)
                feature_frames.append(feat_df)
            elif role == "text":
                tfidf = self.tfidf_encoders[col]
                text_vals = df[col].fillna("").astype(str)
                encoded = tfidf.transform(text_vals).toarray()
                tfidf_names = [f"{col}_tfidf_{i}" for i in range(encoded.shape[1])]
                enc_df = pd.DataFrame(encoded, columns=tfidf_names, index=df.index)
                feature_frames.append(enc_df)

        X_raw = pd.concat(feature_frames, axis=1).values.astype(np.float32)
        X_raw = np.nan_to_num(X_raw, nan=0.0, posinf=0.0, neginf=0.0)
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
            "target_column": self._target_col,
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
