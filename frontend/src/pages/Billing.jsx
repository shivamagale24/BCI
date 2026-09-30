import React, { useEffect, useState } from 'react';
import { Receipt, Plus, DollarSign, CheckCircle, X } from 'lucide-react';
import { api } from '../services/api';

export default function Billing({ onSelectPatient, setCurrentView }) {
  const [billing, setBilling] = useState([]);
  const [patients, setPatients] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    patient_id: '',
    invoice_number: '',
    service_description: 'Assistive BCI Rehabilitation & Sensorimotor Telemetry Session',
    amount: 350.0,
    status: 'pending'
  });

  const loadBilling = async () => {
    try {
      setLoading(true);
      const [billData, patData] = await Promise.all([
        api.getBillingRecords(),
        api.getPatients()
      ]);
      setBilling(billData || []);
      setPatients(patData || []);
      if (patData && patData.length > 0 && !formData.patient_id) {
        setFormData((prev) => ({ ...prev, patient_id: patData[0].id }));
      }
    } catch (err) {
      console.error('Failed to load billing records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBilling();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.patient_id) return;
    try {
      await api.createBillingRecord({
        ...formData,
        patient_id: parseInt(formData.patient_id, 10),
        amount: parseFloat(formData.amount),
        invoice_number: formData.invoice_number || `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`
      });
      setShowModal(false);
      loadBilling();
    } catch (err) {
      alert(`Failed to create invoice: ${err.message}`);
    }
  };

  const handleMarkPaid = async (recordId) => {
    try {
      await api.updateBillingRecord(recordId, { status: 'paid' });
      loadBilling();
    } catch (err) {
      alert(`Failed to update billing: ${err.message}`);
    }
  };

  const totalOutstanding = billing
    .filter((b) => b.status === 'pending')
    .reduce((sum, b) => sum + b.amount, 0);

  const totalCollected = billing
    .filter((b) => b.status === 'paid')
    .reduce((sum, b) => sum + b.amount, 0);

  return (
    <div>
      {/* Top Metric Bar */}
      <div className="stats-grid">
        <div className="stat-card cyan">
          <div className="stat-header">
            <span className="stat-label">Total Invoices</span>
            <div className="stat-icon"><Receipt size={18} color="var(--accent-cyan)" /></div>
          </div>
          <div className="stat-value">{billing.length}</div>
          <div className="stat-sub">Hospital billing accounts</div>
        </div>

        <div className="stat-card emerald">
          <div className="stat-header">
            <span className="stat-label">Paid Receipts</span>
            <div className="stat-icon"><DollarSign size={18} color="var(--accent-emerald)" /></div>
          </div>
          <div className="stat-value">${totalCollected.toFixed(2)}</div>
          <div className="stat-sub">Successfully reconciled claims</div>
        </div>

        <div className="stat-card rose">
          <div className="stat-header">
            <span className="stat-label">Pending Balance</span>
            <div className="stat-icon"><Receipt size={18} color="var(--accent-rose)" /></div>
          </div>
          <div className="stat-value">${totalOutstanding.toFixed(2)}</div>
          <div className="stat-sub">Awaiting insurance / patient settlement</div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Inpatient Invoicing Ledger</h3>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} />
          <span>Generate Invoice</span>
        </button>
      </div>

      <div className="card">
        {billing.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', padding: '24px 0', textAlign: 'center' }}>
            No billing records registered.
          </p>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Patient</th>
                  <th>Service Description</th>
                  <th>Billed Amount</th>
                  <th>Status</th>
                  <th>Created Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {billing.map((b) => (
                  <tr key={b.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--accent-cyan)' }}>
                      {b.invoice_number}
                    </td>
                    <td>
                      <strong
                        style={{ color: '#fff', cursor: 'pointer', textDecoration: 'underline' }}
                        onClick={() => {
                          onSelectPatient(b.patient_id);
                          setCurrentView('patientDetails');
                        }}
                      >
                        {b.patient_name || `Patient #${b.patient_id}`}
                      </strong>
                    </td>
                    <td>{b.service_description}</td>
                    <td style={{ fontWeight: 700, color: '#fff' }}>${b.amount.toFixed(2)}</td>
                    <td>
                      <span className={`tag tag-${b.status === 'paid' ? 'low' : 'high'}`}>
                        {b.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      {new Date(b.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      {b.status === 'pending' && (
                        <button
                          className="btn btn-success btn-sm"
                          style={{ fontSize: '0.72rem' }}
                          onClick={() => handleMarkPaid(b.id)}
                        >
                          Mark Paid
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Generate Clinical Invoice</h2>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">Patient *</label>
                <select
                  className="form-select"
                  value={formData.patient_id}
                  onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
                  required
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.patient_code})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Invoice Number</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Auto-generated if blank"
                    value={formData.invoice_number}
                    onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Amount ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Service Description</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.service_description}
                  onChange={(e) => setFormData({ ...formData, service_description: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
