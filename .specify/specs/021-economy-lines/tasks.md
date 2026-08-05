---

description: "Task list for 021-economy-lines"
---

# Tasks: Economy Lines — Collapsible Villager Distribution

**Input**: Design documents from `.specify/specs/021-economy-lines/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md),
[data-model.md](data-model.md), [contracts/eco-series.md](contracts/eco-series.md),
[contracts/eco-lines.md](contracts/eco-lines.md), [quickstart.md](quickstart.md)

**Tests**: No test framework is added. The constitution requires manual golden-path testing and no
formal suite, and the spec does not request TDD. The derivation is the one piece with enough
branching to warrant mechanical checks, so it gets a **throwaway** Node harness (T004, T009, T010)
that is not committed as a suite — the same approach `020` used. Everything else is verified by the
manual pass in [quickstart.md](quickstart.md).

**Organization**: Tasks are grouped by user story. US1 and US3 share the composable, so US3's gate
tasks sit in the same phase — splitting them would mean shipping a chart with no gate, which US3
exists to prevent.

## Implementation status — 2026-08-05

**22 of 30 done.** All code is written, builds clean, and the derivation is verified mechanically
(17/17 harness assertions, 12/12 refactor-equivalence builds). The eight open tasks are the ones an
agent cannot honestly close:

| Open | Why |
|---|---|
| T001, T002, T030 | Need real builds pulled from Firestore. The gate constants are meant to be tuned against real authoring habits (A-8); fixtures I invent would only confirm my own assumptions |
| T024, T025, T026, T027 | Browser passes — pixel alignment at 400 % zoom, both themes, the stone-in-light risk, resize through `md`, console cleanliness |
| T028 | Half done: `git diff main -- timingsHelper.js` is **empty** ✓. The autoplay behaviour check needs Focus mode open in a browser |

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story the task serves (US1, US2, US3, US4)
- Conventional Commits, one concern per commit

## Path Conventions

Vue 3 SPA, single project. Components in `src/components/builds/`, derivation in
`src/composables/builds/`. No `tests/` directory exists and none is created.

---

## Phase 1: Setup (Fixtures)

**Purpose**: Get real data in hand before writing anything that depends on how authors actually fill
builds in. The gate constants are tuned against these (assumption A-8), so inventing steps would
defeat the point.

- [ ] T001 Copy seven real builds out of Firestore into a scratch file (outside the repo — do not
      commit) covering the fixture set in [quickstart.md](quickstart.md) §1: F1 well-filled and
      mostly stamped, F2 sparse tail, **F3 trailing steps unstamped**, F4 prose-heavy (<50 % of
      steps state a cell), F5 short build passing the ratio but under the 4-point floor, F6 no
      timestamps anywhere, F7 legacy flat (`steps[0].type` undefined). Note each build's ID so the
      manual pass can reopen the same ones. *(SC-002)*
- [ ] T002 [P] Record the observed coverage distribution across a wider sample (~30 builds) into
      [quickstart.md](quickstart.md) §8 — how many pass, how many fail on the ratio, how many on the
      floor, how many have no plottable points. This is what makes 50 % / 4 explainable later rather
      than two unexplained constants. *(A-8, NC-2)*

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The shared refactor. **Ships as its own `refactor:` commit with no behaviour change,
before any feature code** — Principle II, NFR-005. Nothing in Phase 3+ may start until T005 passes.

⚠️ **BLOCKS ALL USER STORIES**

- [X] T003 `refactor:` Extract `flattenSections(steps)` from `getAgeTimings` in
      [src/composables/builds/useAgeTimings.js](src/composables/builds/useAgeTimings.js) and export
      it. It returns the flat step array only — section steps in order, never `section.gameplan`.
      The boundary pass then walks sections a second time with its own `cursor`, incremented by
      `section.steps.length`, wherever the single loop read `flat.length`. The `pendingClickUpIndex`
      carry and the "a section without steps cannot be a boundary" rule move into that second pass
      unchanged. *(FR-002, NFR-005, [research.md](research.md) R-6)*
- [X] T004 [P] `refactor:` Export `parseVillagerCountString` from
      [src/composables/builds/villagerAggregator.js](src/composables/builds/villagerAggregator.js).
      **No logic change** — the first-two-`+`-operands limit and the fishing-boat count stay, so the
      plot and the `N vils` markers cannot contradict each other. Add a comment on the export
      recording that it is now a shared contract and that fixing it moves every villager number on
      the site at once. *(FR-005, A-1, R-5)*
- [X] T005 Verify the refactor is invisible per [quickstart.md](quickstart.md) §7: on a build with
      all four ages, crest positions, times, `~` estimate markers, click-up tooltips and villager
      counts are identical before and after. If anything moved, the extraction changed behaviour and
      T003 is wrong. *(NFR-005)*

**Checkpoint**: `main`-identical behaviour, two new exports. Commit before proceeding.

---

## Phase 3: User Story 1 + User Story 3 — Read a build's economy, and never show a chart the data can't support (Priority: P1)

**Goal**: Five unstacked lines of absolute villagers per column, on the timeline's own x-scale —
and no chart at all on builds that cannot support one.

**Why combined**: both stories are served by `useEcoSeries`. US3 is the gate inside it; shipping US1
without US3 would mean shipping the three-point chart US3 exists to prevent.

**Independent Test**: Open F1 at ≥960 px with the plot force-rendered. Five lines span the same
0–16:00 as the age track above, guides under the crests. Open F4 and F5: no series at all.

### Implementation

- [X] T006 [US1] [US3] Create [src/composables/builds/useEcoSeries.js](src/composables/builds/useEcoSeries.js)
      implementing [contracts/eco-series.md](contracts/eco-series.md): guard non-empty sections build
      (legacy flat → `null`, R-7); `flattenSections` from T003; **each point reads its own step** —
      blank cells are `0`, nothing carries forward, so the five counts sum to that step's `N vils`
      figure. A step that assigns nobody at all contributes no point. Five columns including
      `builders`. *(FR-001, FR-003, FR-004, FR-005, FR-008, C-3, C-4, C-5a, C-7, R-10)*
- [X] T007 [US1] [US3] Add per-step time resolution to `useEcoSeries.js`: stated timestamp via
      `toDateFromString(step.time)` first; else `getTimings(flat)[i].startTime` when that call
      returned a value; else the step contributes no point, though it still counts toward coverage.
      Call `getTimings` once, inside `try`/`catch`, and treat `null` as normal — **not** fatal. This
      is the R-1 correction; a build whose trailing steps are unstamped must still chart the part
      that is known. *(FR-006, C-2b, R-1)*
- [X] T008 [US3] Add the two-part gate to `useEcoSeries.js`: `coverage = statedSteps / flat.length`,
      return `null` when `coverage < 0.5`; and return `null` when fewer than **4 plotted points**
      are plotted. The floor counts plotted points, not stated steps — after T007 they are no longer
      the same number. Sort points ascending by `seconds`. Return
      `{ points, coverage, lastStatedSeconds }`. *(FR-006a, R-2)*
- [X] T009 [US1] [US3] Wrap the whole body in one `try`/`catch` that logs and returns `null`,
      matching `getAgeTimings`'s failure posture, and export a `useEcoSeries(build)` `computed`
      wrapper memoized over the build. Guard every field access — no malformed step shape may throw
      into render. *(FR-007, C-1, C-8)*

### Verification

- [X] T010 [US1] [US3] Build a **throwaway** Node harness (scratchpad, not committed) over copies of
      `useEcoSeries` and its two helpers, asserting the nine cases in
      [contracts/eco-series.md](contracts/eco-series.md) §Verification — including case 2, the
      trailing-unstamped regression, and case 6, the short build that passes the ratio and fails the
      floor. *(SC-002)*
- [X] T011 [US1] [US3] Confirm `getEcoSeries` in
      [src/composables/builds/useEcoSeries.js](src/composables/builds/useEcoSeries.js) runs < 5 ms
      for a 30-step build, timed in the same throwaway harness. *(NFR-004, C-8)*

**Checkpoint**: the series is correct and gated. Nothing renders yet.

---

## Phase 4: User Story 1 — The plot (Priority: P1)

**Goal**: The SVG that makes the series readable.

**Independent Test**: Render `EcoLines` against F1's series with the disclosure hard-coded open.
Four lines, four legend entries, guides under the crests at 400 % zoom.

- [X] T012 [US1] Create [src/components/builds/EcoLines.vue](src/components/builds/EcoLines.vue) as
      a pure renderer per [contracts/eco-lines.md](contracts/eco-lines.md): props `series`,
      `scaleSeconds`, `ages`; no store, no derivation, no emits. 140 px inline `<svg>`. Five
      polylines — builders, food, wood, gold, stone, in the build order table's column order —
      **no stacking, no total line**. Straight segments, no curve interpolation.
      *(FR-008, FR-009, P-1, P-2, P-8)*
- [X] T013 [P] [US1] Add the y-axis: `max(16, ceil(maxValue / 4) * 4)`, gridlines every 4 with bare
      left-edge numbers at 9 px, no "vils" suffix. The floor of 16 is what makes two builds
      comparable in two tabs, sized to what one column reaches rather than to the dropped
      total-villager line. *(FR-010, P-3, A-6)*
- [X] T014 [P] [US1] Draw one dashed vertical guide per entry in the **`ages` prop** at
      `age.seconds` — never a time this component derives. `getAgeTimings` rounds interpolated
      boundaries and `getTimings` does not, so deriving independently costs ~0.36 px and fails
      SC-001's `±0 px`. *(FR-011, P-4, R-3)*
- [X] T015 [P] [US1] End each line at the last point with a 2.6 px cap — there is nothing carried,
      so nothing to fade (R-10). Show **"No villagers assigned after m:ss"** in the legend area only
      when the build's **ages continue past** that moment, so an early ending reads as the
      description stopping rather than the build stopping. *(FR-012, P-5, US3 scenario 4)*
- [X] T016 [P] [US1] Add the legend: flex row of 9 px swatches plus
      `text-caption text-medium-emphasis`, naming **Builders · Food · Wood · Gold · Stone** and
      nothing the plot does not draw. A column never assigned still appears, with its line flat at
      zero — the absence is information. *(FR-013, P-6, P-7)*
- [X] T017 [US1] Declare the five column colours **per theme** in scoped style, mirroring the
      existing `.age-seg-*` / `.v-theme--customLightTheme` pattern in `AgeTimeline.vue`. Values from
      [design-input.md](design-input.md) §1. Gridlines, guides and labels use the on-surface tokens
      already used in that file (`.13`, `.22`, `--v-disabled-opacity`). *(NFR-003, FR-010)*
- [X] T018 [US1] Make the plot inert: `aria-hidden="true"`, not focusable, no `role="img"`, no text
      alternative, no tooltip, crosshair, hover state or pointer cursor. Every value is already in
      the build order table below, so the graphic is decorative. Verify a two-point stone excursion
      stays visible — minimum stroke, no smoothing that erases it. *(FR-014, FR-021, P-9, P-10, P-11)*

**Checkpoint**: US1 is deliverable behind a hard-coded open state. This is the MVP.

---

## Phase 5: User Story 2 — The card costs nothing to readers who don't want it (Priority: P1)

**Goal**: The disclosure row, and a preference that survives.

**Independent Test**: Load a build with a cleared preference key: collapsed, no mount animation. Tab
to the row, press Enter, watch it expand. Open a different build: still expanded.

- [X] T019 [US2] Add the disclosure row to
      [src/components/builds/AgeTimeline.vue](src/components/builds/AgeTimeline.vue), **inside** the
      existing `d-none d-md-block` block: `v-btn variant="text" block`, `justify-start`,
      `height="38"`, `border-top` in the card's existing divider colour, leading `mdi-chart-line`,
      label **Economy**, right-aligned hint, trailing `mdi-chevron-down`. Rotate the chevron 180°
      by CSS transform when open — never swap the glyph. Hint copy verbatim from
      [design-input.md](design-input.md) §7. *(FR-016, A-3, A-4, A-5)*
- [X] T020 [US2] Wire `useEcoSeries` into `AgeTimeline.vue` and render the row only when it returns
      non-`null`. Pass `series`, `scaleSeconds` and `ages` down to `EcoLines` — `scaleSeconds` is
      the card's existing computed, **never recomputed** in the child. *(FR-009, FR-019, A-2)*
- [X] T021 [US2] Reveal with `v-expand-transition` + **`v-if`**, no `appear` — `v-if` so the SVG
      mounts only on expand (NFR-004), no `appear` so nothing animates on mount, including for a
      reader whose stored preference is already "open". *(FR-017, A-7, R-9)*
- [X] T022 [US2] Persist the open state inline in `AgeTimeline.vue`: one module-level
      `localStorage` key, read once on setup, written on toggle, default collapsed. Device-local,
      identical signed-in and signed-out, never touching the account. Wrap reads and writes so
      storage being unavailable degrades to "collapsed, does not persist" rather than throwing
      during render. **Do not create a composable** — one call site does not earn one (Principle I).
      *(FR-015, FR-018, A-8 in contracts, R-8)*
- [X] T023 [US2] Bind `aria-expanded` to the open state and confirm the row is focusable and
      activates on both Enter and Space. *(US2 scenario 4, A-6)*

**Checkpoint**: the feature is complete for desktop readers.

---

## Phase 6: User Story 4 — Phones (Priority: P3)

**Goal**: Nothing changes at xs/sm.

**Independent Test**: At xs/sm the card shows what it shows today — age chips, no Economy row.

- [ ] T024 [US4] Confirm in
      [src/components/builds/AgeTimeline.vue](src/components/builds/AgeTimeline.vue) that the row
      and plot are absent at xs/sm **by construction** — they live inside the existing
      `d-none d-md-block` split, so no new breakpoint logic is added. Resize a desktop
      window down through `md` with the plot expanded and confirm the row disappears cleanly with no
      error. *(FR-019, US4)*

---

## Phase 7: Polish & Cross-Cutting

- [ ] T025 Walk the golden path in [quickstart.md](quickstart.md) §2 across F1–F7: collapsed on
      first load with no layout shift, expand transition, **guides at ±0 px from the crests at
      400 % zoom** (SC-001), exactly five lines, counts summing to the N-vils figure (SC-001a), stone flat-at-zero still in the legend, preference
      surviving across builds and reloads, keyboard path, and collapsed height taller than `main` by
      exactly the 38 px row. *(SC-001, SC-002, SC-003, SC-004)*
- [ ] T026 [P] Theme pass per [quickstart.md](quickstart.md) §3 — both themes with the plot
      expanded. **Stone in light theme is the known risk**: no franchise colour, and at low
      saturation it sits near the neutral text colour. Check it on a **Sacred Sites** build, where
      stone actually carries the build. *(NFR-003)*
- [ ] T027 [P] Robustness pass per [quickstart.md](quickstart.md) §5 — no console errors or warnings
      across F1–F7, then by hand: a section with `steps: []`, a step with `time: "<br>"`, a step with
      all cells empty, duplicate timestamps, and times running backwards. Nothing throws; x stays
      clamped to the track. *(FR-007, Edge Cases)*
- [ ] T028 **Focus mode regression** per [quickstart.md](quickstart.md) §6:
      `git diff main -- src/composables/builds/timingsHelper.js` must be **empty**. Then open F3 —
      the build that now charts — and confirm autoplay is still **unavailable** there, exactly as on
      `main`; and that F1 still autoplays at the right times. The contrast is the design working:
      the chart draws the known part, the player refuses a build it cannot play through.
      *(SC-007, A-9)*
- [X] T029 [P] Confirm the diff touches only the five files SC-006 allows —
      `AgeTimeline.vue`, `EcoLines.vue`, `useEcoSeries.js`, `useAgeTimings.js`,
      `villagerAggregator.js`. No new dependency in `package.json`, no Firestore read, write, index
      or schema change. *(SC-006, NFR-001, NFR-002)*
- [ ] T030 Fill in the gate-constant table in [quickstart.md](quickstart.md) §8 from T002's sample,
      so the 50 % / 4 numbers arrive with their evidence attached. *(A-8)*

---

## Dependencies & Execution Order

### Phase order

```text
Phase 1 (fixtures)  →  Phase 2 (refactor, BLOCKING)  →  Phase 3 (series)
                                                            ↓
                                              Phase 4 (plot)  →  Phase 5 (disclosure)
                                                            ↓
                                                    Phase 6  →  Phase 7
