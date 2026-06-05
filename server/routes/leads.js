import { Router } from 'express';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const router = Router();
const __filename = fileURLToPath(import.meta.url);
const __dir = dirname(__filename);
const LEADS_FILE = join(__dir, '../data/leads.json');

function auth(req, res, next) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return next();
  const provided = req.headers.authorization?.replace('Bearer ', '');
  if (provided !== secret) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

router.get('/', auth, (_req, res) => {
  try {
    const leads = JSON.parse(readFileSync(LEADS_FILE, 'utf-8'));
    res.json({ leads, total: leads.length });
  } catch {
    res.json({ leads: [], total: 0 });
  }
});

router.patch('/:id', auth, (req, res) => {
  try {
    const leads = JSON.parse(readFileSync(LEADS_FILE, 'utf-8'));
    const idx = leads.findIndex(l => l.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Lead not found' });
    const allowed = ['status', 'notes'];
    allowed.forEach(k => { if (req.body[k] !== undefined) leads[idx][k] = req.body[k]; });
    leads[idx].updatedAt = new Date().toISOString();
    writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2));
    res.json(leads[idx]);
  } catch {
    res.status(500).json({ error: 'Failed to update lead' });
  }
});

export default router;
