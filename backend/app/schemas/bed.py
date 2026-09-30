"""
Bed Pydantic Schemas.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class BedBase(BaseModel):
    bed_number: str
    ward: str
    is_icu: bool = False
    status: str = "available"  # available, occupied, maintenance


class BedCreate(BedBase):
    pass


class BedUpdate(BaseModel):
    ward: Optional[str] = None
    is_icu: Optional[bool] = None
    status: Optional[str] = None
    patient_id: Optional[int] = None


class BedPatientBrief(BaseModel):
    id: int
    patient_code: str
    name: str
    age: int
    gender: str
    diagnosis: Optional[str] = None

    class Config:
        from_attributes = True


class BedResponse(BedBase):
    id: int
    patient_id: Optional[int] = None
    updated_at: datetime
    patient: Optional[BedPatientBrief] = None

    class Config:
        from_attributes = True
