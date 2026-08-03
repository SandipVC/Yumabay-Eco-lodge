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

### ADR-9.1 — Retain monolithic global.css
A script-based attempt to partition `global.css` into smaller modules (e.g. `hero.css`, `base.css`) failed because the regex parser did not account for variable lengths of comment headers (e.g., `/* ── Footer ────────── */`). This caused critical light-theme and baseline styles at the bottom of the file to be miscategorized, breaking the CSS cascade and turning the site entirely black.
**Decision:** Rolled back the changes to keep the monolithic `global.css`. Given the heavy reliance on cascade order (especially for responsive and light-theme overrides), partitioning it automatically is too fragile.

### ADR-9.2 — Footer social links are CMS driven
The footer social links (Instagram, Facebook, X) were originally hardcoded placeholders.
**Decision:** We have added `instagramUrl`, `facebookUrl`, and `xUrl` fields to the `footer` section in the CMS `textSchema.js`. The Footer component reads these fields directly from `useLang()` (via translations/CMS sync), allowing admins to update the `href` destinations without code changes. The Twitter bird logo was also replaced with an inline SVG for X.

### ADR-10 — In-context (WYSIWYG) CMS text editing
Operators struggled to map CMS text fields to where they appear on the site.
**Decision:** Added a hybrid in-context editor. A passive `<EditMark path="…">` wrapper
(`client/src/components/cms/EditMark.jsx`) tags visible body text across the section
components, Navbar and Footer. It is a **no-op outside edit mode** (renders children
unchanged → public site byte-identical). Admins enter edit mode from Dashboard → Text tab
("Edit on live site"); `EditModeContext` holds a per-language draft layered over CMS
overrides + defaults via the shared `deepMerge` (`client/src/utils/textMerge.js`), so the page
previews live. Clicking highlighted text opens `InlineTextEditor`'s popover with EN + ES inputs;
Save PATCHes the full `translations` section (mirrors `TextContentSection`).
**Kept the field-based `TextContentSection`** for invisible/long-tail strings (cms*, dashboard,
placeholders, state strings) that have no on-screen anchor.
**Note:** `.yb-em { pointer-events:auto }` under `body.yb-editing` re-enables clicks inside
non-interactive parents (e.g. the hero wordmark uses `pointer-events:none` for its scroll-fade).

### ADR-11 — Hero: expanding-card slider replaces scroll-scrub video
The scrub-video hero (pin + ScrollTrigger, ADR-8.2/8.3) is replaced by an auto-advancing
"expanding card" slider (branch `hero-new-animation`): upcoming-slide cards sit bottom-right;
every 6s (or on arrow/card click) the target card's image expands from its card rect to fill
the viewport (manual FLIP via a single `.hs-expander` layer animated with GSAP) and becomes
the new background. Reverse (prev) shrinks the current background back into the first card.
- **Slides are CMS-driven:** new `assets.heroSlider` array (max 8) — `{ src, kickerEn/Es,
  titleEn/Es, descEn/Es }` — managed in Media Manager → Hero (add/replace/delete/reorder +
  bilingual copy). Server: `heroSlider` cases in `server/routes/cms.js` (POST slot=index
  replaces image, no slot appends; DELETE body.slot removes; PATCH replaces whole array).
- **Shared-file guard:** seeded slides reference existing gallery Storage files; upload/delete
  only calls `deletePhysical` when the old path contains `heroSlider`, so replacing a seeded
  slide never deletes a gallery image.
- **Brand block is static:** left side shows only YUMA BAY + "Eco Lodge & Residences"
  (t.hero.title/titleEm/tagline) — it does not change with slides. No CTA button.
- **Autoplay decode guard:** the interval skips a tick until the next card's `<img>` is
  decoded (`complete && naturalWidth > 0`) — prevents expanding to a black background on
  slow networks. Card images load eagerly (no `loading="lazy"`).
- **Navbar reveal:** Hero now dispatches `yb-hero-progress = 1` once on mount (no scrub), so
  the header is visible immediately on Home. Navbar listener unchanged.
