import React, { useEffect, useState } from 'react';
import {
  BrainCircuit,
  Play,
  CheckCircle,
  AlertTriangle,
  Activity,
  Layers,
  Sparkles,
  ArrowRight,
  Info
} from 'lucide-react';
import { api } from '../services/api';
import EEGCircuitCanvas from '../components/EEGCircuitCanvas';

export default function BCIMonitoring({ setCurrentView, onSelectPatient }) {
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [samples, setSamples] = useState([]);
  const [selectedSampleIdx, setSelectedSampleIdx] = useState(0);

  const [loading, setLoading] = useState(true);
  const [inferring, setInferring] = useState(false);
  const [predictionResult, setPredictionResult] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    async function initData() {
      try {
        setLoading(true);
        const [patientsData, samplesData] = await Promise.all([
          api.getPatients(),
          api.getBCISamples()
        ]);
        setPatients(patientsData || []);
        if (patientsData && patientsData.length > 0) {
          setSelectedPatientId(patientsData[0].id);
        }
        setSamples(samplesData || []);
      } catch (err) {
        console.error('Failed to initialize BCI Monitoring data:', err);
      } finally {
        setLoading(false);
      }
    }
    initData();
  }, []);

  // When selected patient changes, load their BCI history
  useEffect(() => {
    if (!selectedPatientId) return;
    api.getPatientBCIHistory(selectedPatientId)
      .then((data) => setHistory(data || []))
      .catch((err) => console.warn('Could not load history:', err));
  }, [selectedPatientId]);

  const activeSample = samples[selectedSampleIdx] || null;

  const handleRunInference = async () => {
    if (!selectedPatientId || !activeSample) return;
    setInferring(true);
    setPredictionResult(null);

    try {
      const payload = {
        patient_id: parseInt(selectedPatientId, 10),
        participant_id: activeSample.participant_id,
        condition: activeSample.condition,
        trial_index: activeSample.trial_index,
        notes: `Interactive Console Run (Participant ${activeSample.participant_id}, ${activeSample.label_name})`
      };

      const res = await api.simulateBCI(payload);
      setPredictionResult(res);

      // Refresh history
      const updatedHistory = await api.getPatientBCIHistory(selectedPatientId);
      setHistory(updatedHistory || []);
    } catch (err) {
      alert(`Inference failed: ${err.message}`);
    } finally {
      setInferring(false);
    }
  };

  const selectedPatient = patients.find((p) => p.id === parseInt(selectedPatientId, 10));

  return (
    <div>
      {/* Top Banner Notice */}
      <div
        style={{
          background: 'rgba(6, 182, 212, 0.08)',
          border: '1px solid rgba(6, 182, 212, 0.25)',
          borderRadius: 12,
          padding: '12px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 24,
          fontSize: '0.84rem'
        }}
      >
        <Info size={18} color="var(--accent-cyan)" style={{ flexShrink: 0 }} />
        <span style={{ color: 'var(--text-secondary)' }}>
          <strong style={{ color: '#fff' }}>Prototype Notice:</strong> Running EEG motor imagery inference trained on the Wairagkar et al. (2018) 19-channel dataset. Evaluates sensorimotor rhythm desynchronization (ERD) in real-time.
        </span>
      </div>

      {/* Control Console & EEG Waveform */}
      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 24, marginBottom: 28 }}>
        {/* Controls Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card-header" style={{ marginBottom: 4 }}>
            <h3 className="card-title">
              <BrainCircuit size={18} color="var(--accent-cyan)" />
              <span>Inference Setup</span>
            </h3>
          </div>

          {/* Patient Selector */}
          <div className="form-group" style={{ marginBottom: 8 }}>
            <label className="form-label">Select Hospital Patient</label>
            <select
              className="form-select"
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.patient_code}) - {p.status}
                </option>
              ))}
            </select>
          </div>

          {/* Dataset EEG Trial Sample Selector */}
          <div className="form-group" style={{ marginBottom: 8 }}>
            <label className="form-label">Select Dataset EEG Sample</label>
            <select
              className="form-select"
              value={selectedSampleIdx}
              onChange={(e) => setSelectedSampleIdx(parseInt(e.target.value, 10))}
            >
              {samples.map((s, idx) => (
                <option key={idx} value={idx}>
                  P{s.participant_id} | {s.label_description} (Trial #{s.trial_index})
                </option>
              ))}
            </select>
          </div>

          {/* Sample Metadata Badge */}
          {activeSample && (
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 8,
                padding: '10px 12px',
                fontSize: '0.78rem',
                color: 'var(--text-secondary)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span>Channels:</span>
                <span style={{ color: '#fff', fontWeight: 600 }}>19 standard (10-20)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span>Sampling Rate:</span>
                <span style={{ color: '#fff', fontWeight: 600 }}>{activeSample.sample_rate_hz} Hz</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Ground Truth Class:</span>
                <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>
                  {activeSample.label_name}
                </span>
              </div>
            </div>
          )}

          {/* Run Inference Action Button */}
          <button
            className="btn btn-primary"
            onClick={handleRunInference}
            disabled={inferring || !activeSample}
            style={{ width: '100%', marginTop: 'auto', padding: '12px' }}
          >
            {inferring ? (
              <>
                <Activity size={18} className="animate-spin" />
                <span>Extracting Features & Inferring...</span>
              </>
            ) : (
              <>
                <Play size={18} fill="currentColor" />
                <span>Classify Motor Intent</span>
              </>
            )}
          </button>
        </div>

        {/* Live Multi-channel Waveform Stream */}
        <div className="card" style={{ padding: 18 }}>
          <EEGCircuitCanvas
            activeCondition={activeSample?.label_name || 'rest'}
            previewSignal={activeSample?.preview_signal}
            isSimulating={inferring}
          />
        </div>
      </div>

      {/* Inference Results Section (Shows when prediction completed) */}
      {predictionResult && (
        <div
          className="card"
          style={{
            marginBottom: 28,
            border: `1px solid ${
              predictionResult.intent.priority === 'HIGH'
                ? 'rgba(244, 63, 94, 0.5)'
                : predictionResult.intent.priority === 'MEDIUM'
                ? 'rgba(59, 130, 246, 0.5)'
                : 'rgba(16, 185, 129, 0.5)'
            }`,
            background:
              predictionResult.intent.priority === 'HIGH'
                ? 'linear-gradient(135deg, rgba(244, 63, 94, 0.1), rgba(18, 26, 47, 0.9))'
                : 'linear-gradient(135deg, rgba(6, 182, 212, 0.1), rgba(18, 26, 47, 0.9))',
            animation: 'fadeIn 0.3s ease'
          }}
        >
          <div className="card-header">
            <h3 className="card-title">
              <Sparkles size={20} color="var(--accent-cyan)" />
              <span>Real-Time Inference & Hospital Intent Translation</span>
            </h3>
            <span className={`tag tag-${predictionResult.intent.priority.toLowerCase()}`}>
              Priority: {predictionResult.intent.priority}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {/* Translated Clinical Action */}
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: 18, borderRadius: 12 }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Translated Hospital Intent
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', marginTop: 6 }}>
                {predictionResult.intent.clinical_action}
              </div>
              <div style={{ fontSize: '0.84rem', color: 'var(--accent-cyan)', marginTop: 4 }}>
                Detected Motor State: {predictionResult.predicted_label.replace('_', ' ').toUpperCase()}
              </div>

              {predictionResult.alert_triggered && (
                <div
                  style={{
                    marginTop: 14,
                    background: 'rgba(244, 63, 94, 0.2)',
                    border: '1px solid rgba(244, 63, 94, 0.4)',
                    padding: '8px 12px',
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: '0.8rem',
                    color: '#fb7185'
                  }}
                >
                  <AlertTriangle size={16} />
                  <span>Clinical Alert #{predictionResult.alert_id} automatically dispatched to staff triage!</span>
                </div>
              )}
            </div>

            {/* Probability Distribution */}
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: 18, borderRadius: 12 }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
                Model Confidence & Class Probabilities
              </div>

              {predictionResult.probabilities &&
                Object.entries(predictionResult.probabilities).map(([cls, prob]) => {
                  const pct = Math.round(prob * 100);
                  const isWinner = cls === predictionResult.predicted_label;
                  return (
                    <div key={cls} style={{ marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 3 }}>
                        <span style={{ color: isWinner ? '#fff' : 'var(--text-secondary)', fontWeight: isWinner ? 700 : 400 }}>
                          {cls.replace('_', ' ')}
                        </span>
                        <span style={{ color: isWinner ? 'var(--accent-cyan)' : 'var(--text-muted)', fontWeight: 600 }}>
                          {pct}%
                        </span>
                      </div>
                      <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${pct}%`,
                            background: isWinner
                              ? 'linear-gradient(90deg, var(--accent-cyan), var(--accent-blue))'
                              : 'rgba(255,255,255,0.2)',
                            borderRadius: 3,
                            transition: 'width 0.4s ease'
                          }}
                        />
                      </div>
                    </div>
                  );
                })}

              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 8 }}>
                Evaluated by: {predictionResult.model_name}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Patient BCI History Log Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            <Activity size={18} color="var(--accent-cyan)" />
            <span>Telemetry History for {selectedPatient?.name || 'Selected Patient'}</span>
          </h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {history.length} logged sessions
          </span>
        </div>

        {history.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', padding: '16px 0' }}>
            No BCI telemetry recorded yet for this patient. Click "Classify Motor Intent" above to start.
          </p>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Predicted Motor Intent</th>
                  <th>Clinical Action</th>
                  <th>Confidence</th>
                  <th>Priority</th>
                  <th>Source</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => (
                  <tr key={item.id}>
                    <td style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td style={{ fontWeight: 600 }}>{item.predicted_label.replace('_', ' ')}</td>
                    <td style={{ color: 'var(--text-primary)' }}>{item.intent.clinical_action}</td>
                    <td>
                      <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>
                        {(item.confidence * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td>
                      <span className={`tag tag-${item.intent.priority.toLowerCase()}`}>
                        {item.intent.priority}
                      </span>
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
