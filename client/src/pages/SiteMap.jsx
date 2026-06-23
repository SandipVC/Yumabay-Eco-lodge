import { useState } from 'react';
import { useLang }    from '../context/LanguageContext.jsx';
import { useNavigate } from 'react-router-dom';
import { useAssets }  from '../hooks/useAssets.js';
import { BACKDROP_URL } from '../components/sitemap/SiteMapBackdrop.jsx';
import { ZONE_DEFAULTS, AVAIL, zoneCenter, clampZone } from '../components/sitemap/zonesData.js';
import UnitGrid from '../components/sitemap/UnitGrid.jsx';

const SITEMAP_DEFAULTS = {
  planImage: 'https://firebasestorage.googleapis.com/v0/b/vessel-contianer.firebasestorage.app/o/assets%2Fsitemap%2Fmaster-plan-layout.jpg?alt=media',
  masterPdf: '/pdf/MASTER PLAN YUMA BAY.pdf',
  villasPdf: '/pdf/PARCELAS VILLAS  YUMA BAY.pdf',
};

// Brighten an rgba() fill by multiplying its alpha (clamped to 1)
const brighten = (rgba, mult) =>
  rgba.replace(/[\d.]+\)$/, m => String(Math.min(1, parseFloat(m) * mult)) + ')');

