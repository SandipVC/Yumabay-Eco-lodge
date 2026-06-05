import { useState } from 'react';
import { useLang } from '../context/LanguageContext.jsx';
import { useNavigate } from 'react-router-dom';

const ZONES = [
  {
    id: 'villa-tipo-1', label: 'Villa Tipo 1', phase: 1,
    units: 12, type: 'Villa', availability: 'limited',
    beds: '3 Bedrooms', area: '222 m²', price: 'From $280,000',
    path: 'M 80 260 L 180 260 L 180 340 L 80 340 Z',
    cx: 130, cy: 300,
  },
  {
    id: 'building-a', label: 'Building A', phase: 1,
    units: 24, type: 'Apartments', availability: 'available',
    beds: 'Studio–3BR', area: 'Various', price: 'From $95,000',
    path: 'M 220 160 L 300 160 L 300 260 L 220 260 Z',
    cx: 260, cy: 210,
  },
  {
    id: 'building-b', label: 'Building B', phase: 1,
    units: 24, type: 'Apartments', availability: 'available',
    beds: 'Studio–3BR', area: 'Various', price: 'From $95,000',
    path: 'M 320 160 L 400 160 L 400 260 L 320 260 Z',
    cx: 360, cy: 210,
  },
  {
    id: 'building-c', label: 'Building C', phase: 1,
    units: 20, type: 'Apartments', availability: 'available',
    beds: 'Studio–3BR', area: 'Various', price: 'From $95,000',
    path: 'M 420 160 L 500 160 L 500 260 L 420 260 Z',
    cx: 460, cy: 210,
  },
  {
    id: 'building-d', label: 'Building D', phase: 1,
    units: 18, type: 'Apartments + Penthouse', availability: 'limited',
    beds: '1–3BR + Penthouse', area: 'Various', price: 'From $95,000',
    path: 'M 520 160 L 600 160 L 600 260 L 520 260 Z',
    cx: 560, cy: 210,
  },
  {
    id: 'building-e', label: 'Building E', phase: 2,
    units: 18, type: 'Apartments', availability: 'available',
    beds: 'Studio–2BR', area: 'Various', price: 'From $95,000',
    path: 'M 620 160 L 700 160 L 700 260 L 620 260 Z',
    cx: 660, cy: 210,
  },
  {
    id: 'bungalows', label: 'Bungalows', phase: 2,
    units: 16, type: 'Beachfront Bungalows', availability: 'available',
    beds: '1–2 Bedrooms', area: '85–120 m²', price: 'From $150,000',
    path: 'M 80 360 L 340 360 L 340 420 L 80 420 Z',
    cx: 210, cy: 390,
  },
  {
    id: 'eco-residences', label: 'Eco Residences', phase: 1,
    units: 8, type: 'Eco Lodge', availability: 'limited',
    beds: '1–2 Bedrooms', area: '100–140 m²', price: 'From $120,000',
    path: 'M 360 340 L 500 340 L 500 420 L 360 420 Z',
    cx: 430, cy: 380,
  },
  {
    id: 'beach-club', label: 'Beach Club', phase: 1,
    units: null, type: 'Club de Playa', availability: 'available',
    beds: null, area: null, price: null,
    path: 'M 540 340 L 760 340 L 760 460 L 540 460 Z',
    cx: 650, cy: 400,
  },
  {
    id: 'pool-main', label: 'Main Pool', phase: 1,
    units: null, type: 'Amenity', availability: 'available',
    beds: null, area: null, price: null,
    path: 'M 200 80 L 420 80 L 420 140 L 200 140 Z',
    cx: 310, cy: 110,
  },
];

const AVAIL_CLASS = { available: 'avail-available', limited: 'avail-limited', 'sold-out': 'avail-sold-out' };

