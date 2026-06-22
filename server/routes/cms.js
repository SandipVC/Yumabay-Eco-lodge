import { Router } from 'express';
import multer from 'multer';
import busboy from 'busboy';
import sharp from 'sharp';
import {
  readFileSync, writeFileSync, unlinkSync,
  existsSync, mkdirSync,
} from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { db, storage, isFirebaseEnabled } from '../firebase.js';

const router = Router();
const __filename = fileURLToPath(import.meta.url);
const __dir     = dirname(__filename);
const ASSETS_FILE = join(__dir, '../data/assets.json');
const PUBLIC_DIR  = join(__dir, '../../client/public');

// ── Auth ─────────────────────────────────────────────────────────────────────
function auth(req, res, next) {
  const secret   = process.env.ADMIN_SECRET || 'yuma-bay-2026';
  const provided = (req.headers.authorization || '').replace('Bearer ', '').trim();
  if (provided !== secret) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

// ── Image resize ─────────────────────────────────────────────────────────────
async function resizeIfNeeded(buffer, mimetype) {
  if (!/image\//i.test(mimetype)) return buffer;
  const meta = await sharp(buffer).metadata();
  if ((meta.width || 0) <= 1920 && (meta.height || 0) <= 1080) return buffer;
  return sharp(buffer)
    .resize({ width: 1920, height: 1080, fit: 'inside', withoutEnlargement: true })
    .toBuffer();
}

// ── Firestore nested-array serialization ──────────────────────────────────────
// Firestore forbids nested arrays. propertyImages is [[...],[...]] so we store
// it as a plain object map keyed by string index and restore on read.
function toFirestore(data) {
  const out = { ...data };
  if (Array.isArray(out.propertyImages)) {
    const map = {};
    out.propertyImages.forEach((arr, i) => { map[String(i)] = arr ?? []; });
    out.propertyImages = map;
  }
  return out;
}

function fromFirestore(data) {
  const out = { ...data };
  if (out.propertyImages && !Array.isArray(out.propertyImages)) {
    const len = Math.max(5, Object.keys(out.propertyImages).length);
    out.propertyImages = Array.from({ length: len }, (_, i) => out.propertyImages[String(i)] ?? []);
  }
  return out;
}

// ── Asset store ───────────────────────────────────────────────────────────────
async function readAssets() {
  if (isFirebaseEnabled) {
    try {
      const doc = await db.collection('assets').doc('global').get();
      if (doc.exists) {
        return fromFirestore(doc.data());
      }
    } catch (err) {
      console.error('Failed to read assets from Firestore:', err.message);
    }
  }
  try { return JSON.parse(readFileSync(ASSETS_FILE, 'utf-8')); }
  catch { return { hero: {}, about: {}, properties: [], gallery: [], lounge: [] }; }
}

async function writeAssets(data) {
  if (isFirebaseEnabled) {
    try {
      await db.collection('assets').doc('global').set(toFirestore(data));
      return;
    } catch (err) {
      console.error('Failed to write assets to Firestore:', err.message);
    }
  }
  writeFileSync(ASSETS_FILE, JSON.stringify(data, null, 2));
}

// Original bundled files that must never be physically deleted (only unlinked from the registry)
const PROTECTED_FILES = new Set([
  '/video/hero.mp4',
  '/pdf/MASTER PLAN YUMA BAY.pdf',
  '/pdf/PARCELAS VILLAS  YUMA BAY.pdf',
]);

// Delete files from Storage or disk
async function deletePhysical(filePath) {
  if (!filePath || PROTECTED_FILES.has(filePath)) return;
  
  if (isFirebaseEnabled) {
    if (filePath.startsWith('http')) {
      try {
        const parts = filePath.split('/o/');
        if (parts.length > 1) {
          const storagePath = decodeURIComponent(parts[1].split('?')[0]);
          const bucket = storage.bucket();
          const file = bucket.file(storagePath);
          const [exists] = await file.exists();
          if (exists) {
            await file.delete();
            console.log('Deleted file from Storage:', storagePath);
          }
        }
      } catch (err) {
        console.error('Failed to delete file from Storage:', filePath, err.message);
      }
    }
  } else {
    const isCms   = filePath.includes('/images/cms/');
    const isVideo = filePath.startsWith('/video/');
    const isPdf   = filePath.startsWith('/pdf/');
    if (!isCms && !isVideo && !isPdf) return;
    const abs = join(PUBLIC_DIR, filePath);
    if (existsSync(abs)) { try { unlinkSync(abs); } catch {} }
  }
}

// ── Multer storage ────────────────────────────────────────────────────────────
const isVideoFile = (name) => /\.(mp4|webm|mov)$/i.test(name);
const isPdfFile   = (name) => /\.pdf$/i.test(name);

// Store files in memory so we can upload them to GCS or save to local disk
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB (videos)
  fileFilter: (_req, file, cb) => {
    if (/\.(jpg|jpeg|png|webp|gif|mp4|webm|mov|pdf)$/i.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error('Only images (jpg, png, webp, gif), videos (mp4, webm), and PDFs are allowed.'));
    }
  },
});

