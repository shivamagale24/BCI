# NeuroCare BCI - REST API Reference

Base URL: `http://localhost:8000/api/v1`  
Interactive OpenAPI Swagger Docs: `http://localhost:8000/docs`

---

## 1. System & Health

### `GET /health`
Verifies backend service availability and pipeline status.
* **Response `200 OK`**:
```json
{
  "status": "healthy",
  "service": "NeuroCare BCI Backend",
  "version": "1.0.0",
  "environment": "prototype"
}
```

---

## 2. Authentication

### `POST /api/v1/auth/login`
Authenticates clinical staff member using email and password. Returns JWT token.
* **Request Body**:
```json
{
  "email": "doctor@neurocare.hospital",
  "password": "doctor123"
}
```
* **Response `200 OK`**:
```json
{
  "access_token": "eyJhbGciOi...",
  "token_type": "bearer",
  "user_id": 2,
  "email": "doctor@neurocare.hospital",
  "full_name": "Dr. James Wilson",
  "role": "Doctor"
}
```

### `GET /api/v1/auth/me`
Returns current authenticated staff profile. Requires `Authorization: Bearer <token>`.

---

## 3. BCI Inference & Telemetry

### `GET /api/v1/bci/samples`
Fetches a list of real EEG trial samples from the Wairagkar dataset with downsampled channel previews for frontend waveform plotting.
* **Response `200 OK`**:
```json
[
  {
    "participant_id": 1,
    "trial_index": 0,
    "condition": 0,
    "label_name": "right_hand",
    "label_description": "Right Hand (Water/Care Request)",
    "channels": ["Fp1", "Fp2", "...", "O2"],
    "sample_rate_hz": 1024.0,
    "duration_seconds": 6.0,
    "total_samples": 6144,
    "preview_signal": [-0.85, -0.62, 0.44, ...]
  }
]
```

### `POST /api/v1/bci/simulate`
Simulates live inference for a patient using an EEG sample from the Wairagkar dataset. Triggers an emergency or routine alert if urgency conditions are met.
* **Request Body**:
```json
{
  "patient_id": 1,
  "participant_id": 1,
  "condition": 2,
  "trial_index": 0,
  "notes": "Bedside test"
}
```
* **Response `200 OK`**:
```json
{
  "id": 1,
  "patient_id": 1,
  "patient_name": "Alexander Wright",
  "predicted_label": "left_hand",
  "confidence": 0.421,
  "intent": {
    "intent_code": "URGENT_NURSE_CALL",
    "label": "Left Hand Movement / Imagery",
    "clinical_action": "Urgent Nurse Call / Immediate Assistance",
    "priority": "HIGH"
  },
  "probabilities": {
    "right_hand": 0.284,
    "rest": 0.295,
    "left_hand": 0.421
  },
  "is_simulation": true,
  "model_name": "SVM_RBF",
  "alert_triggered": true,
  "alert_id": 2
}
```

### `POST /api/v1/bci/predict`
Accepts custom multi-channel EEG matrix (19 channels × $N$ samples) for live classification.

### `GET /api/v1/bci/history/{patient_id}`
Returns all past BCI classifications recorded for a specific patient.

---

## 4. Hospital Operations

### `GET /api/v1/dashboard/stats`
Returns aggregated hospital metrics: bed counts, occupancy percentage, active alerts, BCI inferences today, recent alerts and predictions.

### `GET /api/v1/patients`
Query inpatient directory with optional `?status_filter=Admitted|ICU|Stable|Discharged`.

### `POST /api/v1/patients`
Registers a new patient.

### `GET /api/v1/beds`
Returns bed and ICU capacity with optional `?ward=Neuro-ICU|Neurology|Rehab` and `?is_icu=true|false`.

### `PUT /api/v1/beds/{bed_id}/assign/{patient_id}`
Assigns a patient to an available bed.

### `PUT /api/v1/beds/{bed_id}/release`
Releases/discharges a patient from a bed.

### `GET /api/v1/alerts`
Returns clinical alerts with optional `?status_filter=ACTIVE|ACKNOWLEDGED|RESOLVED` and `?severity=CRITICAL|HIGH|MEDIUM|LOW`.

### `PUT /api/v1/alerts/{alert_id}/acknowledge`
Acknowledges an alert by staff.

### `PUT /api/v1/alerts/{alert_id}/resolve`
Marks an alert as resolved.

### `GET /api/v1/appointments` & `POST /api/v1/appointments`
Consultation and clinic scheduling.

### `GET /api/v1/billing` & `POST /api/v1/billing`
Patient invoicing and billing claims.
