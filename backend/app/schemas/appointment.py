"""
Appointment Pydantic Schemas.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class AppointmentBase(BaseModel):
    patient_id: int
    doctor_id: Optional[int] = None
    appointment_date: datetime
    department: str = "Neurology"
    status: str = "scheduled"
    notes: Optional[str] = None


class AppointmentCreate(AppointmentBase):
    pass


class AppointmentUpdate(BaseModel):
    doctor_id: Optional[int] = None
    appointment_date: Optional[datetime] = None
    department: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class AppointmentResponse(AppointmentBase):
    id: int
    created_at: datetime
    updated_at: datetime
    patient_name: Optional[str] = None
    doctor_name: Optional[str] = None

    class Config:
        from_attributes = True
