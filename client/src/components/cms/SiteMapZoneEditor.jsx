/**
 * SiteMapZoneEditor — visual drag-and-drop editor for the interactive
 * master-plan zones. Drag a box to move it, drag the corner handle to resize,
 * click a box to edit its details, add/remove zones, then Save (persists the
 * whole zones array to the CMS).
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import SiteMapBackdrop from '../sitemap/SiteMapBackdrop.jsx';
import {
  ZONE_DEFAULTS, AVAIL, AVAIL_OPTIONS,
  VIEWBOX_W, VIEWBOX_H, MIN_W, MIN_H,
  clampZone, makeBlankZone, zoneCenter,
} from '../sitemap/zonesData.js';

const DRAG_THRESHOLD = 3; // svg units before a press counts as a drag (not a click)
const HANDLE_SIZE = 9;   // px (SVG units) for edge-handle squares

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export default function SiteMapZoneEditor({ initialZones, onSave }) {
  const [zones,    setZones]    = useState(() => (initialZones || ZONE_DEFAULTS).map(clampZone));
  const [selId,    setSelId]    = useState(null);
  const [dirty,    setDirty]    = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [err,      setErr]      = useState(null);
  const [zoom,     setZoom]     = useState(1);
  const [panX,     setPanX]     = useState(0);
  const [panY,     setPanY]     = useState(0);

  const svgRef  = useRef(null);
  const dragRef = useRef(null); // { mode, id, startPt, startZone, moved }

  // Re-sync from server when it changes — unless the admin has unsaved edits.
  const serverKey = JSON.stringify(initialZones || []);
  useEffect(() => {
    if (dirty) return;
    setZones((initialZones || ZONE_DEFAULTS).map(clampZone));
  }, [serverKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const selected = zones.find(z => z.id === selId) || null;

  // ── Coordinate conversion: client px → SVG units ──
  const toSvg = useCallback((clientX, clientY) => {
    const r = svgRef.current.getBoundingClientRect();
    const vw = VIEWBOX_W / zoom;
    const vh = VIEWBOX_H / zoom;
    return {
      x: panX + (clientX - r.left) * (vw / r.width),
      y: panY + (clientY - r.top)  * (vh / r.height),
    };
  }, [zoom, panX, panY]);

  const patchZone = (id, patch) =>
    setZones(zs => zs.map(z => z.id === id ? clampZone({ ...z, ...patch }) : z));

  // ── Pointer drag (move + resize) — listeners live on window so the drag
  //    survives the pointer leaving the box; dragRef gates them. ──
  useEffect(() => {
    function onMove(e) {
      const d = dragRef.current;
      if (!d) return;

      if (d.mode === 'pan') {
        const px = Math.abs(e.clientX - d.startClientX) + Math.abs(e.clientY - d.startClientY);
        if (px < 5) return;
        d.moved = true;
        const r = svgRef.current.getBoundingClientRect();
        const vw = VIEWBOX_W / d.zoomSnap;
        const vh = VIEWBOX_H / d.zoomSnap;
        const dsx = (e.clientX - d.startClientX) * (vw / r.width);
        const dsy = (e.clientY - d.startClientY) * (vh / r.height);
        setPanX(Math.max(0, Math.min(VIEWBOX_W - vw, d.startPanX - dsx)));
        setPanY(Math.max(0, Math.min(VIEWBOX_H - vh, d.startPanY - dsy)));
        return;
      }

      const p = toSvg(e.clientX, e.clientY);
      // Click-vs-drag: ignore tiny movement. On the frame the drag activates,
      // rebase the origin to the threshold-crossing point so the box starts
      // tracking smoothly from there (no initial lurch).
      if (!d.moved) {
        if (Math.abs(p.x - d.startPt.x) + Math.abs(p.y - d.startPt.y) <= DRAG_THRESHOLD) return;
        d.moved = true;
        d.startPt = p;
      }
      const dx = p.x - d.startPt.x;
      const dy = p.y - d.startPt.y;

      if (d.mode === 'move') {
        patchZone(d.id, { x: d.startZone.x + dx, y: d.startZone.y + dy });
      } else if (d.mode === 'resize-right') {
        patchZone(d.id, { w: Math.max(MIN_W, Math.min(d.startZone.w + dx, VIEWBOX_W - d.startZone.x)) });
      } else if (d.mode === 'resize-bottom') {
        patchZone(d.id, { h: Math.max(MIN_H, Math.min(d.startZone.h + dy, VIEWBOX_H - d.startZone.y)) });
      } else if (d.mode === 'resize-left') {
        const newW = Math.max(MIN_W, d.startZone.w - dx);
        patchZone(d.id, { x: d.startZone.x + d.startZone.w - newW, w: newW });
      } else if (d.mode === 'resize-top') {
        const newH = Math.max(MIN_H, d.startZone.h - dy);
        patchZone(d.id, { y: d.startZone.y + d.startZone.h - newH, h: newH });
      }
      setDirty(true);
    }
    function onUp() {
      const d = dragRef.current;
      if (d?.mode === 'pan' && !d.moved) setSelId(null);
      dragRef.current = null;
    }
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [toSvg]); // eslint-disable-line react-hooks/exhaustive-deps

  function startDrag(e, id, mode) {
    if (saving) return; // don't mutate while a save is in flight (avoids lost updates)
    e.stopPropagation();
    e.preventDefault();
    const z = zones.find(zz => zz.id === id);
    if (!z) return;
    setSelId(id);
    dragRef.current = {
      mode, id,
      startPt: toSvg(e.clientX, e.clientY),
      startZone: { x: z.x, y: z.y, w: z.w, h: z.h },
      moved: false,
    };
  }

  // ── Zone CRUD (blocked while saving to avoid losing in-flight edits) ──
  function addZone() {
    if (saving) return;
    const z = makeBlankZone(zones.map(zz => zz.id));
    setZones(zs => [...zs, z]);
    setSelId(z.id);
    setDirty(true);
  }
  function deleteZone(id) {
    if (saving) return;
    setZones(zs => zs.filter(z => z.id !== id));
    if (selId === id) setSelId(null);
    setDirty(true);
  }
  function editField(field, value) {
    if (saving || !selId) return;
    patchZone(selId, { [field]: value });
    setDirty(true);
  }

  async function save() {
    setSaving(true); setErr(null);
    try {
      // strip any transient fields, keep clean geometry
      const clean = zones.map(clampZone);
      await onSave(clean);
      setZones(clean);
      setDirty(false);
    } catch (e) { setErr(e.message || 'Save failed'); }
    finally { setSaving(false); }
  }
  function reset() {
    setZones((initialZones || ZONE_DEFAULTS).map(clampZone));
    setSelId(null);
    setDirty(false);
    setErr(null);
  }

  function startSvgBg(e) {
    dragRef.current = {
      mode: 'pan',
      startClientX: e.clientX,
      startClientY: e.clientY,
      startPanX: panX,
      startPanY: panY,
      zoomSnap: zoom,
      moved: false,
    };
  }

  function handleWheel(e) {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
    const newZoom = Math.max(1, Math.min(6, zoom * factor));
    if (newZoom === zoom) return;
    const r = svgRef.current.getBoundingClientRect();
    const vw = VIEWBOX_W / zoom;
    const vh = VIEWBOX_H / zoom;
    const svgCX = panX + (e.clientX - r.left) * (vw / r.width);
    const svgCY = panY + (e.clientY - r.top)  * (vh / r.height);
    const newVW = VIEWBOX_W / newZoom;
    const newVH = VIEWBOX_H / newZoom;
    setPanX(Math.max(0, Math.min(VIEWBOX_W - newVW, svgCX - (e.clientX - r.left) * (newVW / r.width))));
    setPanY(Math.max(0, Math.min(VIEWBOX_H - newVH, svgCY - (e.clientY - r.top)  * (newVH / r.height))));
    setZoom(newZoom);
  }

  function applyZoom(newZoom) {
    const vw = VIEWBOX_W / zoom;
    const vh = VIEWBOX_H / zoom;
    const cx = panX + vw / 2;
    const cy = panY + vh / 2;
    const newVW = VIEWBOX_W / newZoom;
    const newVH = VIEWBOX_H / newZoom;
    if (newZoom === 1) { setPanX(0); setPanY(0); }
    else {
      setPanX(Math.max(0, Math.min(VIEWBOX_W - newVW, cx - newVW / 2)));
      setPanY(Math.max(0, Math.min(VIEWBOX_H - newVH, cy - newVH / 2)));
    }
    setZoom(newZoom);
  }

  return (
    <div className="zone-editor">
      <p className="cms-hint">
        Drag a box to move it, drag an edge handle to resize, or click a box to edit its details.
        Use <strong>+ Add Zone</strong> to create a new one. Changes go live after you save.
      </p>
      {err && <p className="cms-error">{err}</p>}

      <div className="zone-editor-body">
        {/* ── Editable map canvas ── */}
        <div className="zone-canvas-wrap">
          <svg
            ref={svgRef}
            className="zone-canvas"
            viewBox={`${panX} ${panY} ${VIEWBOX_W / zoom} ${VIEWBOX_H / zoom}`}
            xmlns="http://www.w3.org/2000/svg"
            onPointerDown={startSvgBg}
            onWheel={handleWheel}
            style={{ cursor: zoom > 1 ? 'grab' : 'default' }}
          >
            <SiteMapBackdrop idPrefix="edit" />

            {zones.map(z => {
              const col = AVAIL[z.availability] || AVAIL.available;
              const isSel = z.id === selId;
              const { cx, cy } = zoneCenter(z);
              const H = HANDLE_SIZE / 2;

              const strokeCol  = z.borderColor || (isSel ? '#C9A84C' : col.stroke);
              const fillCol    = z.fillColor ? hexToRgba(z.fillColor, 0.22) : col.fill;
              const bw         = z.borderWidth != null ? z.borderWidth : (isSel ? 3 : 1.5);

              return (
                <g key={z.id}>
                  <rect
                    x={z.x} y={z.y} width={z.w} height={z.h}
                    fill={fillCol}
                    stroke={strokeCol}
                    strokeWidth={bw}
                    className={isSel ? 'zone-sel-border' : undefined}
                    style={{ cursor: 'move' }}
                    onPointerDown={(e) => startDrag(e, z.id, 'move')}
                  />
                  <text
                    x={cx} y={cy - 4} textAnchor="middle"
                    fill={isSel ? '#C9A84C' : 'rgba(255,255,255,.75)'}
                    fontSize="8.5" fontFamily="Jost, sans-serif" fontWeight="500"
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  >
                    {z.icon} {z.label}
                  </text>
                  <text
                    x={cx} y={cy + 8} textAnchor="middle"
                    fill="rgba(201,168,76,.5)" fontSize="6.5" fontFamily="Jost, sans-serif"
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  >
                    Phase {z.phase}
                  </text>

                  {/* 4 edge handles — only on selected zone */}
                  {isSel && <>
                    <rect x={cx - H} y={z.y - H} width={HANDLE_SIZE} height={HANDLE_SIZE}
                      fill="#C9A84C" stroke="#0A1A22" strokeWidth="1.5"
                      style={{ cursor: 'ns-resize' }}
                      onPointerDown={e => startDrag(e, z.id, 'resize-top')} />
                    <rect x={z.x + z.w - H} y={cy - H} width={HANDLE_SIZE} height={HANDLE_SIZE}
                      fill="#C9A84C" stroke="#0A1A22" strokeWidth="1.5"
                      style={{ cursor: 'ew-resize' }}
                      onPointerDown={e => startDrag(e, z.id, 'resize-right')} />
                    <rect x={cx - H} y={z.y + z.h - H} width={HANDLE_SIZE} height={HANDLE_SIZE}
                      fill="#C9A84C" stroke="#0A1A22" strokeWidth="1.5"
                      style={{ cursor: 'ns-resize' }}
                      onPointerDown={e => startDrag(e, z.id, 'resize-bottom')} />
                    <rect x={z.x - H} y={cy - H} width={HANDLE_SIZE} height={HANDLE_SIZE}
                      fill="#C9A84C" stroke="#0A1A22" strokeWidth="1.5"
                      style={{ cursor: 'ew-resize' }}
                      onPointerDown={e => startDrag(e, z.id, 'resize-left')} />
                  </>}
                </g>
              );
            })}
          </svg>

          <div className="zone-canvas-toolbar">
            <button className="cms-btn-gold" onClick={addZone}>+ Add Zone</button>
            <span className="zone-count">{zones.length} zones</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto' }}>
              <button className="cms-btn-ghost" style={{ padding: '4px 10px', fontSize: 16, lineHeight: 1 }}
                onClick={() => applyZoom(Math.max(1, zoom / 1.4))} disabled={zoom <= 1}>−</button>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,.6)', minWidth: 42, textAlign: 'center' }}>
                {Math.round(zoom * 100)}%
              </span>
              <button className="cms-btn-ghost" style={{ padding: '4px 10px', fontSize: 16, lineHeight: 1 }}
                onClick={() => applyZoom(Math.min(6, zoom * 1.4))} disabled={zoom >= 6}>+</button>
              {zoom > 1 && (
                <button className="cms-btn-ghost" style={{ padding: '4px 10px', fontSize: 12 }}
                  onClick={() => applyZoom(1)}>Reset</button>
              )}
            </div>
          </div>
        </div>

        {/* ── Edit panel ── */}
        <div className="zone-edit-panel">
          {!selected ? (
            <div className="zone-edit-empty">
              <div className="zone-edit-empty-icon">🗺</div>
              <p>Click a box on the map to edit its name, price, availability and details — or drag it to reposition.</p>
              <div className="zone-pill-list">
                {zones.map(z => (
                  <button key={z.id} className="zone-pill" onClick={() => setSelId(z.id)}>
                    <span style={{ color: AVAIL[z.availability]?.badge }}>{z.icon}</span> {z.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="zone-edit-form">
              <div className="zone-edit-head">
                <span className="zone-edit-title">{selected.icon} {selected.label}</span>
                <button className="cms-btn-danger" onClick={() => deleteZone(selected.id)}>Delete</button>
              </div>

              <label className="zone-field">
                <span>Name</span>
                <input type="text" value={selected.label} onChange={e => editField('label', e.target.value)} />
              </label>
              <label className="zone-field">
                <span>Type</span>
                <input type="text" value={selected.type} onChange={e => editField('type', e.target.value)} />
              </label>
              <div className="zone-field-row">
                <label className="zone-field">
                  <span>Icon</span>
                  <input type="text" value={selected.icon} maxLength={4} onChange={e => editField('icon', e.target.value)} />
                </label>
                <label className="zone-field">
                  <span>Phase</span>
                  <input type="number" min="1" value={selected.phase} onChange={e => editField('phase', Math.max(1, Math.round(Number(e.target.value)) || 1))} />
                </label>
              </div>
              <label className="zone-field">
                <span>Availability</span>
                <select value={selected.availability} onChange={e => editField('availability', e.target.value)}>
                  {AVAIL_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </label>
              <div className="zone-field-row">
                <label className="zone-field">
                  <span>Border Color</span>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <input type="color"
                      value={selected.borderColor || '#C9A84C'}
                      onChange={e => editField('borderColor', e.target.value)}
                      style={{ width: 40, height: 28, padding: 2, cursor: 'pointer', background: 'none', border: '1px solid rgba(255,255,255,.2)', borderRadius: 4 }}
                    />
                    {selected.borderColor && <button className="cms-btn-ghost" style={{ padding: '2px 8px', fontSize: 11 }} onClick={() => editField('borderColor', '')}>Reset</button>}
                  </div>
                </label>
                <label className="zone-field">
                  <span>Fill Color</span>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <input type="color"
                      value={selected.fillColor || '#1A6B8A'}
                      onChange={e => editField('fillColor', e.target.value)}
                      style={{ width: 40, height: 28, padding: 2, cursor: 'pointer', background: 'none', border: '1px solid rgba(255,255,255,.2)', borderRadius: 4 }}
                    />
                    {selected.fillColor && <button className="cms-btn-ghost" style={{ padding: '2px 8px', fontSize: 11 }} onClick={() => editField('fillColor', '')}>Reset</button>}
                  </div>
                </label>
                <label className="zone-field">
                  <span>Border Width</span>
                  <input type="number" min="0.5" max="10" step="0.5"
                    value={selected.borderWidth ?? 1.5}
                    onChange={e => editField('borderWidth', parseFloat(e.target.value) || 1.5)}
                  />
                </label>
              </div>

              <label className="zone-field">
                <span>Price <em>(blank = amenity, no enquiry)</em></span>
                <input type="text" placeholder="From $000,000" value={selected.price} onChange={e => editField('price', e.target.value)} />
              </label>
              <div className="zone-field-row">
                <label className="zone-field">
                  <span>Units (text)</span>
                  <input type="text" placeholder="Studio – 3BR" value={selected.beds} onChange={e => editField('beds', e.target.value)} />
                </label>
                <label className="zone-field">
                  <span>Area</span>
                  <input type="text" placeholder="222 m²" value={selected.area} onChange={e => editField('area', e.target.value)} />
                </label>
              </div>
              <label className="zone-field">
                <span>Total Units (number)</span>
                <input type="text" placeholder="24" value={selected.units} onChange={e => editField('units', e.target.value)} />
              </label>

              <label className="zone-field">
                <span>Inventory Mapping (dynamic drill-down)</span>
                <select value={selected.inventoryId || ''} onChange={e => editField('inventoryId', e.target.value)}>
                  <option value="">(None / Static card)</option>
                  <option value="villas">Villas (VILLA-1 to VILLA-8)</option>
                  <option value="edificio-ab">Edificio A-B (48 units)</option>
                  <option value="edificio-c">Apartamento C (16 units)</option>
                  <option value="edificio-d">Apartamento D (8 units)</option>
                  <option value="edificio-e">Apartamento E (8 units)</option>
                  <option value="bungalows">Bungalows (5 units)</option>
                </select>
              </label>

              {/* Fine-tune geometry numerically */}
              <div className="zone-geom">
                <span className="zone-geom-label">Position & size</span>
                <div className="zone-geom-grid">
                  {['x', 'y', 'w', 'h'].map(k => (
                    <label key={k} className="zone-geom-field">
                      <span>{k.toUpperCase()}</span>
                      <input type="number" value={selected[k]}
                        onChange={e => editField(k, Number(e.target.value) || 0)} />
                    </label>
                  ))}
                </div>
              </div>

              <button className="cms-btn-ghost zone-deselect" onClick={() => setSelId(null)}>Done editing</button>
            </div>
          )}
        </div>
      </div>

      {/* Save bar */}
      {dirty && (
        <div className="cms-save-bar">
          <span className="cms-save-note">Unsaved zone changes</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="cms-btn-ghost" onClick={reset} disabled={saving}>Reset</button>
            <button className="cms-btn-gold" onClick={save} disabled={saving}>
              {saving ? 'Saving…' : 'Save Zone Map'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
