"""
Patient Pydantic Schemas.
"""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel


class PatientBase(BaseModel):
    patient_code: str
    name: str
    age: int
    gender: str
    contact: Optional[str] = None
    blood_group: Optional[str] = None
    diagnosis: Optional[str] = None
    medical_history: Optional[str] = None
    status: str = "Admitted"


class PatientCreate(PatientBase):
    pass


class PatientUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    contact: Optional[str] = None
    blood_group: Optional[str] = None
    diagnosis: Optional[str] = None
    medical_history: Optional[str] = None
    status: Optional[str] = None


class BedBrief(BaseModel):
    id: int
    bed_number: str
    ward: str
    is_icu: bool
    status: str

    class Config:
        from_attributes = True


class PatientResponse(PatientBase):
    id: int
    created_at: datetime
    updated_at: datetime
    bed: Optional[BedBrief] = None

    class Config:
        from_attributes = True
