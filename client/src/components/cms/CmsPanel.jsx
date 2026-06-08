/**
 * CmsPanel — full asset management for all website sections.
 * Embedded inside the Dashboard (requires admin token).
 */
import { useState, useRef, useCallback } from 'react';
import { useAssets, invalidateAssetsCache } from '../../hooks/useAssets.js';

// ── Constants ─────────────────────────────────────────────────────────────────

const PROPERTY_NAMES = [
  'Villa Tipo 1', 'Building A', 'Building B', 'Building C', 'Bungalows',
];

const GALLERY_CATS = ['Exterior', 'Interior', 'Amenities'];

const SECTIONS = [
  { id: 'hero',       label: '🎬 Hero',       desc: 'Background video & poster' },
  { id: 'about',      label: '🏠 About',      desc: 'Main & accent images' },
  { id: 'properties', label: '🏗 Properties', desc: 'One image per property card' },
  { id: 'gallery',    label: '🖼 Gallery',    desc: 'Add / remove gallery photos' },
  { id: 'lounge',     label: '🍹 Lounge',     desc: 'Club lounge 2×2 grid' },
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
    { key: 'video',  label: 'Background Video', accept: 'video/mp4,video/webm' },
    { key: 'poster', label: 'Poster / Fallback Image', accept: 'image/*' },
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

/** Properties section — 5 indexed slots */
function PropertiesSection({ assets, token, refresh }) {
  const [busy, setBusy] = useState({});
  const [err,  setErr]  = useState(null);

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

  return (
    <div className="cms-section-body">
      {err && <p className="cms-error">{err}</p>}
      <div className="cms-slot-grid cms-slot-grid-5">
        {PROPERTY_NAMES.map((name, idx) => (
          <div key={idx} className="cms-slot">
            <p className="cms-slot-label">Slot {idx + 1} — {name}</p>
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
          </div>
        ))}
      </div>
    </div>
  );
}

/** Gallery section — free-form add/remove with category */
function GallerySection({ assets, token, refresh }) {
  const [busy,    setBusy]    = useState(false);
  const [delBusy, setDelBusy] = useState({});
  const [err,     setErr]     = useState(null);
  const [label,   setLabel]   = useState('');
  const [cat,     setCat]     = useState('Exterior');
  const [file,    setFile]    = useState(null);
  const [filter,  setFilter]  = useState('All');
  const fileRef               = useRef();

  const gallery = assets?.gallery || [];
  const visible = filter === 'All' ? gallery : gallery.filter(img => img.cat === filter);

  async function handleUpload(e) {
    e.preventDefault();
    if (!file) return;
    setBusy(true); setErr(null);
    try {
      await uploadFile({ file, section: 'gallery', label: label || file.name.replace(/\.[^.]+$/, ''), cat, token });
      invalidateAssetsCache(); refresh();
      setFile(null); setLabel('');
      if (fileRef.current) fileRef.current.value = '';
    } catch (ex) { setErr(ex.message); }
    finally { setBusy(false); }
  }

  async function handleDelete(src) {
    if (!confirm('Remove this image from the gallery?')) return;
    setDelBusy(b => ({ ...b, [src]: true })); setErr(null);
    try {
      await deleteAsset({ section: 'gallery', filePath: src, token });
      invalidateAssetsCache(); refresh();
    } catch (e) { setErr(e.message); }
    finally { setDelBusy(b => ({ ...b, [src]: false })); }
  }

  return (
    <div className="cms-section-body">
      {/* Upload bar */}
      <form className="cms-gallery-upload" onSubmit={handleUpload}>
        <label className="cms-file-label">
          {file ? file.name : 'Choose image…'}
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
            onChange={e => setFile(e.target.files[0] || null)} />
        </label>
        <input
          className="cms-text-input"
          type="text" placeholder="Label (optional)"
          value={label} onChange={e => setLabel(e.target.value)}
        />
        <select className="cms-select" value={cat} onChange={e => setCat(e.target.value)}>
          {GALLERY_CATS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button type="submit" className="cms-upload-btn" disabled={!file || busy}>
          {busy ? 'Uploading…' : '+ Add to Gallery'}
        </button>
      </form>

      {err && <p className="cms-error">{err}</p>}

      {/* Filter tabs */}
      <div className="cms-filter-row">
        {['All', ...GALLERY_CATS].map(f => (
          <button key={f}
            className={`cms-filter-btn${filter === f ? ' active' : ''}`}
            onClick={() => setFilter(f)}>
            {f} {f === 'All' ? `(${gallery.length})` : `(${gallery.filter(i => i.cat === f).length})`}
          </button>
        ))}
      </div>

      {/* Thumbnail grid */}
      <div className="cms-thumb-grid">
        {visible.map(img => (
          <div key={img.src} className="cms-thumb">
            <img src={img.src} alt={img.label} className="cms-thumb-img" loading="lazy" />
            <div className="cms-thumb-overlay">
              <button
                className="cms-thumb-btn cms-thumb-del"
                onClick={() => handleDelete(img.src)}
                disabled={delBusy[img.src]}
              >
                {delBusy[img.src] ? '…' : '✕ Remove'}
              </button>
            </div>
            <p className="cms-thumb-label">
              <span className="cms-cat-tag">{img.cat}</span> {img.label}
            </p>
          </div>
        ))}
        {visible.length === 0 && (
          <p style={{ color: 'rgba(255,255,255,.3)', fontSize: 13 }}>No images in this category yet.</p>
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
          </>
        )}
      </div>
    </div>
  );
}