```

- **Phase 2 blocks everything.** T003 must ship and be verified invisible (T005) before any feature
  code, or the "one truth about step indices" guarantee is lost and the refactor's no-behaviour-
  change property becomes unprovable.
- **Phase 3 blocks Phase 4** — `EcoLines` is a pure renderer with nothing to render until the series
  exists.
- **Phase 4 blocks Phase 5** — the disclosure has nothing to disclose.
- **Phase 6 and 7** are verification and depend on everything.

### Story dependencies

| Story | Depends on | Independently testable once |
|---|---|---|
| US1 (read the economy) | Phase 2 | Phase 4 done — render with the state hard-coded open |
| US3 (never show an unsupportable chart) | Phase 2 | Phase 3 done — assert `null` on F4/F5/F6/F7 |
| US2 (costs nothing collapsed) | US1's plot | Phase 5 done |
| US4 (phones) | US2 | Phase 5 done — it is an absence check |

US1 and US3 are not separable in practice: they are the same composable read two ways.

### Parallel opportunities

- **Phase 2**: T004 (parser export) is independent of T003 (flatten extraction) — different files.
- **Phase 4**: T013, T014, T015, T016 all touch different regions of `EcoLines.vue` and can be
  written in one sitting without ordering, though they land in one file so they are one commit.
- **Phase 7**: T026, T027 and T029 are independent verification passes.
- **Phase 1**: T002 (sampling) runs alongside T001 (fixtures).

## Implementation Strategy

**MVP = Phase 2 + Phase 3 + Phase 4.** That is a correct, gated series and a readable plot. It is
not shippable to users without Phase 5 — there is no way to open it — but it is the point at which
the feature's actual risk is retired, because the read test is either satisfied or it isn't.

**Suggested commits** (Conventional Commits, one concern each):

1. `refactor:` T003 + T004 + T005 — shared flatten and parser export, no behaviour change
2. `feat:` T006–T011 — the series
3. `feat:` T012–T018 — the plot
4. `feat:` T019–T023 — the disclosure and the preference
5. `docs:` T030 — the gate-constant evidence

Phases 6 and 7 are verification, not commits — anything they turn up is fixed in the commit that
owns the file.

## Notes

- **SC-005 does not gate this feature.** It was demoted on 2026-08-05 to a non-blocking design note.
  Worth a look while building; not a reason to hold the merge.
- **`timingsHelper.js` is not in the file list on purpose.** It stays byte-identical (T028). All
  leniency about missing times lives in `useEcoSeries`.
- **No test suite is created.** T010's harness is a throwaway in the scratchpad and must not be
  committed.