// Custom multipart parser middleware that handles pre-buffered req.rawBody on GCF
function multipartParser(req, res, next) {
  console.log('[DEBUG UPLOAD] Starting upload parser...');
  console.log('[DEBUG UPLOAD] req.rawBody exists:', !!req.rawBody);
  if (req.rawBody) {
    console.log('[DEBUG UPLOAD] req.rawBody length:', req.rawBody.length);
    console.log('[DEBUG UPLOAD] req.rawBody isBuffer:', Buffer.isBuffer(req.rawBody));
    try {
      const head = req.rawBody.slice(0, 200).toString('utf8');
      const tail = req.rawBody.slice(-200).toString('utf8');
      console.log('[DEBUG UPLOAD] req.rawBody head:', JSON.stringify(head));
      console.log('[DEBUG UPLOAD] req.rawBody tail:', JSON.stringify(tail));
    } catch (e) {
      console.log('[DEBUG UPLOAD] Failed to slice/print rawBody:', e.message);
    }
  }
  console.log('[DEBUG UPLOAD] Headers:', JSON.stringify(req.headers));

  if (req.rawBody && req.headers['content-type']?.startsWith('multipart/form-data')) {
    try {
      const bb = busboy({ headers: req.headers, limits: { fileSize: 500 * 1024 * 1024 } });
      req.body = {};
      req.file = null;

      bb.on('file', (fieldname, file, info) => {
        const { filename, encoding, mimeType } = info;
        
        if (!/\.(jpg|jpeg|png|webp|gif|mp4|webm|mov|pdf)$/i.test(filename)) {
          file.resume();
          return next(new Error('Only images (jpg, png, webp, gif), videos (mp4, webm), and PDFs are allowed.'));
        }

        const chunks = [];
        file.on('data', (data) => {
          chunks.push(data);
        });

        file.on('end', () => {
          req.file = {
            fieldname,
            originalname: filename,
            encoding,
            mimetype: mimeType,
            buffer: Buffer.concat(chunks),
            size: Buffer.concat(chunks).length,
          };
        });
      });

      bb.on('field', (fieldname, val) => {
        req.body[fieldname] = val;
      });

      bb.on('finish', () => {
        next();
      });

      bb.on('error', (err) => {
        next(err);
      });

      bb.end(req.rawBody);
    } catch (err) {
      next(err);
    }
  } else {
    upload.single('file')(req, res, next);
  }
}

// ── Routes ────────────────────────────────────────────────────────────────────

/**
 * GET /api/cms/assets
 * Public — returns full assets map (just image paths, no sensitive data).
 */
router.get('/assets', async (_req, res) => {
  res.json(await readAssets());
});

/**
 * POST /api/cms/assets/:section/:slot?
 * Upload a file into a section.
 */
