/**
 * CmsPanel — full asset management for all website sections.
 * Embedded inside the Dashboard (requires admin token).
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import { useAssets, invalidateAssetsCache } from '../../hooks/useAssets.js';
import SiteMapZoneEditor from './SiteMapZoneEditor.jsx';

// ── Constants ─────────────────────────────────────────────────────────────────

// Must match the order of property cards in translations (en.js / es.js → properties.items)
const PROPERTY_NAMES = [
  'Villas', 'Suites & Apartments', 'Apartments', 'Premium 2BR', 'Beachfront Bungalows',
];

const GALLERY_CATS = ['Exterior', 'Interior', 'Amenities'];

const SECTIONS = [
  { id: 'hero',       label: '🎬 Hero',       desc: 'Hero background image' },
  { id: 'about',      label: '🏠 About',      desc: 'Main & accent images' },
  { id: 'properties', label: '🏗 Properties', desc: 'Images & prices' },
  { id: 'gallery',    label: '🖼 Gallery',    desc: 'Add / remove gallery photos' },
  { id: 'lounge',     label: '🍹 Lounge',     desc: 'Club lounge 2×2 grid' },
  { id: 'sitemap',    label: '🗺 Site Map',   desc: 'Plan image & PDF downloads' },
];

// ── Shared upload helper ──────────────────────────────────────────────────────

async function uploadFile({ file, section, slot, label, cat, token }) {
  const fd = new FormData();
  fd.append('file', file);
  if (label) fd.append('label', label);
  if (cat)   fd.append('cat',   cat);
  const url = `/api/cms/assets/${section}${slot != null ? `/${slot}` : ''}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: fd,
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.error || 'Upload failed');
  }
  return res.json();
}

async function deleteAsset({ section, filePath, slot, propIdx, imgIdx, token }) {
  const body = { path: filePath, slot };
  if (propIdx != null) body.propIdx = propIdx;
  if (imgIdx  != null) body.imgIdx  = imgIdx;
  const res = await fetch(`/api/cms/assets/${section}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.error || 'Delete failed');
  }
  return res.json();
}

// Replace a whole section's data (used for non-file content like prices)
async function patchSection({ section, data, token }) {
  const res = await fetch('/api/cms/assets', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ section, data }),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.error || 'Update failed');
  }
  return res.json();
}

// ── Sub-components ────────────────────────────────────────────────────────────

/** Single asset thumbnail with overlay delete / replace button */
function AssetThumb({ src, label, onDelete, onReplace, replacing }) {
  const fileRef = useRef();
  const isVideo = src && /\.(mp4|webm|mov)$/i.test(src);

  return (
    <div className="cms-thumb">
      {src ? (
        isVideo ? (
          <video src={src} className="cms-thumb-img" muted playsInline preload="metadata" />
        ) : (
          <img src={src} alt={label || ''} className="cms-thumb-img" loading="lazy" />
        )
      ) : (
        <div className="cms-thumb-empty">
          <span>No image</span>
        </div>
      )}

      {replacing && (
        <div className="cms-thumb-uploading">
          <span>Uploading</span>
          <div className="cms-wave-container">
            <div className="cms-wave-progress" />
          </div>
          <div className="cms-fluid-wave-bg">
            <div className="cms-fluid-wave" />
            <div className="cms-fluid-wave-2" />
          </div>
        </div>
      )}

      <div className="cms-thumb-overlay">
        {onReplace && (
          <>
            <button
              className="cms-thumb-btn"
              onClick={() => fileRef.current?.click()}
              disabled={replacing}
              title="Replace"
            >
              {replacing ? '…' : '↺ Replace'}
            </button>
            <input ref={fileRef} type="file" accept="image/*,video/mp4,video/webm"
              style={{ display: 'none' }}
              onChange={e => { if (e.target.files[0]) onReplace(e.target.files[0]); }} />
          </>
        )}
        {onDelete && (
          <button className="cms-thumb-btn cms-thumb-del" onClick={onDelete} title="Remove">
            ✕ Remove
          </button>
        )}
      </div>
      {label && <p className="cms-thumb-label">{label}</p>}
    </div>
  );
}

