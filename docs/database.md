# NeuroCare BCI - Database Architecture & Schema

## 1. Overview

NeuroCare BCI utilizes a relational schema hosted on **MySQL 8.0** (`neurocare_bci` database). In local or constrained testing environments without a running MySQL instance, the application automatically falls back to an embedded SQLite database (`neurocare.db`), ensuring zero downtime.

Database connection management, session pooling, and object relational mapping (ORM) are implemented using **SQLAlchemy 2.0**.

---

## 2. Entity Relationship Overview

```mermaid
erDiagram
    USERS ||--o{ APPOINTMENTS : conducts
    PATIENTS ||--o| BEDS : occupies
    PATIENTS ||--o{ APPOINTMENTS : attends
    PATIENTS ||--o{ BCI_PREDICTIONS : generates
    PATIENTS ||--o{ ALERTS : triggers
    PATIENTS ||--o{ BILLING_RECORDS : owes

    USERS {
        int id PK
        string email
        string hashed_password
        string full_name
        string role
        boolean is_active
        datetime created_at
    }

    PATIENTS {
        int id PK
        string patient_code
        string name
        int age
        string gender
        string contact
        string blood_group
        string diagnosis
        text medical_history
        string status
        datetime created_at
    }

    BEDS {
        int id PK
        string bed_number
        string ward
        boolean is_icu
        string status
        int patient_id FK
    }

    BCI_PREDICTIONS {
        int id PK
        int patient_id FK
        string predicted_label
        float confidence
        string intent_code
        string clinical_action
        string priority
        text probabilities_json
        boolean is_simulation
        string model_name
        datetime created_at
    }

    ALERTS {
        int id PK
        int patient_id FK
        string alert_type
        string severity
        string status
        text message
        string trigger_source
        string acknowledged_by
        datetime created_at
        datetime acknowledged_at
        datetime resolved_at
    }

    APPOINTMENTS {
        int id PK
        int patient_id FK
        int doctor_id FK
        datetime appointment_date
        string department
        string status
        text notes
    }

    BILLING_RECORDS {
        int id PK
        int patient_id FK
        string invoice_number
        string service_description
        float amount
        string status
        datetime created_at
    }
```

---

## 3. Seeded Accounts & Master Data

The application automatically provisions demonstration records via `backend/app/db/init_db.py`:

* **Clinical Staff Accounts**:
  - `admin@neurocare.hospital` / `admin123` (Role: Admin)
  - `doctor@neurocare.hospital` / `doctor123` (Role: Doctor)
  - `nurse@neurocare.hospital` / `nurse123` (Role: Nurse)
* **Hospital Wards & Beds**:
  - `Neuro-ICU`: Beds `ICU-01`, `ICU-02`, `ICU-03`, `ICU-04`
  - `Neurology Ward`: Beds `NW-101`, `NW-102`, `NW-103`, `NW-104`
  - `Rehabilitation Ward`: Beds `REH-201`, `REH-202`, `REH-203`, `REH-204`
* **Sample Inpatients**:
  - `Alexander Wright` (`NC-2026-001`, Bed: NW-101) - Post-Stroke Rehabilitation
  - `Beatrice Chen` (`NC-2026-002`, Bed: ICU-01) - ALS Assistive BCI Candidate
  - `Marcus Vance` (`NC-2026-003`, Bed: NW-102) - TBI Motor Dysfunction
  - `Diana Morales` (`NC-2026-004`, Bed: REH-201) - C5 Tetraplegia Assistive Communication
