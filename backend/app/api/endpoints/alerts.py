"""
Alerts Management Endpoints for NeuroCare BCI.
"""

from typing import Any, List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.alert import Alert
from app.models.patient import Patient
from app.schemas.alert import AlertResponse, AlertCreate, AlertUpdate
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter()


@router.get("", response_model=List[AlertResponse])
def get_alerts(
    status_filter: Optional[str] = None,
    severity: Optional[str] = None,
    patient_id: Optional[int] = None,
    limit: int = 50,
    db: Session = Depends(get_db)
) -> Any:
    """List clinical alerts with status and severity filters."""
    query = db.query(Alert)
    if status_filter:
        query = query.filter(Alert.status == status_filter)
    if severity:
        query = query.filter(Alert.severity == severity)
    if patient_id:
        query = query.filter(Alert.patient_id == patient_id)

    alerts = query.order_by(Alert.created_at.desc()).limit(limit).all()
    res = []
    for a in alerts:
        res.append({
            "id": a.id,
            "patient_id": a.patient_id,
            "patient_name": a.patient.name if a.patient else None,
            "patient_code": a.patient.patient_code if a.patient else None,
            "alert_type": a.alert_type,
            "severity": a.severity,
            "status": a.status,
            "message": a.message,
            "trigger_source": a.trigger_source,
            "acknowledged_by": a.acknowledged_by,
            "created_at": a.created_at,
            "acknowledged_at": a.acknowledged_at,
            "resolved_at": a.resolved_at
        })
    return res


@router.post("", response_model=AlertResponse, status_code=status.HTTP_201_CREATED)
def create_manual_alert(alert_in: AlertCreate, db: Session = Depends(get_db)) -> Any:
    """Manually raise an alert for a patient."""
    patient = db.query(Patient).filter(Patient.id == alert_in.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    alert = Alert(**alert_in.model_dump())
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return {
        **alert.__dict__,
        "patient_name": patient.name,
        "patient_code": patient.patient_code
    }


@router.put("/{alert_id}/acknowledge")
def acknowledge_alert(
    alert_id: int,
    staff_name: Optional[str] = "Nursing Staff",
    db: Session = Depends(get_db)
) -> Any:
    """Acknowledge an active alert."""
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.status = "ACKNOWLEDGED"
    alert.acknowledged_by = staff_name
    alert.acknowledged_at = datetime.now()
    db.commit()
    db.refresh(alert)
    return {"message": "Alert acknowledged", "alert_id": alert.id, "status": alert.status}


@router.put("/{alert_id}/resolve")
def resolve_alert(alert_id: int, db: Session = Depends(get_db)) -> Any:
    """Resolve an acknowledged or active alert."""
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.status = "RESOLVED"
    alert.resolved_at = datetime.now()
    db.commit()
    db.refresh(alert)
    return {"message": "Alert resolved", "alert_id": alert.id, "status": alert.status}
