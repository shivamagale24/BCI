/**
 * Central API Service for NeuroCare BCI Frontend.
 * Communicates with FastAPI backend on port 8000.
 */

const API_BASE = 'http://localhost:8000/api/v1';

export const getAuthToken = () => localStorage.getItem('neurocare_token');
export const setAuthToken = (token) => localStorage.setItem('neurocare_token', token);
export const removeAuthToken = () => localStorage.removeItem('neurocare_token');

async function request(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const url = `${API_BASE}${endpoint}`;
  try {
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || 'API request failed');
    }
    if (res.status === 204) return null;
    return await res.json();
  } catch (error) {
    console.error(`API Error on ${endpoint}:`, error);
    throw error;
  }
}

export const api = {
  // Auth
  login: (email, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  getMe: () => request('/auth/me'),

  // Dashboard
  getDashboardStats: () => request('/dashboard/stats'),

  // Patients
  getPatients: (status) => request(status ? `/patients?status_filter=${status}` : '/patients'),
  getPatient: (id) => request(`/patients/${id}`),
  createPatient: (data) => request('/patients', { method: 'POST', body: JSON.stringify(data) }),
  updatePatient: (id, data) => request(`/patients/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePatient: (id) => request(`/patients/${id}`, { method: 'DELETE' }),

  // Beds
  getBeds: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(qs ? `/beds?${qs}` : '/beds');
  },
  assignBed: (bedId, patientId) => request(`/beds/${bedId}/assign/${patientId}`, { method: 'PUT' }),
  releaseBed: (bedId) => request(`/beds/${bedId}/release`, { method: 'PUT' }),
  updateBed: (bedId, data) => request(`/beds/${bedId}`, { method: 'PUT', body: JSON.stringify(data) }),

  // BCI Pipeline
  getBCISamples: () => request('/bci/samples'),
  simulateBCI: (data) => request('/bci/simulate', { method: 'POST', body: JSON.stringify(data) }),
  predictBCI: (data) => request('/bci/predict', { method: 'POST', body: JSON.stringify(data) }),
  getPatientBCIHistory: (patientId) => request(`/bci/history/${patientId}`),
  getAllBCIPredictions: () => request('/bci/all'),

  // Alerts
  getAlerts: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(qs ? `/alerts?${qs}` : '/alerts');
  },
  createAlert: (data) => request('/alerts', { method: 'POST', body: JSON.stringify(data) }),
  acknowledgeAlert: (id, staffName) =>
    request(`/alerts/${id}/acknowledge?staff_name=${encodeURIComponent(staffName || 'Staff')}`, { method: 'PUT' }),
  resolveAlert: (id) => request(`/alerts/${id}/resolve`, { method: 'PUT' }),

  // Appointments
  getAppointments: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(qs ? `/appointments?${qs}` : '/appointments');
  },
  createAppointment: (data) => request('/appointments', { method: 'POST', body: JSON.stringify(data) }),
  updateAppointment: (id, data) => request(`/appointments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Billing
  getBillingRecords: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(qs ? `/billing?${qs}` : '/billing');
  },
  createBillingRecord: (data) => request('/billing', { method: 'POST', body: JSON.stringify(data) }),
  updateBillingRecord: (id, data) => request(`/billing/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
};
