---

description: "Task list for 026-age-up-band"
---

# Tasks: Age-Up Band — Drawing the Transition as a Span

**Input**: Design documents from `.specify/specs/026-age-up-band/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md),
[data-model.md](./data-model.md), [contracts/age-segments.md](./contracts/age-segments.md),
[quickstart.md](./quickstart.md)

**Tests**: No automated test tasks. This project has no test suite; the constitution requires manual
golden-path verification instead, so verification tasks reference numbered
[quickstart.md](./quickstart.md) items rather than test files.

**Organization**: Grouped by user story. The four stories collapse into **three commits** —
see [Implementation Strategy](#implementation-strategy) and the merge rule below.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1…US4)
- Include exact file paths in descriptions

## Path Conventions

Single-page web application, single project. All source under `src/` at the repository root, per
[plan.md](./plan.md#source-code-repository-root). **Two source files are touched in total.**

## Merge rule *(lifted 2026-08-07)*

The original rule held Phases 3–5 together, because drawing every band identically put a worked-out
duration on screen as a drawn width — the thing US2 existed to prevent. **US2 has since been
withdrawn**: every band is striped and provenance stays on the crest, so drawing them identically is
now the intended behaviour rather than the hazard. Phases 3 and 4 are the feature.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Fix what this feature is verified against. There is no project initialisation — the
app, the toolchain and every dependency this feature uses are already in place, and this feature
adds none.

- [ ] T001 Pick four real builds matching shapes B1 (fully stamped, age-up sections on every age), B2 (sparsely stamped, times derived), B3 (age-up section on one age but not another), B4 (no age-up sections at all) and record their IDs in the fixtures table in `.specify/specs/026-age-up-band/quickstart.md`
- [ ] T002 Find or construct B5 — a build that ages up twice in quick succession, so two bands touch — by editing a local copy's timestamps if no real build has the shape, and record it in the same table in `.specify/specs/026-age-up-band/quickstart.md`
- [ ] T003 [P] Find a build with a **zero-duration** click-up (the age-up section and the age section carry the same timestamp) and record it as B6 in `.specify/specs/026-age-up-band/quickstart.md`; if none exists, construct one locally — this is the fixture for research R-5
- [ ] T004 [P] Start `npm run serve` per the run steps in `.specify/specs/026-age-up-band/quickstart.md`, open B1 at ≥ 960 px, and capture baseline screenshots of the Timeline card in **both** themes from `main`; capture B4 the same way — every later comparison is made against these

**Checkpoint**: Verification targets fixed. B6 matters most: it is the fixture that distinguishes a
correct admission rule from `if (age.clickUp)`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Lift the four ramp hexes into CSS custom properties, so the band has no colour literal
of its own and FR-005 becomes checkable rather than asserted (research R-8).

**⚠️ CRITICAL**: No user story work can begin until this phase is complete. Phase 5's hatch is built
from these properties, and Phase 3 would otherwise write band literals that this phase deletes.

**This phase is behaviour-neutral and is its own `refactor:` commit.** The composable is not touched.

- [X] T005 Declare `--age-1: #3d516b; --age-2: #6d7fa6; --age-3: #b99a4e; --age-4: #e7c05e;` on the `.age-track` rule in `src/components/builds/AgeTimeline.vue`, taking the values verbatim from the existing `.age-seg-1…4` rules at lines 441-452
- [X] T006 Replace the three `.v-theme--customLightTheme .age-seg-*` overrides at `src/components/builds/AgeTimeline.vue:454-467` with a single `.v-theme--customLightTheme .age-track` block redeclaring all four properties — `--age-1: #a9b2c2; --age-2: #6d7fa6; --age-3: #294790; --age-4: #ccaa55;` — carrying over the comment that explains why Imperial is stated literally rather than reading the accent token
- [X] T007 Rewrite `.age-seg-1…4` in `src/components/builds/AgeTimeline.vue` to read `background: var(--age-N)`, keeping the existing comment about the bespoke four-step ramp and extending it to say the properties are the single declaration point
- [ ] T008 Verify **no visual change** from T005–T007: B1 renders pixel-identical to the T004 baseline in both themes, and `git diff src/composables/` is empty — quickstart items 1–3 (`refactor:` commit boundary)

**Checkpoint**: One place each ramp hex is written, both themes. A band can now be derived from the
ramp instead of restating it.

---

## Phase 3: User Story 1 - See how long an age-up took without hovering (Priority: P1) 🎯

**Goal**: Each transition is drawn as a band on the track spanning click-up → arrival, its width its
duration, in the colour of the age it leads into.

