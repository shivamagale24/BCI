"""
Pydantic Schemas for NeuroCare BCI.
"""

from .auth import Token, TokenPayload, LoginRequest
from .user import UserBase, UserCreate, UserUpdate, UserResponse
from .patient import PatientBase, PatientCreate, PatientUpdate, PatientResponse
from .bed import BedBase, BedCreate, BedUpdate, BedResponse
from .appointment import AppointmentBase, AppointmentCreate, AppointmentUpdate, AppointmentResponse
from .alert import AlertBase, AlertCreate, AlertUpdate, AlertResponse
from .billing import BillingBase, BillingCreate, BillingUpdate, BillingResponse
from .bci import (
    BCIPredictRequest,
    BCISimulateRequest,
    BCIPredictionResponse,
    EEGSampleMetadata,
    IntentDetails
)

__all__ = [
    "Token",
    "TokenPayload",
    "LoginRequest",
    "UserBase",
    "UserCreate",
    "UserUpdate",
    "UserResponse",
    "PatientBase",
    "PatientCreate",
    "PatientUpdate",
    "PatientResponse",
    "BedBase",
    "BedCreate",
    "BedUpdate",
    "BedResponse",
    "AppointmentBase",
    "AppointmentCreate",
    "AppointmentUpdate",
    "AppointmentResponse",
    "AlertBase",
    "AlertCreate",
    "AlertUpdate",
    "AlertResponse",
    "BillingBase",
    "BillingCreate",
    "BillingUpdate",
    "BillingResponse",
    "BCIPredictRequest",
    "BCISimulateRequest",
    "BCIPredictionResponse",
    "EEGSampleMetadata",
    "IntentDetails"
]
