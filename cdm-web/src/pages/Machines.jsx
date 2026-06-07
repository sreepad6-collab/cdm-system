import { useState, useEffect } from 'react';
import { fetchMachines, customerRefillRequest } from '../api';

const fmt = (n) => Number(n).toLocaleString('en-IN');

const fillClass = (status) => {
  if (status === 'ACTIVE') return 'fill-green';
  if (status === 'LOW_CASH') return 'fill-orange';
  if (status === 'EMPTY') return 'fill-red';
  if (status === 'REFILLING') return 'fill-blue';
  return 'fill-gray';
};

export default function Machines() {
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null); // machine for refill request
  const [form, setForm] = useState({ customerName: '', customerContact: '', customerAccountRef: '' });
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const load = () => {
    setLoading(true);
    fetchMachines()
      .then(r => setMachines(r.data.data || []))
      .catch(() => setError('Cannot connect to backend. Make sure it is running on localhost:8080'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); const t = setInterval(load, 10000); return () => clearInterval(t); }, []);

  const openRefill = (m) => { setModal(m); setForm({ customerName: '', customerContact: '', customerAccountRef: '' }); setSuccessMsg(''); };

  const submitRefill = async () => {
    if (!form.customerName.trim()) return alert('Please enter your name.');
    setSubmitting(true);
    try {
      await customerRefillRequest({ machineCode: modal.machineCode, ...form });
      setSuccessMsg('Refill request sent to management!');
      setTimeout(() => { setModal(null); setSuccessMsg(''); }, 2000);
    } catch (e) {
      alert(e.response?.data?.message || 'Request failed.');
    } finally { setSubmitting(false); }
  };

  if (loading && machines.length === 0) return <div className="center"><div className="spinner" /><span>Loading machines...</span></div>;
  if (error) return <div className="center" style={{ color: '#c62828' }}>⚠️ {error}</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a237e' }}>CDM Machines — Chennai</h2>
        <button className="btn btn-outline" onClick={load}>🔄 Refresh</button>
      </div>

      <div className="machines-grid">
        {machines.map(m => {
          const pct = Math.round((m.currentBalance / m.totalCapacity) * 100);
          return (
            <div key={m.id} className={`machine-card ${m.status}`}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div className="machine-code">{m.machineCode}</div>
                  <div className="machine-loc">📍 {m.location}</div>
                </div>
                <span className={`status-badge badge-${m.status}`}>{m.status.replace('_', ' ')}</span>
              </div>

              <div className={`machine-balance ${m.status}`}>₹{fmt(m.currentBalance)}</div>
              <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>of ₹{fmt(m.totalCapacity)} capacity</div>

              <div className="progress-bar">
                <div className={`progress-fill ${fillClass(m.status)}`} style={{ width: `${pct}%` }} />
              </div>
              <div style={{ fontSize: 12, color: '#aaa' }}>{pct}% full · Low threshold: ₹{fmt(m.lowThreshold)}</div>

              {(m.status === 'LOW_CASH' || m.status === 'EMPTY') && (
                <button className="btn btn-outline" style={{ marginTop: 12, width: '100%' }} onClick={() => openRefill(m)}>
                  📢 Request Refill
                </button>
              )}
            </div>
          );
        })}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>📢 Request Refill — {modal.machineCode}</h3>
            <p style={{ fontSize: 13, color: '#888', marginBottom: 16 }}>{modal.location}</p>
            {successMsg
              ? <div className="alert alert-success">✅ {successMsg}</div>
              : <>
                  <div className="form-group">
                    <label className="form-label">Your Name *</label>
                    <input className="form-input" value={form.customerName} onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))} placeholder="e.g. Ravi Kumar" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Mobile Number</label>
                    <input className="form-input" value={form.customerContact} onChange={e => setForm(f => ({ ...f, customerContact: e.target.value }))} placeholder="e.g. 9876543210" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Account / Card Reference</label>
                    <input className="form-input" value={form.customerAccountRef} onChange={e => setForm(f => ({ ...f, customerAccountRef: e.target.value }))} placeholder="e.g. XXXX1234" />
                  </div>
                  <div className="modal-actions">
                    <button className="btn btn-outline" onClick={() => setModal(null)}>Cancel</button>
                    <button className="btn btn-primary" onClick={submitRefill} disabled={submitting}>
                      {submitting ? 'Sending...' : 'Send Request'}
                    </button>
                  </div>
                </>
            }
          </div>
        </div>
      )}
    </div>
  );
}
