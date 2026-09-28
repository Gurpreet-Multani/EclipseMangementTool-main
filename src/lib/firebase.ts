import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, getFirestore, Firestore } from 'firebase/firestore';
import firebaseConfigJson from '../../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: firebaseConfigJson.apiKey,
  authDomain: firebaseConfigJson.authDomain,
  projectId: firebaseConfigJson.projectId,
  storageBucket: firebaseConfigJson.storageBucket,
  messagingSenderId: firebaseConfigJson.messagingSenderId,
  appId: firebaseConfigJson.appId,
};

// Initialize Firebase App
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth
export const auth = getAuth(app);

// Initialize Firestore with specific database ID and auto-detect long-polling
let firestoreDb: Firestore;
try {
  firestoreDb = initializeFirestore(
    app,
    {
      experimentalAutoDetectLongPolling: true,
    },
    firebaseConfigJson.firestoreDatabaseId || undefined
  );
} catch {
  firestoreDb = firebaseConfigJson.firestoreDatabaseId
    ? getFirestore(app, firebaseConfigJson.firestoreDatabaseId)
    : getFirestore(app);
}

export const db = firestoreDb;
