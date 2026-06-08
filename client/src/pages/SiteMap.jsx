import { useState, useRef } from 'react';
import { useLang }    from '../context/LanguageContext.jsx';
import { useNavigate } from 'react-router-dom';

// ── Zone data ─────────────────────────────────────────────────────────────────
const ZONES = [
  {
    id: 'villa-tipo-1', label: 'Villa Tipo 1', phase: 1,
    units: 12, type: 'Villa', availability: 'limited',
    beds: '3 Bedrooms', area: '222 m²', price: 'From $280,000',
    path: 'M 52 280 L 172 280 L 172 368 L 52 368 Z',
    cx: 112, cy: 316, icon: '🏡',
  },
  {
    id: 'building-a', label: 'Building A', phase: 1,
    units: 24, type: 'Apartments', availability: 'available',
    beds: 'Studio – 3BR', area: 'Various', price: 'From $95,000',
    path: 'M 200 160 L 290 160 L 290 270 L 200 270 Z',
    cx: 245, cy: 212, icon: '🏢',
  },
  {
    id: 'building-b', label: 'Building B', phase: 1,
    units: 24, type: 'Apartments', availability: 'available',
    beds: 'Studio – 3BR', area: 'Various', price: 'From $95,000',
    path: 'M 304 160 L 394 160 L 394 270 L 304 270 Z',
    cx: 349, cy: 212, icon: '🏢',
  },
  {
    id: 'building-c', label: 'Building C', phase: 1,
    units: 20, type: 'Apartments', availability: 'available',
    beds: 'Studio – 3BR', area: 'Various', price: 'From $95,000',
    path: 'M 408 160 L 498 160 L 498 270 L 408 270 Z',
    cx: 453, cy: 212, icon: '🏢',
  },
  {
    id: 'building-d', label: 'Building D', phase: 1,
    units: 18, type: 'Apartments + Penthouse', availability: 'limited',
    beds: '1–3BR + Penthouse', area: 'Various', price: 'From $110,000',
    path: 'M 512 160 L 602 160 L 602 270 L 512 270 Z',
    cx: 557, cy: 212, icon: '🏢',
  },
  {
    id: 'building-e', label: 'Building E', phase: 2,
    units: 18, type: 'Apartments', availability: 'available',
    beds: 'Studio – 2BR', area: 'Various', price: 'From $95,000',
    path: 'M 616 160 L 706 160 L 706 270 L 616 270 Z',
    cx: 661, cy: 212, icon: '🏢',
  },
  {
    id: 'bungalows', label: 'Bungalows', phase: 2,
    units: 16, type: 'Beachfront Bungalows', availability: 'available',
    beds: '1–2 Bedrooms', area: '85–120 m²', price: 'From $150,000',
    path: 'M 196 290 L 396 290 L 396 368 L 196 368 Z',
    cx: 296, cy: 326, icon: '🛖',
  },
  {
    id: 'eco-residences', label: 'Eco Residences', phase: 1,
    units: 8, type: 'Eco Lodge', availability: 'limited',
    beds: '1–2 Bedrooms', area: '100–140 m²', price: 'From $120,000',
    path: 'M 412 290 L 552 290 L 552 368 L 412 368 Z',
    cx: 482, cy: 326, icon: '🌿',
  },
  {
    id: 'beach-club', label: 'Beach Club', phase: 1,
    units: null, type: 'Club de Playa', availability: 'available',
    beds: null, area: null, price: null,
    path: 'M 568 290 L 788 290 L 788 400 L 568 400 Z',
    cx: 678, cy: 342, icon: '🏖',
  },
  {
    id: 'pool-main', label: 'Main Pool', phase: 1,
    units: null, type: 'Amenity', availability: 'available',
    beds: null, area: null, price: null,
    path: 'M 200 72 L 440 72 L 440 140 L 200 140 Z',
    cx: 320, cy: 104, icon: '🏊',
  },
];

// Availability color tokens
const AVAIL = {
  available: { fill: 'rgba(26,107,138,.22)', stroke: 'rgba(26,107,138,.8)',  badge: '#1A6B8A' },
  limited:   { fill: 'rgba(201,168,76,.2)',  stroke: 'rgba(201,168,76,.85)', badge: '#C9A84C' },
  'sold-out':{ fill: 'rgba(224,122,95,.18)', stroke: 'rgba(224,122,95,.75)', badge: '#E07A5F' },
};

const AVAIL_LABEL = { available: 'Available', limited: 'Limited Units', 'sold-out': 'Sold Out' };

