import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "__VITE_FIREBASE_API_KEY__",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "__VITE_FIREBASE_AUTH_DOMAIN__",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "__VITE_FIREBASE_PROJECT_ID__",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "__VITE_FIREBASE_STORAGE_BUCKET__",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "__VITE_FIREBASE_MESSAGING_SENDER_ID__",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "__VITE_FIREBASE_APP_ID__"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
};

export const logOut = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out", error);
    throw error;
  }
};
