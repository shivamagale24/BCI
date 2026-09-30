"""
Billing Endpoints for NeuroCare BCI.
"""

from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.billing import BillingRecord
from app.models.patient import Patient
from app.schemas.billing import BillingResponse, BillingCreate, BillingUpdate

router = APIRouter()


@router.get("", response_model=List[BillingResponse])
def get_billing_records(
    patient_id: Optional[int] = None,
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db)
) -> Any:
    """List billing records."""
    query = db.query(BillingRecord)
    if patient_id:
        query = query.filter(BillingRecord.patient_id == patient_id)
    if status_filter:
        query = query.filter(BillingRecord.status == status_filter)

    records = query.order_by(BillingRecord.created_at.desc()).all()
    res = []
    for b in records:
        res.append({
            "id": b.id,
            "patient_id": b.patient_id,
            "invoice_number": b.invoice_number,
            "service_description": b.service_description,
            "amount": b.amount,
            "status": b.status,
            "created_at": b.created_at,
            "updated_at": b.updated_at,
            "patient_name": b.patient.name if b.patient else None
        })
    return res


@router.post("", response_model=BillingResponse, status_code=status.HTTP_201_CREATED)
def create_billing_record(bill_in: BillingCreate, db: Session = Depends(get_db)) -> Any:
    """Create a new billing invoice."""
    patient = db.query(Patient).filter(Patient.id == bill_in.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    record = BillingRecord(**bill_in.model_dump())
    db.add(record)
    db.commit()
    db.refresh(record)
    return {
        **record.__dict__,
        "patient_name": patient.name
    }


@router.put("/{record_id}", response_model=BillingResponse)
def update_billing_record(record_id: int, bill_in: BillingUpdate, db: Session = Depends(get_db)) -> Any:
    """Update billing status or details."""
    record = db.query(BillingRecord).filter(BillingRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Billing record not found")

    for field, val in bill_in.model_dump(exclude_unset=True).items():
        setattr(record, field, val)

    db.commit()
    db.refresh(record)
    return {
        **record.__dict__,
        "patient_name": record.patient.name if record.patient else None
    }
