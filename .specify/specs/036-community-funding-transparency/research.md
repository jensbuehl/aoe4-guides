# Phase 0 Research: Community Funding Transparency

**Feature**: `036-community-funding-transparency` | **Date**: 2026-08-13

All Technical Context unknowns are resolved below. The dominant finding is R1: because the
funding status renders in the **footer** — and therefore on every page — the storage
decision is made for it, and made the opposite of what "live data" instinct suggests. The
primary *visual* placement is the home sidebar (R10, R11); the footer is the fallback that
catches every other page, and it is the footer's ubiquity that drives the architecture.

---

## R1 — Where the supporter list lives

**Decision**: A plain module in the repository (`src/config/supporters.js`), bundled
with the app. Not Firestore.

**Rationale**: The funding status appears in `Footer.vue`, which renders on *every page
of the site*. Reading it from Firestore would add one read per page view. At the site's
current traffic that is on the order of millions of reads a month against a free tier of
50k/day — so a feature whose entire purpose is to cover ~€20/month of running costs
would begin by materially increasing them. Constitution Principle IV (Cost-Conscious
Infrastructure) settles this on its own; Principle I (Simplicity First) agrees, since
the repo option needs no document, no security rule, no admin screen and no caching
layer.

The data also suits it: a dozen entries, changing once a month, with a maintainer who
already deploys by pushing to a branch. And there is direct precedent in the codebase —
`src/views/About.vue:315` already carries a hand-maintained `contributors` array of
people's names, with a comment explaining why it is hardcoded. This feature follows an
established pattern rather than inventing one.

**Alternatives considered**:

| Option | Rejected because |
|---|---|
| Firestore document + admin UI | A read on every page view, plus new write rules, plus an admin screen to build and secure — all for data that changes monthly. Directly against Principle IV. |
| Firestore document read once per session, cached in Vuex | Still one read per visitor session (large), still needs rules, and adds a loading state to the footer for data that could have been free. |
| Netlify build-time environment variables | Same deploy cadence as a repo file but invisible in review, untestable locally, and not diffable. Strictly worse than a committed module. |

**Consequence for FR-022** (administrator-only, enforced server-side): with the list in
the repository there is *no client write path at all*. Enforcement is repository access.
This is a stronger guarantee than a Firestore rule, not a weaker one — there is nothing
to attack. A reviewer should not go looking for an admin screen; its absence is the
design.

---

## R2 — How the badge resolves to a user

**Decision**: A bundled `Set` of site user ids, looked up synchronously via a
`useSupporters()` composable. No Firestore read, no custom claim, no new document.

**Rationale**: Every surface that names a user already has that user's id in hand:

| Surface | Identifier available |
|---|---|
| `src/components/builds/BuildListCard.vue:97` | `build.authorUid` |
| `src/components/builds/BuildMetaLines.vue:15` | `build.authorUid` |
| `src/components/Comment.vue:79` | `comment.authorId` |
| `src/components/home/TopContributors.vue:13` | `contributor.authorId` |
| `src/components/page/AuthorPageHeader.vue` | contributor doc from `Builds.vue:170` |

So `isSupporter(uid)` answers every case with a set membership test against data already
in the bundle. Nothing is fetched, nothing waits, and a build list of thirty cards costs
exactly zero additional reads.

This also disposes of the constraint recorded in the spec's Assumptions: a Firebase
custom claim cannot drive this badge, because a claim lives in its owner's ID token and
the badge must render for *other* visitors, including signed-out ones holding no token.
The bundle sidesteps that entirely.

**Alternatives considered**:

| Option | Rejected because |
|---|---|
| Public `isSupporter` field on `contributors/{uid}` or `creators/{uid}` | These documents are not loaded when rendering a build list — `BuildListCard` has only the build document. Showing a badge would mean one extra read *per card*, i.e. ~30 reads per list page. This is the "publicly readable document" answer that is right in general and wrong here. |
| Firebase custom claim | Not readable by anyone but its owner. Cannot render for other visitors at all. |
| Denormalising a supporter flag onto every build document | Requires a backfill on every mark and unmark, and goes stale silently. Enormous write cost for a dozen people. |

---

## R3 — Anonymity is by omission, not by a flag

**Decision**: A supporter who does not wish to be named has **no name stored at all** —
the entry carries only the arrangement. There is no `anonymous: true` flag beside a real
name.

**Rationale**: The config ships to the browser. A name marked "do not display" would sit
in the JavaScript bundle in plain text, readable by anyone who opens dev tools, while the
site claimed to be respecting their privacy. That is worse than not offering anonymity.

**The general rule, which this feature had to learn twice**: the bundle is the privacy
boundary, not the rendered page. It was applied to names here and initially *not* applied
to per-person amounts, which were to be stored and simply never displayed — the identical
mistake one field over. Anything that should not be public does not go in the
configuration at all. See R4 for what that cost.

