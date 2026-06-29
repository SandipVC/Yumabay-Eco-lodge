# Tasks — Yuma Bay Eco Lodge Website

_Updated: 2026-06-29_

## Current branch: `text-changes-client`

Branched from `drishti-new-design` on 2026-06-29.  
Purpose: client feedback implementation — Tiers A (text) + B (structural) complete; latest commit `1d1634e`.

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

---

## Pending / upcoming

| Task | Priority | Notes |
|---|---|---|
| Tier C: CSS/spacing tweaks (client feedback) | Medium | More whitespace, location section maritime feel, larger amenity images — awaiting sign-off on A+B |
| Merge `text-changes-client` → `drishti-new-design` → `firebase` | Medium | When sign-off received |

---

## Known bugs (open)

| # | Severity | Description | File |
|---|---|---|---|
| 1 | Medium | Dashboard hardcoded admin secret fallback | `Dashboard.jsx` |
| 2 | Low | CountUp fragile suffix parsing for stat3 | `About.jsx:91-93` |
| 3 | Low | Firebase API key in plain text in `firebase.js` | Acceptable for web SDK |
