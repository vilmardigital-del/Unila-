import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import configData from '@/firebase-applet-config.json';

let app: FirebaseApp | null = null;
let _db: Firestore | null = null;
let _auth: Auth | null = null;

export function getFirebase() {
  if (!_db || !app) {
    const existingApps = getApps();
    if (existingApps.length > 0) {
      app = existingApps[0];
    } else {
      const firebaseConfig = {
        apiKey: configData.apiKey || '',
        authDomain: configData.authDomain || '',
        projectId: configData.projectId || '',
        storageBucket: configData.storageBucket || '',
        messagingSenderId: configData.messagingSenderId || '',
        appId: configData.appId || '',
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
      console.log('Firestore conectado com sucesso! Database ID:', dbId);
    } catch (err) {
      console.error('Erro ao inicializar o Firestore:', err);
      _db = null;
    }

    try {
      _auth = getAuth(app);
    } catch (err) {
      console.error('Erro ao inicializar o Auth:', err);
      _auth = null;
    }
  }

  return { db: _db, auth: _auth };
}

export const getDb = () => getFirebase().db;
export const getAuthInstance = () => getFirebase().auth;
