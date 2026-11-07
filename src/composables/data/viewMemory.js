/**
 * Which builds this browser has counted a view for, and when.
 *
 * A view is "a person looked at this build today", not "the page loaded":
 * reloading, going back and forth inside the app or opening a second tab must
 * not count again. So before a view is written, the build is claimed here, and
 * a build claimed within the last 24 hours is not counted. The window is
 * rolling per build, the usual meaning of "one view per person per day", and
 * needs no dates or time zones.
 *
 * What is stored: build ids and millisecond timestamps, under one key. Nothing
 * else, and it never leaves the device. It is not fingerprinting: a second
 * browser, a private window or cleared site data counts again. That limit is
 * known and accepted (spec 040); only counting on a server can lift it.
 *
 * The claim is recorded BEFORE the view is written, so two mounts in quick
 * succession (back, then forward) cannot both count, whatever the network
 * does.
 *
 * Storage can be missing, blocked or full (private modes, site data
 * disabled). Then a module-level Map decides instead, which gives one view per
 * page load: never more than counting used to give, never an error.
 *
 * Deliberately import-free, so a plain Node harness can drive it.
 */

const STORAGE_KEY = "aoe4guides.viewed";
const WINDOW_MS = 24 * 60 * 60 * 1000;

/** Fallback for this page load, used when storage cannot be read or written. */
const memory = new Map();

/** The stored map; {} when absent or unreadable; null when storage itself is unavailable. */
function readStored() {
  let raw;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    return null; // unavailable: the Map decides
  }
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {}; // corrupt: start over, so the next write replaces it
  }
}

function writeStored(map) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
    return true;
  } catch {
    return false;
  }
}

/**
 * Claims a view of a build for this browser.
 *
 * @param {string} buildId
 * @param {number} [now=Date.now()]
 * @return {boolean} true if the view should be counted (and is now recorded),
 *   false if this browser already counted one within the last 24 hours.
 */
export function claim(buildId, now = Date.now()) {
  const recent = (at) => typeof at === "number" && now - at >= 0 && now - at < WINDOW_MS;

  // This page load first: it also covers storage that reads but cannot write.
  if (recent(memory.get(buildId))) return false;

  const stored = readStored();
  if (stored && recent(stored[buildId])) {
    memory.set(buildId, stored[buildId]);
    return false;
  }

  memory.set(buildId, now);
  if (stored) {
    // Prune as we go, so the map never holds more than a day of builds.
    const kept = {};
    for (const [id, at] of Object.entries(stored)) {
      if (recent(at)) kept[id] = at;
    }
    kept[buildId] = now;
    writeStored(kept);
  }
  return true;
}
