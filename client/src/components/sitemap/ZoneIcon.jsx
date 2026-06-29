/**
 * Inline SVG icons for sitemap zones. Self-contained — no external requests,
 * no font dependency. Each glyph uses `currentColor` so callers can colour it
 * via CSS / inline `color`.
 *
 * Source: hand-drawn line-art set, MIT-style — replaces the previous emoji icons
 * which rendered poorly on the dark info panel (no colour control, OS-dependent
 * glyphs). Pick by zone id keyword first, then fall back to the legacy emoji
 * stored on the zone for any CMS-authored zone that pre-dates this change.
 */

const SIZE = 18;

const Svg = ({ children, size = SIZE }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
    style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
  >
    {children}
  </svg>
);

const ICONS = {
  villa: (
    <Svg>
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5 10.5V20h14v-9.5" />
      <path d="M10 20v-5h4v5" />
      <path d="M16.5 6.5V4.5h2v3.7" />
    </Svg>
  ),
  building: (
    <Svg>
      <rect x="5" y="3" width="14" height="18" rx="0.5" />
      <path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2" />
      <path d="M10 21v-3h4v3" />
    </Svg>
  ),
  bungalow: (
    <Svg>
      <path d="M3 12 12 5l9 7" />
      <path d="M5 11.5V20h14v-8.5" />
      <path d="M3 12h18" />
      <path d="M10.5 20v-4h3v4" />
    </Svg>
  ),
  eco: (
    <Svg>
      <path d="M20 4c-9 0-15 5-15 12 0 1.7.4 3.2 1.1 4.4" />
      <path d="M6 20c0-7 6-12 14-12" />
      <path d="M20 4c.2 6-2.5 11-8 13" />
    </Svg>
  ),
  beach: (
    <Svg>
      <path d="M12 4v15" />
      <path d="M3 10c2-4 7-6 10-5 3 1 5 4 5 4-2 0-3 .5-4 1.5C13 9 11 9 9.5 10 8 11 6 11 3 10Z" />
      <path d="M3 20c2-1.5 4-1.5 6 0 2-1.5 4-1.5 6 0 2-1.5 4-1.5 6 0" />
    </Svg>
  ),
  pool: (
    <Svg>
      <path d="M3 17c2-1.5 4-1.5 6 0 2-1.5 4-1.5 6 0 2-1.5 4-1.5 6 0" />
      <path d="M3 21c2-1.5 4-1.5 6 0 2-1.5 4-1.5 6 0 2-1.5 4-1.5 6 0" />
      <circle cx="15.5" cy="6" r="1.8" />
      <path d="M7 13 11 9l3 2 3-2" />
    </Svg>
  ),
  map: (
    <Svg size={36}>
      <path d="M3 6.5 9 4l6 2 6-2v13.5L15 19l-6-2-6 2.5Z" />
      <path d="M9 4v13" />
      <path d="M15 6v13" />
    </Svg>
  ),
};

// Legacy emoji → icon-name fallback for CMS-authored zones that still store an
// emoji in the `icon` field.
const EMOJI_MAP = {
  '🏡': 'villa',
  '🏠': 'villa',
  '🏢': 'building',
  '🏬': 'building',
  '🏛': 'building',
  '🛖': 'bungalow',
  '🌿': 'eco',
  '🌱': 'eco',
  '🌳': 'eco',
  '🏖': 'beach',
  '🏝': 'beach',
  '🏊': 'pool',
  '🗺': 'map',
};

// Resolve which icon to render from a zone object (or a raw key/emoji string).
export function resolveIconName(zoneOrKey) {
  if (!zoneOrKey) return 'building';
  if (typeof zoneOrKey === 'string') {
    return ICONS[zoneOrKey] ? zoneOrKey : (EMOJI_MAP[zoneOrKey] || 'building');
  }
  const { id = '', icon = '' } = zoneOrKey;
  const lid = String(id).toLowerCase();
  if (lid.startsWith('villa'))       return 'villa';
  if (lid.startsWith('building'))    return 'building';
  if (lid.includes('bungalow'))      return 'bungalow';
  if (lid.includes('eco'))           return 'eco';
  if (lid.includes('beach'))         return 'beach';
  if (lid.includes('pool'))          return 'pool';
  return EMOJI_MAP[icon] || 'building';
}

export default function ZoneIcon({ zone, name, size }) {
  const key = name || resolveIconName(zone);
  const node = ICONS[key] || ICONS.building;
  if (!size || size === SIZE) return node;
  // Re-render with custom size if requested
  return <Svg size={size}>{node.props.children}</Svg>;
}
