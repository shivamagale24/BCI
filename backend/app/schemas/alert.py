"""
Alert Pydantic Schemas.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class AlertBase(BaseModel):
    patient_id: int
    alert_type: str
    severity: str = "MEDIUM"  # LOW, MEDIUM, HIGH, CRITICAL
    status: str = "ACTIVE"    # ACTIVE, ACKNOWLEDGED, RESOLVED
    message: str
    trigger_source: str = "BCI_RULE_ENGINE"


class AlertCreate(AlertBase):
    pass


class AlertUpdate(BaseModel):
    status: Optional[str] = None
    acknowledged_by: Optional[str] = None


class AlertResponse(AlertBase):
    id: int
    acknowledged_by: Optional[str] = None
    created_at: datetime
    acknowledged_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    patient_name: Optional[str] = None
    patient_code: Optional[str] = None

    class Config:
        from_attributes = True
