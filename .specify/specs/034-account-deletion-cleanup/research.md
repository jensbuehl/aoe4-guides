# Research: Account Deletion Cleanup

**Feature**: 034-account-deletion-cleanup | **Date**: 2026-08-13

---

## R-1 — The trigger has to stay v1

**Decision**: extend the existing `functions.auth.user().onDelete()` handler in
`functions/users/deleteUser.js`, on the `firebase-functions/v1` namespace it
already uses.

**Rationale**: Cloud Functions v2 has no background auth trigger. What v2 offers
is *blocking* functions — `beforeUserCreated`, `beforeUserSignedIn` — which run
before an operation and cannot observe a deletion after the fact. `firebase-functions`
^6.0.0 still ships the v1 namespace, and `createUser`, `createContributor` and
`deleteUser` all already sit on it, so nothing is being kept alive purely for
this feature.

**Alternatives considered**:

- *A v2 blocking function*: does not exist for deletion. Not an option.
- *A callable the client invokes before deleting itself*: this is what we are
  moving away from. It cannot satisfy FR-004, because an administrator deleting
  an account from the console never calls it — which is the exact hole being
  closed.
- *A scheduled sweep that finds orphaned favourites records*: correct eventually,
  but it turns an immediate cleanup into a delayed one and adds a scan over a
  collection to a project that is deliberately cost-conscious. Rejected against
  Principle IV.

---

## R-2 — Idempotency: make the work list its own progress record

This is the sharpest risk in the feature. A retried or duplicated run must not
decrement anything twice, because that corrupts a build whose owner did nothing
wrong — strictly worse than the bug being fixed.

**Decision**: the favourites document is both the to-do list and the ledger.
Process it in chunks; each chunk **atomically** decrements the builds in that
chunk *and* removes those same build ids from the array it read them from. When
all three arrays are empty, delete the favourites document, then the user
document.

**Rationale**: a re-run can only ever see work that has not been done, because
the evidence that work was needed is destroyed in the same atomic write that does
it. No flag, no bookkeeping field, no separate state. It is also crash-safe in the
useful direction: an interrupted run leaves a favourites document holding exactly
the outstanding items, which doubles as the record FR-013 asks for.

**Alternatives considered**:

- *Delete the favourites document first, then decrement*: this is precisely the
  shape of the original bug — it destroys the only map of what needs adjusting
  before using it. A crash halfway leaves permanent, unrecoverable skew.
- *A `cleanupComplete` flag on the document*: guards a whole repeated run but not
  a partial one, which is the failure that actually happens. It also adds a field
  to a document whose next event is its own deletion.
- *One transaction per build*: correct, but one round trip per build for no gain
  over an atomic chunk.

---

## R-3 — Use a transaction, not a batch, and get three requirements for one read

**Decision**: each chunk is one `db.runTransaction()` over at most 200 builds —
read every build reference in the chunk, compute each new count, write the
clamped values, and `arrayRemove` the processed ids from the favourites document,
all inside the transaction.

**Rationale**: three separate requirements all need the build's *current* state,
and a blind `FieldValue.increment(-1)` provides none of them:

| Requirement | Why increment cannot do it |
|---|---|
| FR-007 — never go below zero | `increment` has no floor; a count already at 0 goes to −1 |
| FR-008 — skip builds that no longer exist | a write to a missing document creates it, resurrecting a deleted build as a stub |
| Race-safety against a concurrent vote | read-modify-write outside a transaction can lose a vote cast in the same instant |

One read per build answers all three. A transaction rather than a `WriteBatch`
because it retries automatically on contention, which closes the third row —
a `getAll()` followed by a batch would leave that race open, and while the window
is milliseconds, a transaction removes it for no extra operations.

**Chunk size 200**: a transaction caps at 500 operations, and a chunk costs
*N* build writes plus one favourites write. 200 leaves generous headroom, keeps
each commit small enough that a contention retry is cheap, and still clears an
account with 500+ interactions (FR-012) in three passes.

**Alternatives considered**:

- *`WriteBatch` + `getAll()`*: same operation count, atomic, but not race-safe.
  The existing scheduled functions use batches because they are the sole writer
  of the field they touch; here we are not.
