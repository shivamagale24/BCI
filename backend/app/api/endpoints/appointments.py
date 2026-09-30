"""
Appointment Endpoints for NeuroCare BCI.
"""

from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.appointment import Appointment
from app.models.patient import Patient
from app.models.user import User
from app.schemas.appointment import AppointmentResponse, AppointmentCreate, AppointmentUpdate

router = APIRouter()


@router.get("", response_model=List[AppointmentResponse])
def get_appointments(
    patient_id: Optional[int] = None,
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db)
) -> Any:
    """List appointments."""
    query = db.query(Appointment)
    if patient_id:
        query = query.filter(Appointment.patient_id == patient_id)
    if status_filter:
        query = query.filter(Appointment.status == status_filter)

    records = query.order_by(Appointment.appointment_date.asc()).all()
    res = []
    for a in records:
        res.append({
            "id": a.id,
            "patient_id": a.patient_id,
            "doctor_id": a.doctor_id,
            "appointment_date": a.appointment_date,
            "department": a.department,
            "status": a.status,
            "notes": a.notes,
            "created_at": a.created_at,
            "updated_at": a.updated_at,
            "patient_name": a.patient.name if a.patient else None,
            "doctor_name": a.doctor.full_name if a.doctor else None
        })
    return res


@router.post("", response_model=AppointmentResponse, status_code=status.HTTP_201_CREATED)
def create_appointment(app_in: AppointmentCreate, db: Session = Depends(get_db)) -> Any:
    """Schedule a new appointment."""
    patient = db.query(Patient).filter(Patient.id == app_in.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    appointment = Appointment(**app_in.model_dump())
    db.add(appointment)
    db.commit()
    db.refresh(appointment)
    return {
        **appointment.__dict__,
        "patient_name": patient.name,
        "doctor_name": appointment.doctor.full_name if appointment.doctor else None
    }


@router.put("/{app_id}", response_model=AppointmentResponse)
def update_appointment(app_id: int, app_in: AppointmentUpdate, db: Session = Depends(get_db)) -> Any:
    """Update appointment details or status."""
    appointment = db.query(Appointment).filter(Appointment.id == app_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    for field, val in app_in.model_dump(exclude_unset=True).items():
        setattr(appointment, field, val)

    db.commit()
    db.refresh(appointment)
    return {
        **appointment.__dict__,
        "patient_name": appointment.patient.name if appointment.patient else None,
        "doctor_name": appointment.doctor.full_name if appointment.doctor else None
    }
