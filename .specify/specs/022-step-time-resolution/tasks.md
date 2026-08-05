---

description: "Task list for 022 — Step Time Resolution"
---

# Tasks: Step Time Resolution — Correctness, Provenance and Reach

**Input**: Design documents from `.specify/specs/022-step-time-resolution/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md),
[data-model.md](data-model.md), [contracts/](contracts/)

**Tests**: No formal suite (constitution: manual golden-path testing). The throwaway Node harness
tasks below are **not** a test suite — they are the verification instrument NFR-005 requires, and
they are not committed.

**Organization**: Grouped by user story. Unlike a greenfield feature, **these stories form a chain**
rather than a set of independent slices — see [Dependencies](#dependencies--execution-order). That is
stated honestly rather than papered over: this is a refactor of one seam that three callers share.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on incomplete work)
- **[Story]**: US1 … US4, mapping to spec.md's user stories
- Every task names its file path

## Path Conventions

Single-page Vue 3 app. Source at `src/`, developer scripts at `scripts/`, throwaway harnesses in the
session scratchpad (never committed).

---

## Phase 1: Setup — Capture the baseline ⚠️ MUST RUN ON `main`

**Purpose**: Record what `main` does before leaving it. SC-005 ("every build that autoplays today
announces every step at the same second") is not verifiable by eye, and once the branch has the new
resolver the old numbers are gone.

**⚠️ These three tasks are irreversible if skipped.** Do them first or SC-005 and SC-010 cannot be
checked at all.

- [X] T001 Rewrite `scratchpad/probe.mjs` to import the **real** helper instead of an inlined copy, bundling with `npx esbuild --bundle --platform=node --alias:@=./src`, and add the nine SC-003 fixtures (fully stamped / stamped-then-blank / runs-past-horizon / age-ups-only / D1 same-count-span / D2 cell-less-step / D3 legacy-flat-with-note / D4 decreasing-villagers / no-timestamps-at-all)
- [X] T002 Add a `--dump` mode to `scratchpad/probe.mjs` emitting stable-ordered JSON of every fixture's per-step `startTime`, then run it on `main` to produce `scratchpad/golden-main.json`
- [ ] T003 Bundle and run `scripts/backfill-age-timings.mjs` in **dry-run** mode against dev credentials from `main`, saving output to `scratchpad/backfill-main.txt` — the population baseline for [quickstart.md](quickstart.md) step 2

**Checkpoint**: `main`'s behaviour is captured. Switch to `022-step-time-resolution` and do not
return.

---

## Phase 2: Foundational — The resolver 🚧 BLOCKS EVERYTHING

**Purpose**: `resolveStepTimes()` is the seam all four stories are built on. Nothing else can start.

**Contract**: [contracts/resolve-step-times.md](contracts/resolve-step-times.md) ·
**Shapes**: [data-model.md](data-model.md) §1–§5

- [X] T004 Add `resolveStepTimes(steps)` to `src/composables/builds/timingsHelper.js` returning one index-aligned `{ seconds, provenance }` per step, with the `stated` path reading the step's own timestamp unmodified (FR-001, FR-003, G-1, I-5)
- [X] T005 Implement running villager counts in `src/composables/builds/timingsHelper.js` — a step stating no cells inherits the last stated count and contributes a zero delta (FR-005, fixes **D2**)
- [X] T006 Implement anchor detection and `AnchorSpan` with the `usable = villagerDelta > 0` test in `src/composables/builds/timingsHelper.js`, covering zero delta (**D1**) and negative delta (**D4**) in one condition (FR-004, FR-007)
- [X] T007 Implement proportional interpolation in `src/composables/builds/timingsHelper.js` with clamping to `[from, to]` and forced non-decreasing output; unusable spans fall back to even spacing by step position, still reported `interpolated` (FR-006, FR-007, G-2 … G-4, I-3, I-4)
- [X] T008 Implement the implicit `0:00` **lower bound** in `src/composables/builds/timingsHelper.js` as a clamp and interpolation left-endpoint only — never an anchor, never a villager count, never reported as `stated` (FR-010, R-8, I-2)
- [X] T009 Exempt `gameplan` notes in `src/composables/builds/timingsHelper.js`: always `unresolved`, never an anchor, never blocking neighbours (FR-011, G-6, fixes **D3**)
- [X] T010 Wrap `resolveStepTimes` in `src/composables/builds/timingsHelper.js` so it never throws on `null`, `[]`, or malformed steps, and reads only each step's `time` and five resource cells (FR-012, G-7, G-8, SC-008)
- [X] T011 Verify Phase 2 with `scratchpad/probe.mjs`: all four Evidence shapes pass their contract table, and no fixture yields `NaN`, `Infinity`, a negative, or a non-monotonic derived run (SC-001, G-2 … G-6)

**Checkpoint**: The resolver is correct standalone. No app behaviour has changed yet — nothing calls
it.

---

## Phase 3: User Story 1 — A time is never nonsense (P1) 🎯 MVP

**Goal**: Wire the resolver into all three consumers. Wrong times become right; nothing else moves.

**Independent Test**: Open the D1 fixture in Focus mode — the step that reads `alid` on `main` now
reads a real time. Open the D2 fixture's detail page — no age marker sits past its successor.

**Contract**: [contracts/get-timings.md](contracts/get-timings.md)

- [X] T012 [US1] Reimplement `getTimings(steps)` in `src/composables/builds/timingsHelper.js` as a thin wrapper returning `[{ startTime }]` or `null`, deleting the old `init`/`interpolate` algorithm and the four scaffolding fields (`villagers`, `villagerOffsetNextStep`, `villagerOffsetNextValidStep`, `type`) — R-4
- [X] T013 [US1] Gate `getTimings()` on every **step** resolving as `stated` or `interpolated`, with notes exempt; extrapolation is **not** admitted yet (that is US4) — FR-014 partial, D3 fix lands here
- [X] T014 [US1] Replace the `try`/`catch`ed `getTimings()` call and the local stated-vs-interpolated logic in `src/composables/builds/useAgeTimings.js` with a single `resolveStepTimes()` read, deleting the "bonus, not a precondition" workaround (FR-016)
- [X] T015 [US1] Add `provenance` **beside** the retained `derived` boolean on each `AgeTiming` and on `clickUp` in `src/composables/builds/useAgeTimings.js` — `derived === (provenance !== "stated")` (FR-016, R-2, data-model §6)
- [X] T016 [US1] Map the stored field in `src/composables/builds/useAgeTimings.js`: `toStoredAgeTimings` writes `e = derived`; `fromStoredAgeTimings` returns `provenance = e ? "interpolated" : "stated"`. Shape stays `{ t, e }` (R-3, data-model §7)
- [X] T017 [US1] Replace `resolveSeconds()` in `src/composables/builds/useEcoSeries.js` with a read of the resolver's output, dropping its own `try`/`catch` (FR-017)
- [X] T018 [US1] Re-run `scratchpad/probe.mjs` and confirm `src/composables/builds/villagerAggregator.js`, `src/components/builds/AgeChips.vue` and `src/components/builds/BuildListCard.vue` are byte-identical to `main` via `git diff --stat` (SC-007, SC-009)
- [ ] T019 [US1] Manually verify [quickstart.md](quickstart.md) steps 3–4: the four Evidence shapes on screen, and `"alid"` gone from Focus mode

**Checkpoint**: US1 ships on its own. Age times and economy points are correct for any build derived
live — **but see T033: existing builds still read the stale stored field until the backfill runs.**

---

## Phase 4: User Story 2 — Reach past the last timestamp (P1)

**Goal**: Extend each build using its own observed villager rate, bounded by a horizon.

**Independent Test**: A build stamped through Feudal and blank after now draws past its last stamp,
and stops at the horizon rather than running to the end of the build.

- [X] T020 [US2] Implement `ObservedRate` in `src/composables/builds/timingsHelper.js` — `span.duration / span.villagerDelta` of the build's **last usable span**, falling back to the nominal ~20 s/villager constant only when no usable span exists (FR-008, A-2, A-3, data-model §4)
- [X] T021 [US2] Implement the horizon in `src/composables/builds/timingsHelper.js` — 8 steps or 120 seconds past the last anchor, whichever binds first; beyond it entries are `unresolved` with `seconds: null` (FR-009, G-5, data-model §5)
- [ ] T022 [US2] Add per-provenance counters to `scratchpad/probe.mjs` and to the bundled backfill dry run, then run the dry run on the branch to measure how many builds gain ages only via extrapolation and how many run past the horizon (R-7)
- [ ] T023 [US2] Tune the FR-009 constants against T022's distribution and **write the numbers into [quickstart.md](quickstart.md)'s "Recorded results"** — A-9 promises they are recorded, not left as folklore. Weigh both consequences A-11 names: too tight loses autoplay, too loose drifts playback
- [X] T024 [US2] Mark each point `stated` in the `useEcoSeries` return in `src/composables/builds/useEcoSeries.js` (data-model §8, feeds T026)
- [X] T025 [US2] Verify the coverage gate in `src/composables/builds/useEcoSeries.js` is unchanged in both halves (≥50%, ≥4 points) while admitting the newly placed points, and record how many builds newly clear it (FR-017)

**Checkpoint**: Lines and markers reach further. Nothing is labelled yet — every extrapolated value
is still presented as a plain interpolated estimate.

---

## Phase 5: User Story 3 — An estimate never passes for a fact (P1)

**Goal**: Make the third tier visible where it can be seen.

**Independent Test**: A build with an extrapolated age shows the projected footnote; its plot is
dashed after the last anchor. A build with only interpolated ages reads exactly as on `main`.

- [X] T026 [P] [US3] Split each resource into solid and dashed polylines in `src/components/builds/EcoLines.vue`, solid only where both endpoints are stated, merging like segments into runs that share their boundary point so no visible break appears at the join; reuse `.eco-guide`'s existing dash vocabulary (FR-022, R-6)
- [X] T027 [P] [US3] Select the timeline footnote from provenance in `src/components/builds/AgeTimeline.vue` — `interpolated` keeps "~ estimated from villager count", `extrapolated` reads "~ projected past the last stated time" (FR-020)
- [X] T028 [US3] Implement the weaker-tier rule in `src/components/builds/AgeTimeline.vue`: when a build's shown ages span both derived tiers, the footnote names the weaker one (FR-021)
- [ ] T029 [US3] Confirm no geometry, colour, marker-placement or `.age-time--derived` change in `src/components/builds/AgeTimeline.vue` and `src/components/builds/EcoLines.vue`, in both themes (FR-023, SC-006)

**Checkpoint**: All three tiers are distinguishable on the detail page. Focus mode still marks
nothing — that is US4.

---

## Phase 6: User Story 4 — Wider gate, honest playback (P2) ⚠️ ONE COMMIT

**Goal**: Admit extrapolated builds to autoplay, and mark every time Focus mode did not read from the
author.

**Independent Test**: The stamped-then-blank fixture autoplays where `main` refused it, with `~` on
its tail; the runs-past-horizon fixture is still refused.

> **⚠️ T030 and T031 MUST land in a single commit.** Shipping the widened gate without the marking
> puts estimated times into playback unlabelled — a regression in honesty delivered as an improvement
> in reach. This is the one ordering the feature forbids (NFR-003 group C).

- [X] T030 [US4] Admit `extrapolated` as resolved in `getTimings()` in `src/composables/builds/timingsHelper.js`; a single `unresolved` step still fails the whole build (FR-014)
- [X] T031 [US4] In `src/components/builds/FocusMode.vue`, call `resolveStepTimes()` alongside `getTimings()` and prefix `step.time` with `~` for every `interpolated` and `extrapolated` step at the point it is written (line ~351), leaving `stated` steps unmarked (FR-015a, R-5)
- [X] T032 [US4] Add a TODO comment in `src/components/builds/FocusMode.vue` recording that it mutates `step.time` on its cloned steps — the reason the marker must be applied at write time rather than in the template. Untangling it touches the progress and elapsed-time maths and is its own feature (Principle II, R-5)
- [ ] T033 [US4] Verify [quickstart.md](quickstart.md) step 5's gate matrix: fully-stamped unchanged to the second, legacy-flat-with-note now plays, stamped-then-blank now plays, runs-past-horizon still refused, no-timestamps still refused (SC-005, SC-005a, SC-005b)

**Checkpoint**: All four stories complete in code. **Nothing is visible to existing users yet.**

---

## Phase 7: Polish — Make it real & verify

**Purpose**: The backfill, without which every fix above is invisible on all ~4k existing builds, plus
the regression guard.

- [X] T034 Run `scratchpad/probe.mjs --dump` on the branch to produce `scratchpad/golden-branch.json` and diff against `golden-main.json`; every difference must be a D1–D4 correction, an `unresolved` → `extrapolated` promotion, or a gate flip. **A correct time that moved is a regression** (SC-005, R-9)
- [ ] T035 Bundle and run `scripts/backfill-age-timings.mjs` in dry-run mode against **dev**, diffing against `scratchpad/backfill-main.txt` and eyeballing the printed first-20 (NFR-002a)
- [ ] T036 Run `scripts/.build/backfill.cjs --apply` (bundled from `scripts/backfill-age-timings.mjs`) against **dev**, then spot-check three builds on the detail page, the list card, and the home lane (SC-010)
- [ ] T037 Confirm `updateHomeSnapshot` propagates the corrected field on its next hourly run — no second backfill needed (`functions/builds/updateHomeSnapshot.js` line 31, R-1)
- [ ] T038 Run `scripts/.build/backfill.cjs` dry run then `--apply` against **prod**, only after dev is verified; confirm the printed project id matches intent before applying (~4k writes, Principle IV)
- [X] T039 [P] Measure `resolveStepTimes()` in `src/composables/builds/timingsHelper.js` on a 30-step build with `performance.now()` and confirm under 5 ms; confirm the detail page shows no new load jank and `src/components/builds/EcoLines.vue` still mounts only on first expand (NFR-004)
- [ ] T040 [P] Fill in [quickstart.md](quickstart.md)'s "Recorded results" — backfill distribution, final horizon constants and why, builds gaining autoplay, any unexplained golden diffs (A-9)
- [X] T041 Final `git diff --stat` against `main`: changes confined to `timingsHelper.js`, `useAgeTimings.js`, `useEcoSeries.js`, `FocusMode.vue`, `AgeTimeline.vue`, `EcoLines.vue`. `villagerAggregator.js`, `AgeChips.vue` and `BuildListCard.vue` byte-identical (SC-006, SC-007, SC-009)

---

## Dependencies & Execution Order

### These stories are a chain, not a fan-out

The template's default assumption — independent stories any of which could ship alone — **does not
hold here**, and pretending otherwise would produce a misleading plan. This feature rewrites one seam
that three callers share:

```
Phase 1 (baseline on main)  →  Phase 2 (resolver)  →  US1  →  US2  →  US3
                                                             ↘         ↘
                                                              US4 ──────→ Phase 7 (backfill)
