/**
 * Static SVG backdrop for the master-plan map (bay, roads, beach, gardens,
 * compass). Shared by the public SiteMap page and the CMS visual editor so the
 * two always line up. Render inside an <svg viewBox="0 0 840 480">.
 *
 * `idPrefix` keeps the gradient id unique when two maps are on one page.
 */
export default function SiteMapBackdrop({ idPrefix = 'sm' }) {
  const gradId = `${idPrefix}-skyGrad`;
  return (
    <>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="rgba(13,59,82,.5)" />
          <stop offset="100%" stopColor="rgba(10,26,34,.9)" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="840" height="480" fill={`url(#${gradId})`} />

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
    </>
  );
}
