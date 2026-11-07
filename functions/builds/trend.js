/**
 * Trending: how much attention a build is getting NOW (spec 040).
 *
 * The old score ranked everything a build had ever collected, recalculated
 * weekly, with no age penalty for six weeks. A new build scored zero until the
 * next Friday, and incumbents kept the top places for about nine weeks on the
 * strength of their first few. This ranks recent activity instead: each run
 * adds what a build gained since the last run, and older gains fade with a
 * half-life of HALF_LIFE_DAYS. A build that stops being used drifts down; an
 * old one that becomes useful again (a patch) climbs back like a new one.
 *
 * Pure and require-free, so a plain Node harness can drive it, and both
 * scheduled jobs share one activity weighting.
 */

/**
 * Which score the Trending order uses. "legacy": the weekly updateBuildScore
 * writes `score`, and updateBuildTrend only keeps its own `trend*` fields (the
 * shadow period). "recency": updateBuildTrend writes `score` from `trend`, and
 * updateBuildScore does nothing.
 *
 * Switching, either way — the same edit-and-deploy routine as
 * FEATURED_CONTRIBUTOR in updateHomeSnapshot.js: change this line, commit
 * saying why, `npm run deploy` from functions/, then force-run the job whose
 * turn it now is, and updateHomeSnapshot, from Cloud Scheduler. Full routine:
 * .specify/specs/040-fair-trending/quickstart.md §4.
 */
const TRENDING_SOURCE = "legacy";

const HALF_LIFE_DAYS = 7;

/** Below this a score is noise; it is set to 0 once and then left alone. */
const TREND_FLOOR = 0.1;

const DAY_MS = 24 * 60 * 60 * 1000;

/** A stored number, or 0 when it is missing or not a finite number. */
function finite(value) {
  return Number.isFinite(value) ? value : 0;
}

/**
 * The weighted activity of a build. The same weights the old score used;
 * spec 040 changes when activity counts, not how much each kind is worth.
 *
 * Missing AND non-finite fields count as 0, not just missing ones: in
 * November 2026, 20 builds held `upvotes: NaN`, written by some client under
 * the old open rules, and one NaN made the build's every score NaN — which
 * also breaks any sort that meets it.
 */
function activityTotal(build) {
  return (
    finite(build.views) +
    5 * finite(build.upvotes) -
    10 * finite(build.downvotes) +
    50 * finite(build.likes)
  );
}

function toMillis(at) {
  if (typeof at === "number") return at;
  if (at && typeof at.toMillis === "function") return at.toMillis();
  return null;
}

/**
 * The next trend values for one build.
 *
 * - seeded: never seen before. Its whole history becomes the starting point,
 *   not a burst of "new" activity — otherwise the first run would just be the
 *   old all-time ranking again.
 * - held: unlisted. Its shared-link views keep the starting point in step, so
 *   publishing does not land them all at once; the score stays 0.
 * - updated: decayed by the time actually elapsed since the last write (exact
 *   after a missed or late run), plus what it gained since, never below 0.
 * - unchanged: nothing to write. Lossless, because the stored base and
 *   timestamp are then still the right ones to measure from next time.
 *
 * @param {object} build - the stored fields: trend, trendBase, trendAt, isDraft
 * @param {number} total - activityTotal(build)
 * @param {number} nowMs
 * @return {{kind: string, trend: number, trendBase: number}}
 */
function nextTrend(build, total, nowMs) {
  const storedTrend = finite(build.trend);
  const since = toMillis(build.trendAt);

  // A NaN base (seeded from a NaN total before activityTotal guarded against
  // it) is as good as none: seed again.
  if (!Number.isFinite(build.trendBase) || since === null) {
    return { kind: "seeded", trend: 0, trendBase: total };
  }

  if (build.isDraft === true) {
    const kind = storedTrend === 0 && build.trendBase === total ? "unchanged" : "held";
    return { kind, trend: 0, trendBase: total };
  }

  const delta = total - build.trendBase;
  if (storedTrend === 0 && delta === 0) {
    return { kind: "unchanged", trend: 0, trendBase: total };
  }

  const days = Math.max(0, nowMs - since) / DAY_MS;
  let trend = Math.max(0, storedTrend * Math.pow(0.5, days / HALF_LIFE_DAYS) + delta);
  if (trend < TREND_FLOOR) trend = 0;

  return { kind: "updated", trend, trendBase: total };
}

/** What `score` holds once the switch is on: same order as `trend`, and a number in the old score's range. */
function scoreFromTrend(trend) {
  return Math.log1p(trend);
}

module.exports = {
  TRENDING_SOURCE,
  HALF_LIFE_DAYS,
  TREND_FLOOR,
  activityTotal,
  nextTrend,
  scoreFromTrend,
};