// ── Component ─────────────────────────────────────────────────────────────────
export default function SiteMap() {
  const { t, lang }    = useLang();
  const s              = t.sitemap;
  const navigate       = useNavigate();
  const { assets }     = useAssets();
  const [activeId, setActiveId]       = useState(null);
  const [hoverId,  setHoverId]        = useState(null);
  const [isMapHovered, setIsMapHovered] = useState(false);
  const [activeEnquiry, setActiveEnquiry] = useState(null);
  const [inlineForm, setInlineForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [inlineErrors, setInlineErrors] = useState({});
  const [submitStatus, setSubmitStatus] = useState('idle');

  const planImage = assets?.sitemap?.planImage || SITEMAP_DEFAULTS.planImage;
  const masterPdf = assets?.sitemap?.masterPdf || SITEMAP_DEFAULTS.masterPdf;
  const villasPdf = assets?.sitemap?.villasPdf || SITEMAP_DEFAULTS.villasPdf;

  // Zones are CMS-configurable (assets.sitemapZones). An explicit saved array
  // is authoritative — even an empty one — so the public view always matches
  // the CMS editor. Fall back to bundled defaults only when nothing is saved
  // yet (key missing / still loading). Clamp guards against bad/legacy geometry.
  const ZONES = Array.isArray(assets?.sitemapZones)
    ? assets.sitemapZones.map(clampZone)
    : ZONE_DEFAULTS;

  const activeZone = ZONES.find(z => z.id === activeId);

  const handleClick = (id) => {
    setActiveId(prev => prev === id ? null : id);
    setActiveEnquiry(null);
    setSubmitStatus('idle');
  };

  const handleEnquire = () => {
    if (!activeZone) return;
    setInlineForm({
      name: '',
      email: '',
      phone: '',
      message: lang === 'es'
        ? `Hola, estoy interesado en la zona ${activeZone.label}. Por favor envíame más información.`
        : `Hello, I am interested in ${activeZone.label} zone. Please send me more information.`
    });
    setInlineErrors({});
    setSubmitStatus('idle');
    setActiveEnquiry({
      unitCode: '',
      interest: activeZone.label
    });
  };

  const handleUnitEnquire = (unitCode, unitLabel) => {
    if (!activeZone) return;
    setInlineForm({
      name: '',
      email: '',
      phone: '',
      message: lang === 'es'
        ? `Hola, estoy interesado en la unidad ${unitCode} de ${activeZone.label}. Por favor envíame más información.`
        : `Hello, I am interested in unit ${unitCode} of ${activeZone.label}. Please send me more information.`
    });
    setInlineErrors({});
    setSubmitStatus('idle');
    setActiveEnquiry({
      unitCode,
      interest: unitLabel
    });
  };

  const handleInlineChange = (e) => {
    const { name, value } = e.target;
    setInlineForm(f => ({ ...f, [name]: value }));
    if (inlineErrors[name]) setInlineErrors(er => ({ ...er, [name]: '' }));
  };

  const validateInline = () => {
    const errs = {};
    if (inlineForm.name.trim().length < 2) errs.name = lang === 'es' ? 'Nombre requerido' : 'Name is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inlineForm.email)) errs.email = lang === 'es' ? 'Correo inválido' : 'Valid email required';
    if (inlineForm.message.trim().length < 5) errs.message = lang === 'es' ? 'Mensaje demasiado corto' : 'Message must be at least 5 characters';
    return errs;
  };

  const handleInlineSubmit = async (e) => {
    e.preventDefault();
    const errs = validateInline();
    if (Object.keys(errs).length > 0) { setInlineErrors(errs); return; }
    setSubmitStatus('sending');
    try {
      const payload = {
        ...inlineForm,
        propertyInterest: activeEnquiry.interest,
        unitCode: activeEnquiry.unitCode,
        language: lang
      };
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSubmitStatus('success');
        setInlineForm({ name: '', email: '', phone: '', message: '' });
      } else {
        setSubmitStatus('error');
      }
    } catch {
      setSubmitStatus('error');
    }
  };

  // Map villas or building units if they exist in inventory
  let inventoryBuilding = null;
  if (activeZone && activeZone.inventoryId && assets?.inventory) {
    if (activeZone.inventoryId === 'villas' && Array.isArray(assets.inventory.villas)) {
      inventoryBuilding = {
        name: 'Villas',
        levels: 1,
        units: assets.inventory.villas.map(v => ({
          code: v.code,
          level: 1,
          type: 'villa',
          areaInt: v.areaInt,
          balcony: +(v.pool + v.jacuzzi).toFixed(2),
          total: +(v.areaInt + v.pool + v.jacuzzi).toFixed(2),
          price: v.price,
          status: v.status,
          note: v.note || `Includes Private Pool (${v.pool} m²) and Jacuzzi (${v.jacuzzi} m²)`
        }))
      };
    } else if (Array.isArray(assets.inventory.buildings)) {
      inventoryBuilding = assets.inventory.buildings.find(b => b.id === activeZone.inventoryId) || null;
    }
  }

  return (
    <div className="sitemap-page">
      <p className="section-label reveal">{s.label}</p>
      <h1 className="section-title reveal rd1">
        {s.title} <em>{s.titleEm}</em>
      </h1>
      <p className="section-body reveal rd2" style={{ maxWidth: 600 }}>{s.subtitle}</p>

      <p className="section-label reveal" style={{ marginTop: 24, marginBottom: 0 }}>
        {s.phase === 'Phase' ? 'Interactive Zone Map' : 'Mapa de Zonas Interactivo'}
      </p>

      <div className="sitemap-layout">
        {/* ── Interactive SVG ── */}
        <div className="sitemap-svg-wrap">
          <svg
            viewBox="0 0 840 480"
            xmlns="http://www.w3.org/2000/svg"
            aria-label="Yuma Bay Master Plan"
            onMouseEnter={() => setIsMapHovered(true)}
            onMouseLeave={() => setIsMapHovered(false)}
          >
            <defs>
              <clipPath id="sm-zones-clip">
                {ZONES.map(z => (
                  <rect key={z.id} x={z.x} y={z.y} width={z.w} height={z.h} />
                ))}
              </clipPath>
              <filter id="sm-glow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="4" result="blur"/>
                <feMerge>
                  <feMergeNode in="blur"/>
                  <feMergeNode in="blur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            {/* Base image — grayscale when map is hovered */}
            <image
              href={BACKDROP_URL}
              x="0" y="0" width="840" height="480"
              preserveAspectRatio="none"
              style={{
                filter: isMapHovered ? 'grayscale(1)' : 'grayscale(0)',
                transition: 'filter 0.35s ease',
              }}
            />

            {/* Color reveal — same image clipped to zone rects, fades in on hover */}
            <image
              href={BACKDROP_URL}
              x="0" y="0" width="840" height="480"
              preserveAspectRatio="none"
              clipPath="url(#sm-zones-clip)"
              style={{
                opacity: isMapHovered ? 1 : 0,
                transition: 'opacity 0.35s ease',
              }}
            />

            {/* ── Clickable Zones ── */}
            {ZONES.map((z, zi) => {
              const isActive = activeId === z.id;
              const isHover  = hoverId  === z.id;
              const col      = AVAIL[z.availability] || AVAIL.available;
              const { cx, cy } = zoneCenter(z);

              return (
                <g
                  key={z.id}
                  onClick={() => handleClick(z.id)}
                  onMouseEnter={() => setHoverId(z.id)}
                  onMouseLeave={() => setHoverId(null)}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Idle breathing pulse */}
                  {!isHover && !isActive && (
                    <rect
                      x={z.x} y={z.y} width={z.w} height={z.h}
                      fill="none"
                      stroke={col.stroke}
                      strokeWidth="1.5"
                      className="zone-idle-wave"
                      style={{ pointerEvents: 'none', animationDelay: `${zi * 0.28}s` }}
                    />
                  )}

                  {/* Zone fill */}
                  <rect
                    x={z.x} y={z.y} width={z.w} height={z.h}
                    fill={isActive ? 'rgba(201,168,76,.15)' : isHover ? 'rgba(255,255,255,.05)' : 'rgba(255,255,255,0)'}
                    stroke={isActive ? '#C9A84C' : isHover ? 'rgba(255,255,255,.7)' : 'rgba(255,255,255,0)'}
                    strokeWidth={isActive ? 3 : isHover ? 2 : 0}
                    className={isActive ? 'zone-sel-border' : undefined}
                    style={{ transition: 'fill .2s, stroke .2s, stroke-width .15s' }}
                  />

                  {/* Active glow ring */}
                  {isActive && (
                    <rect
                      x={z.x} y={z.y} width={z.w} height={z.h}
                      fill="none" stroke="#C9A84C" strokeWidth="5" opacity="0.3"
                    />
                  )}

                  {/* Hover glow sweep */}
                  {isHover && !isActive && (() => {
                    const perim = 2 * (z.w + z.h);
                    const arc   = Math.min(70, perim * 0.18);
                    return (
                      <rect
                        x={z.x} y={z.y} width={z.w} height={z.h}
                        fill="none"
                        stroke="rgba(255,255,255,0.95)"
                        strokeWidth="2.5"
                        strokeDasharray={`${arc} ${perim - arc}`}
                        strokeLinecap="round"
                        filter="url(#sm-glow)"
                        style={{ pointerEvents: 'none' }}
                      >
                        <animate
                          attributeName="stroke-dashoffset"
                          from="0"
                          to={`${-perim}`}
                          dur="1.6s"
                          repeatCount="indefinite"
                        />
                      </rect>
                    );
                  })()}

                  {/* Zone label */}
                  <text
                    x={cx} y={cy - 4}
                    textAnchor="middle"
                    fill={isActive ? '#C9A84C' : 'rgba(255,255,255,.95)'}
                    fontSize="11"
                    fontFamily="Jost, sans-serif"
                    fontWeight={isActive || isHover ? '600' : '500'}
                    letterSpacing="0.3"
                    stroke="rgba(0,0,0,0.75)"
                    strokeWidth="3"
                    style={{ pointerEvents: 'none', userSelect: 'none', transition: 'fill .2s', paintOrder: 'stroke' }}
                  >
                    {z.label}
                  </text>

                  {/* Phase badge */}
                  <text
                    x={cx} y={cy + 10}
                    textAnchor="middle"
                    fill={isActive ? 'rgba(201,168,76,.9)' : 'rgba(201,168,76,.85)'}
                    fontSize="8.5"
                    fontFamily="Jost, sans-serif"
                    fontWeight="500"
                    stroke="rgba(0,0,0,0.7)"
                    strokeWidth="2.5"
                    style={{ pointerEvents: 'none', userSelect: 'none', paintOrder: 'stroke' }}
                  >
                    Phase {z.phase}
                  </text>
                </g>
              );
            })}

            {/* Click-hint text when nothing selected */}
            {!activeId && (
              <text x="420" y="26" textAnchor="middle"
                fill="rgba(201,168,76,.95)" fontSize="10" fontFamily="Jost, sans-serif" letterSpacing="2"
                fontWeight="500"
                stroke="rgba(0,0,0,0.75)" strokeWidth="3"
                style={{ paintOrder: 'stroke' }}>
                CLICK ANY ZONE FOR DETAILS
              </text>
            )}
          </svg>

          {/* ── Legend ── */}
          <div className="sitemap-legend">
            <div className="legend-item">
              <div className="legend-dot" style={{ background: 'rgba(26,107,138,.7)' }} />
              {s.available}
            </div>
            <div className="legend-item">
              <div className="legend-dot" style={{ background: 'rgba(201,168,76,.7)' }} />
              {s.limited}
            </div>
            <div className="legend-item">
              <div className="legend-dot" style={{ background: 'rgba(224,122,95,.6)' }} />
              {s.soldOut}
            </div>
          </div>
        </div>

        {/* ── Info Panel ── */}
        <div className={`sitemap-info-panel${activeZone ? ' has-zone' : ''}`}>
          {!activeZone ? (
            <div className="sitemap-panel-empty">
              <div className="sitemap-panel-icon">🗺</div>
              <p className="sitemap-panel-hint-title">Interactive Master Plan</p>
              <p className="sitemap-panel-hint-body">
                Click any building, villa, or amenity zone on the plan to view unit details and availability.
              </p>
              <div className="sitemap-zone-list">
                {ZONES.filter(z => z.price).map(z => (
                  <button
                    key={z.id}
                    className="sitemap-zone-pill"
                    onClick={() => setActiveId(z.id)}
                  >
                    <span style={{ color: AVAIL[z.availability]?.badge }}>{z.icon}</span>
                    {z.label}
                  </button>
                ))}
              </div>
            </div>
          ) : activeEnquiry ? (
            <div className="sitemap-zone-card sitemap-enquiry-panel">
              <button className="sitemap-card-close" onClick={() => setActiveEnquiry(null)} aria-label="Close">✕</button>

              <h2 className="sitemap-card-title">{lang === 'es' ? 'Consulta' : 'Enquiry'}</h2>
              <p className="sitemap-card-type">
                {activeEnquiry.unitCode ? `${lang === 'es' ? 'Unidad' : 'Unit'} ${activeEnquiry.unitCode}` : activeEnquiry.interest}
              </p>

              {submitStatus === 'success' ? (
                <div className="form-success" style={{ padding: '20px 0', border: 'none' }}>
                  <h3 style={{ color: 'var(--gold)', marginBottom: '12px', fontFamily: 'Merzalina, serif', fontSize: '24px', fontWeight: '400' }}>
                    {t.contact?.successTitle || 'Enquiry received!'}
                  </h3>
                  <p style={{ fontSize: '15px', color: 'rgba(255,255,255,.7)', lineHeight: '1.7' }}>
                    {t.contact?.successBody || "Thank you for reaching out. We'll be in touch within 24–48 hours."}
                  </p>
                  <button 
                    className="btn-primary" 
                    style={{ marginTop: '24px', padding: '14px 28px', fontSize: '15px', width: 'auto' }}
                    onClick={() => {
                      setActiveEnquiry(null);
                      setSubmitStatus('idle');
                    }}
                  >
                    {lang === 'es' ? 'Volver' : 'Back'}
                  </button>
                </div>
              ) : (
                <form className="enquiry-form" onSubmit={handleInlineSubmit} noValidate>
                  {submitStatus === 'error' && (
                    <p className="form-error" style={{ marginBottom: '12px', color: 'var(--coral)', fontSize: '13px' }}>
                      {t.contact?.errorMsg || 'Something went wrong. Please try again.'}
                    </p>
                  )}

                  <div className="form-field">
                    <input
                      name="name" type="text" className="form-input"
                      placeholder={t.contact?.namePlaceholder || 'Your Name'} 
                      value={inlineForm.name} onChange={handleInlineChange}
                      required
                    />
                    {inlineErrors.name && <span className="form-error" style={{ color: 'var(--coral)', fontSize: '11px', marginTop: '4px', display: 'block' }}>{inlineErrors.name}</span>}
                  </div>

                  <div className="form-field">
                    <input
                      name="email" type="email" className="form-input"
                      placeholder={t.contact?.emailPlaceholder || 'Email Address'} 
                      value={inlineForm.email} onChange={handleInlineChange}
                      required
                    />
                    {inlineErrors.email && <span className="form-error" style={{ color: 'var(--coral)', fontSize: '11px', marginTop: '4px', display: 'block' }}>{inlineErrors.email}</span>}
                  </div>

                  <div className="form-field">
                    <input
                      name="phone" type="tel" className="form-input"
                      placeholder={t.contact?.phonePlaceholder || 'Phone (optional)'} 
                      value={inlineForm.phone} onChange={handleInlineChange}
                    />
                  </div>

                  <div className="form-field">
                    <textarea
                      name="message" className="form-input" rows={4}
                      placeholder={t.contact?.messagePlaceholder || 'Your message…'} 
                      value={inlineForm.message} onChange={handleInlineChange}
                      style={{ height: 'auto', resize: 'vertical', fontFamily: 'inherit' }}
                      required
                    />
                    {inlineErrors.message && <span className="form-error" style={{ color: 'var(--coral)', fontSize: '11px', marginTop: '4px', display: 'block' }}>{inlineErrors.message}</span>}
                  </div>

                  <button type="submit" className="btn-primary" disabled={submitStatus === 'sending'} style={{ marginTop: '12px' }}>
                    {submitStatus === 'sending' ? (t.contact?.sending || 'Sending…') : (t.properties?.enquire || 'Enquire Now')}
                  </button>

                  <button type="button" className="btn-ghost" onClick={() => setActiveEnquiry(null)} style={{ border: 'none', padding: '10px 0', fontSize: '14px', background: 'none', cursor: 'pointer' }}>
                    {lang === 'es' ? 'Cancelar' : 'Cancel'}
                  </button>
                </form>
              )}
            </div>
          ) : (
            <div className="sitemap-zone-card">
              <button className="sitemap-card-close" onClick={() => setActiveId(null)} aria-label="Close">✕</button>

              <h2 className="sitemap-card-title">{activeZone.icon} {activeZone.label}</h2>
              <p className="sitemap-card-type">{activeZone.type}</p>

              {inventoryBuilding ? (
                <>
                  <div className="sitemap-card-meta" style={{ marginBottom: 12 }}>
                    <div className="sitemap-meta-row">
                      <span className="meta-key">Phase</span>
                      <span className="meta-val">{activeZone.phase}</span>
                    </div>
                    {activeZone.area && (
                      <div className="sitemap-meta-row">
                        <span className="meta-key">Area Range</span>
                        <span className="meta-val">{activeZone.area}</span>
                      </div>
                    )}
                  </div>
                  <UnitGrid building={inventoryBuilding} onEnquire={handleUnitEnquire} />
                </>
              ) : (
                <>
                  <div className="sitemap-card-meta">
                    <div className="sitemap-meta-row">
                      <span className="meta-key">Phase</span>
                      <span className="meta-val">{activeZone.phase}</span>
                    </div>
                    {activeZone.beds && (
                      <div className="sitemap-meta-row">
                        <span className="meta-key">Units</span>
                        <span className="meta-val">{activeZone.beds}</span>
                      </div>
                    )}
                    {activeZone.area && (
                      <div className="sitemap-meta-row">
                        <span className="meta-key">Area</span>
                        <span className="meta-val">{activeZone.area}</span>
                      </div>
                    )}
                    {activeZone.units && (
                      <div className="sitemap-meta-row">
                        <span className="meta-key">Total Units</span>
                        <span className="meta-val">{activeZone.units}</span>
                      </div>
                    )}
                  </div>

                  {activeZone.price ? (
                    <button
                      className="btn-primary sitemap-enquire-btn"
                      onClick={handleEnquire}
                    >
                      {t.properties?.enquire || 'Enquire Now'}
                    </button>
                  ) : (
                    <p className="sitemap-amenity-note">
                      This is a shared amenity available to all residents.
                    </p>
                  )}
                </>
              )}

              <p className="sitemap-card-nav-hint">← Click another zone to compare</p>
            </div>
          )}
        </div>
      </div>

      {/* PDF Downloads */}
      <div className="sitemap-downloads">
        {masterPdf && (
          <a href={masterPdf} target="_blank" rel="noopener noreferrer" className="btn-primary">
            {s.downloadPlan}
          </a>
        )}
        {villasPdf && (
          <a href={villasPdf} target="_blank" rel="noopener noreferrer" className="btn-ghost">
            Villas Floor Plans
          </a>
        )}
        <a
          href="https://firebasestorage.googleapis.com/v0/b/vessel-contianer.firebasestorage.app/o/pdf%2Fyuma-bay-brochure.pdf?alt=media"
          target="_blank" rel="noopener noreferrer" className="btn-ghost"
        >
          {lang === 'es' ? 'Descargar Folleto' : 'Download Brochure'}
        </a>
        <a
          href="https://firebasestorage.googleapis.com/v0/b/vessel-contianer.firebasestorage.app/o/pdf%2Famenidades.pdf?alt=media"
          target="_blank" rel="noopener noreferrer" className="btn-ghost"
        >
          {lang === 'es' ? 'Descargar Amenidades' : 'Download Amenities'}
        </a>
      </div>
    </div>
  );
}