**Independent Test**: Open B1 at ≥ 960 px. A lighter band precedes each crest; the widest band is
the longest age-up. Quickstart items 4–7, 11–13.

- [X] T009 [US1] Rewrite `getAgeSegments(ages, scaleSeconds)` in `src/composables/builds/useAgeTimings.js` to build one ordered run list cut from `[0, scaleSeconds]` — for each age emit an age run then, where admissible, a band run, followed by the existing trailing run — so the widths sum to 100% by construction rather than by arithmetic (research R-1, invariants I-1/I-2)
- [X] T010 [US1] Key the runs per [data-model.md §2](./data-model.md#2-track-run-the-one-new-shape) in `src/composables/builds/useAgeTimings.js`: age runs keep `age-seg-${n}` **byte for byte**, bands get `age-band-${i + 2}` — the index of the age run they lead into, so band and segment share a ramp step and cannot drift (research R-4)
- [~] T011 [US1] ~~Set `estimated` on each band run~~ — **WITHDRAWN with US2.** Implemented, then removed: a run is exactly `{ key, width }` and no provenance reaches the track (`src/composables/builds/useAgeTimings.js`)
- [X] T012 [US1] Update the `getAgeSegments` JSDoc in `src/composables/builds/useAgeTimings.js` to describe both run kinds, the positional (not age-numbered) index, and why bands say nothing about provenance
- [X] T013 [US1] ~~Add the modifier class to the track loop~~ — **no change needed.** Added, then reverted with US2: the existing binding in `src/components/builds/AgeTimeline.vue:30-35` already renders a band correctly, since a band is just a run whose `key` names a different class
- [X] T014 [US1] Add `.age-band-2`, `.age-band-3` and `.age-band-4` to `src/components/builds/AgeTimeline.vue`, each pointing `--band` at its ramp step, with one shared striped `repeating-linear-gradient` rule over `rgba(var(--band), …)` — no `color-mix` and therefore no fallback; no `.age-band-1`, nothing leads into Dark
- [X] T015 [US1] Comment the band rules in `src/components/builds/AgeTimeline.vue` to record that the band takes the **incoming** age's colour to read forward to the crest, and that this knowingly colours the track with an age the player does not hold yet (spec A-4)
- [ ] T016 [US1] Verify bands are drawn, proportional, textless and distinct from the segment they lead into on B1 — items 4–7 in `.specify/specs/026-age-up-band/quickstart.md`
- [ ] T017 [US1] Verify the run widths sum to 100% in devtools on every fixture, and that the shortest real age-up on the site is visible without being widened — items 11, 13 in `.specify/specs/026-age-up-band/quickstart.md` (FR-007, FR-008, SC-004)
- [ ] T018 [US1] Verify two touching bands stay separable on B5 — item 8 in `.specify/specs/026-age-up-band/quickstart.md`. **This is research R-10's overturn check**: if it fails, add a hairline to the left edge of a band that directly follows another band only, never to every band, in `src/components/builds/AgeTimeline.vue`

**Checkpoint**: Bands drawn. **Not shippable** — every band still looks measured. See the merge rule.

---

## Phase 4: User Story 3 - Nothing is invented where nothing is known (Priority: P1)

**Goal**: A band appears only where the build actually describes one. Everything else renders exactly
as it does today.

**Independent Test**: Open B3 — bands only where an age-up section exists, track continuous. Open B4
— indistinguishable from `main`. Quickstart items 9, 10, 21.

**Same commit as Phase 3.** These are the guards inside the function T009 creates; they are a
separate story because they are separately verifiable, not because they land separately.

- [X] T019 [US3] Implement the four admission rules from [data-model.md §4](./data-model.md#4-band-admission-rules) in `src/composables/builds/useAgeTimings.js`: `clickUp` non-null (FR-013/FR-014), `clickUp.seconds < age.seconds` **strictly** (FR-015), `clickUp.seconds >= previous` (FR-016), and the existing `scaleSeconds` guard
- [X] T020 [US3] Comment the strict `<` in `src/composables/builds/useAgeTimings.js` with why it is strict — `getAgeTimings` admits `clickUp.seconds <= reached.seconds` at line 270, so zero-duration click-ups are real data and the naive `if (age.clickUp)` emits a zero-width flex child (research R-5)
- [X] T021 [US3] Confirm in `src/composables/builds/useAgeTimings.js` that a failing rule emits the age run **whole**, from `previous` to `age.seconds`, and that no band is ever clamped, shortened or shifted to fit — absence is information, not a gap to fill (spec A-1, contract non-goals)
- [ ] T022 [US3] Verify the byte-identical guarantee (invariant I-3): on B4, `getAgeSegments` in `src/composables/builds/useAgeTimings.js` returns the same array it returns on `main` — compare the logged output directly, then confirm the card is visually indistinguishable — item 10 in `.specify/specs/026-age-up-band/quickstart.md` (NFR-003, FR-018, SC-006)
- [ ] T023 [US3] Verify mixed presence on B3 and the zero-duration case on B6: bands only where described, track continuous with no gap, and B6's tooltip still reads "Age-up took 0:00" with no band drawn — items 9, 21 in `.specify/specs/026-age-up-band/quickstart.md` (FR-012, FR-015)

**Checkpoint**: The function refuses rather than repairs. Still not shippable on its own.

---

## Phase 5: User Story 2 - ~~Never show a worked-out width as a measurement~~ *(WITHDRAWN)*

**This phase was implemented and then removed on 2026-08-07.** T024–T025 shipped a symmetric hatch
for estimated bands; the whole distinction was then withdrawn in favour of striping every band, the
way an age-up in progress reads in the game. Provenance is carried by the `~` on the crest and in its
tooltip, which is already visible without hovering.

See [plan.md § Design Change](./plan.md#design-change-during-implementation-2026-08-07) and the
revised clarification in [spec.md](./spec.md#clarifications).

- [~] T024 [US2] ~~Add `.age-seg--est` as a symmetric hatch~~ — **withdrawn.** The stripe moved onto the shared `.age-band-*` rule in `src/components/builds/AgeTimeline.vue` and applies to every band
- [~] T025 [US2] ~~Comment why the modulation is symmetric~~ — **withdrawn.** Replaced by a comment recording why every band is striped and why provenance stays on the crest, in `src/components/builds/AgeTimeline.vue`
- [~] T026 [US2] ~~Verify solid on B1 and hatched on B2~~ — **withdrawn.** Superseded by item 14 in `.specify/specs/026-age-up-band/quickstart.md`: bands on B1 and B2 must look **identical**
- [ ] T027 [US2] Verify the stripe on the **shortest** band on the site — it must read as texture, not as one ambiguous diagonal. If it fails, go to a 90° vertical stripe in `src/components/builds/AgeTimeline.vue` rather than a wider period — item 17 in `.specify/specs/026-age-up-band/quickstart.md` (FR-011, SC-002)
- [ ] T028 [US2] Verify a build with age-ups on every age still reads as a timeline rather than a texture when viewed from a distance — item 18 in `.specify/specs/026-age-up-band/quickstart.md` (SC-007)
- [ ] T029 [US2] Verify theme switching in both directions with bands on screen: correct in both, no flash of an unthemed fill — item 19 in `.specify/specs/026-age-up-band/quickstart.md` (FR-006, NFR-002)
- [ ] T030 [US2] Verify the crest tooltip still names click-up, arrival and duration with `~` on derived times, on both B1 and B2 — **now the only provenance signal** — item 20 in `.specify/specs/026-age-up-band/quickstart.md` (FR-012)

**Checkpoint**: T027–T030 still gate the merge; only the solid-vs-hatched comparison is gone.

---

## Phase 6: User Story 4 - The card does not get bigger (Priority: P2)

**Goal**: A reader who never cared about age-up duration sees a card the same size as before.

**Independent Test**: Compare against `main` — same height, same layout, same crest positions.

**Verification only.** Research R-7 established that these hold structurally: crests are absolutely
positioned inside `.age-ticks`, a sibling of the track, and `.age-track` is a fixed 12px. There is
nothing to implement — these tasks exist to catch someone having changed that on purpose.

- [ ] T031 [US4] Verify the card's height and every crest's x-position are identical to the T004 baseline across all fixtures — item 12 in `.specify/specs/026-age-up-band/quickstart.md` (FR-019, FR-020, SC-005)
- [ ] T032 [US4] Verify `.age-track` is still `height: 12px` and that no rule added in Phases 2–5 introduces padding, margin, border or `box-sizing` change on `src/components/builds/AgeTimeline.vue` — a band must take width from the ages, never from the card

**Checkpoint**: All four stories verified.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [ ] T033 Run SC-003 across a **ten-build** sample — not the four fixtures — confirming no band is drawn for a transition the build does not describe and every transition it does describe has one, recording the build IDs used in `.specify/specs/026-age-up-band/quickstart.md`; this is the most tedious item here and the one most likely to catch a bad admission rule
- [ ] T034 [P] Verify the economy plot is untouched: `src/components/builds/EcoLines.vue` dashed age guides and the crosshair rule still land on arrival seconds on a build with bands — item 22 in `.specify/specs/026-age-up-band/quickstart.md` (spec non-goals)
- [ ] T035 [P] Verify nothing new is announced to a screen reader and the `.age-sr` crest labels in `src/components/builds/AgeTimeline.vue` are unchanged — item 23 in `.specify/specs/026-age-up-band/quickstart.md` (NFR-005)
- [ ] T036 [P] Check the console on every fixture for warnings, in particular a Vue duplicate-key warning from the extended run list in `src/composables/builds/useAgeTimings.js` — item 24 in `.specify/specs/026-age-up-band/quickstart.md` (contract G-4)
- [X] T037 Record the US2 withdrawal in `.specify/specs/026-age-up-band/spec.md`: clarification revised, US2 marked withdrawn with its reasoning kept, FR-009 revised, FR-010 removed, FR-011 revised, FR-012 promoted to load-bearing, SC-002 / A-3 / one edge case revised
- [X] T038 Record in `.specify/specs/026-age-up-band/spec.md` that the "transition running past the end of the scale" edge case is unreachable and why, so it is not re-planned next time (research R-6)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on T004's baseline existing to verify against — **BLOCKS all user stories**
- **US1 (Phase 3)**: Depends on Phase 2
- **US3 (Phase 4)**: Depends on Phase 3 — the guards live inside the function T009 creates
- **US2 (Phase 5)**: Depends on Phase 2 for the custom properties, and on Phase 3 for something to hatch
- **US4 (Phase 6)**: Depends on Phases 3–5 being complete; it is a regression check over the finished feature
- **Polish (Phase 7)**: Depends on Phases 3–5

### User Story Dependencies

Unlike a typical feature, **these stories are not independently deliverable**:

- **US1** and **US3** are the same function and land in one commit. US1 without US3 draws bands from
  unusable click-ups
- **US2** must merge with US1/US3 — see the merge rule at the top
- **US4** is a property of the others, verified rather than built

The stories remain separately *testable*, which is what the independent-test criteria above provide.

### Within Each Phase

- Composable before template before CSS (T009→T013→T014)
- Behaviour-neutral work before anything user-visible (Phase 2 before Phase 3)
- Verification tasks last within their phase, and they are commit boundaries

### Parallel Opportunities

Limited by design — two files, one of them touched by every phase.

- T003 and T004 run in parallel with T001–T002
- T034, T035 and T036 are independent verifications over a finished build
- **T005–T007 are NOT parallel** despite being separate rules: all three are in the same style block
- **Nothing in Phases 3–5 is parallel.** Both files are touched by nearly every task

---

## Parallel Example: Phase 1

```bash
# Fixture selection and baseline capture are independent:
Task: "Find a zero-duration click-up build and record it as B6 in quickstart.md"
Task: "Capture baseline screenshots of B1 and B4 in both themes from main"
```

---

## Implementation Strategy

### There is no MVP here

The usual "ship User Story 1, stop, validate" does not apply. Phase 3 alone would ship a card that
draws derived durations as measured widths — the one claim the spec says this card has never made.
The smallest shippable unit is **Phases 2 + 3 + 4 + 5**.

### Incremental delivery

1. **Phase 1** → verification targets fixed, baselines captured
2. **Phase 2** → `refactor:` commit, lands on its own, zero visual change
3. **Phases 3 + 4** → `feat:` commit, bands drawn and guarded — *do not merge yet*
4. **Phase 5** → `feat:` commit, provenance — **merge 3+4+5 together**
5. **Phases 6 + 7** → verification and spec housekeeping

Three commits, matching [plan.md](./plan.md#phase-sequencing).

### Where the time will go

Research R-9 and R-10 are the two open questions, both in CSS and neither visible in the spec. Probe
the hatch on a real narrow band (T027) in the first hour of Phase 5 rather than at the end of it —
the spec assumes a texture exists that satisfies FR-010 literally, and none does. T018 is the other
one worth doing early, since its failure mode changes the band's geometry.

---

## Notes

- [P] tasks = different files, no dependencies
- No automated tests; verification tasks cite numbered quickstart items
- Commit at the three boundaries — T008, T023, T030 — not after every task
- Per project convention, commits are the author's to make; nothing here commits automatically
- Avoid: adding a minimum band width (FR-008 forbids it), clamping a click-up into range (spec A-1),
  a fifth ramp colour (FR-005), or any text on a band (FR-003)
