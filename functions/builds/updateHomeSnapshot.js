const { onSchedule } = require("firebase-functions/v2/scheduler");
const { getFirestore } = require("firebase-admin/firestore");
const logger = require("firebase-functions/logger");

const BUILDS_LIMIT = 10;
const CONTRIBUTORS_LIMIT = 8;

function pickBuildFields(data, id) {
  return {
    id,
    title: data.title ?? "",
    description: data.description ? data.description.slice(0, 300) : null,
    author: data.author ?? "",
    authorUid: data.authorUid ?? "",
    civ: data.civ ?? null,
    strategy: data.strategy ?? null,
    map: data.map ?? null,
    season: data.season ?? null,
    likes: data.likes ?? 0,
    score: data.score ?? 0,
    scoreAllTime: data.scoreAllTime ?? 0,
    views: data.views ?? 0,
    comments: data.comments ?? 0,
    timeCreated: data.timeCreated ?? null,
    isDraft: data.isDraft ?? false,
    // Copied through, never computed here: the derivation lives in the client's
    // ES-module composables, which this CommonJS package cannot import. Deriving
    // it here would mean a second implementation free to disagree with the first.
    // Null on builds written before the field existed; the card renders no
    // timings for those rather than a placeholder.
    ageTimings: data.ageTimings ?? null,
  };
}

exports.updateHomeSnapshot = onSchedule(
  // Every rewrite invalidates this document in every visitor's persistence
  // cache, so they all re-download it whole — the cadence is an egress cost,
  // not just a freshness knob. Top-10 rankings and contributor standings do not
  // move meaningfully within an hour, so six-hourly buys back 6x the forced
  // re-downloads at no visible staleness. Raise the frequency only for content
  // that genuinely changes faster than the page is read.
  { schedule: "0 */6 * * *", timeoutSeconds: 300 },
  async () => {
    logger.log("updateHomeSnapshot: start");
    const db = getFirestore();
    const buildsRef = db.collection("builds");
    const filter = ["isDraft", "==", false];

    const [popularSnap, allTimeSnap, recentSnap, contributorsSnap, countSnap] =
      await Promise.all([
        buildsRef.where(...filter).orderBy("score", "desc").limit(BUILDS_LIMIT).get(),
        buildsRef.where(...filter).orderBy("scoreAllTime", "desc").limit(BUILDS_LIMIT).get(),
        buildsRef.where(...filter).orderBy("timeCreated", "desc").limit(BUILDS_LIMIT).get(),
        db.collection("contributors").orderBy("viewCount", "desc").limit(CONTRIBUTORS_LIMIT).get(),
        buildsRef.where(...filter).count().get(),
      ]);

    const popularBuilds = popularSnap.docs.map((d) => pickBuildFields(d.data(), d.id));
    const allTimeClassics = allTimeSnap.docs.map((d) => pickBuildFields(d.data(), d.id));
    const recentBuilds = recentSnap.docs.map((d) => pickBuildFields(d.data(), d.id));
    const topContributors = contributorsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const buildsCount = countSnap.data().count;

    await db.collection("home").doc("home").set(
      { popularBuilds, allTimeClassics, recentBuilds, topContributors, buildsCount },
      { merge: true }
    );

    logger.log("updateHomeSnapshot: done", {
      popularBuilds: popularBuilds.length,
      allTimeClassics: allTimeClassics.length,
      recentBuilds: recentBuilds.length,
      topContributors: topContributors.length,
      buildsCount,
    });
  }
);
