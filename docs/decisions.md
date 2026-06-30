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

### ADR-6.4 — Sitemap info panel: always dark
Both empty/loading and selected states use dark theme (simplified from earlier has-zone approach).  
All dark overrides scoped under `.sitemap-info-panel` (no `.has-zone` qualifier).

### ADR-6.5 — Zone editor wheel zoom uses non-passive listener
React `onWheel` attaches a passive listener; `e.preventDefault()` is silently ignored.  
Fix: native `svg.addEventListener('wheel', handler, { passive: false })` via `useEffect`.  
Ensures wheel zooming the canvas doesn't also scroll the page.

### ADR-6.6 — Gallery category edits share Save Labels flow
Per-thumbnail cat `<select>` writes to `labelEdits[src].cat` (same state as EN/ES label edits).  
No separate save path needed — existing PATCH `/api/cms/assets` with full gallery array handles it.

### ADR-6.7 — CMS Text Content inputs must opt into `.dash-light`
`.cms-text-input` shipped with the original dark CMS theme (white text on `rgba(0,0,0,.35)`).
When the dashboard went light (`.dash-light`), this class was omitted from the light input
override group, leaving white-on-grey (~2.3:1, fails WCAG AA) on the Text Content tab.
Fix: add `.cms-text-input` to the `.dash-light` input group (ink on white, 15px).
**Rule:** any new CMS input class must be added to the `.dash-light` override group in `global.css`.

### ADR-6.8 — CMS panel uses teal, not gold (readability)
Gold (`#CA9352`) reads poorly as text/accent on the cream dashboard (`#F0EDE8`).
**Inside `.cms-panel` only**, all gold is remapped to teal (`--teal #0A4C58`):
upload-btn text/border, save-note, pdf hovers, primary button fill (gold→teal, white text ~8:1),
thumbnail selection border + checkbox, price-field focus. Leads + login views keep gold (out of scope).
Override block lives at the end of the `.dash-light .cms-panel` section in `global.css`.
Supersedes the dark-on-gold button from ADR-6.7 — `.dash-light .cms-panel .cms-btn-gold` is teal-filled.

### ADR-6.9 — Preloader is light theme
`Preloader` (`components/ui/Preloader.jsx`) renders globally in `App.jsx`, so it shows on the
public site **and** `/dashboard`. Was dark (`#060609`); switched to light (`#F0EDE8` bg, ink title,
teal subtitle + progress bar, ink-alpha percentage) to match the rest of the app. One component =
both "loading screens". Shown once per session via `sessionStorage['yb_preloader_shown']`.

### ADR-7.1 — Site logo is CMS-managed with a bundled fallback
The brand logo is a single source of truth across header, footer, preloader **and favicon**.
- **Default:** `client/public/logo-yb.svg` (served at `/logo-yb.svg`), referenced directly in
  `index.html` for the favicon and as the fallback in components.
- **Override:** Media Manager → **Branding** (section `branding`, slot `logo`). Stored at
  `assets.branding.logo`. Components read `assets.branding?.logo || '/logo-yb.svg'` via `useAssets`.
- **Favicon sync:** `FaviconSync` in `App.jsx` rewrites `<link rel="icon">` when a CMS logo is set.
- **Server:** `cms.js` now accepts `.svg` (added to both multer + busboy filters) and
  `resizeIfNeeded` early-returns for SVG so sharp never rasterizes vector logos.
**Rule:** logo changes should flow through the CMS Branding slot, not by editing components.

### ADR-7.2 — CMS Media Manager strings live under `t.dashboard.cms*`
`CmsPanel.jsx` shipped with hardcoded English, so the Media Manager never followed the
dashboard EN/ES toggle. Fixed by routing **all** visible strings through translations:
- Keys are **flat** under `t.dashboard` with a `cms` prefix (e.g. `cmsHeroHint`, `cmsTabGallery`,
  `cmsGalEmpty`). Flat — because the Text Content editor renders one input per top-level key and
  shallow-merges the section object; a nested object would render as `[object Object]`.
- Each `CmsPanel` sub-component calls `useLang()` itself (`const c = t.dashboard`) rather than
  threading props — leaf components (`AssetThumb`, `PdfSlot`) included.
- Tab labels/descriptions come from `SECTIONS[].labelKey/descKey` → `c[key]`.
- All keys are exposed in `textSchema.js` → Dashboard section so they are CMS-editable, and the
  `useLang` deep-merge means a CMS override updates the live panel.
- **Out of scope (left English):** `GALLERY_CATS` + `PROPERTY_NAMES` (data identifiers that mirror
  the public gallery filters / property cards) and the `SiteMapZoneEditor` sub-tool.
**Rule:** any new CMS-panel string must be added as a `cms*` key in en.js **and** es.js (and
usually textSchema.js), never hardcoded in `CmsPanel.jsx`.

