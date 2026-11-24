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
// "recency" since 2026-11-10, after three days of shadow runs: a stable top 5,
// originals ahead of their copies (spec 040, research R10 and the comparison logs).
const TRENDING_SOURCE = "recency";

const HALF_LIFE_DAYS = 7;

/**
 * What each kind of activity is worth, in views (spec 042). Version 1 was
 * views 1, upvotes 5, downvotes −10, likes 50.
 *
 * Measured 2026-11-24 over 4,442 published builds (4.34 M views, 7,440 likes,
 * 2,429 upvotes, 134 downvotes): views were ~92% of every score, likes ~8%,
 * upvotes 0.3%. Two rules set the new values, and the lower one binds:
 * - rarity and intent — a like arrives once per ~580 views, an upvote once per
 *   ~1,800, and a like is a save, the strongest signal — is the ceiling;
 * - trust — since spec 042 a like or upvote is one per verified account, but
 *   accounts are not free either, so one account's whole say on a build (like
 *   + upvote) is capped at 125 views; near the ceiling, ten throwaway accounts
 *   would be worth a month of a trending build's views.
 * Downvotes count for nothing: downvoting was removed (151 ever, shown nowhere).
 *
 * Changing these MUST bump WEIGHTS_VERSION: a build measured under other
 * weights is re-based once rather than credited the difference as activity.
 */
const WEIGHTS = { views: 1, upvotes: 25, likes: 100 };
const WEIGHTS_VERSION = 2;

/** Below this a score is noise; it is set to 0 once and then left alone. */
const TREND_FLOOR = 0.1;

const DAY_MS = 24 * 60 * 60 * 1000;

/** A stored number, or 0 when it is missing or not a finite number. */
function finite(value) {
  return Number.isFinite(value) ? value : 0;
}

/**
 * The weighted activity of a build (WEIGHTS). Both scores use it: the trend
 * from its daily change, All-time from its total.
 *
 * Missing AND non-finite fields count as 0, not just missing ones: in
 * November 2026, 20 builds held `upvotes: NaN`, written by some client under
 * the old open rules, and one NaN made the build's every score NaN — which
 * also breaks any sort that meets it.
 */
function activityTotal(build) {
  return (
    WEIGHTS.views * finite(build.views) +
    WEIGHTS.upvotes * finite(build.upvotes) +
    WEIGHTS.likes * finite(build.likes)
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
 * - rebased: last measured under other WEIGHTS (`trendWeights` absent = 1).
 *   Its total jumped because the weights changed, not because anyone did
 *   anything, so the trend only decays as on any day, no delta is added, and
 *   the base is re-taken under the new weights. Without this, the first run
 *   after the 042 switch would hand a build with 80 likes ~4,000 points of
 *   "activity" overnight. Per build, so an interrupted run simply re-bases the
 *   rest next time.
 * - unchanged: nothing to write. Lossless, because the stored base and
 *   timestamp are then still the right ones to measure from next time.
 *
 * Every result but "unchanged" carries `trendWeights` to store with it.
 *
 * @param {object} build - the stored fields: trend, trendBase, trendAt, trendWeights, isDraft
 * @param {number} total - activityTotal(build)
 * @param {number} nowMs
 * @return {{kind: string, trend: number, trendBase: number, trendWeights: number}}
 */
function nextTrend(build, total, nowMs) {
  const storedTrend = finite(build.trend);
  const since = toMillis(build.trendAt);

  // A NaN base (seeded from a NaN total before activityTotal guarded against
  // it) is as good as none: seed again.
  const trendWeights = WEIGHTS_VERSION;
  if (!Number.isFinite(build.trendBase) || since === null) {
    return { kind: "seeded", trend: 0, trendBase: total, trendWeights };
  }

  const current = (build.trendWeights ?? 1) === WEIGHTS_VERSION;

  if (build.isDraft === true) {
    const kind = current && storedTrend === 0 && build.trendBase === total ? "unchanged" : "held";
    return { kind, trend: 0, trendBase: total, trendWeights };
  }

  const decay = Math.pow(0.5, Math.max(0, nowMs - since) / DAY_MS / HALF_LIFE_DAYS);

  if (!current) {
    let trend = Math.max(0, storedTrend * decay);
    if (trend < TREND_FLOOR) trend = 0;
    return { kind: "rebased", trend, trendBase: total, trendWeights };
  }

  const delta = total - build.trendBase;
  if (storedTrend === 0 && delta === 0) {
    return { kind: "unchanged", trend: 0, trendBase: total, trendWeights };
  }

  let trend = Math.max(0, storedTrend * decay + delta);
  if (trend < TREND_FLOOR) trend = 0;

  return { kind: "updated", trend, trendBase: total, trendWeights };
}

/** What `score` holds once the switch is on: same order as `trend`, and a number in the old score's range. */
function scoreFromTrend(trend) {
  return Math.log1p(trend);
}

module.exports = {
  TRENDING_SOURCE,
  HALF_LIFE_DAYS,
  WEIGHTS,
  WEIGHTS_VERSION,
  TREND_FLOOR,
  activityTotal,
  nextTrend,
  scoreFromTrend,
};
