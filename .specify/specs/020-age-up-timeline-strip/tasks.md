---

description: "Task list for 020-age-up-timeline-strip"
---

# Tasks: Age-Up Timeline Strip — Timings In, Chips Out

**Input**: Design documents from `.specify/specs/020-age-up-timeline-strip/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/age-timings.md](contracts/age-timings.md), [quickstart.md](quickstart.md)

**Tests**: No test framework is added. The project constitution requires manual golden-path testing and no formal suite, and the spec does not request TDD. The derivation is the one piece with enough branching to warrant mechanical checks, so it gets a **throwaway** verification harness (T002, T007, T008) that is not committed as a suite. Everything else is verified by the manual pass in [quickstart.md](quickstart.md).

**Organization**: Grouped by user story so each can be implemented, verified and shipped independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US5)
- Exact file paths included in every task

## Path Conventions

Vue 3 SPA at repository root: `src/components/`, `src/composables/`, `src/views/`. Firebase Functions in `functions/`. One-off developer scripts in `scripts/`. Per [plan.md](plan.md) Structure Decision.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Material needed before the derivation can be written or checked. No project initialisation — this is an existing app.

- [X] T001 [P] Copy four real builds out of Firestore into `scripts/.scratch/age-timing-fixtures.json`: (a) sections reaching Imperial with several stated timestamps, (b) sections reaching Feudal only, (c) sections with no parseable timestamps, (d) a legacy flat build (`steps[0].type` undefined). Reference `BuildOrderEditor.initializeSections` for the shapes.
- [X] T002 [P] Create a throwaway harness at `scripts/.scratch/check-age-timings.mjs` that loads the fixtures and prints `getAgeTimings()` output per fixture. Run via an esbuild bundle, the same way the backfill script is built — research R3 rejected `vite-node` as a new dependency for exactly this problem. Scratch, not committed tooling.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The derivation. Every story except US2 renders its output.

**⚠️ CRITICAL**: US1, US3, US4 and US5 cannot begin until this phase is verified. A flattening bug here does not throw — it silently reports wrong times, and you would debug it through three layers of new UI.

- [X] T003 Create `src/composables/builds/useAgeTimings.js` exporting `getAgeTimings(steps)`. Flatten sections exactly as `FocusMode.vue` does — concatenate each `section.steps` in order, **never** push `section.gameplan` as an entry — then call the unmodified `getTimings()` from `timingsHelper.js`. Per [contracts/age-timings.md](contracts/age-timings.md) §1.
- [X] T004 In `src/composables/builds/useAgeTimings.js`, collect boundaries from sections where `type === 'age' && age > 1`, recording the flattened index of each section's first step. Return `[{ age, seconds, derived }]` ascending by age. Age values are the section's own numbering: 2 = Feudal, 3 = Castle, 4 = Imperial.
- [X] T005 In `src/composables/builds/useAgeTimings.js`, set `derived` by testing whether the boundary step yields a **parseable** timestamp (`toDateFromString(step.time) !== null`) — **not** `!step.time`. See [research.md](research.md) R9: the design input's version reports a present-but-unparseable timestamp as author-stated even though it was interpolated.
- [X] T006 In `src/composables/builds/useAgeTimings.js`, honour every empty-result path: return `[]` (never `null`, never partial) for absent/empty `steps`, legacy flat builds, no `age` section above 1, and `getTimings() === null`. Must not throw for any malformed shape. Add the memoized `useAgeTimings(buildRef)` wrapper that prefers `build.ageTimings` when present and derives from `build.steps` otherwise — the preference is harmless before US5 exists, since it simply always falls back.
- [X] T007 Run `scripts/.scratch/check-age-timings.mjs` against all four fixtures: (a) three ages with correct times, (b) one age, (c) `[]`, (d) `[]`. Then against `null`, `[]`, a section with `steps: []`, and a step with `time: "<br>"` — no throw, and **the `"<br>"` case must return `derived: true`**. If it returns `false`, T005 is wrong.
- [ ] T008 Open fixture (a) in Focus mode and compare its Feudal time to `getAgeTimings()` output. They must match **to the second** — both come from the same `getTimings()` call, so a mismatch means the flattening in T003 drifted out of index alignment.

**Checkpoint**: Derivation is trustworthy. UI work can begin.

---

## Phase 3: User Story 1 - Choose a build from the list without opening it (Priority: P1) 🎯 MVP

**Goal**: Every builds-list card shows its Feudal / Castle / Imperial times in a fixed right-hand rail, so tempo is readable without opening anything.

**Independent Test**: Open `/builds` at ≥1280 px with a mix of builds. Every card shows a right-aligned rail of up to three crest+time rows sharing one right edge; a build with no Castle shows `—`; a build with no usable timestamps shows no rail at all.

- [X] T009 [US1] In `src/components/builds/BuildListCard.vue`, switch the card from `:height` to `:min-height` and set the breakpoint map to `xs 96 · sm 125 · md 112 · lg 112 · xl/xxl 125` (md and xs grow from 90 — accepted decision, see spec Clarifications).
- [X] T010 [US1] In `src/components/builds/BuildListCard.vue`, restructure the md+ body into title (single line, ellipsis) + a **people** line (author link · creator link) + a **stats** line (date · views · comments · season · map). Both meta lines `text-caption text-medium-emphasis`, `nowrap` + `overflow:hidden`, `·` separators as their own spans at 40 % opacity. A meta line with no content collapses rather than rendering blank.
- [X] T011 [US1] In `src/components/builds/BuildListCard.vue`, reduce the md+ chip group to state only — keep `Draft` and `New`, remove the rest. Author and video creator become links on the people line; the author link keeps its existing `{name:'Builds', query:{author}}` target.
- [X] T012 [US1] In `src/components/builds/BuildListCard.vue`, add the age rail as a third `v-col cols="auto"` rendering three rows: crest + right-aligned tabular time, `—` at low emphasis for an age the build does not reach, and the whole rail omitted when the result is empty. Crests are plain `<img>` at fixed size (17 px) from `/assets/pictures/age/age_{2,3,4}.webp` — matching how the same asset is rendered in `BuildOrderSectionEditor.vue`; see [research.md](research.md) R5.
- [X] T013 [US1] In `src/components/builds/BuildListCard.vue`, give derived times a `~` prefix, weight 500 and `text-medium-emphasis`, wrapped in a `v-tooltip` reading exactly "Estimated from villager count". No underline or dotted rule — it reads as a link.
- [X] T014 [US1] In `src/components/builds/BuildListCard.vue`, add an accessible label to each rail row naming the age, its time and whether it is estimated, so the rail is not image-and-number only to assistive technology.
- [X] T015 [US1] Add the scoped rail and body CSS to `src/components/builds/BuildListCard.vue` from [design-input.md](design-input.md) §6 (`.blc-ages`, `.blc-agerow`, `.blc-body`, `.blc-title`, `.blc-meta`), using theme tokens for the divider, derived colour and `—` colour — no hardcoded hexes.
- [X] T016 [US1] Guard the derivation against skeleton cards in `src/components/builds/BuildListCard.vue` — `build.loading` must never reach `useAgeTimings`.
- [ ] T017 [US1] Verify at 1280 px with 10 cards: all age times share one right edge, every title sits at the same offset, and long author/creator/season names ellipsize without changing card height.

**Checkpoint**: The core value is delivered. Shippable on its own.

---

## Phase 4: User Story 2 - Read only what distinguishes this list (Priority: P1)

**Goal**: Cards stop repeating what every row shares, always show the sorted metric, and the two live visibility defects are fixed.

**Independent Test**: Apply exactly one season → no card mentions a season. Sort by Favorites → the favorites count appears. Open `/builds?author=…` → the author disappears while `AuthorPageHeader` still names them.

**⚠️ Depends on US1**: both rewrite `BuildListCard.vue`'s body. Doing US2 against today's chip markup would be thrown away by T010.

- [X] T018 [US2] Add a `context` prop to `src/components/builds/BuildListCard.vue` (`'default' | 'civ-locked' | 'author-locked'`, default `'default'`). Note `'author-locked'` is **new to the codebase** — `FilterConfig.vue` recognises only `'default'` and `'civ-locked'` today.
- [X] T019 [P] [US2] Pass `context` from `src/views/builds/Builds.vue` — `author-locked` when `filterConfig.author` is set, else `default`.
- [X] T020 [P] [US2] Pass `context="default"` plus the own-list signal from `src/views/builds/MyBuilds.vue` so the author is suppressed.
- [X] T021 [P] [US2] Pass `context="default"` from `src/views/builds/MyFavorites.vue` (authors differ, so the author stays visible).
- [X] T022 [P] [US2] Add a `context` prop to `src/components/home/BuildLaneTabs.vue` and forward it to the cards. This component is **not** a leaf host — Dashboard and Home both render cards through it, with different data shapes.
- [X] T023 [P] [US2] Pass `context="civ-locked"` from `src/views/builds/Dashboard.vue` into `BuildLaneTabs`, and `context="default"` from `src/views/Home.vue`.
- [X] T024 [US2] In `src/components/builds/BuildListCard.vue`, implement the single-value visibility rule from [design-input.md](design-input.md) §3 as computed flags (`showSeason`, `showMap`, `showAuthor`, `showCreator`) reading the applied `filterConfig` plus `context`. A field whose filter has exactly one selected value is omitted from every card. Do not infer context from the route.
- [X] T025 [US2] `fix:` the dead map guard in `src/components/builds/BuildListCard.vue` — `filterConfig.map` does not exist (the field is `maps: []`), so the map chip has never rendered. Replace with `filterConfig.maps?.length` semantics.
- [X] T026 [US2] `fix:` sort-dependent metadata in `src/components/builds/BuildListCard.vue` — drop the `orderBy` `v-show` chain so views always render, and add the favorites count when `orderBy === 'likes'`.
- [ ] T027 [US2] Verify across all hosts: one season selected → no season anywhere, two → season everywhere; each of the six sort keys keeps views and adds its metric; unfiltered list shows the map (proving the T025 fix); `?author=` hides the author; `MyBuilds` hides the author and collapses the people line to a two-line body; Dashboard keeps the flag but shows no civ text.

**Checkpoint**: The card shows only what distinguishes rows, on every surface.

---

## Phase 5: User Story 3 - Same decision on a phone (Priority: P2)

**Goal**: xs/sm cards carry the age times in place of season and map.

**Independent Test**: At xs the chip row shows up to three age chips and no season/map chips; the meta line is author · date · views; the card stays within its breakpoint height with a two-line title.

- [X] T028 [P] [US3] Create `src/components/builds/AgeChips.vue` — a shared chip row taking the age-timings array and rendering `v-chip label size="x-small"` per age, filled for stated times and `variant="outlined"` with a `~` prefix for derived ones, each carrying the same accessible label as the rail rows. Extracted up front because US4 reuses it at xs (constitution Principle III).
- [X] T029 [US3] In `src/components/builds/BuildListCard.vue`, replace the xs/sm chip row with the layout the design input actually specifies: title (two-line clamp) · a chip row of state + age chips only · **one quiet meta line** of author · creator · date · views, wrapping rather than truncating. *(Corrected: this task originally read "age chips replace the season and map chips, keep author and date", which preserved the chip row the design was replacing. The chip soup was the thing being removed, and implementing the task rather than the design is what produced the wrong mobile layout first time.)*
- [X] T030 [US3] In `src/components/builds/BuildListCard.vue`, allow the xs/sm title to clamp to two lines via `.blc-title--xs` from [design-input.md](design-input.md) §6.
- [ ] T031 [US3] Verify at xs and sm: chips present, season/map absent, card within 96 px / 125 px with a long two-line title, derived chips visibly outlined against filled stated ones.

**Checkpoint**: Mobile reaches parity with desktop for the decision the feature exists to support.

---

## Phase 6: User Story 4 - See the whole shape of a build on its details page (Priority: P2)

**Goal**: A build's age progression is legible at a glance before reading its steps.

**Independent Test**: Open a build with full timings — a timeline strip sits directly above the Build Order card on a shared 0–16:00 track, with times matching that build's list-card rail exactly.

- [X] T032 [P] [US4] Create `src/components/builds/AgeTimeline.vue` (read-only, prop `steps`): a fixed 0–16:00 track of proportional segments with absolutely-positioned markers at `seconds / 960 * 100%`, clamped to `[0,100]`, each showing crest + time (`~` if derived) + **age name in text** + villager count from `aggregateVillagers`, plus a 0/4/8/12/16 axis. `.age-ticks` height 80 px so the axis clears the labels. Renders nothing when the timings array is empty.
- [X] T033 [US4] Mount `AgeTimeline` in `src/views/builds/BuildDetails.vue` **between the Description card and `BuildOrderEditor`**, in its own `v-card flat rounded="lg" class="mt-4"` using the existing `build-card-section-header` pattern (`mdi-timer-sand`, label "Timeline"). View route only. Do not touch `BuildHeader.vue` or `BuildOrderEditor.vue`.
- [X] T034 [US4] In `src/components/builds/AgeTimeline.vue`, degrade to `AgeChips` at xs instead of the track, inside the same card.
- [ ] T035 [US4] Verify the strip's times are identical to the same build's list-card rail; a build with no timings renders no card at all (not an empty one); the edit/create route shows no strip; and a build reaching Imperial after 16:00 clamps its marker while still printing the true time.

**Checkpoint**: The details page teaches the crest-to-age mapping the list card relies on.

---

## Phase 7: User Story 5 - See the same timings on the home page (Priority: P2)

**Goal**: Home lanes show timings despite being fed from a summary that carries no step data.

**Independent Test**: After the backfill and the next scheduled snapshot run, home lane cards show the same timings those builds show in the builds list — with no increase in build documents read.

- [X] T036 [US5] In `src/composables/data/buildService.js`, compute `ageTimings` with `getAgeTimings` inside `addBuild()` and `updateBuild()` and write it on the build document as a **map**: `{ feudal: { t, e }, castle: { t, e }, imperial: { t, e } }`. Omit the key for any age not reached — never write `0` or `null`, since a missing nested path is what keeps such builds out of a future `orderBy('ageTimings.castle.t')`. Write `{}` when nothing is derivable. This covers all three write call sites (create, edit, publish-draft) because they all funnel through these two functions; see [research.md](research.md) R1.
- [X] T037 [P] [US5] Add `ageTimings: data.ageTimings ?? null` to `pickBuildFields` in `functions/builds/updateHomeSnapshot.js`. **Copy only** — no derivation logic may enter `functions/`, which cannot import the ES-module composables and would otherwise become a second implementation.
- [X] T038 [P] [US5] Create `scripts/backfill-age-timings.mjs` — a one-off Admin SDK script following the `scripts/set-admin-claims.js` pattern: page through `builds/`, compute `ageTimings` with the same `getAgeTimings`, commit in batches of at most 500. Must use the Admin SDK because Firestore rules restrict build writes to each build's author, so a client-side backfill is impossible. Include a dry-run flag that logs the first batch without writing.
- [X] T039 [US5] Bundle and dry-run the backfill: `npx esbuild scripts/backfill-age-timings.mjs --bundle --platform=node --external:firebase-admin --alias:@=./src --outfile=scripts/.build/backfill.cjs`, then run with `GOOGLE_APPLICATION_CREDENTIALS`. Bundling is required because `timingsHelper.js` imports through the Vite `@/` alias, which plain Node cannot resolve and which FR-006 forbids changing. Inspect the dry-run output before committing writes.
- [X] T040 [US5] Run the backfill for real against all ~4k builds, then verify: a saved build's document gains `ageTimings` with only the ages it reaches; editing away an age-up removes that key; a build with no usable timings stores `{}`.
- [X] T041 [US5] After the next hourly snapshot run, verify home lanes show timings, that they match the builds list for the same build, and that the home page reads no more build documents than before.

**Checkpoint**: Every surface that shows a build card shows its timings.

---

## Phase 8: Polish & Cross-Cutting Concerns

- [ ] T042 [P] Theme sweep: both themes at xs / sm / md / lg / xl across `BuildListCard.vue`, `AgeChips.vue` and `AgeTimeline.vue` — rail divider, derived colour and `—` colour all resolve from tokens with no hardcoded hexes.
- [ ] T043 [P] Screen-reader pass: each rail row and age chip announces age + time + estimated-or-not, never a bare number.
- [ ] T044 Performance check: total derivation under 10 ms for a 10-card page on a mid-range phone. Expect this to be comfortable post-backfill, since cards then read the stored field and derive nothing.
- [ ] T045 Regression review: `src/composables/builds/timingsHelper.js` carries only the FR-006 crash guard, with no change to the interpolation algorithm; no console errors on all four fixtures; diff confined to `BuildListCard.vue`, `AgeChips.vue`, `AgeTimeline.vue`, `useAgeTimings.js`, `buildService.js`, `BuildDetails.vue`, the host views' props, `updateHomeSnapshot.js` and the backfill script.
- [ ] T046 Run the full manual pass in [quickstart.md](quickstart.md) and delete the scratch harness and fixtures from `scripts/.scratch/`.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Needs Phase 1 fixtures to verify. **Blocks US1, US3, US4, US5.**
- **US1 (Phase 3)**: Needs Foundational.
- **US2 (Phase 4)**: Needs **US1** — both rewrite the same card body. Does *not* need Foundational; it is the one story independent of the derivation.
- **US3 (Phase 5)**: Needs Foundational and US1's card restructure.
- **US4 (Phase 6)**: Needs Foundational. Independent of US1–US3 except that T034 reuses `AgeChips` from T028.
- **US5 (Phase 7)**: Needs Foundational. Independent of all UI stories — the card's stored-field preference already exists from T006.
- **Polish (Phase 8)**: After the stories you intend to ship.

### Critical Path

```
T001/T002 → T003…T008 (derivation, verified) → T009…T017 (US1, MVP)
                          ├→ T018…T027 (US2, after US1)
                          ├→ T028…T031 (US3, after US1)
                          ├→ T032…T035 (US4)
                          └→ T036…T041 (US5)