// ── Component ─────────────────────────────────────────────────────────────────
export default function SiteMap() {
  const { t }          = useLang();
  const s              = t.sitemap;
  const navigate       = useNavigate();
  const [activeId, setActiveId]   = useState(null);
  const [hoverId,  setHoverId]    = useState(null);

  const activeZone = ZONES.find(z => z.id === activeId);

  const handleClick = (id) => setActiveId(prev => prev === id ? null : id);

  const handleEnquire = () => {
    if (!activeZone) return;
    navigate('/contact', { state: { interest: activeZone.label } });
  };

  return (
    <div className="sitemap-page">
      <p className="section-label reveal">{s.label}</p>
      <h1 className="section-title reveal rd1">
        {s.title} <em>{s.titleEm}</em>
      </h1>
      <p className="section-body reveal rd2" style={{ maxWidth: 600 }}>{s.subtitle}</p>

      {/* Official architectural master plan image */}
      <div className="sitemap-plan-image reveal rd3" style={{ marginTop: 48 }}>
        <img
          src="/images/master-plan-layout.jpg"
          alt="Yuma Bay Architectural Master Plan"
        />
        <p className="sitemap-plan-caption">
          PLANTA ARQUITECTÓNICA · 1ER NIVEL · 1RA &amp; 2DA ETAPA
        </p>
      </div>

      <p className="section-label reveal" style={{ marginTop: 56, marginBottom: 0 }}>
        {s.phase === 'Phase' ? 'Interactive Zone Map' : 'Mapa de Zonas Interactivo'}
      </p>

      <div className="sitemap-layout">
        {/* ── Interactive SVG ── */}
        <div className="sitemap-svg-wrap">
          <svg
            viewBox="0 0 840 480"
            xmlns="http://www.w3.org/2000/svg"
            aria-label="Yuma Bay Master Plan"
          >
            {/* ── Background ── */}
            {/* Sky / land gradient base */}
            <defs>
              <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="rgba(13,59,82,.5)" />
                <stop offset="100%" stopColor="rgba(10,26,34,.9)" />
              </linearGradient>
            </defs>
            <rect x="0" y="0" width="840" height="480" fill="url(#skyGrad)" />

            {/* Water */}
            <rect x="0" y="410" width="840" height="70" fill="rgba(13,59,82,.55)" />
            <rect x="0" y="425" width="840" height="1" fill="rgba(26,107,138,.4)" />
            <text x="420" y="455" textAnchor="middle" fill="rgba(26,107,138,.7)"
              fontSize="10" letterSpacing="4" fontFamily="Jost, sans-serif">BAHÍA DE YUMA</text>

            {/* Beach strip */}
            <rect x="0" y="385" width="840" height="28" fill="rgba(245,237,216,.08)" />

            {/* Road at top */}
            <rect x="0" y="36" width="840" height="20" fill="rgba(255,255,255,.05)" />
            <line x1="0" y1="36" x2="840" y2="36" stroke="rgba(255,255,255,.1)" strokeWidth="1" strokeDasharray="12,8" />
            <text x="420" y="50" textAnchor="middle" fill="rgba(255,255,255,.18)"
              fontSize="8" letterSpacing="4" fontFamily="Jost, sans-serif">CALLE MALECON</text>

            {/* Road between buildings and lower zones */}
            <rect x="0" y="272" width="840" height="16" fill="rgba(255,255,255,.04)" />
            <line x1="0" y1="280" x2="840" y2="280" stroke="rgba(255,255,255,.06)" strokeWidth="1" strokeDasharray="8,6" />

            {/* Green strip */}
            <rect x="0" y="374" width="840" height="12" fill="rgba(44,160,44,.12)" />
            <text x="420" y="383" textAnchor="middle" fill="rgba(44,160,44,.35)"
              fontSize="6" letterSpacing="3" fontFamily="Jost, sans-serif">JARDINES</text>

            {/* Compass */}
            <g transform="translate(798,50)">
              <circle cx="0" cy="0" r="16" fill="rgba(255,255,255,.05)" stroke="rgba(255,255,255,.12)" strokeWidth="1" />
              <text x="0" y="-4" textAnchor="middle" fill="rgba(255,255,255,.4)" fontSize="9" fontFamily="Jost">N</text>
              <line x1="0" y1="-14" x2="0" y2="14" stroke="rgba(255,255,255,.25)" strokeWidth="1" />
              <line x1="-14" y1="0" x2="14" y2="0" stroke="rgba(255,255,255,.25)" strokeWidth="1" />
              <polygon points="0,-12 -3,-4 0,-7 3,-4" fill="rgba(201,168,76,.8)" />
            </g>

            {/* ── Clickable Zones ── */}
            {ZONES.map(z => {
              const isActive = activeId === z.id;
              const isHover  = hoverId  === z.id;
              const col      = AVAIL[z.availability] || AVAIL.available;

              return (
                <g
                  key={z.id}
                  onClick={() => handleClick(z.id)}
                  onMouseEnter={() => setHoverId(z.id)}
                  onMouseLeave={() => setHoverId(null)}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Zone fill */}
                  <path
                    d={z.path}
                    fill={isActive ? col.fill.replace(/[\d.]+\)$/, m => String(parseFloat(m) * 2.2) + ')') : isHover ? col.fill.replace(/[\d.]+\)$/, m => String(parseFloat(m) * 1.8) + ')') : col.fill}
                    stroke={col.stroke}
                    strokeWidth={isActive ? 2.5 : isHover ? 2 : 1.5}
                    style={{ transition: 'fill .2s, stroke-width .15s' }}
                  />

                  {/* Active glow ring */}
                  {isActive && (
                    <path
                      d={z.path}
                      fill="none"
                      stroke={col.stroke}
                      strokeWidth="5"
                      opacity="0.25"
                    />
                  )}

                  {/* Zone label */}
                  <text
                    x={z.cx} y={z.cy - 7}
                    textAnchor="middle"
                    fill={isActive ? '#C9A84C' : isHover ? 'rgba(255,255,255,.9)' : 'rgba(255,255,255,.6)'}
                    fontSize="8.5"
                    fontFamily="Jost, sans-serif"
                    fontWeight={isActive || isHover ? '500' : '400'}
                    letterSpacing="0.5"
                    style={{ pointerEvents: 'none', userSelect: 'none', transition: 'fill .2s' }}
                  >
                    {z.label}
                  </text>

                  {/* Phase badge */}
                  <text
                    x={z.cx} y={z.cy + 8}
                    textAnchor="middle"
                    fill="rgba(201,168,76,.45)"
                    fontSize="6.5"
                    fontFamily="Jost, sans-serif"
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  >
                    Phase {z.phase}
                  </text>
                </g>
              );
            })}

            {/* Click-hint text when nothing selected */}
            {!activeId && (
              <text x="420" y="24" textAnchor="middle"
                fill="rgba(201,168,76,.45)" fontSize="8" fontFamily="Jost, sans-serif" letterSpacing="2">
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
                Click any building, villa, or amenity zone on the plan to view unit details, pricing, and availability.
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
          ) : (
            <div className="sitemap-zone-card">
              <button className="sitemap-card-close" onClick={() => setActiveId(null)} aria-label="Close">✕</button>

              <div className="sitemap-card-badge" style={{ background: `${AVAIL[activeZone.availability]?.badge}22`, borderColor: `${AVAIL[activeZone.availability]?.badge}55`, color: AVAIL[activeZone.availability]?.badge }}>
                {AVAIL_LABEL[activeZone.availability]}
              </div>

              <h2 className="sitemap-card-title">{activeZone.icon} {activeZone.label}</h2>
              <p className="sitemap-card-type">{activeZone.type}</p>

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
                {activeZone.price && (
                  <div className="sitemap-meta-row">
                    <span className="meta-key">Starting Price</span>
                    <span className="meta-val meta-price">{activeZone.price}</span>
                  </div>
                )}
              </div>

              {activeZone.price && (
                <button
                  className="btn-primary sitemap-enquire-btn"
                  onClick={handleEnquire}
                >
                  {t.properties?.enquire || 'Enquire Now'}
                </button>
              )}

              {!activeZone.price && (
                <p className="sitemap-amenity-note">
                  This is a shared amenity available to all residents.
                </p>
              )}

              <p className="sitemap-card-nav-hint">← Click another zone to compare</p>
            </div>
          )}
        </div>
      </div>

      {/* PDF Downloads */}
      <div className="sitemap-downloads">
        <a href="/pdf/MASTER PLAN YUMA BAY.pdf" target="_blank" rel="noopener noreferrer" className="btn-primary">
          {s.downloadPlan}
        </a>
        <a href="/pdf/PARCELAS VILLAS  YUMA BAY.pdf" target="_blank" rel="noopener noreferrer" className="btn-ghost">
          Villas Floor Plans
        </a>
      </div>
    </div>
  );
}
