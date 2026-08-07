import { resolveAvatarUrl } from "@/composables/auth/useAvatar";

export const AVATAR_STORAGE_KEY = "aoe4-guides-avatar";

/**
 * The signed-in user's own avatar is the same on every visit, but finding it
 * out is not: auth has to restore from IndexedDB, and only then can the
 * users/{uid} profile be fetched. That leaves the header with nothing to draw
 * for the first moments of every page load. Remembering the last known avatar
 * lets us paint it as soon as auth confirms who we are, and lets us start
 * fetching the image before Vue has mounted at all.
 *
 * The uid is stored alongside so a different account never inherits it.
 */

/** @returns {{uid: string, avatar: object|null}|null} */
export function readCachedAvatar() {
  try {
    const raw = localStorage.getItem(AVATAR_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.uid ? parsed : null;
  } catch {
    // Private mode, a full quota, or a shape written by an older build.
    return null;
  }
}

export function writeCachedAvatar(uid, avatar) {
  try {
    localStorage.setItem(AVATAR_STORAGE_KEY, JSON.stringify({ uid, avatar: avatar ?? null }));
  } catch {
    // Storage unavailable — the avatar just loads the slow way.
  }
}

export function clearCachedAvatar() {
  try {
    localStorage.removeItem(AVATAR_STORAGE_KEY);
  } catch {
    // Nothing to do; a stale entry is guarded by its uid anyway.
  }
}

/**
 * Starts fetching the remembered avatar during app bootstrap, in parallel with
 * the Firebase auth restore, rather than when the header finally renders.
 *
 * No crossorigin attribute: <img> loads a cross-origin picture in no-cors mode
 * and the preload has to match, or the browser fetches the file twice.
 */
export function preloadCachedAvatar() {
  const url = resolveAvatarUrl(readCachedAvatar()?.avatar);
  if (!url) return;
  const link = document.createElement("link");
  link.rel = "preload";
  link.as = "image";
  link.href = url;
  document.head.appendChild(link);
}
