# AI Handoff — Yuma Bay Eco Lodge Website

**Repo:** https://github.com/SandipVC/Yumabay-Eco-lodge  
**Local path:** `C:\Yumabay-Eco-lodge`  
**Last updated:** 2026-07-15  
**Current branch:** `hero-new-animation` (branched from `cms-font`)  
**Audience:** next AI agent picking up cold. Read top to bottom before touching code.

> **Deploy note:** This site is live on **Firebase** — Hosting (`client/dist`) + a single
> Cloud Function `api` (`server/index.js` exported via `onRequest`) behind the `/api/**`
> rewrite. URLs: `vessel-contianer.web.app` / `.firebaseapp.com`.
> `firebase deploy --only hosting` ships the front-end; `--only functions:api` ships the
> server. **Function changes do NOT create a Hosting release** — that's why the Hosting
> console can show an "old" timestamp while the API is freshly deployed.

---

## 1. What is this project

Marketing + lead-capture website for **Yuma Bay Eco Lodge & Residences** — beachfront tourism-residential development in **Boca de Yuma, La Altagracia, Dominican Republic**.

See [`docs/project-overview.md`](project-overview.md) for full summary.  
See [`docs/architecture.md`](architecture.md) for technical architecture.

---

## 2. Current state (as of 2026-06-29)

**Active branch:** `text-changes-client` — created today for client text/copy review.  
**Parent branch:** `drishti-new-design` — large UI redesign committed at `816d410`.

### What's on `drishti-new-design` (commit `816d410`, pushed)

| Change | Files |
|---|---|
| Hero hides navbar at scroll=0, shows YUMA BAY wordmark centered | `Hero.jsx`, `Navbar.jsx`, `global.css` |
| Hero video scrub: wordmark fades up, navbar slides in after scrub | `Hero.jsx`, `Navbar.jsx` |
| Hero: CTA buttons removed, hero-fade div removed | `Hero.jsx` |
| Gallery: EN/ES labels per image (CMS + public), labels ON/OFF toggle | `CmsPanel.jsx`, `Gallery.jsx`, `server/routes/cms.js` |
| Gallery: Load More button fix (was invisible due to reveal timing) | `Gallery.jsx` |
| Dashboard: warm light theme `#F0EDE8`, body/html bg leak fixed | `Dashboard.jsx`, `global.css` |
| Sitemap info panel: dark only when zone selected (`has-zone`) | `global.css` |
| Sitemap: AVAILABLE/LIMITED badge removed from panel | `SiteMap.jsx` |
| Sitemap: gold scrollbar on level-tabs strip | `global.css` |

### What landed on `text-changes-client` (latest commit `c73d2e9`)

