# Implementation Plan: Unlisted Builds, Earned by Sharing

**Branch**: `038-unlisted-builds` | **Date**: 2026-11-04 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `.specify/specs/039-unlisted-builds/spec.md`

## Summary

Replace the flat 10-draft cap with an allowance earned by publishing, `min(50, 10 + ⌊published ÷ 2⌋)`.
Check it on every save that adds an unlisted build, including published → unlisted, which today
isn't checked at all. In every user-facing place, call the state **Unlisted** and say that the link
still works. Mark unlisted build pages `noindex`.

It all happens in the client, in five files plus one new import-free module. The stored data doesn't
change: `isDraft` keeps its name and meaning for every other reader (public API, RTS Overlay, home and
SEO snapshots).

## Technical Context

**Language/Version**: JavaScript (ES modules), Vue 3 Options-API `setup()` components

**Primary Dependencies**: Vuetify 3, Firebase JS SDK (Firestore `getCountFromServer`), `@mdi/js` via the
`src/plugins/mdiIcons.js` allowlist

**Storage**: Cloud Firestore `builds` collection. Read only (two count aggregations); no schema, rule or
index change

**Testing**: no suite (constitution). Node harness for the pure rule, `npm run check:setup`, icon
`comm` check, manual golden path against `aoe4-guides-dev`, `ux-gate` for the badge

**Target Platform**: the web SPA on Netlify; phones (360–430px) and desktop

**Project Type**: web application (frontend only for this change)

**Performance Goals**: the guarded save adds one round trip. The two counts run in parallel, so it's
no slower than today's single count from the author's point of view (SC-004)

**Constraints**: two Firestore reads per guarded save and none anywhere else (constitution IV);
no server-side enforcement (FR-017)

**Scale/Scope**: 4 copy sites, 4 badge sites, 1 guard, 1 head tag, 1 icon swap

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Check | Result |
|---|---|---|
| I. Simplicity First | One new 20-line module, justified by testability and keeping the message in step with the rule (R1). The robots tag is inline, not a composable, because it has one use (R4). No dependency. | ✅ |
| II. Incremental Quality | Removes the magic `10` that was duplicated between the rule and the message. Closes the published → unlisted bypass. A comment at the guard documents the draft/unlisted naming split. | ✅ |
| III. Consistent UX | Badges keep their Vuetify `v-chip` colour, size and placement; only label and icon change. Snackbars use the existing `showSnackbar`. | ✅ |
| IV. Cost-Conscious | +1 count aggregation, only on a guarded save (≈1 read). Nothing on page views. Edge-header alternative rejected for costing a read per request (R4). | ✅ |
| V. Secure Defaults | No rule change. The rename *improves* the security posture: it stops implying privacy the rules never gave. FR-016 keeps by-link reads as they are, deliberately. | ✅ |

Post-design re-check: unchanged, all pass. No Complexity Tracking entries.

## Project Structure

### Documentation (this feature)

```text
.specify/specs/039-unlisted-builds/
├── spec.md
├── plan.md                         # this file
├── research.md                     # R1–R7: rule location, counts, guarded saves, noindex, icon, naming, copy
├── data-model.md                   # no stored change; state transitions; allowance table
├── quickstart.md                   # harness, static checks, dev-project walk-through, ux-gate
├── contracts/
│   ├── unlisted-allowance.md       # module API, required results, call site
│   └── ui-copy.md                  # every string, before → after
└── checklists/requirements.md
```

### Source Code (repository root)

```text
src/
├── composables/builds/
│   └── unlistedAllowance.js        # NEW: constants, unlistedAllowance(), unlistedLimitMessage()
├── views/builds/
│   ├── BuildEditor.vue             # handleDraft guard (new + published→unlisted), menu label/tooltip
│   └── BuildDetails.vue            # Publish tooltip + snackbar; robots noindex watch + unmount cleanup
├── components/builds/
│   ├── BuildHeader.vue             # badge ×2: Unlisted, mdi-link-variant
│   └── BuildListCard.vue           # badge ×2: Unlisted, mdi-link-variant
└── plugins/
    └── mdiIcons.js                 # + mdi-link-variant, − mdi-pencil-circle
```

**Structure Decision**: a single frontend project. All changes stay in the existing `src/` layout.
The new module goes in `composables/builds/` next to the other build-domain logic. `aoe4-guides-api`,
`functions/`, `scripts/` and `firestore.rules` are deliberately untouched (FR-013, R6).

## Delivery order

Each step can ship on its own, matching the spec's priorities:

1. **P1, allowance**: `unlistedAllowance.js` + harness → `BuildEditor.handleDraft` guard.
2. **P2, rename**: copy in `BuildEditor`/`BuildDetails`, badges, icon allowlist → `ux-gate`.
3. **P3, noindex**: `BuildDetails` watch + cleanup → quickstart §4.

## Complexity Tracking

None.
