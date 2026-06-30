# Project Overview — Yuma Bay Eco Lodge & Residences

**Repo:** https://github.com/SandipVC/Yumabay-Eco-lodge  
**Owner:** Amber Azul Inversiones, S.R.L  
**Project Director:** Ing. Josué Silva  
**Location:** Boca de Yuma, La Altagracia, Dominican Republic  

---

## What it is

Marketing + lead-capture website for a beachfront tourism-residential development. Bilingual (EN/ES). Two phases of the real estate product: residential (villas + apartment buildings) and recreation (Phase 2 beach club).

## What it delivers

| Feature | Detail |
|---|---|
| Public site | Home, Gallery, Properties, About, Amenities, Contact, Sitemap |
| Bilingual | EN + ES via custom `LanguageContext`; all strings CMS-editable |
| Lead capture | Contact form → Nodemailer email + Firestore persistence |
| CMS | Password-protected `/dashboard` — media, text, prices, site-map zones, leads |
| Master plan map | Interactive SVG zone map with inventory drill-down |
| Admin dashboard | Leads triage + CMS Media Manager + Text Content editor |

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite (JS, not TS). Plain global CSS. GSAP + Motion for animations. |
| Backend | Node + Express ESM. Helmet, rate-limit, validator. |
| Persistence | Firebase Firestore (`assets/global` doc) + Firebase Storage for media |
| Hosting | Firebase Hosting (`firebase.json`, `.firebaserc` → project `vessel-contianer`) |
| i18n | `LanguageContext.jsx` deep-merges Firestore CMS overrides over static `en.js`/`es.js` |

## Dev setup

```bash
cd client && npm run dev   # http://localhost:5173
cd server && npm run dev   # http://localhost:3001
```

Vite proxies `/api/*` → `:3001`. Both bind `0.0.0.0` for LAN access.

## Production build

```bash
cd client && npm run build   # must pass before shipping
cd client && npm run preview # verify at :4173
```

## Key constraints

- All media served from Firebase Storage — **no committed images/video**
- `server/.env`, `server/data/leads.json` (PII) are gitignored — never commit
- Never `git add -A` — confirm no media/PII staged
