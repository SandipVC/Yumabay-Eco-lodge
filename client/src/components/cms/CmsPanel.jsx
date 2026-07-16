/**
 * CmsPanel — full asset management for all website sections.
 * Embedded inside the Dashboard (requires admin token).
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import { useAssets, invalidateAssetsCache } from '../../hooks/useAssets.js';
import { useLang } from '../../context/LanguageContext.jsx';
import SiteMapZoneEditor from './SiteMapZoneEditor.jsx';
import MediaLibraryPicker from './MediaLibraryPicker.jsx';
// ── Constants ─────────────────────────────────────────────────────────────────

// Must match the order of property cards in translations (en.js / es.js → properties.items)
const PROPERTY_NAMES = [
  'Villas', 'Suites & Apartments', 'Apartments', 'Premium 2BR', 'Beachfront Bungalows',
];

// Keys must match the internal `cat` values used by Gallery.jsx FILTER_MAP.
// Labels are what the CMS UI displays; they mirror the public-site filter chips.
const GALLERY_CATS = [
  { key: 'Villas',       label: 'Villas' },
  { key: 'Apartments',   label: 'Apartments' },
  { key: 'Amenities',    label: 'Beach Club & Amenities' },
  { key: 'Boca de Yuma', label: 'Boca de Yuma' },
];

// Tab labels/descriptions come from translations (t.dashboard.cms*) so the
// whole Media Manager switches with the dashboard EN/ES toggle.
const SECTIONS = [
  { id: 'branding',   labelKey: 'cmsTabBranding',   descKey: 'cmsTabBrandingDesc' },
  { id: 'hero',       labelKey: 'cmsTabHero',       descKey: 'cmsTabHeroDesc' },
  { id: 'about',      labelKey: 'cmsTabAbout',      descKey: 'cmsTabAboutDesc' },
  { id: 'properties', labelKey: 'cmsTabProperties', descKey: 'cmsTabPropertiesDesc' },
  { id: 'gallery',    labelKey: 'cmsTabGallery',    descKey: 'cmsTabGalleryDesc' },
  { id: 'lounge',     labelKey: 'cmsTabLounge',     descKey: 'cmsTabLoungeDesc' },
  { id: 'decor',      labelKey: 'cmsTabDecor',      descKey: 'cmsTabDecorDesc' },
  { id: 'sitemap',    labelKey: 'cmsTabSitemap',    descKey: 'cmsTabSitemapDesc' },
  { id: 'fonts',      labelKey: 'cmsTabFonts',      descKey: 'cmsTabFontsDesc' },
];

// Curated so every option renders correctly everywhere: brand fonts are
// self-hosted (see @font-face in global.css), the rest are either loaded via
// the Google Fonts <link> in index.html or universally available system fonts.
const HEADING_FONT_OPTIONS = [
  { value: "'Merzalina', 'Cormorant Garamond', serif", label: 'Merzalina (Brand default)' },
  { value: "'Cormorant Garamond', Georgia, serif",     label: 'Cormorant Garamond' },
  { value: "'Playfair Display', Georgia, serif",       label: 'Playfair Display' },
  { value: "Georgia, 'Times New Roman', serif",        label: 'Georgia' },
];
const BODY_FONT_OPTIONS = [
  { value: "'Aptos Narrow', 'Jost', sans-serif", label: 'Aptos Narrow (Brand default)' },
  { value: "'Jost', Arial, sans-serif",          label: 'Jost' },
  { value: "Arial, Helvetica, sans-serif",       label: 'Arial' },
  { value: "'Segoe UI', Tahoma, sans-serif",     label: 'Segoe UI' },
];

// Must match CUSTOM_HEADING_FAMILY / CUSTOM_BODY_FAMILY in server/routes/cms.js
// and client/src/App.jsx (FontSync), which injects the matching @font-face rule.
const CUSTOM_HEADING_VALUE = "'CMSHeadingFont', 'Cormorant Garamond', serif";
const CUSTOM_BODY_VALUE    = "'CMSBodyFont', 'Jost', sans-serif";

// ── Shared upload helper ──────────────────────────────────────────────────────

async function uploadFile({ file, section, slot, labelEn, labelEs, cat, token }) {
  const fd = new FormData();
  fd.append('file', file);
  if (labelEn !== undefined) fd.append('labelEn', labelEn);
  if (labelEs !== undefined) fd.append('labelEs', labelEs);
  if (cat)   fd.append('cat', cat);
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

async function reuseAsset({ url, section, slot, labelEn, labelEs, cat, token }) {
  const body = { url, labelEn, labelEs, cat };
  const res = await fetch(`/api/cms/reuse-asset/${section}${slot != null ? `/${slot}` : ''}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.error || 'Reuse failed');
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
function AssetThumb({ src, label, onDelete, onReplace, onReuse, replacing }) {
  const fileRef = useRef();
  const { t } = useLang();
  const c = t.dashboard;
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
          <span>{c.cmsNoImage}</span>
        </div>
      )}

      {replacing && (
        <div className="cms-thumb-uploading">
          <span>{c.cmsUploading}</span>
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
              title={c.cmsReplace}
            >
              {replacing ? '…' : c.cmsReplace}
            </button>
            <input ref={fileRef} type="file" accept="image/*,video/mp4,video/webm"
              style={{ display: 'none' }}
              onChange={e => { if (e.target.files[0]) onReplace(e.target.files[0]); }} />
          </>
        )}
        {onReuse && (
          <button
            className="cms-thumb-btn cms-thumb-reuse"
            onClick={onReuse}
            disabled={replacing}
            title="Choose from Library"
          >
            Library
          </button>
        )}
        {onDelete && (
          <button className="cms-thumb-btn cms-thumb-del" onClick={onDelete} title={c.cmsRemove}>
            {c.cmsRemoveBtn}
          </button>
        )}
      </div>
      {label && <p className="cms-thumb-label">{label}</p>}
    </div>
  );
}

/** Hero section — expanding-card slider slides (image + bilingual copy each) */
function HeroSection({ assets, token, refresh, openPicker }) {
  const { t } = useLang();
  const c = t.dashboard;
  const [busy,   setBusy]   = useState({});
  const [err,    setErr]    = useState(null);
  // Unsaved per-slide text edits, keyed by slide index.
  const [drafts, setDrafts] = useState({});

  const slides = Array.isArray(assets?.heroSlider) ? assets.heroSlider : [];

  async function withBusy(key, fn) {
    setBusy(b => ({ ...b, [key]: true }));
    setErr(null);
    let ok = false;
    try {
      await fn();
      ok = true;
      invalidateAssetsCache();
      refresh();
    } catch (e) { setErr(e.message); }
    finally { setBusy(b => ({ ...b, [key]: false })); }
    return ok;
  }

  const addSlide = (file) => withBusy('add', () =>
    uploadFile({
      file, section: 'heroSlider', token,
      labelEn: file.name.replace(/\.[^.]+$/, ''),
    }));

  const replaceImage = (idx, file) => withBusy(idx, () =>
    uploadFile({ file, section: 'heroSlider', slot: idx, token }));

  const handleReuse = (idx, url) => withBusy(idx, () =>
    reuseAsset({ url, section: 'heroSlider', slot: idx, token }));

  const handleReuseAdd = (url) => withBusy('add', () =>
    reuseAsset({ url, section: 'heroSlider', slot: 'add', token }));

  const deleteSlide = idx => withBusy(idx, () =>
    deleteAsset({ section: 'heroSlider', slot: idx, token }));

  const move = async (idx, dir) => {
    const next = [...slides];
    const [s] = next.splice(idx, 1);
    next.splice(idx + dir, 0, s);
    const ok = await withBusy(idx, () => patchSection({ section: 'heroSlider', data: next, token }));
    if (ok) setDrafts({}); // indices shifted — drop unsaved text edits
  };

  const setField = (idx, key, val) =>
    setDrafts(d => ({ ...d, [idx]: { ...d[idx], [key]: val } }));

  const fieldVal = (idx, key) => drafts[idx]?.[key] ?? slides[idx]?.[key] ?? '';

  const saveText = async (idx) => {
    const draft = drafts[idx];
    if (!draft) return;
    const next = slides.map((s, i) => (i === idx ? { ...s, ...draft } : s));
    const ok = await withBusy(idx, () => patchSection({ section: 'heroSlider', data: next, token }));
    if (ok) setDrafts(d => { const n = { ...d }; delete n[idx]; return n; });
  };

  const FIELDS = [
    ['kickerEn', c.cmsHeroKickerEn], ['kickerEs', c.cmsHeroKickerEs],
    ['titleEn',  c.cmsHeroTitleEn],  ['titleEs',  c.cmsHeroTitleEs],
    ['descEn',   c.cmsHeroDescEn],   ['descEs',   c.cmsHeroDescEs],
  ];

  return (
    <div className="cms-section-body">
      {err && <p className="cms-error">{err}</p>}
      <p className="cms-hint">{c.cmsHeroHint}</p>

      {slides.length === 0 && <p className="cms-hint">{c.cmsHeroEmpty}</p>}

      <div className="cms-hero-slides">
        {slides.map((slide, idx) => (
          <div key={`${slide.src}-${idx}`} className="cms-slot cms-hero-slide">
            <p className="cms-slot-label">
              {c.cmsHeroSlide} {idx + 1}
              <span className="cms-hero-order">
                <button type="button" disabled={idx === 0 || busy[idx]}
                  onClick={() => move(idx, -1)} title={c.cmsHeroMoveUp}>↑</button>
                <button type="button" disabled={idx === slides.length - 1 || busy[idx]}
                  onClick={() => move(idx, 1)} title={c.cmsHeroMoveDown}>↓</button>
              </span>
            </p>
            <AssetThumb
              src={slide.src}
              replacing={busy[idx]}
              onReplace={file => replaceImage(idx, file)}
              onReuse={() => openPicker(url => handleReuse(idx, url))}
              onDelete={() => deleteSlide(idx)}
            />
            <div className="cms-hero-fields">
              {FIELDS.map(([key, label]) => (
                <label key={key} className="cms-hero-field">
                  <span>{label}</span>
                  {key.startsWith('desc') ? (
                    <textarea rows={2} value={fieldVal(idx, key)}
                      onChange={e => setField(idx, key, e.target.value)} />
                  ) : (
                    <input type="text" value={fieldVal(idx, key)}
                      onChange={e => setField(idx, key, e.target.value)} />
                  )}
                </label>
              ))}
            </div>
            <button
              type="button"
              className="cms-upload-btn"
              disabled={!drafts[idx] || busy[idx]}
              onClick={() => saveText(idx)}
            >
              {busy[idx] ? c.cmsUploadingDots : c.cmsHeroSaveText}
            </button>
          </div>
        ))}
      </div>

      {slides.length < 8 && (
        <div style={{ display: 'flex', gap: 8 }}>
          <label className={`cms-upload-btn${busy.add ? ' loading' : ''}`}>
            {busy.add ? c.cmsUploadingDots : c.cmsHeroAddSlide}
            <input type="file" accept="image/*" style={{ display: 'none' }}
              onChange={e => { if (e.target.files[0]) addSlide(e.target.files[0]); e.target.value = ''; }} />
          </label>
          <button
            type="button"
            className="cms-upload-btn"
            disabled={busy.add}
            onClick={() => openPicker(url => handleReuseAdd(url))}
          >
            Library
          </button>
        </div>
      )}
    </div>
  );
}