| Change | Files |
|---|---|
| Hero subtitle: 4-pillar identity line (Eco-Lodge · Residences · Hospitality · Investment) | `en.js`, `es.js`, `Hero.jsx`, `global.css` |
| Strip: identity-first messaging | `en.js`, `es.js` |
| Gallery filters renamed: Villas / Apartments / Beach Club & Amenities / Boca de Yuma | `en.js`, `es.js`, `Gallery.jsx` |
| Contact form: Bungalows removed from sales interest options | `en.js`, `es.js` |
| Properties: visual For Sale / Hospitality & Rental split with divider | `Properties.jsx`, `en.js`, `es.js`, `global.css` |
| Props divider label: matched section-label size (22px, `(` `)` parens, sage color) | `global.css` |
| CMS Media Manager: gallery categories wired to public filters (Villas / Apartments / Beach Club & Amenities / Boca de Yuma) | `CmsPanel.jsx` |
| Hero schema: removed `subtitle`, `exploreBtn`, `discoverBtn` (Hero.jsx no longer renders these) | `textSchema.js`, `en.js`, `es.js` |
| Gallery schema: filter count 4→5, hint label updated | `textSchema.js` |
| Sitemap: info panel now always dark (empty + selected); `.has-zone` qualifier dropped from theme rules | `global.css` |
| Sitemap: removed AVAILABLE status badge from selected-unit-header (still shows blocked/sold) | `UnitGrid.jsx` |
| Sitemap: removed page subtitle + "Interactive Zone Map" label + colour legend | `SiteMap.jsx` |
| Sitemap: replaced emoji icons with inline SVG line-art (villa / building / bungalow / eco / beach / pool / map); panel-icon now gold + visible on dark bg | `ZoneIcon.jsx` (new), `SiteMap.jsx`, `global.css` |
| CMS Zone Editor: emoji text input → icon dropdown with live SVG preview; backward-compat with legacy emoji values | `SiteMapZoneEditor.jsx` |
| CMS / Dashboard: typography + colour sweep — Jost body, Cormorant headings, bumped sizes, teal/gold/ink tokens. Scoped under `.dash-light` | `global.css` |
| CMS panel only: gold text → dark teal; font sizes +20% inside `.cms-panel` | `global.css` |
| Tier C padding rhythm across all public sections | `global.css` |
| Location: watermark centered on map card height (not whole section) | `Location.jsx`, `global.css` |
| Location: distance stat cards (LA Romana / Punta Cana / Santo Domingo / Beach Access) | `Location.jsx`, `en.js`, `es.js`, `global.css` |
| Leads table: all font sizes +20% (th/td/status/btn); ink-on-cream color overrides for readability | `global.css`, `Dashboard.jsx` |
| Gallery thumbnail grid: cat tag + legacy tag + queue label readable on cream bg | `global.css`, `CmsPanel.jsx` |
| CMS Zone Editor: wheel-scroll on map no longer also scrolls page (non-passive listener) | `SiteMapZoneEditor.jsx` |
| Gallery: per-thumbnail category `<select>` to reassign untagged images; change saved via existing Save Labels flow | `CmsPanel.jsx` |
| CMS readability fix: Text Content inputs were white-on-grey (~2.3:1, dark-theme leftover). Added `.cms-text-input` to `.dash-light` input group (ink/white/15px), EN/ES tags + list heads → teal. See ADR-6.7 | `global.css` |
| CMS panel gold→teal: gold reads poorly on cream. Remapped all gold to teal inside `.cms-panel` only (upload-btn, save-note, primary btn fill→teal, thumb selection, price focus). Leads/login keep gold. See ADR-6.8 | `global.css` |
| Preloader dark→light: `Preloader` renders globally (public site + `/dashboard`), so one fix covers both loading screens. Light cream bg, ink title, teal accents. See ADR-6.9 | `Preloader.css` |
| New logo wired everywhere + CMS-managed: bundled `/logo-yb.svg` default; header/footer/preloader read `assets.branding?.logo \|\| '/logo-yb.svg'`; favicon = `/logo-yb.svg` synced from CMS via `FaviconSync` in `App.jsx`. New Media Manager → Branding section (section `branding`, slot `logo`); server now accepts SVG (skips sharp resize). See ADR-7.1 | `public/logo-yb.svg`, `Navbar.jsx`, `Footer.jsx`, `Preloader.jsx`, `App.jsx`, `index.html`, `CmsPanel.jsx`, `server/routes/cms.js`, `server/data/assets.json` |
| CMS Media Manager fully i18n'd: every hardcoded English string in `CmsPanel.jsx` now reads `t.dashboard.cms*` via `useLang()` (each sub-component calls it). Panel follows the dashboard EN/ES toggle. ~95 keys added to en.js + es.js and exposed in Text Content → Dashboard section (editable). See ADR-7.2. NOT translated (intentional): `GALLERY_CATS`/`PROPERTY_NAMES` (data identifiers mirroring public filters) and the `SiteMapZoneEditor` sub-tool strings | `CmsPanel.jsx`, `translations/en.js`, `translations/es.js`, `textSchema.js` |

### Mobile hardening + media-from-CMS (2026-06-30, commits `a3367fb`→`eb345e5`)

| Change | Files | ADR |
|---|---|---|
| Footer: white circle plate behind logo for legibility on dark bg | `global.css` | — |
| Cross-browser blur: drop hand-written `-webkit-backdrop-filter` so lightningcss autoprefixes both (Firefox lost blur on the built site — minifier kept only the prefixed prop) | `global.css` | ADR-8.6 |
| About (mobile): reset `translateY` transform so `.about-side` text stacks below the image instead of overlapping | `global.css` | — |
| `.stat-num` font-size matched to `.distance-val` (`clamp(32px,1.5vw,56px)`); `.about-stats .stat` height made padding-based to match `.distance-stat` | `global.css` | — |
| Hero (mobile): pin created **at mount** (was gated on video `loadedmetadata` → free-scroll before pin); `ignoreMobileResize` + `100lvh` kill the URL-bar reflow + white strip; `anticipatePin` removes engage jump | `Hero.jsx`, `global.css` | ADR-8.3, ADR-8.4 |
| Preloader responsive: `clamp()` title/subtitle/logo + overlay padding + `overflow:hidden` (was overflowing narrow viewports) | `Preloader.css` | — |
| Lock horizontal scroll: `overflow-x: clip` on `html`+`body` (clip, not hidden — hidden breaks the ScrollTrigger pin) | `global.css` | ADR-8.5 |
| Hero scrub video now CMS-only (`assets.hero.video`); no bundled fallback; renders static poster when unset | `Hero.jsx` | ADR-8.2 |
| Build ships **zero content media**: `strip-bundled-media` Vite plugin removes `dist/{images,video,pdf}` post-build (dist 62MB→1.8MB). SiteMap PDF defaults repointed to Storage URLs | `vite.config.js`, `SiteMap.jsx` | ADR-8.1 |
| `api` function memory 256MiB→**1GiB** + 120s timeout — video upload OOM-killed at 256MiB; busboy chunks concatenated once (was twice) | `server/index.js`, `server/routes/cms.js` | ADR-8.7 |
| Storage uploads set `Cache-Control: public, max-age=31536000, immutable` — was `private, max-age=0`, so iOS re-downloaded ranges on every scrub seek (3+ min "load") | `server/routes/cms.js` | ADR-8.8 |

