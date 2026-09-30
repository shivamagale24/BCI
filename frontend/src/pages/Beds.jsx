import React, { useEffect, useState } from 'react';
import {
  BedDouble,
  UserCheck,
  UserMinus,
  CheckCircle2,
  AlertCircle,
  Wrench,
  X
} from 'lucide-react';
import { api } from '../services/api';

export default function Beds({ onSelectPatient, setCurrentView }) {
  const [beds, setBeds] = useState([]);
  const [patients, setPatients] = useState([]);
  const [wardFilter, setWardFilter] = useState('');
  const [assigningBed, setAssigningBed] = useState(null);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [bedsData, patientsData] = await Promise.all([
        api.getBeds(wardFilter ? { ward: wardFilter } : {}),
        api.getPatients()
      ]);
      setBeds(bedsData || []);
      setPatients(patientsData || []);
    } catch (err) {
      console.error('Failed to load beds:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [wardFilter]);

  const handleReleaseBed = async (bedId) => {
    if (!window.confirm('Release/Discharge patient from this bed?')) return;
    try {
      await api.releaseBed(bedId);
      loadData();
    } catch (err) {
      alert(`Failed to release bed: ${err.message}`);
    }
  };

  const handleAssignBed = async (e) => {
    e.preventDefault();
    if (!assigningBed || !selectedPatientId) return;
    try {
      await api.assignBed(assigningBed.id, parseInt(selectedPatientId, 10));
      setAssigningBed(null);
      setSelectedPatientId('');
      loadData();
    } catch (err) {
      alert(`Failed to assign bed: ${err.message}`);
    }
  };

  return (
    <div>
      {/* Top Filter Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 14 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          {['', 'Neuro-ICU', 'Neurology', 'Rehab'].map((w) => (
            <button
              key={w}
              className={`btn btn-sm ${wardFilter === w ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setWardFilter(w)}
            >
              {w === '' ? 'All Wards' : w}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 16, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-emerald)' }} />
            Available
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-rose)' }} />
            Occupied
          </span>
        </div>
      </div>

      {/* Bed Grid */}
      <div className="beds-grid">
        {beds.map((bed) => {
          const isOccupied = bed.status === 'occupied';
          return (
            <div key={bed.id} className={`bed-card ${bed.status}`}>
              <div className="bed-header">
                <div>
                  <div className="bed-number">{bed.bed_number}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{bed.ward}</div>
                </div>

                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  {bed.is_icu && (
                    <span className="tag tag-critical" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                      ICU
                    </span>
                  )}
                  <span className={`tag tag-${isOccupied ? 'active' : 'resolved'}`}>
                    {bed.status}
                  </span>
                </div>
              </div>

              {isOccupied && bed.patient ? (
                <div style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '12px 14px', borderRadius: 10, margin: '8px 0 16px', flex: 1 }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                    {bed.patient.patient_code}
                  </div>
                  <div style={{ fontSize: '0.98rem', fontWeight: 700, color: '#fff', marginTop: 2 }}>
                    {bed.patient.name}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                    {bed.patient.age} yrs • {bed.patient.diagnosis || 'Inpatient observation'}
                  </div>

                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ flex: 1, fontSize: '0.72rem' }}
                      onClick={() => {
                        onSelectPatient(bed.patient.id);
                        setCurrentView('bci');
                      }}
                    >
                      BCI Telemetry
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      style={{ fontSize: '0.72rem' }}
                      onClick={() => handleReleaseBed(bed.id)}
                      title="Release/Discharge Bed"
                    >
                      <UserMinus size={13} />
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.84rem', flex: 1 }}>
                  <span>Bed is sanitized and ready for patient intake</span>
                  <div style={{ marginTop: 14 }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        setAssigningBed(bed);
                        if (patients.length > 0) setSelectedPatientId(patients[0].id);
                      }}
                    >
                      <UserCheck size={14} />
                      <span>Assign Patient</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Assign Bed Modal */}
      {assigningBed && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                Assign Patient to Bed {assigningBed.bed_number} ({assigningBed.ward})
              </h2>
              <button
                onClick={() => setAssigningBed(null)}
                style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAssignBed}>
              <div className="form-group">
                <label className="form-label">Select Patient</label>
                <select
                  className="form-select"
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  required
                >
                  <option value="">-- Choose Patient --</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.patient_code}) - {p.diagnosis || 'General'}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setAssigningBed(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Confirm Bed Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
