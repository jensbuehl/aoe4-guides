# Implementation Plan: Reorder Steps and Notes

**Branch**: `029-step-reordering` | **Date**: 2026-08-10 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `.specify/specs/029-step-reordering/spec.md`

## Summary

Let an author move an existing step or note somewhere else in a build: by dragging a row on
desktop, by pressing up/down on a phone, and by arrow keys from the keyboard — across section
boundaries, and into or out of an alternatives path.

The technical approach in one line: **the editor already has every address this feature needs,
so almost nothing new is stored, computed or drawn.** The insert lines between rows are the
drop positions; the position above a merge line and the position below it already mean
"inside" and "outside"; and 027 made path membership positional, so moving a step into an
alternative is the same splice as moving it up two rows.

One thing genuinely is new. Each section editor builds its working list once at mount and
nothing re-syncs it, so two sections cannot exchange a row today. That gets a small coordinator
—`useStepReorder()`, provided by the parent, injected by each section — modelled on the
`useStepHighlight` channel already in the codebase. All the risk in this feature is there,
which is why cross-section moves are sequenced last.

## Technical Context

**Language/Version**: JavaScript (ES2022), Vue 3 Options API with `setup()`

**Primary Dependencies**: Vue 3, Vuetify 3, `scroll-into-view-if-needed` (already present).
**No new dependency** — a sortable library was evaluated and rejected (research R-1)

**Storage**: Cloud Firestore — **unchanged**. No field added, no migration, no rule change

**Testing**: Manual golden path per [quickstart.md](./quickstart.md); `npm run check:setup`
and `npm run check:steps` as static gates; a throwaway `@vue/reactivity` harness for the move
arithmetic

**Target Platform**: Browser — desktop (pointer) and mobile (390px baseline)

**Project Type**: Vue 3 SPA (frontend only; no backend work in this feature)

**Performance Goals**: Drag tracking at frame rate on a build of ~60 steps; a discrete move is
one splice and a re-render, not a rebuild of the section

**Constraints**: The row must not grow (SC-008); no new colour, icon family or component
vocabulary; the reading view gains nothing; reduced motion respected

**Scale/Scope**: Editor only. Two components changed, one composable added. Realistic builds
are 4–8 sections, 30–60 entries, 0–2 alternatives blocks

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Assessment |
|---|---|
| **I. Simplicity First** | **Pass.** No new dependency: SortableJS was evaluated and rejected because the list interleaves marker rows and insert rows it would have to be configured around, and because the drop targets already exist (R-1, R-2). The new abstraction — one coordinator composable — is introduced because a concrete need appeared, not in anticipation. |
| **II. Incremental Quality** | **Pass, and it pays a debt.** The `_id` collision (R-6) is a latent bug found while planning; fixing the counter removes the class rather than patching the path this feature happens to take. Sequenced as its own phase so it lands as an atomic commit. |
| **III. Consistent UX & Component Reuse** | **Pass.** The drop indicator reuses the insert lines already rendered; the handle joins the hover-reveal pattern `.row-x` already uses; scrolling reuses the existing `scroll-into-view-if-needed` call with its existing reduced-motion handling. Controls are Vuetify `v-btn`s. Logic lives in a composable, not in a page template. |
| **IV. Cost-Conscious Infrastructure** | **Pass, trivially.** Client-only. No read, no write, no function, no query. Reordering changes what a save contains, never how many saves happen. |
| **V. Secure Defaults** | **Pass.** No schema change, so the rule review is a confirmation rather than a change. No new field reaches Firestore; a reordered build is the same document shape it was. Ownership of the build is already enforced on save and this feature adds no new write path. |

**Gate result: PASS.** No violations, so Complexity Tracking is omitted.

**Re-check after Phase 1 design: PASS.** The design added one composable and no dependency;
nothing in `data-model.md` or `contracts/` introduced storage, cost or a security surface. The
one thing worth flagging to Principle II is recorded below rather than hidden: R-4 accepts two
emits per cross-section move, which is correct only while saving is manual. The condition is
written into the research so the assumption cannot rot silently.

## Project Structure

### Documentation (this feature)

```text
.specify/specs/029-step-reordering/
├── spec.md              # The feature specification
├── plan.md              # This file
├── research.md          # Phase 0 — nine decisions
├── data-model.md        # Phase 1 — in-memory model; nothing persisted
├── quickstart.md        # Phase 1 — the manual test script, gated per phase
├── checklists/
│   └── requirements.md  # Spec quality validation
├── contracts/
│   └── use-step-reorder.md
└── tasks.md             # Phase 2 output (/speckit-tasks — NOT created here)
```

### Source Code (repository root)

```text
src/
├── composables/builds/
│   ├── useStepReorder.js          # NEW — the cross-section coordinator
│   ├── alternativesDraft.js       # unchanged — supplies the positional model
│   └── useAgeTimings.js           # unchanged — flattenSections / sectionOffsets
└── components/builds/
    ├── BuildOrderEditor.vue       # provides the coordinator; already holds section refs
    └── BuildOrderSectionEditor.vue# registers with it; handle, drop targets, move controls
```

**Structure Decision**: No new directory and no new component. The work lands in the two
components that already own the editor's rows, plus one composable beside the six build
composables already there. A separate `StepDragHandle.vue` was considered and rejected: it
would be a `v-btn` with an icon and a `pointerdown` handler, used twice in one file, which is
the abstraction Principle I asks to wait for.

## Implementation Phases

Sequenced so each phase is independently verifiable and the risk lands last. Phase gates are
the sections of [quickstart.md](./quickstart.md).

| Phase | Work | Story | Why here |
|---|---|---|---|
| **0** | Module-level `_id` counter | — | Prerequisite for Phase 4. Atomic, no behaviour change |
| **1** | `useStepReorder()`; drag handle, hit-testing, drop indicator; within-section moves | US1 | The MVP. Establishes the whole mechanism inside one section |
| **2** | Mobile up/down controls | US2 | Reuses Phase 1's `moveBy`; only the surface is new |
| **3** | Into/out of alternatives | US3 | Free at the data level — verification, not implementation |
| **4** | Cross-section moves | US4 | The one part with real machinery. All the risk |
| **5** | Arrow keys on the handle | US5 | Small, once `moveBy` exists |

Phase 3 is deliberately a *verification* phase. Nothing in it should need new code: if moving a
step across a merge line requires a special case, the positional model has been broken
somewhere in Phase 1 and that is what the phase has found.

## Key Risks

| Risk | Mitigation |
|---|---|
| Typed text lands on the wrong row | `syncEdits()` before every splice, on **every** touched section (R-5). Quickstart items 7, 17 test it directly |
| `_id` collision after a cross-section move | Phase 0, before any entry can cross (R-6) |
| Index-derived readings address the wrong entry | FR-016; everything reached through `flattenSections`/`sectionOffsets`/`forEachStep`, enforced by `npm run check:steps`. Quickstart 42–43 |
| A drag started inside a description field | Handle-only initiation (FR-004). Quickstart item 6 |
| Two emits leave an inconsistent build | Safe only because saving is manual — condition recorded in R-4 |
| Green build hiding a `setup()` error | `npm run check:setup` after every `.vue` change; rendering and interaction verified in a browser, never claimed from a build |

## Complexity Tracking

No constitution violations. Section intentionally empty.
