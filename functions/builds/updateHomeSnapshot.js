const { onSchedule } = require("firebase-functions/v2/scheduler");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const logger = require("firebase-functions/logger");

const BUILDS_LIMIT = 10;
const CONTRIBUTORS_LIMIT = 8;

/**
 * The contributor currently in the home page spotlight — a uid, or "" for nobody.
 *
 * Curated by hand, deliberately. The leaderboard below it ranks by `viewCount`,
 * which any unauthenticated client may increment and which never decays; that
 * is harmless for a sidebar list and wrong for the most prominent card on the
 * site. Choosing by hand also means the person's self-written bio has been read
 * by a human before it reaches the home page, which is the only moderation this
 * feature has.
 *
 * It lives here rather than in `src/config/` because this package is CommonJS
 * and cannot import an ES module from `src/` — and because the snapshot carries
 * only the top eight contributors, so a client-side nomination would force a
 * second Firestore read on the home page for anyone ranked below that.
 *
 * Changing it: edit, commit saying who and why, then `npm run deploy` from
 * `functions/`. Visible at the next scheduled run. Full routine in
 * .specify/specs/037-contributor-spotlight/quickstart.md
 */
// Valdemar — 140 build orders, ~972k reads, the site's most-read contributor.
//
// Note this uid is a PROD one. The same constant serves both Firebase projects,
// so whichever environment it does not belong to resolves it to nothing and
// simply shows no card. That is the intended failure, not a bug to fix.
const FEATURED_CONTRIBUTOR = "WIn1mNvYXGap5UlRvJXYeHahdYl1";

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

/**
 * The spotlighted contributor's whole record, or null.
 *
 * Null covers three cases the home page cannot tell apart and does not need to:
 * nobody nominated, a mistyped uid, and a read that failed. All three mean "no
 * spotlight card", and none of them may fail the run — the rest of the snapshot
 * is what the home page is actually made of, and letting a cosmetic card take
 * it down would be the wrong trade by a wide margin.
 *
 * The record is spread whole, as `topContributors` already is. Unlike a build,
 * there is nothing to trim: every field on a contributor document is public by
 * intent.
 *
 * @param {FirebaseFirestore.Firestore} db
 * @return {Promise<Object|null>}
 */
async function getFeaturedContributor(db) {
  if (!FEATURED_CONTRIBUTOR) return null;

  try {
    const doc = await db.collection("contributors").doc(FEATURED_CONTRIBUTOR).get();
    if (!doc.exists) {
      logger.warn("updateHomeSnapshot: featured contributor not found", {
        uid: FEATURED_CONTRIBUTOR,
      });
      return null;
    }
    return { id: doc.id, ...doc.data() };
  } catch (error) {
    logger.error("updateHomeSnapshot: could not read featured contributor", error);
    return null;
  }
}

/**
 * Mirror the standings onto the contributor documents themselves.
 *
 * The author page already fetches `contributors/{uid}` on every load, so a
 * field there costs that page nothing. Deriving the rank client-side would have
 * meant reading the home snapshot from a page that does not otherwise need it —
 * a real Firestore read, since `getHomeSnapshot` always goes to the server.
 *
 * Clearing is the half that is easy to forget: without it, a contributor who
 * drops out of the top eight wears the badge forever. That is why the previous
 * snapshot is read at the start of the run — it is the only record of who held
 * a rank last time.
 *
 * Never fails the run. These writes are decoration on a page that already
 * works; a contributor document that vanished between the query and the write
 * is not an error condition.
 *
 * @param {FirebaseFirestore.Firestore} db
 * @param {Array<{id: string, rank: number}>} ranked - The new top eight, in order.
 * @param {Array<string>} previousIds - Who held a rank at the end of the last run.
 * @return {Promise<void>}
 */
async function syncContributorRanks(db, ranked, previousIds) {
  const currentIds = new Set(ranked.map((contributor) => contributor.id));

  const writes = ranked.map((contributor) =>
    db.collection("contributors").doc(contributor.id).update({ rank: contributor.rank })
  );

  for (const id of previousIds) {
    if (!currentIds.has(id)) {
      writes.push(
        db.collection("contributors").doc(id).update({ rank: FieldValue.delete() })
      );
    }
  }

  const results = await Promise.allSettled(writes);
  const failed = results.filter((result) => result.status === "rejected").length;
  if (failed) {
    logger.warn("updateHomeSnapshot: some rank writes failed", { failed, of: writes.length });
  }
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

    const homeRef = db.collection("home").doc("home");

    const [popularSnap, allTimeSnap, recentSnap, contributorsSnap, countSnap, previousSnap] =
      await Promise.all([
        buildsRef.where(...filter).orderBy("score", "desc").limit(BUILDS_LIMIT).get(),
        buildsRef.where(...filter).orderBy("scoreAllTime", "desc").limit(BUILDS_LIMIT).get(),
        buildsRef.where(...filter).orderBy("timeCreated", "desc").limit(BUILDS_LIMIT).get(),
        db.collection("contributors").orderBy("viewCount", "desc").limit(CONTRIBUTORS_LIMIT).get(),
        buildsRef.where(...filter).count().get(),
        // Read before it is overwritten: the outgoing top eight is the only
        // record of whose `rank` field has to be cleared this run.
        homeRef.get(),
      ]);

    const popularBuilds = popularSnap.docs.map((d) => pickBuildFields(d.data(), d.id));
    const allTimeClassics = allTimeSnap.docs.map((d) => pickBuildFields(d.data(), d.id));
    const recentBuilds = recentSnap.docs.map((d) => pickBuildFields(d.data(), d.id));
    // Stamped from this run's ordering rather than copied from the documents,
    // which still carry the previous run's value at this point — the snapshot
    // has to agree with itself.
    const topContributors = contributorsSnap.docs.map((d, index) => ({
      id: d.id,
      ...d.data(),
      rank: index + 1,
    }));
    const buildsCount = countSnap.data().count;

    const previousRankedIds = (previousSnap.data()?.topContributors ?? [])
      .map((contributor) => contributor?.id)
      .filter(Boolean);

    const featuredContributor = await getFeaturedContributor(db);
    if (featuredContributor) {
      // Same reason as above: the record was read before this run's ranks were
      // computed, so its own `rank` field is one run out of date. Null rather
      // than left alone, so a contributor who has just dropped out of the top
      // eight does not appear in the spotlight still wearing the badge.
      const rankById = new Map(topContributors.map((c) => [c.id, c.rank]));
      featuredContributor.rank = rankById.get(featuredContributor.id) ?? null;
    }

    await homeRef.set(
      {
        popularBuilds,
        allTimeClassics,
        recentBuilds,
        topContributors,
        buildsCount,
        // Written as explicit null rather than omitted. This document is
        // merged, so leaving the key out would strand the previous spotlight
        // here forever — un-nominating someone would silently do nothing.
        featuredContributor,
      },
      { merge: true }
    );

    // After the snapshot, deliberately. The home page is what this function
    // exists for; the rank mirror is a convenience for the author page, and it
    // must not be able to delay or prevent the page's own data landing.
    await syncContributorRanks(db, topContributors, previousRankedIds);

    logger.log("updateHomeSnapshot: done", {
      popularBuilds: popularBuilds.length,
      allTimeClassics: allTimeClassics.length,
      recentBuilds: recentBuilds.length,
      topContributors: topContributors.length,
      featuredContributor: featuredContributor?.id ?? null,
      buildsCount,
    });
  }
);
