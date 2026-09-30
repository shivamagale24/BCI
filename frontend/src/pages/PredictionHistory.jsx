import React, { useEffect, useState } from 'react';
import { History, BrainCircuit, CheckCircle, Search, Filter } from 'lucide-react';
import { api } from '../services/api';

export default function PredictionHistory({ onSelectPatient, setCurrentView }) {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await api.getAllBCIPredictions();
      setPredictions(data || []);
    } catch (err) {
      console.error('Failed to load predictions history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = predictions.filter((p) => {
    const matchesSearch =
      (p.patient_name && p.patient_name.toLowerCase().includes(search.toLowerCase())) ||
      p.predicted_label.toLowerCase().includes(search.toLowerCase()) ||
      p.clinical_action.toLowerCase().includes(search.toLowerCase());
    const matchesPriority = priorityFilter ? p.priority === priorityFilter : true;
    return matchesSearch && matchesPriority;
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 14 }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>BCI Telemetry Audit Ledger</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
            Permanent record of all motor imagery EEG classifications, confidence levels and clinical triggers
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <input
            type="text"
            className="form-input"
            placeholder="Search telemetry..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 220 }}
          />

          <select
            className="form-select"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            style={{ width: 140 }}
          >
            <option value="">All Priorities</option>
            <option value="HIGH">HIGH (Urgent)</option>
            <option value="MEDIUM">MEDIUM (Care)</option>
            <option value="LOW">LOW (Baseline)</option>
          </select>
        </div>
      </div>

      <div className="card">
        {filtered.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', padding: '24px 0', textAlign: 'center' }}>
            No prediction logs matching filter.
          </p>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Patient</th>
                  <th>Predicted EEG Class</th>
                  <th>Translated Action</th>
                  <th>Confidence</th>
                  <th>Priority</th>
                  <th>Model Used</th>
                  <th>Session Mode</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id}>
                    <td style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      {new Date(item.created_at).toLocaleString()}
                    </td>
                    <td>
                      <strong
                        style={{ color: '#fff', cursor: 'pointer', textDecoration: 'underline' }}
                        onClick={() => {
                          onSelectPatient(item.patient_id);
                          setCurrentView('patientDetails');
                        }}
                      >
                        {item.patient_name}
                      </strong>
                    </td>
                    <td style={{ fontWeight: 600 }}>{item.predicted_label.replace('_', ' ')}</td>
                    <td style={{ color: 'var(--text-primary)' }}>{item.clinical_action}</td>
                    <td>
                      <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>
                        {(item.confidence * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td>
                      <span className={`tag tag-${item.priority.toLowerCase()}`}>
                        {item.priority}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {item.model_name}
                    </td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {item.is_simulation ? 'Dataset Sample' : 'Live EEG'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