This satisfies FR-015 (counted but not named) and FR-016 (no blank wall entry) with the
same mechanism, since an entry with no name is simply not rendered on the wall while
still contributing to the total.

---

## R4 — Coverage arithmetic

**Decision**: The goal is stated **per calendar year**. Two deploy-time constants — `year`
and `costPerYearEur` — and a plain sum of what each supporter actually gave that year.

Coverage is `Σ eur`; the supporter count is the number of entries. Neither is stored
(FR-001b), so neither can go stale (FR-008).

**Rationale**: the yearly framing was chosen over monthly for a reason that only became
visible once the real supporter data arrived — every contribution to date is a **one-off
tip**, not a recurring membership. Against a monthly target a past tip contributes nothing,
which forced a three-way plan model where one-off entries counted zero and sat awkwardly
beside a €0 coverage line under seventeen names. Against a yearly target the same tip
genuinely helps pay the year it was given in, and the entire modelling problem dissolves:

- no `plan` field, because how the money arrived stops mattering
- no net-rate constants, because each entry records what actually landed
- no argument about what a coffee is worth against a subscription target

It also matches how the payment provider already presents goals, so the site and the Ko-fi
page tell one story.

**The covered total is stored, not summed — and this is a privacy decision, not a
convenience one.** Deriving it requires a per-person amount, and this configuration is
delivered to every visitor's browser. A per-person figure would therefore be public the
moment it was written down, whether or not any template rendered it; "we never display it"
draws the boundary at the wrong place. The same reasoning that keeps an anonymous
supporter's name out of the file (R3) keeps everyone's amount out of it (FR-001d). The
breakdown stays on the Ko-fi dashboard, which already holds it.

The cost of that is one hand-typed number where there was a derived one. It is bounded
deliberately: `coveredEur` changes in the same edit as the supporter list, triggered by the
same event, so it can lag reality but cannot contradict the names beside it. The
`supporterCount` remains derived from the list, so the count and the wall can never
disagree at all. The staleness the original design feared was a figure with its own update
rhythm that could be forgotten for months — not two adjacent lines changed in one commit.

The total is recorded **net** — read off a payout rather than computed — because fees on a
small charge are a large proportion of it and quoting gross would overstate coverage by
roughly a fifth.

**Cost of the change**: a fresh year resets the total to zero. Handled by naming the year in
every state (FR-004), by making rollover a deliberate act rather than a clock side effect
(FR-013c), and by moving past supporters to a permanent thank-you list so the wall only ever
grows (FR-013d).

**Status**: `costPerYearEur` (~240) and `coveredEur` are **placeholders** pending real
figures. Needed before launch, not before implementation — two numbers, in one block.

---

## R5 — Interaction with the prerendered build pages

**Decision**: None required. No change to `scripts/prerender.mjs`.

**Rationale**: `prerender.mjs` injects **head tags only** — title, description, canonical,
structured data — into the built SPA shell. It does not render the body. The footer,
badges and wall are therefore rendered client-side from the bundle exactly as on any
other page, and there is nothing baked to go stale.

Better: because both the prerendered files and the funding config come from the same
deploy, they cannot disagree by construction. The spec's prerender edge case is satisfied
structurally.

**Hard constraint to carry into implementation**: `prerender.mjs` imports *nothing but
`node:` builtins*, for the Netlify Node 22.1.0 reason documented in its own header and in
`CLAUDE.md`. The funding config module must never be imported there. Since the script has
no reason to touch it, the risk is only that a future contributor "helpfully" wires them
together.

---

## R6 — Where the focus-mode ask renders

**Decision**: In `src/views/builds/BuildDetails.vue`, triggered by the existing
`closeDialog` event. Not inside `FocusMode.vue`.

**Rationale**: FR-029 requires the line never appear inside the detached/floating
picture-in-picture window. `FocusMode.vue:1461` already handles this shape correctly —
`handleClose()` closes the PiP window first, then emits `closeDialog`, which
`BuildDetails.vue:10` handles by setting `focusDialog = false`. Rendering the ask in the
parent means it appears in the page the user has returned to, and *cannot* appear in the
detached window because the detached window is not the parent. The requirement is met by
structure rather than by a condition someone can later get wrong.

**Progress threshold**: `FocusMode` already tracks `currentStepIndex`. The `closeDialog`
emit is extended to carry how far the session reached, so the parent can decide. Keeping
the decision in the parent leaves `FocusMode` ignorant of the ask entirely — it reports a
fact about the session, it does not know what anyone does with it.

**Suppression**: a timestamp in `localStorage`, roughly a month, following the existing
preference-composable pattern (`usePlayTargetPreference.js`, `useThemePreference.js`). No
account required, which matters because most focus-mode users are not signed in.

