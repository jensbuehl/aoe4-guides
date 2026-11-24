/**
 * Remix lineage (spec 044): which builds are the same, which one is the
 * original, and who has remixed what.
 *
 * Pure and require-free apart from node:crypto, so scripts/check-lineage.mjs
 * can drive it without credentials, and scripts/link-remixes.mjs can share the
 * one fingerprint the nightly job uses.
 *
 * TWO RULES THIS FILE EXISTS TO KEEP:
 *
 * 1. Precedence comes only from times the server sets. "Who was first" is
 *    `stepsSince` (when the nightly job first saw a build's current steps) and
 *    then Firestore's own `createTime`, never the build's `timeCreated`: that one
 *    is written by the client, no rule checks it, and Publish resets it to now.
 *    Ordering by it would let anyone back-date a copy and have the real original
 *    hidden as the duplicate (research R2). `stepsSince` also resets when steps
 *    change, so an old build edited to match a newer one is the newer content.
 *
 * 2. The traversal mirrors forEachStep in src/composables/builds/useAgeTimings.js
 *    — ordinary steps, plus the steps inside each alternatives path; notes and
 *    nested blocks skipped; section gameplans left out. functions/ is CommonJS
 *    and cannot import src/, so it is written out again here, and
 *    check:lineage proves it reaches the paths nobody chose (CLAUDE.md).
 */
const { createHash } = require("node:crypto");

/** Below this many step rows a build is a stub or a template, never a copy. */
const MIN_ROWS = 5;
/** How many remixes a build page lists by name (the count is always exact). */
const REMIX_LIST_LIMIT = 10;

const ALTERNATIVES = "alternatives";
const FIELDS = ["time", "villagers", "builders", "food", "wood", "gold", "stone", "description"];

/**
 * One step value, normalised so formatting never matters but content does.
 *
 * Icons are content: each <img> becomes `[name]`, its file name without the
 * extension, BEFORE the other tags are stripped — otherwise "build [house]" and
 * "build [farm]" would be one build. Dropping the extension makes an old build's
 * `.png` path and a newer `.webp` one agree (legacyImagePaths.js).
 */
function normalise(value) {
  return String(value ?? "")
    .replace(/<img\b[^>]*?\bsrc\s*=\s*["']([^"']*)["'][^>]*>/gi, (_, src) => {
      const file = src.split(/[/\\]/).pop() ?? "";
      return ` [${file.replace(/\.[a-z0-9]+$/i, "")}] `;
    })
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/**
 * A build's steps as normalised rows, in reading order.
 *
 * @param {Array} sections - the build's `steps` field.
 * @return {string[]}
 */
function stepRows(sections) {
  const rows = [];
  const visit = (step) => {
    if (!step || typeof step !== "object") return;
    const row = FIELDS.map((field) => normalise(step[field]));
    if (row.some(Boolean)) rows.push(row.join("|"));
  };

  for (const section of Array.isArray(sections) ? sections : []) {
    for (const item of Array.isArray(section?.steps) ? section.steps : []) {
      if (!item?.kind) {
        visit(item);
        continue;
      }
      if (item.kind !== ALTERNATIVES) continue; // a note
      for (const path of Array.isArray(item.paths) ? item.paths : []) {
        for (const step of Array.isArray(path?.steps) ? path.steps : []) {
          // Blocks do not nest; an inner one is skipped, not descended into.
          if (step?.kind) continue;
          visit(step);
        }
      }
    }
  }
  return rows;
}

/**
 * The fingerprint two builds share exactly when their steps are the same.
 *
 * @param {Array} sections - the build's `steps` field.
 * @return {string|null} SHA-1 hex, or null under MIN_ROWS rows.
 */
function fingerprint(sections) {
  const rows = stepRows(sections);
  if (rows.length < MIN_ROWS) return null;
  return createHash("sha1").update(rows.join("\n")).digest("hex");
}

/** Earliest first: stepsSince, then createTime, then id — server times only. */
function byPrecedence(a, b) {
  return a.stepsSince - b.stepsSince || a.createTimeMs - b.createTimeMs || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
}

const finite = (value) => (Number.isFinite(value) ? value : 0);
const ref = (build) => ({ id: build.id, title: build.title ?? "", author: build.author ?? "" });

/**
 * What every build should hold after tonight's run.
 *
 * Each input build: { id, civ, authorUid, author, title, isDraft, scoreAllTime,
 * createTimeMs, stepsHash (tonight's), storedHash, storedSinceMs, remixOf }.
 *
 * @param {Array<Object>} builds - every build, unlisted ones included.
 * @param {number} nowMs
 * @return {Map<string, {stepsHash: string|null, stepsSince: number,
 *   duplicateOf: Object|null, remixCredit: number, remixes: Object|null}>}
 */
function derive(builds, nowMs) {
  const rows = builds.map((build) => {
    let stepsSince;
    if (build.storedHash === undefined || !Number.isFinite(build.storedSinceMs)) {
      stepsSince = finite(build.createTimeMs);
    } else if (build.storedHash === build.stepsHash) {
      stepsSince = build.storedSinceMs;
    } else {
      stepsSince = nowMs;
    }
    return { ...build, stepsSince, createTimeMs: finite(build.createTimeMs) };
  });
  const byId = new Map(rows.map((row) => [row.id, row]));
  const out = new Map(
    rows.map((row) => [
      row.id,
      { stepsHash: row.stepsHash ?? null, stepsSince: row.stepsSince, duplicateOf: null, remixCredit: 0, remixes: null },
    ])
  );

  // Duplicates: published builds only. Unlisted ones are in no list to hide
  // from, and an unlisted build is no original to hide others behind.
  const groups = new Map();
  for (const row of rows) {
    if (row.isDraft !== false || !row.stepsHash) continue;
    const key = `${row.civ}\n${row.stepsHash}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }
  for (const group of groups.values()) {
    if (group.length < 2) continue;
    group.sort(byPrecedence);
    const author = group[0].authorUid;
    // The original author's most-used copy stays listed; ties go to the earlier.
    let listed = null;
    for (const row of group) {
      if (row.authorUid !== author) continue;
      if (!listed || finite(row.scoreAllTime) > finite(listed.scoreAllTime)) listed = row;
    }
    for (const row of group) {
      if (row !== listed) out.get(row.id).duplicateOf = ref(listed);
    }
  }

  // Remix edges: a link to a build that still exists, by another account. A
  // remix of a remix is an edge to its direct parent only.
  const accounts = new Map();
  const published = new Map();
  for (const row of rows) {
    const target = byId.get(row.remixOf?.id);
    if (!target || !row.authorUid || row.authorUid === target.authorUid) continue;
    if (!accounts.has(target.id)) accounts.set(target.id, new Set());
    accounts.get(target.id).add(row.authorUid);
    if (row.isDraft === false) {
      if (!published.has(target.id)) published.set(target.id, []);
      published.get(target.id).push(row);
    }
  }
  for (const [id, set] of accounts) out.get(id).remixCredit = set.size;
  for (const [id, list] of published) {
    list.sort((a, b) => finite(b.scoreAllTime) - finite(a.scoreAllTime) || (a.id < b.id ? -1 : 1));
    out.get(id).remixes = { count: list.length, items: list.slice(0, REMIX_LIST_LIMIT).map(ref) };
  }
  return out;
}

module.exports = { stepRows, fingerprint, derive, MIN_ROWS, REMIX_LIST_LIMIT };
