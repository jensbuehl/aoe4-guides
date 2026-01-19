import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  deleteUser,
  updatePassword,
  onAuthStateChanged,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  getDoc,
  updateDoc,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  where,
  orderBy,
  limit,
  limitToLast,
  query,
  startAfter,
  endBefore,
  Timestamp,
  increment,
  arrayUnion,
  arrayRemove,
  getCountFromServer,
} from "firebase/firestore";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app);

if(import.meta.env.VITE_DEBUG_TOKEN){
  self.FIREBASE_APPCHECK_DEBUG_TOKEN = import.meta.env.VITE_DEBUG_TOKEN;
}
const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider(import.meta.env.VITE_RECAPTCHA_PROVIDER_KEY),
  isTokenAutoRefreshEnabled: true,
});

export {
  auth,
  db,
  appCheck,
  //Auth
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  deleteUser,
  updatePassword,
  onAuthStateChanged,
  signOut,
  //database
  collection,
  getDoc,
  updateDoc,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  where,
  orderBy,
  limitToLast,
  limit,
  query,
  startAfter,
  endBefore,
  getCountFromServer,
  increment,
  arrayUnion,
  arrayRemove,
  Timestamp,
  //functions
  functions,
};
