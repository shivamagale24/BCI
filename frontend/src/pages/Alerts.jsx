import React, { useEffect, useState } from 'react';
import {
  Bell,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Filter,
  Check,
  Plus,
  X
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Alerts({ onSelectPatient, setCurrentView }) {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ACTIVE');
  const [severityFilter, setSeverityFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Manual Alert Modal
  const [showModal, setShowModal] = useState(false);
  const [patients, setPatients] = useState([]);
  const [modalPatientId, setModalPatientId] = useState('');
  const [modalSeverity, setModalSeverity] = useState('HIGH');
  const [modalType, setModalType] = useState('NURSE_CALL');
  const [modalMessage, setModalMessage] = useState('');

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status_filter = statusFilter;
      if (severityFilter) params.severity = severityFilter;
      const data = await api.getAlerts(params);
      setAlerts(data || []);
    } catch (err) {
      console.error('Failed to load alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
    api.getPatients().then((p) => setPatients(p || []));
  }, [statusFilter, severityFilter]);

  const handleAcknowledge = async (alertId) => {
    try {
      await api.acknowledgeAlert(alertId, user?.full_name || 'Attending Clinician');
      loadAlerts();
    } catch (err) {
      alert(`Failed to acknowledge alert: ${err.message}`);
    }
  };

  const handleResolve = async (alertId) => {
    try {
      await api.resolveAlert(alertId);
      loadAlerts();
    } catch (err) {
      alert(`Failed to resolve alert: ${err.message}`);
    }
  };

  const handleCreateAlert = async (e) => {
    e.preventDefault();
    if (!modalPatientId || !modalMessage) return;
    try {
      await api.createAlert({
        patient_id: parseInt(modalPatientId, 10),
        alert_type: modalType,
        severity: modalSeverity,
        status: 'ACTIVE',
        message: modalMessage,
        trigger_source: `STAFF_${user?.role?.toUpperCase() || 'CLINICIAN'}`
      });
      setShowModal(false);
      setModalMessage('');
      loadAlerts();
    } catch (err) {
      alert(`Failed to raise alert: ${err.message}`);
    }
  };

  return (
    <div>
      {/* Top Filter & Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 14 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {[
            { id: 'ACTIVE', label: 'Active Alerts' },
            { id: 'ACKNOWLEDGED', label: 'Acknowledged' },
            { id: 'RESOLVED', label: 'Resolved' },
            { id: '', label: 'All Records' }
          ].map((s) => (
            <button
              key={s.id}
              className={`btn btn-sm ${statusFilter === s.id ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setStatusFilter(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>

        <button className="btn btn-danger" onClick={() => setShowModal(true)}>
          <Plus size={16} />
          <span>Manual Emergency Call</span>
        </button>
      </div>

      {/* Alerts Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            <AlertTriangle size={18} color="var(--accent-rose)" />
            <span>Clinical Alerts & BCI Urgency Queue</span>
          </h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Showing {alerts.length} entries
          </span>
        </div>

        {alerts.length === 0 ? (
          <div style={{ padding: '30px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
            <CheckCircle2 size={36} color="var(--accent-emerald)" style={{ marginBottom: 10 }} />
            <p>No active alerts in this queue.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Patient</th>
                  <th>Severity</th>
                  <th>Alert Details</th>
                  <th>Trigger Source</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((alert) => (
                  <tr key={alert.id}>
                    <td style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      {new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td>
                      <strong
                        style={{ color: '#fff', cursor: 'pointer', textDecoration: 'underline' }}
                        onClick={() => {
                          onSelectPatient(alert.patient_id);
                          setCurrentView('patientDetails');
                        }}
                      >
                        {alert.patient_name || `Patient #${alert.patient_id}`}
                      </strong>
                    </td>
                    <td>
                      <span className={`tag tag-${alert.severity.toLowerCase()}`}>
                        {alert.severity}
                      </span>
                    </td>
                    <td style={{ maxWidth: 380, color: 'var(--text-primary)', fontSize: '0.84rem' }}>
                      {alert.message}
                    </td>
                    <td style={{ fontSize: '0.76rem', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                      {alert.trigger_source}
                    </td>
                    <td>
                      <span className={`tag tag-${alert.status.toLowerCase()}`}>
                        {alert.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {alert.status === 'ACTIVE' && (
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: '0.74rem' }}
                            onClick={() => handleAcknowledge(alert.id)}
                            title="Acknowledge alert"
                          >
                            <Check size={13} />
                            <span>Acknowledge</span>
                          </button>
                        )}
                        {alert.status !== 'RESOLVED' && (
                          <button
                            className="btn btn-success btn-sm"
                            style={{ fontSize: '0.74rem' }}
                            onClick={() => handleResolve(alert.id)}
                            title="Mark as resolved"
                          >
                            <span>Resolve</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manual Alert Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fb7185' }}>
                Raise Clinical Alert
              </h2>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateAlert}>
              <div className="form-group">
                <label className="form-label">Patient *</label>
                <select
                  className="form-select"
                  value={modalPatientId}
                  onChange={(e) => setModalPatientId(e.target.value)}
                  required
                >
                  <option value="">-- Select Inpatient --</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.patient_code}) - {p.status}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Alert Severity</label>
                  <select
                    className="form-select"
                    value={modalSeverity}
                    onChange={(e) => setModalSeverity(e.target.value)}
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Alert Category</label>
                  <select
                    className="form-select"
                    value={modalType}
                    onChange={(e) => setModalType(e.target.value)}
                  >
                    <option value="NURSE_CALL">Nurse Call</option>
                    <option value="PATIENT_DISTRESS">Patient Distress</option>
                    <option value="EQUIPMENT_CHECK">BCI Equipment / Electrodes</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Alert Description / Message *</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  placeholder="Describe triage concern or bedside requirement..."
                  value={modalMessage}
                  onChange={(e) => setModalMessage(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-danger">
                  Dispatch Alert
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
