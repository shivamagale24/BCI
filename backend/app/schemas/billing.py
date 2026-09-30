"""
Billing Pydantic Schemas.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class BillingBase(BaseModel):
    patient_id: int
    invoice_number: str
    service_description: str
    amount: float
    status: str = "pending"  # pending, paid, cancelled


class BillingCreate(BillingBase):
    pass


class BillingUpdate(BaseModel):
    service_description: Optional[str] = None
    amount: Optional[float] = None
    status: Optional[str] = None


class BillingResponse(BillingBase):
    id: int
    created_at: datetime
    updated_at: datetime
    patient_name: Optional[str] = None

    class Config:
        from_attributes = True
