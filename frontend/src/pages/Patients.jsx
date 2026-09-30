import React, { useEffect, useState } from 'react';
import {
  Users,
  Plus,
  Search,
  BrainCircuit,
  Eye,
  BedDouble,
  X
} from 'lucide-react';
import { api } from '../services/api';

export default function Patients({ setCurrentView, onSelectPatient }) {
  const [patients, setPatients] = useState([]);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // New Patient Form State
  const [formData, setFormData] = useState({
    patient_code: '',
    name: '',
    age: '',
    gender: 'Male',
    contact: '',
    blood_group: 'O+',
    diagnosis: '',
    medical_history: '',
    status: 'Admitted'
  });

  const loadPatients = async () => {
    try {
      setLoading(true);
      const data = await api.getPatients(filter || undefined);
      setPatients(data || []);
    } catch (err) {
      console.error('Failed to load patients:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, [filter]);

  const handleCreatePatient = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        age: parseInt(formData.age, 10),
        patient_code: formData.patient_code || `NC-2026-${Math.floor(100 + Math.random() * 900)}`
      };
      await api.createPatient(payload);
      setShowAddModal(false);
      setFormData({
        patient_code: '',
        name: '',
        age: '',
        gender: 'Male',
        contact: '',
        blood_group: 'O+',
        diagnosis: '',
        medical_history: '',
        status: 'Admitted'
      });
      loadPatients();
    } catch (err) {
      alert(`Failed to create patient: ${err.message}`);
    }
  };

  const filteredPatients = patients.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.patient_code.toLowerCase().includes(search.toLowerCase()) ||
    (p.diagnosis && p.diagnosis.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div>
      {/* Top Header Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 280 }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: 360 }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              className="form-input"
              placeholder="Search by name, code or diagnosis..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: 36, width: '100%' }}
            />
          </div>

          <select
            className="form-select"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{ width: 160 }}
          >
            <option value="">All Statuses</option>
            <option value="Admitted">Admitted</option>
            <option value="ICU">ICU</option>
            <option value="Stable">Stable</option>
            <option value="Discharged">Discharged</option>
          </select>
        </div>

        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={16} />
          <span>Admit New Patient</span>
        </button>
      </div>

      {/* Patient Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
        {filteredPatients.map((patient) => (
          <div key={patient.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>
                  {patient.patient_code}
                </span>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: 2 }}>{patient.name}</h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {patient.age} yrs • {patient.gender} • Blood Group: {patient.blood_group || 'N/A'}
                </div>
              </div>
              <span className={`tag tag-${patient.status === 'ICU' ? 'critical' : 'low'}`}>
                {patient.status}
              </span>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '10px 12px', borderRadius: 8, margin: '8px 0 16px', fontSize: '0.82rem' }}>
              <strong style={{ color: 'var(--text-secondary)' }}>Diagnosis: </strong>
              <span>{patient.diagnosis || 'Neurological Evaluation Pending'}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 18 }}>
              <BedDouble size={16} color="var(--accent-cyan)" />
              <span>Assigned Bed: </span>
              <strong style={{ color: '#fff' }}>{patient.bed?.bed_number || 'Unassigned'}</strong>
              {patient.bed?.ward && <span>({patient.bed.ward})</span>}
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 'auto' }}>
              <button
                className="btn btn-secondary btn-sm"
                style={{ flex: 1 }}
                onClick={() => {
                  onSelectPatient(patient.id);
                  setCurrentView('patientDetails');
                }}
              >
                <Eye size={14} />
                <span>Medical Chart</span>
              </button>
              <button
                className="btn btn-primary btn-sm"
                style={{ flex: 1 }}
                onClick={() => {
                  onSelectPatient(patient.id);
                  setCurrentView('bci');
                }}
              >
                <BrainCircuit size={14} />
                <span>BCI Monitor</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Patient Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Admit New Patient</h2>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreatePatient}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Patient Code</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Auto-generated if blank"
                    value={formData.patient_code}
                    onChange={(e) => setFormData({ ...formData, patient_code: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Age *</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <select
                    className="form-select"
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Blood Group</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.blood_group}
                    onChange={(e) => setFormData({ ...formData, blood_group: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Primary Diagnosis</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Ischemic Stroke, ALS Motor Assistance"
                  value={formData.diagnosis}
                  onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Medical History / Clinical Notes</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  value={formData.medical_history}
                  onChange={(e) => setFormData({ ...formData, medical_history: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Admit Patient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
