# AI Handoff — Yuma Bay Eco Lodge Website

**Repo:** https://github.com/SandipVC/Yumabay-Eco-lodge  
**Local path:** `C:\Yumabay-Eco-lodge`  
**Last updated:** 2026-06-29  
**Current branch:** `text-changes-client` (branched from `drishti-new-design`) · commit `f8d5cbb`  
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

### What landed on `text-changes-client` (commit `f8d5cbb`)

| Change | Files |
|---|---|
| Hero subtitle: 4-pillar identity line (Eco-Lodge · Residences · Hospitality · Investment) | `en.js`, `es.js`, `Hero.jsx` |
| Strip: identity-first messaging | `en.js`, `es.js` |
| Gallery filters renamed: Villas / Apartments / Beach Club & Amenities / Boca de Yuma | `en.js`, `es.js`, `Gallery.jsx` |
| Contact form: Bungalows removed from sales interest options | `en.js`, `es.js` |
| Properties: visual For Sale / Hospitality & Rental split with divider | `Properties.jsx`, `en.js`, `es.js`, `global.css` |

### What's next

Tier C (CSS / spacing tweaks per client feedback) — pending client review of A+B first.

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
`.sitemap-info-panel.has-zone` = dark. `.sitemap-info-panel` (no class) = light theme.  
All dark overrides in `global.css` scoped to `.sitemap-info-panel.has-zone .xxx`.

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

## 7. Next recommended task

Apply client text/copy feedback on `text-changes-client`, then open PR to merge `drishti-new-design` → `firebase` for production release.

---

## 8. Quick commands

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
