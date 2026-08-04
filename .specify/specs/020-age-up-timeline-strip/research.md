# Phase 0 Research — `020-age-up-timeline-strip`

All findings verified against `main` on 2026-08-04. No NEEDS CLARIFICATION remain.

---

## R1 — Where to compute `ageTimings` on write

**Decision**: Inside `addBuild()` and `updateBuild()` in `src/composables/data/buildService.js`.

**Rationale**: There are exactly three call sites that write build content, and all three already funnel through those two functions:

| Call site | Function | Situation |
|---|---|---|
| `BuildEditor.vue:404` | `addBuild` | create |
| `BuildEditor.vue:407` | `updateBuild` | edit |
| `BuildDetails.vue:341` | `updateBuild` | publish draft |

Computing in the service rather than in the views means one implementation, no chance of a future caller forgetting, and no change to the view code. `collectionService.update()` uses `updateDoc` with a whole-object payload, so writing `ageTimings` as a top-level key replaces the entire map — which is exactly what FR-033 needs for ages that disappear.

**Alternatives rejected**: computing in `BuildEditor.vue` (misses the publish-draft path in `BuildDetails.vue`); a Firestore `onWrite` trigger (needs the derivation in `functions/`, the thing R4 avoids, and costs a function invocation per save).

---

## R2 — Firestore rules impact

**Decision**: No rules change required. Reviewed per Principle V.

**Rationale**: `firestore.rules` grants builds `read, write` when the caller is authenticated **and** is the document's author — there is no field whitelist on that path, so a new `ageTimings` key is permitted. The second, public `builds` match allows updates only when `affectedKeys().hasOnly(['views','likes','upvotes','downvotes','comments'])`, so an unauthenticated client cannot touch `ageTimings`. The new field is therefore author-writable and public-read, which is what it needs to be.

**Consequence for R3**: because writes are restricted to the *author*, a client-side backfill is impossible — no signed-in user may rewrite other people's builds. The backfill must use the Admin SDK.

---

## R3 — How the backfill runs

**Decision**: A one-off local Node script in `scripts/`, using `firebase-admin` with a service account, bundled through the already-present `esbuild` so it can resolve the `@/` alias.

**Rationale**: `scripts/set-admin-claims.js` is the established precedent for exactly this — a one-time developer script run as `GOOGLE_APPLICATION_CREDENTIALS=… node scripts/…`. `firebase-admin` resolves at the repo root already.

The one wrinkle: the derivation imports `getTimings` from `timingsHelper.js`, which imports `@/composables/builds/villagerAggregator.js`. That alias is defined in `vite.config.mjs` and means nothing to plain Node. FR-006 forbids editing `timingsHelper.js` to use a relative path. So the script is bundled first:

```
npx esbuild scripts/backfill-age-timings.mjs --bundle --platform=node \
  --external:firebase-admin --alias:@=./src --outfile=scripts/.build/backfill.cjs
```

`esbuild` ships with Vite — no new dependency. Batches capped at 500 writes.

