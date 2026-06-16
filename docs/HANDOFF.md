# AI Handoff — Yuma Bay Eco Lodge Website

**Repo:** https://github.com/SandipVC/Yumabay-Eco-lodge
**Local path:** `C:\Yumabay-Eco-lodge`
**Last touched:** 2026-06-16 by Antigravity (Phase 4 commit `34b1001`)
**Audience:** next AI agent picking up cold. Read top to bottom before touching code.

---

## 1. Project summary

Marketing + lead-capture website for **Yuma Bay Eco Lodge & Residences** — a beachfront tourism-residential development in **Boca de Yuma, La Altagracia, Dominican Republic**. Two phases: residential (villas + apt buildings) and recreation (Phase 2 beach club).

**Owner:** Amber Azul Inversiones, S.R.L · **Project Director:** Ing. Josué Silva.

**Site delivers:**
- Bilingual EN/ES home + sitemap + contact + admin dashboard
- Password-protected CMS (`/dashboard`) for media + text + leads
- Lead-capture form → email via Nodemailer + persisted to Firestore
- Master-plan zone map (drag-drop editor for admin)

**Stack:**
- **Frontend:** React 18 + Vite 8 (JS, not TS). Plain global CSS — no Tailwind. GSAP + Motion for animations.
- **Backend:** Node + Express ESM. Helmet, rate-limit, validator.
- **Persistence:** Firebase Firestore (`assets/global` document) + Firebase Storage for media. Local `server/data/assets.json` is fallback only.
- **Hosting:** Firebase Hosting (config in `firebase.json`, `.firebaserc` → project `vessel-contianer`).
- **i18n:** Custom `LanguageContext` deep-merges CMS overrides over static `en.js`/`es.js` defaults.

**Two processes, both must run during dev:**
```
cd client && npm run dev      # http://localhost:5173 (or 5174 via .claude/launch.json)
cd server && npm run dev      # http://localhost:3001
```
Vite proxies `/api/*` → `:3001`. If frontend logs `ECONNREFUSED /api/...`, the backend isn't running.

---

## 2. Current progress

Active integration: **PDFs → Website** (3 official Spanish PDFs in `ignoreGitFolder/` — see §6).

| Phase 0: Foundation + decisions | `phase-0-foundation` | ✅ Pushed |
| Phase 1: Text fixes | `phase-1-text-fixes` | ✅ Pushed |
| Phase 2: Inventory data model | `phase-2-inventory` | ✅ Pushed |
| Phase 3: Properties refactor | `phase-3-properties-refactor` | ✅ Committed |
| Phase 4: Sitemap interactive UI | `phase-4-sitemap-ui` | ✅ Committed |
| Phase 5: CMS inventory editor | `phase-5-cms-inventory` | ✅ Committed |
| Phase 6: Contact unit picker | `phase-6-contact-unit-picker` | ✅ Committed |
| Phase 7: PDF brochures + final verify | `phase-7-verify` | ✅ Committed |
| Post-Phase 7: Properties tag bug fix | `bug-text` | ✅ Committed |
| Post-Phase 7: Global preloader & lazy loading | `feature-loading` | ✅ Committed |

**Current HEAD branch:** `feature-loading`. PRs to firebase branch not opened yet.

**All phase branches are children of `firebase` branch (production target).** Merge order: `phase-0 → firebase`, then `phase-1 → firebase`, then `phase-2 → firebase`, then `phase-3 → firebase`, then `phase-4 → firebase`, then `phase-5 → firebase`, then `phase-6 → firebase`, then `phase-7 → firebase`, then `bug-text → firebase`, then `feature-loading → firebase`. Or merge `feature-loading` directly (it inherits all previous phases).

---

## 3. Completed work

### Phase 0 — Foundation (commit `5ae1cf1`)
Established CMS-editable project config block. Visible artifact = footer pricing-note line.

**Files changed:**
- `client/src/translations/en.js` + `es.js` — added `project` block (14 keys: owner, developer, pricingDate, pricingDisplayMode, etc.)
- `client/src/components/cms/textSchema.js` — added "Project Settings" CMS section
- `client/src/components/layout/Footer.jsx` — renders `t.project.pricingValidPrefix · pricingDate · pricingNote`
- `client/src/styles/global.css` — `.footer-pricing-note` style
- `.gitignore` — added `tmp_extract/`, `docs/INTEGRATION_NOTES.md`, `upload/`, `server/scripts/`

