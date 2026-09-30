"""
BCI Prediction SQLAlchemy Model for NeuroCare BCI.

Stores EEG inference results, confidence, clinical intent translations,
probabilities, and whether the record came from a live run or simulation.
"""

from datetime import datetime
from typing import Optional
from sqlalchemy import Integer, String, Float, Boolean, Text, DateTime, func, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class BCIPrediction(Base):
    __tablename__ = "bci_predictions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    patient_id: Mapped[int] = mapped_column(Integer, ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    predicted_label: Mapped[str] = mapped_column(String(50), nullable=False)  # right_hand, rest, left_hand
    confidence: Mapped[float] = mapped_column(Float, nullable=False)  # 0.0 - 1.0
    intent_code: Mapped[str] = mapped_column(String(100), nullable=False)  # URGENT_NURSE_CALL, etc.
    clinical_action: Mapped[str] = mapped_column(String(255), nullable=False)
    priority: Mapped[str] = mapped_column(String(20), default="LOW", nullable=False)  # LOW, MEDIUM, HIGH
    probabilities_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON formatted dictionary
    is_simulation: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)  # Clearly labels demo runs
    model_name: Mapped[str] = mapped_column(String(100), default="SVM_RBF", nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), nullable=False)

    # Relationships
    patient = relationship("Patient", back_populates="bci_predictions")
