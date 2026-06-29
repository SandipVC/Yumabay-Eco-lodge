# Architecture — Yuma Bay Eco Lodge Website

## Process model

Two independent processes; both must run during development:

| App | Folder | Stack | Port |
|-----|--------|-------|------|
| Frontend | `client/` | React 18 + Vite (JS) | 5173 |
| Backend API | `server/` | Node + Express ESM | 3001 |

No root `package.json`. Vite proxies `/api/*` → `:3001`.

---

## Frontend conventions (`client/`)

- **CSS:** Plain global CSS in `src/styles/global.css`. No Tailwind/Bootstrap. Brand tokens are CSS custom properties on `:root` (`--dark`, `--gold`, `--white`, `--deep`, `--ocean`, `--sand`, `--coral`, `--teal`, `--ink`, `--ink-soft`, `--bg-soft`, `--rule`).
- **Fonts:** Cormorant Garamond (headings) + Jost (body).
- **Routing:** React Router v6. Routes: `/` (Home), `/contact`, `/sitemap`, `/dashboard`. `/dashboard` is outside `Layout`.
- **Scroll-reveal:** Elements get `className="reveal"`. IntersectionObserver wired once in `Layout.jsx` via `useRevealAll([pathname])`. Never add per-page observers.
- **Bilingual:** All copy in `src/translations/en.js` + `es.js`. Components use `const { t } = useLang()`. CMS overrides deep-merged at runtime via `LanguageContext.jsx`.
- **Animations:** GSAP ScrollTrigger for hero video scrub; Motion for general reveal animations.
- **Hero scroll pattern:** `CustomEvent('yb-hero-progress', { detail: progress })` broadcast from `Hero.jsx` → `Navbar.jsx` for decoupled nav reveal.

## Backend conventions (`server/`)

- Express + Helmet + `express-rate-limit` + `express-validator`. ESM imports (`"type":"module"`).
- Routes: `contact.js` (lead capture + Nodemailer), `leads.js` (admin list), `cms.js` (media + content, multer uploads).
- **Auth:** `ADMIN_SECRET` env var, sent as `Bearer` token in `sessionStorage['yb_admin']`.

## Data stores

| Store | Location | Content | Committed? |
|---|---|---|---|
| Firestore `assets/global` | Firebase | All CMS content (primary) | N/A |
| `server/data/assets.json` | Local | Fallback when Firestore unavailable | ✅ yes |
| `server/data/leads.json` | Local | PII — submitted enquiries | ❌ gitignored |
| `server/.env` | Local | Secrets (SMTP, ADMIN_SECRET, etc.) | ❌ gitignored |

## CMS data flow

```
GET /api/cms/assets
  → reads Firestore assets/global (primary)
  → falls back to assets.json

useAssets() hook (30s cache) → every section component
  → section falls back to hardcoded defaults if API down

File upload: POST /api/cms/assets/:section/:slot (multipart, Bearer auth)
Non-file update: PATCH /api/cms/assets { section, data } (Bearer auth)
```

## Media model

**All media served from Firebase Storage URLs.** No `client/public/images/*` in repo.  
URL map: `client/src/assetsUrls.json` (21 entries).  
Local placeholder: `data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7`  
**Exception:** `client/public/font/` (Aptos + Merzalina) — fonts tracked in repo.

## CMS-first content pipeline

1. Static defaults: `client/src/translations/{en,es}.js`
2. CMS overrides: Firestore `assets/global.translations.{en,es}.*`
3. `LanguageContext.jsx` deep-merges (2) over (1) at runtime
4. Adding editable field: update `en.js` + `es.js` + `textSchema.js` — CMS picks up automatically

**Stale override foot-gun:** Firestore overrides persist forever. After changing a default in `en.js`, strip the old Firestore field via `server/scripts/strip-stale-overrides.mjs`.

## Site-map zones

- Geometry: `{x,y,w,h}` in 840×480 viewBox. Always run through `clampZone` before render/save.
- Defaults: `client/src/components/sitemap/zonesData.js`
- Public map: `client/src/pages/SiteMap.jsx`
- CMS editor: `client/src/components/cms/SiteMapZoneEditor.jsx`
- Inventory linkage: zone `inventoryId` maps to building key in `assets.inventory`

## Bundle discipline

Main JS chunk target: **under 500 kB** (currently ~205 kB gzipped ~66 kB).  
Firebase SDK: lazy-loaded. GSAP + Motion: vendor-split.

## Key files

### Client
| File | Role |
|---|---|
| `src/translations/en.js` + `es.js` | Static i18n defaults |
| `src/context/LanguageContext.jsx` | Deep-merge CMS over defaults |
| `src/hooks/useAssets.js` | Fetches `/api/cms/assets` (30s cache) |
| `src/assetsUrls.json` | Figma asset filename → Storage URL map |
| `src/firebase.js` | Lazy Firebase client SDK init |
| `src/styles/global.css` | All CSS — brand tokens + component styles |
| `src/components/cms/textSchema.js` | Drives CMS Text Content editor |
| `src/components/sitemap/zonesData.js` | Zone geometry + defaults |
| `src/components/sections/Hero.jsx` | Hero scroll/scrub + wordmark animation |
| `src/components/layout/Navbar.jsx` | Nav hide/reveal via hero progress event |
| `src/pages/SiteMap.jsx` | Public interactive master plan |
| `src/pages/Dashboard.jsx` | Admin panel (light theme, #F0EDE8) |

### Server
| File | Role |
|---|---|
| `index.js` | Express entrypoint, port 3001 |
| `routes/cms.js` | GET/POST/PATCH /api/cms/assets |
| `routes/contact.js` | Lead capture + Nodemailer |
| `routes/leads.js` | Admin lead list |
| `firebase.js` | Admin SDK init (uses `service-account.json`) |
| `data/assets.json` | Local fallback |
