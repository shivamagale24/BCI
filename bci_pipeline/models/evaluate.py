"""
Evaluation Script for NeuroCare BCI.

Loads saved model artifacts, reads test metrics, and prints structured evaluation results.
"""

import sys
import json
from pathlib import Path
from typing import Dict, Any, Optional

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))


def load_metrics(metrics_path: Optional[Path] = None) -> Dict[str, Any]:
    """Load evaluation metrics saved during training."""
    if metrics_path is None:
        metrics_path = Path(__file__).resolve().parent / "saved_models" / "metrics.json"

    if not metrics_path.exists():
        raise FileNotFoundError(f"Metrics file not found at {metrics_path}. Please run train.py first.")

    with open(metrics_path, "r", encoding="utf-8") as f:
        return json.load(f)


def print_evaluation_summary():
    """Print clean formatted evaluation report."""
    try:
        data = load_metrics()
    except FileNotFoundError as e:
        print(f"Error: {e}")
        return

    best = data["best_model"]
    models = data["all_models"]

    print("=" * 70)
    print("NEUROCARE BCI - MACHINE LEARNING EVALUATION REPORT")
    print("=" * 70)
    print(f"Best Classifier Selected: {best}\n")
    print(f"{'Model':<22} | {'Accuracy':<10} | {'Precision':<10} | {'Recall':<10} | {'F1-Score':<10}")
    print("-" * 70)

    for m_name, m_res in models.items():
        marker = " *" if m_name == best else "  "
        print(
            f"{m_name + marker:<22} | "
            f"{m_res['accuracy']:<10.4f} | "
            f"{m_res['precision']:<10.4f} | "
            f"{m_res['recall']:<10.4f} | "
            f"{m_res['f1_score']:<10.4f}"
        )

    print("-" * 70)
    print("* indicates selected production model artifact\n")

    if "detailed_test_report" in data:
        print("Per-Class Performance for Selected Model:")
        print(f"{'Class':<15} | {'Precision':<10} | {'Recall':<10} | {'F1-Score':<10} | {'Support':<10}")
        print("-" * 60)
        for cls_name, vals in data["detailed_test_report"].items():
            if isinstance(vals, dict) and "precision" in vals:
                print(
                    f"{cls_name:<15} | "
                    f"{vals['precision']:<10.4f} | "
                    f"{vals['recall']:<10.4f} | "
                    f"{vals['f1-score']:<10.4f} | "
                    f"{vals['support']:<10}"
                )
    print("=" * 70)


if __name__ == "__main__":
    from typing import Optional
    print_evaluation_summary()
