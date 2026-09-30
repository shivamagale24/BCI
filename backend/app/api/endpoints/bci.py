"""
BCI Inference and Simulation Endpoints for NeuroCare BCI.
"""

from typing import Any, List, Optional
import json
import numpy as np
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.bci_prediction import BCIPrediction
from app.models.patient import Patient
from app.schemas.bci import (
    BCIPredictRequest,
    BCISimulateRequest,
    BCIPredictionResponse,
    EEGSampleMetadata
)
from app.services.bci_service import BCIService

router = APIRouter()


@router.get("/samples", response_model=List[EEGSampleMetadata])
def get_simulation_samples() -> Any:
    """
    Retrieve real EEG trial samples from Wairagkar dataset.
    Includes downsampled waveform previews for frontend visualization.
    """
    try:
        return BCIService.list_simulation_samples()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load EEG samples: {str(e)}")


@router.post("/simulate", response_model=BCIPredictionResponse)
def simulate_prediction(
    sim_in: BCISimulateRequest,
    db: Session = Depends(get_db)
) -> Any:
    """
    Simulate BCI prediction using a real EEG sample from the Wairagkar dataset.
    Clearly marked as simulation for auditability.
    """
    try:
        result = BCIService.run_simulation(
            db=db,
            patient_id=sim_in.patient_id,
            participant_id=sim_in.participant_id,
            condition=sim_in.condition,
            trial_index=sim_in.trial_index,
            notes=sim_in.notes
        )
        return result
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")


@router.post("/predict", response_model=BCIPredictionResponse)
def predict_eeg(
    req: BCIPredictRequest,
    db: Session = Depends(get_db)
) -> Any:
    """
    Execute BCI inference on provided EEG data (19 channels x N samples).
    """
    if req.eeg_data is None:
        raise HTTPException(
            status_code=400,
            detail="No EEG data provided. Use /simulate to run with dataset samples or upload EEG matrix."
        )

    try:
        arr = np.array(req.eeg_data, dtype=np.float32)
        result = BCIService.run_prediction(
            db=db,
            patient_id=req.patient_id,
            raw_eeg=arr,
            is_simulation=req.is_simulation,
            notes=req.notes
        )
        return result
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference failed: {str(e)}")


@router.get("/history/{patient_id}")
def get_patient_bci_history(
    patient_id: int,
    limit: int = 50,
    db: Session = Depends(get_db)
) -> Any:
    """Retrieve BCI prediction audit history for a specific patient."""
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    records = (
        db.query(BCIPrediction)
        .filter(BCIPrediction.patient_id == patient_id)
        .order_by(BCIPrediction.created_at.desc())
        .limit(limit)
        .all()
    )

    formatted = []
    for r in records:
        probs = {}
        if r.probabilities_json:
            try:
                probs = json.loads(r.probabilities_json)
            except Exception:
                pass
        formatted.append({
            "id": r.id,
            "patient_id": r.patient_id,
            "patient_name": patient.name,
            "predicted_label": r.predicted_label,
            "confidence": r.confidence,
            "intent": {
                "intent_code": r.intent_code,
                "label": r.predicted_label,
                "clinical_action": r.clinical_action,
                "priority": r.priority
            },
            "probabilities": probs,
            "is_simulation": r.is_simulation,
            "model_name": r.model_name,
            "notes": r.notes,
            "created_at": r.created_at
        })
    return formatted


@router.get("/all")
def get_all_bci_predictions(limit: int = 100, db: Session = Depends(get_db)) -> Any:
    """Retrieve all recent BCI predictions across all hospital patients."""
    records = (
        db.query(BCIPrediction)
        .order_by(BCIPrediction.created_at.desc())
        .limit(limit)
        .all()
    )
    formatted = []
    for r in records:
        patient_name = r.patient.name if r.patient else f"Patient #{r.patient_id}"
        formatted.append({
            "id": r.id,
            "patient_id": r.patient_id,
            "patient_name": patient_name,
            "predicted_label": r.predicted_label,
            "confidence": r.confidence,
            "clinical_action": r.clinical_action,
            "priority": r.priority,
            "is_simulation": r.is_simulation,
            "model_name": r.model_name,
            "created_at": r.created_at
        })
    return formatted
