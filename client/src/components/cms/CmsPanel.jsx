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
  'Villa Tipo 1', 'Apartments', 'Eco Residences', 'Bungalows', 'Penthouse',
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

async function deleteAsset({ section, filePath, slot, token }) {
  const res = await fetch(`/api/cms/assets/${section}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ path: filePath, slot }),
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

/** Properties section — 5 indexed image slots + editable prices */
function PropertiesSection({ assets, token, refresh }) {
  const [busy,   setBusy]   = useState({});
  const [err,    setErr]    = useState(null);
  const [prices, setPrices] = useState(() => Array(PROPERTY_NAMES.length).fill(''));
  const [dirty,  setDirty]  = useState(false);
  const [saving, setSaving] = useState(false);

  // Sync prices from the server whenever assets reload — but never clobber unsaved edits.
  const pricesKey = JSON.stringify(assets?.propertyPrices || []);
  useEffect(() => {
    if (dirty) return;
    setPrices(Array.from({ length: PROPERTY_NAMES.length },
      (_, i) => assets?.propertyPrices?.[i] || ''));
  }, [pricesKey]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleUpload(idx, file) {
    setBusy(b => ({ ...b, [idx]: true })); setErr(null);
    try {
      await uploadFile({ file, section: 'properties', slot: idx, token });
      invalidateAssetsCache(); refresh();
    } catch (e) { setErr(e.message); }
    finally { setBusy(b => ({ ...b, [idx]: false })); }
  }

  async function handleDelete(idx) {
    if (!confirm(`Remove image for ${PROPERTY_NAMES[idx]}?`)) return;
    setBusy(b => ({ ...b, [idx]: true })); setErr(null);
    try {
      await deleteAsset({ section: 'properties', slot: idx, token });
      invalidateAssetsCache(); refresh();
    } catch (e) { setErr(e.message); }
    finally { setBusy(b => ({ ...b, [idx]: false })); }
  }

  function setPrice(idx, val) {
    setPrices(p => p.map((v, i) => i === idx ? val : v));
    setDirty(true);
  }

  async function savePrices() {
    setSaving(true); setErr(null);
    try {
      await patchSection({ section: 'propertyPrices', data: prices.map(s => s.trim()), token });
      setDirty(false);
      invalidateAssetsCache(); refresh();
    } catch (e) { setErr(e.message); }
    finally { setSaving(false); }
  }

  function resetPrices() {
    setPrices(Array.from({ length: PROPERTY_NAMES.length },
      (_, i) => assets?.propertyPrices?.[i] || ''));
    setDirty(false);
  }

  return (
    <div className="cms-section-body">
      {err && <p className="cms-error">{err}</p>}
      <p className="cms-hint">
        Replace each property's photo and edit its starting price. Enter the amount only
        (e.g. <code>$280,000</code>) — the “From / Desde” prefix is added automatically per language.
      </p>

      <div className="cms-slot-grid cms-slot-grid-5">
        {PROPERTY_NAMES.map((name, idx) => (
          <div key={idx} className="cms-slot">
            <p className="cms-slot-label">{name}</p>
            <AssetThumb
              src={assets?.properties?.[idx]}
              replacing={busy[idx]}
              onReplace={file => handleUpload(idx, file)}
              onDelete={assets?.properties?.[idx] ? () => handleDelete(idx) : null}
            />
            <label className={`cms-upload-btn${busy[idx] ? ' loading' : ''}`}>
              {busy[idx] ? 'Uploading…' : '+ Replace Image'}
              <input type="file" accept="image/*" style={{ display: 'none' }}
                onChange={e => { if (e.target.files[0]) handleUpload(idx, e.target.files[0]); }} />
            </label>

            {/* Price field */}
            <div className="cms-price-field">
              <span className="cms-price-prefix">Price</span>
              <input
                className="cms-price-input"
                type="text"
                value={prices[idx]}
                placeholder="$0,000"
                onChange={e => setPrice(idx, e.target.value)}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Save bar — appears when prices are edited */}
      {dirty && (
        <div className="cms-save-bar">
          <span className="cms-save-note">Unsaved price changes</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="cms-btn-ghost" onClick={resetPrices} disabled={saving}>Reset</button>
            <button className="cms-btn-gold" onClick={savePrices} disabled={saving}>
              {saving ? 'Saving…' : 'Save Prices'}
            </button>
          </div>
        </div>
      )}
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
