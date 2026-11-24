/**
 * Builds this device's author has unlisted or deleted since the search index
 * was generated (spec 043, FR-009).
 *
 * The index is rebuilt once a night, so without this an author who unlists a
 * build and immediately searches for it to check would still find it, for up
 * to a day, which is exactly the moment spec 039's "not shown in search" is put
 * to the test. Other players see the change at the next rebuild; the author
 * sees it at once.
 *
 * Kept in localStorage so it survives a reload. Every access is guarded: in a
 * private window or with storage blocked the list is simply empty, and search
 * still works, just with the day's delay for the author too.
 */

const KEY = "aoe4guides.search.hidden";
/** Far more than one author unlists in a day; bounded so it can never grow without end. */
const MAX_ENTRIES = 200;

/** @return {Array<{id: string, at: number}>} */
function read() {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(value) ? value.filter((entry) => entry && typeof entry.id === "string") : [];
  } catch {
    return [];
  }
}

/** @param {Array<{id: string, at: number}>} entries */
function write(entries) {
  try {
    if (entries.length) localStorage.setItem(KEY, JSON.stringify(entries));
    else localStorage.removeItem(KEY);
  } catch {
    // Storage unavailable or full; the list is a courtesy, not a guarantee.
  }
}

/**
 * Hides a build from this device's search until an index newer than now arrives.
 *
 * @param {string} id
 */
export function addHidden(id) {
  const entries = read().filter((entry) => entry.id !== id);
  entries.push({ id, at: Date.now() });
  write(entries.slice(-MAX_ENTRIES));
}

/**
 * Stops hiding a build: it was listed again. Last night's index may well still
 * contain it, and it is listed now, so the author should find it.
 *
 * @param {string} id
 */
export function removeHidden(id) {
  const entries = read();
  const kept = entries.filter((entry) => entry.id !== id);
  if (kept.length !== entries.length) write(kept);
}

/**
 * The ids to leave out of search, pruning those the index has caught up with.
 *
 * An entry is retired once the index was generated after it: that index was
 * read from the database after the unlist, so it no longer holds the build.
 * The index is stamped with the time its read STARTED, so an unlist during the
 * nightly run is not retired early (spec 043 data-model).
 *
 * @param {Date} generatedAt - The loaded index's generation time.
 * @return {Set<string>}
 */
export function hiddenIds(generatedAt) {
  const since = generatedAt instanceof Date && !Number.isNaN(generatedAt.getTime()) ? generatedAt.getTime() : 0;
  const entries = read();
  const current = entries.filter((entry) => !(entry.at < since));
  if (current.length !== entries.length) write(current);
  return new Set(current.map((entry) => entry.id));
}
