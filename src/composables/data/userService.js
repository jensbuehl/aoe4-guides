import { doc, getDoc, setDoc, updateDoc, deleteField } from "firebase/firestore";
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

export async function updateContributorIcon(uid, iconUrl) {
  await updateDoc(doc(db, "contributors", uid), {
    icon: iconUrl ?? deleteField(),
  });
}

/**
 * The two public fields a contributor maintains about themselves.
 *
 * Lives here beside `updateContributorIcon` rather than in contributorService,
 * because what groups these is not the collection they write to but who is
 * allowed to write them: this file holds the things a signed-in person changes
 * about their own account. contributorService is the read and stat-increment
 * side of the same collection.
 *
 * @param {string} uid
 * @return {Promise<{bio: string|null, youtube: string|null}>}
 */
export async function getContributorProfile(uid) {
  const snap = await getDoc(doc(db, "contributors", uid));
  const data = snap.exists() ? snap.data() : null;
  return {
    bio: data?.bio ?? null,
    youtube: data?.youtube ?? null,
    twitch: data?.twitch ?? null,
    aoe4world: data?.aoe4world ?? null,
  };
}

/**
 * Save the public profile.
 *
 * `setDoc` with merge rather than `updateDoc`, and `authorId` written
 * alongside: an account whose setup never completed may have no contributor
 * record at all, and `updateDoc` would fail against it with `not-found` on a
 * page that offers the person no way out of that state. A merging write creates
 * it instead, which the security rules permit precisely because `authorId` is
 * pinned to the caller's own uid.
 *
 * Empty values are deleted rather than stored as `""`, so every consumer can
 * test presence alone and none has to also test for blankness.
 *
 * The link fields are listed one by one rather than spread from a map, so that
 * adding a fourth is a visible edit here and in `firestore.rules` — a loop over
 * whatever the caller passed would happily write a field the rules then refuse,
 * and the failure would surface as a permission error rather than as a missing
 * case.
 *
 * @param {string} uid
 * @param {{bio: string|null, youtube: string|null, twitch: string|null,
 *          aoe4world: string|null}} profile - Already normalised and validated
 *   by the caller; this function does not sanitise.
 * @return {Promise<void>}
 */
export async function updateContributorProfile(uid, { bio, youtube, twitch, aoe4world }) {
  await setDoc(
    doc(db, "contributors", uid),
    {
      authorId: uid,
      bio: bio ?? deleteField(),
      youtube: youtube ?? deleteField(),
      twitch: twitch ?? deleteField(),
      aoe4world: aoe4world ?? deleteField(),
    },
    { merge: true }
  );
}