/** Branding section — Logo */
function BrandingSection({ assets, token, refresh, openPicker }) {
  const { t } = useLang();
  const c = t.dashboard;
  const [busy, setBusy] = useState(false);
  const [err,  setErr]  = useState(null);

  async function handleUpload(file) {
    setBusy(true); setErr(null);
    try {
      await uploadFile({ file, section: 'branding', slot: 'logo', token });
      invalidateAssetsCache(); refresh();
    } catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  }

  async function handleReuse(url) {
    setBusy(true); setErr(null);
    try {
      await reuseAsset({ url, section: 'branding', slot: 'logo', token });
      invalidateAssetsCache(); refresh();
    } catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  }

  async function handleDelete() {
    if (!confirm(c.cmsBrandingRemoveConfirm)) return;
    setBusy(true); setErr(null);
    try {
      await deleteAsset({ section: 'branding', slot: 'logo', token });
      invalidateAssetsCache(); refresh();
    } catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  }

  const logo = assets?.branding?.logo;

  return (
    <div className="cms-section-body">
      {err && <p className="cms-error">{err}</p>}
      <p className="cms-hint">{c.cmsBrandingHint}</p>
      <div className="cms-slot-grid">
        <div className="cms-slot">
          <p className="cms-slot-label">{c.cmsBrandingLogo}</p>
          <AssetThumb
            src={logo || 'https://firebasestorage.googleapis.com/v0/b/vessel-contianer.firebasestorage.app/o/assets%2Fbrand%2Flogo-yb.svg?alt=media'}
            label={c.cmsBrandingLogo}
            replacing={busy}
            onReplace={file => handleUpload(file)}
            onReuse={() => openPicker(url => handleReuse(url))}
            onDelete={logo ? () => handleDelete() : null}
          />
          <label className={`cms-upload-btn${busy ? ' loading' : ''}`}>
            {busy ? c.cmsUploadingDots : c.cmsBrandingUpload}
            <input type="file" accept="image/svg+xml,image/png,image/*" style={{ display: 'none' }}
              onChange={e => { if (e.target.files[0]) handleUpload(e.target.files[0]); }} />
          </label>
        </div>
      </div>
    </div>
  );
}

