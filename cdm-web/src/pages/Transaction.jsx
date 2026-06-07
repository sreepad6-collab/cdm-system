import { useState, useEffect } from 'react';
import { fetchMachines, processTransaction } from '../api';

const QUICK = [5000, 10000, 20000, 50000, 100000];
const fmt = (n) => Number(n).toLocaleString('en-IN');

export default function Transaction() {
  const [machines, setMachines] = useState([]);
  const [selectedCode, setSelectedCode] = useState('');
  const [txnType, setTxnType] = useState('WITHDRAWAL');
  const [amount, setAmount] = useState('');
  const [customerRef, setCustomerRef] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    fetchMachines().then(r => {
      const list = r.data.data || [];
      setMachines(list);
      if (list.length > 0) setSelectedCode(list[0].machineCode);
    });
  }, []);

  const refreshMachines = () => fetchMachines().then(r => setMachines(r.data.data || []));

  const selected = machines.find(m => m.machineCode === selectedCode);

  const submit = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return alert('Please enter a valid amount.');
    if (!selectedCode) return alert('Please select a machine.');
    setLoading(true); setResult(null);
    try {
      const res = await processTransaction({ machineCode: selectedCode, type: txnType, amount: amt, customerReference: customerRef || undefined });
      setResult({ success: true, txn: res.data.data });
      setAmount(''); setCustomerRef('');
      await refreshMachines();
    } catch (e) {
      setResult({ success: false, message: e.response?.data?.message || 'Transaction failed.' });
    } finally { setLoading(false); }
  };

  return (
    <div style={{ maxWidth: 560, margin: '0 auto' }}>
      <div className="card">
        <h2>Process Transaction</h2>

        {/* Type toggle */}
        <div className="type-toggle">
          <button className={`type-btn withdrawal ${txnType === 'WITHDRAWAL' ? 'active' : ''}`} onClick={() => setTxnType('WITHDRAWAL')}>
            ⬆️ Withdrawal
          </button>
          <button className={`type-btn deposit ${txnType === 'DEPOSIT' ? 'active' : ''}`} onClick={() => setTxnType('DEPOSIT')}>
            ⬇️ Deposit
          </button>
        </div>

        {/* Machine selection */}
        <div className="form-group">
          <label className="form-label">Select CDM Machine</label>
          <select className="form-select" value={selectedCode} onChange={e => setSelectedCode(e.target.value)}>
            {machines.map(m => (
              <option key={m.machineCode} value={m.machineCode}>{m.machineCode} — {m.location}</option>
            ))}
          </select>
        </div>

        {selected && (
          <div style={{
            padding: '12px 16px', borderRadius: 8, marginBottom: 14, textAlign: 'center',
            background: selected.status === 'ACTIVE' ? '#e8f5e9' : selected.status === 'LOW_CASH' ? '#fff8e1' : '#ffebee',
          }}>
            <div style={{ fontSize: 11, color: '#888' }}>Available Cash</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: selected.status === 'ACTIVE' ? '#2e7d32' : selected.status === 'LOW_CASH' ? '#e65100' : '#c62828' }}>
              ₹{fmt(selected.currentBalance)}
            </div>
            <span className={`status-badge badge-${selected.status}`}>{selected.status.replace('_', ' ')}</span>
          </div>
        )}

        {/* Amount */}
        <div className="form-group">
          <label className="form-label">Amount (₹)</label>
          <input
            className="form-input"
            style={{ fontSize: 22, fontWeight: 800, textAlign: 'center' }}
            value={amount}
            onChange={e => setAmount(e.target.value)}
            type="number"
            placeholder="0"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Quick Select</label>
          <div className="quick-amounts">
            {QUICK.map(q => (
              <button key={q} className={`quick-btn ${amount === String(q) ? 'active' : ''}`} onClick={() => setAmount(String(q))}>
                ₹{fmt(q)}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Account / Card Reference (optional)</label>
          <input className="form-input" value={customerRef} onChange={e => setCustomerRef(e.target.value)} placeholder="e.g. XXXX1234" />
        </div>

        {result && (
          <div className={`alert ${result.success ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: 14 }}>
            {result.success
              ? <div>✅ <strong>Transaction Successful</strong> — {result.txn.type} of ₹{fmt(result.txn.amount)} · New balance: ₹{fmt(result.txn.balanceAfter)}</div>
              : <div>❌ {result.message}</div>
            }
          </div>
        )}

        <button className={`btn ${txnType === 'WITHDRAWAL' ? 'btn-danger' : 'btn-success'}`} style={{ width: '100%', padding: '14px' }} onClick={submit} disabled={loading}>
          {loading ? 'Processing...' : txnType === 'WITHDRAWAL' ? '⬆️ Withdraw Cash' : '⬇️ Deposit Cash'}
        </button>
      </div>
    </div>
  );
}
