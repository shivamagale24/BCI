import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { api } from './services/api';

import Sidebar from './components/Sidebar';
import Header from './components/Header';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import BCIMonitoring from './pages/BCIMonitoring';
import Patients from './pages/Patients';
import PatientDetails from './pages/PatientDetails';
import Beds from './pages/Beds';
import Alerts from './pages/Alerts';
import Appointments from './pages/Appointments';
import Billing from './pages/Billing';
import PredictionHistory from './pages/PredictionHistory';

function MainApp() {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [activeAlertsCount, setActiveAlertsCount] = useState(0);

  // Poll active alert count for the sidebar badge
  const updateAlertCount = async () => {
    try {
      const activeAlerts = await api.getAlerts({ status_filter: 'ACTIVE' });
      setActiveAlertsCount(activeAlerts ? activeAlerts.length : 0);
    } catch (e) {
      // Silently ignore if unauthenticated or network error
    }
  };

  useEffect(() => {
    if (user) {
      updateAlertCount();
      const interval = setInterval(updateAlertCount, 10000);
      return () => clearInterval(interval);
    }
  }, [user]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-primary)',
          color: 'var(--text-secondary)',
          fontSize: '1rem',
        }}
      >
        Initializing NeuroCare BCI Operating System...
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const handleSelectPatient = (id) => {
    setSelectedPatientId(id);
  };

  return (
    <div className="app-container">
      <Sidebar
        currentView={currentView}
        setCurrentView={setCurrentView}
        activeAlertsCount={activeAlertsCount}
      />

      <div className="main-content">
        <Header
          currentView={currentView}
          onRefresh={updateAlertCount}
          activeAlertsCount={activeAlertsCount}
        />

        <main className="content-body">
          {currentView === 'dashboard' && (
            <Dashboard
              setCurrentView={setCurrentView}
              onSelectPatient={handleSelectPatient}
            />
          )}

          {currentView === 'bci' && (
            <BCIMonitoring
              setCurrentView={setCurrentView}
              onSelectPatient={handleSelectPatient}
            />
          )}

          {currentView === 'patients' && (
            <Patients
              setCurrentView={setCurrentView}
              onSelectPatient={handleSelectPatient}
            />
          )}

          {currentView === 'patientDetails' && (
            <PatientDetails
              patientId={selectedPatientId}
              setCurrentView={setCurrentView}
              onSelectPatient={handleSelectPatient}
            />
          )}

          {currentView === 'beds' && (
            <Beds
              setCurrentView={setCurrentView}
              onSelectPatient={handleSelectPatient}
            />
          )}

          {currentView === 'alerts' && (
            <Alerts
              setCurrentView={setCurrentView}
              onSelectPatient={handleSelectPatient}
            />
          )}

          {currentView === 'appointments' && (
            <Appointments
              setCurrentView={setCurrentView}
              onSelectPatient={handleSelectPatient}
            />
          )}

          {currentView === 'billing' && (
            <Billing
              setCurrentView={setCurrentView}
              onSelectPatient={handleSelectPatient}
            />
          )}

          {currentView === 'history' && (
            <PredictionHistory
              setCurrentView={setCurrentView}
              onSelectPatient={handleSelectPatient}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
