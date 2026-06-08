import { useState, useEffect, useCallback } from 'react';
import CmsPanel from '../components/cms/CmsPanel.jsx';

const ADMIN_SECRET = 'yumabay-admin-2025';

function LoginForm({ onLogin }) {
  const [key, setKey]     = useState('');
  const [err, setErr]     = useState('');
  const submit = (e) => {
    e.preventDefault();
    if (key === ADMIN_SECRET) { onLogin(key); }
    else setErr('Invalid secret key.');
  };
  return (
    <div className="admin-login">
      <h2>Dashboard</h2>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <input
          type="password" className="form-input"
          placeholder="Admin secret key"
          value={key} onChange={e => setKey(e.target.value)}
        />
        {err && <span className="form-error">{err}</span>}
        <button type="submit" className="btn-primary">Access Dashboard</button>
      </form>
    </div>
  );
}

export default function Dashboard() {
  const [token, setToken]     = useState(sessionStorage.getItem('yb_admin') || '');
  const [tab,   setTab]       = useState('leads'); // 'leads' | 'cms'
  const [leads, setLeads]     = useState([]);
  const [loading, setLoading] = useState(false);
  const [noteMap, setNoteMap] = useState({});

  const fetchLeads = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res  = await fetch('/api/leads', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) {
        setLeads(data.leads || []);
        const nm = {};
        (data.leads || []).forEach(l => { nm[l.id] = l.notes || ''; });
        setNoteMap(nm);
      }
    } finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const handleLogin = (key) => { sessionStorage.setItem('yb_admin', key); setToken(key); };

  const updateLead = async (id, body) => {
    await fetch(`/api/leads/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    fetchLeads();
  };

  if (!token) return <div style={{ background: 'var(--dark)', minHeight: '100vh' }}><LoginForm onLogin={handleLogin} /></div>;

  const newCount = leads.filter(l => l.status === 'new').length;

  return (
    <div style={{ background: 'var(--dark)', minHeight: '100vh' }}>
      <div className="dashboard-page">
        <div className="dashboard-header">
          <div>
            <p className="section-label" style={{ marginBottom: 8 }}>Yuma Bay</p>
            <h1 className="section-title" style={{ fontSize: 40, marginBottom: 0 }}>Admin Dashboard</h1>
          </div>
          <button className="btn-ghost" onClick={() => { sessionStorage.removeItem('yb_admin'); setToken(''); }}>
            Sign Out
          </button>
        </div>

        {/* Top-level tabs */}
        <div className="dashboard-tabs">
          <button
            className={`dash-tab-btn${tab === 'leads' ? ' active' : ''}`}
            onClick={() => setTab('leads')}
          >
            📋 Leads
          </button>
          <button
            className={`dash-tab-btn${tab === 'cms' ? ' active' : ''}`}
            onClick={() => setTab('cms')}
          >
            🖼 Media Manager
          </button>
        </div>

        {/* CMS Panel */}
        {tab === 'cms' && <CmsPanel token={token} />}

        {/* Leads tab */}
        {tab === 'leads' && <>
        <div className="dashboard-stats">
          <div className="dash-stat">
            <div className="dash-stat-num">{leads.length}</div>
            <div className="dash-stat-lbl">Total Leads</div>
          </div>
          <div className="dash-stat">
            <div className="dash-stat-num">{newCount}</div>
            <div className="dash-stat-lbl">New</div>
          </div>
          <div className="dash-stat">
            <div className="dash-stat-num">{leads.filter(l => l.status === 'contacted').length}</div>
            <div className="dash-stat-lbl">Contacted</div>
          </div>
          <div className="dash-stat">
            <div className="dash-stat-num">{leads.filter(l => l.status === 'closed').length}</div>
            <div className="dash-stat-lbl">Closed</div>
          </div>
        </div>

        {loading && <p style={{ color: 'rgba(255,255,255,.4)', letterSpacing: '.2em', fontSize: 12 }}>Loading…</p>}

        {!loading && leads.length === 0 && (
          <p style={{ color: 'rgba(255,255,255,.35)', fontSize: 14 }}>No leads yet. Enquiries submitted via the contact form will appear here.</p>
        )}

        {leads.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table className="leads-table">
              <thead>
                <tr>
                  <th>Date</th><th>Name</th><th>Email</th><th>Phone</th>
                  <th>Interest</th><th>Lang</th><th>Message</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {leads.map(lead => (
                  <tr key={lead.id}>
                    <td style={{ whiteSpace: 'nowrap', fontSize: 11 }}>
                      {new Date(lead.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ fontWeight: 400, color: 'var(--white)' }}>{lead.name}</td>
                    <td>
                      <a href={`mailto:${lead.email}`}
                        style={{ color: 'var(--gold)', textDecoration: 'none', fontSize: 12 }}>
                        {lead.email}
                      </a>
                    </td>
                    <td>{lead.phone || '—'}</td>
                    <td>{lead.propertyInterest || '—'}</td>
                    <td style={{ textTransform: 'uppercase', fontSize: 10 }}>{lead.language}</td>
                    <td style={{ maxWidth: 240, fontSize: 12, lineHeight: 1.5 }}>
                      {lead.message}
                    </td>
                    <td>
                      <span className={`lead-status status-${lead.status}`}>{lead.status}</span>
                    </td>
                    <td>
                      {lead.status === 'new' && (
                        <button className="lead-action-btn" onClick={() => updateLead(lead.id, { status: 'contacted' })}>
                          Contacted
                        </button>
                      )}
                      {lead.status !== 'closed' && (
                        <button className="lead-action-btn" onClick={() => updateLead(lead.id, { status: 'closed' })}>
                          Close
                        </button>
                      )}
                      <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
                        <input
                          type="text" className="form-input"
                          style={{ padding: '4px 8px', fontSize: 11, width: 140 }}
                          placeholder="Add note…"
                          value={noteMap[lead.id] || ''}
                          onChange={e => setNoteMap(m => ({ ...m, [lead.id]: e.target.value }))}
                        />
                        <button
                          className="lead-action-btn"
                          onClick={() => updateLead(lead.id, { notes: noteMap[lead.id] })}
                        >
                          Save
                        </button>
                      </div>
                      {lead.notes && (
                        <p style={{ fontSize: 10, color: 'rgba(255,255,255,.35)', marginTop: 4 }}>
                          Note: {lead.notes}
                        </p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        </>}
      </div>
    </div>
  );
}
