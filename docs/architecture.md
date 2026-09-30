# NeuroCare BCI - System Architecture

## 1. System Overview

**NeuroCare BCI** is a prototype smart hospital management system enhanced with assistive Brain-Computer Interface (BCI) capabilities. It provides hospitalized patients suffering from motor disabilities (such as stroke recovery, ALS, or tetraplegia) an assistive communication channel to signal nursing staff and request routine or emergency care using sensorimotor rhythm (SMR) motor imagery/execution EEG signals.

```mermaid
graph TD
    EEG[Wairagkar et al. 2018 EEG Dataset / Input] --> Loader[EEGLoader (19-Channel Standard 10-20)]
    Loader --> Preproc[EEG Preprocessor (Notch 50Hz, Bandpass 8-30Hz, 128Hz Resample)]
    Preproc --> Feat[EEG Feature Extractor (PSD Bandpower, Mu/Beta Asymmetry, Hjorth)]
    Feat --> ML[Classifier Artifact (Trained SVM-RBF / Logistic / RF)]
    ML --> Predictor[BCIPredictor Inference Engine]
    Predictor --> FastAPIService[BCIService & Alert Rule Engine]
    FastAPIService --> MySQL[(MySQL Database: neurocare_bci)]
    FastAPIService --> FastAPIRouter[FastAPI REST API v1]
    FastAPIRouter --> ReactApp[React 18 Clinical Staff Dashboard]
    ReactApp --> Clinician[Doctor / Nurse / ICU Staff]
```

---

## 2. Layered Architecture

### A. EEG & Machine Learning Layer (`bci_pipeline/`)
* **`loader.py`**: Reads raw participant trials (19 channels, 1024 Hz, 6.0 seconds per trial).
* **`preprocessing/`**:
  - Baseline correction (-2.5s to -0.5s pre-stimulus).
  - 50 Hz power-line notch filtering.
  - Butterworth 4th-order bandpass filtering (8.0 - 30.0 Hz) isolating Mu (8-13 Hz) and Beta (13-30 Hz) sensorimotor oscillations.
  - Slicing task window (0.5s to 3.0s post-stimulus).
  - Resampling to 128 Hz (320 samples per epoch) for low-latency inference.
  - Z-score normalization per channel.
* **`features/`**:
  - Welch Power Spectral Density (PSD).
  - Bandpower for Mu and Beta rhythms.
  - Relative spectral power ratios.
  - Inter-hemispheric sensorimotor asymmetry (C3 vs C4, F3 vs F4, P3 vs P4) capturing Event-Related Desynchronization (ERD).
  - Hjorth activity, mobility, and complexity parameters.
  - Total feature vector size: **139 features per trial**.
* **`models/`**:
  - Cross-subject evaluation (Holdout subjects: 12, 13, 14; Training subjects: 1-11).
  - Evaluated classifiers: SVM (RBF Kernel), Linear SVM, Logistic Regression, Random Forest.
  - Selected best model: **SVM (RBF Kernel)** saved with `StandardScaler` to `saved_models/bci_classifier.joblib`.
* **`predictor.py`**:
  - Validates input dimension `(19, N)`.
  - Executes identical preprocessing and feature extraction.
  - Computes class probabilities and maps detected motor states to hospital care requests.

---

### B. Backend Layer (`backend/`)
* Built with **Python 3.13 + FastAPI + Uvicorn**.
* **Database ORM**: SQLAlchemy 2.0 with connection pooling to MySQL (and automatic graceful SQLite fallback).
* **Security**: Native bcrypt password hashing and HMAC-SHA256 (HS256) JWT access token authentication.
* **Service Layer**:
  - `BCIService`: Runs model inference, formats confidence distribution, and feeds into rule engine.
  - `AlertService`: Rule engine that monitors prediction urgency (e.g. Left Hand -> `URGENT_NURSE_CALL`) and automatically raises clinical alerts in the triage queue.

---

### C. Frontend Dashboard Layer (`frontend/`)
* Built with **React 18 + Vite** using pure Vanilla CSS.
* **Clinical Dark Theme**: Modern glassmorphism palette, responsive flex and grid layouts, typography with Plus Jakarta Sans and JetBrains Mono.
* **Interactive Waveform Visualizer**: HTML5 Canvas rendering of 6 primary sensorimotor EEG channels (C3, Cz, C4, F3, F4, Pz) with real-time scrolling signal traces and visual event-related desynchronization (ERD) effects.
* **Modular Page Architecture**:
  1. Login (with instant demo accounts for Doctor, Nurse, Admin)
  2. Executive Dashboard (KPI stats, bed occupancy, active alerts)
  3. BCI Monitoring Console (interactive EEG trial selector, waveform canvas, prediction execution)
  4. Inpatient Directory (search, filter, admission modal)
  5. Patient Medical Chart (vitals, bed, appointments, billing, dedicated BCI history)
  6. Beds & ICU Allocation (visual occupancy cards, patient bed assignment, release action)
  7. Clinical Alerts Center (triage priority badges, audio-visual feedback, acknowledge/resolve actions)
  8. Appointments Calendar (scheduling clinical consultations)
  9. Billing Ledger (invoicing and payment tracking)
  10. Prediction History (audited BCI logs with class probabilities and session mode tags)

---

## 3. Assistive Intent Translation Mapping

| EEG Motor Class | Physiological Basis | Hospital Intent Translation | Clinical Triage Priority | System Action |
|:---|:---|:---|:---|:---|
| **Left Hand** (`2`) | Contralateral Right Motor Cortex Desynchronization (C4) | **Urgent Nurse Call / Immediate Assistance** | **HIGH / CRITICAL** | Immediately generates an Active Clinical Alert in the staff queue |
| **Right Hand** (`0`) | Contralateral Left Motor Cortex Desynchronization (C3) | **Patient Care / Water Request** | **MEDIUM** | Logs care request and raises routine nursing notification |
| **Rest** (`1`) | Synchronized Idling Sensorimotor Rhythm | **Baseline State (Resting)** | **LOW** | Regular telemetry update; no active alert dispatched |
