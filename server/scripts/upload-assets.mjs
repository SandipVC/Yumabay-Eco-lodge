/**
 * One-off uploader: pushes every file in a local folder to Firebase Storage
 * under assets/figma/<filename>, makes it public, and prints the ?alt=media URL.
 *
 * Usage (run from the server/ directory so service-account.json resolves):
 *   node scripts/upload-assets.mjs ../upload
 *   node scripts/upload-assets.mjs ../upload assets/sitemap   # alternate prefix
 *
 * Requires server/service-account.json (already present).
 */
import { initializeApp, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import fs from 'fs';
import path from 'path';

const BUCKET = 'vessel-contianer.firebasestorage.app';
const folder = process.argv[2] || '../upload';
const prefix = (process.argv[3] || 'assets/figma').replace(/\/+$/, '');

const saPath = path.resolve(process.cwd(), 'service-account.json');
if (!fs.existsSync(saPath)) {
  console.error('service-account.json not found at', saPath);
  process.exit(1);
}
const absFolder = path.resolve(process.cwd(), folder);
if (!fs.existsSync(absFolder)) {
  console.error('Source folder not found:', absFolder);
  process.exit(1);
}

const CONTENT_TYPES = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
};

const app = initializeApp({
  credential: cert(JSON.parse(fs.readFileSync(saPath, 'utf8'))),
  storageBucket: BUCKET,
});
const bucket = getStorage(app).bucket();

const files = fs.readdirSync(absFolder).filter((f) => {
  const full = path.join(absFolder, f);
  return fs.statSync(full).isFile();
});

if (files.length === 0) {
  console.error('No files in', absFolder, '— drop the assets there first.');
  process.exit(1);
}

console.log(`Uploading ${files.length} file(s) to gs://${BUCKET}/${prefix}/ ...\n`);

for (const name of files) {
  const local = path.join(absFolder, name);
  const dest = `${prefix}/${name}`;
  const ext = path.extname(name).toLowerCase();
  const contentType = CONTENT_TYPES[ext] || 'application/octet-stream';
  try {
    await bucket.upload(local, {
      destination: dest,
      metadata: { contentType, cacheControl: 'public, max-age=31536000' },
    });
    await bucket.file(dest).makePublic();
    const url =
      `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/` +
      `${encodeURIComponent(dest)}?alt=media`;
    console.log(`  ✓ ${name}\n      ${url}`);
  } catch (err) {
    console.error(`  ✗ ${name}: ${err.message}`);
  }
}

console.log('\nDone.');
process.exit(0);
