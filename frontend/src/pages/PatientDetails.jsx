import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Users,
  BedDouble,
  BrainCircuit,
  Calendar,
  Receipt,
  Clock,
  Activity,
  AlertTriangle
} from 'lucide-react';
import { api } from '../services/api';

export default function PatientDetails({ patientId, setCurrentView, onSelectPatient }) {
  const [patient, setPatient] = useState(null);
  const [bciHistory, setBciHistory] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [billing, setBilling] = useState([]);
  const [activeTab, setActiveTab] = useState('bci'); // 'bci', 'appointments', 'billing'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!patientId) return;
    async function loadDetails() {
      try {
        setLoading(true);
        const [patData, bciData, appData, billData] = await Promise.all([
          api.getPatient(patientId),
          api.getPatientBCIHistory(patientId),
          api.getAppointments({ patient_id: patientId }),
          api.getBillingRecords({ patient_id: patientId })
        ]);
        setPatient(patData);
        setBciHistory(bciData || []);
        setAppointments(appData || []);
        setBilling(billData || []);
      } catch (err) {
        console.error('Failed to load patient chart:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDetails();
  }, [patientId]);

  if (loading || !patient) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>Loading patient record...</div>;
  }

  return (
    <div>
      {/* Back button */}
      <button
        className="btn btn-secondary btn-sm"
        style={{ marginBottom: 20 }}
        onClick={() => setCurrentView('patients')}
      >
        <ArrowLeft size={16} />
        <span>Back to Patient Directory</span>
      </button>

      {/* Patient Header Profile Card */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <span style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>
              {patient.patient_code}
            </span>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: 4 }}>{patient.name}</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: 4 }}>
              {patient.age} yrs • {patient.gender} • Blood Group: <strong style={{ color: '#fff' }}>{patient.blood_group || 'N/A'}</strong> • Contact: {patient.contact || 'N/A'}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className={`tag tag-${patient.status === 'ICU' ? 'critical' : 'low'}`} style={{ fontSize: '0.85rem', padding: '6px 14px' }}>
              {patient.status}
            </span>
            <button
              className="btn btn-primary"
              onClick={() => {
                onSelectPatient(patient.id);
                setCurrentView('bci');
              }}
            >
              <BrainCircuit size={16} />
              <span>Launch BCI Monitor</span>
            </button>
          </div>
        </div>

        {/* Diagnosis & Bed Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--border-color)' }}>
          <div>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
              Assigned Ward & Bed
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', marginTop: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
              <BedDouble size={18} color="var(--accent-cyan)" />
              <span>{patient.bed?.bed_number || 'No Bed Assigned'}</span>
              {patient.bed?.ward && <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>({patient.bed.ward})</span>}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
              Clinical Diagnosis
            </div>
            <div style={{ fontSize: '0.92rem', color: 'var(--text-primary)', marginTop: 4 }}>
              {patient.diagnosis || 'Neurological evaluation ongoing'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
              Admitted Timestamp
            </div>
            <div style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', marginTop: 4 }}>
              {new Date(patient.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, borderBottom: '1px solid var(--border-color)', paddingBottom: 12 }}>
        <button
          className={`btn btn-sm ${activeTab === 'bci' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('bci')}
        >
          <BrainCircuit size={15} />
          <span>BCI Telemetry History ({bciHistory.length})</span>
        </button>
        <button
          className={`btn btn-sm ${activeTab === 'appointments' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('appointments')}
        >
          <Calendar size={15} />
          <span>Appointments ({appointments.length})</span>
        </button>
        <button
          className={`btn btn-sm ${activeTab === 'billing' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('billing')}
        >
          <Receipt size={15} />
          <span>Billing Records ({billing.length})</span>
        </button>
      </div>

      {/* Tab 1: BCI Telemetry */}
      {activeTab === 'bci' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <Activity size={18} color="var(--accent-cyan)" />
              <span>Sensorimotor BCI Telemetry Log</span>
            </h3>
          </div>

          {bciHistory.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', padding: '16px 0' }}>
              No BCI telemetry recorded for {patient.name} yet.
            </p>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Classified Motor State</th>
                    <th>Translated Clinical Action</th>
                    <th>Confidence</th>
                    <th>Priority</th>
                    <th>Session Mode</th>
                  </tr>
                </thead>
                <tbody>
                  {bciHistory.map((h) => (
                    <tr key={h.id}>
                      <td style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        {new Date(h.created_at).toLocaleString()}
                      </td>
                      <td style={{ fontWeight: 600 }}>{h.predicted_label.replace('_', ' ')}</td>
                      <td>{h.intent?.clinical_action || h.clinical_action}</td>
                      <td>
                        <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>
                          {(h.confidence * 100).toFixed(1)}%
                        </span>
                      </td>
                      <td>
                        <span className={`tag tag-${(h.intent?.priority || h.priority || 'low').toLowerCase()}`}>
                          {h.intent?.priority || h.priority}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {h.is_simulation ? 'Dataset Sample' : 'Live EEG'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Appointments */}
      {activeTab === 'appointments' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <Calendar size={18} color="var(--accent-blue)" />
              <span>Consultation Schedule</span>
            </h3>
          </div>

          {appointments.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', padding: '16px 0' }}>
              No appointments scheduled.
            </p>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date & Time</th>
                    <th>Attending Doctor</th>
                    <th>Department</th>
                    <th>Status</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((a) => (
                    <tr key={a.id}>
                      <td style={{ fontWeight: 600 }}>{new Date(a.appointment_date).toLocaleString()}</td>
                      <td>{a.doctor_name || 'Dr. James Wilson'}</td>
                      <td>{a.department}</td>
                      <td>
                        <span className="tag tag-medium">{a.status}</span>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{a.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Billing */}
      {activeTab === 'billing' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <Receipt size={18} color="var(--accent-emerald)" />
              <span>Inpatient Billing Ledger</span>
            </h3>
          </div>

          {billing.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', padding: '16px 0' }}>
              No billing entries recorded for this patient.
            </p>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Service Description</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {billing.map((b) => (
                    <tr key={b.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{b.invoice_number}</td>
                      <td>{b.service_description}</td>
                      <td style={{ fontWeight: 700, color: '#fff' }}>${b.amount.toFixed(2)}</td>
                      <td>
                        <span className={`tag tag-${b.status === 'paid' ? 'low' : 'high'}`}>
                          {b.status.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        {new Date(b.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
