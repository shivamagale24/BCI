"""
Bed and ICU Management Endpoints for NeuroCare BCI.
"""

from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.bed import Bed
from app.models.patient import Patient
from app.schemas.bed import BedResponse, BedCreate, BedUpdate

router = APIRouter()


@router.get("", response_model=List[BedResponse])
def get_beds(
    ward: Optional[str] = None,
    status_filter: Optional[str] = None,
    is_icu: Optional[bool] = None,
    db: Session = Depends(get_db)
) -> Any:
    """List hospital beds with optional ward, status, and ICU filters."""
    query = db.query(Bed)
    if ward:
        query = query.filter(Bed.ward == ward)
    if status_filter:
        query = query.filter(Bed.status == status_filter)
    if is_icu is not None:
        query = query.filter(Bed.is_icu == is_icu)
    return query.all()


@router.post("", response_model=BedResponse, status_code=status.HTTP_201_CREATED)
def create_bed(bed_in: BedCreate, db: Session = Depends(get_db)) -> Any:
    """Register a new hospital bed."""
    existing = db.query(Bed).filter(Bed.bed_number == bed_in.bed_number).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Bed number already exists.")

    bed = Bed(**bed_in.model_dump())
    db.add(bed)
    db.commit()
    db.refresh(bed)
    return bed


@router.put("/{bed_id}/assign/{patient_id}", response_model=BedResponse)
def assign_bed(bed_id: int, patient_id: int, db: Session = Depends(get_db)) -> Any:
    """Assign a patient to a bed."""
    bed = db.query(Bed).filter(Bed.id == bed_id).first()
    if not bed:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bed not found")

    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")

    # Release any existing bed assigned to this patient
    existing_bed = db.query(Bed).filter(Bed.patient_id == patient_id).first()
    if existing_bed and existing_bed.id != bed.id:
        existing_bed.patient_id = None
        existing_bed.status = "available"

    bed.patient_id = patient_id
    bed.status = "occupied"
    if bed.is_icu:
        patient.status = "ICU"

    db.commit()
    db.refresh(bed)
    return bed


@router.put("/{bed_id}/release", response_model=BedResponse)
def release_bed(bed_id: int, db: Session = Depends(get_db)) -> Any:
    """Discharge/release a patient from a bed."""
    bed = db.query(Bed).filter(Bed.id == bed_id).first()
    if not bed:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bed not found")

    bed.patient_id = None
    bed.status = "available"
    db.commit()
    db.refresh(bed)
    return bed


@router.put("/{bed_id}", response_model=BedResponse)
def update_bed(bed_id: int, bed_in: BedUpdate, db: Session = Depends(get_db)) -> Any:
    """Update bed parameters (status, maintenance, ward)."""
    bed = db.query(Bed).filter(Bed.id == bed_id).first()
    if not bed:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bed not found")

    update_data = bed_in.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(bed, field, val)

    db.commit()
    db.refresh(bed)
    return bed
