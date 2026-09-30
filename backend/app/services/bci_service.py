"""
BCI Service for NeuroCare BCI.

Connects the ML Predictor, EEG Loader, and Database layers.
Translates predictions into hospital workflow actions and triggers clinical alerts.
"""

import json
from typing import Dict, Any, List, Optional
import numpy as np
from sqlalchemy.orm import Session

from bci_pipeline.predictor import BCIPredictor
from bci_pipeline.loader import EEGLoader, CLASS_LABELS
from app.models import BCIPrediction, Alert, Patient


class BCIService:
    """Singleton service wrapping EEG inference, simulation, and alert triggers."""

    _predictor: Optional[BCIPredictor] = None
    _loader: Optional[EEGLoader] = None
    _cached_samples: Optional[List[Dict[str, Any]]] = None

    @classmethod
    def get_predictor(cls) -> BCIPredictor:
        if cls._predictor is None:
            cls._predictor = BCIPredictor()
        return cls._predictor

    @classmethod
    def get_loader(cls) -> EEGLoader:
        if cls._loader is None:
            cls._loader = EEGLoader()
        return cls._loader

    @classmethod
    def list_simulation_samples(cls, max_samples: int = 20) -> List[Dict[str, Any]]:
        """
        List available real EEG samples from the Wairagkar dataset for interactive simulation.
        Provides a small downsampled signal preview for live frontend waveform rendering.
        """
        if cls._cached_samples is not None:
            return cls._cached_samples

        loader = cls.get_loader()
        available_participants = loader.list_available_participants()
        samples = []

        conditions = [
            (0, "right_hand", "Right Hand (Water/Care Request)"),
            (1, "rest", "Rest / Baseline (No Action)"),
            (2, "left_hand", "Left Hand (Urgent Nurse Call)")
        ]

        # Pick samples across participants and conditions
        count = 0
        for p_id in available_participants[:4]:  # First 4 participants
            for cond_idx, cond_code, label_desc in conditions:
                for trial_idx in [0, 5, 10]:
                    try:
                        sample = loader.get_sample_trial(p_id, cond_idx, trial_idx)
                        raw_eeg = sample["eeg"]  # (19, 6144)
                        
                        # Downsampled preview trace from channel C3 (index 8) or C4 (index 10)
                        c3_signal = raw_eeg[8, ::16].tolist()[:150]  # first 150 points for quick rendering
                        
                        samples.append({
                            "participant_id": p_id,
                            "trial_index": trial_idx,
                            "condition": cond_idx,
                            "label_name": cond_code,
                            "label_description": label_desc,
                            "channels": sample["channels"],
                            "sample_rate_hz": float(sample["fs"]),
                            "duration_seconds": 6.0,
                            "total_samples": raw_eeg.shape[1],
                            "preview_signal": c3_signal
                        })
                        count += 1
                        if count >= max_samples:
                            cls._cached_samples = samples
                            return samples
                    except Exception:
                        continue
        cls._cached_samples = samples
        return samples

    @classmethod
    def run_prediction(
        cls,
        db: Session,
        patient_id: int,
        raw_eeg: np.ndarray,
        is_simulation: bool = False,
        notes: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Run inference on EEG data, persist to database, and trigger alerts if appropriate.
        """
        # Verify patient exists
        patient = db.query(Patient).filter(Patient.id == patient_id).first()
        if not patient:
            raise ValueError(f"Patient with ID {patient_id} does not exist.")

        predictor = cls.get_predictor()
        pred_result = predictor.predict(raw_eeg)

        pred_label = pred_result["predicted_class"]
        confidence = pred_result["confidence"]
        intent = pred_result["intent"]
        probs = pred_result["probabilities"]
        model_name = pred_result["model_used"]

        # 1. Save BCIPrediction record
        bci_record = BCIPrediction(
            patient_id=patient_id,
            predicted_label=pred_label,
            confidence=confidence,
            intent_code=intent["intent_code"],
            clinical_action=intent["clinical_action"],
            priority=intent["priority"],
            probabilities_json=json.dumps(probs),
            is_simulation=is_simulation,
            model_name=model_name,
            notes=notes
        )
        db.add(bci_record)
        db.flush()  # Populates bci_record.id

        # 2. Rule-based Alert Triggering
        alert_triggered = False
        alert_id = None

        if intent["priority"] == "HIGH":
            # Left Hand = Urgent Nurse Call
            alert_msg = (
                f"[BCI Trigger] Urgent assistance requested by {patient.name} "
                f"({patient.patient_code}). Predicted: {intent['label']} "
                f"(Confidence: {confidence * 100:.1f}%)"
            )
            if is_simulation:
                alert_msg = f"[SIMULATION] {alert_msg}"

            alert = Alert(
                patient_id=patient_id,
                alert_type="BCI_URGENT_ASSISTANCE",
                severity="CRITICAL" if patient.status == "ICU" else "HIGH",
                status="ACTIVE",
                message=alert_msg,
                trigger_source="BCI_RULE_ENGINE"
            )
            db.add(alert)
            db.flush()
            alert_triggered = True
            alert_id = alert.id

        elif intent["priority"] == "MEDIUM":
            # Right Hand = Water / Routine Care
            alert_msg = (
                f"[BCI Care Request] Patient {patient.name} requested routine assistance / water. "
                f"Predicted: {intent['label']} (Confidence: {confidence * 100:.1f}%)"
            )
            if is_simulation:
                alert_msg = f"[SIMULATION] {alert_msg}"

            alert = Alert(
                patient_id=patient_id,
                alert_type="BCI_NURSE_CALL",
                severity="MEDIUM",
                status="ACTIVE",
                message=alert_msg,
                trigger_source="BCI_RULE_ENGINE"
            )
            db.add(alert)
            db.flush()
            alert_triggered = True
            alert_id = alert.id

        db.commit()
        db.refresh(bci_record)

        return {
            "id": bci_record.id,
            "patient_id": patient_id,
            "patient_name": patient.name,
            "predicted_label": pred_label,
            "confidence": confidence,
            "intent": intent,
            "probabilities": probs,
            "is_simulation": is_simulation,
            "model_name": model_name,
            "alert_triggered": alert_triggered,
            "alert_id": alert_id,
            "notes": notes,
            "created_at": bci_record.created_at
        }

    @classmethod
    def run_simulation(
        cls,
        db: Session,
        patient_id: int,
        participant_id: int = 1,
        condition: int = 0,
        trial_index: int = 0,
        notes: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Simulate real-time BCI using an actual EEG trial from Wairagkar dataset.
        """
        loader = cls.get_loader()
        sample = loader.get_sample_trial(participant_id, condition, trial_index)
        sim_note = f"Simulated using Dataset Participant {participant_id}, Trial {trial_index} ({sample['label_name']})"
        if notes:
            sim_note = f"{notes} | {sim_note}"

        return cls.run_prediction(
            db=db,
            patient_id=patient_id,
            raw_eeg=sample["eeg"],
            is_simulation=True,
            notes=sim_note
        )
