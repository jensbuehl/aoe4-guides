# Research: Vote Integrity (042)

Each entry: **Decision**, **Rationale**, **Alternatives considered**. Production figures come from
read-only measurements on 2026-11-24 (`scripts/.scratch/{fav-lengths,weights,remixes}.mjs`).

## R1 — Binding a count to a list across two documents

**Decision**: One batched write changes both `builds/{id}` and `favorites/{uid}`. Each document's
rule checks the *other* one with `get()` (before the batch) and `getAfter()` (after it):

- `builds/{id}`: a `likes` (or `upvotes`) step of +1 is allowed only if the caller's favourites
  list did not contain the build before and does after; −1 only the reverse.
- `favorites/{uid}`: a list may gain or lose exactly one build per write, and only together with the
  matching step on that build — or, for a removal, with no step when the build no longer exists or its
  count is already ≤ 0.

**Rationale**: Binding only the count leaves a loop open — like (+1, add), remove from the list without
−1, like again. The owner's favourites document is otherwise writable without limit, so both sides
must be bound. Firestore evaluates every document of a batch with `getAfter()` seeing the whole batch,
which is exactly the "same write" the spec asks for.

**Alternatives considered**:
- *Cloud Function callable that does both writes.* Server-side truth, but a cold start on every heart,
  a new deploy surface, and App Check plumbing — for a check the rules can do in one evaluation.
  Constitution I and IV.
- *Firestore trigger recomputing counts from lists.* Counts would lag, and a trigger on every heart
  costs a read of the list document per write; still needs the list to be protected.
- *Bind the build side only.* Leaves the remove-without-decrement loop (above).

## R2 — How the favourites rule learns which build changed

**Decision**: The client writes a small `lastChange: { list, buildId }` map in the same favourites
write. The rule reads the build id from it and then verifies, with set arithmetic, that the list
changed by exactly that one id:
`after.toSet() == before.toSet().union([id].toSet())` (add) or `.difference(...)` (remove).

**Rationale**: Rules cannot index a set, and an `arrayRemove` can remove from any position, so the
changed element cannot be recovered from the two lists alone. Declaring it and *proving* the
declaration is the standard pattern: a false `lastChange` fails the set equality.

**Alternatives considered**: *Last element of the list* — works for `arrayUnion` (it appends) but not
for removals. *One document per like* (`favorites/{uid}/likes/{buildId}`) would make the check an
`exists()` — but needs a migration of 9.6k list entries, a rewrite of account cleanup, and changes My
Favorites' loading, for no gain the set check does not already give.

Set comparisons, not list sizes: an old list may hold an id twice, and `arrayRemove` removes every
copy, so a size-based check would make such a like impossible to take back.

## R3 — Rule access-call budget

**Decision**: Fits comfortably. The build rule uses `exists`, `get` and `getAfter` on the caller's
favourites document (3); the favourites rule uses `exists`, `get` and `getAfter` on one build (3). A
batch allows 20 in total and 10 per document.

## R4 — Verified email for adding

**Decision**: `request.auth.token.email_verified == true` on every +1 and every list addition; not on
−1 and removals. Matches the client guard (`useVerificationGuard`), which checks `user.emailVerified`.
Google sign-ins carry `email_verified: true`.

## R5 — Downvotes frozen

**Decision**: Remove `downvotes` from the client-steppable counters in the builds rule, and from the
favourites keys a client may change. Account deletion (`accountCleanup.js`, Admin SDK) keeps giving
them back. `downvotes: 0` on create stays allowed (the editor still sends it; harmless).

**Rationale**: Freezing rather than clearing needs no migration and keeps the account-deletion
invariant (one step back per list entry) true.

## R6 — Client write

**Decision**: A new `reactionService.js` sends one `writeBatch` per click: `update` on the build
(`increment(±1)`, omitted in the zero case) and `set(..., { merge: true })` on the favourites document
(`arrayUnion`/`arrayRemove` plus `lastChange`). It **throws** on failure. `writeWithTokenRetry` is
exported from `collectionService` and wraps a function that *builds* the batch, because a batch can be
committed only once.

**Rationale**: Today's helpers log and swallow (`incrementNumber`, `addElementToArray`), which is why a
failed like is invisible. The merge set keeps the "first heart creates the document" behaviour that
`addElementToArray` documents.

**Zero case**: The component passes the build's current count; if it is ≤ 0 on removal, the build is
not written. A stale count (thinks 1, is 0) makes the −1 fail the `≥ 0` check, the button reverts, and
a reload fixes it — acceptable for a state only legacy drift produces.

**Offline**: A Firestore write offline does not reject — it waits. The button therefore shows a
pending state until the commit resolves, and refuses up front with a message when `navigator.onLine`
is false, so nothing shows as liked that is not.

