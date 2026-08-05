# Tasks — `021-economy-lines`

> **Design handoff draft.** This predates `/speckit-plan` — treat it as a starting point, not plan
> output. Run `/speckit-clarify`, `/speckit-plan`, then `/speckit-tasks` to regenerate `tasks.md`
> properly.

Conventional Commits. Phases are ordered; `[P]` may run in parallel within a phase.

## Phase 0 — Refactor (separate commit, no behaviour change)

- [ ] **T001** `refactor:` Extract the section-flattening loop from `useAgeTimings.js` into an
  exported `flattenSections(steps)` in the same module (or a small shared helper). `getAgeTimings`
  calls it and behaves identically. Verify by rendering an existing build and diffing the timeline
  against `main`. *(FR-002, NFR-005)*
- [ ] **T002** `refactor:` Export `parseVillagerCountString` from `villagerAggregator.js`. No logic
  change — the known `+`-operand and fishing-boat defects stay (spec assumption A-1). *(FR-005)*

## Phase 1 — Series (US1, US3)

- [ ] **T003** Create `src/composables/builds/useEcoSeries.js` implementing `design-input.md` §3:
  carry-forward per column, stated-cell detection (explicit `"0"` counts), `getTimings` for x,
  `null` on no-timings, coverage and `lastStatedSeconds`. *(FR-001, FR-003, FR-004, FR-006)*
- [ ] **T004** [P] Add the coverage gate at 0.5 and memoize per build. Guard every field access —
  malformed steps must return `null`, never throw. *(FR-006, FR-007)*
- [ ] **T005** [P] Fixtures: five builds — full cells / stops filling at ~7:00 / under-coverage /
  no timestamps / legacy flat. Assert the composable's return for each. *(SC-002)*

## Phase 2 — Plot (US1)

- [ ] **T006** Create `src/components/builds/EcoLines.vue` — props `series`, `scaleSeconds`, `ages`.
  Four polylines (food, wood, gold, stone), absolute counts, no stacking, no total, no builders.
  *(FR-008, FR-009)*
- [ ] **T007** y-scale: floor 24, extend `ceil(max/8)*8`, gridlines + labels every 8. *(FR-010)*
- [ ] **T008** [P] Dashed age guides at each age second, aligned to the crests above. *(FR-011)*
- [ ] **T009** [P] Faded tail after `lastStatedSeconds` + the **No data after m:ss** note. *(FR-012)*
- [ ] **T010** [P] Legend — four items, no series the plot does not draw. *(FR-013)*
- [ ] **T011** [P] Resource colours declared for both themes in scoped style; everything else via
  `--v-theme-on-surface` opacities. Check stone in light theme on a Sacred Sites build.
  *(NFR-003)*

## Phase 3 — Disclosure (US2)

- [ ] **T012** Add the Economy row to `AgeTimeline.vue` beneath the existing axis, inside the
  `d-none d-md-block` branch only. `v-btn variant="text" block`, `mdi-chart-line`, hint text,
  rotating chevron, `aria-expanded`. *(FR-016, FR-019, US4)*
- [ ] **T013** Wrap `EcoLines` in `v-expand-transition`; collapsed by default; **no animation on
  mount** (guard the transition until after the first paint). *(FR-015, FR-017)*
- [ ] **T014** Persist the open state as a user preference across builds and sessions — resolve
  NC-1 by reusing whatever the description card's collapse uses. *(FR-018)*
- [ ] **T015** Hide the row entirely when `useEcoSeries` returns `null`. No empty state, no
  disabled row. *(FR-019, US3)*

## Phase 4 — Verification

- [ ] **T016** Measure the collapsed card against `main`: identical apart from the 38 px row.
  *(FR-020, SC-003)*
- [ ] **T017** Age guides align to crest x within 0 px at 1280 and 1920. *(SC-001)*
- [ ] **T018** Run the five fixtures through the rendered card — no console errors. *(SC-002)*
- [ ] **T019** Expand on one build, open another, confirm it stays expanded. *(SC-004)*
- [ ] **T020** **The read test.** Pick three real builds — a boom, a feudal all-in, a stone build —
  and show the three plots, titles hidden, to someone who plays. If they cannot sort them, the
  feature has not earned its space; say so rather than shipping it. *(SC-005)*
- [ ] **T021** Instrument coverage across a sample of real builds and revisit the 0.5 threshold
  before it calcifies. *(NC-2)*
- [ ] **T022** Confirm no diffs outside the four files. *(SC-006)*

## Estimate

Half a day for Phases 0–2, a couple of hours for Phase 3, and Phase 4's read test is the one that
decides whether any of it stays.
