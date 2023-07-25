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
  apiKey: "AIzaSyDPH5DcZAte-uY0L6NNSl0FFYcNttqcVBc",
  authDomain: "aoe4-guides-dev.firebaseapp.com",
  projectId: "aoe4-guides-dev",
  storageBucket: "aoe4-guides-dev.appspot.com",
  messagingSenderId: "409549146868",
  appId: "1:409549146868:web:ed7eb462db0afffa51aca1",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app)

self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider("6Lc0i0QlAAAAAIMMnWFd9yNtssKCmCuxodeiAjej"),
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
