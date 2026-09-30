import React, { useEffect, useState } from 'react';
import {
  Users,
  BedDouble,
  Bell,
  BrainCircuit,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { api } from '../services/api';

export default function Dashboard({ setCurrentView, onSelectPatient }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load dashboard statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !stats) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
        Loading real-time telemetry...
      </div>
    );
  }

  const beds = stats?.beds || { total: 12, occupied: 4, available: 8, occupancy_rate: 33.3, icu_occupied: 1, icu_total: 4 };
  const alerts = stats?.alerts || { active: 1, critical: 1 };
  const bci = stats?.bci || { total_predictions: 0 };
  const recentAlerts = stats?.recent_alerts || [];
  const recentPredictions = stats?.recent_predictions || [];

  return (
    <div>
      {/* KPI Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card cyan">
          <div className="stat-header">
            <span className="stat-label">Total Inpatients</span>
            <div className="stat-icon">
              <Users size={18} color="var(--accent-cyan)" />
            </div>
          </div>
          <div className="stat-value">{stats?.total_patients ?? 4}</div>
          <div className="stat-sub">{stats?.admitted_patients ?? 4} currently admitted in wards</div>
        </div>

        <div className="stat-card emerald">
          <div className="stat-header">
            <span className="stat-label">Bed Occupancy</span>
            <div className="stat-icon">
              <BedDouble size={18} color="var(--accent-emerald)" />
            </div>
          </div>
          <div className="stat-value">{beds.occupancy_rate}%</div>
          <div className="stat-sub">{beds.occupied} of {beds.total} beds in use ({beds.icu_occupied}/{beds.icu_total} ICU)</div>
        </div>

        <div className="stat-card rose">
          <div className="stat-header">
            <span className="stat-label">Active Alerts</span>
            <div className="stat-icon">
              <Bell size={18} color="var(--accent-rose)" />
            </div>
          </div>
          <div className="stat-value">{alerts.active}</div>
          <div className="stat-sub" style={{ color: alerts.critical > 0 ? '#fb7185' : 'inherit' }}>
            {alerts.critical} critical urgency triage
          </div>
        </div>

        <div className="stat-card purple">
          <div className="stat-header">
            <span className="stat-label">BCI Inferences</span>
            <div className="stat-icon">
              <BrainCircuit size={18} color="var(--accent-purple)" />
            </div>
          </div>
          <div className="stat-value">{bci.total_predictions}</div>
          <div className="stat-sub">Assistive EEG motor classifications</div>
        </div>
      </div>

      {/* Action Banner for BCI Monitoring */}
      <div
        className="card"
        style={{
          marginBottom: 28,
          background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.12), rgba(59, 130, 246, 0.08))',
          borderColor: 'rgba(6, 182, 212, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: 'rgba(6, 182, 212, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 15px rgba(6, 182, 212, 0.4)'
            }}
          >
            <BrainCircuit size={26} color="var(--accent-cyan)" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Motor Imagery BCI Monitoring Console</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Stream multi-channel EEG from 14 participants, classify motor intent in real-time, and trigger bedside alerts.
            </p>
          </div>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setCurrentView('bci')}
        >
          <span>Launch BCI Console</span>
          <ArrowRight size={16} />
        </button>
      </div>

      {/* Two Column Layout: Recent Alerts & Recent Predictions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 24 }}>
        {/* Recent Alerts Feed */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <Bell size={18} color="var(--accent-rose)" />
              <span>Real-Time Clinical Alerts</span>
            </h3>
            <button className="btn btn-secondary btn-sm" onClick={() => setCurrentView('alerts')}>
              View All
            </button>
          </div>

          {recentAlerts.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', padding: '12px 0' }}>
              No alerts currently logged.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {recentAlerts.map((alert) => (
                <div
                  key={alert.id}
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: 10,
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12
                  }}
                >
                  <AlertTriangle
                    size={18}
                    color={alert.severity === 'CRITICAL' ? 'var(--accent-rose)' : 'var(--accent-amber)'}
                    style={{ marginTop: 2, flexShrink: 0 }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{alert.patient_name}</span>
                      <span className={`tag tag-${alert.severity.toLowerCase()}`}>
                        {alert.severity}
                      </span>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: 3 }}>
                      {alert.message}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 6 }}>
                      <Clock size={12} />
                      <span>{new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent BCI Inferences */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <BrainCircuit size={18} color="var(--accent-cyan)" />
              <span>Recent BCI Predictions</span>
            </h3>
            <button className="btn btn-secondary btn-sm" onClick={() => setCurrentView('history')}>
              View Log
            </button>
          </div>

          {recentPredictions.length === 0 ? (
            <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              <p>No predictions run yet.</p>
              <button
                className="btn btn-secondary btn-sm"
                style={{ marginTop: 12 }}
                onClick={() => setCurrentView('bci')}
              >
                Run First BCI Inference
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {recentPredictions.map((pred) => (
                <div
                  key={pred.id}
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: 10,
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{pred.patient_name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', marginTop: 2 }}>
                      {pred.clinical_action}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
                      Confidence: {(pred.confidence * 100).toFixed(1)}% | {pred.is_simulation ? 'Dataset Simulation' : 'Live EEG'}
                    </div>
                  </div>
                  <span className={`tag tag-${pred.priority.toLowerCase()}`}>
                    {pred.priority}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
