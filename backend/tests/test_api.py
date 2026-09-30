"""
Integration Tests for NeuroCare BCI FastAPI Backend.
"""

import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

BACKEND_DIR = Path(__file__).resolve().parent.parent
PROJECT_ROOT = BACKEND_DIR.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from main import app

client = TestClient(app)


def test_health_check():
    """Test health check endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "NeuroCare BCI Backend"


def test_auth_login_success():
    """Test authentication with seeded staff credentials."""
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@neurocare.hospital", "password": "admin123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["role"] == "Admin"
    assert data["email"] == "admin@neurocare.hospital"


def test_auth_login_failure():
    """Test authentication failure with incorrect password."""
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@neurocare.hospital", "password": "wrongpassword"}
    )
    assert response.status_code == 401


def test_get_patients():
    """Test patient listing endpoint."""
    response = client.get("/api/v1/patients")
    assert response.status_code == 200
    patients = response.json()
    assert len(patients) >= 4
    codes = [p["patient_code"] for p in patients]
    assert "NC-2026-001" in codes


def test_get_beds():
    """Test bed and ICU listing endpoint."""
    response = client.get("/api/v1/beds")
    assert response.status_code == 200
    beds = response.json()
    assert len(beds) >= 10
    icu_beds = [b for b in beds if b["is_icu"]]
    assert len(icu_beds) >= 4


def test_dashboard_stats():
    """Test dashboard summary metrics."""
    response = client.get("/api/v1/dashboard/stats")
    assert response.status_code == 200
    stats = response.json()
    assert "total_patients" in stats
    assert "beds" in stats
    assert "alerts" in stats
    assert stats["beds"]["total"] >= 10


def test_bci_samples():
    """Test EEG simulation samples list endpoint."""
    response = client.get("/api/v1/bci/samples")
    assert response.status_code == 200
    samples = response.json()
    assert len(samples) > 0
    first = samples[0]
    assert "participant_id" in first
    assert "preview_signal" in first
    assert len(first["preview_signal"]) > 0


def test_bci_simulation_and_alert_trigger():
    """Test end-to-end BCI simulation on a patient, verifying inference and automatic alert generation."""
    # Run simulation for Patient 1 with condition 2 (Left Hand -> Urgent Nurse Call)
    sim_payload = {
        "patient_id": 1,
        "participant_id": 1,
        "condition": 2,
        "trial_index": 0,
        "notes": "Automated pipeline integration test"
    }
    response = client.post("/api/v1/bci/simulate", json=sim_payload)
    assert response.status_code == 200
    pred = response.json()
    assert "predicted_label" in pred
    assert "confidence" in pred
    assert "intent" in pred
    assert pred["is_simulation"] is True

    # If predicted left_hand, verify alert was created
    if pred["predicted_label"] == "left_hand":
        assert pred["alert_triggered"] is True
        assert pred["alert_id"] is not None

    # Verify prediction history for Patient 1
    history_res = client.get("/api/v1/bci/history/1")
    assert history_res.status_code == 200
    history = history_res.json()
    assert len(history) >= 1
