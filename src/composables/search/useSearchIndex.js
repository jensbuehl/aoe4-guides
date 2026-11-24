import { ref, shallowRef } from "vue";

/**
 * Loads the build search index (spec 043) the first time someone opens search,
 * and never before: a visitor who does not search downloads nothing.
 *
 * A plain fetch, deliberately. The file sits in Firebase Storage with a public
 * read rule (storage.rules, /search) and Storage does not enforce App Check, so
 * this works for exactly the visitors whose attestation fails and whom
 * Firestore turns away (FR-015). Going through `firebase/storage` would also
 * pull that SDK into the search chunk and cost a metadata round trip per open.
 * If App Check enforcement is ever switched on for Storage, this breaks for
 * those visitors with no error in the app to say why; see the rule's comment.
 *
 * The object carries `Cache-Control: public, max-age=3600`, so a second open
 * within the hour comes from the browser cache, and later ones revalidate
 * without a body.
 */

const SUPPORTED_VERSION = 1;

const INDEX_URL =
  `https://firebasestorage.googleapis.com/v0/b/${import.meta.env.VITE_FIREBASE_STORAGE_BUCKET}` +
  `/o/search%2Fbuilds.json?alt=media`;

// Module scope: one download per page session however many components ask.
// The in-flight promise is shared, not just the result. Home once read its
// snapshot three times on a cold load because two callers started before the
// first had resolved, and memoising only the value cannot catch that.
let pending = null;
let loaded = null;

/**
 * @return {Promise<Object>} The raw index, `{ v, generated, authors, builds }`.
 */
export function loadSearchIndex() {
  if (loaded) return Promise.resolve(loaded);
  if (!pending) {
    pending = fetch(INDEX_URL)
      .then((response) => {
        if (!response.ok) throw new Error(`Search index: HTTP ${response.status}`);
        return response.json();
      })
      .then((index) => {
        if (index?.v !== SUPPORTED_VERSION) {
          console.warn(`Search index: unsupported format version ${index?.v}`);
          throw new Error("Search index: unsupported format version");
        }
        loaded = index;
        return index;
      })
      .finally(() => {
        // Cleared on failure too, so the next open tries again.
        pending = null;
      });
  }
  return pending;
}

/**
 * Reactive wrapper for components.
 *
 * @return {{index: import("vue").Ref<Object|null>, status: import("vue").Ref<string>, load: Function}}
 *   status is "idle", "loading", "ready" or "error".
 */
export function useSearchIndex() {
  // shallowRef, measured: a deep ref turned all 4,000+ rows into reactive
  // proxies, and the matcher paid Vue's dependency tracking on every lookup of
  // every keystroke. The index never changes once loaded, so nothing needs to
  // react to its insides.
  const index = shallowRef(loaded);
  const status = ref(loaded ? "ready" : "idle");

  const load = async () => {
    if (status.value === "ready") return index.value;
    status.value = "loading";
    try {
      index.value = await loadSearchIndex();
      status.value = "ready";
    } catch {
      status.value = "error";
    }
    return index.value;
  };

  return { index, status, load };
}
