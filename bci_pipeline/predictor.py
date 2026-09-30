"""
BCI Predictor Interface for NeuroCare BCI.

Loads serialized model artifact, executes preprocessing and feature extraction,
and returns structured predictions with clinical intent translations and real probabilities.
"""

import sys
from pathlib import Path
from typing import Dict, Any, Optional, Union, List
import numpy as np
import joblib

PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from bci_pipeline.preprocessing import EEGPreprocessor
from bci_pipeline.features import EEGFeatureExtractor
from bci_pipeline.loader import CLASS_LABELS, CHANNEL_NAMES


# Hospital assistance intent mapping for prototype demonstration
INTENT_MAPPING = {
    "right_hand": {
        "intent_code": "ASSISTANCE_WATER_CARE",
        "label": "Right Hand Movement / Imagery",
        "clinical_action": "Patient requests Water / General Nursing Care",
        "priority": "MEDIUM"
    },
    "rest": {
        "intent_code": "BASELINE_IDLE",
        "label": "Rest / Baseline State",
        "clinical_action": "No assistance requested (Resting)",
        "priority": "LOW"
    },
    "left_hand": {
        "intent_code": "URGENT_NURSE_CALL",
        "label": "Left Hand Movement / Imagery",
        "clinical_action": "Urgent Nurse Call / Immediate Assistance",
        "priority": "HIGH"
    }
}


class BCIPredictor:
    """
    Inference Engine for EEG Motor Execution/Imagery.
    """

    def __init__(self, model_path: Optional[Union[str, Path]] = None):
        if model_path is None:
            model_path = Path(__file__).resolve().parent / "models" / "saved_models" / "bci_classifier.joblib"

        self.model_path = Path(model_path)
        if not self.model_path.exists():
            raise FileNotFoundError(
                f"Trained model not found at {self.model_path}. "
                "Please run `python -m bci_pipeline.models.train` to train the model first."
            )

        # Load bundle
        bundle = joblib.load(self.model_path)
        self.model = bundle["model"]
        self.model_name = bundle.get("model_name", "Classifier")
        self.scaler = bundle["scaler"]
        self.class_labels = bundle.get("class_labels", CLASS_LABELS)
        self.feature_names = bundle.get("feature_names", [])

        # Initialize preprocessor with matching config
        prep_cfg = bundle.get("preprocessor_config", {})
        self.preprocessor = EEGPreprocessor(
            orig_fs=prep_cfg.get("orig_fs", 1024.0),
            target_fs=prep_cfg.get("target_fs", 128.0),
            lowcut=prep_cfg.get("lowcut", 8.0),
            highcut=prep_cfg.get("highcut", 30.0),
            notch_freq=prep_cfg.get("notch_freq", 50.0),
            window_seconds=prep_cfg.get("window_seconds", (0.5, 3.0)),
            baseline_seconds=prep_cfg.get("baseline_seconds", (-2.5, -0.5)),
            time_offset=prep_cfg.get("time_offset", -3.0)
        )
        self.extractor = EEGFeatureExtractor(
            fs=self.preprocessor.target_fs,
            channel_names=CHANNEL_NAMES
        )

    def predict(self, raw_eeg: np.ndarray) -> Dict[str, Any]:
        """
        Execute full inference on raw EEG trial.

        Parameters
        ----------
        raw_eeg : np.ndarray
            Array of shape (19, n_samples) where n_samples is typically 6144 (6.0s at 1024 Hz).
            Or minimum required duration to slice window (at least ~3.5s at 1024 Hz).

        Returns
        -------
        dict containing:
            - 'class_id': int (0, 1, or 2)
            - 'predicted_class': str ('right_hand', 'rest', 'left_hand')
            - 'confidence': float (highest class probability)
            - 'probabilities': dict mapping class names to float probabilities
            - 'intent': dict of hospital action mappings
            - 'model_used': str
        """
        # 1. Validation
        if not isinstance(raw_eeg, np.ndarray):
            raw_eeg = np.array(raw_eeg, dtype=np.float32)

        if raw_eeg.ndim != 2:
            raise ValueError(f"Expected 2D EEG array (n_channels, n_times), got shape {raw_eeg.shape}")

        if raw_eeg.shape[0] != 19:
            raise ValueError(f"Expected 19 channels, got {raw_eeg.shape[0]}")

        if raw_eeg.shape[1] < 1024:
            raise ValueError(
                f"EEG trial too short: {raw_eeg.shape[1]} samples. Expected at least 1024 samples."
            )

        # 2. Preprocess
        preprocessed = self.preprocessor.preprocess_trial(raw_eeg)

        # 3. Extract features
        features = self.extractor.extract_trial(preprocessed).reshape(1, -1)

        # 4. Scale features
        features_scaled = self.scaler.transform(features)

        # 5. Predict class
        class_id = int(self.model.predict(features_scaled)[0])
        predicted_class = self.class_labels.get(class_id, f"class_{class_id}")

        # 6. Probabilities (if supported by model)
        probabilities = {}
        confidence = 1.0
        if hasattr(self.model, "predict_proba"):
            probs = self.model.predict_proba(features_scaled)[0]
            for i, p in enumerate(probs):
                c_name = self.class_labels.get(i, f"class_{i}")
                probabilities[c_name] = round(float(p), 4)
            confidence = probabilities.get(predicted_class, 1.0)
        elif hasattr(self.model, "decision_function"):
            df = self.model.decision_function(features_scaled)[0]
            # Softmax transformation of decision function
            exp_df = np.exp(df - np.max(df))
            softmax_probs = exp_df / np.sum(exp_df)
            for i, p in enumerate(softmax_probs):
                c_name = self.class_labels.get(i, f"class_{i}")
                probabilities[c_name] = round(float(p), 4)
            confidence = probabilities.get(predicted_class, 1.0)

        # 7. Clinical hospital intent
        intent = INTENT_MAPPING.get(predicted_class, {
            "intent_code": "UNKNOWN",
            "label": predicted_class,
            "clinical_action": "Standard observation",
            "priority": "LOW"
        })

        return {
            "class_id": class_id,
            "predicted_class": predicted_class,
            "confidence": float(confidence),
            "probabilities": probabilities,
            "intent": intent,
            "model_used": self.model_name
        }
