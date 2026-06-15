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

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
