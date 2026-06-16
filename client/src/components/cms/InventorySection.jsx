import { useState, useEffect } from 'react';
import { useAssets, invalidateAssetsCache } from '../../hooks/useAssets.js';

// Helper to patch since CmsPanel's is local, we can implement it here or import it
async function updateInventorySection({ data, token }) {
  const res = await fetch('/api/cms/assets', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ section: 'inventory', data }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to save inventory');
  }
  return res.json();
}

export default function InventorySection({ assets, token, refresh }) {
  const [activeTab, setActiveTab] = useState('edificio-ab');
  const [localInventory, setLocalInventory] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState('');

  // Re-sync when database assets reload, unless we have unsaved edits
  useEffect(() => {
    if (dirty) return;
    if (assets?.inventory) {
      setLocalInventory(JSON.parse(JSON.stringify(assets.inventory)));
    }
  }, [assets, dirty]);

  if (!localInventory) {
    return <p className="cms-hint">Loading inventory data...</p>;
  }

  const handleFieldChange = (category, unitIndex, field, val) => {
    const updated = JSON.parse(JSON.stringify(localInventory));
    if (category === 'villas') {
      updated.villas[unitIndex][field] = val;
    } else {
      // Find the building
      const building = updated.buildings.find((b) => b.id === category);
      if (building) {
        building.units[unitIndex][field] = val;
      }
    }
    setLocalInventory(updated);
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setErr(null);
    try {
      const dataToSave = JSON.parse(JSON.stringify(localInventory));
      if (dataToSave.buildings) {
        for (const b of dataToSave.buildings) {
          let sum = 0;
          for (const u of b.units) {
            if (u.price !== null && typeof u.price === 'number') {
              sum += u.price;
            }
          }
          b.expectedTotal = sum;
        }
      }
      await updateInventorySection({ data: dataToSave, token });
      setDirty(false);
      invalidateAssetsCache();
      refresh();
      alert('✓ Inventory saved successfully!');
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm('Discard all unsaved inventory changes?')) {
      setLocalInventory(JSON.parse(JSON.stringify(assets.inventory)));
      setDirty(false);
    }
  };

  // Smart bulk CSV/TSV copy-paste parser
  const handleApplyCSV = () => {
    if (!pasteText.trim()) return;

    const lines = pasteText.split(/\r?\n/);
    const updated = JSON.parse(JSON.stringify(localInventory));
    let parsedCount = 0;

    const statusMap = {
      available: 'available',
      disponible: 'available',
      blocked: 'blocked',
      bloqueado: 'blocked',
      sold: 'sold',
      vendido: 'sold',
      reserved: 'reserved',
      reservado: 'reserved',
    };

    for (const line of lines) {
      if (!line.trim()) continue;
      const parts = line.split(/[\t,;]/).map((s) => s.trim());
      if (parts.length < 2) continue;

      // Match codes like AB103, C201, D102, E101, VILLA-1
      const codePart = parts.find((p) =>
        /^(AB\d{3}|C\d{3}|D\d{3}|E\d{3}|VILLA-\d+)$/i.test(p)
      );
      if (!codePart) continue;

      const code = codePart.toUpperCase();

      // Find unit reference
      let unitRef = null;
      let cat = null;
      let idx = -1;

      // Check buildings
      for (const b of updated.buildings || []) {
        const uIdx = b.units?.findIndex((u) => u.code.toUpperCase() === code);
        if (uIdx !== undefined && uIdx !== -1) {
          unitRef = b.units[uIdx];
          cat = b.id;
          idx = uIdx;
          break;
        }
      }

      // Check villas
      if (!unitRef && updated.villas) {
        const vIdx = updated.villas.findIndex((v) => v.code.toUpperCase() === code);
        if (vIdx !== -1) {
          unitRef = updated.villas[vIdx];
          cat = 'villas';
          idx = vIdx;
        }
      }

      if (!unitRef) continue;

      // Check for status
      const statusPart = parts.find((p) => statusMap[p.toLowerCase()]);
      if (statusPart) {
        unitRef.status = statusMap[statusPart.toLowerCase()];
      }

      // Check for price
      for (const part of parts) {
        if (part === codePart || part === statusPart) continue;
        const cleanNum = part.replace(/[$,\s]/g, '');
        if (cleanNum && !isNaN(cleanNum) && !part.includes('.')) {
          const val = Math.round(Number(cleanNum));
          if (val > 1000) {
            unitRef.price = val;
          }
        } else if (
          cleanNum.toLowerCase() === 'null' ||
          cleanNum.toLowerCase() === 'bloqueado' ||
          cleanNum.toLowerCase() === '—'
        ) {
          unitRef.price = null;
        }
      }
      parsedCount++;
    }

    if (parsedCount > 0) {
      setLocalInventory(updated);
      setDirty(true);
      setPasteText('');
      setPasteOpen(false);
      alert(`✓ Parsed and applied updates for ${parsedCount} units! Review the values in the tables below, then click "Save Inventory".`);
    } else {
      alert('✗ Could not parse any valid units. Ensure the pasted data contains codes (e.g. AB103, VILLA-2) and either a status or price.');
    }
  };

  // Render categories tabs
  const tabs = [
    { id: 'edificio-ab', name: 'Edificio A-B' },
    { id: 'edificio-c', name: 'Apartamento C' },
    { id: 'edificio-d', name: 'Apartamento D' },
    { id: 'edificio-e', name: 'Apartamento E' },
    { id: 'villas', name: 'Villas' },
    { id: 'bungalows', name: 'Bungalows (Phase 2)' },
  ];

  // Get active units list
  let currentUnits = [];
  if (activeTab === 'villas') {
    currentUnits = localInventory.villas || [];
  } else if (activeTab !== 'bungalows') {
    currentUnits = localInventory.buildings?.find((b) => b.id === activeTab)?.units || [];
  }

  return (
    <div className="cms-section-body">
      {err && <p className="cms-error">{err}</p>}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <p className="cms-hint" style={{ margin: 0 }}>
          Manage real estate inventory prices and availability. Save changes to update the landing page and sitemap.
        </p>
        <button
          className="cms-btn-ghost"
          onClick={() => setPasteOpen(!pasteOpen)}
          style={{ fontSize: 13, padding: '6px 12px' }}
        >
          {pasteOpen ? 'Close Bulk Importer' : '⚡ Bulk Import CSV'}
        </button>
      </div>

      {/* Bulk Import Drawer */}
      {pasteOpen && (
        <div className="bulk-paste-drawer" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', padding: 20, marginBottom: 24, borderRadius: 4 }}>
          <h4 style={{ margin: '0 0 8px 0', fontFamily: 'Aptos Narrow, Jost', color: 'var(--white)' }}>Spreadsheet Bulk Import</h4>
          <p className="cms-hint" style={{ fontSize: 12, marginBottom: 12 }}>
            Copy columns from Excel or Google Sheets (e.g., Code, Status, Price) and paste them here. 
            The parser will look for codes (e.g., <code>AB103</code>, <code>VILLA-3</code>), statuses (e.g., <code>available/sold/blocked</code>), and numbers greater than 1000 for prices.
          </p>
          <textarea
            className="cms-textarea"
            style={{ width: '100%', height: 120, fontFamily: 'monospace', fontSize: 12, background: '#0a0a0f', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: 8, resize: 'vertical' }}
            placeholder="Example paste:&#10;AB103&#9;available&#9;$65,000&#10;C104&#9;sold&#9;93798&#10;VILLA-2&#9;blocked"
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button className="cms-btn-gold" onClick={handleApplyCSV} style={{ fontSize: 13, padding: '8px 16px' }}>Apply Pasted Data</button>
            <button className="cms-btn-ghost" onClick={() => setPasteText('')} style={{ fontSize: 13, padding: '8px 16px' }}>Clear</button>
          </div>
        </div>
      )}

      {/* Category selector */}
      <div className="cms-tabs" style={{ marginBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            className={`cms-tab${activeTab === t.id ? ' active' : ''}`}
            onClick={() => setActiveTab(t.id)}
            style={{ paddingBottom: 10 }}
          >
            <span>{t.name}</span>
          </button>
        ))}
      </div>

      {/* Tables & Inputs */}
      {activeTab === 'bungalows' ? (
        // Bungalow Aggregate Editor
        <div className="bungalows-cms-editor" style={{ maxWidth: 600, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <label className="cms-form-row" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>Aggregate Count</span>
            <input
              className="cms-input"
              type="number"
              style={{ background: '#0a0a0f', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: 10 }}
              value={localInventory.phase2?.bungalows?.count || 0}
              onChange={(e) => {
                const updated = JSON.parse(JSON.stringify(localInventory));
                updated.phase2.bungalows.count = Math.max(0, Math.round(Number(e.target.value)) || 0);
                setLocalInventory(updated);
                setDirty(true);
              }}
            />
          </label>

          <label className="cms-form-row" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>Beds per Bungalow</span>
            <input
              className="cms-input"
              type="number"
              style={{ background: '#0a0a0f', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: 10 }}
              value={localInventory.phase2?.bungalows?.beds || 0}
              onChange={(e) => {
                const updated = JSON.parse(JSON.stringify(localInventory));
                updated.phase2.bungalows.beds = Math.max(0, Math.round(Number(e.target.value)) || 0);
                setLocalInventory(updated);
                setDirty(true);
              }}
            />
          </label>

          <label className="cms-form-row" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>Audit trail note</span>
            <textarea
              className="cms-textarea"
              style={{ background: '#0a0a0f', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: 10, height: 60 }}
              value={localInventory.phase2?.bungalows?.note || ''}
              onChange={(e) => {
                const updated = JSON.parse(JSON.stringify(localInventory));
                updated.phase2.bungalows.note = e.target.value;
                setLocalInventory(updated);
                setDirty(true);
              }}
            />
          </label>
        </div>
      ) : (
        // Units Editor Table
        <div style={{ overflowX: 'auto' }}>
          <table className="inventory-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, fontFamily: 'Aptos Narrow, Jost' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', textAlign: 'left' }}>
                <th style={{ padding: 12 }}>Code</th>
                <th style={{ padding: 12 }}>Level</th>
                <th style={{ padding: 12 }}>Type</th>
                <th style={{ padding: 12 }}>Area (Int)</th>
                <th style={{ padding: 12 }}>Balcony</th>
                <th style={{ padding: 12 }}>Total</th>
                <th style={{ padding: 12 }}>Status</th>
                <th style={{ padding: 12 }}>Price (USD)</th>
                <th style={{ padding: 12 }}>Audit Notes</th>
              </tr>
            </thead>
            <tbody>
              {currentUnits.map((u, i) => (
                <tr key={u.code} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.85)' }}>
                  <td style={{ padding: 12, fontWeight: '600' }}>{u.code}</td>
                  <td style={{ padding: 12 }}>{u.level || '—'}</td>
                  <td style={{ padding: 12, textTransform: 'capitalize' }}>{u.type}</td>
                  <td style={{ padding: 12 }}>{u.areaInt} m²</td>
                  <td style={{ padding: 12 }}>{u.balcony || u.pool || 0} m²</td>
                  <td style={{ padding: 12 }}>{u.total || (u.areaInt + (u.pool || 0) + (u.jacuzzi || 0))} m²</td>
                  <td style={{ padding: 12 }}>
                    <select
                      value={u.status}
                      onChange={(e) => handleFieldChange(activeTab, i, 'status', e.target.value)}
                      style={{ background: '#0a0a0f', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '6px 10px', fontSize: 13 }}
                    >
                      <option value="available">Available</option>
                      <option value="blocked">Blocked</option>
                      <option value="sold">Sold</option>
                      <option value="reserved">Reserved</option>
                    </select>
                  </td>
                  <td style={{ padding: 12 }}>
                    <input
                      type="text"
                      placeholder="Blocked"
                      value={u.price !== null && u.price !== undefined ? u.price : ''}
                      onChange={(e) => {
                        const val = e.target.value.trim();
                        handleFieldChange(
                          activeTab,
                          i,
                          'price',
                          val === '' ? null : Number(val) || 0
                        );
                      }}
                      style={{ background: '#0a0a0f', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '6px 10px', width: 100, fontSize: 13 }}
                    />
                  </td>
                  <td style={{ padding: 12 }}>
                    <input
                      type="text"
                      placeholder="e.g. Sold on contract..."
                      value={u.note || ''}
                      onChange={(e) => handleFieldChange(activeTab, i, 'note', e.target.value)}
                      style={{ background: '#0a0a0f', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '6px 10px', width: '100%', minWidth: 160, fontSize: 13 }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Save bar */}
      {dirty && (
        <div className="cms-save-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(202,147,82,0.12)', border: '1px solid rgba(202,147,82,0.3)', padding: 16, marginTop: 24, borderRadius: 4 }}>
          <span className="cms-save-note" style={{ color: 'var(--gold)', fontWeight: '600' }}>Unsaved inventory updates present</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="cms-btn-ghost" onClick={handleReset} disabled={saving}>Reset</button>
            <button className="cms-btn-gold" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save Inventory'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
