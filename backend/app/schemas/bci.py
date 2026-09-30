"""
BCI Pydantic Schemas for NeuroCare BCI.
"""

from datetime import datetime
from typing import Optional, Dict, List, Any
from pydantic import BaseModel


class IntentDetails(BaseModel):
    intent_code: str
    label: str
    clinical_action: str
    priority: str


class BCIPredictRequest(BaseModel):
    patient_id: int
    eeg_data: Optional[List[List[float]]] = None  # Shape (19, N)
    is_simulation: bool = False
    notes: Optional[str] = None


class BCISimulateRequest(BaseModel):
    patient_id: int
    participant_id: int = 1
    condition: int = 0  # 0: right_hand, 1: rest, 2: left_hand
    trial_index: int = 0
    notes: Optional[str] = None


class BCIPredictionResponse(BaseModel):
    id: Optional[int] = None
    patient_id: int
    patient_name: Optional[str] = None
    predicted_label: str
    confidence: float
    intent: IntentDetails
    probabilities: Dict[str, float]
    is_simulation: bool
    model_name: str
    alert_triggered: bool = False
    alert_id: Optional[int] = None
    notes: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class EEGSampleMetadata(BaseModel):
    participant_id: int
    trial_index: int
    condition: int
    label_name: str
    channels: List[str]
    sample_rate_hz: float
    duration_seconds: float
    total_samples: int
    preview_signal: List[float]  # Sample trace from C3/C4 for visual waveform preview
