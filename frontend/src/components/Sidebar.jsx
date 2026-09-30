import React from 'react';
import {
  Activity,
  LayoutDashboard,
  Users,
  BedDouble,
  Bell,
  Calendar,
  Receipt,
  History,
  BrainCircuit,
  LogOut,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ currentView, setCurrentView, activeAlertsCount = 0 }) {
  const { user, logout } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'bci', label: 'BCI Monitoring', icon: BrainCircuit, highlight: true },
    { id: 'patients', label: 'Patients', icon: Users },
    { id: 'beds', label: 'Beds & ICU', icon: BedDouble },
    { id: 'alerts', label: 'Clinical Alerts', icon: Bell, badge: activeAlertsCount },
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'billing', label: 'Billing', icon: Receipt },
    { id: 'history', label: 'Prediction History', icon: History },
  ];

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="sidebar-header">
        <div className="brand-icon">
          <Activity size={22} />
        </div>
        <div className="brand-text">
          <h1>NeuroCare BCI</h1>
          <p>Smart Hospital OS</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <div
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setCurrentView(item.id)}
            >
              <Icon size={19} color={isActive ? 'var(--accent-cyan)' : 'currentColor'} />
              <span className="sidebar-text">{item.label}</span>
              {Boolean(item.badge) && item.badge > 0 && (
                <span className="badge">{item.badge}</span>
              )}
            </div>
          );
        })}
      </nav>

      {/* Staff Profile Footer */}
      <div className="sidebar-footer">
        <div className="user-avatar">
          {user?.full_name ? user.full_name[0] : 'S'}
        </div>
        <div className="user-info">
          <div className="name">{user?.full_name || 'Medical Staff'}</div>
          <div className="role">{user?.role || 'Clinician'}</div>
        </div>
        <button
          className="btn-sm btn-secondary"
          onClick={logout}
          title="Sign out"
          style={{ padding: '6px 8px' }}
        >
          <LogOut size={15} />
        </button>
      </div>
    </aside>
  );
}
