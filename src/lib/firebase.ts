import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const rawApiKey = import.meta.env.VITE_FIREBASE_API_KEY;
const isPlaceholder = (val?: string) => 
  !val || 
  val.startsWith('__') || 
  val.includes('...') || 
  val.toLowerCase().includes('demo') || 
  val.toLowerCase().includes('placeholder') || 
  val.includes('123456789') ||
  val.length < 35;

const firebaseConfig = {
  apiKey: !isPlaceholder(rawApiKey) ? rawApiKey : "AIzaSy_iptv_demo_placeholder_key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "iptv-menu-dev.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "iptv-menu-dev",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "iptv-menu-dev.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789:web:abcdef"
};

let appInstance: any = null;
let authInstance: any = null;
let dbInstance: any = null;
let storageInstance: any = null;

try {
  if (getApps().length === 0) {
    appInstance = initializeApp(firebaseConfig);
  } else {
    appInstance = getApp();
  }
  authInstance = getAuth(appInstance);
  dbInstance = getFirestore(appInstance);
  storageInstance = getStorage(appInstance);
} catch (error) {
  console.warn("Firebase initialization warning (running in resilient offline mode):", error);
  // Provide safe fallback mock objects so module consumers don't crash
  appInstance = appInstance || { name: '[DEFAULT]', options: firebaseConfig };
  authInstance = authInstance || { currentUser: null };
  dbInstance = dbInstance || {};
  storageInstance = storageInstance || {};
}

export const app = appInstance;
export const auth = authInstance;
export const db = dbInstance;
export const storage = storageInstance;

export const googleProvider = new GoogleAuthProvider();

export const isGoogleAuthAvailable = () => {
  return !!auth && !isPlaceholder(rawApiKey);
};

export const signInWithGoogle = async () => {
  if (!auth || isPlaceholder(rawApiKey)) {
    throw new Error("Google Sign-In is unavailable because no Firebase Web API key is configured. Since your database is on Neon, please sign in with your email and password.");
  }

  try {
    const result = await signInWithPopup(auth, googleProvider);
    if (!result || !result.user) {
      throw new Error("No user returned from Google authentication.");
    }
    return result.user;
  } catch (error: any) {
    if (error.code === 'auth/api-key-not-valid' || error.message?.includes('api-key-not-valid')) {
      throw new Error("Firebase API key is invalid. If you are using Neon DB without Firebase Auth, please sign in using your email and password.");
    }
    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error("Google sign-in window was closed before completion.");
    }
    if (error.code === 'auth/popup-blocked') {
      throw new Error("Sign-in popup was blocked by your browser. Please allow popups for iptv.menu.");
    }
    if (error.code === 'auth/cancelled-popup-request') {
      throw new Error("Authentication request was cancelled.");
    }
    throw new Error(error.message || "Failed to authenticate with Google. Please use email and password.");
  }
};

export const logOut = async () => {
  try {
    if (auth && typeof auth.signOut === 'function') {
      await signOut(auth);
    }
  } catch (error) {
    console.error("Error signing out", error);
  }
};