- *Chunk of 499*: within the limit but leaves no room, and a single contention
  retry re-does the maximum possible work.

---

## R-4 — The client stops cleaning up, and the comment that explains why must go too

**Decision**: `deleteAccount` in `src/store/index.js` reduces to re-authenticate
if required, delete the auth user, clear state. The favourites read, the like
decrements and the favourites deletion all move server-side.

**Rationale**: this is what makes US3 free — the client no longer waits on *N*
build writes, so confirmation is immediate however much history the account had.
It is also the security improvement: cleanup stops depending on the departing
user's own permissions (FR-005), which is what made the original bug possible.

**Two things that must not be lost in the edit**:

1. The `auth/requires-recent-login` re-authentication branch added by 032. It is
   the only reason deletion works at all from a long-idle session, and it is easy
   to delete by accident while removing the code around it.
2. The ordering comment above the Firestore work — "Order matters, and it used to
   be the other way round…" — describes a constraint that will no longer exist.
   It must be **replaced**, not left behind. A comment explaining why code is
   ordered a certain way, sitting above code that no longer has that ordering, is
   worse than no comment: the next reader trusts it.

**Dead code to remove**: `deleteUserFavorites` in `favoriteService.js` loses its
only caller. `decrementLikes` does not — `Favorite.vue` still uses it.
`getUserFavorites` needs checking before removal; it may have other callers.

---

## R-5 — Verify on the dev project, not the emulator

**Decision**: verify against `aoe4-guides-dev`. **Superseded an earlier decision
to use the Firebase emulator suite** — recorded rather than rewritten, because
the reasoning is the reusable part.

**Rationale**: the project has no formal test suite by constitutional choice, so
manual golden-path verification is the standard here. Production is the wrong
venue because the thing being verified *is* a destructive counter adjustment on
build orders belonging to real authors.

The emulator was the first answer, and the argument for it was blast radius. But
`.firebaserc` already defines a separate `aoe4-guides-dev` project, which
provides exactly that — so the emulator's whole benefit was already available,
while its costs were not: a JDK, an `emulators` block, seeded fixtures, and an
environment to keep in sync with production shapes.

The deciding factor was that the emulator plan **rested on an unverified
assumption of its own** — that the Auth emulator fires v1 `onDelete` background
triggers into the functions emulator. On a real project that is not a question at
all. Choosing dev removed an assumption instead of adding one.

**Generalisable**: when a testing environment exists to reduce blast radius, and
a real isolated environment is already provisioned, the simulated one is pure
overhead. Check what the project already has before building a place to be safe
in.

**Consequence**: two checks are unreachable by deleting accounts, because a real
auth trigger can be neither re-fired nor interrupted on demand. §4 (idempotency)
and §7 (interruption) call `cleanUpAccountActivity` directly instead — the exact
function the trigger calls, so the real path is exercised minus the wiring that
§1 and §3 prove separately.

This is also where 032 T011 gets closed (FR-014): the same run that proves
upvotes and downvotes are decremented proves likes are too.

---

## R-6 — Rankings repair themselves, so do not add a task for it

**Finding**: `functions/builds/updateBuildScore.js` recomputes `score` from
`views`, `upvotes`, `downvotes` and `likes` every Friday at 00:00, and
`updateBuildAllTimeScore` does the equivalent for the all-time figure.

**Consequence**: once the counters are correct, the rankings that surface build
orders on the home page and in lists correct themselves on the next scheduled
run. No score recalculation belongs in this feature, and nobody should add one.

Worth stating because the user-visible symptom of this bug is *ranking* skew, and
the instinct on fixing counters is to go and fix the thing the counters feed.

---

## R-7 — What is deliberately left alone

- **Build orders authored by the deleted account** stay published and attributed.
  Pre-existing and intentional.
- **The contributor record** stays, because those build orders stay and must keep
  their author entry on author pages and in Top Contributors.
- **Comments** are out of scope — not part of the original defect, same
  "authored content survives" logic.
- **`users/{uid}` deletion** already works and is kept exactly as is.
- **Firestore rules** need no change. Cleanup runs on the admin SDK, which
  bypasses rules entirely; no client capability is being added or removed.
- **Historical orphans** are not repaired — decided 2026-08-13, volume is very
  small. See the decision recorded in `spec.md`.
