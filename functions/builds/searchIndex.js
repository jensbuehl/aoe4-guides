/**
 * The build search index (spec 043): one compact object holding every listed
 * build's title, author, civ, season, score and Feudal and Castle Age times, which the app
 * downloads when someone opens search and then searches on the device.
 *
 * Pure on purpose — no Firestore, no Storage — so `npm run check:search` can run
 * it against fixtures and the SEO snapshot without credentials. The nightly
 * `updateBuildTrend` job feeds it the builds it has already read and uploads
 * the result.
 *
 * The format is positional to keep it small on a phone (data-model.md):
 *   builds[i] = [id, title, authorIndex, civCode, seasonNumber, score,
 *                feudalSeconds, feudalEstimated, castleSeconds, castleEstimated]
 * Feudal and Castle only: on prod (2026-11-24) 49% of builds have a Feudal
 * time, 19% a Castle time and 2% an Imperial one, which is not worth its bytes.
 * The app and this file release separately — the job deploys with the
 * functions, the reader with Netlify — so a change of positions needs a new
 * `v` that the reader accepts alongside the old one for at least a day.
 */

const FORMAT_VERSION = 1;

/** A run that would publish fewer than this share of yesterday's rows is withheld. */
const MIN_SHARE_OF_PREVIOUS = 0.5;

/**
 * Season label to its number: "Season 12" → 12. Anything else → 0, which the
 * app shows as no season rather than as "Season 0".
 *
 * @param {*} season
 * @return {number}
 */
function seasonNumber(season) {
  const match = typeof season === "string" ? season.match(/(\d+)/) : null;
  return match ? Number(match[1]) : 0;
}

/**
 * One age's time as stored by toStoredAgeTimings: `{ feudal: { t, e }, castle: … }`.
 *
 * @param {*} ageTimings
 * @param {"feudal"|"castle"} age
 * @return {[number|null, number]} seconds (or null) and the estimated flag.
 */
function ageTime(ageTimings, age) {
  const entry = ageTimings && typeof ageTimings === "object" ? ageTimings[age] : null;
  const t = entry ? entry.t : null;
  if (typeof t !== "number" || !Number.isFinite(t) || t < 0) return [null, 0];
  return [Math.round(t), entry.e ? 1 : 0];
}

/**
 * Builds the index object from the builds the nightly job read.
 *
 * Unlisted builds (`isDraft === true`) are dropped here and nowhere else: spec
 * 039 promises authors an unlisted build is "not shown in search", and the index
 * is the only thing search reads. check:search asserts it.
 *
 * @param {Array<Object>} builds - { id, title, author, authorUid, civ, season,
 *   isDraft, score, ageTimings } per build.
 * @param {string} generatedIso - When the job STARTED reading, not when it
 *   uploads: the app retires a build from its hide list once the index is newer
 *   than the unlist, and an unlist between the read and the upload must not
 *   count as covered (data-model.md, "the hide-list race").
 * @return {{v: number, generated: string, authors: Array, builds: Array}}
 */
function buildSearchIndex(builds, generatedIso) {
  const authors = [];
  const authorIndex = new Map();
  const rows = [];

  for (const build of builds) {
    if (!build || build.isDraft === true) continue;

    const name = typeof build.author === "string" ? build.author : "";
    const uid = typeof build.authorUid === "string" ? build.authorUid : "";
    // Keyed by uid so two people with one display name stay two authors; a
    // build with no uid falls back to its name, and gets no author link.
    const key = uid ? `u:${uid}` : `n:${name}`;
    if (!authorIndex.has(key)) {
      authorIndex.set(key, authors.length);
      authors.push([uid, name]);
    }

    // Not `?? 0`: the old weekly job stored NaN for some builds, and one NaN
    // makes the reader's sort comparator meaningless for the whole list.
    const score = Number.isFinite(build.score) ? Math.round(build.score * 100) / 100 : 0;
    rows.push([
      String(build.id),
      typeof build.title === "string" ? build.title : "",
      authorIndex.get(key),
      typeof build.civ === "string" && build.civ ? build.civ : "ANY",
      seasonNumber(build.season),
      score,
      ...ageTime(build.ageTimings, "feudal"),
      ...ageTime(build.ageTimings, "castle"),
    ]);
  }

  rows.sort((a, b) => b[5] - a[5]);

  return { v: FORMAT_VERSION, generated: generatedIso, authors, builds: rows };
}

/**
 * Whether a freshly built index may replace yesterday's.
 *
 * FR-010: a broken run — a query that came back empty, a filter that dropped
 * most builds — must never replace a good index with a bad one. Players would
 * see "No builds found" for everything until the next night, and nobody would
 * know why. Withholding keeps yesterday's index serving.
 *
 * @param {number} previousCount - Rows in the index being replaced (0 if none).
 * @param {number} newCount - Rows in the new index.
 * @return {boolean}
 */
function shouldPublish(previousCount, newCount) {
  if (newCount === 0) return false;
  if (previousCount > 0 && newCount < previousCount * MIN_SHARE_OF_PREVIOUS) return false;
  return true;
}

module.exports = { buildSearchIndex, shouldPublish, FORMAT_VERSION };
