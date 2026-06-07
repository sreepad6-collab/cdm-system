import { useState, useEffect, useRef } from 'react';
import { fetchAllAlerts, fetchOpenRefillRequests, acknowledgeAlert, resolveAlert, updateRefillStatus, completeCashLoad, fetchMachines } from '../api';
import { connectWebSocket, disconnectWebSocket } from '../websocket';

const fmt = (n) => Number(n).toLocaleString('en-IN');
const dt = (s) => new Date(s).toLocaleString('en-IN');

export default function Management() {
  const [tab, setTab] = useState('alerts');
  const [alerts, setAlerts] = useState([]);
  const [refills, setRefills] = useState([]);
  const [machines, setMachines] = useState([]);
  const [wsConnected, setWsConnected] = useState(false);
  const [liveAlert, setLiveAlert] = useState(null);
  const [loadModal, setLoadModal] = useState(null);
  const [loadAmt, setLoadAmt] = useState('');
  const [loadBy, setLoadBy] = useState('Manager');
  const [submitting, setSubmitting] = useState(false);

  const loadAlerts = () => fetchAllAlerts().then(r => setAlerts(r.data.data || [])).catch(() => {});
  const loadRefills = () => fetchOpenRefillRequests().then(r => setRefills(r.data.data || [])).catch(() => {});
  const loadMachines = () => fetchMachines().then(r => setMachines(r.data.data || [])).catch(() => {});

  useEffect(() => {
    loadAlerts(); loadRefills(); loadMachines();
    const client = connectWebSocket(
      (payload) => {
        setLiveAlert(payload);
        setTimeout(() => setLiveAlert(null), 5000);
        setWsConnected(true);
        loadAlerts(); loadRefills(); loadMachines();
      },
      () => { loadMachines(); }
    );
    const t = setInterval(() => { loadAlerts(); loadRefills(); loadMachines(); }, 15000);
    setTimeout(() => setWsConnected(true), 2000);
    return () => { disconnectWebSocket(); clearInterval(t); };
  }, []);

  const ackAlert = async (id) => {
    await acknowledgeAlert(id, 'Manager').catch(() => {});
    loadAlerts();
  };
  const resolveA = async (id) => {
    await resolveAlert(id, 'Manager').catch(() => {});
    loadAlerts();
  };
  const startRefill = async (id) => {
    await updateRefillStatus(id, 'IN_PROGRESS', 'Manager').catch(() => {});
    loadRefills();
  };
  const completeRefill = async (id) => {
    await updateRefillStatus(id, 'COMPLETED', 'Manager').catch(() => {});
    loadRefills();
  };

  const openLoadModal = (m) => { setLoadModal(m); setLoadAmt(''); };
  const submitLoad = async () => {
    const amt = parseFloat(loadAmt);
    if (!amt || amt <= 0) return alert('Enter a valid amount.');
    setSubmitting(true);
    try {
      await completeCashLoad(loadModal.id, amt, loadBy);
      setLoadModal(null);
      loadMachines(); loadAlerts(); loadRefills();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to load cash.');
    } finally { setSubmitting(false); }
  };

  return (
    <div>
      {/* WS status */}
      <div className={`ws-banner ${wsConnected ? '' : 'disconnected'}`}>
        <span className="ws-dot" />
        {wsConnected ? 'Live — WebSocket connected. Alerts arrive in real-time.' : 'Connecting to WebSocket...'}
      </div>

      {/* Live alert pop */}
      {liveAlert && (
        <div className="alert alert-error" style={{ marginBottom: 12 }}>
          🚨 <strong>LIVE ALERT:</strong> {liveAlert.message || liveAlert.status || JSON.stringify(liveAlert)}
        </div>
      )}

      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {['alerts', 'refills', 'machines'].map(t => (
          <button key={t} className={`btn ${tab === t ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab(t)}>
            {t === 'alerts' ? '🔔 Alerts' : t === 'refills' ? '📋 Refill Requests' : '🏧 Machines'}
          </button>
        ))}
      </div>

      {tab === 'alerts' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h2 style={{ margin: 0 }}>All Alerts</h2>
            <button className="btn btn-outline" onClick={loadAlerts}>🔄 Refresh</button>
          </div>
          {alerts.length === 0
            ? <div className="center">✅ No alerts</div>
            : <div className="table-wrap">
                <table>
                  <thead><tr><th>Machine</th><th>Type</th><th>Message</th><th>Status</th><th>Time</th><th>Actions</th></tr></thead>
                  <tbody>
                    {alerts.map(a => (
                      <tr key={a.id}>
                        <td><strong>{a.machine?.machineCode}</strong><br/><small>{a.machine?.location}</small></td>
                        <td><span className={`status-badge ${a.alertType === 'EMPTY' ? 'badge-EMPTY' : 'badge-LOW_CASH'}`}>{a.alertType}</span></td>
                        <td style={{ maxWidth: 200 }}>{a.message}</td>
                        <td><span className={`status-badge ${a.status === 'PENDING' ? 'badge-LOW_CASH' : a.status === 'ACKNOWLEDGED' ? 'badge-REFILLING' : 'badge-ACTIVE'}`}>{a.status}</span></td>
                        <td style={{ fontSize: 12, color: '#888' }}>{dt(a.createdAt)}</td>
                        <td>
                          {a.status === 'PENDING' && <button className="btn btn-outline" style={{ fontSize: 12, padding: '4px 10px', marginRight: 4 }} onClick={() => ackAlert(a.id)}>Acknowledge</button>}
                          {a.status !== 'RESOLVED' && <button className="btn btn-success" style={{ fontSize: 12, padding: '4px 10px' }} onClick={() => resolveA(a.id)}>Resolve</button>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
          }
        </div>
      )}

      {tab === 'refills' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h2 style={{ margin: 0 }}>Refill Requests</h2>
            <button className="btn btn-outline" onClick={loadRefills}>🔄 Refresh</button>
          </div>
          {refills.length === 0
            ? <div className="center">✅ No open refill requests</div>
            : <div className="table-wrap">
                <table>
                  <thead><tr><th>Machine</th><th>Requested By</th><th>Customer</th><th>Status</th><th>Time</th><th>Actions</th></tr></thead>
                  <tbody>
                    {refills.map(r => (
                      <tr key={r.id}>
                        <td><strong>{r.machine?.machineCode}</strong><br/><small>{r.machine?.location}</small></td>
                        <td><span className={`status-badge ${r.requestedBy === 'SYSTEM' ? 'badge-EMPTY' : 'badge-REFILLING'}`}>{r.requestedBy}</span></td>
                        <td>{r.customerName || '—'}<br/><small style={{ color: '#aaa' }}>{r.customerContact || ''}</small></td>
                        <td><span className={`status-badge ${r.status === 'OPEN' ? 'badge-LOW_CASH' : r.status === 'IN_PROGRESS' ? 'badge-REFILLING' : 'badge-ACTIVE'}`}>{r.status}</span></td>
                        <td style={{ fontSize: 12, color: '#888' }}>{dt(r.createdAt)}</td>
                        <td>
                          {r.status === 'OPEN' && <button className="btn btn-outline" style={{ fontSize: 12, padding: '4px 10px', marginRight: 4 }} onClick={() => startRefill(r.id)}>Start</button>}
                          {r.status !== 'COMPLETED' && r.status !== 'CANCELLED' && <button className="btn btn-success" style={{ fontSize: 12, padding: '4px 10px' }} onClick={() => completeRefill(r.id)}>Complete</button>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
          }
        </div>
      )}

      {tab === 'machines' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h2 style={{ margin: 0 }}>Machine Status &amp; Cash Load</h2>
            <button className="btn btn-outline" onClick={loadMachines}>🔄 Refresh</button>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Machine</th><th>Location</th><th>Balance</th><th>Capacity</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                {machines.map(m => (
                  <tr key={m.id}>
                    <td><strong>{m.machineCode}</strong></td>
                    <td>{m.location}</td>
                    <td style={{ fontWeight: 700, color: m.status === 'ACTIVE' ? '#2e7d32' : m.status === 'LOW_CASH' ? '#e65100' : '#c62828' }}>₹{fmt(m.currentBalance)}</td>
                    <td>₹{fmt(m.totalCapacity)}</td>
                    <td><span className={`status-badge badge-${m.status}`}>{m.status.replace('_', ' ')}</span></td>
                    <td>
                      <button className="btn btn-primary" style={{ fontSize: 12, padding: '6px 12px' }} onClick={() => openLoadModal(m)}>
                        💰 Load Cash
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {loadModal && (
        <div className="modal-overlay" onClick={() => setLoadModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>💰 Load Cash — {loadModal.machineCode}</h3>
            <p style={{ fontSize: 13, color: '#888', marginBottom: 16 }}>{loadModal.location}</p>
            <div style={{ background: '#f5f5f5', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13 }}>
              Current balance: <strong>₹{fmt(loadModal.currentBalance)}</strong>
            </div>
            <div className="form-group">
              <label className="form-label">Cash Amount to Load (₹)</label>
              <input className="form-input" type="number" value={loadAmt} onChange={e => setLoadAmt(e.target.value)} placeholder="e.g. 400000" />
            </div>
            <div className="form-group">
              <label className="form-label">Handled By</label>
              <input className="form-input" value={loadBy} onChange={e => setLoadBy(e.target.value)} />
            </div>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setLoadModal(null)}>Cancel</button>
              <button className="btn btn-success" onClick={submitLoad} disabled={submitting}>
                {submitting ? 'Loading...' : '✅ Confirm Load'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
