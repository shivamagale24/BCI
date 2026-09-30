"""
Database Initialization and Seed Data for NeuroCare BCI.
"""

from datetime import datetime, timedelta
from app.db.base import Base
from app.db.session import engine, SessionLocal
from app.core.security import get_password_hash
from app.models import (
    User,
    Patient,
    Bed,
    Appointment,
    BCIPrediction,
    Alert,
    BillingRecord
)


def init_database():
    """Create all tables if they do not exist."""
    print("Creating database tables if not existing...")
    Base.metadata.create_all(bind=engine)
    print("Database tables initialized successfully.")


def seed_demo_data():
    """Seed initial prototype staff accounts, wards, beds, and neurological patients."""
    db = SessionLocal()
    try:
        # 1. Seed Users
        if db.query(User).count() == 0:
            print("Seeding initial staff users...")
            users = [
                User(
                    email="admin@neurocare.hospital",
                    hashed_password=get_password_hash("admin123"),
                    full_name="Dr. Sarah Mitchell",
                    role="Admin",
                    is_active=True
                ),
                User(
                    email="doctor@neurocare.hospital",
                    hashed_password=get_password_hash("doctor123"),
                    full_name="Dr. James Wilson",
                    role="Doctor",
                    is_active=True
                ),
                User(
                    email="nurse@neurocare.hospital",
                    hashed_password=get_password_hash("nurse123"),
                    full_name="Elena Rostova, RN",
                    role="Nurse",
                    is_active=True
                )
            ]
            db.add_all(users)
            db.commit()

        # 2. Seed Beds
        if db.query(Bed).count() == 0:
            print("Seeding hospital beds and wards...")
            beds = [
                # ICU Beds
                Bed(bed_number="ICU-01", ward="Neuro-ICU", is_icu=True, status="available"),
                Bed(bed_number="ICU-02", ward="Neuro-ICU", is_icu=True, status="available"),
                Bed(bed_number="ICU-03", ward="Neuro-ICU", is_icu=True, status="available"),
                Bed(bed_number="ICU-04", ward="Neuro-ICU", is_icu=True, status="available"),
                # Neurological Ward
                Bed(bed_number="NW-101", ward="Neurology", is_icu=False, status="available"),
                Bed(bed_number="NW-102", ward="Neurology", is_icu=False, status="available"),
                Bed(bed_number="NW-103", ward="Neurology", is_icu=False, status="available"),
                Bed(bed_number="NW-104", ward="Neurology", is_icu=False, status="available"),
                # Rehabilitation Ward
                Bed(bed_number="REH-201", ward="Rehab", is_icu=False, status="available"),
                Bed(bed_number="REH-202", ward="Rehab", is_icu=False, status="available"),
                Bed(bed_number="REH-203", ward="Rehab", is_icu=False, status="available"),
                Bed(bed_number="REH-204", ward="Rehab", is_icu=False, status="available"),
            ]
            db.add_all(beds)
            db.commit()

        # 3. Seed Patients
        if db.query(Patient).count() == 0:
            print("Seeding prototype neurological patients...")
            patients = [
                Patient(
                    patient_code="NC-2026-001",
                    name="Alexander Wright",
                    age=58,
                    gender="Male",
                    contact="+1 (555) 234-5678",
                    blood_group="A+",
                    diagnosis="Post-Stroke Left Hemiparesis (BCI Motor Rehab Candidate)",
                    medical_history="Ischemic stroke 4 months ago. Mild motor recovery in right upper limb.",
                    status="Admitted"
                ),
                Patient(
                    patient_code="NC-2026-002",
                    name="Beatrice Chen",
                    age=42,
                    gender="Female",
                    contact="+1 (555) 345-6789",
                    blood_group="O+",
                    diagnosis="Amyotrophic Lateral Sclerosis (ALS) - Assistive BCI",
                    medical_history="Early-stage bulbar onset. Utilizing BCI for bedside nurse call signaling.",
                    status="ICU"
                ),
                Patient(
                    patient_code="NC-2026-003",
                    name="Marcus Vance",
                    age=34,
                    gender="Male",
                    contact="+1 (555) 456-7890",
                    blood_group="B+",
                    diagnosis="Traumatic Brain Injury (TBI) with Motor Dysfunction",
                    medical_history="Motor imagery EEG protocol initiated for sensorimotor rhythm modulation.",
                    status="Admitted"
                ),
                Patient(
                    patient_code="NC-2026-004",
                    name="Diana Morales",
                    age=67,
                    gender="Female",
                    contact="+1 (555) 567-8901",
                    blood_group="AB-",
                    diagnosis="Severe Cervical Spinal Cord Injury (C5 Tetraplegia)",
                    medical_history="Assistive communication evaluation via sensorimotor rhythm BCI.",
                    status="Admitted"
                )
            ]
            db.add_all(patients)
            db.commit()

            # Assign beds to patients
            p1 = db.query(Patient).filter(Patient.patient_code == "NC-2026-001").first()
            p2 = db.query(Patient).filter(Patient.patient_code == "NC-2026-002").first()
            p3 = db.query(Patient).filter(Patient.patient_code == "NC-2026-003").first()
            p4 = db.query(Patient).filter(Patient.patient_code == "NC-2026-004").first()

            b_icu = db.query(Bed).filter(Bed.bed_number == "ICU-01").first()
            b_nw1 = db.query(Bed).filter(Bed.bed_number == "NW-101").first()
            b_nw2 = db.query(Bed).filter(Bed.bed_number == "NW-102").first()
            b_reh = db.query(Bed).filter(Bed.bed_number == "REH-201").first()

            if b_nw1 and p1:
                b_nw1.patient_id = p1.id
                b_nw1.status = "occupied"
            if b_icu and p2:
                b_icu.patient_id = p2.id
                b_icu.status = "occupied"
            if b_nw2 and p3:
                b_nw2.patient_id = p3.id
                b_nw2.status = "occupied"
            if b_reh and p4:
                b_reh.patient_id = p4.id
                b_reh.status = "occupied"

            # 4. Seed initial Alert
            if p2:
                init_alert = Alert(
                    patient_id=p2.id,
                    alert_type="BCI_URGENT_ASSISTANCE",
                    severity="CRITICAL",
                    status="ACTIVE",
                    message="[SIMULATION] Initial system check: BCI bedside assistance online for Beatrice Chen (Bed ICU-01).",
                    trigger_source="BCI_RULE_ENGINE"
                )
                db.add(init_alert)

            # 5. Seed initial Appointment
            doctor = db.query(User).filter(User.role == "Doctor").first()
            if doctor and p1:
                app = Appointment(
                    patient_id=p1.id,
                    doctor_id=doctor.id,
                    appointment_date=datetime.now() + timedelta(days=1, hours=2),
                    department="Neurology Rehabilitation",
                    status="scheduled",
                    notes="Follow-up EEG motor imagery session and sensorimotor rhythm assessment."
                )
                db.add(app)

            # 6. Seed initial Billing Record
            if p1:
                bill = BillingRecord(
                    patient_id=p1.id,
                    invoice_number="INV-2026-00101",
                    service_description="BCI Assisted Neurological Rehabilitation Session & EEG Monitoring",
                    amount=450.00,
                    status="pending"
                )
                db.add(bill)

            db.commit()
            print("Demo data seeded successfully.")

    except Exception as e:
        print(f"Error seeding demo data: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    init_database()
    seed_demo_data()
