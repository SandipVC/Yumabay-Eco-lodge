import { useState, useEffect, useCallback } from 'react';
import CmsPanel from '../components/cms/CmsPanel.jsx';
import TextContentSection from '../components/cms/TextContentSection.jsx';
import InventoryStatusBadge from '../components/cms/InventoryStatusBadge.jsx';
import { useAssets } from '../hooks/useAssets.js';
import { useLang } from '../context/LanguageContext.jsx';

const safeSessionStorage = {
  getItem(key) {
    try {
      return window.sessionStorage.getItem(key);
    } catch (e) {
      console.warn('sessionStorage is blocked or unavailable:', e.message);
      return this._data[key] || null;
    }
  },
  setItem(key, value) {
    try {
      window.sessionStorage.setItem(key, value);
    } catch (e) {
      console.warn('sessionStorage is blocked or unavailable:', e.message);
      this._data[key] = String(value);
    }
  },
  removeItem(key) {
    try {
      window.sessionStorage.removeItem(key);
    } catch (e) {
      console.warn('sessionStorage is blocked or unavailable:', e.message);
      delete this._data[key];
    }
  },
  _data: {}
};

function LoginForm({ onLogin }) {
  const { t } = useLang();
  const d = t.dashboard.login;
  const [key, setKey] = useState('');
  const [err, setErr] = useState('');
  const [verifying, setVerifying] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!key.trim()) return;
    setVerifying(true);
    setErr('');
    try {
      const res = await fetch('/api/leads', {
        headers: { Authorization: `Bearer ${key}` },
      });
      if (res.ok) {
        onLogin(key);
      } else {
        setErr(d.error);
      }
    } catch (err) {
      setErr('Connection error. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="admin-login">
      <h2>{d.title}</h2>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <input
          type="password" className="form-input"
          placeholder={d.placeholder}
          value={key} onChange={e => setKey(e.target.value)}
          disabled={verifying}
        />
        {err && <span className="form-error">{err}</span>}
        <button type="submit" className="btn-primary" disabled={verifying}>
          {verifying ? 'Verifying...' : d.btn}
        </button>
      </form>
    </div>
  );
}

