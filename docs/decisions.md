# Architecture Decisions — Yuma Bay Eco Lodge Website

## Decision log

### ADR-0.1 — Villa count = 8
Villa #8 inherits Villa #1 spec/price. Source: PRECIOS PDF.

### ADR-0.2 — Pricing date = April 7, 2026
From PDF filename `260407`. Stored in `t.project.pricingDate`.

### ADR-0.3 — Amenities renderings via CMS only
AMENIDADES PDF is mostly images. Owner uploads renderings via CMS Media Manager; not automated.

### ADR-0.4 — Public price display = starting-at only
Per-unit prices stay admin-side only. Public shows `From $XXX,XXX`.

### ADR-1.1 — Zero local media (Firebase model)
All media served from Firebase Storage URLs. No `client/public/images/*` in repo.  
Reason: repo size, CDN delivery, CMS replaceability without deploy.  
URL map: `client/src/assetsUrls.json`.

### ADR-1.2 — CMS-first content
Every visible string is editable from `/dashboard` → Text Content.  
Pipeline: static defaults → Firestore CMS overrides → deep-merged at runtime.  
Adding a field: update `en.js` + `es.js` + `textSchema.js`.

### ADR-1.3 — Stale Firestore overrides must be stripped
Firestore overrides persist forever. When changing a `en.js` default, the old Firestore value masks it. Always strip via `server/scripts/strip-stale-overrides.mjs`.

### ADR-1.4 — Plain global CSS, no Tailwind
Brand tokens as CSS custom properties on `:root`. Component styles co-located in `global.css` by section. No utility frameworks.  
Reason: project started without Tailwind; introducing it mid-project would be inconsistent.

### ADR-2.1 — Inventory data source = Firestore `assets/global`
88 units transcribed from PRECIOS PDF. Local `assets.json` is fallback only.  
`expectedTotal` checksum must be recalculated on every inventory save.

### ADR-3.1 — Properties min-price calculated dynamically
Starting prices on property cards = `Math.min` of available units in that building.  
No manually maintained `propertyPrices[]` array — it was stripped in Phase 3.

### ADR-4.1 — Site-map zones use 840×480 viewBox
Coordinates `{x,y,w,h}` in that space. `clampZone` must be called before render or save.

### ADR-5.1 — Dashboard auth = sessionStorage Bearer token
`ADMIN_SECRET` env var on server. Client stores in `sessionStorage['yb_admin']`.  
**Known risk:** hardcoded fallback secret exists in `Dashboard.jsx` for dev — must be removed before production.

### ADR-6.1 — Hero scroll uses CustomEvent decoupling
`Hero.jsx` broadcasts `yb-hero-progress` CustomEvent with `detail: progress (0–1)`.  
`Navbar.jsx` listens and toggles `nav-hidden` class. No direct prop coupling.  
Reason: Hero and Navbar are siblings under `Layout`; avoids lifting state.

### ADR-6.2 — Gallery labels bilingual with backward compat
New records: `{ labelEn, labelEs }`. Legacy records: `{ label }`.  
Distinction: `'labelEn' in img` key-existence check. One CMS save migrates legacy records permanently.

### ADR-6.3 — Dashboard uses light theme (#F0EDE8)
`.dash-light` wrapper class scopes all overrides. `useEffect` sets `document.body.style.background` to prevent global dark CSS from bleeding through.

### ADR-6.4 — Sitemap info panel: dark only when zone selected
Empty/loading state (no zone selected): uses light theme (matches sitemap page).  
`has-zone` state (zone clicked): dark `rgba(6,6,9,.92)` with gold border.  
Scoping: all dark overrides under `.sitemap-info-panel.has-zone`.
