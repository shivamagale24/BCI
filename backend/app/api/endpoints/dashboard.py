"""
Dashboard Aggregate Metrics Endpoint for NeuroCare BCI.
"""

from typing import Any, Dict
from datetime import datetime, date
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.session import get_db
from app.models.patient import Patient
from app.models.bed import Bed
from app.models.alert import Alert
from app.models.bci_prediction import BCIPrediction
from app.models.appointment import Appointment

router = APIRouter()


@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Retrieve comprehensive hospital metrics for the frontend dashboard."""
    total_patients = db.query(Patient).count()
    admitted_patients = db.query(Patient).filter(Patient.status.in_(["Admitted", "ICU", "Critical"])).count()
    
    total_beds = db.query(Bed).count()
    occupied_beds = db.query(Bed).filter(Bed.status == "occupied").count()
    available_beds = db.query(Bed).filter(Bed.status == "available").count()
    icu_total = db.query(Bed).filter(Bed.is_icu == True).count()
    icu_occupied = db.query(Bed).filter(Bed.is_icu == True, Bed.status == "occupied").count()

    active_alerts = db.query(Alert).filter(Alert.status == "ACTIVE").count()
    critical_alerts = db.query(Alert).filter(Alert.status == "ACTIVE", Alert.severity.in_(["CRITICAL", "HIGH"])).count()

    total_bci_predictions = db.query(BCIPrediction).count()

    # Recent alerts
    recent_alerts_query = (
        db.query(Alert)
        .order_by(Alert.created_at.desc())
        .limit(6)
        .all()
    )
    recent_alerts = []
    for a in recent_alerts_query:
        recent_alerts.append({
            "id": a.id,
            "patient_name": a.patient.name if a.patient else "Unknown",
            "patient_code": a.patient.patient_code if a.patient else "-",
            "severity": a.severity,
            "status": a.status,
            "message": a.message,
            "created_at": a.created_at
        })

    # Recent predictions
    recent_preds_query = (
        db.query(BCIPrediction)
        .order_by(BCIPrediction.created_at.desc())
        .limit(6)
        .all()
    )
    recent_preds = []
    for p in recent_preds_query:
        recent_preds.append({
            "id": p.id,
            "patient_name": p.patient.name if p.patient else f"Patient #{p.patient_id}",
            "predicted_label": p.predicted_label,
            "confidence": p.confidence,
            "clinical_action": p.clinical_action,
            "priority": p.priority,
            "is_simulation": p.is_simulation,
            "created_at": p.created_at
        })

    return {
        "total_patients": total_patients,
        "admitted_patients": admitted_patients,
        "beds": {
            "total": total_beds,
            "occupied": occupied_beds,
            "available": available_beds,
            "occupancy_rate": round((occupied_beds / total_beds * 100) if total_beds > 0 else 0, 1),
            "icu_total": icu_total,
            "icu_occupied": icu_occupied,
            "icu_available": icu_total - icu_occupied
        },
        "alerts": {
            "active": active_alerts,
            "critical": critical_alerts
        },
        "bci": {
            "total_predictions": total_bci_predictions
        },
        "recent_alerts": recent_alerts,
        "recent_predictions": recent_preds
    }