- **Mobile (≤900px):** arrows/progress/counter hidden (`.hs-ui{display:none}`); cards +
  brand block only.
- Old `assets.hero.{video,poster}` data and server cases are retained (poster still used by
  the Preloader), but the CMS Hero tab now manages only `heroSlider`.

### ADR-11.1 — Vite 8 peer-dep fix
Clean `npm install` in `client/` failed (ERESOLVE): `vite ^8.0.16` with
`@vitejs/plugin-react ^4.3.1` (peer allows vite ≤7). Bumped `@vitejs/plugin-react` → `^6.0.3`
(peer `vite ^8.0.0`). No `--legacy-peer-deps` needed anymore.

### ADR-12 — Prevent server listening during Functions discovery/deployment
During `firebase deploy`, the Firebase CLI imports `server/index.js` locally to discover exported Cloud Functions. Because neither `process.env.FIREBASE_CONFIG` nor `process.env.FUNCTIONS_EMULATOR` are set during local discovery, the Express app previously invoked `app.listen()`, binding to the CLI's discovery port and causing a `Timeout after 10000` (10 seconds) deployment failure.
**Decision:** Check if `index.js` is run directly by comparing `import.meta.url` with the file URL of the entrypoint `process.argv[1]`. `app.listen()` is only called if it is the main module (`isMain === true`). This prevents the server from listening during import/deployment discovery.

### ADR-13 — Scroll-linked Navbar reveal on Home
With the removal of the hero video scrub (ADR-11), the `yb-hero-progress` event was no longer dispatched based on scroll. This caused the header to stay visible on the home page at scroll=0, instead of hiding and sliding down as the user scrolls.
**Decision:** Remove the `yb-hero-progress` event listener/dispatch completely. Instead, in `Navbar.jsx`, calculate scroll progress directly in the scroll listener on the Home page (`window.scrollY >= window.innerHeight * 0.98`) to dynamically set `heroDone` and control `.nav-hidden` class activation. This restores the exact original scroll-linked header reveal behavior on Home while keeping it fully decoupled from the Hero component.

### ADR-14 — Hero Section UI/UX Refinement
To elevate the hero section of the Yuma Bay website to match luxury brand standards (e.g. Aman, Four Seasons) without changing the core design language.
**Decision:**
- **Alignment & Grid:** Implemented a unified layout grid padding (96px desktop, 64px tablet, 24px mobile).
- **Logo Block & Gallery Baseline:** Raised the logo/title block (`.hs-content`) and the gallery cards (`.hs-cards`) to align their baselines perfectly at `bottom: 128px` (desktop), reducing the gap between title and tagline to 8px.
- **Bottom Gradient & Overlay:** Reduced `.hero-fade` height to 38% and softened the color curve to reveal more of the pool and architecture. Added multi-gradient `.hero-overlay` with linear top shadow (nav legibility) and radial dark vignette/center wash using the `--ink` color (`rgba(10,30,38,...)`) to subtly reduce contrast and visual prominence of the "Welcome to Yuma Bay" sign.
- **Localized Logo Glow:** Added a soft, horizontally stretched white radial gradient backdrop (`ellipse at center`) behind the logo block (`.hs-content::before`) extending `140px` horizontally (`inset: -64px -140px`) on both desktop and mobile. This ensures complete legibility for the full width of the dark teal `YUMA BAY` logo text (specifically the word `BAY` on the right side) against any dark background components such as shadows or foliage.
- **Unified Navigation:** Restructured `.hs-ui` into a single unified pagination bar with arrows on the left, counter (`04 / 08`) in the middle, and a thin `1px` progress bar expanding to the right grid margin.
- **Mobile Stacked Layout:** Repositioned the layout on mobile (<=768px) into a clean vertical flow where the gallery becomes horizontally scrollable (overflow hidden scrollbar) and the unified navigation bar moves below the gallery.
- **Animations:** Added fade-in and 20px upward motion on the logo, fade-in and scale 0.98 -> 1.00 on the gallery cards, and fade-in on the navigation. Added a subtle scroll-linked parallax to the active background image.

