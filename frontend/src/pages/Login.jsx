import React, { useState } from 'react';
import { Activity, ShieldCheck, UserCheck, Stethoscope } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('doctor@neurocare.hospital');
  const [password, setPassword] = useState('doctor123');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickLogin = (quickEmail, quickPassword) => {
    setEmail(quickEmail);
    setPassword(quickPassword);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(ellipse at 50% 30%, #0c1833 0%, #070b14 100%)',
        padding: 20,
      }}
    >
      <div
        className="card"
        style={{
          maxWidth: 460,
          width: '100%',
          padding: '40px 32px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          border: '1px solid rgba(6, 182, 212, 0.25)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 25px rgba(6, 182, 212, 0.6)',
              marginBottom: 16,
            }}
          >
            <Activity size={28} color="#fff" />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#fff' }}>
            NeuroCare BCI
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: 4 }}>
            Smart Hospital Management & Assistive BCI Telemetry
          </p>
        </div>

        {error && (
          <div
            style={{
              background: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              color: '#fb7185',
              padding: '10px 14px',
              borderRadius: 8,
              fontSize: '0.82rem',
              marginBottom: 20,
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Clinical Staff Email</label>
            <input
              type="text"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. doctor@neurocare.hospital"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: 8 }}
            disabled={submitting}
          >
            {submitting ? 'Authenticating...' : 'Sign In to Clinical Console'}
          </button>
        </form>

        {/* Quick Demo Access Buttons */}
        <div style={{ marginTop: 28, borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: 20 }}>
          <p style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#64748b', textAlign: 'center', marginBottom: 12, fontWeight: 700 }}>
            Prototype Quick Demo Logins
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handleQuickLogin('doctor@neurocare.hospital', 'doctor123')}
              style={{ fontSize: '0.72rem', display: 'flex', flexDirection: 'column', gap: 4, padding: '8px 4px' }}
            >
              <Stethoscope size={16} color="#06b6d4" />
              <span>Doctor</span>
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handleQuickLogin('nurse@neurocare.hospital', 'nurse123')}
              style={{ fontSize: '0.72rem', display: 'flex', flexDirection: 'column', gap: 4, padding: '8px 4px' }}
            >
              <UserCheck size={16} color="#10b981" />
              <span>Nurse</span>
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handleQuickLogin('admin@neurocare.hospital', 'admin123')}
              style={{ fontSize: '0.72rem', display: 'flex', flexDirection: 'column', gap: 4, padding: '8px 4px' }}
            >
              <ShieldCheck size={16} color="#8b5cf6" />
              <span>Admin</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
