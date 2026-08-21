# Research: Contributor Spotlight

**Feature**: `037-contributor-spotlight` | **Date**: 2026-08-21

Every question below was resolved by reading the code, not by assumption. Where a finding
contradicts the spec, the spec is reconciled and the correction is noted here.

---

## R1 — Where the nomination lives so the home page stays at one read

**Decision**: A `FEATURED_CONTRIBUTOR` constant at the top of
`functions/builds/updateHomeSnapshot.js`. The scheduled function fetches that one contributor
document and writes it into `home/home` as a `featuredContributor` field, alongside the existing
`topContributors`.

**Rationale**:

- `src/views/Home.vue` performs exactly one Firestore read — `getHomeSnapshot()` in
  `src/composables/data/homeService.js`, a single `getDocFromServer` on `home/home`. That read is
  the entire reason the snapshot exists (the file's own comment records the 23 → 1 reduction). Any
  design that fetches the featured contributor from the client doubles it.
- `CONTRIBUTORS_LIMIT = 8`, so the snapshot's `topContributors` cannot be relied on to contain the
  featured person. Curating someone at rank 20 would force a second read.
- A constant in `src/config/` cannot work: `functions/` is a separate CommonJS package
  (`functions/package.json` has no `"type": "module"`) and cannot import an ES module from `src/`.
  The file already carries this exact constraint as a comment on `pickBuildFields` — the reason the
  build-field derivation is copied rather than computed there.

**Cost**: one extra document read per scheduled run — four reads a day. Negligible against the
principle IV budget.

**Alternatives considered**:

| Alternative | Rejected because |
|---|---|
| Constant in `src/config/featured.js`, client fetches the contributor | Second read on the highest-traffic page. Violates FR-013. |
| Firestore document `home/featured`, edited in the console | No commit trail; the choice of who is honoured stops being reviewable. Saves only the deploy step. |
| Raise `CONTRIBUTORS_LIMIT` so the featured person is always inside it | Does not follow — rank 20 is still outside any sane limit, and it inflates the snapshot for everyone. |
| Duplicate the uid in both `src/config/` and `functions/` | Two homes for one fact. They drift, and the failure is silent. |

**Consequence to accept**: changing the spotlight is a commit plus `npm --prefix functions run
deploy`, visible at the next 6-hourly run. Recorded in the spec as an assumption, not a defect.

---

## R2 — The rank badge without an extra read

**Decision**: `updateHomeSnapshot` writes a `rank` field (1-based) onto each contributor document in
the new top eight, and clears `rank` from any document that was in the previous top eight but is no
longer. The author page reads the rank from the contributor document it already fetches.

**Rationale**: `src/views/builds/Builds.vue:163` already calls
`getContributor(filterConfig.value.author)` on every author-filtered load. Anything stored on that
document is therefore free on that page — the same property that makes `bio` and `youtube` free
there. A field is the only option that is both zero-cost and correct regardless of how the visitor
arrived.

Clearing stale ranks needs the previous list. The function currently writes `home/home` without
reading it; it will read it once at the start of the run to diff the two lists. That is one more
read per run, on top of R1's one.

**Alternatives considered**:

| Alternative | Rejected because |
|---|---|
| Read `home/home` from the author page and derive the rank client-side | `getHomeSnapshot` calls `getDocFromServer`, which is a real read every time. Violates FR-014. |
| Use the Vuex cache `store.state.cache.topContributorsList` | Only populated if the visitor loaded Home first in the same session. The badge would appear or vanish depending on navigation history — worse than absent. |
| Drop the rank badge | Viable, but it is the cheapest piece of status on the page and the field costs ~32 writes a day. |

**Edge case this creates**: a contributor who drops out of the top eight keeps a stale `rank` until
the next run clears it — at most six hours of a wrong badge. Acceptable; the diff-and-clear step is
what bounds it.

---

## R3 — Making the spotlight and the event banner mutually exclusive

**Decision**: Extract the event's constants and its live/over calculation out of
`src/components/home/EventBanner.vue` into `src/config/event.js`, exporting the links, the prize
pool, and an `isEventLive()` predicate. `EventBanner.vue` imports it and keeps rendering exactly as
today; `Home.vue` imports it to decide whether to render the spotlight instead.

**Rationale**: Today `EventBanner` owns `STARTS`/`ENDS` privately and hides itself with
`v-if="!isOver"`. `Home.vue` has no way to know whether the banner rendered, so it cannot fill the
slot. The decision has to move to something both can read.

This keeps the property the spec relies on in acceptance scenario 3: the banner already removes
itself on a known date, so the slot frees itself and the spotlight appears with **no further edit**.

**Alternatives considered**:

| Alternative | Rejected because |
|---|---|
| `EventBanner` emits its visibility to `Home` | A component hidden by `v-if` is never mounted, so it cannot emit that it is absent. |
| A wrapper component that picks one of the two | An extra layer whose only job is an `if`. Fails principle I. |
| Duplicate the end date in `Home.vue` | Two dates that must agree, in different files. The next tournament ships the bug. |

---

## R4 — Correction: the contributor document survives account deletion

**Finding**: `functions/users/deleteUser.js` deletes `favorites/{uid}` and `users/{uid}` only. Its
header comment states the intent explicitly: *"the account's build orders stay published, and
`contributors/{uid}` stays with them so they keep their attribution."*

**This contradicts the spec's edge case**, which assumed a deleted account leaves a dangling
reference the spotlight must tolerate. The real situation is the opposite and more awkward:

> A contributor who deletes their account **keeps their public profile**, including their
> introduction — and no longer has any way to sign in and remove it.

**Decision**: `functions/users/deleteUser.js` gains one line clearing `bio` and `youtube` from
`contributors/{uid}` while leaving `displayName`, `icon` and the counters intact. Attribution
survives, as intended; unmaintainable personal text does not.

**Rationale**: this feature introduces the first field on that document which is *personal
expression* rather than *attribution*. The existing "keep it for attribution" decision was made when
the document held only a name and two counters, and it is still right for those. A sentence someone
wrote about themselves, which they can never again edit or withdraw, is a different kind of data and
should not outlive the account. That the maintainer could still spotlight a departed user's bio from
the home page makes it concrete rather than theoretical.

The spec's edge case is reconciled to describe this instead of the dangling reference. The
"nomination points at a non-existent contributor" case remains real for a different reason — a
mistyped uid — and the guard is the same either way: the function writes `null` and the card does
not render.

**Alternatives considered**: leaving the fields in place (rejected: publishes text its author cannot
retract); deleting the whole contributor document (rejected: destroys attribution on every build
order that account wrote, which is exactly what the existing comment protects).

---

## R5 — YouTube identifier: what is accepted and how the link is built

**Decision**: Store one string that is either a channel ID (`UC` + 22 characters from
`[A-Za-z0-9_-]`) or a handle (`@` + 3–30 characters from `[A-Za-z0-9._-]`). Nothing else is
accepted. The address is composed at render time:

| Stored value | Rendered link |
|---|---|
| `UCxxxxxxxxxxxxxxxxxxxxxx` | `https://www.youtube.com/channel/UCxxxxxxxxxxxxxxxxxxxxxx` |
| `@handle` | `https://www.youtube.com/@handle` |

The pattern lives in one module used by the form, the display components **and** transcribed into
the Firestore rule, so a client that bypasses the form cannot store anything else.

**Rationale**: the link is rendered on the home page. A user-settable free-form URL there is a spam
and redirect vector, and it is not recoverable after the fact — the link is live the moment it is
saved. Constraining the stored value to something that cannot express a host is the only version of
this that is safe by construction rather than by validation diligence. FR-023 and SC-008 both state
it as an invariant, which means the rule has to carry it, not just the form.

Both forms are accepted because contributors know their channel by one or the other, and the site
already stores channel IDs for known creators in
`src/composables/filter/featuredCreatorDefaultProvider.js` — which gives the recognised-channel
check of FR-026 for free, as a lookup against that existing list. Note it only matches stored IDs;
a handle will not match unless the entry is also known by ID.

**Alternatives considered**: accepting a full URL and validating the host (rejected: one regex
mistake publishes an open redirect, and the safe version is strictly simpler); resolving handles to
IDs via the YouTube API (rejected: a network dependency and a quota for a cosmetic normalisation).

---

## R6 — Bio storage and rendering

**Decision**: Plain text, 180 characters, whitespace-normalised on save so that internal newlines
and runs of spaces collapse to single spaces. Rendered through ordinary interpolation.

**Rationale**:

- Vue escapes `{{ }}` interpolation, so plain-text rendering is the default and FR-021 is satisfied
  by *not* reaching for `v-html`. This is worth stating because it is a one-character mistake away.
- Collapsing newlines at the point of saving removes the "bio breaks the card layout" edge case at
  the source rather than defending against it in two components' CSS. The field is one or two
  sentences by design; multi-line was never wanted.
- Whitespace-only input normalises to an empty string, which is then treated as absent — one rule
  serves both the "clear it" flow and the "spaces only" edge case.

**Where it is stored**: `contributors/{uid}`, which `firestore.rules` grants `allow read` to
everyone. It cannot go on `users/{uid}`, whose rule is `allow read: if request.auth.uid == userId` —
a bio there would be invisible to every visitor except its author, which is the exact opposite of
the requirement.

---

## R7 — Firestore rules shape

**Decision**: extend the existing owner clause on `contributors/{contributor}` from `hasOnly(['icon'])`
to cover the two new fields, with validation that also permits deletion:

```
allow update: if request.auth != null
              && request.auth.uid == contributor
              && request.resource.data.diff(resource.data).affectedKeys()
                   .hasOnly(['icon', 'bio', 'youtube'])
              && (!('bio' in request.resource.data)
                  || (request.resource.data.bio is string
                      && request.resource.data.bio.size() <= 180))
              && (!('youtube' in request.resource.data)
                  || (request.resource.data.youtube is string
                      && request.resource.data.youtube.matches(
                           '^(UC[A-Za-z0-9_-]{22}|@[A-Za-z0-9._-]{3,30})$')));
```

**Rationale**: the `!('x' in ...)` guard is what makes clearing a field work — a `deleteField()`
write removes the key from `request.resource.data`, so a bare `size()` check would reject the very
operation FR-019 requires. The public `hasOnly(['boCount','viewCount'])` clause above it is
untouched, so anonymous view counting keeps working exactly as before.

The `rank` field written by R2 needs no rule: the Admin SDK bypasses rules, and no client may write
it — `rank` is absent from every `hasOnly` list, which is precisely what forbids it.

**Verification**: `matches()` in Firestore rules is RE2 and is *not* implicitly anchored, hence the
explicit `^…$`. Without the anchors, `https://evil.example/@x` would match.

---

## R8 — Visual tokens and icons already exist

- `--hero-fade`, `--hero-title`, `--hero-eyebrow`, `--hero-text`, `--hero-meta` and `--hero-shadow`
  are defined for both themes in `src/assets/base.css:54-59` and `:80-85`, and are already consumed
  by both `EventBanner.vue` and `HeroBuild.vue`. The spotlight uses them; it defines no colours.
- `mdi-youtube`, `mdi-trophy`, `mdi-account-star`, `mdi-open-in-new`, `mdi-eye`, `mdi-hammer` and
  `mdi-pencil` are **already in** `src/plugins/mdiIcons.js`. No icon work is expected — but the
  allowlist check still runs, because an icon chosen during implementation that is not on this list
  renders as nothing behind a green build.
- `UserAvatar.vue` already layers the image over initials and falls back to an `mdi-account` glyph
  when there is neither. The no-avatar edge case needs no new code.

---

## R9 — Verification approach

No formal test suite exists (constitution) and every surface here is visual. The plan therefore
relies on:

- `npm run build` — template compilation.
- `npm run check:setup` — catches a `ReferenceError` in `setup()` that the build cannot, which would
  blank a component behind a green build.
- The icon allowlist `comm` check from `CLAUDE.md`.
- A throwaway `@vue/reactivity` harness **in the repo root** for the pure logic — the bio
  normaliser, the identifier validator and the URL builder — since none of it needs a DOM. Deleted
  after use.
- Browser checks for everything else: both themes, phone and desktop width, event banner live and
  expired, contributor with and without bio/avatar/channel.
- The Firestore rules changes tested against the emulator or by direct console write attempts, since
  FR-020, FR-024 and SC-007 are claims about the server, and a passing form proves nothing about
  them.

---

## R10 — Writing to a contributor document that does not exist

**Question**: `firestore.rules` has no `allow create` for `contributors/{contributor}` — only `read`
and two `update` clauses. In Firestore rules `update` applies to existing documents only, so a
client `setDoc(…, { merge: true })` against a missing document is a *create* and would be denied.
Does that matter here?

**Finding — the gap is much narrower than it looks.** Two mechanisms create the document, both on
the Admin SDK, both bypassing rules:

- `functions/users/createUser.js` — the `createContributor` auth trigger, on every new account.
- `functions/users/updateUserDisplayName.js:71` — the `updateContributorDisplayName` callable, which
  uses `.set({ displayName }, { merge: true })` and therefore **creates the document if it is
  missing**. `src/composables/auth/useAccountSetup.js` calls it, and its header documents that it is
  *"idempotent by requirement, not by luck"* — it re-runs on any account found partly set up.

So every account that has a display name has a contributor document, and any account that somehow
lacks one is repaired at its next sign-in. The remaining hole is an account predating both
mechanisms that never signs in again — in which case nobody is editing a profile either.

**Decision**: add an `allow create` clause anyway, carrying the same validation plus
`authorId == contributor`, and have the client write `authorId` alongside the profile fields with
`setDoc(…, { merge: true })`.

**Rationale**: the cost is four lines and the alternative failure is bad out of proportion to its
likelihood. `updateDoc` against a missing document fails with `not-found`, which surfaces to the
contributor as an unexplained error on a page that offers them no way to fix it. The same latent gap
already exists in `updateContributorIcon`, which uses `updateDoc` — this closes it for the new
fields rather than copying it.

**Consequence to handle**: a document created this way has `authorId` and a bio but **no
`displayName`**. Today such an account renders no author header at all, because `getContributor`
returns null and the `v-if` hides it; after this change the document exists and the header would
render a nameless card. The fix is a rule for consumers, not for the rules file: **no surface may
render a contributor without a display name.** That is added to the read contract and to SC-009.

**Alternatives considered**: calling `completeAccountSetup` from the profile card to force the
document into existence (rejected — a repair path triggered by an unrelated action, and it needs a
display name it does not have); leaving `updateDoc` and reporting the error (rejected — tells the
user about a state they cannot leave).

---

## R11 — The character counter and the rule may not count the same thing

**Question**: the form counts with JavaScript `String.length`, which counts UTF-16 code units. The
rule uses Firestore's `String.size()`. Do they agree for every input?

**Finding**: not necessarily, and the disagreement is entirely about astral-plane characters —
emoji, which is exactly what people put in a bio. `"👍".length === 2` in JavaScript. If rules
`size()` counts code points, the same string is 1 there.

**This is not resolved by reading documentation, and the plan does not pretend it is.** It is
measured in the emulator before the limit is finalised, because the two possible answers fail in
opposite directions:

| If `size()` counts | Relative to the form | Failure mode |
|---|---|---|
| code points (likely) | more permissive | Counter stops the user early. Harmless, mildly annoying. |
| UTF-16 units or bytes | possibly stricter | Counter reads "180/180", the write is **refused**, and the user sees `permission-denied` with nothing to act on. |

**Decision**: measure it, then make the *client* count the same way the server does — not the other
way round, since the rule is the boundary and cannot be softened to match a counter. If they differ,
the counter uses whichever measure the rule applies, so the number the contributor sees is the
number that will be enforced.

**Requirement this adds**: the displayed allowance must agree with the enforced limit for every
input, including emoji. Added to the spec as FR-030 and to the write contract as a client
obligation, because "the counter is roughly right" is how a feature ships a dead end.

### What was actually implemented (2026-08-21)

The emulator measurement has not been taken. Rather than block on it or guess, `bioLength` counts
**UTF-8 bytes** — the largest of the three candidate measures (an emoji is 1 code point, 2 UTF-16
units, 4 bytes). That choice is correct under every reading of `size()`, because it can only make
the counter *stricter* than the rule, and only one direction of disagreement is survivable:

- Counter stricter than the rule → the contributor is stopped a few characters early. Invisible for
  ASCII, mildly pessimistic for umlauts, never a dead end.
- Counter looser than the rule → "180/180" followed by `permission-denied`, with nothing to act on.

So T017 stops being a blocker and becomes a confirm-and-relax: if `size()` turns out to count code
points, `bioLength` can be loosened so a German bio full of umlauts is not cut short. Until someone
measures, the conservative version is the one that cannot be wrong.


---

## R12 — Verifying the rules, and the trap in doing so

**Done, 2026-08-21.** The security rules are verified by 23 cases run against the Firebase Security
Rules test API — every accepted value, every rejected one, ownership, and the fields a client may
never write. This closes what the plan had listed as unverifiable without a browser or an emulator.

```sh
TOKEN=$(gcloud auth print-access-token)
curl -s -X POST "https://firebaserules.googleapis.com/v1/projects/aoe4-guides-dev:test"   -H "Authorization: Bearer $TOKEN"   -H "x-goog-user-project: aoe4-guides-dev"   -H "Content-Type: application/json" --data-binary @payload.json
```

The `x-goog-user-project` header is required: without it the call fails with a `SERVICE_DISABLED`
403 that talks about quota projects and reads like the API is unavailable.

**The trap, which cost a full false pass.** A test case supplies the document as
`request.resource.data` and the prior document as the case's `resource.data`. Those take **plain
JSON values**, not the Firestore typed-value encoding (`{"stringValue": "x"}`) used by the Firestore
REST API. Passing typed values does not error. The rules engine simply sees a nested **map**, and
then:

- `request.resource.data.bio is string` → `false`
- `request.resource.data.bio.size()` → `1`, the number of keys in `{"stringValue": …}`, not the
  length of the string

So `size() <= 180` passes for any string of any length, and every `is string` guard fails. The
result is a suite where **all 12 DENY cases pass and every ALLOW case fails** — which looks like a
strict, working ruleset and is in fact a harness that denies everything. The tell is that the
positives fail; a suite of nothing but negatives would have been reported as a clean pass.

Two things follow. Always include ALLOW cases, not only DENY cases — a rule that denies everything
satisfies every negative test ever written. And bisect a mismatch by condition rather than reading
the rule: the `visitedExpressions` report only names the top-level `allow` expression, so the way to
find the false term is to put each one behind its own `match /cN/{id}` path and run the same request
against all of them at once.
