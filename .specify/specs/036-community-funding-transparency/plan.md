# Implementation Plan: Community Funding Transparency

**Branch**: `036-community-funding-transparency` | **Date**: 2026-08-13 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `.specify/specs/036-community-funding-transparency/spec.md`

## Summary

Replace the footer's generic "Donate" button with a finite, believable goal — what the
site costs to run and how far the community has covered it — and give supporters visible
recognition. Full coverage is roughly thirteen supporters at €2/month, so the whole
design is sized for a dozen people, not for scale.

The technical approach follows from one observation: **the funding line lives in the
footer, so it renders on every page**. That rules out fetching it. Everything — the
constants, the supporter list, the badge lookup — is a module bundled with the app,
costing zero Firestore reads, needing no security rule, no admin screen, and no
caching layer. The monthly routine is editing one file and pushing it.

Four things ship in priority order: the funding status (home sidebar, About, account, and
the footer as the fallback everywhere else) with a monthly/annual ask; the supporters wall
on About; an opt-in supporter badge wherever the site names a user; and a quiet supporter
line when a focus-mode session ends.

The primary placement is the **home sidebar**, not the footer. Home is where the traffic
is and the footer is below everything; the footer instance exists so that no other page is
left without one. The two never appear together, and the three generic "Donate" buttons
that exist today — footer, news card, About — are replaced rather than supplemented.

## Technical Context

**Language/Version**: JavaScript (ES2022), Vue 3 Options API with `setup()`, Node 22.x

**Primary Dependencies**: Vue 3, Vuetify 3, Vuex, Vue Router. **No new dependency.**

**Storage**: None added. Feature data is a bundled module (`src/config/supporters.js`).
No Firestore collection, no field on any existing document, no security-rule change.

**Testing**: No formal suite (per constitution). `npm run check:setup` after any `.vue`
change; `npm run build`; a throwaway `@vue/reactivity` harness in the repo root for the
coverage arithmetic if it lands in a composable; browser checks for anything rendered.

**Target Platform**: Web — Vue SPA on Netlify, phone through desktop, light and dark.

**Project Type**: Single frontend project. No backend work in this feature.

**Performance Goals**: **Zero additional Firestore reads on any page.** No additional
network request of any kind. The funding line must render synchronously with no loading
state — a footer that flickers on every page load would be worse than the button it
replaces.

**Constraints**: Footer must not overflow horizontally at phone width. Badge lookup runs
once per rendered card and per comment, so it must be a set membership test, not a scan
of a fetched collection. `scripts/prerender.mjs` must never import the config module.

**Scale/Scope**: ~13 supporter entries. Five components touched for the badge, three
placements for the funding line, one new composable, one new config module.

## Constitution Check

*GATE: passed before Phase 0, re-checked after Phase 1 design. No violations.*

| Principle | Assessment |
|---|---|
| **I. Simplicity First** | Passes, and drove the design. No new dependency, no new collection, no admin UI, no payment integration. The rejected alternatives were all more machinery for the same outcome. The badge is deliberately separable (FR-021d) so the most speculative part can be deleted without disturbing the rest. |
| **II. Incremental Quality** | Passes. The funding line is a shared component used in all three placements rather than three copies of the same markup — required by Principle III and by the need for the empty/partial/covered readings not to drift apart. |
| **III. Consistent UX & Component Reuse** | Passes. Vuetify components throughout. The badge appears on five surfaces and is therefore one component, not five inline chips. It reuses `mdi-heart` or `mdi-account-star`, both already in the icon allowlist. |
| **IV. Cost-Conscious Infrastructure** | Passes, decisively. This is the principle that chose the storage. A Firestore-backed footer line would add a read per page view — millions a month — so the feature meant to cover ~€20/month would have increased it. Bundled config costs nothing at runtime. |
| **V. Secure Defaults** | Passes. No new client write path exists, so there is nothing to guard: the list changes by commit only (FR-022), which is a stronger guarantee than a rule. No credentials or personal data are introduced — the only personal data is a name the supporter chose to make public, and anonymity is implemented by *omitting* the name so nothing private reaches the bundle. |

**Post-design re-check**: unchanged. The Phase 1 design added no dependency, no
collection, no rule and no server component.

## Project Structure

### Documentation (this feature)

```text
.specify/specs/036-community-funding-transparency/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0 — R1..R12, all decisions with alternatives
├── data-model.md        # Phase 1 — entities, derivations, what is absent
├── quickstart.md        # Phase 1 — the maintainer's monthly routine
├── contracts/
│   └── supporters-config.md   # Phase 1 — config shape + composable contract
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 output (/speckit-tasks — NOT created here)
```

