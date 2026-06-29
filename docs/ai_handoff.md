# AI Handoff — Yuma Bay Eco Lodge Website

**Repo:** https://github.com/SandipVC/Yumabay-Eco-lodge  
**Local path:** `C:\Yumabay-Eco-lodge`  
**Last updated:** 2026-06-29  
**Current branch:** `text-changes-client` (branched from `drishti-new-design`) · latest commit `c73d2e9`  
**Audience:** next AI agent picking up cold. Read top to bottom before touching code.

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

### What's next

Merge `text-changes-client` → `drishti-new-design` → `firebase` when client sign-off received.

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
| 3 | `AGENTS.md` at repo root is untracked | repo root |

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
```