/** About section — main + accent image slots */
function AboutSection({ assets, token, refresh, openPicker }) {
  const { t } = useLang();
  const c = t.dashboard;
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

  async function handleReuse(slot, url) {
    setBusy(b => ({ ...b, [slot]: true })); setErr(null);
    try {
      await reuseAsset({ url, section: 'about', slot, token });
      invalidateAssetsCache(); refresh();
    } catch (e) { setErr(e.message); }
    finally { setBusy(b => ({ ...b, [slot]: false })); }
  }

  async function handleDelete(slot) {
    if (!confirm(c.cmsRemoveImageConfirm)) return;
    setBusy(b => ({ ...b, [slot]: true })); setErr(null);
    try {
      await deleteAsset({ section: 'about', slot, token });
      invalidateAssetsCache(); refresh();
    } catch (e) { setErr(e.message); }
    finally { setBusy(b => ({ ...b, [slot]: false })); }
  }

  const slots = [
    { key: 'main',   label: c.cmsAboutMain },
    { key: 'accent', label: c.cmsAboutAccent },
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
              onReuse={() => openPicker(url => handleReuse(key, url))}
              onDelete={assets?.about?.[key] ? () => handleDelete(key) : null}
            />
            <label className={`cms-upload-btn${busy[key] ? ' loading' : ''}`}>
              {busy[key] ? c.cmsUploadingDots : `${c.cmsUpload} ${label}`}
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
function PropertiesSection({ assets, token, refresh, openPicker }) {
  const { t } = useLang();
  const c = t.dashboard;
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

  async function handleReuseAdd(propIdx, url) {
    const key = `${propIdx}`;
    setBusyKey(key, true); setErr(null);
    try {
      await reuseAsset({ url, section: 'propertyImages', slot: propIdx, token });
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

  async function handleReuse(propIdx, imgIdx, url) {
    const key = `${propIdx}-${imgIdx}`;
    setBusyKey(key, true); setErr(null);
    try {
      await reuseAsset({ url, section: 'propertyImages', slot: `${propIdx}-${imgIdx}`, token });
      invalidateAssetsCache(); refresh();
    } catch (e) { setErr(e.message); }
    finally { setBusyKey(key, false); }
  }

  async function handleDelete(propIdx, imgIdx, name) {
    if (!confirm(c.cmsPropRemoveConfirm.replace('{n}', imgIdx + 1).replace('{name}', name))) return;
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
    if (!inv) return c.cmsPropComputedLoading;
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
      return c.cmsPropComingSoon;
    }
    const available = units.filter(u => u.status === 'available' && typeof u.price === 'number');
    if (!available.length) return c.cmsPropSoldOut;
    const min = Math.min(...available.map(u => u.price));
    return `${c.cmsFrom} $${min.toLocaleString()}`;
  };

  return (
    <div className="cms-section-body">
      {err && <p className="cms-error">{err}</p>}
      <p className="cms-hint">{c.cmsPropHint}</p>

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
                    {imgs.length} {imgs.length !== 1 ? c.cmsImages : c.cmsImage}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,.4)' }}>{c.cmsPropPriceOverride}</span>
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
                    {priceSaving ? '…' : priceSaved ? c.cmsSaved : c.cmsSave}
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
                      }}>{c.cmsPropHero}</span>
                    )}
                    <AssetThumb
                      src={src}
                      replacing={busy[`${propIdx}-${imgIdx}`]}
                      onReplace={file => handleReplace(propIdx, imgIdx, file)}
                      onReuse={() => openPicker(url => handleReuse(propIdx, imgIdx, url))}
                      onDelete={() => handleDelete(propIdx, imgIdx, name)}
                    />
                    {busy[`del-${propIdx}-${imgIdx}`] && (
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>
                        {c.cmsRemoving}
                      </div>
                    )}
                  </div>
                ))}

                {/* Add new image slot */}
                <div style={{
                  width: 140, height: 100, display: 'flex', flexDirection: 'column',
                  alignItems: 'stretch', gap: 4
                }}>
                  <label style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '1.5px dashed rgba(201,168,76,.35)', borderRadius: 4,
                    cursor: addBusy ? 'not-allowed' : 'pointer',
                    color: addBusy ? 'rgba(255,255,255,.3)' : 'rgba(201,168,76,.7)',
                    background: 'rgba(201,168,76,.04)', transition: 'border-color .2s',
                  }}>
                    <span style={{ fontSize: 22, lineHeight: 1 }}>{addBusy ? '…' : '+'}</span>
                    <input type="file" accept="image/*" style={{ display: 'none' }} disabled={addBusy}
                      onChange={e => { if (e.target.files[0]) handleAdd(propIdx, e.target.files[0]); e.target.value = ''; }} />
                  </label>
                  <button
                    type="button"
                    onClick={() => openPicker(url => handleReuseAdd(propIdx, url))}
                    disabled={addBusy}
                    style={{
                      background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)',
                      color: 'rgba(255,255,255,.6)', fontSize: 10, padding: '4px', borderRadius: 4,
                      cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '.05em'
                    }}
                  >
                    Library
                  </button>
                </div>
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
  const { t } = useLang();
  const c = t.dashboard;
  const [queue,      setQueue]      = useState([]);   // pending files awaiting upload
  const [uploading,  setUploading]  = useState(false);
  const [delBusy,    setDelBusy]     = useState({});
  const [err,        setErr]        = useState(null);
  const [filter,     setFilter]     = useState('All');
  const [dragOver,   setDragOver]   = useState(false);
  const [defaultCat, setDefaultCat] = useState('Villas');
  const [selectMode, setSelectMode] = useState(false);
  const [selected,   setSelected]   = useState(() => new Set());
  const [confirmDel, setConfirmDel] = useState(null);
  // Inline label edits: { [src]: { labelEn, labelEs } }
  const [labelEdits,   setLabelEdits]   = useState({});
  const [labelSaving,  setLabelSaving]  = useState(false);
  const [labelSaved,   setLabelSaved]   = useState(false);
  // Parent-level "show labels on website" toggle (default true = on)
  const [showLabels,     setShowLabels]     = useState(() => assets?.galleryShowLabels !== false);
  const [labelToggleBusy, setLabelToggleBusy] = useState(false);
  const fileRef = useRef();

  // Keep local state in sync when assets reload
  useEffect(() => {
    setShowLabels(assets?.galleryShowLabels !== false);
  }, [assets?.galleryShowLabels]);

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
        labelEn: f.name.replace(/\.[^.]+$/, ''),
        labelEs: '',
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
          labelEn: item.labelEn.trim() || item.file.name.replace(/\.[^.]+$/, ''),
          labelEs: item.labelEs.trim(),
          cat: item.cat, token,
        });
      }
      clearQueue();
      invalidateAssetsCache(); refresh();
    } catch (ex) {
      setErr(`${c.cmsGalUploadError} ${ex.message}`);
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
      setErr(`${c.cmsGalBulkDeleteError} ${e.message}`);
    } finally {
      setDelBusy(b => { const n = { ...b }; srcs.forEach(s => delete n[s]); return n; });
    }
  }

  const toggleSelect = (src) =>
    setSelected(s => { const n = new Set(s); n.has(src) ? n.delete(src) : n.add(src); return n; });

  // Save all pending label edits by PATCHing the full gallery array.
  async function saveLabels() {
    setLabelSaving(true); setErr(null);
    try {
      const updated = gallery.map(img => {
        // Drop legacy `label` field — EN/ES fields are now authoritative.
        const { label: _legacy, ...rest } = img;
        return { ...rest, ...(labelEdits[img.src] || {}) };
      });
      await patchSection({ section: 'gallery', data: updated, token });
      setLabelEdits({});
      invalidateAssetsCache(); refresh();
      setLabelSaved(true);
      setTimeout(() => setLabelSaved(false), 2000);
    } catch (e) { setErr(e.message); }
    finally { setLabelSaving(false); }
  }

  const setLabelEdit = (src, field, val) =>
    setLabelEdits(prev => ({ ...prev, [src]: { ...(prev[src] || {}), [field]: val } }));

  const hasLabelEdits = Object.keys(labelEdits).length > 0;

  async function toggleShowLabels() {
    const next = !showLabels;
    setLabelToggleBusy(true);
    try {
      await patchSection({ section: 'galleryShowLabels', data: next, token });
      setShowLabels(next);
      invalidateAssetsCache(); refresh();
    } catch (e) { setErr(e.message); }
    finally { setLabelToggleBusy(false); }
  }

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
          {dragOver ? c.cmsGalDrop : c.cmsGalDragDrop}
        </p>
        <p className="cms-dropzone-sub">{c.cmsGalDropSub}</p>
        <div className="cms-dropzone-cat" onClick={e => e.stopPropagation()}>
          <span>{c.cmsGalNewTo}</span>
          {GALLERY_CATS.map(c => (
            <button key={c.key}
              className={`cms-catpick${defaultCat === c.key ? ' active' : ''}`}
              onClick={() => setDefaultCat(c.key)}>
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {err && <p className="cms-error">{err}</p>}

      {/* ── Pending upload queue (preview before commit) ── */}
      {queue.length > 0 && (
        <div className="cms-queue">
          <div className="cms-queue-head">
            <span className="cms-queue-title">{queue.length} {queue.length > 1 ? c.cmsImages : c.cmsImage} {c.cmsGalReady}</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="cms-btn-ghost" onClick={clearQueue} disabled={uploading}>{c.cmsClear}</button>
              <button className="cms-btn-gold" onClick={uploadQueue} disabled={uploading}>
                {uploading ? c.cmsUploadingDots : `${c.cmsGalUploadBtn} ${queue.length} ${queue.length > 1 ? c.cmsImages : c.cmsImage}`}
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
                  type="text" value={item.labelEn}
                  placeholder={c.cmsGalEnLabel}
                  disabled={uploading}
                  onChange={e => updateQueueItem(item.id, { labelEn: e.target.value })}
                />
                <input
                  className="cms-queue-label"
                  type="text" value={item.labelEs}
                  placeholder={c.cmsGalEsLabel}
                  disabled={uploading}
                  onChange={e => updateQueueItem(item.id, { labelEs: e.target.value })}
                />
                <select
                  className="cms-queue-cat"
                  value={item.cat} disabled={uploading}
                  onChange={e => updateQueueItem(item.id, { cat: e.target.value })}
                >
                  {GALLERY_CATS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Toolbar: filters + select mode ── */}
      <div className="cms-gallery-toolbar">
        <div className="cms-filter-row">
          {[{ key: 'All', label: c.cmsGalAll }, ...GALLERY_CATS].map(f => (
            <button key={f.key}
              className={`cms-filter-btn${filter === f.key ? ' active' : ''}`}
              onClick={() => setFilter(f.key)}>
              {f.label} {f.key === 'All' ? `(${gallery.length})` : `(${gallery.filter(i => i.cat === f.key).length})`}
            </button>
          ))}
        </div>

        {gallery.length > 0 && (
          <div className="cms-select-controls">
            <button
              className={showLabels ? 'cms-btn-gold' : 'cms-btn-ghost'}
              onClick={toggleShowLabels}
              disabled={labelToggleBusy}
              title={c.cmsGalLabelsTitle}
              style={{ minWidth: 110 }}
            >
              {labelToggleBusy ? '…' : showLabels ? c.cmsGalLabelsOn : c.cmsGalLabelsOff}
            </button>
            {!selectMode ? (
              <button className="cms-btn-ghost" onClick={() => setSelectMode(true)}>{c.cmsGalSelect}</button>
            ) : (
              <>
                <span className="cms-select-count">{selected.size} {c.cmsGalSelected}</span>
                <button className="cms-btn-ghost" onClick={selectAllVisible}>{c.cmsGalAll}</button>
                <button className="cms-btn-ghost" onClick={() => { setSelectMode(false); setSelected(new Set()); }}>{c.cmsCancel}</button>
                <button className="cms-btn-danger" disabled={!selected.size} onClick={doBulkDelete}>
                  {c.cmsGalDelete} {selected.size || ''}
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
          const edits  = labelEdits[img.src] || {};
          // Show legacy `label` in the EN field until user saves (migration hint).
          const curEn  = edits.labelEn !== undefined ? edits.labelEn : (img.labelEn ?? img.label ?? '');
          const curEs  = edits.labelEs !== undefined ? edits.labelEs : (img.labelEs ?? '');
          const isLegacy = !('labelEn' in img);
          const curCat = edits.cat !== undefined ? edits.cat : (img.cat ?? '');
          return (
            <div key={img.src} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div
                className={`cms-thumb${selectMode ? ' selectable' : ''}${isSel ? ' selected' : ''}${busyD ? ' deleting' : ''}`}
                onClick={() => selectMode && toggleSelect(img.src)}
              >
                <img src={img.src} alt={curEn} className="cms-thumb-img" loading="lazy" />

                {selectMode && (
                  <div className={`cms-thumb-check${isSel ? ' on' : ''}`}>{isSel ? '✓' : ''}</div>
                )}

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

                {askDel && (
                  <div className="cms-thumb-confirm" onClick={e => e.stopPropagation()}>
                    <p>{c.cmsRemoveImageConfirm}</p>
                    <div>
                      <button className="cms-btn-ghost" onClick={() => setConfirmDel(null)}>{c.cmsNo}</button>
                      <button className="cms-btn-danger" onClick={() => doDelete(img.src)}>{c.cmsRemove}</button>
                    </div>
                  </div>
                )}
              </div>

              {/* EN / ES label inputs */}
              <input
                className="cms-queue-label"
                type="text"
                value={curEn}
                placeholder={c.cmsGalEnLabel}
                onChange={e => setLabelEdit(img.src, 'labelEn', e.target.value)}
                style={{ fontSize: 14 }}
              />
              <input
                className="cms-queue-label"
                type="text"
                value={curEs}
                placeholder={c.cmsGalEsLabel}
                onChange={e => setLabelEdit(img.src, 'labelEs', e.target.value)}
                style={{ fontSize: 14 }}
              />
              <select
                className="cms-queue-cat cms-thumb-cat"
                value={curCat}
                onChange={e => setLabelEdit(img.src, 'cat', e.target.value)}
                style={{ fontSize: 13 }}
                title={c.cmsGalLabelsTitle}
              >
                <option value="">{c.cmsGalUncat}</option>
                {GALLERY_CATS.map(cat => (
                  <option key={cat.key} value={cat.key}>{cat.label}</option>
                ))}
              </select>
              {isLegacy && <span className="cms-legacy-tag">{c.cmsGalLegacy}</span>}
            </div>
          );
        })}
        {visible.length === 0 && (
          <p style={{ color: 'rgba(255,255,255,.3)', fontSize: 13, gridColumn: '1/-1' }}>
            {c.cmsGalEmpty}
          </p>
        )}
      </div>

      {/* Save bar for label edits */}
      {hasLabelEdits && (
        <div className="cms-save-bar">
          <span className="cms-save-note">{c.cmsGalUnsaved}</span>
          <button className="cms-btn-gold" onClick={saveLabels} disabled={labelSaving}>
            {labelSaving ? c.cmsSavingDots : labelSaved ? c.cmsSaved : c.cmsGalSaveLabels}
          </button>
        </div>
      )}
    </div>
  );
}

/** Lounge section — 4 indexed slots */
function LoungeSection({ assets, token, refresh, openPicker }) {
  const { t } = useLang();
  const c = t.dashboard;
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

  async function handleReuse(idx, url) {
    setBusy(b => ({ ...b, [idx]: true })); setErr(null);
    try {
      await reuseAsset({ url, section: 'lounge', slot: idx, token });
      invalidateAssetsCache(); refresh();
    } catch (e) { setErr(e.message); }
    finally { setBusy(b => ({ ...b, [idx]: false })); }
  }

  async function handleDelete(idx) {
    if (!confirm(c.cmsLoungeRemoveConfirm)) return;
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
      <p className="cms-hint">{c.cmsLoungeHint}</p>
      <div className="cms-slot-grid cms-slot-grid-4">
        {[0, 1, 2, 3].map(idx => (
          <div key={idx} className="cms-slot">
            <p className="cms-slot-label">{c.cmsLoungeImage} {idx + 1}</p>
            <AssetThumb
              src={assets?.lounge?.[idx]}
              replacing={busy[idx]}
              onReplace={file => handleUpload(idx, file)}
              onReuse={() => openPicker(url => handleReuse(idx, url))}
              onDelete={assets?.lounge?.[idx] ? () => handleDelete(idx) : null}
            />
            <label className={`cms-upload-btn${busy[idx] ? ' loading' : ''}`}>
              {busy[idx] ? c.cmsUploadingDots : c.cmsReplaceImage}
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
  const { t } = useLang();
  const c = t.dashboard;
  const fileName = src ? decodeURIComponent(src.split('/').pop()) : null;

  return (
    <div className="cms-pdf-slot">
      <p className="cms-slot-label">{label}</p>
      <div className="cms-pdf-card">
        {busy && (
          <div className="cms-thumb-uploading mini">
            <span>{c.cmsUploading}</span>
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
              <a href={src} target="_blank" rel="noopener noreferrer" className="cms-pdf-view">{c.cmsSmViewPdf}</a>
            </>
          ) : (
            <span className="cms-pdf-empty">{c.cmsSmNoPdf}</span>
          )}
        </div>
      </div>
      {hint && <p className="cms-pdf-hint">{hint}</p>}
      <div className="cms-pdf-actions">
        <label className={`cms-upload-btn${busy ? ' loading' : ''}`}>
          {busy ? c.cmsUploadingDots : (src ? c.cmsSmReplacePdf : c.cmsSmUploadPdf)}
          <input type="file" accept="application/pdf,.pdf" style={{ display: 'none' }}
            onChange={e => { if (e.target.files[0]) onReplace(e.target.files[0]); }} />
        </label>
        {src && onDelete && (
          <button className="cms-btn-danger" onClick={onDelete} disabled={busy}>{c.cmsRemove}</button>
        )}
      </div>
    </div>
  );
}

/** Decor section — decorative band patterns & palm overlays */
function DecorSection({ assets, token, refresh, openPicker }) {
  const { t } = useLang();
  const c = t.dashboard;
  const [busy, setBusy] = useState({});
  const [err,  setErr]  = useState(null);

  async function handleUpload(slot, file) {
    setBusy(b => ({ ...b, [slot]: true })); setErr(null);
    try {
      await uploadFile({ file, section: 'decor', slot, token });
      invalidateAssetsCache(); refresh();
    } catch (e) { setErr(e.message); }
    finally { setBusy(b => ({ ...b, [slot]: false })); }
  }

  async function handleReuse(slot, url) {
    setBusy(b => ({ ...b, [slot]: true })); setErr(null);
    try {
      await reuseAsset({ url, section: 'decor', slot, token });
      invalidateAssetsCache(); refresh();
    } catch (e) { setErr(e.message); }
    finally { setBusy(b => ({ ...b, [slot]: false })); }
  }

  async function handleDelete(slot) {
    if (!confirm(c.cmsRemoveImageConfirm)) return;
    setBusy(b => ({ ...b, [slot]: true })); setErr(null);
    try {
      await deleteAsset({ section: 'decor', slot, token });
      invalidateAssetsCache(); refresh();
    } catch (e) { setErr(e.message); }
    finally { setBusy(b => ({ ...b, [slot]: false })); }
  }

  const slots = [
    { key: 'aboutPalms',    label: c.cmsDecorAbout },
    { key: 'loungePattern', label: c.cmsDecorLounge },
    { key: 'ctaPattern',    label: c.cmsDecorCta },
  ];

  return (
    <div className="cms-section-body">
      {err && <p className="cms-error">{err}</p>}
      <p className="cms-hint">{c.cmsDecorHint}</p>
      <div className="cms-slot-grid">
        {slots.map(({ key, label }) => (
          <div key={key} className="cms-slot">
            <p className="cms-slot-label">{label}</p>
            <AssetThumb
              src={assets?.decor?.[key]}
              replacing={busy[key]}
              onReplace={file => handleUpload(key, file)}
              onReuse={() => openPicker(url => handleReuse(key, url))}
              onDelete={assets?.decor?.[key] ? () => handleDelete(key) : null}
            />
            <label className={`cms-upload-btn${busy[key] ? ' loading' : ''}`}>
              {busy[key] ? c.cmsUploadingDots : `${c.cmsUpload} ${label}`}
              <input type="file" accept="image/*" style={{ display: 'none' }}
                onChange={e => { if (e.target.files[0]) handleUpload(key, e.target.files[0]); }} />
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Site Map section — backdrop, plan image + downloadable PDFs */
function SiteMapSection({ assets, token, refresh, openPicker }) {
  const { t } = useLang();
  const c = t.dashboard;
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

  async function handleReuse(slot, url) {
    setBusy(b => ({ ...b, [slot]: true })); setErr(null);
    try {
      await reuseAsset({ url, section: 'sitemap', slot, token });
      invalidateAssetsCache(); refresh();
    } catch (e) { setErr(e.message); }
    finally { setBusy(b => ({ ...b, [slot]: false })); }
  }

  async function handleDelete(slot, kind) {
    if (!confirm(c.cmsHeroRemoveConfirm)) return;
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
      <p className="cms-hint">{c.cmsSmHint}</p>

      {/* Images: zone-map backdrop + plan image */}
      <div className="cms-slot-grid" style={{ marginBottom: 28 }}>
        <div className="cms-slot" style={{ maxWidth: 360 }}>
          <p className="cms-slot-label">{c.cmsSmBackdrop}</p>
          <AssetThumb
            src={sm.backdrop}
            replacing={busy.backdrop}
            onReplace={file => handleUpload('backdrop', file)}
            onReuse={() => openPicker(url => handleReuse('backdrop', url))}
            onDelete={sm.backdrop ? () => handleDelete('backdrop', 'backdrop image') : null}
          />
          <label className={`cms-upload-btn${busy.backdrop ? ' loading' : ''}`}>
            {busy.backdrop ? c.cmsUploadingDots : c.cmsSmReplaceBackdrop}
            <input type="file" accept="image/*" style={{ display: 'none' }}
              onChange={e => { if (e.target.files[0]) handleUpload('backdrop', e.target.files[0]); }} />
          </label>
        </div>
        <div className="cms-slot" style={{ maxWidth: 360 }}>
          <p className="cms-slot-label">{c.cmsSmPlan}</p>
          <AssetThumb
            src={sm.planImage}
            replacing={busy.planImage}
            onReplace={file => handleUpload('planImage', file)}
            onReuse={() => openPicker(url => handleReuse('planImage', url))}
            onDelete={sm.planImage ? () => handleDelete('planImage', 'plan image') : null}
          />
          <label className={`cms-upload-btn${busy.planImage ? ' loading' : ''}`}>
            {busy.planImage ? c.cmsUploadingDots : c.cmsSmReplacePlan}
            <input type="file" accept="image/*" style={{ display: 'none' }}
              onChange={e => { if (e.target.files[0]) handleUpload('planImage', e.target.files[0]); }} />
          </label>
        </div>
      </div>

      {/* PDF documents */}
      <div className="cms-pdf-grid">
        <PdfSlot
          label={c.cmsSmMasterPdf}
          hint={c.cmsSmMasterHint}
          src={sm.masterPdf}
          busy={busy.masterPdf}
          onReplace={file => handleUpload('masterPdf', file)}
          onDelete={() => handleDelete('masterPdf', 'master plan PDF')}
        />
        <PdfSlot
          label={c.cmsSmVillasPdf}
          hint={c.cmsSmVillasHint}
          src={sm.villasPdf}
          busy={busy.villasPdf}
          onReplace={file => handleUpload('villasPdf', file)}
          onDelete={() => handleDelete('villasPdf', 'villas floor plans PDF')}
        />
        <PdfSlot
          label={c.cmsSmBrochurePdf}
          hint={c.cmsSmBrochureHint}
          src={sm.brochurePdf}
          busy={busy.brochurePdf}
          onReplace={file => handleUpload('brochurePdf', file)}
          onDelete={() => handleDelete('brochurePdf', 'brochure PDF')}
        />
        <PdfSlot
          label={c.cmsSmAmenitiesPdf}
          hint={c.cmsSmAmenitiesHint}
          src={sm.amenitiesPdf}
          busy={busy.amenitiesPdf}
          onReplace={file => handleUpload('amenitiesPdf', file)}
          onDelete={() => handleDelete('amenitiesPdf', 'amenities PDF')}
        />
      </div>

      {/* Interactive zone map editor */}
      <div className="zone-editor-section">
        <p className="cms-slot-label" style={{ marginBottom: 12 }}>{c.cmsSmZoneMap}</p>
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

/** One heading/body font slot: preset dropdown + custom file upload + remove */
function FontSlot({
  label, previewText, previewClass, options, customValue,
  value, uploadedFile, uploading, onSelect, onUpload, onRemove,
}) {
  const { t } = useLang();
  const c = t.dashboard;
  const fileRef = useRef();
  const isCustom = value === customValue;

  return (
    <div>
      <label className="cms-slot-label" style={{ display: 'block', marginBottom: 8 }}>
        {label}
      </label>
      <select
        className="form-input"
        value={isCustom ? customValue : value}
        onChange={e => onSelect(e.target.value)}
        style={{ fontFamily: value }}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value} style={{ fontFamily: opt.value }}>
            {opt.label}
          </option>
        ))}
        {uploadedFile && (
          <option value={customValue} style={{ fontFamily: customValue }}>
            {c.cmsFontsCustom}
          </option>
        )}
      </select>

      <p className={previewClass} style={{ fontFamily: value, fontSize: previewClass ? 28 : 15, marginTop: 12 }}>
        {previewText}
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
        <button
          type="button"
          className="btn-ghost"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? c.cmsUploading : c.cmsFontsUpload}
        </button>
        {uploadedFile && (
          <button type="button" className="btn-ghost" onClick={onRemove} disabled={uploading}>
            {c.cmsFontsRemove}
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept=".woff,.woff2,.ttf,.otf"
          style={{ display: 'none' }}
          onChange={e => { if (e.target.files[0]) onUpload(e.target.files[0]); e.target.value = ''; }}
        />
      </div>
    </div>
  );
}

/** Fonts section — pick the site-wide heading/body font, or upload a custom font file */
function FontsSection({ assets, token, refresh }) {
  const { t } = useLang();
  const c = t.dashboard;
  const [headingFont, setHeadingFont] = useState(
    assets?.fonts?.headingFont || HEADING_FONT_OPTIONS[0].value
  );
  const [bodyFont, setBodyFont] = useState(
    assets?.fonts?.bodyFont || BODY_FONT_OPTIONS[0].value
  );
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [err,    setErr]    = useState(null);
  const [uploadingSlot, setUploadingSlot] = useState(null); // 'heading' | 'body' | null

  useEffect(() => {
    setHeadingFont(assets?.fonts?.headingFont || HEADING_FONT_OPTIONS[0].value);
    setBodyFont(assets?.fonts?.bodyFont || BODY_FONT_OPTIONS[0].value);
  }, [assets?.fonts]);

  async function save(next) {
    setSaving(true); setErr(null);
    try {
      await patchSection({ section: 'fonts', data: next, token });
      invalidateAssetsCache(); refresh();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) { setErr(e.message); }
    finally { setSaving(false); }
  }

  async function uploadFont(slot, file) {
    setUploadingSlot(slot); setErr(null);
    try {
      await uploadFile({ file, section: 'fonts', slot, token });
      invalidateAssetsCache(); refresh();
    } catch (e) { setErr(e.message); }
    finally { setUploadingSlot(null); }
  }

  async function removeFont(slot) {
    setErr(null);
    try {
      await deleteAsset({ section: 'fonts', slot, token });
      invalidateAssetsCache(); refresh();
    } catch (e) { setErr(e.message); }
  }

  return (
    <div className="cms-section-body">
      {err && <p className="cms-error">{err}</p>}
      <p className="cms-hint">{c.cmsFontsHint}</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 32, maxWidth: 420 }}>
        <FontSlot
          label={c.cmsFontsHeading}
          previewText="Yuma Bay Eco Lodge"
          previewClass="section-title"
          options={HEADING_FONT_OPTIONS}
          customValue={CUSTOM_HEADING_VALUE}
          value={headingFont}
          uploadedFile={assets?.fonts?.headingFontFile}
          uploading={uploadingSlot === 'heading'}
          onSelect={next => { setHeadingFont(next); save({ headingFont: next, bodyFont }); }}
          onUpload={file => uploadFont('heading', file)}
          onRemove={() => removeFont('heading')}
        />

        <FontSlot
          label={c.cmsFontsBody}
          previewText="The quick brown fox jumps over the lazy dog."
          previewClass=""
          options={BODY_FONT_OPTIONS}
          customValue={CUSTOM_BODY_VALUE}
          value={bodyFont}
          uploadedFile={assets?.fonts?.bodyFontFile}
          uploading={uploadingSlot === 'body'}
          onSelect={next => { setBodyFont(next); save({ headingFont, bodyFont: next }); }}
          onUpload={file => uploadFont('body', file)}
          onRemove={() => removeFont('body')}
        />

        {saving && <p className="cms-hint">{c.cmsSavingDots}</p>}
        {saved  && <p className="cms-hint" style={{ color: 'var(--gold)' }}>{c.cmsSaved}</p>}
      </div>
    </div>
  );
}

// ── Main CmsPanel ─────────────────────────────────────────────────────────────

export default function CmsPanel({ token }) {
  const [activeSection, setActiveSection] = useState('gallery');
  const [pickerCallback, setPickerCallback] = useState(null);
  const { assets, loading, error, refresh } = useAssets();
  const { t } = useLang();
  const c = t.dashboard;

  const sectionProps = { assets, token, refresh, openPicker: cb => setPickerCallback(() => cb) };

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
            <span>{c[s.labelKey]}</span>
            <small>{c[s.descKey]}</small>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="cms-content">
        {loading && <p className="cms-hint">{c.cmsLoading}</p>}
        {error   && <p className="cms-error">{c.cmsLoadError} {error}</p>}

        {!loading && (
          <>
            {activeSection === 'branding'   && <BrandingSection   {...sectionProps} />}
            {activeSection === 'hero'       && <HeroSection       {...sectionProps} />}
            {activeSection === 'about'      && <AboutSection      {...sectionProps} />}
            {activeSection === 'properties' && <PropertiesSection {...sectionProps} />}
            {activeSection === 'gallery'    && <GallerySection    {...sectionProps} />}
            {activeSection === 'lounge'     && <LoungeSection     {...sectionProps} />}
            {activeSection === 'decor'      && <DecorSection      {...sectionProps} />}
            {activeSection === 'sitemap'    && <SiteMapSection    {...sectionProps} />}
            {activeSection === 'fonts'      && <FontsSection      {...sectionProps} />}
          </>
        )}
      </div>

      {pickerCallback && (
        <MediaLibraryPicker
          token={token}
          onPick={url => {
            pickerCallback(url);
            setPickerCallback(null);
          }}
          onCancel={() => setPickerCallback(null)}
        />
      )}
    </div>
  );
}
