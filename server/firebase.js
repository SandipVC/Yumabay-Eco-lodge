import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import fs from 'fs';
import path from 'path';

let app = null;
let db = null;
let storage = null;
let isFirebaseEnabled = false;

const serviceAccountPath = path.resolve(process.cwd(), 'service-account.json');
const hasServiceAccount = fs.existsSync(serviceAccountPath);
const isEmulator = !!(process.env.FIRESTORE_EMULATOR_HOST || process.env.FIREBASE_STORAGE_EMULATOR_HOST || process.env.FUNCTIONS_EMULATOR);
const isCloudFunction = !!process.env.FIREBASE_CONFIG;

if (isCloudFunction || isEmulator || hasServiceAccount) {
  try {
    if (isEmulator) {
      app = initializeApp({
        projectId: 'vessel-contianer',
        storageBucket: 'vessel-contianer.firebasestorage.app',
      });
      console.log('Firebase Admin SDK initialized in Emulator mode.');
    } else if (hasServiceAccount) {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      app = initializeApp({
        credential: cert(serviceAccount),
        storageBucket: 'vessel-contianer.firebasestorage.app',
      });
      console.log('Firebase Admin SDK initialized with local Service Account.');
    } else {
      app = initializeApp({
        storageBucket: 'vessel-contianer.firebasestorage.app',
      });
      console.log('Firebase Admin SDK initialized in Production Cloud environment.');
    }
    db = getFirestore(app);
    storage = getStorage(app);
    isFirebaseEnabled = true;
  } catch (err) {
    console.error('Firebase Admin SDK initialization failed:', err.message);
    console.log('Falling back to Local File System DB/Storage.');
  }
} else {
  console.log('No Firebase environment or service-account.json detected. Running in Local File System DB/Storage mode.');
}

export { db, storage, isFirebaseEnabled };