**Alternatives rejected**: an admin-only in-app button (blocked by rules — the client cannot write other users' builds, and widening the rules to allow it would be a real security regression for a one-time need); a Cloud Function (puts derivation logic in `functions/`, contradicting the clarified decision); `vite-node` (a new dev dependency for one command).

**Note on the admin-action convention**: this is a developer script run once from a workstation, not an in-app privileged action, so it does not need to become a callable with an admin-claim guard. If a repeatable in-app backfill is ever wanted, that convention applies.

---

## R4 — Derivation logic in `functions/`

**Decision**: None. `functions/builds/updateHomeSnapshot.js` adds `ageTimings` to the `pickBuildFields` whitelist and copies the value through.

**Rationale**: This is the whole point of the clarified storage decision. `functions/` is a separate CommonJS package that cannot import the ES-module composables, so any derivation there would be a second copy of the logic and a standing drift risk against FR-030. Copying a field through is one line and cannot drift.

---

## R5 — Rendering the age crests in the rail

**Decision**: Plain `<img>` with explicit `width`/`height` for the age crests — rail, chips and timeline alike. `v-img` stays on the card's civ flag.

**Rationale — this *is* the consistent choice, not a departure from it.** The app already has a settled convention, split by role rather than by preference:

| Element | Rendering | Examples |
|---|---|---|
| Large, meaningful, lazy-loaded imagery | `v-img` (51 uses) | civ flag on `BuildListCard`, hero images |
| Small fixed-size icons | plain `<img>` (25 uses) | every resource icon in the build order; **the age crests** |

The age crest specifically is already rendered as a plain `<img>` at fixed size in both build-order age plates — [`BuildOrderSectionEditor.vue:568`](../../../src/components/builds/BuildOrderSectionEditor.vue#L568) (desktop, 24 px) and [`:324`](../../../src/components/builds/BuildOrderSectionEditor.vue#L324) (mobile). Using `v-img` for the same asset in the rail would render one crest two different ways in two parts of the app, which is exactly what Principle III's consistency requirement is guarding against.

Two supporting reasons, neither of them the primary one: `v-img` carries per-instance lazy-loading machinery, and the rail would add 30 instances to a 10-card page on the render path NFR-004 constrains; and Principle III's wording is about preferring Vuetify components over *building custom ones* — an `<img>` element is not a custom component.

**Relationship to the design input**: `design-input.md` §2 suggests `v-img` for the rail crests. That mock was written without reference to the existing age-plate markup; the app's own convention wins. Visual result is identical.

---

## R6 — Memoization

**Decision**: A `computed` on the card over the build object, so derivation runs once per build and is cached until the build reference changes.

**Rationale**: Satisfies FR-007 without a manual cache to invalidate. Re-renders driven by `orderBy`, theme or breakpoint changes will not recompute.

---

## R7 — Performance after backfill

**Finding**: Once the backfill has run, the card takes the stored `ageTimings` path (FR-032) and does **no** derivation at all for published builds. Client-side derivation becomes a fallback for builds saved before the field existed and for previews of unsaved edits.

**Consequence**: NFR-004's 10 ms budget is comfortable, and the "CPU per card" concern from the original idea largely disappears rather than merely being acceptable.

---

## R8 — Verification approach

**Decision**: A throwaway harness for the four derivation fixtures, plus manual golden-path testing. No test framework added.

**Rationale**: The constitution requires manual golden-path testing and no formal suite. The derivation is the one piece with enough branching to be worth mechanical checks, and those can be a scratch script rather than a committed suite.

---

## R9 — The `derived` flag (correction to the design input)

**Decision**: Flag a time as estimated when the source step yields no *parseable* timestamp — test `toDateFromString(step.time) !== null`, not `!step.time`.

**Rationale**: `timingsHelper.init()` sets `startTime` from `toSeconds(toDateFromString(step.time))`, which is `null` for values that survive sanitising but do not match `^\d?\d:\d\d$`. `design-input.md` §4 proposes `!flat[b.index]?.time`, which reports such a step as author-stated when its time was in fact interpolated — precisely the misrepresentation FR-013 exists to prevent.

---

## R10 — Representing "no timings" in the document

**Decision**: Write `ageTimings: {}`.

**Rationale**: Simpler than `deleteField()` and behaves identically for ordering — a query on `ageTimings.castle.t` excludes documents where that nested path is absent, whether the parent map is empty or missing. Keeps the write payload uniform.

---

## R11 — Shared age-chip rendering

**Decision**: Extract the age-chip row into its own small component used by both `BuildListCard` (xs/sm) and `AgeTimeline` (xs).

**Rationale**: The spec has the same chips appearing in two places (FR-024 and FR-028). Principle III: "any UI pattern that appears more than once MUST be extracted into a shared component." Doing it up front avoids the duplicate-then-refactor cycle.
