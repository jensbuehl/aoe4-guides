/**
 * Filters and sorts builds in memory exactly as Firestore does for the same
 * filter config (spec 042, research R8).
 *
 * My Favorites loads its builds by id and pages them here, because asking
 * Firestore to combine "these ids" with the list filters hits two limits: an
 * `in` filter takes at most 30 values, and a query at most 30 disjunctions
 * across all its `in` filters multiplied together (20 favourites × 2 seasons is
 * already refused). The result must match what getFilterQueryParams +
 * getOrderByQueryParam would return on the other lists, so this mirrors them:
 *
 * - `isDraft == drafts`, strictly: unlisted builds only when the config asks
 *   for them, and a build lacking the field never
 * - `creatorId == creator`, `authorUid == author`, `civ == civs`
 * - `season ∈ seasons`, `map ∈ maps`, `strategy ∈ strategies` (empty = no filter)
 * - ordered by `orderBy` descending, `sortTitle` ascending;
 * - a build WITHOUT the sort field is left out, as Firestore leaves out any
 *   document lacking an orderBy field;
 * - ties broken by document id in the same direction (Firestore's implicit
 *   `__name__` order).
 *
 * Pure: no Vue, no Firestore — so a plain Node harness can compare it with real
 * queries.
 *
 * @param {object[]} builds - Loaded builds, each with its `id`.
 * @param {object} config - A filter config (configDefaultProvider shape).
 * @return {object[]} A new array.
 */
export function applyListConfig(builds, config) {
  const cfg = config ?? {};
  const drafts = cfg.drafts === true;
  const inList = (values, value) => !Array.isArray(values) || values.length === 0 || values.includes(value);

  const orderBy = cfg.orderBy || "timeCreated";
  const dir = orderBy === "sortTitle" ? 1 : -1;

  return builds
    // Strict, as Firestore's `isDraft == false` is: a build with no `isDraft`
    // field at all matches neither value and is in no list (found by
    // comparing with real queries — such builds exist).
    .filter((b) => b && b.isDraft === drafts)
    .filter((b) => !cfg.creator || b.creatorId === cfg.creator)
    .filter((b) => !cfg.author || b.authorUid === cfg.author)
    .filter((b) => !cfg.civs || b.civ === cfg.civs)
    .filter((b) => inList(cfg.seasons, b.season))
    .filter((b) => inList(cfg.maps, b.map))
    .filter((b) => inList(cfg.strategies, b.strategy))
    .filter((b) => orderBy in b)
    .sort((a, b) => dir * compareValues(a[orderBy], b[orderBy]) || dir * compareValues(a.id, b.id));
}

/**
 * Firestore's ordering for the value types a build's sort fields hold:
 * null < numbers < strings < timestamps. (Booleans and the rest never appear in
 * a sort field.) NaN sorts below every other number, as in Firestore.
 */
function compareValues(a, b) {
  const ra = rank(a);
  const rb = rank(b);
  if (ra !== rb) return ra - rb;
  if (ra === 1) {
    if (Number.isNaN(a)) return Number.isNaN(b) ? 0 : -1;
    if (Number.isNaN(b)) return 1;
    return a - b;
  }
  if (ra === 2) return a < b ? -1 : a > b ? 1 : 0;
  if (ra === 3) return toMillis(a) - toMillis(b);
  return 0;
}

function rank(v) {
  if (v === null || v === undefined) return 0;
  if (typeof v === "number") return 1;
  if (typeof v === "string") return 2;
  if (typeof v?.toMillis === "function" || typeof v?.seconds === "number") return 3;
  return 0;
}

function toMillis(t) {
  if (typeof t?.toMillis === "function") return t.toMillis();
  return t.seconds * 1000 + Math.floor((t.nanoseconds ?? 0) / 1e6);
}