router.post('/assets/:section/:slot?', auth, multipartParser, async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });

  const { section, slot } = req.params;
  const isVideo = isVideoFile(req.file.originalname);
  const isPdf   = isPdfFile(req.file.originalname);

  // Resize images exceeding 1920×1080 before saving
  if (!isVideo && !isPdf) {
    try {
      req.file.buffer = await resizeIfNeeded(req.file.buffer, req.file.mimetype);
    } catch (err) {
      console.error('Image resize failed:', err.message);
      return res.status(400).json({ error: 'Invalid or corrupt image file.' });
    }
  }

  const ts = Date.now();
  const safe = req.file.originalname.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._\-]/g, '');
  const filename = `${ts}_${safe}`;

  let filePath;

  try {
    if (isFirebaseEnabled) {
      // 1. Upload to Firebase Storage
      let storagePath;
      if (isVideo)          storagePath = `video/${filename}`;
      else if (isPdf)       storagePath = `pdf/${filename}`;
      else                  storagePath = `images/cms/${section}/${filename}`;

      const bucket = storage.bucket();
      const file = bucket.file(storagePath);
      await file.save(req.file.buffer, {
        metadata: { contentType: req.file.mimetype },
      });

      filePath = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(storagePath)}?alt=media`;
    } else {
      // 2. Save locally to disk
      let dest;
      if (isVideo)          dest = join(PUBLIC_DIR, 'video');
      else if (isPdf)       dest = join(PUBLIC_DIR, 'pdf');
      else                  dest = join(PUBLIC_DIR, 'images', 'cms', section);
      
      mkdirSync(dest, { recursive: true });
      writeFileSync(join(dest, filename), req.file.buffer);

      filePath = isVideo
        ? `/video/${filename}`
        : isPdf
          ? `/pdf/${filename}`
          : `/images/cms/${section}/${filename}`;
    }
  } catch (err) {
    console.error('File upload failed:', err.message);
    return res.status(500).json({ error: 'Failed to upload file.' });
  }

  const label = (req.body.label || req.file.originalname.replace(/\.[^.]+$/, '')).trim();
  const cat   = req.body.cat || 'Exterior';

  const assets = await readAssets();

  switch (section) {
    case 'hero': {
      if (!assets.hero) assets.hero = {};
      const key = slot === 'video' ? 'video' : 'poster';
      await deletePhysical(assets.hero[key]);
      assets.hero[key] = filePath;
      break;
    }
    case 'about': {
      if (!assets.about) assets.about = {};
      const key = slot === 'accent' ? 'accent' : 'main';
      await deletePhysical(assets.about[key]);
      assets.about[key] = filePath;
      break;
    }
    case 'properties': {
      if (!Array.isArray(assets.properties)) assets.properties = [];
      const idx = parseInt(slot, 10);
      if (!isNaN(idx) && idx >= 0 && idx <= 9) {
        await deletePhysical(assets.properties[idx]);
        assets.properties[idx] = filePath;
      } else {
        assets.properties.push(filePath);
      }
      break;
    }
    case 'propertyImages': {
      // slot format: "{propIdx}"       → append image to that property's list
      // slot format: "{propIdx}-{imgIdx}" → replace a specific image in the list
      if (!Array.isArray(assets.propertyImages)) assets.propertyImages = [[], [], [], [], []];
      while (assets.propertyImages.length < 5) assets.propertyImages.push([]);

      const parts   = (slot || '').split('-');
      const propIdx = parseInt(parts[0], 10);
      const imgIdx  = parts.length > 1 ? parseInt(parts[1], 10) : NaN;

      if (isNaN(propIdx) || propIdx < 0 || propIdx > 4) {
        await deletePhysical(filePath);
        return res.status(400).json({ error: 'Invalid property index (0–4).' });
      }
      if (!Array.isArray(assets.propertyImages[propIdx])) assets.propertyImages[propIdx] = [];

      if (!isNaN(imgIdx) && imgIdx >= 0 && imgIdx < assets.propertyImages[propIdx].length) {
        // Replace in-place
        await deletePhysical(assets.propertyImages[propIdx][imgIdx]);
        assets.propertyImages[propIdx][imgIdx] = filePath;
      } else {
        // Append
        assets.propertyImages[propIdx].push(filePath);
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
        await deletePhysical(assets.lounge[idx]);
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
        await deletePhysical(filePath); // remove the just-saved wrong-type file
        return res.status(400).json({ error: 'This slot requires a PDF file.' });
      }
      if (slot === 'planImage' && isPdf) {
        await deletePhysical(filePath);
        return res.status(400).json({ error: 'The plan image slot requires an image file.' });
      }
      const key = wantsPdf ? slot : 'planImage';
      await deletePhysical(assets.sitemap[key]);
      assets.sitemap[key] = filePath;
      break;
    }
    default:
      await deletePhysical(filePath); // Cleanup file if invalid section
      return res.status(400).json({ error: `Unknown section: ${section}` });
  }

  await writeAssets(assets);
  res.json({ ok: true, path: filePath, assets });
});

/**
 * DELETE /api/cms/assets/:section
 * Remove an asset from a section.
 * Body JSON: { path, slot }
 */
router.delete('/assets/:section', auth, async (req, res) => {
  const { section } = req.params;
  const { path: filePath, slot } = req.body || {};
  const assets = await readAssets();

  switch (section) {
    case 'hero': {
      const key = slot === 'video' ? 'video' : 'poster';
      await deletePhysical(assets.hero?.[key]);
      if (assets.hero) assets.hero[key] = null;
      break;
    }
    case 'about': {
      const key = slot === 'accent' ? 'accent' : 'main';
      await deletePhysical(assets.about?.[key]);
      if (assets.about) assets.about[key] = null;
      break;
    }
    case 'properties': {
      const idx = parseInt(slot, 10);
      if (!isNaN(idx) && assets.properties?.[idx]) {
        await deletePhysical(assets.properties[idx]);
        assets.properties[idx] = null;
      }
      break;
    }
    case 'propertyImages': {
      // Body: { propIdx: number, imgIdx: number }
      const { propIdx, imgIdx } = req.body || {};
      const pi = parseInt(propIdx, 10);
      const ii = parseInt(imgIdx,  10);
      if (!isNaN(pi) && !isNaN(ii) && Array.isArray(assets.propertyImages?.[pi])) {
        const url = assets.propertyImages[pi][ii];
        if (url) {
          await deletePhysical(url);
          assets.propertyImages[pi].splice(ii, 1);
        }
      }
      break;
    }
    case 'gallery': {
      const target = (assets.gallery || []).find(img => img.src === filePath);
      if (target) {
        assets.gallery = assets.gallery.filter(img => img.src !== filePath);
        await deletePhysical(filePath);
      }
      break;
    }
    case 'lounge': {
      const idx = parseInt(slot, 10);
      if (!isNaN(idx) && assets.lounge?.[idx]) {
        await deletePhysical(assets.lounge[idx]);
        assets.lounge[idx] = null;
      }
      break;
    }
    case 'sitemap': {
      const key = slot === 'masterPdf' || slot === 'villasPdf' ? slot : 'planImage';
      await deletePhysical(assets.sitemap?.[key]);
      if (assets.sitemap) assets.sitemap[key] = null;
      break;
    }
    default:
      return res.status(400).json({ error: `Unknown section: ${section}` });
  }

  await writeAssets(assets);
  res.json({ ok: true, assets });
});

/**
 * PATCH /api/cms/assets
 * Replace a whole section's data (e.g., reorder gallery or update a label).
 * Body JSON: { section: "gallery", data: [...] }
 */
router.patch('/assets', auth, async (req, res) => {
  const { section, data } = req.body || {};
  if (!section || data === undefined)
    return res.status(400).json({ error: 'section and data are required.' });

  const assets = await readAssets();
  assets[section] = data;
  await writeAssets(assets);
  res.json({ ok: true, assets });
});

export default router;
