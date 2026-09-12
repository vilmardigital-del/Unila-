import { initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';

let app: FirebaseApp;
let _db: Firestore;
let _auth: Auth;

function getFirebase() {
  if (!app) {
    const firebaseConfig = {
      apiKey: process.env.FIREBASE_API_KEY,
      authDomain: process.env.FIREBASE_AUTH_DOMAIN,
      projectId: process.env.FIREBASE_PROJECT_ID,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.FIREBASE_APP_ID,
    };

    if (!firebaseConfig.apiKey) {
      console.warn('Firebase API key is missing. Firebase features will be disabled.');
      return null;
    }

    app = initializeApp(firebaseConfig);
    _db = getFirestore(app);
    _auth = getAuth(app);
  }
  return { db: _db, auth: _auth };
}

export const db = new Proxy({} as Firestore, {
  get: (_, prop) => {
    const fb = getFirebase();
    if (!fb) throw new Error('Firebase not initialized');
    return (fb.db as any)[prop];
  }
});

export const auth = new Proxy({} as Auth, {
  get: (_, prop) => {
    const fb = getFirebase();
    if (!fb) throw new Error('Firebase not initialized');
    return (fb.auth as any)[prop];
  }
});