### UI + CMS updates (2026-06-30)

| Change | Files | ADR |
|---|---|---|
| Reverted CSS split partition (Regex bug caused light-theme rules to bundle incorrectly) | `global.css` | ADR-9.1 |
| Amenities header: bottom-aligned right-side text to match heading baseline | `global.css` | — |
| Translated "Book A Visit" button to "Visit Site plan" / "Visitar plano del sitio" | `en.js`, `es.js` | — |
| Footer: Replaced Twitter logo with inline X SVG logo | `Footer.jsx` | ADR-9.2 |
| CMS: Added editable URL fields for footer social links (Instagram, Facebook, X) | `textSchema.js`, `en.js`, `es.js`, `Footer.jsx` | ADR-9.2 |

### Hero expanding-card slider (2026-07-15, branch `hero-new-animation`)

| Change | Files | ADR |
|---|---|---|
| Hero rebuilt: scrub-video hero → auto-advancing expanding-card slider (card image FLIP-expands to fullscreen bg; prev shrinks bg back into card; autoplay 6s with image-decode guard; square cards; Ken Burns idle zoom; mobile hides arrows/progress row) | `Hero.jsx`, `global.css` | ADR-11 |
| Static brand block left (YUMA BAY + tagline only, no CTA, unaffected by slide changes) | `Hero.jsx`, `global.css`, `en.js`, `es.js` | ADR-11 |
| CMS: Hero tab manages `assets.heroSlider` (max 8) — add/replace/delete/reorder + bilingual kicker/title/desc per slide; new `heroSlider` POST/DELETE cases with shared-gallery-file delete guard | `CmsPanel.jsx`, `server/routes/cms.js`, `server/data/assets.json` | ADR-11 |
| Preloader also preloads first 3 slider images | `Preloader.jsx` | — |
| Navbar reveal: hero dispatches `yb-hero-progress = 1` on mount (no scrub anymore) | `Hero.jsx` | ADR-11 |
| `@vitejs/plugin-react` ^4 → ^6 (clean install with vite 8, no `--legacy-peer-deps`) | `client/package.json` | ADR-11.1 |

### Deployment & UI Fixes (2026-07-16)

| Change | Files | ADR |
|---|---|---|
| Fix deployment timeout: prevent `app.listen()` from running during functions discovery/deployment by checking `isMain` | `server/index.js` | ADR-12 |
| Restore scroll-linked Navbar reveal on Home: check scroll position in `Navbar.jsx` instead of using `yb-hero-progress` event | `Navbar.jsx`, `Hero.jsx` | ADR-13 |
| Refine Hero Section UI/UX layout, spacing, alignment, bottom gradient, localized logo glow, and animations to luxury brand standards | `Hero.jsx`, `global.css` | ADR-14 |
| Refactor Hero: remove thumbnails cards, disable Ken Burns zoom animation, implement a traditional Right -> Left horizontal sliding transition, center-align the brand logo/glow block at the bottom-center, replace progress pagination with modern centered dots, and implement static reference brand text proportions | `Hero.jsx`, `global.css` | ADR-15 |
| Refine Preloader layout: remove percentage text, increase YUMA BAY title font size, scale up logo height, and optimize vertical spacing | `Preloader.jsx`, `Preloader.css` | ADR-16 |

### Refresh Styling Fix (2026-07-17)

| Change | Files | ADR |
|---|---|---|
| Fix flash of default hero image and default fonts on page refresh by keeping preloader overlay active until CMS assets finish loading; hide progress bar on refresh | `Preloader.jsx` | — |
| Configure Preloader text elements to use dynamic CSS variables for fonts so they match the CMS-configured fonts | `Preloader.css` | — |
| Prevent automatic scroll-to-top on page refresh to preserve browser's native scroll restoration (e.g. on Gallery reload) | `App.jsx` | — |
| Redesign Cookie Consent banner to follow the website's warm light theme (cream background, ink text, teal buttons) | `global.css` | — |
| Disable Cookie Consent banner by default since no tracking cookies are set (kept commented out for easy future activation) | `Layout.jsx` | — |
| Change the website's default heading font to Cormorant Garamond (making it the default fallback brand font) to eliminate the preloader runtime font transition flicker | `global.css`, `CmsPanel.jsx`, `SiteMap.jsx`, `cms.js` | — |
| Cache CMS font selection (font-family + custom font file URL) in localStorage; inline script in index.html applies it synchronously before React renders — zero font flicker on refresh for any CMS-uploaded custom font | `index.html`, `App.jsx` | — |
| Load dynamic site map backdrop from CMS assets instead of hardcoded fallback; add site map backdrop and plan layout images to Preloader image list to cache them before rendering to eliminate load lag | `SiteMap.jsx`, `Preloader.jsx` | — |

