# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Yuma Bay — Eco Lodge & Residences

Marketing + lead-capture website for a beachfront resort development in Boca de Yuma,
Dominican Republic. Bilingual (EN/ES), with a password-protected CMS for managing media,
prices, and the interactive master-plan map.

## Architecture — two separate processes

This is a monorepo with **two apps that must both be running** during development:

| App | Folder | Stack | Port | Start command |
|-----|--------|-------|------|---------------|
| Front-end | `client/` | React 18 + Vite (JS, not TS) | 5173 | `npm run dev` |
| Back-end (API) | `server/` | Node + Express (ESM, `"type":"module"`) | 3001 | `npm run dev` (nodemon) |

There is **no root `package.json`** — run each app in its own terminal:

```
# terminal 1
cd client && npm run dev      # http://localhost:5173

# terminal 2
cd server && npm run dev      # http://localhost:3001
```

Vite proxies `/api/*` → `http://localhost:3001` (see `client/vite.config.js`). If the
front-end logs `ECONNREFUSED /api/...`, the **back-end isn't running** — start it.
Both bind `0.0.0.0`, so the site is reachable on the LAN (e.g. `http://<your-ip>:5173`).

## Front-end conventions (`client/`)

- **Plain global CSS** in `src/styles/global.css` — no Tailwind/Bootstrap. Brand colors are
  CSS custom properties on `:root` (`--dark`, `--gold`, `--white`, `--deep`, `--ocean`,
  `--sand`, `--coral`). Match the existing class-naming and section structure when adding styles.
- Fonts: Cormorant Garamond (headings) + Jost (body).
- **Bilingual** via `src/context/LanguageContext.jsx`; all copy lives in
  `src/translations/en.js` and `es.js` (keep both in sync). Components read `const { t } = useLang()`.
- **Scroll-reveal**: elements get `className="reveal"` (start at `opacity:0`). The
  IntersectionObserver that adds `.visible` is wired **once** in `components/layout/Layout.jsx`
  via `useRevealAll([pathname])` — do NOT add per-page observers. Any page under `Layout`
  gets reveal for free.
- Routing (React Router v6): `/` (Home), `/contact`, `/sitemap`, `/dashboard`. `/dashboard`
  is outside `Layout`. A `ScrollReset` hook in `App.jsx` auto-scrolls to top on route change.
- **Dashboard auth**: the admin secret is stored in `sessionStorage` under key `yb_admin` and
  sent as a `Bearer` token on every CMS/leads API call. The server checks it against
  `process.env.ADMIN_SECRET`.

## Back-end conventions (`server/`)

- Express + Helmet + `express-rate-limit` + `express-validator`. ESM imports.
- Routes: `routes/contact.js` (lead capture + Nodemailer), `routes/leads.js` (admin lead list),
  `routes/cms.js` (media/content management, multer uploads).
- Flat-file JSON stores in `server/data/`:
  - `leads.json` — submitted enquiries (**PII, gitignored, never commit**).
  - `assets.json` — CMS content config (image/video/PDF paths, property prices, site-map zones). Tracked.
- `server/.env` (gitignored) holds `PORT`, SMTP settings, `TEAM_EMAIL`, `CLIENT_ORIGIN`,
  and `ADMIN_SECRET`. See `server/.env.example`. In production set `CLIENT_ORIGIN` to the real
  domain (dev reflects any origin for LAN testing).

## CMS (`/dashboard`)

Log in with the admin secret (`ADMIN_SECRET` from `server/.env`). Two tabs:
- **Leads** — view/triage contact-form submissions.
- **Media Manager** — per-section asset control: Hero, About, Properties (images + editable
  prices), Gallery (drag-drop multi-upload, bulk delete), Lounge, and **Site Map** (plan image,
  PDFs, and a visual drag-and-drop **zone-map editor**).

### CMS data flow
- Front-end reads all content via the `useAssets()` hook (`src/hooks/useAssets.js`, 30 s cache)
  → `GET /api/cms/assets`. Every section component falls back to hardcoded defaults if the API
  is down, so the public site never breaks.
- Saving: `POST /api/cms/assets/:section/:slot` (file uploads, bearer-auth) and
  `PATCH /api/cms/assets` (`{section, data}` for non-file content like prices/zones).
- The **site-map zones** live in `assets.sitemapZones`. Shared geometry/colors/defaults are in
  `client/src/components/sitemap/zonesData.js`; the SVG backdrop is `SiteMapBackdrop.jsx`
  (used by both the public page and the editor). The editor is
  `client/src/components/cms/SiteMapZoneEditor.jsx`. Geometry uses `{x,y,w,h}` in an 840×480
  viewBox; always run zones through `clampZone` before rendering/saving.

## Build & verify

```
cd client && npm run build      # must succeed before shipping
cd client && npm run preview    # serves the production build locally (port 4173)
```
Use the `preview_*` tools (or Playwright) to verify UI changes in the browser; never ask the
user to check manually.

There are **no tests and no lint config** in this project.

## Git / what NOT to commit

`.gitignore` excludes: `node_modules/`, `client/dist/`, all media
(`client/public/{images,video,pdf}/`), `server/.env` + any `.env`, `server/data/leads.json`
(PII), the reference `yuma_bay_website.html`, and archives (`*.rar`/`*.zip`/`*.7z`).
Never `git add -A` blindly — confirm media/PII/large archives aren't staged.
Default branch is `main`; branch before committing if asked to commit while on `main`.

Commit trailer: `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`
