# NeuroCare BCI - FastAPI Backend

## Overview
FastAPI REST backend integrating MySQL database ORM, JWT security, hospital operational workflows (Patients, Beds, ICU, Alerts, Appointments, Billing), and the BCI machine learning inference engine.

## Module Structure
```
backend/
├── app/
│   ├── api/
│   │   ├── endpoints/    # Auth, Patients, Beds, BCI, Alerts, Appointments, Billing, Dashboard
│   │   ├── deps.py       # Auth & DB dependencies
│   │   └── router.py     # Aggregated v1 API router
│   ├── core/
│   │   ├── config.py     # Settings with MySQL & JWT config
│   │   └── security.py   # Native bcrypt & JWT tokens
│   ├── db/
│   │   ├── base.py       # SQLAlchemy Base & Timestamp mixins
│   │   ├── session.py    # Engine with connection pooling & SQLite fallback
│   │   └── init_db.py    # Table initialization & demo data seeder
│   ├── models/           # SQLAlchemy ORM models
│   ├── schemas/          # Pydantic v2 schemas
│   └── services/         # BCIService, AlertService
├── tests/
│   └── test_api.py       # Comprehensive pytest integration test suite
├── main.py               # Application entrypoint & CORS
├── requirements.txt      # Python dependencies
└── README.md
```

## How to Run Backend
```bash
# 1. Activate Python virtual environment
.\venv\Scripts\Activate.ps1

# 2. Run Database Seeder (if first run)
python backend/app/db/init_db.py

# 3. Start FastAPI server
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

## How to Run Integration Tests
```bash
pytest backend/tests/test_api.py -v
```
