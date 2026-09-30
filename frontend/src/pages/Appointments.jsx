import React, { useEffect, useState } from 'react';
import { Calendar, Plus, Clock, Stethoscope, X } from 'lucide-react';
import { api } from '../services/api';

export default function Appointments({ onSelectPatient, setCurrentView }) {
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    patient_id: '',
    appointment_date: '',
    department: 'Neurology Rehabilitation',
    status: 'scheduled',
    notes: ''
  });

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const [appData, patData] = await Promise.all([
        api.getAppointments(),
        api.getPatients()
      ]);
      setAppointments(appData || []);
      setPatients(patData || []);
      if (patData && patData.length > 0 && !formData.patient_id) {
        setFormData((prev) => ({ ...prev, patient_id: patData[0].id }));
      }
    } catch (err) {
      console.error('Failed to load appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.patient_id || !formData.appointment_date) return;
    try {
      await api.createAppointment({
        ...formData,
        patient_id: parseInt(formData.patient_id, 10),
        appointment_date: new Date(formData.appointment_date).toISOString()
      });
      setShowModal(false);
      loadAppointments();
    } catch (err) {
      alert(`Failed to schedule appointment: ${err.message}`);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Clinical Consultation Calendar</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
            Neurological reviews, BCI rehabilitation check-ups & physician rounds
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} />
          <span>Schedule Consultation</span>
        </button>
      </div>

      <div className="card">
        {appointments.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', padding: '24px 0', textAlign: 'center' }}>
            No clinical consultations scheduled.
          </p>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Patient</th>
                  <th>Department</th>
                  <th>Attending Physician</th>
                  <th>Status</th>
                  <th>Clinical Notes</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((a) => (
                  <tr key={a.id}>
                    <td style={{ fontWeight: 600 }}>{new Date(a.appointment_date).toLocaleString()}</td>
                    <td>
                      <strong
                        style={{ color: '#fff', cursor: 'pointer', textDecoration: 'underline' }}
                        onClick={() => {
                          onSelectPatient(a.patient_id);
                          setCurrentView('patientDetails');
                        }}
                      >
                        {a.patient_name || `Patient #${a.patient_id}`}
                      </strong>
                    </td>
                    <td>{a.department}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Stethoscope size={14} color="var(--accent-cyan)" />
                        <span>{a.doctor_name || 'Dr. James Wilson'}</span>
                      </div>
                    </td>
                    <td>
                      <span className="tag tag-medium">{a.status}</span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {a.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Schedule Consultation</h2>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">Patient *</label>
                <select
                  className="form-select"
                  value={formData.patient_id}
                  onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
                  required
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.patient_code})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Date & Time *</label>
                  <input
                    type="datetime-local"
                    className="form-input"
                    value={formData.appointment_date}
                    onChange={(e) => setFormData({ ...formData, appointment_date: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <select
                    className="form-select"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  >
                    <option value="Neurology Rehabilitation">Neurology Rehabilitation</option>
                    <option value="Neuro-ICU Care">Neuro-ICU Care</option>
                    <option value="Assistive BCI Clinic">Assistive BCI Clinic</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Consultation Objective / Notes</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g. Evaluate motor imagery ERD modulation & rehabilitation response."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Confirm Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