### ADR-8.1 — Build ships zero content media (enforces ADR-1.1 at build time)
ADR-1.1 declared "zero local media," but `client/public/{images,video,pdf}/` (~167MB, gitignored)
was still being copied into `dist/` by Vite and uploaded on every deploy. A `strip-bundled-media`
plugin in `vite.config.js` (`apply: 'build'`, `closeBundle`) deletes `dist/{images,video,pdf}`
after build → dist dropped 62MB→1.8MB. All content media is served by URL from Firebase Storage.
**Kept in the bundle (not content media):** `favicon.svg`, `logo-yb.svg` (the CMS-branding
fallback, ADR-7.1), `font/`. **Rule:** never reference local `/images|/video|/pdf` paths in code —
use CMS/Storage URLs (the two SiteMap PDF defaults were the last offenders, now Storage URLs).

### ADR-8.2 — Hero scrub video is CMS-only, static-poster fallback
No video bundled. `Hero.jsx` reads `assets.hero.video`; empty → renders a static `.hero-img`
poster with **no pin/scrub** (and reveals the navbar immediately) so the page still works.
Upload a scrub clip in CMS → Media Manager → Hero to enable the scroll-scrub hero.

### ADR-8.3 — Hero ScrollTrigger pin is created at mount, not on metadata
The pin used to be built inside `setup()` gated on the video `loadedmetadata` event. On slower
mobile networks metadata lands after first paint, so the hero free-scrolled (video visibly slid
up) until the pin snapped in mid-scroll. Now the pin is created at mount with a **dynamic runway**
(one viewport until `video.duration` is known, then `ScrollTrigger.refresh()` expands it);
`anticipatePin: 1` removes the engage jump. Seeks are still rAF-throttled.

### ADR-8.4 — Mobile viewport: `100lvh` + `ignoreMobileResize`
Full-screen pinned hero on mobile fought the URL-bar dance two ways: `100vh` mismatched the pin
viewport (white strip below the video), and the bar show/hide fired resizes that re-pinned
mid-scroll. Fix: `#hero { height: 100lvh }` (largest viewport, `100vh` fallback) + a one-time
`ScrollTrigger.config({ ignoreMobileResize: true })` at module load. Do **not** reintroduce
JS `innerHeight` sizing — it captures the short (bar-visible) viewport and reopens the gap.

### ADR-8.5 — Horizontal-scroll lock uses `overflow-x: clip`, not `hidden`
Reveal/slide-in transforms (`.prop-*` rows) pushed the doc wider than the viewport on mobile.
`overflow-x: hidden` on the scroll root would turn the page into a scroll container and break the
GSAP pin; `overflow-x: clip` clips without that side effect. Applied to **both** `html` and `body`
(html is the scroll root) + `max-width: 100%` on body.

### ADR-8.6 — Don't hand-write `-webkit-backdrop-filter` (lightningcss quirk)
rolldown-vite minifies CSS with lightningcss. When source explicitly writes
`-webkit-backdrop-filter`, lightningcss treats it as authoritative and **drops the standard
`backdrop-filter`** sibling → non-WebKit engines (Firefox) lost the blur on the built site (dev
served raw CSS, so it only showed after deploy). **Rule:** author only the standard
`backdrop-filter`; lightningcss autoprefixes both. `css.lightningcss.targets` / `build.cssTarget`
are **ignored** by rolldown-vite, and `cssMinify: 'esbuild'` errors (esbuild isn't installed).

### ADR-8.7 — `api` function memory 1GiB; uploads capped at ~30MB
CMS video upload 500'd: function logs showed `Memory limit of 256 MiB exceeded with 286 MiB used`
— the default 256MiB function buffered a 26MB video several times (rawBody + busboy chunks +
a double `Buffer.concat` + the Storage upload buffer). Fix: `onRequest({ memory: '1GiB',
timeoutSeconds: 120 })` and concat busboy chunks once. **Hard limit:** Firebase Hosting →
Functions caps the request body at **32MB**, so CMS uploads must stay under ~30MB regardless of
memory; larger media needs a direct browser→Storage upload (not yet built).

### ADR-8.8 — Storage uploads set long immutable `Cache-Control`
Uploads passed no `cacheControl`, so Storage served `private, max-age=0`. The scroll-scrub hero
issues many Range requests; with no caching iOS Safari re-downloaded byte ranges on every seek
(3+ min "load"). Uploads now set `public, max-age=31536000, immutable` (filenames are
timestamp-prefixed → safe to cache forever). Applies to images, PDFs, video. Existing objects
keep old headers until re-uploaded (or patched via a one-off admin `setMetadata`).
**Separate, owner-side:** encode scrub videos with `-movflags +faststart` so iOS doesn't need the
whole file before it can seek.