### ADR-15 — Traditional Horizontal Slide Carousel
To replace the expanding-card FLIP transition with a classic horizontal sliding transition for the background photos, while removing the upcoming-slide card thumbnails.
**Decision:**
- **Remove Cards:** Completely removed the `.hs-cards` and `.hs-card` thumbnail elements from the JSX and CSS, allowing the full width of the screen to focus on the architecture and pool.
- **Traditional Slide Transitions:** Refactored the slider to render all slides absolute-positioned. Configured GSAP to animate transitions in a traditional Right-to-Left (exit left/enter right) direction for next, and Left-to-Right (exit right/enter left) for prev.
- **Minimal Navigation Dots:** Replaced the pagination bar (arrows, counter, and progress line) with centered minimal dot indicators at the bottom. Active dot expands into a modern `24px` horizontal pill using CSS transition logic, while clicking dots triggers direct sliding navigation in the correct directional flow.
- **Centered Brand Logo & Glow:** Positioned the logo block (`.hs-content`) and its pseudo-element white radial glow in the bottom-center of the screen (`left: 50%`, `transform: translateX(-50%)`, `bottom: 128px`), centered all internal text, and offset the letter-spacing on the tagline (`margin-right: -.34em`) to ensure mathematical centering.
- **Static Brand Layout & Proportions:** Replaced dynamic text switching with static luxury text (`YUMA BAY / CLUB LOUNGE / CARRIBEAN / EXCLUSIVE LIVING. ENDLESS HORIZONS.`) matching the reference image proportions and colors (#0F3C5F Navy and #C5A880 Gold) exactly. Spelled `CARRIBEAN` to match reference text, scaled up font-sizes, and restricted the entrance animations to mount-only so the text layer remains completely static and calm when background slide images change.
- **Remove Ken Burns Animation:** Removed the `hs-kenburns` zoom keyframes and animation from `.hs-bg-img` to present a calm, clean, static image during idle states.

### ADR-16 — Preloader Screen Refinements
To polish the preloader/loading screen to match luxury visual identity guidelines.
**Decision:**
- **Remove Percentage:** Removed `<div className="preloader-percentage">{percent}%</div>` to present a cleaner, less cluttered interface.
- **Enlarge Logo & Title:** Increased the palm tree logo scale to `clamp(64px, 16vw, 96px)` and the "YUMA BAY" title font size to `clamp(36px, 10vw, 56px)`.
- **Refine Spacing:** Increased the space between the logo and the title block (`margin-bottom: 24px` on logo wrap), tightened the gap inside the text block (`gap: 8px` on preloader content) to keep title/tagline closely grouped, and increased the distance to the progress bar (`margin-top: 48px`).

### ADR-17 — Floating WhatsApp Widget & Contact Page Editability
To replace the static footer WhatsApp icon with a more prominent, interactive widget, and improve CMS text editability.
**Decision:**
- **Floating Widget:** Implemented a new `WhatsAppWidget.jsx` component that displays a floating action button (FAB) in the bottom-right corner. When clicked, it expands a popup with customizable titles and multiple WhatsApp options.
- **Scroll-Linked Visibility:** Added a scroll listener to hide the widget when the user is at the very top (Hero section, first 300px) and smoothly fade/slide it in as they scroll down, preventing it from conflicting with the hero UI.
- **CMS Integration:** Added new translation fields (`whatsappWidgetTitle`, `whatsappWidgetSub`, `whatsappOp1Name`, `whatsappOp1Url`, etc.) to `en.js`, `es.js`, and `textSchema.js` so the widget is fully managed via the CMS.
- **Contact Page Live Editing:** Wrapped all visible strings, titles, placeholders, and button texts in the `Contact.jsx` page with `<EditMark>`, making it fully live-editable in the CMS dashboard inline editor, mirroring the main site and sitemap experience.
- **Dynamic Contact Links:** Replaced hardcoded `mailto:` and `wa.me` links in `Contact.jsx` to dynamically pull from `t.footer.email` and `t.footer.phone`, ensuring zero ambiguity between the displayed text and the link destination.
