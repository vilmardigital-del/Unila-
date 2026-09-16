import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import configData from '@/firebase-applet-config.json';

let app: FirebaseApp;
let _db: Firestore | null = null;
let _auth: Auth | null = null;

export function getFirebase() {
  if (!app) {
    const existingApps = getApps();
    if (existingApps.length > 0) {
      app = existingApps[0];
    } else {
      const firebaseConfig = {
        apiKey: configData.apiKey || (typeof process !== 'undefined' ? process.env?.FIREBASE_API_KEY : ''),
        authDomain: configData.authDomain || (typeof process !== 'undefined' ? process.env?.FIREBASE_AUTH_DOMAIN : ''),
        projectId: configData.projectId || (typeof process !== 'undefined' ? process.env?.FIREBASE_PROJECT_ID : ''),
        storageBucket: configData.storageBucket || (typeof process !== 'undefined' ? process.env?.FIREBASE_STORAGE_BUCKET : ''),
        messagingSenderId: configData.messagingSenderId || (typeof process !== 'undefined' ? process.env?.FIREBASE_MESSAGING_SENDER_ID : ''),
        appId: configData.appId || (typeof process !== 'undefined' ? process.env?.FIREBASE_APP_ID : ''),
      };

      if (!firebaseConfig.apiKey) {
        console.warn('Firebase API key is missing. Firebase features will be disabled.');
        return { db: null, auth: null };
      }

      app = initializeApp(firebaseConfig);
    }

    try {
      const dbId = configData.firestoreDatabaseId || undefined;
      _db = dbId ? getFirestore(app, dbId) : getFirestore(app);
    } catch (err) {
      console.error('Error initializing Firestore:', err);
      _db = null;
    }

    try {
      _auth = getAuth(app);
    } catch (err) {
      console.error('Error initializing Auth:', err);
      _auth = null;
    }
  }

  return { db: _db, auth: _auth };
}

export const getDb = () => getFirebase().db;
export const getAuthInstance = () => getFirebase().auth;
