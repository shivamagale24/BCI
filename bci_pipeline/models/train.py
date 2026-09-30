"""
Model Training Pipeline for NeuroCare BCI.

Trains scikit-learn classifiers on real EEG data from the Wairagkar et al. (2018) dataset.
Includes:
- EEG Loading
- Preprocessing (Notch, Bandpass, Windowing, Downsampling)
- Feature Extraction (PSD, Bandpower, Asymmetry, Hjorth)
- Subject-aware Train/Test Split (evaluates cross-subject generalization)
- Model comparison: SVM (RBF / Linear), Logistic Regression, Random Forest
- Metric calculation: Accuracy, Precision, Recall, F1-Score, Confusion Matrix
- Model artifact serialization with joblib
"""

import os
import sys
import json
import time
from pathlib import Path
from typing import Dict, Any, Tuple, Optional

# Ensure project root is in sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import numpy as np
import joblib
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVC
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    classification_report
)
from sklearn.model_selection import StratifiedKFold, cross_validate

from bci_pipeline.loader import EEGLoader, CLASS_LABELS
from bci_pipeline.preprocessing import EEGPreprocessor
from bci_pipeline.features import EEGFeatureExtractor


def extract_dataset_features(
    loader: EEGLoader,
    preprocessor: EEGPreprocessor,
    extractor: EEGFeatureExtractor,
    max_participants: int = 14
) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
    """
    Load raw EEG, preprocess, and extract features across participants.
    """
    print(f"Loading raw EEG data for participants (up to {max_participants})...", flush=True)
    X_raw, y, subjects = loader.load_all(max_participants=max_participants)
    print(f"Loaded {len(y)} trials from {len(np.unique(subjects))} participants.", flush=True)
    print(f"Raw trial shape: {X_raw.shape}", flush=True)

    print("Preprocessing trials and extracting features...", flush=True)
    n_trials = len(X_raw)
    features_list = []
    
    t0 = time.time()
    for i in range(n_trials):
        if (i + 1) % 200 == 0 or (i + 1) == n_trials:
            elapsed = time.time() - t0
            print(f"  Processed {i + 1}/{n_trials} trials ({elapsed:.1f}s)...", flush=True)
        proc = preprocessor.preprocess_trial(X_raw[i])
        feat = extractor.extract_trial(proc)
        features_list.append(feat)

    X_features = np.stack(features_list, axis=0)
    print(f"Feature matrix shape: {X_features.shape}", flush=True)
    return X_features, y, subjects


def train_and_evaluate(
    max_participants: int = 14,
    test_subject_ratio: float = 0.2,
    save_dir: Optional[Path] = None
) -> Dict[str, Any]:
    """
    Full training and evaluation pipeline.
    """
    if save_dir is None:
        save_dir = Path(__file__).resolve().parent / "saved_models"
    save_dir.mkdir(parents=True, exist_ok=True)

    loader = EEGLoader()
    preprocessor = EEGPreprocessor()
    extractor = EEGFeatureExtractor()

    # 1. Feature extraction
    X, y, subjects = extract_dataset_features(loader, preprocessor, extractor, max_participants)

    # 2. Subject-aware Train/Test split:
    all_subjects = np.unique(subjects)
    n_test_subs = max(1, int(round(len(all_subjects) * test_subject_ratio)))
    test_subs = all_subjects[-n_test_subs:]
    train_subs = all_subjects[:-n_test_subs]

    train_mask = np.isin(subjects, train_subs)
    test_mask = np.isin(subjects, test_subs)

    X_train, y_train = X[train_mask], y[train_mask]
    X_test, y_test = X[test_mask], y[test_mask]

    print(f"\nTraining set: {len(y_train)} trials from subjects {list(train_subs)}", flush=True)
    print(f"Test set:     {len(y_test)} trials from subjects {list(test_subs)}", flush=True)

    # 3. Standardize features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # 4. Model candidates
    models = {
        "SVM_RBF": SVC(kernel="rbf", C=1.0, gamma="scale", probability=True, random_state=42),
        "SVM_Linear": SVC(kernel="linear", C=1.0, probability=True, random_state=42),
        "Logistic_Regression": LogisticRegression(max_iter=1000, C=1.0, random_state=42),
        "Random_Forest": RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42)
    }

    results = {}
    best_model_name = None
    best_f1 = -1.0
    best_model = None

    print("\nEvaluating Model Candidates:", flush=True)
    print("-" * 65, flush=True)

    for name, clf in models.items():
        clf.fit(X_train_scaled, y_train)
        y_pred = clf.predict(X_test_scaled)
        
        acc = float(accuracy_score(y_test, y_pred))
        prec = float(precision_score(y_test, y_pred, average="weighted", zero_division=0))
        rec = float(recall_score(y_test, y_pred, average="weighted", zero_division=0))
        f1 = float(f1_score(y_test, y_pred, average="weighted", zero_division=0))
        cm = confusion_matrix(y_test, y_pred).tolist()

        results[name] = {
            "accuracy": round(acc, 4),
            "precision": round(prec, 4),
            "recall": round(rec, 4),
            "f1_score": round(f1, 4),
            "confusion_matrix": cm
        }

        print(f"{name:<20} | Acc: {acc:.4f} | Prec: {prec:.4f} | Rec: {rec:.4f} | F1: {f1:.4f}", flush=True)

        if f1 > best_f1:
            best_f1 = f1
            best_model_name = name
            best_model = clf

    print("-" * 65)
    print(f"Selected Best Model: {best_model_name} (F1: {best_f1:.4f})")

    # Full report on best model
    best_pred = best_model.predict(X_test_scaled)
    target_names = [CLASS_LABELS[i] for i in range(len(CLASS_LABELS))]
    report_dict = classification_report(
        y_test, best_pred, target_names=target_names, output_dict=True, zero_division=0
    )

    # 5. Save model bundle
    artifact = {
        "model": best_model,
        "model_name": best_model_name,
        "scaler": scaler,
        "feature_names": extractor.feature_names,
        "class_labels": CLASS_LABELS,
        "preprocessor_config": preprocessor.get_config(),
        "train_subjects": [int(s) for s in train_subs],
        "test_subjects": [int(s) for s in test_subs],
        "train_trials": int(len(y_train)),
        "test_trials": int(len(y_test)),
        "trained_at": time.strftime("%Y-%m-%d %H:%M:%S")
    }

    model_path = save_dir / "bci_classifier.joblib"
    joblib.dump(artifact, model_path)
    print(f"\nTrained model bundle saved to: {model_path}")

    # Save metrics JSON for reporting and auditability
    metrics_path = save_dir / "metrics.json"
    metrics_data = {
        "best_model": best_model_name,
        "all_models": results,
        "detailed_test_report": report_dict,
        "train_subjects": [int(s) for s in train_subs],
        "test_subjects": [int(s) for s in test_subs],
        "dataset_summary": {
            "total_participants": len(all_subjects),
            "total_trials": len(y),
            "class_distribution": {CLASS_LABELS[int(k)]: int(v) for k, v in zip(*np.unique(y, return_counts=True))}
        }
    }

    with open(metrics_path, "w", encoding="utf-8") as f:
        json.dump(metrics_data, f, indent=2)
    print(f"Evaluation metrics saved to: {metrics_path}")

    return metrics_data


if __name__ == "__main__":
    train_and_evaluate(max_participants=14)
