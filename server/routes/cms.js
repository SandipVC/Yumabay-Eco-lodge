import { Router } from 'express';
import multer from 'multer';
import {
  readFileSync, writeFileSync, unlinkSync,
  existsSync, mkdirSync,
} from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const router = Router();
const __filename = fileURLToPath(import.meta.url);
const __dir     = dirname(__filename);
const ASSETS_FILE = join(__dir, '../data/assets.json');
const PUBLIC_DIR  = join(__dir, '../../client/public');

// ── Auth ─────────────────────────────────────────────────────────────────────
function auth(req, res, next) {
  const secret   = process.env.ADMIN_SECRET;
  if (!secret) return next();
  const provided = (req.headers.authorization || '').replace('Bearer ', '').trim();
  if (provided !== secret) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

// ── Asset store ───────────────────────────────────────────────────────────────
function readAssets() {
  try { return JSON.parse(readFileSync(ASSETS_FILE, 'utf-8')); }
  catch { return { hero: {}, about: {}, properties: [], gallery: [], lounge: [] }; }
}

function writeAssets(data) {
  writeFileSync(ASSETS_FILE, JSON.stringify(data, null, 2));
}

// Original bundled files that must never be physically deleted (only unlinked from the registry)
const PROTECTED_FILES = new Set([
  '/video/hero.mp4',
  '/pdf/MASTER PLAN YUMA BAY.pdf',
  '/pdf/PARCELAS VILLAS  YUMA BAY.pdf',
]);

// Only delete files that were uploaded via CMS (live under /images/cms/, /video/, or /pdf/)
function deletePhysical(filePath) {
  if (!filePath || PROTECTED_FILES.has(filePath)) return;
  const isCms   = filePath.includes('/images/cms/');
  const isVideo = filePath.startsWith('/video/');
  const isPdf   = filePath.startsWith('/pdf/');
  if (!isCms && !isVideo && !isPdf) return;
  const abs = join(PUBLIC_DIR, filePath);
  if (existsSync(abs)) { try { unlinkSync(abs); } catch {} }
}

// ── Multer storage ────────────────────────────────────────────────────────────
const isVideoFile = (name) => /\.(mp4|webm|mov)$/i.test(name);
const isPdfFile   = (name) => /\.pdf$/i.test(name);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let dest;
    if (isVideoFile(file.originalname))    dest = join(PUBLIC_DIR, 'video');
    else if (isPdfFile(file.originalname)) dest = join(PUBLIC_DIR, 'pdf');
    else                                    dest = join(PUBLIC_DIR, 'images', 'cms', req.params.section);
    mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename: (_req, file, cb) => {
    const ts   = Date.now();
    const safe = file.originalname.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._\-]/g, '');
    cb(null, `${ts}_${safe}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB (videos)
  fileFilter: (_req, file, cb) => {
    if (/\.(jpg|jpeg|png|webp|gif|mp4|webm|mov|pdf)$/i.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error('Only images (jpg, png, webp, gif), videos (mp4, webm), and PDFs are allowed.'));
    }
  },
});

// ── Routes ────────────────────────────────────────────────────────────────────

/**
 * GET /api/cms/assets
 * Public — returns full assets map (just image paths, no sensitive data).
 */
router.get('/assets', (_req, res) => {
  res.json(readAssets());
});

/**
 * POST /api/cms/assets/:section/:slot?
 * Upload a file into a section.
 *
 * sections: hero | about | properties | gallery | lounge
 * slot:
 *   hero       → "video" | "poster"
 *   about      → "main"  | "accent"
 *   properties → 0-4 (index)
 *   lounge     → 0-7 (index)
 *   gallery    → (ignored — always appended)
 *
 * Body (multipart):
 *   file     — the file
 *   label    — (gallery) display label
 *   cat      — (gallery) Exterior | Interior | Amenities
 */
router.post('/assets/:section/:slot?', auth, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });

  const { section, slot } = req.params;
  const isVideo = isVideoFile(req.file.originalname);
  const isPdf   = isPdfFile(req.file.originalname);
  const filePath = isVideo
    ? `/video/${req.file.filename}`
    : isPdf
      ? `/pdf/${req.file.filename}`
      : `/images/cms/${section}/${req.file.filename}`;

  const label = (req.body.label || req.file.originalname.replace(/\.[^.]+$/, '')).trim();
  const cat   = req.body.cat || 'Exterior';

  const assets = readAssets();

  switch (section) {
    case 'hero': {
      if (!assets.hero) assets.hero = {};
      const key = slot === 'video' ? 'video' : 'poster';
      deletePhysical(assets.hero[key]);
      assets.hero[key] = filePath;
      break;
    }
    case 'about': {
      if (!assets.about) assets.about = {};
      const key = slot === 'accent' ? 'accent' : 'main';
      deletePhysical(assets.about[key]);
      assets.about[key] = filePath;
      break;
    }
    case 'properties': {
      if (!Array.isArray(assets.properties)) assets.properties = [];
      const idx = parseInt(slot, 10);
      if (!isNaN(idx) && idx >= 0 && idx <= 9) {
        deletePhysical(assets.properties[idx]);
        assets.properties[idx] = filePath;
      } else {
        assets.properties.push(filePath);
      }
      break;
    }
    case 'gallery': {
      if (!Array.isArray(assets.gallery)) assets.gallery = [];
      assets.gallery.push({ src: filePath, label, cat });
      break;
    }
    case 'lounge': {
      if (!Array.isArray(assets.lounge)) assets.lounge = [];
      const idx = parseInt(slot, 10);
      if (!isNaN(idx) && idx >= 0 && idx <= 7) {
        deletePhysical(assets.lounge[idx]);
        assets.lounge[idx] = filePath;
      } else {
        assets.lounge.push(filePath);
      }
      break;
    }
    case 'sitemap': {
      if (!assets.sitemap) assets.sitemap = {};
      const wantsPdf = slot === 'masterPdf' || slot === 'villasPdf';
      // Validate file type matches the slot
      if (wantsPdf && !isPdf) {
        deletePhysical(filePath); // remove the just-saved wrong-type file
        return res.status(400).json({ error: 'This slot requires a PDF file.' });
      }
      if (slot === 'planImage' && isPdf) {
        deletePhysical(filePath);
        return res.status(400).json({ error: 'The plan image slot requires an image file.' });
      }
      const key = wantsPdf ? slot : 'planImage';
      deletePhysical(assets.sitemap[key]);
      assets.sitemap[key] = filePath;
      break;
    }
    default:
      return res.status(400).json({ error: `Unknown section: ${section}` });
  }

  writeAssets(assets);
  res.json({ ok: true, path: filePath, assets });
});

/**
 * DELETE /api/cms/assets/:section
 * Remove an asset from a section.
 * Body JSON: { path, slot }
 */
router.delete('/assets/:section', auth, (req, res) => {
  const { section } = req.params;
  const { path: filePath, slot } = req.body || {};
  const assets = readAssets();

  switch (section) {
    case 'hero': {
      const key = slot === 'video' ? 'video' : 'poster';
      deletePhysical(assets.hero?.[key]);
      if (assets.hero) assets.hero[key] = null;
      break;
    }
    case 'about': {
      const key = slot === 'accent' ? 'accent' : 'main';
      deletePhysical(assets.about?.[key]);
      if (assets.about) assets.about[key] = null;
      break;
    }
    case 'properties': {
      const idx = parseInt(slot, 10);
      if (!isNaN(idx) && assets.properties?.[idx]) {
        deletePhysical(assets.properties[idx]);
        assets.properties[idx] = null;
      }
      break;
    }
    case 'gallery': {
      const target = (assets.gallery || []).find(img => img.src === filePath);
      if (target) {
        assets.gallery = assets.gallery.filter(img => img.src !== filePath);
        deletePhysical(filePath);
      }
      break;
    }
    case 'lounge': {
      const idx = parseInt(slot, 10);
      if (!isNaN(idx) && assets.lounge?.[idx]) {
        deletePhysical(assets.lounge[idx]);
        assets.lounge[idx] = null;
      }
      break;
    }
    case 'sitemap': {
      const key = slot === 'masterPdf' || slot === 'villasPdf' ? slot : 'planImage';
      deletePhysical(assets.sitemap?.[key]);
      if (assets.sitemap) assets.sitemap[key] = null;
      break;
    }
    default:
      return res.status(400).json({ error: `Unknown section: ${section}` });
  }

  writeAssets(assets);
  res.json({ ok: true, assets });
});

/**
 * PATCH /api/cms/assets
 * Replace a whole section's data (e.g., reorder gallery or update a label).
 * Body JSON: { section: "gallery", data: [...] }
 */
router.patch('/assets', auth, (req, res) => {
  const { section, data } = req.body || {};
  if (!section || data === undefined)
    return res.status(400).json({ error: 'section and data are required.' });

  const assets = readAssets();
  assets[section] = data;
  writeAssets(assets);
  res.json({ ok: true, assets });
});

export default router;
