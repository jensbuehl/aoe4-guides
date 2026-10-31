import { functions } from "@/firebase";
import { httpsCallable } from "firebase/functions";
import { createUserFavorites } from "@/composables/data/favoriteService";

/**
 * Turns an authenticated identity into a usable account: a display name where
 * the rest of the site reads one, and a favorites document.
 *
 * Two callers, and they are the reason this is a function rather than a chain
 * inline in the store — registration with a password, and a first Google
 * sign-in (spec 032, R-7).
 *
 * **Idempotent by requirement, not by luck.** Account completion is a state the
 * app can find an account in and repair, not a step that happens once: someone
 * can close the tab at the display-name prompt and be asked again on their next
 * sign-in. So this runs a second time on accounts that are partly set up. Both
 * callables merge, and so does `createUserFavorites`, which cannot replace an
 * existing list.
 *
 * **The name rejects; the favorites document does not.** The chain this
 * replaced logged its failures and resolved anyway, which left accounts
 * half-made with nobody the wiser. The display name is what makes an account
 * complete, so a failed callable rejects: the caller needs that failure to keep
 * the dialog open and to make the next sign-in try again.
 *
 * The favorites document is best-effort on purpose. It is optional — the first
 * heart or vote creates it with the same merge, and a missing one reads as "no
 * favorites" — and Firestore enforces App Check where the callables do not, so
 * a browser that blocks reCAPTCHA would otherwise fail sign-up, or be held at
 * the completion dialog, over a document it does not need.
 *
 * @param {Object} args
 * @param {string} args.uid - The account to set up.
 * @param {string} args.displayName - Already validated by the form that collected it.
 * @return {Promise<void>} Resolves once the name has landed and the favorites
 *   document has been attempted.
 */
export async function completeAccountSetup({ uid, displayName }) {
  const updateUserDisplayName = httpsCallable(functions, "updateUserDisplayName");
  const updateContributorDisplayName = httpsCallable(functions, "updateContributorDisplayName");

  // The two names must both land — `users/{uid}.displayName` is what marks the
  // account complete (R-6), and `contributors/{uid}.displayName` is what the
  // public listings read. Firestore rules keep the client out of both fields,
  // so these have to go through the Admin SDK callables.
  await Promise.all([
    updateUserDisplayName({ displayName, uid }),
    updateContributorDisplayName({ displayName, uid }),
  ]);

  await createUserFavorites(uid);
}