---

## R7 — Recognising supporters for suppression

**Decision**: Suppress the ask for signed-in users whose uid is in the supporter set
(`store.state.user?.uid`). Accept that unlinked supporters may still see it.

**Rationale**: There is no way to recognise a supporter who never volunteered their
username — that is the whole reason the badge is opt-in. FR-026 already records this and
requires the copy be written so that someone who already supports is not annoyed to read
it. This is a wording obligation, not a technical one.

---

## R8 — Icons

**Decision**: Reuse `mdi-heart` (already used by `Footer.vue:9`) or `mdi-account-star`
(already in the allowlist). Add no new icon.

**Rationale**: `src/plugins/mdiIcons.js` is an explicit tree-shaking allowlist; an icon
missing from it renders as *nothing* — no error, no fallback, a green build. Both
candidates are already present, so this feature carries no icon risk. If a different
glyph is chosen during implementation, it must be added to the allowlist and verified
with the `comm` check in `CLAUDE.md`.

---

## R9 — Account deletion, and a spec correction

**Finding**: `functions/users/deleteUser.js` does not delete or reassign the user's build
orders — deletion cleans up favorites, votes and likes (`accountCleanup.js`), but the
builds remain with their original `authorUid`.

**Consequence**: a deleted supporter's badge would keep rendering on their surviving
builds until the maintainer's next monthly pass removes the entry.

**Decision**: accept the lag and correct the spec. FR-021c as written demands immediate
removal, which would require automation — a deletion trigger writing to a file that lives
in the repository, which is not possible, or moving the whole design to Firestore, which
R1 rejects for good reason. The spec already accepts exactly this lag for lapsed
supporters, so requiring immediacy here alone is inconsistent rather than principled.

**Action taken**: FR-021c amended to permit removal at the next monthly pass, consistent
with the lapsed-supporter edge case. Recorded here rather than silently ignored, per the
project rule that a spec contradicting the implementation is worse than no spec.

---

## R10 — How the footer knows to stay quiet

**Decision**: `Footer.vue` checks the current route name against a short list of pages that
carry their own funding block (home, About, account) and renders nothing on those.

**Rationale**: FR-007 requires exactly one funding status per page, and the footer renders
on all of them. The footer sits *outside* `<router-view>`, so the page cannot pass it a
prop.

A reactive registry — page-level instances calling `register()` on a shared singleton,
footer rendering when the count is zero — is the more "correct" shape and needs no list to
maintain. It was rejected for a concrete reason: mount order is not guaranteed to favour
the page, so the footer can render its line and then retract it a tick later. A visible
flicker on every page load, in service of avoiding a three-line list, is a bad trade.

The route check is synchronous, cannot flicker, and is legible at the call site. Its one
weakness is that a future page adding its own funding block must be added to the list; a
comment at the list says so, and FR-003 names exactly three pages today.

**Alternatives considered**:

| Option | Rejected because |
|---|---|
| Reactive registry via provide/inject or a module singleton | Mount-order flicker, as above. More machinery for a list of three. |
| Footer always renders, pages render nothing | Inverts the fallback: the two pages where someone is most likely to be receptive would get the *least* prominent treatment. |
| Two visual densities coexisting on a page | Explicitly forbidden by FR-007. Two asks on one page is the problem being fixed, not a compromise. |

---

## R11 — The three existing Donate buttons

**Finding**: there are three generic asks today, not one — `Footer.vue:6`,
`News.vue:55` (inside the home sidebar's news card), and `About.vue:153`.

**Decision**: all three are removed. The news card's button in particular must go, because
its card sits in the home sidebar directly beside where the funding status card will
render (FR-007a).

**Rationale**: a bare "Donate" next to a line stating a specific shortfall makes the
specific line read as decoration — the visitor sees two asks and discounts both. The whole
premise of the feature is one ask with a number attached to it.

**Placement note**: the funding status is its own card in the sidebar rather than content
inside `News.vue`. The news card's content is rewritten whenever there is something to
announce; a funding line living inside it would disappear with the next rewrite. A
separate card outlives that.

---

## R12 — Verification approach

**Decision**: `npm run check:setup` after touching any `.vue` file, plus manual browser
checks for anything rendered.

**Rationale**: `CLAUDE.md` is explicit that `npm run build` compiles templates but cannot
catch a `ReferenceError` in `setup()`, which throws at render and blanks the component
behind a green build. The coverage arithmetic is pure and can be unit-checked with a
throwaway harness in the repo root, driven by `@vue/reactivity` if it ends up in a
composable; the rendering, the footer layout on small screens, and the focus-mode timing
need a browser and must be reported as such.

`npm run check:steps` is **not** relevant here — nothing in this feature reads a build
order's `steps`.