export default function SiteMap() {
  const { t } = useLang();
  const s = t.sitemap;
  const navigate = useNavigate();
  const [active, setActive]   = useState(null);
  const [tooltip, setTooltip] = useState({ x: 0, y: 0 });

  const zone = ZONES.find(z => z.id === active);

  const handleZoneClick = (id, e) => {
    const rect = e.currentTarget.closest('svg').getBoundingClientRect();
    const container = e.currentTarget.closest('.sitemap-svg-container').getBoundingClientRect();
    setActive(id === active ? null : id);
    setTooltip({
      x: e.clientX - container.left,
      y: e.clientY - container.top,
    });
  };

  const availLabel = (a) => {
    if (a === 'available') return s.available;
    if (a === 'limited')   return s.limited;
    return s.soldOut;
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
      <div className="sitemap-svg-container" style={{ marginTop: 24 }}>
        <svg viewBox="0 0 840 480" xmlns="http://www.w3.org/2000/svg" style={{ background: 'rgba(13,59,82,.25)', borderRadius: 4 }}>
          {/* Water / Bay */}
          <rect x="0" y="440" width="840" height="40" fill="rgba(26,107,138,.3)" />
          <text x="420" y="467" textAnchor="middle" fill="rgba(26,107,138,.8)" fontSize="11" letterSpacing="3" fontFamily="Jost, sans-serif" textTransform="uppercase">BAHÍA DE YUMA</text>

          {/* Roads */}
          <rect x="0" y="0" width="840" height="30" fill="rgba(255,255,255,.04)" />
          <text x="420" y="20" textAnchor="middle" fill="rgba(255,255,255,.2)" fontSize="9" letterSpacing="4" fontFamily="Jost, sans-serif">CALLE MALECON</text>

          {/* Green spaces */}
          <rect x="100" y="430" width="640" height="12" fill="rgba(44,160,44,.15)" rx="2" />

          {ZONES.map(z => (
            <g key={z.id}>
              <path
                d={z.path}
                className={`sitemap-zone${active === z.id ? ' active' : ''}`}
                onClick={e => handleZoneClick(z.id, e)}
              />
              <text
                x={z.cx} y={z.cy - 6}
                textAnchor="middle"
                fill={active === z.id ? '#C9A84C' : 'rgba(255,255,255,.6)'}
                fontSize="9" fontFamily="Jost, sans-serif"
                letterSpacing="1"
                style={{ pointerEvents: 'none', userSelect: 'none' }}
              >
                {z.label}
              </text>
              {z.phase && (
                <text
                  x={z.cx} y={z.cy + 10}
                  textAnchor="middle"
                  fill="rgba(201,168,76,.5)"
                  fontSize="7" fontFamily="Jost, sans-serif"
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  {s.phase} {z.phase}
                </text>
              )}
            </g>
          ))}
        </svg>

        {active && zone && (
          <div
            className="sitemap-tooltip"
            style={{
              left: Math.min(tooltip.x + 16, window.innerWidth - 280),
              top: Math.max(tooltip.y - 60, 8),
            }}
          >
            <h4>{zone.label}</h4>
            <p>{zone.type} · {s.phase} {zone.phase}</p>
            {zone.beds  && <p>{zone.beds}</p>}
            {zone.area  && <p>{zone.area}</p>}
            {zone.price && <p style={{ color: 'var(--gold)', fontSize: 13 }}>{zone.price}</p>}
            {zone.units && <p>{zone.units} {s.units}</p>}
            <span className={`sitemap-availability ${AVAIL_CLASS[zone.availability]}`}>
              {availLabel(zone.availability)}
            </span>
            {zone.price && (
              <div style={{ marginTop: 12 }}>
                <button
                  className="btn-primary"
                  style={{ padding: '8px 20px', fontSize: 9 }}
                  onClick={() => navigate('/contact', { state: { interest: zone.label } })}
                >
                  {t.properties.enquire}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="sitemap-legend">
        <div className="legend-item"><div className="legend-dot" style={{ background: 'rgba(26,107,138,.6)' }} />{s.available}</div>
        <div className="legend-item"><div className="legend-dot" style={{ background: 'rgba(201,168,76,.5)' }} />{s.limited}</div>
        <div className="legend-item"><div className="legend-dot" style={{ background: 'rgba(224,122,95,.4)' }} />{s.soldOut}</div>
      </div>

      <div style={{ marginTop: 48, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <a
          href="/pdf/MASTER PLAN YUMA BAY.pdf"
          target="_blank" rel="noopener noreferrer"
          className="btn-primary"
        >
          {s.downloadPlan}
        </a>
        <a href="/pdf/PARCELAS VILLAS  YUMA BAY.pdf" target="_blank" rel="noopener noreferrer" className="btn-ghost">
          Villas Floor Plans
        </a>
      </div>
    </div>
  );
}
