import { useState } from 'react';
import Machines from './pages/Machines';
import Transaction from './pages/Transaction';
import Management from './pages/Management';
import './App.css';

const tabs = [
  { id: 'machines', label: '🏧 Machines' },
  { id: 'transaction', label: '💸 Transaction' },
  { id: 'management', label: '📊 Management' },
];

export default function App() {
  const [tab, setTab] = useState('machines');
  return (
    <div className="app">
      <header className="app-header">
        <div>
          <h1>🏦 CDM Cash Management System</h1>
          <p>Real-time Cash Deposit Machine Monitor — Chennai Branches</p>
        </div>
      </header>
      <nav className="tab-nav">
        {tabs.map(t => (
          <button key={t.id} className={`tab-btn ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </nav>
      <main className="app-main">
        {tab === 'machines' && <Machines />}
        {tab === 'transaction' && <Transaction />}
        {tab === 'management' && <Management />}
      </main>
    </div>
  );
}
