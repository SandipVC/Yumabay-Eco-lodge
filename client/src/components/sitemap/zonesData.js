/**
 * Shared site-map zone data — single source of truth for the public SiteMap
 * page and the CMS visual editor.
 *
 * Geometry uses a simple rectangle model in the SVG viewBox coordinate space
 * (840 × 480): x, y (top-left) and w, h (size). The label is auto-centered.
 */

export const VIEWBOX_W = 840;
export const VIEWBOX_H = 480;

// Minimum zone size so boxes stay clickable/legible
export const MIN_W = 50;
export const MIN_H = 36;

// Availability → colour tokens
export const AVAIL = {
  available:  { fill: 'rgba(26,107,138,.22)', stroke: 'rgba(26,107,138,.8)',  badge: '#1A6B8A' },
  limited:    { fill: 'rgba(201,168,76,.2)',  stroke: 'rgba(201,168,76,.85)', badge: '#C9A84C' },
  'sold-out': { fill: 'rgba(224,122,95,.18)', stroke: 'rgba(224,122,95,.75)', badge: '#E07A5F' },
};

export const AVAIL_OPTIONS = [
  { value: 'available', label: 'Available' },
  { value: 'limited',   label: 'Limited Units' },
  { value: 'sold-out',  label: 'Sold Out' },
];

export const AVAIL_LABEL = {
  available: 'Available',
  limited:   'Limited Units',
  'sold-out': 'Sold Out',
};

// Default zones (used when the CMS has no saved zones yet)
export const ZONE_DEFAULTS = [
  { id: 'villa-tipo-1',  label: 'Villa Tipo 1',   type: 'Villa',                 phase: 1, availability: 'limited',   beds: '3 Bedrooms',         area: '222 m²',     price: 'From $280,000', units: 12, icon: '🏡', x: 52,  y: 280, w: 120, h: 88, inventoryId: 'villas' },
  { id: 'building-a',    label: 'Building A',      type: 'Apartments',            phase: 1, availability: 'available',  beds: 'Studio – 3BR',       area: 'Various',    price: 'From $95,000',  units: 24, icon: '🏢', x: 200, y: 160, w: 90,  h: 110, inventoryId: 'edificio-ab' },
  { id: 'building-b',    label: 'Building B',      type: 'Apartments',            phase: 1, availability: 'available',  beds: 'Studio – 3BR',       area: 'Various',    price: 'From $95,000',  units: 24, icon: '🏢', x: 304, y: 160, w: 90,  h: 110, inventoryId: 'edificio-ab' },
  { id: 'building-c',    label: 'Building C',      type: 'Apartments',            phase: 1, availability: 'available',  beds: 'Studio – 3BR',       area: 'Various',    price: 'From $95,000',  units: 20, icon: '🏢', x: 408, y: 160, w: 90,  h: 110, inventoryId: 'edificio-c' },
  { id: 'building-d',    label: 'Building D',      type: 'Apartments + Penthouse', phase: 1, availability: 'limited',   beds: '1–3BR + Penthouse', area: 'Various',    price: 'From $110,000', units: 18, icon: '🏢', x: 512, y: 160, w: 90,  h: 110, inventoryId: 'edificio-d' },
  { id: 'building-e',    label: 'Building E',      type: 'Apartments',            phase: 2, availability: 'available',  beds: 'Studio – 2BR',       area: 'Various',    price: 'From $95,000',  units: 18, icon: '🏢', x: 616, y: 160, w: 90,  h: 110, inventoryId: 'edificio-e' },
  { id: 'bungalows',     label: 'Bungalows',       type: 'Beachfront Bungalows',  phase: 2, availability: 'available',  beds: '1–2 Bedrooms',       area: '85–120 m²',  price: 'From $150,000', units: 16, icon: '🛖', x: 196, y: 290, w: 200, h: 78, inventoryId: 'bungalows' },
  { id: 'eco-residences',label: 'Eco Residences',  type: 'Eco Lodge',             phase: 1, availability: 'limited',    beds: '1–2 Bedrooms',       area: '100–140 m²', price: 'From $120,000', units: 8,  icon: '🌿', x: 412, y: 290, w: 140, h: 78 },
  { id: 'beach-club',    label: 'Beach Club',      type: 'Club de Playa',         phase: 1, availability: 'available',  beds: '',                   area: '',           price: '',              units: '', icon: '🏖', x: 568, y: 290, w: 220, h: 110 },
  { id: 'pool-main',     label: 'Main Pool',       type: 'Amenity',               phase: 1, availability: 'available',  beds: '',                   area: '',           price: '',              units: '', icon: '🏊', x: 200, y: 72,  w: 240, h: 68 },
];

// Clamp a zone's geometry so it stays fully inside the viewBox and above min
// size. Coerces missing / NaN values so bad or legacy data can never produce
// NaN SVG coordinates on the public page.
export function clampZone(z) {
  const w = Math.max(MIN_W, Math.min(Number(z.w) || MIN_W, VIEWBOX_W));
  const h = Math.max(MIN_H, Math.min(Number(z.h) || MIN_H, VIEWBOX_H));
  const x = Math.max(0, Math.min(Number(z.x) || 0, VIEWBOX_W - w));
  const y = Math.max(0, Math.min(Number(z.y) || 0, VIEWBOX_H - h));
  return { ...z, x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h) };
}

// Centre point of a zone (for label placement)
export const zoneCenter = (z) => ({ cx: z.x + z.w / 2, cy: z.y + z.h / 2 });

// Create a fresh zone with an id unique against `existingIds`
export function makeBlankZone(existingIds = []) {
  let n = existingIds.length + 1;
  let id = `zone-${n}`;
  while (existingIds.includes(id)) { n += 1; id = `zone-${n}`; }
  return {
    id,
    label: 'New Zone',
    type: 'Apartments',
    phase: 1,
    availability: 'available',
    beds: '',
    area: '',
    price: '',
    units: '',
    icon: '🏢',
    x: 360, y: 200, w: 120, h: 90,
  };
}