### Source Code (repository root)

```text
src/
├── config/
│   └── supporters.js               # NEW — funding constants + supporter list
├── composables/
│   └── useFunding.js               # NEW — derived status + isSupporter()
├── components/
│   ├── common/
│   │   ├── FundingStatus.vue       # NEW — the status, three display states,
│   │   │                           #       compact (footer) and full (card) variants
│   │   └── SupporterBadge.vue      # NEW — the badge + its explanation
│   ├── Footer.vue                  # EDIT — Donate button out, status in (suppressed
│   │                               #        on pages carrying their own)
│   ├── Comment.vue                 # EDIT — badge beside comment.authorId
│   ├── builds/
│   │   ├── BuildListCard.vue       # EDIT — badge beside build.authorUid
│   │   └── BuildMetaLines.vue      # EDIT — badge beside build.authorUid
│   ├── home/
│   │   └── TopContributors.vue     # EDIT — badge beside contributor.authorId
│   ├── notifications/
│   │   └── News.vue                # EDIT — remove its Donate button (FR-007a)
│   └── page/
│       └── AuthorPageHeader.vue    # EDIT — badge beside contributor
└── views/
    ├── Home.vue                    # EDIT — status card in BOTH sidebar positions
    ├── About.vue                   # EDIT — status replaces donation paragraph,
    │                               #        plus supporters wall
    ├── account/Account.vue         # EDIT — status card, once
    └── builds/BuildDetails.vue     # EDIT — the ask on closeDialog
```

Plus one small change to `src/components/builds/FocusMode.vue`: extend the existing
`closeDialog` emit to report how far the session got. It stays ignorant of the ask.

**Structure Decision**: The existing layout is followed exactly — shared components in
`src/components/common/`, logic in `src/composables/`, page assembly in `src/views/`, per
Principle III. `src/config/` is new but matches the precedent already set by the
hand-maintained `contributors` array in `src/views/About.vue:315`; putting it in its own
module rather than inline is what lets the footer, About and the account page share one
source.

## Implementation Order

Each stage is independently shippable, matching the spec's user-story priorities.

1. **US1 (P1) — the funding status.** Config module, `useFunding()`, `FundingStatus.vue`,
   wired into the home sidebar (both positions), `About.vue`, `Account.vue` and
   `Footer.vue`, with the monthly/annual ask. Removes the three existing Donate buttons.
   Delivers the entire hypothesis on its own. The home placement is the part that carries
   the volume — shipping the footer alone would mostly reproduce today's invisibility.
2. **US3 (P2) — the supporters wall.** Renders this year's and earlier years' supporters
   on About. Small, and
   needs no identity mapping.
3. **US2 (P2) — the maintainer routine.** Mostly documentation
   ([quickstart.md](quickstart.md)); its acceptance criteria are satisfied by the design
   of stages 1 and 2 rather than by code.
4. **US4 (P3) — the badge.** `SupporterBadge.vue` plus five call sites. Separable by
   FR-021d: if it proves a nuisance, deleting this stage leaves everything else intact.
5. **US5 (P3) — the focus-mode ask.** `FocusMode` emit extension, suppression in
   `localStorage`, rendered by `BuildDetails`.

## Risks

| Risk | Handling |
|---|---|
| Placeholder figures ship to production | The three constants are placeholders until real payout numbers arrive. Launch is gated on them; implementation is not. |
| The home card is added to one of two positions | `Home.vue` renders its sidebar stack **twice** — desktop at line 29, a duplicated mobile stack at line 20. They are separate elements, not one responsive component, so adding the card to one is a silent half-fix that looks correct on whichever device you happen to test. Check both widths (FR-003a). |
| Footer status and a page's own status both render | The suppression rule (FR-007) is the only coordination in the feature. Verify on home, About and the account page specifically — the three pages that carry their own. |
| Copy makes an unlinked supporter feel nagged | FR-026 accepts that unlinked supporters may see the focus-mode ask. This is a wording obligation on stage 5 — write it so it reads acceptably to someone who already pays. |
| A future contributor wires the config into `prerender.mjs` | That script may import nothing but `node:` builtins or the Netlify deploy dies at module instantiation. Noted in the contract, in research R5, and already in `CLAUDE.md`. |
| A new icon is chosen and renders as nothing | Both candidate icons are already in `src/plugins/mdiIcons.js`. Any substitute must be added and verified with the `comm` check in `CLAUDE.md`. |
| Badge persists briefly after an account deletion | Accepted and reconciled — see research R9; FR-021c amended to permit removal at the next monthly pass, consistent with the lag already accepted for lapsed supporters. |

## Complexity Tracking

No constitution violations. Table intentionally empty.
