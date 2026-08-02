import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
const storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET;
const messagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID;
const appId = import.meta.env.VITE_FIREBASE_APP_ID;
const measurementId = import.meta.env.VITE_FIREBASE_MEASUREMENT_ID;

console.log("[Firebase Config Audit]");
console.log("  - API Key Loaded:", apiKey ? `${apiKey.slice(0, 6)}...[MASKED]` : "UNDEFINED / EMPTY");
console.log("  - Auth Domain:", authDomain || "UNDEFINED / EMPTY");
console.log("  - Project ID:", projectId || "UNDEFINED / EMPTY");
console.log("  - Storage Bucket:", storageBucket || "UNDEFINED / EMPTY");
console.log("  - Messaging Sender ID:", messagingSenderId || "UNDEFINED / EMPTY");
console.log("  - App ID:", appId || "UNDEFINED / EMPTY");

const firebaseConfig = {
  apiKey,
  authDomain,
  projectId,
  storageBucket,
  messagingSenderId,
  appId,
  ...(measurementId ? { measurementId } : {})
};

let app: any = null;
let auth: any = null;
let db: any = null;
let storage: any = null;
let firebaseInitError: string | null = null;

if (!apiKey || apiKey.trim() === '' || apiKey === 'YOUR_API_KEY') {
  firebaseInitError = "VITE_FIREBASE_API_KEY is undefined or empty in your .env file. Please add your Firebase credentials to .env.";
  console.error(`[Firebase Configuration Failure] ${firebaseInitError}`);
} else if (!projectId || projectId.trim() === '') {
  firebaseInitError = "VITE_FIREBASE_PROJECT_ID is undefined or empty in your .env file. Please add your Firebase credentials to .env.";
  console.error(`[Firebase Configuration Failure] ${firebaseInitError}`);
} else {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    console.log("[Firebase] Successfully initialized Firebase App, Auth, and Firestore.");
  } catch (error: any) {
    firebaseInitError = error.message || "Firebase SDK initialization failed.";
    console.error("[Firebase Initialization Error]:", error);
  }
}

export { app, auth, db, storage, firebaseInitError };