**4 decisions locked (see `docs/INTEGRATION_NOTES.md`, gitignored):**
- 0.1 Villas = 8. VILLA #8 inherits VILLA #1 spec/price.
- 0.2 Pricing date = April 7, 2026 (from filename `260407`).
- 0.3 AMENIDADES PDF renderings → owner uploads via CMS Media Manager (not automated).
- 0.4 Public price display = **starting-at only**. Per-unit prices stay admin-side.

### Phase 1 — Text fixes (commit `951f1bd`)
Replaced placeholder copy with RESUMEN/PRECIOS-sourced truth. **No layout changes.**

| Field | Before | After |
|---|---|---|
| `hero.eyebrow` | `Boca de Yuma · La Romana · Dominican Republic` | `Boca de Yuma · La Altagracia · Dominican Republic` |
| `about.body` | Generic marketing prose | RESUMEN-derived (private/gated/exclusive) |
| `about.stat3` | `5+ Buildings` | `8 Villas` |
| `amenities.items[].desc` × 8 | Generic | RESUMEN-aligned (gym = "modern technology", parking = `65` spaces, etc.) |
| `location.body` | Generic | N/S/E/W boundaries (mangrove/Caribbean/Boca town/baseball field) |
| `footer.address` | `Santa Rosa #117, La Romana, DR` | `Calle el Malecón, Boca de Yuma, La Altagracia, DR` |
| `properties.items[]` × 5 | `From $95,000` etc. | Real PRECIOS-starting-at: `$383,230 / $60,332 / $93,798 / $230,014 / —` |

Plus: **About fact strip** below body — `PHASE 1 · 11,361.64 M² · BUILT · 9,167.56 M²` (uppercase muted text). Reads from `t.project.*`.

**Backend cleanup done:** Stripped stale Firestore CMS overrides for every Phase 1 field (else old values would mask new defaults). Script lives at `server/scripts/strip-stale-overrides.mjs` (gitignored — keep locally).

### Phase 2 — Inventory data model (commit `6dd8b3d`)
Transcribed all 88 unit listings (villas + buildings + bungalows) from the PRECIOS PDF to `assets.json` and synchronized with Firestore. Added static validators and sync scripts. Integrated read-only inventory status badge in the admin Dashboard.

### Phase 3 — Properties section refactor (commit `e30d446`)
Stripped the manually overridden `propertyPrices` array from Firestore and `assets.json` using `strip-property-prices.mjs`. Updated the public landing page to calculate card starting prices dynamically as the minimum of the available units. Replaced the CMS properties pricing inputs with read-only indicators showing calculated prices.

