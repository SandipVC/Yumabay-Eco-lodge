import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBC05M4tdur4cFqbnvSiK4w90kYf03rmFs",
  authDomain: "vessel-contianer.firebaseapp.com",
  databaseURL: "https://vessel-contianer-default-rtdb.firebaseio.com",
  projectId: "vessel-contianer",
  storageBucket: "vessel-contianer.firebasestorage.app",
  messagingSenderId: "579537486947",
  appId: "1:579537486947:web:fb3b9133be9d90523b2456"
};

let _app, _db, _storage;

function init() {
  if (!_app) {
    _app = initializeApp(firebaseConfig);
    _db = getFirestore(_app);
    _storage = getStorage(_app);
  }
  return { app: _app, db: _db, storage: _storage };
}

export function getFirebaseApp() { return init().app; }
export function getFirebaseDb() { return init().db; }
export function getFirebaseStorage() { return init().storage; }