### What's next

- Run `firebase deploy --only hosting,functions` to verify that the deployment completes without timeouts.
- Merge `text-changes-client` → `drishti-new-design` → `firebase` when client sign-off received.
- Merge `hero-new-animation` → `main` after client reviews the new hero slider.


**Note:** The hero scrub video iOS/Android buffering bug and touch-scroll keyframing issue have both been fully resolved. The video was re-encoded with `-movflags +faststart` and `-g 1`, and `Hero.jsx` was updated with `autoPlay` and a `touchstart` unlocker.

---

## 3. Dev setup

```bash
# Two terminals required
cd client && npm run dev   # http://localhost:5173
cd server && npm run dev   # http://localhost:3001
```

Vite proxies `/api/*` → `:3001`. If frontend logs `ECONNREFUSED`, backend isn't running.

---

## 4. Critical patterns to know

### Hero scroll decoupling
`Hero.jsx` → `CustomEvent('yb-hero-progress', { detail: 0–1 })` → `Navbar.jsx` listens.  
Navbar adds `.nav-hidden` (translateY(-100%)) until `detail >= 0.98`.  
Since the expanding-card slider (ADR-11) the hero has no scrub — it dispatches `1` once on
mount, so the header shows immediately on Home. The event contract is kept for Navbar compat.

### Gallery labels backward compat
`'labelEn' in img` = new record format (`labelEn`/`labelEs`).  
No key = legacy format (`label`). Never fall back across formats.

### CMS content stale foot-gun
Firestore overrides persist forever. After changing `en.js` default, strip old Firestore key via `server/scripts/strip-stale-overrides.mjs`.

### Dashboard light theme scoping
`.dash-light` class wraps entire dashboard. `Dashboard.jsx` `useEffect` sets `document.body.style.background = '#F0EDE8'` to prevent global dark CSS bleed.

### Sitemap panel dark scope
Info panel always dark (both empty and selected states). `.has-zone` qualifier was dropped.  
All dark overrides in `global.css` scoped to `.sitemap-info-panel .xxx` (no `.has-zone`).

### Gallery category assignment
Each thumbnail in CMS gallery grid has a `<select>` bound to `labelEdits[src].cat`.  
Changing it marks the gallery dirty → "Save Labels" PATCH persists. Same flow as label edits.  
Images with no `cat` show `— uncategorized —` option.

---

## 5. Files most likely to edit for text changes

| File | What it contains |
|---|---|
| `client/src/translations/en.js` | All English static defaults |
| `client/src/translations/es.js` | All Spanish static defaults |
| `client/src/components/cms/textSchema.js` | Drives CMS Text Content editor sections |

After editing defaults: check if Firestore has a stale override for the same key.

---

## 6. Known issues

| # | Issue | Location |
|---|---|---|
| 1 | Hardcoded admin secret fallback in Dashboard (dev only, security risk) | `Dashboard.jsx` |
| 2 | `useAssets` 30s cache means CMS edits take up to 30s to appear | `hooks/useAssets.js` |

---

## 7. Quick commands

```bash
# Production build verify
cd client && npm run build && npm run preview

# Check staged files before commit
git diff --stat --cached

# Strip stale Firestore CMS override
node server/scripts/strip-stale-overrides.mjs

# Upload media to Firebase Storage
node server/scripts/upload-assets.mjs <folder> [storage-prefix]

# Deploy front-end (Hosting)        — after client/ changes
npx firebase-tools@latest deploy --only hosting

# Deploy API (Cloud Function)       — after server/ changes
npx firebase-tools@latest deploy --only functions:api

# Tail function logs (debug uploads/errors)
npx firebase-tools@latest functions:log --only api
```

## In-context text editor (cms-upgrade branch)
- Entry: Dashboard → **Text** tab → **✏️ Edit on live site** (sets `sessionStorage.yb_edit`, needs `yb_admin`).
- `EditModeProvider` wraps `LanguageProvider` in `App.jsx`; `LanguageContext` previews the live draft when editing.
- New files: `utils/textMerge.js`, `context/EditModeContext.jsx`, `components/cms/EditMark.jsx`, `components/cms/InlineTextEditor.jsx`.
- Save needs the back-end (PATCH `/api/cms/assets` section `translations`). Same data store as the field panel.
