import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  updateProfile,
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
  getCountFromServer
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCizsvBzR6vDVQQ1fp_H8pEB6XjJ1T5qjY",
  authDomain: "aoe4-guides.firebaseapp.com",
  projectId: "aoe4-guides",
  storageBucket: "aoe4-guides.appspot.com",
  messagingSenderId: "534079912385",
  appId: "1:534079912385:web:655c4d6a80e4c8a40bd740",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export {
  auth,
  db,
  //Auth
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
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
  Timestamp
};