/** Hero section — video + poster slots */
function HeroSection({ assets, token, refresh }) {
  const [busy, setBusy]   = useState({});
  const [err,  setErr]    = useState(null);
  const fileRef           = useRef({});

  async function handleUpload(slot, file) {
    setBusy(b => ({ ...b, [slot]: true }));
    setErr(null);
    try {
      await uploadFile({ file, section: 'hero', slot, token });
      invalidateAssetsCache();
      refresh();
    } catch (e) { setErr(e.message); }
    finally { setBusy(b => ({ ...b, [slot]: false })); }
  }

  async function handleDelete(slot) {
    if (!confirm('Remove this asset?')) return;
    setBusy(b => ({ ...b, [slot]: true }));
    setErr(null);
    try {
      await deleteAsset({ section: 'hero', slot, token });
      invalidateAssetsCache();
      refresh();
    } catch (e) { setErr(e.message); }
    finally { setBusy(b => ({ ...b, [slot]: false })); }
  }

  const slots = [
    { key: 'poster', label: 'Hero Image', accept: 'image/*' },
    { key: 'video',  label: 'Background Video (legacy / unused)', accept: 'video/mp4,video/webm' },
  ];

  return (
    <div className="cms-section-body">
      {err && <p className="cms-error">{err}</p>}
      <div className="cms-slot-grid">
        {slots.map(({ key, label, accept }) => (
          <div key={key} className="cms-slot">
            <p className="cms-slot-label">{label}</p>
            <AssetThumb
              src={assets?.hero?.[key]}
              label={key === 'video' ? assets?.hero?.video || 'No video set' : ''}
              replacing={busy[key]}
              onReplace={file => handleUpload(key, file)}
              onDelete={assets?.hero?.[key] ? () => handleDelete(key) : null}
            />
            <label className={`cms-upload-btn${busy[key] ? ' loading' : ''}`}>
              {busy[key] ? 'Uploading…' : `+ Upload ${label}`}
              <input type="file" accept={accept} style={{ display: 'none' }}
                onChange={e => { if (e.target.files[0]) handleUpload(key, e.target.files[0]); }} />
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}

/** About section — main + accent image slots */
function AboutSection({ assets, token, refresh }) {
  const [busy, setBusy] = useState({});
  const [err,  setErr]  = useState(null);

  async function handleUpload(slot, file) {
    setBusy(b => ({ ...b, [slot]: true })); setErr(null);
    try {
      await uploadFile({ file, section: 'about', slot, token });
      invalidateAssetsCache(); refresh();
    } catch (e) { setErr(e.message); }
    finally { setBusy(b => ({ ...b, [slot]: false })); }
  }

  async function handleDelete(slot) {
    if (!confirm('Remove this image?')) return;
    setBusy(b => ({ ...b, [slot]: true })); setErr(null);
    try {
      await deleteAsset({ section: 'about', slot, token });
      invalidateAssetsCache(); refresh();
    } catch (e) { setErr(e.message); }
    finally { setBusy(b => ({ ...b, [slot]: false })); }
  }

  const slots = [
    { key: 'main',   label: 'Main Image (large)' },
    { key: 'accent', label: 'Accent Image (small overlay)' },
  ];

  return (
    <div className="cms-section-body">
      {err && <p className="cms-error">{err}</p>}
      <div className="cms-slot-grid">
        {slots.map(({ key, label }) => (
          <div key={key} className="cms-slot">
            <p className="cms-slot-label">{label}</p>
            <AssetThumb
              src={assets?.about?.[key]}
              replacing={busy[key]}
              onReplace={file => handleUpload(key, file)}
              onDelete={assets?.about?.[key] ? () => handleDelete(key) : null}
            />
            <label className={`cms-upload-btn${busy[key] ? ' loading' : ''}`}>
              {busy[key] ? 'Uploading…' : `+ Upload ${label}`}
              <input type="file" accept="image/*" style={{ display: 'none' }}
                onChange={e => { if (e.target.files[0]) handleUpload(key, e.target.files[0]); }} />
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Properties section — multi-image gallery per property, fully CMS-managed */
function PropertiesSection({ assets, token, refresh }) {
  // busy key: `${propIdx}` for add-upload, `${propIdx}-${imgIdx}` for replace, `del-${propIdx}-${imgIdx}` for delete
  const [busy,        setBusy]        = useState({});
  const [err,         setErr]         = useState(null);
  const [prices,      setPrices]      = useState(() =>
    (assets?.propertyPrices || Array(5).fill(''))
  );
  const [priceSaving, setPriceSaving] = useState(false);
  const [priceSaved,  setPriceSaved]  = useState(false);

  // Sync local price state when assets reload from server
  useEffect(() => {
    setPrices(assets?.propertyPrices || Array(5).fill(''));
  }, [assets?.propertyPrices]);

  const setBusyKey = (key, val) => setBusy(b => ({ ...b, [key]: val }));

  async function savePrice(propIdx) {
    setPriceSaving(true); setErr(null);
    try {
      const next = [...prices];
      await patchSection({ section: 'propertyPrices', data: next, token });
      invalidateAssetsCache(); refresh();
      setPriceSaved(true);
      setTimeout(() => setPriceSaved(false), 2000);
    } catch (e) { setErr(e.message); }
    finally { setPriceSaving(false); }
  }

  async function handleAdd(propIdx, file) {
    const key = `${propIdx}`;
    setBusyKey(key, true); setErr(null);
    try {
      await uploadFile({ file, section: 'propertyImages', slot: propIdx, token });
      invalidateAssetsCache(); refresh();
    } catch (e) { setErr(e.message); }
    finally { setBusyKey(key, false); }
  }

  async function handleReplace(propIdx, imgIdx, file) {
    const key = `${propIdx}-${imgIdx}`;
    setBusyKey(key, true); setErr(null);
    try {
      await uploadFile({ file, section: 'propertyImages', slot: `${propIdx}-${imgIdx}`, token });
      invalidateAssetsCache(); refresh();
    } catch (e) { setErr(e.message); }
    finally { setBusyKey(key, false); }
  }

  async function handleDelete(propIdx, imgIdx, name) {
    if (!confirm(`Remove image ${imgIdx + 1} from ${name}?`)) return;
    const key = `del-${propIdx}-${imgIdx}`;
    setBusyKey(key, true); setErr(null);
    try {
      await deleteAsset({ section: 'propertyImages', propIdx, imgIdx, token });
      invalidateAssetsCache(); refresh();
    } catch (e) { setErr(e.message); }
    finally { setBusyKey(key, false); }
  }

  const getComputedPrice = (idx) => {
    const inv = assets?.inventory;
    if (!inv) return 'Loading...';
    let units = [];
    if (idx === 0) {
      units = inv.villas || [];
    } else if (idx === 1) {
      units = inv.buildings?.find(b => b.id === 'edificio-ab')?.units || [];
    } else if (idx === 2) {
      units = inv.buildings?.find(b => b.id === 'edificio-c')?.units || [];
    } else if (idx === 3) {
      const bD = inv.buildings?.find(b => b.id === 'edificio-d')?.units || [];
      const bE = inv.buildings?.find(b => b.id === 'edificio-e')?.units || [];
      units = [...bD, ...bE];
    } else {
      return 'Coming Soon (Phase 2)';
    }
    const available = units.filter(u => u.status === 'available' && typeof u.price === 'number');
    if (!available.length) return 'Sold Out';
    const min = Math.min(...available.map(u => u.price));
    return `From $${min.toLocaleString()}`;
  };

  return (
    <div className="cms-section-body">
      {err && <p className="cms-error">{err}</p>}
      <p className="cms-hint">
        Manage all images for each property. The <strong>first image</strong> is used as the card thumbnail.
        All images appear in the lightbox gallery when a visitor clicks the property photo.
        Starting prices are calculated dynamically from the active unit inventory.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        {PROPERTY_NAMES.map((name, propIdx) => {
          const imgs = (assets?.propertyImages?.[propIdx] || []).filter(Boolean);
          const addBusy = busy[`${propIdx}`];

          return (
            <div key={propIdx} className="cms-prop-block">
              {/* Header row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <span className="cms-slot-label" style={{ margin: 0 }}>{name}</span>
                  <span style={{ marginLeft: 12, fontSize: 11, color: 'rgba(255,255,255,.4)' }}>
                    {imgs.length} image{imgs.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,.4)' }}>Price override:</span>
                  <input
                    type="text"
                    placeholder={getComputedPrice(propIdx)}
                    value={prices[propIdx] || ''}
                    onChange={e => {
                      const next = [...prices];
                      next[propIdx] = e.target.value;
                      setPrices(next);
                    }}
                    style={{
                      background: 'rgba(201,168,76,.08)', border: '1px solid rgba(201,168,76,.3)',
                      borderRadius: 4, color: '#C9A84C', fontSize: 12, padding: '4px 8px',
                      width: 150, outline: 'none',
                    }}
                  />
                  <button
                    onClick={() => savePrice(propIdx)}
                    disabled={priceSaving}
                    style={{
                      background: priceSaved ? 'rgba(80,200,80,.15)' : 'rgba(201,168,76,.15)',
                      border: `1px solid ${priceSaved ? 'rgba(80,200,80,.4)' : 'rgba(201,168,76,.4)'}`,
                      borderRadius: 4, color: priceSaved ? '#6fdb6f' : '#C9A84C',
                      fontSize: 11, padding: '4px 10px', cursor: priceSaving ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {priceSaving ? '…' : priceSaved ? 'Saved ✓' : 'Save'}
                  </button>
                </div>
              </div>

              {/* Image strip */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-start' }}>
                {imgs.map((src, imgIdx) => (
                  <div key={imgIdx} style={{ position: 'relative', width: 140 }}>
                    {imgIdx === 0 && (
                      <span style={{
                        position: 'absolute', top: 4, left: 4, zIndex: 2,
                        background: '#C9A84C', color: '#000', fontSize: 9,
                        fontWeight: 700, letterSpacing: '.06em', padding: '2px 6px',
                        borderRadius: 2, textTransform: 'uppercase',
                      }}>Hero</span>
                    )}
                    <AssetThumb
                      src={src}
                      replacing={busy[`${propIdx}-${imgIdx}`]}
                      onReplace={file => handleReplace(propIdx, imgIdx, file)}
                      onDelete={() => handleDelete(propIdx, imgIdx, name)}
                    />
                    {busy[`del-${propIdx}-${imgIdx}`] && (
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>
                        Removing…
                      </div>
                    )}
                  </div>
                ))}

                {/* Add new image slot */}
                <label style={{
                  width: 140, height: 100, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 6,
                  border: '1.5px dashed rgba(201,168,76,.35)', borderRadius: 4,
                  cursor: addBusy ? 'not-allowed' : 'pointer',
                  color: addBusy ? 'rgba(255,255,255,.3)' : 'rgba(201,168,76,.7)',
                  fontSize: 11, background: 'rgba(201,168,76,.04)', transition: 'border-color .2s',
                }}>
                  <span style={{ fontSize: 22, lineHeight: 1 }}>{addBusy ? '…' : '+'}</span>
                  <span>{addBusy ? 'Uploading…' : 'Add Image'}</span>
                  <input type="file" accept="image/*" style={{ display: 'none' }} disabled={addBusy}
                    onChange={e => { if (e.target.files[0]) handleAdd(propIdx, e.target.files[0]); }} />
                </label>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Gallery section — drag-and-drop multi-upload + bulk delete */
let _queueId = 0;

function GallerySection({ assets, token, refresh }) {
  const [queue,      setQueue]      = useState([]);   // pending files awaiting upload
  const [uploading,  setUploading]  = useState(false);
  const [delBusy,    setDelBusy]     = useState({});
  const [err,        setErr]        = useState(null);
  const [filter,     setFilter]     = useState('All');
  const [dragOver,   setDragOver]   = useState(false);
  const [defaultCat, setDefaultCat] = useState('Exterior');
  const [selectMode, setSelectMode] = useState(false);
  const [selected,   setSelected]   = useState(() => new Set());
  const [confirmDel, setConfirmDel] = useState(null); // src pending single-delete confirm
  const fileRef = useRef();

  const gallery = assets?.gallery || [];
  const visible = filter === 'All' ? gallery : gallery.filter(img => img.cat === filter);

  // Revoke object URLs on unmount
  useEffect(() => () => { queue.forEach(q => URL.revokeObjectURL(q.preview)); }, []); // eslint-disable-line

  // ── Add files to the pending queue ──
  const addFiles = useCallback((fileList) => {
    const imgs = Array.from(fileList).filter(f => /\.(jpe?g|png|webp|gif)$/i.test(f.name));
    if (!imgs.length) return;
    setErr(null);
    setQueue(q => [
      ...q,
      ...imgs.map(f => ({
        id: ++_queueId,
        file: f,
        preview: URL.createObjectURL(f),
        label: f.name.replace(/\.[^.]+$/, ''),
        cat: defaultCat,
      })),
    ]);
  }, [defaultCat]);

  const updateQueueItem = (id, patch) =>
    setQueue(q => q.map(item => item.id === id ? { ...item, ...patch } : item));

  const removeQueueItem = (id) =>
    setQueue(q => {
      const item = q.find(i => i.id === id);
      if (item) URL.revokeObjectURL(item.preview);
      return q.filter(i => i.id !== id);
    });

  const clearQueue = () =>
    setQueue(q => { q.forEach(i => URL.revokeObjectURL(i.preview)); return []; });

  // ── Drag handlers ──
  const onDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  };

  // ── Upload the whole queue sequentially (flat-file store can't take parallel writes) ──
  async function uploadQueue() {
    if (!queue.length) return;
    setUploading(true); setErr(null);
    try {
      for (const item of queue) {
        await uploadFile({
          file: item.file, section: 'gallery',
          label: item.label.trim() || item.file.name.replace(/\.[^.]+$/, ''),
          cat: item.cat, token,
        });
      }
      clearQueue();
      invalidateAssetsCache(); refresh();
    } catch (ex) {
      setErr(`Upload failed: ${ex.message}`);
    } finally {
      setUploading(false);
    }
  }

  // ── Delete ──
  async function doDelete(src) {
    setConfirmDel(null);
    setDelBusy(b => ({ ...b, [src]: true })); setErr(null);
    try {
      await deleteAsset({ section: 'gallery', filePath: src, token });
      invalidateAssetsCache(); refresh();
    } catch (e) { setErr(e.message); }
    finally { setDelBusy(b => ({ ...b, [src]: false })); }
  }

  async function doBulkDelete() {
    const srcs = [...selected];
    setErr(null);
    setDelBusy(b => { const n = { ...b }; srcs.forEach(s => n[s] = true); return n; });
    try {
      for (const src of srcs) {
        await deleteAsset({ section: 'gallery', filePath: src, token });
      }
      setSelected(new Set());
      setSelectMode(false);
      invalidateAssetsCache(); refresh();
    } catch (e) {
      setErr(`Bulk delete failed: ${e.message}`);
    } finally {
      setDelBusy(b => { const n = { ...b }; srcs.forEach(s => delete n[s]); return n; });
    }
  }

  const toggleSelect = (src) =>
    setSelected(s => { const n = new Set(s); n.has(src) ? n.delete(src) : n.add(src); return n; });

  const selectAllVisible = () => setSelected(new Set(visible.map(i => i.src)));

  return (
    <div className="cms-section-body">
      {/* ── Drag & drop upload zone ── */}
      <div
        className={`cms-dropzone${dragOver ? ' drag-over' : ''}`}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={e => { e.preventDefault(); setDragOver(false); }}
        onDrop={onDrop}
        onClick={() => fileRef.current?.click()}
      >
        <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }}
          onChange={e => { addFiles(e.target.files); e.target.value = ''; }} />
        <div className="cms-dropzone-icon">⬆</div>
        <p className="cms-dropzone-title">
          {dragOver ? 'Drop images to add' : 'Drag & drop images here'}
        </p>
        <p className="cms-dropzone-sub">or click to browse · JPG, PNG, WebP, GIF · multiple allowed</p>
        <div className="cms-dropzone-cat" onClick={e => e.stopPropagation()}>
          <span>New images go to:</span>
          {GALLERY_CATS.map(c => (
            <button key={c}
              className={`cms-catpick${defaultCat === c ? ' active' : ''}`}
              onClick={() => setDefaultCat(c)}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {err && <p className="cms-error">{err}</p>}

      {/* ── Pending upload queue (preview before commit) ── */}
      {queue.length > 0 && (
        <div className="cms-queue">
          <div className="cms-queue-head">
            <span className="cms-queue-title">{queue.length} image{queue.length > 1 ? 's' : ''} ready to upload</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="cms-btn-ghost" onClick={clearQueue} disabled={uploading}>Clear</button>
              <button className="cms-btn-gold" onClick={uploadQueue} disabled={uploading}>
                {uploading ? 'Uploading…' : `Upload ${queue.length} image${queue.length > 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
          <div className="cms-queue-grid">
            {queue.map(item => (
              <div key={item.id} className="cms-queue-item">
                <div className="cms-queue-thumb">
                  <img src={item.preview} alt="" />
                  {!uploading ? (
                    <button className="cms-queue-remove" onClick={() => removeQueueItem(item.id)} title="Remove from queue">✕</button>
                  ) : (
                    <div className="cms-thumb-uploading mini">
                      <div className="cms-wave-container">
                        <div className="cms-wave-progress" />
                      </div>
                      <div className="cms-fluid-wave-bg">
                        <div className="cms-fluid-wave" />
                      </div>
                    </div>
                  )}
                </div>
                <input
                  className="cms-queue-label"
                  type="text" value={item.label}
                  placeholder="Label"
                  disabled={uploading}
                  onChange={e => updateQueueItem(item.id, { label: e.target.value })}
                />
                <select
                  className="cms-queue-cat"
                  value={item.cat} disabled={uploading}
                  onChange={e => updateQueueItem(item.id, { cat: e.target.value })}
                >
                  {GALLERY_CATS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Toolbar: filters + select mode ── */}
      <div className="cms-gallery-toolbar">
        <div className="cms-filter-row">
          {['All', ...GALLERY_CATS].map(f => (
            <button key={f}
              className={`cms-filter-btn${filter === f ? ' active' : ''}`}
              onClick={() => setFilter(f)}>
              {f} {f === 'All' ? `(${gallery.length})` : `(${gallery.filter(i => i.cat === f).length})`}
            </button>
          ))}
        </div>

        {gallery.length > 0 && (
          <div className="cms-select-controls">
            {!selectMode ? (
              <button className="cms-btn-ghost" onClick={() => setSelectMode(true)}>Select</button>
            ) : (
              <>
                <span className="cms-select-count">{selected.size} selected</span>
                <button className="cms-btn-ghost" onClick={selectAllVisible}>All</button>
                <button className="cms-btn-ghost" onClick={() => { setSelectMode(false); setSelected(new Set()); }}>Cancel</button>
                <button className="cms-btn-danger" disabled={!selected.size} onClick={doBulkDelete}>
                  Delete {selected.size || ''}
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Thumbnail grid ── */}
      <div className="cms-thumb-grid">
        {visible.map(img => {
          const isSel  = selected.has(img.src);
          const busyD  = delBusy[img.src];
          const askDel = confirmDel === img.src;
          return (
            <div
              key={img.src}
              className={`cms-thumb${selectMode ? ' selectable' : ''}${isSel ? ' selected' : ''}${busyD ? ' deleting' : ''}`}
              onClick={() => selectMode && toggleSelect(img.src)}
            >
              <img src={img.src} alt={img.label} className="cms-thumb-img" loading="lazy" />

              {/* Select checkbox (select mode) */}
              {selectMode && (
                <div className={`cms-thumb-check${isSel ? ' on' : ''}`}>{isSel ? '✓' : ''}</div>
              )}

              {/* Always-visible delete badge (normal mode) */}
              {!selectMode && !askDel && (
                <button
                  className="cms-thumb-delbadge"
                  onClick={(e) => { e.stopPropagation(); setConfirmDel(img.src); }}
                  disabled={busyD}
                  title="Remove image"
                >
                  {busyD ? '…' : '✕'}
                </button>
              )}

              {/* Inline delete confirm */}
              {askDel && (
                <div className="cms-thumb-confirm" onClick={e => e.stopPropagation()}>
                  <p>Remove this image?</p>
                  <div>
                    <button className="cms-btn-ghost" onClick={() => setConfirmDel(null)}>No</button>
                    <button className="cms-btn-danger" onClick={() => doDelete(img.src)}>Remove</button>
                  </div>
                </div>
              )}

              <p className="cms-thumb-label">
                <span className="cms-cat-tag">{img.cat}</span> {img.label}
              </p>
            </div>
          );
        })}
        {visible.length === 0 && (
          <p style={{ color: 'rgba(255,255,255,.3)', fontSize: 13, gridColumn: '1/-1' }}>
            No images in this category yet. Drag photos into the box above to add them.
          </p>
        )}
      </div>
    </div>
  );
}

/** Lounge section — 4 indexed slots */
function LoungeSection({ assets, token, refresh }) {
  const [busy, setBusy] = useState({});
  const [err,  setErr]  = useState(null);

  async function handleUpload(idx, file) {
    setBusy(b => ({ ...b, [idx]: true })); setErr(null);
    try {
      await uploadFile({ file, section: 'lounge', slot: idx, token });
      invalidateAssetsCache(); refresh();
    } catch (e) { setErr(e.message); }
    finally { setBusy(b => ({ ...b, [idx]: false })); }
  }

  async function handleDelete(idx) {
    if (!confirm('Remove this lounge image?')) return;
    setBusy(b => ({ ...b, [idx]: true })); setErr(null);
    try {
      await deleteAsset({ section: 'lounge', slot: idx, token });
      invalidateAssetsCache(); refresh();
    } catch (e) { setErr(e.message); }
    finally { setBusy(b => ({ ...b, [idx]: false })); }
  }

  return (
    <div className="cms-section-body">
      {err && <p className="cms-error">{err}</p>}
      <p className="cms-hint">These 4 images fill the 2×2 grid in the Club Lounge section.</p>
      <div className="cms-slot-grid cms-slot-grid-4">
        {[0, 1, 2, 3].map(idx => (
          <div key={idx} className="cms-slot">
            <p className="cms-slot-label">Image {idx + 1}</p>
            <AssetThumb
              src={assets?.lounge?.[idx]}
              replacing={busy[idx]}
              onReplace={file => handleUpload(idx, file)}
              onDelete={assets?.lounge?.[idx] ? () => handleDelete(idx) : null}
            />
            <label className={`cms-upload-btn${busy[idx] ? ' loading' : ''}`}>
              {busy[idx] ? 'Uploading…' : '+ Replace Image'}
              <input type="file" accept="image/*" style={{ display: 'none' }}
                onChange={e => { if (e.target.files[0]) handleUpload(idx, e.target.files[0]); }} />
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}

/** A single PDF document slot — view current file, replace, or remove */
function PdfSlot({ label, hint, src, busy, onReplace, onDelete }) {
  const fileRef = useRef();
  const fileName = src ? decodeURIComponent(src.split('/').pop()) : null;

  return (
    <div className="cms-pdf-slot">
      <p className="cms-slot-label">{label}</p>
      <div className="cms-pdf-card">
        {busy && (
          <div className="cms-thumb-uploading mini">
            <span>Uploading</span>
            <div className="cms-wave-container">
              <div className="cms-wave-progress" />
            </div>
            <div className="cms-fluid-wave-bg">
              <div className="cms-fluid-wave" />
            </div>
          </div>
        )}
        <div className="cms-pdf-icon">📄</div>
        <div className="cms-pdf-info">
          {src ? (
            <>
              <a href={src} target="_blank" rel="noopener noreferrer" className="cms-pdf-name" title={fileName}>
                {fileName}
              </a>
              <a href={src} target="_blank" rel="noopener noreferrer" className="cms-pdf-view">View PDF ↗</a>
            </>
          ) : (
            <span className="cms-pdf-empty">No PDF set</span>
          )}
        </div>
      </div>
      {hint && <p className="cms-pdf-hint">{hint}</p>}
      <div className="cms-pdf-actions">
        <label className={`cms-upload-btn${busy ? ' loading' : ''}`}>
          {busy ? 'Uploading…' : (src ? '↺ Replace PDF' : '+ Upload PDF')}
          <input type="file" accept="application/pdf,.pdf" style={{ display: 'none' }}
            onChange={e => { if (e.target.files[0]) onReplace(e.target.files[0]); }} />
        </label>
        {src && onDelete && (
          <button className="cms-btn-danger" onClick={onDelete} disabled={busy}>Remove</button>
        )}
      </div>
    </div>
  );
}

/** Site Map section — plan image + two downloadable PDFs */
function SiteMapSection({ assets, token, refresh }) {
  const [busy, setBusy] = useState({});
  const [err,  setErr]  = useState(null);

  async function handleUpload(slot, file) {
    setBusy(b => ({ ...b, [slot]: true })); setErr(null);
    try {
      await uploadFile({ file, section: 'sitemap', slot, token });
      invalidateAssetsCache(); refresh();
    } catch (e) { setErr(e.message); }
    finally { setBusy(b => ({ ...b, [slot]: false })); }
  }

  async function handleDelete(slot, kind) {
    if (!confirm(`Remove this ${kind}?`)) return;
    setBusy(b => ({ ...b, [slot]: true })); setErr(null);
    try {
      await deleteAsset({ section: 'sitemap', slot, token });
      invalidateAssetsCache(); refresh();
    } catch (e) { setErr(e.message); }
    finally { setBusy(b => ({ ...b, [slot]: false })); }
  }

  const sm = assets?.sitemap || {};

  return (
    <div className="cms-section-body">
      {err && <p className="cms-error">{err}</p>}
      <p className="cms-hint">
        Configure the Site Map page: the architectural plan image shown at the top, and the
        two downloadable PDF documents (master plan & villa floor plans).
      </p>

      {/* Plan image */}
      <div className="cms-slot-grid" style={{ marginBottom: 28 }}>
        <div className="cms-slot" style={{ maxWidth: 360 }}>
          <p className="cms-slot-label">Architectural Plan Image</p>
          <AssetThumb
            src={sm.planImage}
            replacing={busy.planImage}
            onReplace={file => handleUpload('planImage', file)}
            onDelete={sm.planImage ? () => handleDelete('planImage', 'plan image') : null}
          />
          <label className={`cms-upload-btn${busy.planImage ? ' loading' : ''}`}>
            {busy.planImage ? 'Uploading…' : '↺ Replace Plan Image'}
            <input type="file" accept="image/*" style={{ display: 'none' }}
              onChange={e => { if (e.target.files[0]) handleUpload('planImage', e.target.files[0]); }} />
          </label>
        </div>
      </div>

      {/* PDF documents */}
      <div className="cms-pdf-grid">
        <PdfSlot
          label="Master Plan PDF"
          hint="Linked from the “Download Master Plan” button."
          src={sm.masterPdf}
          busy={busy.masterPdf}
          onReplace={file => handleUpload('masterPdf', file)}
          onDelete={() => handleDelete('masterPdf', 'master plan PDF')}
        />
        <PdfSlot
          label="Villas Floor Plans PDF"
          hint="Linked from the “Villas Floor Plans” button."
          src={sm.villasPdf}
          busy={busy.villasPdf}
          onReplace={file => handleUpload('villasPdf', file)}
          onDelete={() => handleDelete('villasPdf', 'villas floor plans PDF')}
        />
      </div>

      {/* Interactive zone map editor */}
      <div className="zone-editor-section">
        <p className="cms-slot-label" style={{ marginBottom: 12 }}>Interactive Zone Map</p>
        <SiteMapZoneEditor
          initialZones={assets?.sitemapZones}
          onSave={async (zones) => {
            await patchSection({ section: 'sitemapZones', data: zones, token });
            invalidateAssetsCache();
            refresh();
          }}
        />
      </div>
    </div>
  );
}

// ── Main CmsPanel ─────────────────────────────────────────────────────────────

export default function CmsPanel({ token }) {
  const [activeSection, setActiveSection] = useState('gallery');
  const { assets, loading, error, refresh } = useAssets();

  const sectionProps = { assets, token, refresh };

  return (
    <div className="cms-panel">
      {/* Section tabs */}
      <div className="cms-tabs">
        {SECTIONS.map(s => (
          <button
            key={s.id}
            className={`cms-tab${activeSection === s.id ? ' active' : ''}`}
            onClick={() => setActiveSection(s.id)}
          >
            <span>{s.label}</span>
            <small>{s.desc}</small>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="cms-content">
        {loading && <p className="cms-hint">Loading assets…</p>}
        {error   && <p className="cms-error">Could not load assets: {error}</p>}

        {!loading && (
          <>
            {activeSection === 'hero'       && <HeroSection       {...sectionProps} />}
            {activeSection === 'about'      && <AboutSection      {...sectionProps} />}
            {activeSection === 'properties' && <PropertiesSection {...sectionProps} />}
            {activeSection === 'gallery'    && <GallerySection    {...sectionProps} />}
            {activeSection === 'lounge'     && <LoungeSection     {...sectionProps} />}
            {activeSection === 'sitemap'    && <SiteMapSection    {...sectionProps} />}
          </>
        )}
      </div>
    </div>
  );
}
