"""
Alert Service for NeuroCare BCI.

Manages clinical alert lifecycle (querying, acknowledging, resolving).
"""

from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models import Alert, Patient


class AlertService:
    @staticmethod
    def get_alerts(
        db: Session,
        status: Optional[str] = None,
        severity: Optional[str] = None,
        patient_id: Optional[int] = None,
        limit: int = 50
    ) -> List[Alert]:
        query = db.query(Alert)
        if status:
            query = query.filter(Alert.status == status)
        if severity:
            query = query.filter(Alert.severity == severity)
        if patient_id:
            query = query.filter(Alert.patient_id == patient_id)
        
        return query.order_by(Alert.created_at.desc()).limit(limit).all()

    @staticmethod
    def acknowledge_alert(db: Session, alert_id: int, staff_name: str) -> Optional[Alert]:
        alert = db.query(Alert).filter(Alert.id == alert_id).first()
        if not alert:
            return None
        alert.status = "ACKNOWLEDGED"
        alert.acknowledged_by = staff_name
        alert.acknowledged_at = datetime.now()
        db.commit()
        db.refresh(alert)
        return alert

    @staticmethod
    def resolve_alert(db: Session, alert_id: int) -> Optional[Alert]:
        alert = db.query(Alert).filter(Alert.id == alert_id).first()
        if not alert:
            return None
        alert.status = "RESOLVED"
        alert.resolved_at = datetime.now()
        db.commit()
        db.refresh(alert)
        return alert
