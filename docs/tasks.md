# Tasks — Yuma Bay Eco Lodge Website

_Updated: 2026-06-30_

## Current branch: `text-changes-client`

Branched from `drishti-new-design` on 2026-06-29.  
Purpose: client feedback implementation — Tiers A (text) + B (structural) + mobile hardening; latest commit `eb345e5`.

---

## Recently completed (on `drishti-new-design`, commit `816d410`)

| Task | Files | Done |
|---|---|---|
| Hero: hide navbar at scroll=0, show YUMA BAY wordmark centered | `Hero.jsx`, `Navbar.jsx`, `global.css` | ✅ |
| Hero: video scrub fades wordmark upward, navbar slides in when scrub done | `Hero.jsx`, `Navbar.jsx` | ✅ |
| Hero: remove "Explore Properties" + "Discover More" CTA buttons | `Hero.jsx` | ✅ |
| Hero: remove hero-fade div | `Hero.jsx`, `global.css` | ✅ |
| Gallery: bilingual EN/ES labels per image in CMS | `CmsPanel.jsx`, `server/routes/cms.js` | ✅ |
| Gallery: labels ON/OFF parent toggle | `CmsPanel.jsx`, `Gallery.jsx` | ✅ |
| Gallery: fix Load More button invisible (remove reveal class) | `Gallery.jsx` | ✅ |
| Gallery: hide overlay if label is empty | `Gallery.jsx` | ✅ |
| Gallery: backward-compat with legacy `label` field | `Gallery.jsx` | ✅ |
| Dashboard: convert to light theme (#F0EDE8) | `Dashboard.jsx`, `global.css` | ✅ |
| Dashboard: fix body/html dark bg leak on light theme | `Dashboard.jsx` | ✅ |
| CMS gallery: 14px label input font size | `CmsPanel.jsx` | ✅ |
| Sitemap info panel: dark when zone selected (has-zone) | `global.css` | ✅ |
| Sitemap info panel: light when idle/loading (no zone selected) | `global.css` | ✅ |
| Sitemap: remove AVAILABLE/LIMITED badge from info panel | `SiteMap.jsx` | ✅ |
| Sitemap: gold scrollbar on level-tabs strip | `global.css` | ✅ |

---

## Recently completed (on `text-changes-client`)

| Task | Files | Done |
|---|---|---|
| Hero subtitle: 4-pillar identity line | `en.js`, `es.js`, `Hero.jsx`, `global.css` | ✅ |
| Strip: identity-first messaging | `en.js`, `es.js` | ✅ |
| Gallery filters renamed (Villas / Apartments / Beach Club & Amenities / Boca de Yuma) | `en.js`, `es.js`, `Gallery.jsx` | ✅ |
| Contact form: Bungalows removed from sales interest options | `en.js`, `es.js` | ✅ |
| Properties: For Sale / Hospitality & Rental split with divider | `Properties.jsx`, `en.js`, `es.js`, `global.css` | ✅ |
| Props divider label: match section-label size (22px + parens) | `global.css` | ✅ |
| CMS Media Manager: gallery categories wired to public filters | `CmsPanel.jsx` | ✅ |
| Hero schema cleanup: removed unused `subtitle`/`exploreBtn`/`discoverBtn` | `textSchema.js`, `en.js`, `es.js` | ✅ |
| Gallery filter schema: count 4→5, label updated | `textSchema.js` | ✅ |
| Sitemap: info panel always dark (drop `.has-zone` qualifier from theme) | `global.css` | ✅ |
| Sitemap: drop AVAILABLE badge from selected-unit-header | `UnitGrid.jsx` | ✅ |
| Sitemap: drop page subtitle, "Interactive Zone Map" label, colour legend | `SiteMap.jsx` | ✅ |
| Sitemap: swap emoji icons for inline SVG line-art (top panel icon + zone pills + selected-zone card title) | `ZoneIcon.jsx`, `SiteMap.jsx`, `global.css` | ✅ |
| CMS Zone Editor: replace emoji input with icon dropdown + live SVG preview; backward-compat with legacy emoji values | `SiteMapZoneEditor.jsx` | ✅ |
| CMS / Dashboard: align typography + colour with public site (Jost / Cormorant, bumped sizes, teal/gold/ink tokens) | `global.css` | ✅ |
| CMS panel only: gold text → dark teal; font sizes +20% inside `.cms-panel` | `global.css` | ✅ |
| Tier C: padding rhythm across all sections | `global.css` | ✅ |
| Location section: watermark centered on map card (not whole section) | `Location.jsx`, `global.css` | ✅ |
| Location section: distance stat cards added below map | `Location.jsx`, `en.js`, `es.js`, `global.css` | ✅ |
| Leads table: all font sizes +20% (th 9→11px, td 13→16px, status/btn 9→11px) | `global.css` | ✅ |
| Leads table: color overrides for dash-light readability (ink on cream, teal badge variants) | `global.css`, `Dashboard.jsx` | ✅ |
| Gallery thumbnail grid: cat tag 8→11px, legacy tag 9→12px, queue label 10→14px, readable on cream | `global.css`, `CmsPanel.jsx` | ✅ |
| CMS Zone Editor: fix page scroll while wheel-zooming map (passive→non-passive listener) | `SiteMapZoneEditor.jsx` | ✅ |
| Gallery: per-image category `<select>` in thumbnail grid — reassign untagged images without re-uploading | `CmsPanel.jsx` | ✅ |
| CMS readability audit: verified Leads, Media (7 sub-tabs), Text Content for contrast | — | ✅ |
| Fix Text Content inputs: white-on-grey (2.3:1) → ink-on-white 15px; EN/ES tags → teal | `global.css` | ✅ |
| CMS panel gold→teal sweep (upload-btn, save-note, primary btn fill, thumb selection, price focus) — gold unreadable on cream | `global.css` | ✅ |
| Preloader dark→light theme (public site + dashboard loading screen) | `Preloader.css` | ✅ |
| New logo: bundled `/logo-yb.svg` in header, footer, preloader, favicon; CMS-overridable via new Branding section (server allows SVG) | `public/logo-yb.svg`, `Navbar.jsx`, `Footer.jsx`, `Preloader.jsx`, `App.jsx`, `index.html`, `CmsPanel.jsx`, `server/routes/cms.js`, `assets.json` | ✅ |
| CMS Media Manager i18n: all hardcoded English strings → `t.dashboard.cms*` (EN+ES); panel now follows dashboard EN/ES toggle; ~95 strings exposed in Text Content → Dashboard section | `CmsPanel.jsx`, `translations/en.js`, `translations/es.js`, `textSchema.js` | ✅ |

---

## Recently completed (mobile hardening + media-from-CMS, 2026-06-30)

| Task | Files | Done |
|---|---|---|
| Footer: white circle plate behind logo on dark bg | `global.css` | ✅ |
| Cross-browser blur fix (drop hand-written `-webkit-backdrop-filter`; lightningcss autoprefixes) — Firefox lost blur on built site | `global.css` | ✅ |
| About (mobile): stop `.about-side` overlapping the image (reset `translateY`) | `global.css` | ✅ |
| `.stat-num` font-size + `.about-stats .stat` height matched to `.distance-*` cards | `global.css` | ✅ |
| Hero (mobile): pin at mount (no free-scroll), `100lvh` + `ignoreMobileResize` (no URL-bar reflow / white strip), `anticipatePin` | `Hero.jsx`, `global.css` | ✅ |
| Preloader responsive (clamp sizing, overlay padding, no h-overflow) | `Preloader.css` | ✅ |
| Lock horizontal scroll (`overflow-x: clip` on html+body) | `global.css` | ✅ |
| Hero scrub video → CMS-only with static-poster fallback | `Hero.jsx` | ✅ |
| Build ships zero content media (`strip-bundled-media` plugin; dist 62MB→1.8MB); SiteMap PDF defaults → Storage URLs | `vite.config.js`, `SiteMap.jsx` | ✅ |
| Fix CMS video upload 500 (api memory 256MiB→1GiB, +120s; concat busboy chunks once) | `server/index.js`, `server/routes/cms.js` | ✅ |
| Storage uploads set `Cache-Control: public, max-age=31536000, immutable` — was `private, max-age=0`, so iOS re-downloaded ranges on every scrub seek (3+ min "load") | `server/routes/cms.js` | ADR-8.8 |
| Re-encoded hero scrub video from 4k source to 1080p with `-movflags +faststart`, `-g 1` (keyframe every frame), and `-crf 23`. Re-uploaded directly to Storage to bypass CMS memory limit | `tmp_video/intro.mp4`, `server/scripts/upload-assets.mjs` | ✅ |
| `Hero.jsx`: removed redundant `requestAnimationFrame` throttle from scroll handler to fix stuttering video seek on Android | `Hero.jsx` | ✅ |
| Tilted card: removed light-theme white gradient overlay on mobile screens (`display: none` for `<= 768px`) | `global.css` | ✅ |
| Tilted card: resized `about.main` image to fit within max `529x620` and uploaded directly to Storage | `server/scripts/upload-assets.mjs` | ✅ |
| Bundled images cleanup: uploaded `logo-yb.svg` and `favicon.svg` to Storage, updated component fallback references to use remote URLs, and deleted from `client/public/` | `global.css`, `Navbar.jsx`, `Footer.jsx`, `Preloader.jsx`, `CmsPanel.jsx`, `index.html` | ✅ |
| CTA Circle: fixed iOS Safari wobbling rotation bug by moving CSS spin animation from `<text>` SVG node to outer `<svg>` container | `global.css` | ✅ |

---

## Pending / upcoming

| Task | Priority | Notes |
|---|---|---|
| Merge `text-changes-client` → `drishti-new-design` → `firebase` | Medium | When sign-off received |
| Direct browser→Storage upload for media > 30MB | Low | Only if hosting large videos; bypasses 32MB Functions request cap |
| Tag untagged gallery images via the new per-thumb category select | Low | Admin task, no code needed |

---

## Known bugs (open)

| # | Severity | Description | File |
|---|---|---|---|
| 1 | Medium | Dashboard hardcoded admin secret fallback | `Dashboard.jsx` |
| 2 | Low | CountUp fragile suffix parsing for stat3 | `About.jsx:91-93` |
| 3 | Low | Firebase API key in plain text in `firebase.js` | Acceptable for web SDK |