```

- **US1** is the only story that could genuinely ship alone, and it is the MVP.
- **US2** needs US1's wiring — nothing consumes the resolver before then.
- **US3** needs US2, because the `extrapolated` tier it presents does not exist until then.
- **US4** needs US2 for the same reason: there is nothing to admit to the gate.
- **Phase 7** needs everything, for the reason in the next section.

### The backfill sequencing decision

`useAgeTimings` prefers the stored field over deriving (R-1), so no code change reaches an existing
build until the backfill runs. That creates a choice:

| If you ship… | Then… |
|---|---|
| **US1 alone**, as an increment | Run T035–T038 after Phase 3. Shipping US2 later requires a **second** backfill, because extrapolation can newly resolve an age. ~8k writes total. |
| **The whole feature** (recommended) | One backfill at the end, ~4k writes. Phases 3–6 are invisible to users until T036/T038 land. |

Both are within free tier. The second is cheaper and simpler; the first delivers the `"alid"` fix
sooner. **Decide before starting Phase 3** — it changes nothing in the code, only when T035–T038 run.

### Within each phase

- Phase 2 tasks are sequential — T004 … T010 all edit `timingsHelper.js`.
- T012, T013, T020, T021, T030 also edit `timingsHelper.js`: sequential with each other and with
  Phase 2.
- T014–T016 (`useAgeTimings.js`) and T017 (`useEcoSeries.js`) touch different files but both depend
  on T012.

### Parallel opportunities

Genuinely limited — most tasks queue behind `timingsHelper.js`. The real ones:

- **T026 ‖ T027** — `EcoLines.vue` and `AgeTimeline.vue`, different files, both depend only on US2
- **T039 ‖ T040** — measurement and documentation, no overlap
- T014–T016 ‖ T017 after T012 lands (`useAgeTimings.js` vs `useEcoSeries.js`)

---

## Implementation Strategy

### MVP (User Story 1 only)

1. Phase 1 — capture the baseline **on `main`** (T001–T003). Skipping this forfeits SC-005 permanently.
2. Phase 2 — the resolver (T004–T011).
3. Phase 3 — wire it in (T012–T019).
4. **STOP and VALIDATE**: `"alid"` gone, D1–D4 corrected, `AgeChips`/`BuildListCard` byte-identical.
5. Run the backfill (T035–T038) **if shipping here** — otherwise the fix is invisible.

### Incremental delivery

| Increment | Phases | Commits | Ships |
|---|---|---|---|
| 1 — correctness | 2 + 3 | `feat:` resolver, `refactor:` wrapper, `refactor:` consumers | Wrong times become right |
| 2 — reach | 4 | `feat:` extrapolation + horizon | Lines extend past the last stamp |
| 3 — presentation | 5 | `feat:` footnote tiers, `feat:` dashed tail | The third tier becomes visible |
| 4 — playback | 6 | **one** `feat:` commit (T030 + T031) | Wider autoplay, honestly marked |
| 5 — visibility | 7 | `chore:` backfill run | All of the above reaches existing builds |

Conventional Commits per the constitution's Development Workflow. Increment 4 is the one that must
not be split.

### Solo-project note

The template's parallel-team section does not apply — this is a solo hobby project and the chain
above is inherently sequential. The `[P]` markers are kept where genuinely true so the ordering is
not over-constrained, not to suggest staffing.

---

## Notes

- **T001–T003 run on `main`.** Everything else runs on `022-step-time-resolution`.
- **T030 + T031 are one commit.** See the Phase 6 warning.
- **T035–T038 are not optional.** NFR-002a — without them the feature is correct and invisible.
- Harnesses live in the scratchpad and are never committed (NFR-005).
- No civilization, landmark, or technology mapping appears in any task. T041 is the final check
  (SC-008).
- Commit after each task or logical group; verify against [quickstart.md](quickstart.md) at each
  checkpoint.
