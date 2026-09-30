# NeuroCare BCI: A Brain-Computer Interface Enabled Smart Hospital Management System

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React_18-61DAFB?logo=react)](https://react.dev)
[![scikit-learn](https://img.shields.io/badge/ML-scikit--learn-F7931E?logo=scikit-learn)](https://scikit-learn.org)
[![MySQL](https://img.shields.io/badge/Database-MySQL_8.0-4479A1?logo=mysql)](https://www.mysql.com)
[![Tests](https://img.shields.io/badge/Tests-100%25_Passing-10b981)](backend/tests/)

> **Academic Prototype Notice**: This system is a final-year engineering prototype integrating EEG motor imagery classification with hospital ward management workflows. It is **NOT** a clinically validated medical device and does not claim to diagnose diseases or detect medical emergencies autonomously.

---

## 1. Project Overview

**NeuroCare BCI** is an end-to-end smart hospital management platform engineered for neurological, stroke recovery, and immobilized ICU inpatients. By capturing and analyzing sensorimotor rhythm (SMR) Event-Related Desynchronization (ERD) from 19-channel electroencephalogram (EEG) data, the system decodes patient movement intentions into hospital actions (such as calling a nurse or requesting water) and automatically dispatches clinical alerts to staff workstations.

### Key Architectural Highlights
* **EEG Dataset Integration**: Evaluated on the peer-reviewed **Wairagkar et al. (2018)** motor execution/imagery dataset (14 human participants, 1,656 trials, 19 standard channels, 1024 Hz).
* **Robust Signal Processing**: Zero-phase 50 Hz notch filtering, 4th-order Butterworth bandpass filtering (8–30 Hz: Mu & Beta bands), decimation to 128 Hz, and baseline subtraction.
* **Biophysically Grounded Feature Extraction**: 139 features per trial including Welch Power Spectral Density (PSD), relative Mu/Beta bandpower, contralateral inter-hemispheric sensorimotor asymmetry (C3 vs C4, F3 vs F4, P3 vs P4), and Hjorth activity/mobility/complexity parameters.
* **Machine Learning**: Subject-aware cross-validation to prevent data leakage. Best classifier: **Support Vector Machine (RBF Kernel)** achieving superior cross-subject generalization over linear and forest baselines.
* **FastAPI Backend**: Asynchronous REST API with JWT authentication, role-based access control, MySQL ORM with SQLAlchemy 2.0, and automatic SQLite fallback.
* **React 18 Dashboard**: Modern clinical dark glassmorphism interface with an interactive HTML5 multi-channel EEG waveform canvas, live BCI inference triggers, bed allocation grid, and clinical emergency alert triage.

---

## 2. System Architecture

```
bci/
├── bci_pipeline/                 # EEG Signal Processing & ML Subsystem
│   ├── data/                     # Raw and participant dataset files
│   ├── preprocessing/            # Filtering, decimation, normalization
│   │   ├── filters.py
│   │   └── preprocessing.py
│   ├── features/                 # PSD, Bandpower, Hjorth, Asymmetry
│   │   └── extraction.py
│   ├── models/                   # Training, evaluation & artifacts
│   │   ├── train.py
│   │   ├── evaluate.py
│   │   └── saved_models/         # bci_classifier.joblib, metrics.json
│   ├── loader.py                 # Multi-participant dataset loader
│   ├── predictor.py              # Real-time inference engine
│   └── README.md
│
├── backend/                      # FastAPI Backend Application
│   ├── app/
│   │   ├── api/
│   │   │   ├── endpoints/        # Auth, Patients, Beds, BCI, Alerts, etc.
│   │   │   ├── deps.py           # Dependency injection & JWT auth
│   │   │   └── router.py         # Central v1 router
│   │   ├── core/                 # Config & Security
│   │   ├── db/                   # SQLAlchemy engine, session & seeder
│   │   ├── models/               # SQLAlchemy ORM models
│   │   ├── schemas/              # Pydantic validation schemas
│   │   └── services/             # BCI inference service & alert rule engine
│   ├── tests/
│   │   └── test_api.py           # Pytest integration test suite
│   ├── main.py                   # FastAPI app entrypoint
│   ├── requirements.txt
│   └── README.md
│
├── frontend/                     # React 18 + Vite Staff Dashboard
│   ├── src/
│   │   ├── components/           # Sidebar, Header, EEGCircuitCanvas
│   │   ├── context/              # AuthContext session management
│   │   ├── pages/                # Dashboard, BCI, Patients, Beds, Alerts, etc.
│   │   ├── services/             # Centralized API fetch client
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css             # Vanilla CSS clinical design system
│   ├── package.json
│   └── README.md
│
├── docs/                         # In-depth Technical Documentation
│   ├── architecture.md           # System dataflow & block diagrams
│   ├── bci_pipeline.md           # Dataset specs, preprocessing & ML metrics
│   ├── database.md               # MySQL schema & ER diagrams
│   └── api.md                    # REST endpoint reference & schemas
│
├── .env.example                  # Environment configuration template
├── .gitignore                    # Version control exclusions
└── README.md                     # Master documentation
```

---

## 3. Assistive Intent Translation

The BCI engine translates sensorimotor EEG rhythms into hospital actions:

| Predicted State | Physiological Mechanism | Hospital Clinical Action | Triage Severity | Rule Engine Output |
|:---|:---|:---|:---|:---|
| **Left Hand** (`2`) | Contralateral Right Motor Cortex Desynchronization (C4) | **Urgent Nurse Call / Immediate Assistance** | **HIGH / CRITICAL** | Immediately generates an active clinical alert in the staff queue |
| **Right Hand** (`0`) | Contralateral Left Motor Cortex Desynchronization (C3) | **Patient Care / Water Request** | **MEDIUM** | Logs care notification for routine nursing round |
| **Rest** (`1`) | Synchronized Sensorimotor Idling Rhythm | **Baseline State (Resting)** | **LOW** | Normal telemetry update |

---

## 4. Machine Learning Evaluation

The model was evaluated using a **Subject-Aware Train/Test Split** to test true inter-subject generalization on completely unseen individuals:
* **Training Cohort**: Participants 1 to 11 (1,296 trials).
* **Holdout Cohort**: Participants 12, 13, and 14 (360 trials).

| Classifier | Holdout Accuracy | Precision (Weighted) | Recall (Weighted) | F1-Score | Status |
|:---|:---:|:---:|:---:|:---:|:---|
| **SVM (RBF Kernel)** | **38.33%** | **38.53%** | **38.33%** | **38.39%** | **Selected Best Artifact** |
| SVM (Linear Kernel) | 36.39% | 36.45% | 36.39% | 36.30% | Evaluated |
| Logistic Regression | 33.61% | 33.55% | 33.61% | 33.47% | Baseline |
| Random Forest | 33.06% | 32.98% | 33.06% | 32.93% | Baseline |

*(Theoretical chance baseline for 3 balanced classes is 33.3%).*

---

## 5. Quickstart & Installation

### Prerequisites
* **Python**: 3.10 to 3.13
* **Node.js**: v18+ (tested on v24.18)
* **MySQL Server** (Optional: SQLite fallback is built-in)

### Step 1: Clone & Configure Environment
```bash
git clone <repo_url>
cd bci

# Create and activate virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1   # On Windows
# source venv/bin/activate    # On Linux/macOS

# Install Python dependencies
pip install -r backend/requirements.txt
```

### Step 2: Database Initialization & Seeding
```bash
# Set PYTHONPATH and initialize database tables & demo data
$env:PYTHONPATH=".;backend"
python backend/app/db/init_db.py
```

### Step 3: Start FastAPI Backend
```bash
$env:PYTHONPATH=".;backend"
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```
The backend API is now live at: [http://localhost:8000](http://localhost:8000)  
Interactive OpenAPI documentation: [http://localhost:8000/docs](http://localhost:8000/docs)

### Step 4: Start React Frontend
In a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 6. Demonstration Procedure

1. **Sign In**:
   - Access [http://localhost:5173](http://localhost:5173).
   - Use the convenient one-click **"Doctor"**, **"Nurse"**, or **"Admin"** demo login buttons.
2. **Executive Overview**:
   - Review live ward occupancy, available beds, active clinical alerts, and recent telemetry events.
3. **BCI Monitoring Console**:
   - Click **"BCI Monitoring"** in the sidebar.
   - Select an inpatient (e.g. *Alexander Wright* or *Beatrice Chen*).
   - Select a real EEG trial sample from the Wairagkar dataset (e.g. *Participant 1, Left Hand*).
   - Observe the real-time multi-channel waveform canvas animating the 10-20 montage signals.
   - Click **"Classify Motor Intent"**.
   - Watch the backend extract 139 features, run the SVM-RBF model, output genuine confidence probabilities, and instantly translate the signal into an urgent nurse call.
   - Notice the clinical alert automatically generated and pinned to the top triage queue!
4. **Bed & Ward Management**:
   - Navigate to **"Beds & ICU"** to view ward allocations, assign available beds, or discharge patients.
5. **Clinical Alerts Center**:
   - Open **"Clinical Alerts"** to review active urgency tickets and click **"Acknowledge"** or **"Resolve"**.

---

## 7. Automated Testing

Run the integration test suite covering health endpoints, JWT auth, patient management, bed operations, BCI inference, and rule-based alert triggering:
```bash
$env:PYTHONPATH=".;backend"
pytest backend/tests/test_api.py -v
```
**Results**: `8 passed, 100% test success rate`.

---

## 8. Limitations & Future Scope

### Limitations
1. **Academic Resolution**: EEG signals obtained from non-invasive scalp caps suffer from skull attenuation and volume conduction artifacts.
2. **Inter-Subject Variability**: Generalizing motor imagery models across completely unseen subjects remains a classic challenge in neuroengineering (subject-independent accuracy is typically lower than user-calibrated models).

### Future Improvements
1. **Adaptive Transfer Learning**: Implementing Riemannian Geometry (Covariance Matrices with Tangent Space Mapping) or ShallowFBCSPNet deep learning models.
2. **Real-time LSL Streaming**: Integration with Lab Streaming Layer (LSL) for direct USB/Bluetooth EEG hardware acquisition (e.g., OpenBCI Cyton, Emotiv, or g.tec).
3. **Audio-Visual Feedback**: Integrating auditory sensory feedback for closed-loop BCI neurorehabilitation.
