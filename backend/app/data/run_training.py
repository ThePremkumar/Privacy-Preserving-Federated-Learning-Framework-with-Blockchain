"""
Healthcare CSV Training Script
==============================
Standalone script to run the FULL training pipeline on the healthcare dataset.
Detects all 15 CSV columns, preprocesses, trains, and evaluates.

Usage:
    cd backend
    python -m app.data.run_training
"""

import sys
import os
import logging
import json

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(name)-24s  %(levelname)-7s  %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("RunTraining")

# Ensure app is importable
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.data.healthcare_trainer import train_healthcare_csv


def main():
    csv_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
        "data",
        "healthcare_dataset.csv",
    )

    if not os.path.exists(csv_path):
        logger.error(f"CSV file not found: {csv_path}")
        sys.exit(1)

    logger.info("=" * 70)
    logger.info("  Healthcare CSV Full Training Pipeline")
    logger.info("=" * 70)

    result = train_healthcare_csv(
        csv_path=csv_path,
        epochs=30,
        batch_size=64,
        learning_rate=0.001,
        patience=7,
        save_dir=os.path.join(os.path.dirname(csv_path), "trained_models"),
    )

    # ── Print summary ──────────────────────────────────────────────────────
    print("\n" + "=" * 70)
    print("  TRAINING RESULTS SUMMARY")
    print("=" * 70)

    ds = result["dataset"]
    print(f"\n📊 Dataset:")
    print(f"   Samples:  {ds['total_samples']:,}")
    print(f"   Columns:  {ds['total_columns']}")
    print(f"   Features: {ds['num_features']} (after encoding)")
    print(f"   Classes:  {ds['num_classes']} → {ds['class_names']}")

    print(f"\n📐 Features Used ({len(ds['feature_names'])}):")
    for i, f in enumerate(ds["feature_names"], 1):
        print(f"   {i:2d}. {f}")

    col_det = result["column_detection"]
    print(f"\n🔍 Column Detection ({len(col_det['columns'])} columns):")
    for col_name, info in col_det["columns"].items():
        print(f"   • {col_name:25s} → {info['role']:15s} (dtype={info['dtype']}, unique={info['unique']})")

    mdl = result["model"]
    print(f"\n🧠 Model: {mdl['architecture']}")
    print(f"   Hidden dims: {mdl['hidden_dims']}")
    print(f"   Parameters:  {mdl['parameter_count']:,}")
    print(f"   Dropout:     {mdl['dropout']}")

    trn = result["training"]
    print(f"\n📈 Training:")
    print(f"   Epochs run:       {trn['epochs_completed']}")
    print(f"   Batch size:       {trn['batch_size']}")
    print(f"   Learning rate:    {trn['learning_rate']}")
    print(f"   Best val acc:     {trn['best_val_accuracy']:.2f}%")

    test = result["test_results"]
    print(f"\n🎯 Test Results:")
    print(f"   Accuracy:    {test['test_accuracy']:.2f}%")
    print(f"   Loss:        {test['test_loss']:.4f}")
    print(f"   Weighted F1: {test['weighted_f1']:.4f}")
    print(f"   Samples:     {test['num_test_samples']:,}")

    if "classification_report" in test:
        report = test["classification_report"]
        print(f"\n📋 Per-Class Metrics:")
        print(f"   {'Class':15s} {'Precision':>10s} {'Recall':>10s} {'F1-Score':>10s} {'Support':>10s}")
        print(f"   {'─'*55}")
        for cls in ds["class_names"]:
            if cls in report:
                r = report[cls]
                print(f"   {cls:15s} {r['precision']:10.3f} {r['recall']:10.3f} {r['f1-score']:10.3f} {r['support']:10.0f}")

    if "confusion_matrix" in test:
        print(f"\n📊 Confusion Matrix:")
        cm = test["confusion_matrix"]
        # Header
        header = "   " + " " * 15 + " ".join(f"{c[:6]:>6s}" for c in ds["class_names"])
        print(header)
        for i, row in enumerate(cm):
            row_str = " ".join(f"{v:6d}" for v in row)
            print(f"   {ds['class_names'][i]:15s} {row_str}")

    print(f"\n🔐 Model Weights Hash: {result['weights_hash'][:16]}...")
    if result.get("model_path"):
        print(f"💾 Model saved: {result['model_path']}")

    print("\n" + "=" * 70)
    print("  ✅ Training Pipeline Complete!")
    print("=" * 70 + "\n")

    # Save full result as JSON
    result_path = os.path.join(
        os.path.dirname(csv_path), "trained_models", "training_result.json"
    )
    # Make weights_hash serializable (already is), but remove large nested arrays
    save_result = {k: v for k, v in result.items()}
    with open(result_path, "w") as f:
        json.dump(save_result, f, indent=2, default=str)
    logger.info(f"Full results saved to {result_path}")


if __name__ == "__main__":
    main()
