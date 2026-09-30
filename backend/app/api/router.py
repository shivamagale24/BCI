"""
Central API Router for NeuroCare BCI.
"""

from fastapi import APIRouter
from app.api.endpoints import (
    auth,
    patients,
    beds,
    bci,
    alerts,
    appointments,
    billing,
    dashboard
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
api_router.include_router(patients.router, prefix="/patients", tags=["Patients"])
api_router.include_router(beds.router, prefix="/beds", tags=["Beds & ICU"])
api_router.include_router(bci.router, prefix="/bci", tags=["BCI & NeuroCare"])
api_router.include_router(alerts.router, prefix="/alerts", tags=["Clinical Alerts"])
api_router.include_router(appointments.router, prefix="/appointments", tags=["Appointments"])
api_router.include_router(billing.router, prefix="/billing", tags=["Billing"])
