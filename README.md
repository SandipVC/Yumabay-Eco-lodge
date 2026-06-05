# Yuma Bay Eco Lodge — Website

Full-stack website for **Yuma Bay Eco Lodge & Residences**, Boca de Yuma, Dominican Republic.

## Stack

| Layer     | Tech                                        |
|-----------|---------------------------------------------|
| Front-end | React 18 + Vite, React Router, plain CSS    |
| Back-end  | Node.js + Express, JSON file store          |
| Email     | Nodemailer (SMTP — configure in `.env`)     |

---

## Quick Start

### 1 — Install dependencies

```bash
# Server
cd server
npm install

# Client
cd ../client
npm install
```

### 2 — Configure environment

```bash
cp server/.env.example server/.env
# Edit server/.env with your SMTP credentials and admin secret
```

### 3 — Run in development

Open **two terminals**:

```bash
# Terminal 1 — API server (port 3001)
cd server
npm run dev

# Terminal 2 — React dev server (port 5173)
cd client
npm run dev
```

Visit: [http://localhost:5173](http://localhost:5173)

---

## Production build

```bash
# Build the React app
cd client
npm run build

# Serve the API (serves client/dist as static files in prod setup)
cd ../server
npm start
```

---

## Pages & Routes

| URL           | Description                                   |
|---------------|-----------------------------------------------|
| `/`           | Home — all sections (Hero, About, Properties, Gallery, Lounge, Amenities, Location, CTA) |
| `/contact`    | Enquiry form → API → email + lead saved       |
| `/sitemap`    | Interactive SVG master plan                   |
| `/dashboard`  | Admin lead tracking dashboard (password protected) |

---

## API Endpoints

| Method | Path             | Description                         |
|--------|------------------|-------------------------------------|
| GET    | `/api/health`    | Health check                        |
| POST   | `/api/contact`   | Submit enquiry (rate limited 10/15m)|
| GET    | `/api/leads`     | List all leads (requires admin key) |
| PATCH  | `/api/leads/:id` | Update lead status/notes            |

---

## Environment Variables (server/.env)

| Variable        | Description                                      |
|-----------------|--------------------------------------------------|
| `PORT`          | API server port (default: 3001)                  |
| `SMTP_HOST`     | SMTP server hostname                             |
| `SMTP_PORT`     | SMTP port (587 for TLS)                          |
| `SMTP_SECURE`   | `true` for port 465, `false` for STARTTLS        |
| `SMTP_USER`     | SMTP username / email                            |
| `SMTP_PASS`     | SMTP password or app password                    |
| `FROM_EMAIL`    | Sender email address                             |
| `FROM_NAME`     | Sender display name                              |
| `TEAM_EMAIL`    | Team email for lead notifications                |
| `CLIENT_ORIGIN` | React dev server URL for CORS                    |
| `ADMIN_SECRET`  | Bearer token for dashboard access                |

---

## Admin Dashboard

Visit `/dashboard` and enter the `ADMIN_SECRET` from `server/.env`.

Features:
- View all leads with date, name, email, property interest, message
- Mark leads as Contacted or Closed
- Add notes per lead
- Status counters (New / Contacted / Closed)

---

## Bilingual Support

Click the **EN / ES** toggle in the navbar to switch between English and Spanish. All text content, form labels, and CTAs are translated. The contact form submission language is sent to the backend so the auto-reply email matches the visitor's language.

---

## Assets

- Images → `client/public/images/`
- Drone video → `client/public/video/hero.mp4`
- Floor plan PDFs → `client/public/pdf/`

---

## Google Search Console

Replace the `REPLACE_WITH_YOUR_GSC_VERIFICATION_TOKEN` meta tag value in `client/index.html` with your actual Google Search Console verification token. A `sitemap.xml` is served from `client/public/sitemap.xml`.
