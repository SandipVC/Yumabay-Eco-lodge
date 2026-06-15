import fs from 'fs';
import path from 'path';
import { db, isFirebaseEnabled } from './firebase.js';

async function seed() {
  if (!isFirebaseEnabled) {
    console.error('Error: Firebase is not enabled. Make sure you have server/service-account.json or emulator running.');
    process.exit(1);
  }

  const assetsPath = path.resolve('data/assets.json');
  if (fs.existsSync(assetsPath)) {
    try {
      console.log('Seeding assets.json...');
      const assets = JSON.parse(fs.readFileSync(assetsPath, 'utf8'));
      await db.collection('assets').doc('global').set(assets);
      console.log('Assets successfully seeded to Firestore (assets/global)!');
    } catch (err) {
      console.error('Failed to seed assets:', err.message);
    }
  } else {
    console.log('No assets.json found at server/data/assets.json.');
  }

  const leadsPath = path.resolve('data/leads.json');
  if (fs.existsSync(leadsPath)) {
    try {
      console.log('Seeding leads.json...');
      const leads = JSON.parse(fs.readFileSync(leadsPath, 'utf8'));
      if (Array.isArray(leads) && leads.length > 0) {
        const batch = db.batch();
        leads.forEach(lead => {
          if (lead.id) {
            const docRef = db.collection('leads').doc(lead.id);
            batch.set(docRef, lead);
          }
        });
        await batch.commit();
        console.log(`Successfully seeded ${leads.length} leads to Firestore (leads collection)!`);
      } else {
        console.log('leads.json is empty or not an array.');
      }
    } catch (err) {
      console.error('Failed to seed leads:', err.message);
    }
  } else {
    console.log('No leads.json found at server/data/leads.json.');
  }

  console.log('Seeding process complete!');
  process.exit(0);
}

seed();
