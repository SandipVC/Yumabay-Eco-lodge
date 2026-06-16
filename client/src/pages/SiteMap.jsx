import { useState } from 'react';
import { useLang }    from '../context/LanguageContext.jsx';
import { useNavigate } from 'react-router-dom';
import { useAssets }  from '../hooks/useAssets.js';
import SiteMapBackdrop from '../components/sitemap/SiteMapBackdrop.jsx';
import { ZONE_DEFAULTS, AVAIL, AVAIL_LABEL, zoneCenter, clampZone } from '../components/sitemap/zonesData.js';
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
  const { t }          = useLang();
  const s              = t.sitemap;
  const navigate       = useNavigate();
  const { assets }     = useAssets();
  const [activeId, setActiveId]   = useState(null);
  const [hoverId,  setHoverId]    = useState(null);

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

  const handleClick = (id) => setActiveId(prev => prev === id ? null : id);

  const handleEnquire = () => {
    if (!activeZone) return;
    navigate('/contact', { state: { interest: activeZone.label } });
  };

  const handleUnitEnquire = (unitCode, unitLabel) => {
    navigate(`/contact?unit=${unitCode}`, { state: { interest: unitLabel } });
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

      {/* Official architectural master plan image */}
      {planImage && (
        <div className="sitemap-plan-image reveal rd3" style={{ marginTop: 48 }}>
          <img
            src={planImage}
            alt="Yuma Bay Architectural Master Plan"
          />
        </div>
      )}

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
            <SiteMapBackdrop idPrefix="view" />

            {/* ── Clickable Zones ── */}
            {ZONES.map(z => {
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
                  {/* Zone fill */}
                  <rect
                    x={z.x} y={z.y} width={z.w} height={z.h}
                    fill={isActive ? brighten(col.fill, 2.2) : isHover ? brighten(col.fill, 1.8) : col.fill}
                    stroke={col.stroke}
                    strokeWidth={isActive ? 2.5 : isHover ? 2 : 1.5}
                    style={{ transition: 'fill .2s, stroke-width .15s' }}
                  />

                  {/* Active glow ring */}
                  {isActive && (
                    <rect
                      x={z.x} y={z.y} width={z.w} height={z.h}
                      fill="none" stroke={col.stroke} strokeWidth="5" opacity="0.25"
                    />
                  )}

                  {/* Zone label */}
                  <text
                    x={cx} y={cy - 7}
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
                    x={cx} y={cy + 8}
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
      </div>
    </div>
  );
}