export default function Dashboard() {
  const { lang, toggle: toggleLang, t } = useLang();
  const d = t.dashboard;
  const { assets, refresh } = useAssets();

  // Force light background on body/html for the whole dashboard page.
  useEffect(() => {
    const prev = document.body.style.background;
    document.documentElement.style.background = '#F0EDE8';
    document.body.style.background = '#F0EDE8';
    return () => {
      document.documentElement.style.background = '';
      document.body.style.background = prev;
    };
  }, []);
  const [token, setToken]     = useState(safeSessionStorage.getItem('yb_admin') || '');
  const [tab,   setTab]       = useState('leads'); // 'leads' | 'cms' | 'text'
  const [leads, setLeads]     = useState([]);
  const [loading, setLoading] = useState(false);
  const [noteMap, setNoteMap] = useState({});

  const fetchLeads = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res  = await fetch('/api/leads', { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 401) {
        safeSessionStorage.removeItem('yb_admin');
        setToken('');
        return;
      }
      const data = await res.json();
      if (res.ok) {
        setLeads(data.leads || []);
        const nm = {};
        (data.leads || []).forEach(l => { nm[l.id] = l.notes || ''; });
        setNoteMap(nm);
      }
    } catch (err) {
      console.error('Failed to fetch leads:', err);
    } finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const handleLogin = (key) => { safeSessionStorage.setItem('yb_admin', key); setToken(key); };

  const updateLead = async (id, body) => {
    await fetch(`/api/leads/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    fetchLeads();
  };

  if (!token) return <div className="dash-light" style={{ minHeight: '100vh' }}><LoginForm onLogin={handleLogin} /></div>;

  const newCount = leads.filter(l => l.status === 'new').length;

  return (
    <div className="dash-light" style={{ minHeight: '100vh' }}>
      <div className="dashboard-page">
        <div className="dashboard-header">
          <div>
            <p className="section-label" style={{ marginBottom: 8 }}>{d.eyebrow}</p>
            <h1 className="section-title" style={{ fontSize: 40, marginBottom: 0 }}>{d.title}</h1>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              className="btn-ghost"
              onClick={toggleLang}
              title={d.toggleLangTitle}
            >
              {lang === 'en' ? '🌐 EN → ES' : '🌐 ES → EN'}
            </button>
            <button className="btn-ghost" onClick={() => { safeSessionStorage.removeItem('yb_admin'); setToken(''); }}>
              {d.signOut}
            </button>
          </div>
        </div>

        {/* Top-level tabs */}
        <div className="dashboard-tabs">
          <button
            className={`dash-tab-btn${tab === 'leads' ? ' active' : ''}`}
            onClick={() => setTab('leads')}
          >
            {d.tabLeads}
          </button>
          <button
            className={`dash-tab-btn${tab === 'cms' ? ' active' : ''}`}
            onClick={() => setTab('cms')}
          >
            {d.tabMedia}
          </button>
          <button
            className={`dash-tab-btn${tab === 'text' ? ' active' : ''}`}
            onClick={() => setTab('text')}
          >
            {d.tabText}
          </button>
        </div>

        {/* CMS Panel */}
        {tab === 'cms'  && <CmsPanel token={token} />}
        {tab === 'text' && (
          <>
            {/* <InventoryStatusBadge /> */}
            <TextContentSection token={token} />
          </>
        )}
        {/* Leads tab */}
        {tab === 'leads' && <>
        <div className="dashboard-stats">
          <div className="dash-stat">
            <div className="dash-stat-num">{leads.length}</div>
            <div className="dash-stat-lbl">{d.totalLeads}</div>
          </div>
          <div className="dash-stat">
            <div className="dash-stat-num">{newCount}</div>
            <div className="dash-stat-lbl">{d.newLeads}</div>
          </div>
          <div className="dash-stat">
            <div className="dash-stat-num">{leads.filter(l => l.status === 'contacted').length}</div>
            <div className="dash-stat-lbl">{d.contacted}</div>
          </div>
          <div className="dash-stat">
            <div className="dash-stat-num">{leads.filter(l => l.status === 'closed').length}</div>
            <div className="dash-stat-lbl">{d.closed}</div>
          </div>
        </div>

        {loading && <p style={{ color: 'rgba(255,255,255,.4)', letterSpacing: '.2em', fontSize: 12 }}>{d.loading}</p>}

        {!loading && leads.length === 0 && (
          <p style={{ color: 'rgba(255,255,255,.35)', fontSize: 14 }}>{d.noLeads}</p>
        )}

        {leads.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table className="leads-table">
              <thead>
                <tr>
                  <th>{d.thDate}</th><th>{d.thName}</th><th>{d.thEmail}</th><th>{d.thPhone}</th>
                  <th>{d.thInterest}</th><th>{d.thUnit}</th><th>{d.thLang}</th><th>{d.thMessage}</th><th>{d.thStatus}</th><th>{d.thActions}</th>
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
                    <td style={{ fontWeight: '600', color: 'var(--gold)' }}>{lead.unitCode || '—'}</td>
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
                          {d.btnContacted}
                        </button>
                      )}
                      {lead.status !== 'closed' && (
                        <button className="lead-action-btn" onClick={() => updateLead(lead.id, { status: 'closed' })}>
                          {d.btnClose}
                        </button>
                      )}
                      <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
                        <input
                          type="text" className="form-input"
                          style={{ padding: '4px 8px', fontSize: 11, width: 140 }}
                          placeholder={d.notePlaceholder}
                          value={noteMap[lead.id] || ''}
                          onChange={e => setNoteMap(m => ({ ...m, [lead.id]: e.target.value }))}
                        />
                        <button
                          className="lead-action-btn"
                          onClick={() => updateLead(lead.id, { notes: noteMap[lead.id] })}
                        >
                          {d.noteSave}
                        </button>
                      </div>
                      {lead.notes && (
                        <p style={{ fontSize: 10, color: 'rgba(255,255,255,.35)', marginTop: 4 }}>
                          {d.notePrefix}: {lead.notes}
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