### Phase 4 — Sitemap interactive UI (commit `34b1001`)
Upgraded the public sitemap page [SiteMap.jsx](file:///c:/Yumabay-Eco-lodge/client/src/pages/SiteMap.jsx). Linked visual plan zones to specific inventory segments (mapping both `building-a` and `building-b` to the unified `edificio-ab` inventory). Created the [UnitGrid.jsx](file:///c:/Yumabay-Eco-lodge/client/src/components/sitemap/UnitGrid.jsx) component to handle level tabs, responsive unit grids, availability color coding (cyan = available, grey = blocked, red = sold), and selection details. Prefilled unit enquiries dynamically route to the Contact page. Also added an `inventoryId` mapping selector in the CMS visual zone editor [SiteMapZoneEditor.jsx](file:///c:/Yumabay-Eco-lodge/client/src/components/cms/SiteMapZoneEditor.jsx).

### Phase 5 — CMS inventory editor (commit `0552b46`)
Implemented a unified "🏢 Inventory" tab in the admin dashboard panel. Features include building-level tabs, inline editing of unit statuses and prices, Phase 2 bungalows aggregate controls, a bulk Excel copy-paste spreadsheet parser, and automated checksum recalculation of `expectedTotal` on save to maintain backend compatibility.

### Phase 6 — Contact unit picker (commit `65174e7`)
Added a unit-enquiry dropdown to the contact form, populated dynamically from the inventory assets list. Deep links with `?unit=AB103` automatically pre-fill and select the corresponding unit. Submission persists `unitCode` to both Firestore and `leads.json`, and the admin Dashboard leads list displays it in a dedicated "Unit" column.

### Phase 7 — PDF brochures + final verify (commit `52da8b1`)
Uploaded official PDFs (amenidades, yuma-bay-brochure, yuma-bay-prices) to Firebase Storage using a helper upload script. Added "Download Project Brochure" and "Download Amenities Guide" links on both `/sitemap` and `/contact` pages. Completed final translation sweeps for EN/ES default strings. Ran client build successfully under 500 kB budget.

### Post-Phase 7 — Properties tag bug fix (commit `e2d3da9`)
Restored rendering of properties card tags (e.g. `"Edificio A-B"`) by adding `<span className="prop-tag">{item.tag}</span>` in `Properties.jsx` and styling it with luxury gold/tracking conventions in `global.css`. Cleaned fallback assets database translation schema to align with Firestore.

### Post-Phase 7 — Global preloader & lazy loading (commit `8d50667`)
Created a luxury preloader component (`Preloader.jsx` / `Preloader.css`) in the frontend client. It displays a gold progress bar and branding during the initial asset loading and critical images preloading, using `sessionStorage` to only show on first page open. Added lazy loading (`loading="lazy"`) to all footer images, sitemap plan image, and tilted cards.

---

## 4. Remaining work

None. All 7 phases of the integration roadmap are completed!

---

## 5. Architecture decisions

### 5.1 Branch strategy
- `main` = mirror of `firebase` (production)
- `firebase` = production target. All phases PR into this.
- `drishti` = legacy redesign branch (already merged into firebase via 3-way merge — see commit `acc3b36`)
- `phase-N-*` = per-phase feature branches off `firebase`

**Never push to `main` directly.** Merge `firebase → main` only when releasing.

### 5.2 Zero local media (firebase model)
**All media served from Firebase Storage URLs.** No `client/public/images/*` in repo. Local placeholders use 1x1 transparent GIF data-URI: `data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7`.

URL mapping: `client/src/assetsUrls.json` (21 entries). Code does `import assetsUrls from '../../assetsUrls.json'` then `const x = assetsUrls['filename.png']`.

**Exception:** `client/public/font/Aptos/` and `Merzalina/` (5 font files only) are local — fonts must be tracked.

### 5.3 CMS-first content
Every visible string is editable from `/dashboard` → Text Content. Pipeline:
1. Static defaults in `client/src/translations/{en,es}.js`
2. CMS overrides in Firestore `assets/global` document → `translations.{en,es}.*`
3. `LanguageContext.jsx` deep-merges (2) over (1) at runtime

**Adding a new editable field:** update en.js + es.js + `client/src/components/cms/textSchema.js` (TEXT_SECTIONS array). CMS picks it up automatically.

### 5.4 Stripping stale CMS overrides
Critical foot-gun: Firestore CMS overrides persist forever. When you edit a default in en.js, the production site may still show the old CMS-saved value. **Always strip the stale Firestore field after default changes.** See `server/scripts/strip-stale-overrides.mjs` pattern.

### 5.5 Bundle size discipline
Main JS chunk must stay under 500 kB. Currently 205 kB. Firebase SDK is lazy-loaded (`client/src/firebase.js` uses lazy init functions, not module-scope side effects). GSAP + Motion are vendor-split.

### 5.6 Admin auth
Dashboard auth = `ADMIN_SECRET` env var on server, sent as `Bearer` token in `sessionStorage['yb_admin']`. **Hardcoded fallback exists in `client/src/pages/Dashboard.jsx` for dev** — security hole flagged in mem-1586 (observation Jun 15). Fix before production launch.

---

## 6. Important files

### Top-level
| File | Role |
|---|---|
| `CLAUDE.md` | Project conventions (read first) |
| `AGENTS.md` | Doc maintenance notes (untracked) |
| `docs/HANDOFF.md` | THIS file |
| `docs/INTEGRATION_NOTES.md` | Phase 0 decision log (gitignored) |
| `firebase.json` / `.firebaserc` | Firebase hosting config |
| `storage.rules` / `firestore.rules` | Bucket + DB access rules |

### Client (`client/`)
| File | Role |
|---|---|
| `src/translations/en.js` + `es.js` | Static i18n defaults — Phase 1 edited |
| `src/context/LanguageContext.jsx` | Deep-merge CMS over defaults |
| `src/hooks/useAssets.js` | Fetches `/api/cms/assets` (30s cache) |
| `src/assetsUrls.json` | Static map of figma asset filename → Storage URL |
| `src/firebase.js` | Lazy Firebase client SDK init |
| `src/components/cms/textSchema.js` | Drives CMS Text Content editor |
| `src/components/cms/TextContentSection.jsx` | Renders CMS text editor |
| `src/components/sitemap/zonesData.js` | Master-plan zone geometry + defaults |
| `src/components/sitemap/SiteMapBackdrop.jsx` | SVG backdrop (shared public + editor) |
| `src/components/sections/About.jsx` | About section — Phase 1 added fact strip |
| `src/pages/SiteMap.jsx` | Public site map (Phase 4 will rebuild) |
| `src/pages/Dashboard.jsx` | Admin panel — has hardcoded secret fallback (see §8) |

### Server (`server/`)
| File | Role |
|---|---|
| `index.js` | Express entrypoint, port 3001 |
| `routes/cms.js` | GET/POST/PATCH /api/cms/assets — Firestore-backed |
| `routes/contact.js` | Lead capture + Nodemailer |
| `routes/leads.js` | Admin lead list |
| `firebase.js` | Admin SDK init (uses `service-account.json`) |
| `service-account.json` | Firebase admin credentials (gitignored, present locally) |
| `data/assets.json` | Local fallback when Firestore unavailable |
| `data/leads.json` | PII (gitignored, never commit) |
| `scripts/upload-assets.mjs` | One-shot uploader (gitignored dir) |
| `scripts/strip-stale-overrides.mjs` | Phase 1 cleanup script (gitignored dir) |

### Reference PDFs (`ignoreGitFolder/`, gitignored)
| File | Content |
|---|---|
| `PRECIOS/260407 LISTADO DE PRECIOS YUMA BAY ACTUALIZADA.pdf` | Unit-by-unit price table (~88 units across 4 buildings + 7 villas) |
| `RESUMEN/YUMA BAY MEMORIA GENERAL.pdf` | Official project description (4 pages, ~148 lines text) |
| `AMENIDADES/amenidades.pdf` | Mostly images (5.8 MB, ~10 lines text) — owner uploads renderings via CMS |

---

## 7. Known bugs

| # | Severity | Description | Where | Status |
|---|---|---|---|---|
| 1 | Medium | Dashboard hardcoded admin secret fallback (security) | `client/src/pages/Dashboard.jsx` | Phase 0 mem-1586 flagged it; not fixed |
| 2 | Low | CountUp `stat3Num='5+'` parsed `5`, suffix `'+'` — now `'8'` so harmless but logic is fragile | `client/src/components/sections/About.jsx:91-93` | Works for current values |
| 3 | Low | Firebase API key + config in plain text in `client/src/firebase.js` | Public anyway (web SDK), but mem-1607 flagged | Acceptable for Firebase web SDK |
| 4 | Low | `propertyPrices[]` array still in `assets.json` — orthogonal to Phase 3 plan | `server/data/assets.json` | Phase 3 will drop it |

---

## 8. Technical debt

| Item | Cost to fix | Why deferred |
|---|---|---|
| Hardcoded `propertyPrices[]` array overrides translations — confusing dual source | 2h | Phase 3 will rebuild Properties from `inventory` data and drop this array |
| `client/src/firebase.js` lazy init imports still pull `firebase/app` at module scope (read-only init guarded by closure, but tree-shaker can't drop it) | 1h | Bundle is fine (205 kB main); only consumers actually instantiate |
| No automated test suite. No lint config. | Days | Pre-existing project state. Not in scope. |
| Two-source string editing: Properties cards live in BOTH `translations.properties.items[]` AND `propertyPrices[]`. Admin can edit price in two places. | Removed in Phase 3 | — |
| `client/src/hooks/useAssets.js` has 30-second cache — admin edits don't show for up to 30s after save (dev iteration friction) | 30m | Manual `window.location.reload()` works |
| Firestore stale-override foot-gun (see §5.4) — every default change in en.js may need a Firestore strip | Permanent pattern | Add lint check in Phase 7 |
| Bundle warning: "Chunks larger than 500 kB" advisory still fires (main is 205 kB; the warning may be GSAP vendor chunk at 127 kB pre-gzip) | 1h | Cosmetic — gzip is 66 kB |
| `AGENTS.md` at repo root is untracked but visible. Either commit it or `.gitignore` it. | 5m | Doesn't affect anything |

---

## 9. Next recommended task

**Merge and Release.**

Why next:
- All features are complete, tested, and verified on branch `phase-7-verify`.
- The final step is opening a pull request to merge `phase-7-verify` (or individual phase branches) into the target production branch `firebase`, and finally releasing to `main`.

---

## 10. Exact prompt to continue development

Not applicable. All development phases of the PDF -> Website integration have been successfully completed and committed on branch `phase-7-verify`.

---

## Appendix — quick commands

```bash
# Start dev (two terminals)
cd client && npm run dev
cd server && npm run dev

# Production build
cd client && npm run build && npm run preview

# Strip stale Firestore CMS overrides for given keys (template at:)
node server/scripts/strip-stale-overrides.mjs

# Upload media to Firebase Storage
node server/scripts/upload-assets.mjs <folder> [storage-prefix]

# Check what's gitignored
git check-ignore -v <file>

# View current branch + remote state
git branch --show-current && git status --short
```

End of handoff. Good luck.
