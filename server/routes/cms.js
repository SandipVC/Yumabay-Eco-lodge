import express, { Router } from 'express';
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
  // SVGs are vector — never rasterize/resize them.
  if (/svg/i.test(mimetype)) return buffer;
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
    const isFont  = filePath.startsWith('/fonts/');
    if (!isCms && !isVideo && !isPdf && !isFont) return;
    const abs = join(PUBLIC_DIR, filePath);
    if (existsSync(abs)) { try { unlinkSync(abs); } catch {} }
  }
}

// ── Multer storage ────────────────────────────────────────────────────────────
const isVideoFile = (name) => /\.(mp4|webm|mov)$/i.test(name);
const isPdfFile   = (name) => /\.pdf$/i.test(name);
const isFontFile  = (name) => /\.(woff2?|ttf|otf)$/i.test(name);

// Fixed CSS font-family names for CMS-uploaded custom fonts. Must match the
// names FontSync (client/src/App.jsx) uses when injecting the @font-face rule.
const CUSTOM_HEADING_FAMILY = 'CMSHeadingFont';
const CUSTOM_BODY_FAMILY    = 'CMSBodyFont';

// Store files in memory so we can upload them to GCS or save to local disk
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB (videos)
  fileFilter: (_req, file, cb) => {
    if (/\.(jpg|jpeg|png|webp|gif|svg|mp4|webm|mov|pdf|woff2?|ttf|otf)$/i.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error('Only images (jpg, png, webp, gif, svg), videos (mp4, webm), PDFs, and fonts (woff, woff2, ttf, otf) are allowed.'));
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
        
        if (!/\.(jpg|jpeg|png|webp|gif|svg|mp4|webm|mov|pdf|woff2?|ttf|otf)$/i.test(filename)) {
          file.resume();
          return next(new Error('Only images (jpg, png, webp, gif, svg), videos (mp4, webm), PDFs, and fonts (woff, woff2, ttf, otf) are allowed.'));
        }

        const chunks = [];
        file.on('data', (data) => {
          chunks.push(data);
        });

        file.on('end', () => {
          const buffer = Buffer.concat(chunks);   // concat once, not twice
          req.file = {
            fieldname,
            originalname: filename,
            encoding,
            mimetype: mimeType,
            buffer,
            size: buffer.length,
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
 * GET /api/cms/media-library  (auth required)
 * Returns a flat, deduplicated list of every image URL that has been uploaded
 * to this CMS, scraped from all sections of the assets store.
 * Shape: { images: [{ url, section, label }] }
 */
router.get('/media-library', auth, async (_req, res) => {
  try {
    const assets = await readAssets();
    const seen = new Set();
    const images = [];

    function push(url, section, label) {
      if (!url || typeof url !== 'string') return;
      if (!/^https?:\/\/|^\//.test(url)) return; // must be a real URL or path
      if (/\.(mp4|webm|mov|pdf|ttf|otf|woff)$/i.test(url)) return; // skip non-images
      if (seen.has(url)) return;
      seen.add(url);
      images.push({ url, section, label: label || section });
    }

    // Hero slider slides
    (assets.heroSlider || []).forEach((s, i) => push(s.src, 'heroSlider', `Hero slide ${i + 1}`));

    // About
    push(assets.about?.main,   'about', 'About – Main');
    push(assets.about?.accent, 'about', 'About – Accent');

    // Properties (cover images)
    (assets.properties || []).forEach((u, i) => push(u, 'properties', `Property ${i + 1} cover`));

    // Property galleries
    (assets.propertyImages || []).forEach((arr, pi) =>
      (arr || []).forEach((u, ii) => push(u, 'propertyImages', `Property ${pi + 1} · image ${ii + 1}`))
    );

    // Gallery
    (assets.gallery || []).forEach((g, i) => push(g.src || g, 'gallery', `Gallery ${i + 1}` + (g.label ? ` — ${g.label}` : '')));

    // Lounge
    (assets.lounge || []).forEach((u, i) => push(u, 'lounge', `Lounge ${i + 1}`));

    // Decor
    push(assets.decor?.aboutPalms,    'decor', 'Decor – About palms');
    push(assets.decor?.loungePattern, 'decor', 'Decor – Lounge pattern');
    push(assets.decor?.ctaPattern,    'decor', 'Decor – CTA pattern');

    // Sitemap
    push(assets.sitemap?.backdrop,  'sitemap', 'Sitemap – Backdrop');
    push(assets.sitemap?.planImage, 'sitemap', 'Sitemap – Plan image');

    // Branding
    push(assets.branding?.logo, 'branding', 'Logo');

    res.json({ images });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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
  const isFont  = isFontFile(req.file.originalname);

  // Resize images exceeding 1920×1080 before saving
  if (!isVideo && !isPdf && !isFont) {
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
      else if (isFont)      storagePath = `fonts/${filename}`;
      else                  storagePath = `images/cms/${section}/${filename}`;

      const bucket = storage.bucket();
      const file = bucket.file(storagePath);
      await file.save(req.file.buffer, {
        metadata: {
          contentType: req.file.mimetype,
          // Without this, Storage serves `Cache-Control: private, max-age=0`, so
          // browsers re-fetch on every request. For the scroll-scrub hero video
          // that means iOS Safari re-downloads byte ranges on every seek → minutes
          // to load. Filenames are timestamp-prefixed (immutable), so cache hard.
          cacheControl: 'public, max-age=31536000, immutable',
        },
      });

      filePath = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(storagePath)}?alt=media`;
    } else {
      // 2. Save locally to disk
      let dest;
      if (isVideo)          dest = join(PUBLIC_DIR, 'video');
      else if (isPdf)       dest = join(PUBLIC_DIR, 'pdf');
      else if (isFont)      dest = join(PUBLIC_DIR, 'fonts');
      else                  dest = join(PUBLIC_DIR, 'images', 'cms', section);

      mkdirSync(dest, { recursive: true });
      writeFileSync(join(dest, filename), req.file.buffer);

      filePath = isVideo
        ? `/video/${filename}`
        : isPdf
          ? `/pdf/${filename}`
          : isFont
            ? `/fonts/${filename}`
            : `/images/cms/${section}/${filename}`;
    }
  } catch (err) {
    console.error('File upload failed:', err.message);
    return res.status(500).json({ error: 'Failed to upload file.' });
  }

  const labelEn = (req.body.labelEn || req.body.label || req.file.originalname.replace(/\.[^.]+$/, '')).trim();
  const labelEs = (req.body.labelEs || '').trim();
  const cat     = req.body.cat || 'Exterior';

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
      assets.gallery.push({ src: filePath, labelEn, labelEs, cat });
      break;
    }
    case 'heroSlider': {
      // Hero expanding-card slides. slot = index → replace that slide's image
      // (keeping its copy); no slot → append a new slide.
      if (!Array.isArray(assets.heroSlider)) assets.heroSlider = [];
      const idx = parseInt(slot, 10);
      if (!isNaN(idx) && idx >= 0 && idx < assets.heroSlider.length) {
        // Seed slides reference shared gallery files — only delete files that
        // were uploaded specifically for the hero slider.
        const old = assets.heroSlider[idx]?.src;
        if (old && old.includes('heroSlider')) await deletePhysical(old);
        assets.heroSlider[idx] = { ...assets.heroSlider[idx], src: filePath };
      } else {
        if (assets.heroSlider.length >= 8) {
          await deletePhysical(filePath);
          return res.status(400).json({ error: 'Hero slider is limited to 8 slides.' });
        }
        assets.heroSlider.push({
          src: filePath,
          titleEn: labelEn, titleEs: labelEs,
          kickerEn: '', kickerEs: '',
          descEn: '', descEs: '',
        });
      }
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
      const PDF_SLOTS = ['masterPdf', 'villasPdf', 'brochurePdf', 'amenitiesPdf'];
      const IMG_SLOTS = ['planImage', 'backdrop'];
      const wantsPdf = PDF_SLOTS.includes(slot);
      const wantsImg = IMG_SLOTS.includes(slot);
      // Validate file type matches the slot
      if (wantsPdf && !isPdf) {
        await deletePhysical(filePath); // remove the just-saved wrong-type file
        return res.status(400).json({ error: 'This slot requires a PDF file.' });
      }
      if (wantsImg && isPdf) {
        await deletePhysical(filePath);
        return res.status(400).json({ error: 'This slot requires an image file.' });
      }
      const key = (wantsPdf || wantsImg) ? slot : 'planImage';
      await deletePhysical(assets.sitemap[key]);
      assets.sitemap[key] = filePath;
      break;
    }
    case 'decor': {
      // Decorative band patterns / overlays shown across sections.
      if (!assets.decor) assets.decor = {};
      const allowed = ['aboutPalms', 'loungePattern', 'ctaPattern'];
      if (!allowed.includes(slot)) {
        await deletePhysical(filePath);
        return res.status(400).json({ error: `Invalid decor slot: ${slot}` });
      }
      await deletePhysical(assets.decor[slot]);
      assets.decor[slot] = filePath;
      break;
    }
    case 'branding': {
      // Site logo — used in header, footer, preloader and favicon.
      if (!assets.branding) assets.branding = {};
      await deletePhysical(assets.branding.logo);
      assets.branding.logo = filePath;
      break;
    }
    case 'fonts': {
      // Custom heading/body typeface upload. slot: 'heading' | 'body'.
      if (!assets.fonts) assets.fonts = {};
      if (!isFont) {
        await deletePhysical(filePath);
        return res.status(400).json({ error: 'This slot requires a font file (woff, woff2, ttf, otf).' });
      }
      if (slot === 'heading') {
        await deletePhysical(assets.fonts.headingFontFile);
        assets.fonts.headingFontFile = filePath;
        assets.fonts.headingFont = `'${CUSTOM_HEADING_FAMILY}', 'Cormorant Garamond', serif`;
      } else if (slot === 'body') {
        await deletePhysical(assets.fonts.bodyFontFile);
        assets.fonts.bodyFontFile = filePath;
        assets.fonts.bodyFont = `'${CUSTOM_BODY_FAMILY}', 'Jost', sans-serif`;
      } else {
        await deletePhysical(filePath);
        return res.status(400).json({ error: 'Invalid font slot: must be "heading" or "body".' });
      }
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
 * POST /api/cms/reuse-asset/:section/:slot?
 * Reuse an existing asset URL instead of uploading a new one.
 * Body JSON: { url, labelEn, labelEs, cat }
 */
router.post('/reuse-asset/:section/:slot?', auth, express.json(), async (req, res) => {
  const { section, slot } = req.params;
  const { url: filePath, labelEn: rawLabelEn, labelEs: rawLabelEs, cat: rawCat } = req.body || {};
  if (!filePath) return res.status(400).json({ error: 'No url provided.' });

  const labelEn = (rawLabelEn || '').trim();
  const labelEs = (rawLabelEs || '').trim();
  const cat     = rawCat || 'Exterior';

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
    case 'propertyImages': {
      if (!Array.isArray(assets.propertyImages)) assets.propertyImages = [[], [], [], [], []];
      while (assets.propertyImages.length < 5) assets.propertyImages.push([]);

      const parts   = (slot || '').split('-');
      const propIdx = parseInt(parts[0], 10);
      const imgIdx  = parts.length > 1 ? parseInt(parts[1], 10) : NaN;

      if (isNaN(propIdx) || propIdx < 0 || propIdx > 4) {
        return res.status(400).json({ error: 'Invalid property index (0–4).' });
      }
      if (!Array.isArray(assets.propertyImages[propIdx])) assets.propertyImages[propIdx] = [];

      if (!isNaN(imgIdx) && imgIdx >= 0 && imgIdx < assets.propertyImages[propIdx].length) {
        await deletePhysical(assets.propertyImages[propIdx][imgIdx]);
        assets.propertyImages[propIdx][imgIdx] = filePath;
      } else {
        assets.propertyImages[propIdx].push(filePath);
      }
      break;
    }
    case 'gallery': {
      if (!Array.isArray(assets.gallery)) assets.gallery = [];
      assets.gallery.push({ src: filePath, labelEn, labelEs, cat });
      break;
    }
    case 'heroSlider': {
      if (!Array.isArray(assets.heroSlider)) assets.heroSlider = [];
      const idx = parseInt(slot, 10);
      if (!isNaN(idx) && idx >= 0 && idx < assets.heroSlider.length) {
        const old = assets.heroSlider[idx]?.src;
        if (old && old.includes('heroSlider')) await deletePhysical(old);
        assets.heroSlider[idx] = { ...assets.heroSlider[idx], src: filePath };
      } else {
        if (assets.heroSlider.length >= 8) {
          return res.status(400).json({ error: 'Hero slider is limited to 8 slides.' });
        }
        assets.heroSlider.push({
          src: filePath,
          titleEn: labelEn, titleEs: labelEs,
          kickerEn: '', kickerEs: '',
          descEn: '', descEs: '',
        });
      }
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
      const PDF_SLOTS = ['masterPdf', 'villasPdf', 'brochurePdf', 'amenitiesPdf'];
      const IMG_SLOTS = ['planImage', 'backdrop'];
      const wantsPdf = PDF_SLOTS.includes(slot);
      const wantsImg = IMG_SLOTS.includes(slot);
      const isPdf = /\.pdf$/i.test(filePath);
      if (wantsPdf && !isPdf) return res.status(400).json({ error: 'This slot requires a PDF file.' });
      if (wantsImg && isPdf) return res.status(400).json({ error: 'This slot requires an image file.' });
      const key = (wantsPdf || wantsImg) ? slot : 'planImage';
      await deletePhysical(assets.sitemap[key]);
      assets.sitemap[key] = filePath;
      break;
    }
    case 'decor': {
      if (!assets.decor) assets.decor = {};
      const allowed = ['aboutPalms', 'loungePattern', 'ctaPattern'];
      if (!allowed.includes(slot)) {
        return res.status(400).json({ error: `Invalid decor slot: ${slot}` });
      }
      await deletePhysical(assets.decor[slot]);
      assets.decor[slot] = filePath;
      break;
    }
    case 'branding': {
      if (!assets.branding) assets.branding = {};
      await deletePhysical(assets.branding.logo);
      assets.branding.logo = filePath;
      break;
    }
    default:
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
    case 'heroSlider': {
      // Body: { slot: index } — remove one slide from the hero slider.
      const idx = parseInt(slot, 10);
      if (!isNaN(idx) && Array.isArray(assets.heroSlider) && assets.heroSlider[idx]) {
        const old = assets.heroSlider[idx].src;
        // Seeded slides share gallery files — see the upload case above.
        if (old && old.includes('heroSlider')) await deletePhysical(old);
        assets.heroSlider.splice(idx, 1);
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
      const KNOWN = ['masterPdf', 'villasPdf', 'brochurePdf', 'amenitiesPdf', 'planImage', 'backdrop'];
      const key = KNOWN.includes(slot) ? slot : 'planImage';
      await deletePhysical(assets.sitemap?.[key]);
      if (assets.sitemap) assets.sitemap[key] = null;
      break;
    }
    case 'decor': {
      const allowed = ['aboutPalms', 'loungePattern', 'ctaPattern'];
      if (allowed.includes(slot)) {
        await deletePhysical(assets.decor?.[slot]);
        if (assets.decor) assets.decor[slot] = null;
      }
      break;
    }
    case 'branding': {
      await deletePhysical(assets.branding?.logo);
      if (assets.branding) assets.branding.logo = null;
      break;
    }
    case 'fonts': {
      // Remove a custom-uploaded font and revert that slot to the brand default.
      if (slot === 'heading' && assets.fonts) {
        await deletePhysical(assets.fonts.headingFontFile);
        assets.fonts.headingFontFile = null;
        assets.fonts.headingFont = "'Merzalina', 'Cormorant Garamond', serif";
      } else if (slot === 'body' && assets.fonts) {
        await deletePhysical(assets.fonts.bodyFontFile);
        assets.fonts.bodyFontFile = null;
        assets.fonts.bodyFont = "'Aptos Narrow', 'Jost', sans-serif";
      }
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