```

### Parallel Opportunities

- T001 and T002 together.
- T019–T023 together — five different host files, no shared edits.
- T028 (`AgeChips.vue`), T032 (`AgeTimeline.vue`), T037 (`updateHomeSnapshot.js`) and T038 (backfill script) are each in their own file and can proceed in parallel once Foundational is done.
- T042 and T043 together.
- **Not parallel**: every task touching `BuildListCard.vue` (T009–T016, T018, T024–T026, T029, T030). That file is the feature's contention point.

---

## Parallel Example: User Story 2 host wiring

```bash
# Five separate files, no shared edits — safe to do together:
Task: "Pass context from src/views/builds/Builds.vue"           # T019
Task: "Pass context from src/views/builds/MyBuilds.vue"          # T020
Task: "Pass context from src/views/builds/MyFavorites.vue"       # T021
Task: "Add and forward context prop in src/components/home/BuildLaneTabs.vue"  # T022
Task: "Pass civ-locked from src/views/builds/Dashboard.vue"      # T023
```

---

## Implementation Strategy

### MVP (US1 only)

1. Phase 1 → Phase 2, and **do not proceed until T007 and T008 pass**. A flattening bug reports wrong times silently rather than failing.
2. Phase 3.
3. Stop and validate against the four fixtures at md+.
4. Shippable: the builds list, MyBuilds and MyFavorites all gain the rail. Home lanes show nothing yet, which is the pre-US5 state, not a bug.

### Incremental Delivery

1. **US1** → the rail on every steps-bearing list. *(MVP)*
2. **US2** → the card stops repeating what every row shares; two live defects fixed.
3. **US3** → mobile parity.
4. **US4** → the details-page timeline.
5. **US5** → persistence, home lanes, and the shape that makes a future "sort by Castle time" possible without a second migration.

Each increment is independently valuable and none breaks the previous.

### Solo Sequencing Note

This is a solo project, so the parallel markers indicate *safe-to-batch* work rather than staffing. The useful batching is T019–T023 (mechanical prop wiring, one commit) and the three independent new files T028 / T032 / T038.

---

## Notes

- `[P]` = different files, no dependencies on incomplete tasks.
- Conventional Commits, one concern per commit: the two `fix:` tasks (T025, T026) should be their own commits, separate from the feature work, since they stand alone as bug fixes.
- `timingsHelper.js` is read-only reuse. If it seems to need changing, the composable is compensating in the wrong place.
- `BuildLaneTabs.vue` serves two data shapes — Dashboard passes full documents (steps present), Home passes summary entries (stored field only). Test both.
- Treat [design-input.md](design-input.md) §2's Vuetify mappings as suggestions to verify against the codebase, not decisions to apply — it has already been wrong twice (the `derived` test, and `v-img` for the crests).
