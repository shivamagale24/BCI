import React from 'react';
import { Activity, Bell, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Header({ currentView, onRefresh, activeAlertsCount = 0 }) {
  const { user } = useAuth();

  const titles = {
    dashboard: { title: 'Executive Overview', sub: 'Real-time hospital ward occupancy & neurological monitoring status' },
    bci: { title: 'BCI Monitoring Console', sub: 'Interactive EEG motor imagery inference, signal waveform & intent translation' },
    patients: { title: 'Patient Directory', sub: 'Inpatient neurological records, bed assignments & clinical history' },
    beds: { title: 'Beds & ICU Allocation', sub: 'Live ward capacity, telemetry status and patient bed mapping' },
    alerts: { title: 'Clinical Alert Center', sub: 'Active BCI distress alerts, urgency triggers and staff triage' },
    appointments: { title: 'Appointments & Consultations', sub: 'Neurology outpatient consultations and rehab scheduling' },
    billing: { title: 'Billing & Claims', sub: 'Patient healthcare invoicing and insurance ledger' },
    history: { title: 'BCI Prediction History', sub: 'Audited log of past EEG classifications and model confidence' },
    patientDetails: { title: 'Patient Medical Chart', sub: 'Detailed clinical telemetry and historical BCI responses' }
  };

  const currentMeta = titles[currentView] || { title: 'Hospital Management', sub: 'NeuroCare BCI OS' };

  return (
    <header className="header">
      <div className="header-left">
        <div className="header-title">
          <h2>{currentMeta.title}</h2>
          <p>{currentMeta.sub}</p>
        </div>
      </div>

      <div className="header-right">
        {/* Live BCI Telemetry indicator */}
        <div className="bci-status-badge">
          <div className="status-dot"></div>
          <span>BCI Pipeline: Active (1024 Hz)</span>
        </div>

        {/* Refresh button */}
        {onRefresh && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={onRefresh}
            title="Refresh Data"
          >
            <RefreshCw size={15} />
            <span>Refresh</span>
          </button>
        )}
      </div>
    </header>
  );
}
