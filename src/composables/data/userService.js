import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/firebase";

export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data() : null;
}

export async function updateUserAvatar(uid, avatar) {
  // setDoc with merge creates the document if it doesn't exist (older accounts
  // predate the createUser Cloud Function and may not have a users/{uid} doc)
  await setDoc(doc(db, "users", uid), { avatar }, { merge: true });
}
