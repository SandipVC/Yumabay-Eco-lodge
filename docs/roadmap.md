# Roadmap — Yuma Bay Eco Lodge Website

## Completed phases

| Phase | Branch | Status | Summary |
|---|---|---|---|
| Phase 0: Foundation | `phase-0-foundation` | ✅ | CMS project config block, footer pricing note |
| Phase 1: Text fixes | `phase-1-text-fixes` | ✅ | Real copy from PDFs (location, prices, stats, amenities) |
| Phase 2: Inventory data | `phase-2-inventory` | ✅ | 88 units transcribed from PRECIOS PDF into assets.json + Firestore |
| Phase 3: Properties refactor | `phase-3-properties-refactor` | ✅ | Dynamic min-price cards from inventory data |
| Phase 4: Sitemap interactive UI | `phase-4-sitemap-ui` | ✅ | Zone map linked to inventory, UnitGrid drill-down, inline enquiry |
| Phase 5: CMS inventory editor | `phase-5-cms-inventory` | ✅ | Unified Inventory tab in dashboard, bulk paste, status editing |
| Phase 6: Contact unit picker | `phase-6-contact-unit-picker` | ✅ | Unit dropdown on contact form, deep-link `?unit=AB103` |
| Phase 7: PDF brochures | `phase-7-verify` | ✅ | PDFs uploaded, download links on /sitemap + /contact |
| Post-7: Properties tag bug | `bug-text` | ✅ | Restored `prop-tag` rendering in Properties.jsx |
| Post-7: Preloader + lazy loading | `feature-loading` | ✅ | Luxury preloader, lazy images |
| Post-7: Sitemap backdrop + enquiry | `feature-sitemap` | ✅ | Blueprint image backdrop, inline enquiry sidebar |
| Post-7: Logo replacement | `feature-sitemap` | ✅ | SVG logo 2 replaced via Firebase Storage uploader |
| Design overhaul | `drishti-new-design` | ✅ | Hero scroll wordmark, gallery labels, dashboard light theme, sitemap dark panel |

## Active development

| Branch | Focus |
|---|---|
| `drishti-new-design` | UI redesign (merged into this branch, pushed 2026-06-29) |
| `text-changes-client` | Text / copy changes (current branch, branched from `drishti-new-design`) |

## Branch strategy

- `main` — production mirror. Never push directly.
- `firebase` — production target. All phases merge into this.
- `drishti-new-design` — active redesign work.
- `text-changes-client` — current branch for text/copy updates.

## Remaining work

- Merge `drishti-new-design` → `firebase` (or `main`) when ready for production.
- No outstanding feature phases.
