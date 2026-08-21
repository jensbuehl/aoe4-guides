# Implementation Plan: Contributor Spotlight

**Branch**: `037-contributor-spotlight` | **Date**: 2026-08-21 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `.specify/specs/037-contributor-spotlight/spec.md`

## Summary

Give the people who write the site's 4,000 build orders visible credit: a curated spotlight card on
the home page, an author page header worth landing on, and self-maintained public profile fields (a
180-character introduction plus YouTube, Twitch and AoE4World identifiers).

The technical shape follows from one measurement: **`Home.vue` makes exactly one Firestore read**
— `home/home`, pre-generated six-hourly by `updateHomeSnapshot`. Everything else is arranged around
not making a second one.

> Corrected 21.08.2026 (v1.18.0). This said "the home page", which was wrong: `Home.vue` made one
> read, but the *page* made up to three, because `YoutubeGuides` is mounted twice — the mobile and
> desktop sidebars are CSS-hidden duplicates, not `v-if` branches — and each ran its own
> `get("home")` on the same document. The decision below is unaffected and if anything better
> supported; only the figure it cited was. All three callers now share one in-flight promise in
> `homeService.js`, behind a six-hour TTL, so the page makes one read cold and none inside the TTL. That single constraint decides where the nomination lives (a constant in
the Cloud Function, because a `src/config/` module is unreachable from CommonJS `functions/`), how
the featured contributor's details reach the page (hydrated into the snapshot at generation time,
so a contributor at rank 20 costs the page nothing), and how the author page knows someone's rank (a
field written onto the contributor document, because that page already fetches it).

The profile fields go on `contributors/{uid}`, which is publicly readable — not on `users/{uid}`,
whose rule restricts reads to the owner. They therefore ride into the home snapshot for free,
because `updateHomeSnapshot` spreads the whole contributor document.

Three things ship in priority order: the spotlight card (P1), the author page header (P2), and the
profile editing with its rules and its account-deletion cleanup (P3). The first two work with data
the site already holds, so the surfaces are proven before user-supplied text reaches them.

## Technical Context

**Language/Version**: JavaScript (ES2022) in `src/` (Vue 3 Options API with `setup()`); CommonJS,
Node 22 in `functions/`. The two do not share modules — see research R1.

**Primary Dependencies**: Vue 3, Vuetify 3, Vuex, Vue Router, firebase-admin in functions.
**No new dependency.**

**Storage**: Two new optional fields on the existing `contributors/{uid}` document (`bio`,
`youtube`), one derived field (`rank`), and one new field on the existing `home/home` document
(`featuredContributor`). **No new collection.**

**Testing**: No formal suite (constitution). `npm run build`; `npm run check:setup` after any `.vue`
change; the `mdiIcons.js` allowlist check from `CLAUDE.md`; a throwaway `@vue/reactivity` harness in
the repo root for the bio normaliser, the identifier validator and the URL builder. Rules changes
verified against the emulator or by direct console write — a passing form proves nothing about
FR-020, FR-024 or SC-007, which are claims about the server.

**Target Platform**: Web — Vue SPA on Netlify, phone through desktop, light and dark.

**Project Type**: Single frontend project plus Firebase Functions. Both are touched.

**Performance Goals**: **Zero additional Firestore reads on the home page and on the author page.**
Backend cost is bounded at two extra reads and at most ~16 writes per scheduled run (four runs a
day).

**Constraints**:
- The spotlight and the event banner must never both render; the event banner already hides itself
  on a date it owns privately, so that decision must be extracted before either can be honoured.
- The stored channel value must be incapable of expressing a host — the outbound link is built by
  the site, never stored (FR-023, SC-008).
- The bio reaches the home page, where there is no moderation workflow. Curation is the control.
- `functions/` cannot import from `src/`, and vice versa. Anything both need is duplicated
  deliberately or not shared at all.
- The character allowance shown in the form and the limit enforced by the rule must be the same
  measure — they are computed by different engines and can disagree on emoji (R11).
- No surface may render a contributor without a display name; the new `create` clause makes such a
  record reachable for the first time (R10).

**Scale/Scope**: One spotlight at a time; eight ranked contributors; two new profile fields. Two new
components, one new composable, one new config module, three modified components, one modified Cloud
Function, one modified auth trigger, one rules change.

## Constitution Check

*GATE: passed before Phase 0, re-checked after Phase 1 design. No violations.*

### I. Simplicity First

**Pass.** No new dependency, no new collection, no new service. The nomination is a string constant.
The spotlight is one component; the author header is an edit to the component that already exists.

One abstraction is introduced — `src/config/event.js`, extracted from `EventBanner.vue` — and it
clears the YAGNI bar because it has a second consumer on arrival (`Home.vue`), which is exactly the
"duplication has appeared twice" trigger the principle names.

The rank field (R2) is the one place where a simpler option existed — omitting the badge. It is kept
because the field costs ~32 writes a day and removes an entire class of "where do I get the ranking
from" question. Noted here rather than in Complexity Tracking because it adds a field, not a layer.

### II. Incremental Quality

**Pass.** Two pre-existing weaknesses are corrected rather than worked around:

- `EventBanner.vue` owns dates that `Home.vue` needs. Extracted (R3), not duplicated.
- `deleteUser.js` keeps the contributor document for attribution — correct when it held a name and
  two counters, insufficient once it holds personal text. Amended (R4) rather than left for the
  first person who deletes their account to discover.

### III. Consistent UX & Component Reuse

