import { initializeApp } from "firebase/app";
import {
  initializeAuth,
  indexedDBLocalPersistence,
  browserLocalPersistence,
  browserPopupRedirectResolver,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  deleteUser,
  updatePassword,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  reauthenticateWithPopup,
} from "firebase/auth";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  collection,
  getDoc,
  getDocFromServer,
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
import { initializeAppCheck, ReCaptchaV3Provider, getToken } from "firebase/app-check";
import { getFunctions } from "firebase/functions";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROEJCT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
// initializeAuth rather than getAuth, and deliberately without a
// popupRedirectResolver.
//
// getAuth installs browserPopupRedirectResolver as the default, and that
// resolver is not free at boot: inside _initializeWithPersistence the SDK does
// `if (resolver._shouldInitProactively) await resolver._initialize(this)`, and
// _shouldInitProactively is `_isMobileBrowser() || _isSafari() || _isIOS()`.
// On those browsers the gapi iframe — apis.google.com/js/api.js plus an iframe
// from firebaseapp.com — loads *inside* the initialization promise, and the
// first onAuthStateChanged is queued behind it. Measured on a throttled
// Pixel 7 against production, that was ~950ms before Firebase would so much as
// say "signed out", and everything gated on authIsReady waited it out.
//
// It bought nothing: that work exists to resolve a pending signInWithRedirect,
// and this app has no redirect flow at all — only signInWithPopup. The resolver
// is passed explicitly at those two call sites instead (see src/store/index.js),
// where it is genuinely needed.
//
// Persistence must now be named, since initializeAuth has no default. This is
// the hierarchy getAuth would have used: IndexedDB, falling back to
// localStorage where IndexedDB is unavailable (private modes, some webviews).
const auth = initializeAuth(app, {
  persistence: [indexedDBLocalPersistence, browserLocalPersistence],
});
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});
const functions = getFunctions(app);
const storage = getStorage(app);

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
  getToken,
  //Auth
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  deleteUser,
  updatePassword,
  onAuthStateChanged,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  reauthenticateWithPopup,
  browserPopupRedirectResolver,
  //database
  collection,
  getDoc,
  getDocFromServer,
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
  //storage
  storage,
  storageRef,
  uploadBytes,
  getDownloadURL,
};