## R7 — Two mounted copies of each button

**Finding**: `BuildDetails.vue` mounts `Vote` and `Favorite` twice (mobile and desktop rows, one
hidden by CSS), each with its own `isFavorite`/`upVote` ref initialised once on mount. A like in one
leaves the other stale until reload; with integrity rules a stale copy would send a refused write.

**Decision**: The components derive their state from the shared `userData` (`v-model`) lists and
update those lists on success; `BuildDetails` adjusts `build.likes`/`build.upvotes` from emitted
events (it already does for upvotes, not yet for likes). One source of truth, both copies in step.

## R8 — My Favorites without the cap

**Decision**: Load favourited builds by id — chunks of 30 in `where("id", "in", chunk)` queries run in
parallel — then filter, sort, count and page in memory with a pure `applyListConfig(builds, config)`.
The loaded array is what the existing `myFavoritesList` cache holds.

**Rationale**: Measured list lengths: median 2, p90 11, p99 29, max 58 — so 1–2 queries for almost
everyone, fewer reads than today's page + count. Removes both Firestore limits in play: 30 values per
`in`, and 30 disjunctions per query (favourites × seasons × maps × strategies).

**Matching the server's semantics** (FR-019) — `applyListConfig` must reproduce what
`getFilterQueryParams` + `getOrderByQueryParam` ask Firestore for:
- Filters: `isDraft == drafts` (false), `creatorId == creator`, `authorUid == author`, `civ == civs`,
  `season ∈ seasons`, `map ∈ maps`, `strategy ∈ strategies` (empty array = no filter).
- Order: `config.orderBy` descending, except `sortTitle` ascending. Ties broken by document id in the
  same direction (Firestore's implicit `__name__` order).
- **A build lacking the sort field is excluded**, as Firestore excludes documents without an
  `orderBy` field. `null` sorts below every number and timestamp.
- Timestamps compare by `toMillis()`.

**Alternatives considered**: chunked server queries with the filters (R-alternatives in the spec):
paging across chunks needs everything loaded anyway. Reverse index on builds (`likedBy`): publishes
who liked what. Per-like documents: still loads by id.

## R9 — New weights and the baseline re-take

**Decision**: `trend.js` gains `WEIGHTS = { views: 1, upvotes: 25, likes: 100 }` and
`WEIGHTS_VERSION = 2`; `activityTotal` uses them and ignores `downvotes`. Each build stores
`trendWeights`. When `nextTrend` meets a build whose `trendWeights` differs from the current version
(including absent = version 1), it decays the stored trend as usual, adds **no** delta, re-takes
`trendBase` under the new weights, and stamps the version.

**Rationale**: Without this, the first run sees `total − trendBase` jump by (100−50)·likes +
(25−5)·upvotes + 10·downvotes for every build and reports it as one day's activity — the top build
would gain ~4,000 points overnight. A per-build version is self-healing: an interrupted run simply
re-takes the rest next time, and spec 044 reuses it by bumping the version once more.

**Alternatives considered**: a one-off migration resetting `trendBase` (needs a script, a deploy-time
step, and is wrong for any build the job writes between the two); a global "rebase today" flag (fails
silently if the run is interrupted).

All-time is a plain recomputation (`log(max(total, 1))`), so it needs only a forced run of
`updateBuildAllTimeScore` after deploy, then `updateHomeSnapshot`.

## R10 — The read-only check

**Decision**: `scripts/check-vote-gaps.mjs`, committed (it is run at least three times: baseline,
comparison, and after deploy for SC-003). Reads every build (`select("title", "likes", "upvotes",
"isDraft")`) and every favourites document (≈ 9.5k reads per run). Writes its snapshot to
`scripts/.scratch/vote-gaps/<ISO date>.json` (gitignored, never bundled — FR-003) and, given a previous
snapshot, prints gap growth per build and counter, drift separately, non-finite counts separately, and
the list-length distribution (FR-022). Prints build ids and titles only — never an account id.

**Growth semantics**: gap = count − holders. A build absent from the previous snapshot is compared
against a previous gap of 0. Deleted builds are skipped. Account deletion moves count and lists
together, so it does not move a gap.

Point-in-time recovery would allow a single run against seven days ago, but whether it is enabled on
the project is unknown and the two-run method needs nothing.

## R11 — Deployment order

**Decision**: (1) baseline check, (2) app with the batched writes, My Favorites and no thumbs-down —
the new writes are accepted by the *current* rules, so the app can ship first; (3) comparison check
≥ 7 days after (1); (4) rules; (5) functions with the new weights, then force the All-time and home
jobs. Old open tabs send the old two writes, which the new rules refuse; acceptable.