**Pass.** The spotlight and the author header share one presentational component; the spec (FR-018)
requires them to look like one design, so building two would violate both the spec and the
principle. Both compose from Vuetify primitives and the existing `UserAvatar`. No new colour is
defined — the `--hero-*` tokens in `src/assets/base.css` already cover both themes.

### IV. Cost-Conscious Infrastructure

**Pass, and this is the principle the design is shaped by.** Client-side reads are unchanged: home
stays at one, the author page stays at what it already made. Backend cost is two reads and up to
sixteen writes per run, four runs a day — inside the free tier by three orders of magnitude.

### V. Secure Defaults

**Pass.** The two writable fields are constrained in `firestore.rules`, not only in the form: length
for the bio, an anchored pattern for the channel, ownership for both. The rule is the boundary
because the form is not one. The outbound link is constructed by the site from a value that cannot
contain a host. Rendering is ordinary interpolation, never `v-html`. Nothing added is secret — every
new field is public by intent, which is the correct reading of the `src/`-is-public rule rather than
an exception to it.

## Project Structure

### Documentation (this feature)

```text
.specify/specs/037-contributor-spotlight/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 output — R1..R9
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output — how to rotate the spotlight
├── contracts/
│   ├── contributor-fields.md    # Document shape + rules contract
│   └── home-snapshot.md         # Snapshot shape the client may rely on
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 output (/speckit-tasks — NOT created here)
```

### Source Code (repository root)

```text
src/
├── assets/
│   └── base.css                          # unchanged — --hero-* tokens already defined
├── components/
│   ├── common/
│   │   └── UserAvatar.vue                # unchanged — initials/icon fallback already correct
│   ├── home/
│   │   ├── EventBanner.vue               # MODIFIED — constants move to config/event.js
│   │   ├── ContributorSpotlight.vue      # NEW — the home hero
│   │   └── TopContributors.vue           # UNCHANGED, deliberately (FR-027)
│   └── page/
│       ├── AuthorPageHeader.vue          # MODIFIED — bio, channel, rank
│       └── ContributorIdentity.vue       # NEW — shared body of both surfaces
├── composables/
│   ├── data/
│   │   ├── contributorService.js         # MODIFIED — update profile fields
│   │   └── homeService.js                # unchanged
│   └── useContributorProfile.js          # NEW — normalise, validate, build channel URL
├── config/
│   └── event.js                          # NEW — extracted from EventBanner.vue
├── views/
│   ├── Home.vue                          # MODIFIED — render spotlight when no event
│   ├── account/
│   │   └── Account.vue                   # MODIFIED — "Public profile" card
│   └── builds/
│       └── Builds.vue                    # UNCHANGED — it already fetches the contributor
│                                         #   document and passes it whole; rank rides along
└── plugins/
    └── mdiIcons.js                       # verify only — needed icons already present

functions/
├── builds/
│   └── updateHomeSnapshot.js             # MODIFIED — FEATURED_CONTRIBUTOR, hydrate, rank
└── users/
    └── deleteUser.js                     # MODIFIED — clear the profile fields on deletion

firestore.rules                           # MODIFIED — owner may write bio + links, validated
```

**Structure Decision**: the existing layout is used unchanged. Two new components, one new
composable and one new config module, all in directories that already hold their kind. The one
judgement call is `ContributorIdentity.vue` under `components/page/` — it is shared by a home
component and a page header, and `page/` is where the header already lives.

## Phase-by-phase delivery

Ordered to match the spec's user story priorities, each independently shippable.

### P1 — Spotlight on the home page

1. Extract `src/config/event.js` from `EventBanner.vue` (R3); `EventBanner` imports it and renders
   identically.
2. Add `FEATURED_CONTRIBUTOR` to `updateHomeSnapshot.js`, hydrate `featuredContributor` into
   `home/home`, writing `null` when unset or not found.
3. Build `ContributorIdentity.vue` (avatar, name, bio, stat chips, channel link) and
   `ContributorSpotlight.vue` (the wash, the eyebrow, the call to action) on top of it.
4. `Home.vue` renders the spotlight in the event slot when `!isEventLive()` and a featured
   contributor is present.

Ships without any profile field: the card shows name, avatar and counts. Bio and channel appear
later, without further work here.

### P2 — Author page header

5. `updateHomeSnapshot.js` writes and clears `rank` on contributor documents (R2).
6. `AuthorPageHeader.vue` adopts `ContributorIdentity.vue`, gaining bio, channel and the rank chip.

### P3 — Self-maintained profile

7. `useContributorProfile.js`: whitespace normalisation, the anchored identifier pattern, the URL
   builder, the recognised-channel lookup against `featuredCreatorDefaultProvider`.
8. `contributorService.js`: write the two fields, using `deleteField()` when cleared.
9. `firestore.rules`: extend the owner `update` clause with the validation from R7, and add the
   `create` clause from R10 so a contributor whose record never got made can still save one.
10. `Account.vue`: the "Public profile" card, with a live character counter and a statement of where
    the values appear (FR-025). **Measure how Firestore `size()` counts before fixing the counter**
    (R11) — the counter must agree with the rule for emoji, or the form promises a length the server
    refuses.
11. `deleteUser.js`: clear `bio` and every link field on account deletion (R4, FR-029).

**Deploy note**: steps 2, 5 and 11 are Cloud Function changes and require
`npm --prefix functions run deploy`. Step 9 requires `firebase deploy --only firestore:rules`.
Neither is covered by the Netlify push that deploys the frontend — see quickstart.

## Complexity Tracking

> No constitution violations. Table intentionally empty.
