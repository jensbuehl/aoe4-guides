import { db, doc, getDocFromServer, getDoc } from "@/firebase";

/**
 * Reads of `home/home` — the ~33 KB document the home page is made of.
 *
 * One page mount has three callers: Home.vue, and YoutubeGuides twice, because
 * the mobile and desktop sidebars are CSS-hidden duplicates rather than v-if
 * branches, so both really mount. Each used to issue its own read of the same
 * document. Everything below exists to make that one read, and to make the
 * *next* visit read nothing at all.
 *
 * Two layers, because they solve different halves of it:
 *
 * - `inflight` collapses concurrent and repeat callers inside one page session.
 *   Memoising the resolved value is not enough: a child's `onMounted` runs
 *   before its parent's, so both YoutubeGuides fire before Home does and the
 *   race is already lost by the time a value exists. The in-flight *promise*
 *   has to be what is shared.
 * - `localStorage` carries the snapshot across page loads for TTL_MS, which is
 *   what actually removes reads rather than merely deduplicating them.
 *
 * Firestore's own IndexedDB cache is deliberately not what does this. It was
 * bypassed in f395d19 (09.06.2026) because `getDoc` served the home page
 * indefinitely stale, and the cause of that was never established — quite
 * possibly App Check refusing the server leg, which `getDoc` swallows by
 * falling back to cache. Until someone knows, a TTL we control is the honest
 * fix, and `getDocFromServer` stays for the one read we still make.
 */

/**
 * How long a stored snapshot is served without contacting Firestore.
 *
 * Worst-case staleness is this PLUS updateHomeSnapshot's cadence, which is
 * six-hourly, because a visitor can store a snapshot moments before it is
 * regenerated: 6h + 6h means up to 12h before a newly published build reaches
 * the home page. If that ever matters, shorten this rather than the cron — the
 * cron is nearly free, this is the half that costs reads and bytes.
 */
const TTL_MS = 6 * 60 * 60 * 1000;

/**
 * Bump the version suffix whenever the snapshot gains a field the page renders,
 * so nobody is served a shape their build does not expect.
 *
 * `featuredContributor` (21.08.2026) is the pattern to keep in mind: Home.vue
 * happens to tolerate its absence with `?? null`, but that was luck rather than
 * design, and the next field added might render as `undefined` instead. A bump
 * costs one stale-cache miss per visitor and nothing else.
 */
const CACHE_KEY = "aoe4guides.homeSnapshot.v1";

let inflight = null;

/**
 * The stored snapshot if one is present and still inside its TTL, else null.
 *
 * Every failure mode collapses to null on purpose — absent key, private mode,
 * corrupt JSON, a clock that moved backwards. All of them mean "fetch it", and
 * none of them is worth telling the visitor about.
 *
 * @return {object|null}
 */
function readStored() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { data, fetchedAt } = JSON.parse(raw);
    if (!data || typeof fetchedAt !== "number") return null;
    const age = Date.now() - fetchedAt;
    if (age < 0 || age > TTL_MS) return null;
    return data;
  } catch {
    return null;
  }
}

/**
 * Stores a snapshot with its fetch time. Silent on failure.
 *
 * ~33 KB against a ~5 MB budget, so quota is not the expected failure — private
 * mode is, and it throws on write rather than on read. Losing the write costs
 * one extra read next visit, which is exactly the behaviour we had before.
 *
 * @param {object} data
 */
function writeStored(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, fetchedAt: Date.now() }));
  } catch {
    // Storage unavailable or full. The TTL simply never applies for this
    // visitor; the in-session memo still does.
  }
}

/**
 * Reads the document from Firestore, preferring the server.
 *
 * The server-first call is the one thing kept from the pre-TTL implementation:
 * when we do go to the network we want the current snapshot, not whatever the
 * SDK's cache decided to keep. The `getDoc` fallback covers offline.
 *
 * @return {Promise<object|undefined>}
 */
async function fetchSnapshot() {
  const ref = doc(db, "home", "home");
  try {
    const snap = await getDocFromServer(ref);
    return snap.data();
  } catch {
    const snap = await getDoc(ref);
    return snap.data();
  }
}

/**
 * The home snapshot, from the session, from storage, or from Firestore.
 *
 * A failed fetch is never stored and never memoised, so the next caller retries
 * rather than inheriting an empty page for the rest of the session.
 *
 * @return {Promise<object|null>}
 */
function loadSnapshot() {
  if (inflight) return inflight;

  const stored = readStored();
  if (stored) {
    inflight = Promise.resolve(stored);
    return inflight;
  }

  inflight = fetchSnapshot()
    .then((data) => {
      if (!data) {
        inflight = null;
        return null;
      }
      writeStored(data);
      return data;
    })
    .catch((error) => {
      inflight = null;
      throw error;
    });

  return inflight;
}

export async function getHomeSnapshot() {
  return loadSnapshot();
}

export async function getRecentYoutubeVideos() {
  const home = await loadSnapshot();
  return home?.recentVideos ?? null;
}

export async function getRecentCivBuilds() {
  const home = await loadSnapshot();
  return home?.recentCivBuilds ?? null;
}
