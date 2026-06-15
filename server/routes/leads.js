import { Router } from 'express';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { db, isFirebaseEnabled } from '../firebase.js';

const router = Router();
const __filename = fileURLToPath(import.meta.url);
const __dir = dirname(__filename);
const LEADS_FILE = join(__dir, '../data/leads.json');

function auth(req, res, next) {
  const secret = process.env.ADMIN_SECRET || 'yuma-bay-2026';
  const provided = req.headers.authorization?.replace('Bearer ', '');
  if (provided !== secret) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

router.get('/', auth, async (_req, res) => {
  try {
    if (isFirebaseEnabled) {
      const snapshot = await db.collection('leads').orderBy('createdAt', 'desc').get();
      const leads = [];
      snapshot.forEach(doc => leads.push(doc.data()));
      res.json({ leads, total: leads.length });
    } else {
      let leads = [];
      if (existsSync(LEADS_FILE)) {
        leads = JSON.parse(readFileSync(LEADS_FILE, 'utf-8'));
      }
      res.json({ leads, total: leads.length });
    }
  } catch (err) {
    console.error('Failed to get leads:', err.message);
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
});

router.patch('/:id', auth, async (req, res) => {
  try {
    if (isFirebaseEnabled) {
      const leadRef = db.collection('leads').doc(req.params.id);
      const doc = await leadRef.get();
      if (!doc.exists) return res.status(404).json({ error: 'Lead not found' });
      const lead = doc.data();
      const allowed = ['status', 'notes'];
      const updates = {};
      allowed.forEach(k => {
        if (req.body[k] !== undefined) {
          updates[k] = req.body[k];
          lead[k] = req.body[k];
        }
      });
      updates.updatedAt = new Date().toISOString();
      lead.updatedAt = updates.updatedAt;
      await leadRef.update(updates);
      res.json(lead);
    } else {
      if (!existsSync(LEADS_FILE)) return res.status(404).json({ error: 'Lead not found' });
      const leads = JSON.parse(readFileSync(LEADS_FILE, 'utf-8'));
      const idx = leads.findIndex(l => l.id === req.params.id);
      if (idx === -1) return res.status(404).json({ error: 'Lead not found' });
      const allowed = ['status', 'notes'];
      allowed.forEach(k => { if (req.body[k] !== undefined) leads[idx][k] = req.body[k]; });
      leads[idx].updatedAt = new Date().toISOString();
      writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2));
      res.json(leads[idx]);
    }
  } catch (err) {
    console.error('Failed to update lead:', err.message);
    res.status(500).json({ error: 'Failed to update lead' });
  }
});

export default router;
