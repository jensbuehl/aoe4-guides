# Tasks: Season Rollover

**Input**: Design documents from `.specify/specs/041-season-rollover/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/season-provider.md, quickstart.md

**Tests**: the plan makes `npm run check:seasons` a deliverable (research R9), so each story adds its cases
to that script. There is no separate test framework.

**Due**: in production before 2026-12-01. If it slips, use the fallback in quickstart.md: add Season 15 by
hand, without `endDate`.

**Organization**: Tasks are grouped by user story. Nearly all the code lives in one file,
`src/composables/filter/seasonDefaultProvider.js`, so tasks touching it run in sequence. Only call-site
edits in other files are marked [P].

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup

**Purpose**: Wire up the check before there is anything to check, so every later task can run it.

- [x] T001 Create `scripts/check-seasons.mjs`. It imports from `../src/composables/filter/seasonDefaultProvider.js`, collects failures into a list, prints each one and exits 1 if there are any. Start it with a header comment in the style of `scripts/check-steps.mjs`. The comment must say what the check guards (a gap, an overlap or a stale default surfaces only on a season's start day, months after the edit that caused it) and that the script is **CI-only**: it imports from `src/`, so it must never run on Netlify (CLAUDE.md, Node 22.1.0 rule).
- [x] T002 [P] Add `"check:seasons": "node scripts/check-seasons.mjs"` to `package.json`. Add a `- run: npm run check:seasons` step to `.github/workflows/ci.yml` after `check:plurals`, with a one-line comment saying why it is there.

---

## Phase 2: Foundational (provider core)

**Purpose**: Resolved end dates and the started-only filter. US1 and US2 both read them.

**⚠️ CRITICAL**: No story work can begin until this phase is complete.

- [x] T003 In `src/composables/filter/seasonDefaultProvider.js`, rename the literal list to a module-private `HAND_WRITTEN` constant (newest first, unchanged apart from the next point). Remove Season 14's `endDate` (research R3). Add exported `buildSeasons(now = new Date(), hand = HAND_WRITTEN)`. It returns **new** objects and never mutates `hand`. Each object gets a resolved `endDate` by R3: (1) its own `endDate`; (2) otherwise the day before the next-newer entry's `startDate`; (3) otherwise the day before the first scheduled start (1 Mar, 1 Jun, 1 Sep or 1 Dec at local midnight) strictly after its own `startDate`. Ends are resolved against the **full** list first, and only then are entries with `startDate > now` dropped (R4, R5). Set `export const seasons = ref(buildSeasons())`. Do all day arithmetic with `setDate(getDate() ± n)`, never with milliseconds (R6).
- [x] T004 In the same file, make `isSeasonCurrent(season, now)` test `startDate <= now < (endDate + 1 calendar day)`. Make `seasonDateRange` read `season.endDate` and delete its `Since …` branch. Delete `seasonEndDate`, after confirming with `grep -rn seasonEndDate src` that the provider is its only user. Make `getSeasonByTitle` search `seasons.value`, the started seasons. All of this follows contracts/season-provider.md.
- [x] T005 In `scripts/check-seasons.mjs`, add the baseline cases (data-model invariants, FR-012). `buildSeasons(new Date(2026, 10, 24))` returns Seasons 14 → 1 with the same `startDate`s as `HAND_WRITTEN`. Season 13 ends 2026-08-31 and Season 14 ends 2026-11-30. Every adjacent pair is contiguous (`next.startDate` = `prev.endDate` + 1 day). No entry starts after `now`. Titles are consecutive. `seasonDateRange` of Season 14 is `"Sep 1 – Nov 30, 2026"`. Run `npm run check:seasons`; it must pass.

**Checkpoint**: today's site behaves as before. The list is the same, and every season, Season 14 included, shows an end date.

---

## Phase 3: User Story 1 - A new build starts in the season running today (P1) 🎯 MVP

**Goal**: The default season is the one whose dates include today, never just the newest entry (FR-001–003).

**Independent Test**: With the current list, a new build and a season-less overlay import both get
Season 14. A Season 15 written by hand ahead of 1 December is neither listed nor the default before that
day.

- [x] T006 [US1] In `src/composables/filter/seasonDefaultProvider.js`, export `currentSeason(list = seasons.value, now = new Date())`, which returns `list.find((s) => isSeasonCurrent(s, now)) ?? list[0] ?? <Season 1 built from HAND_WRITTEN, unfiltered>` (research R8). It must never return `undefined`. Its JSDoc says why: the editor reads `.title` from it in `setup()`, and a throw there blanks the editor behind a green build.
- [x] T007 [P] [US1] In `src/views/builds/BuildEditor.vue:473`, replace `seasons.value[0].title` with `currentSeason().title`, and add `currentSeason` to the import on line 318. `seasons` stays imported for the `:items` list.
- [x] T008 [P] [US1] In `src/composables/converter/useImportOverlayFormat.js:22`, replace `seasons.value[0].title` with `currentSeason().title`, and update the import on line 2. Keep the existing comment, which still holds.
- [x] T009 [US1] In `scripts/check-seasons.mjs`, add US1 cases. `currentSeason(buildSeasons(d), d)` is Season 14 for 2026-09-01, 2026-11-24 and 2026-11-30 23:59. With a synthetic `hand` that puts a complete Season 15 entry (start 2026-12-01) before `HAND_WRITTEN`, the list on 2026-11-30 does not contain Season 15 and its current season is Season 14 (spec US1 scenario 3; US3 scenario 3). A `now` before 2022-04-07 yields an empty list, and `currentSeason(thatList, now).title` is `"Season 1"` (FR-003).
- [x] T010 [US1] Run `npm run check:setup` and `npm run build` (BuildEditor.vue changed; CLAUDE.md Verification), then quickstart §2 in `npm run dev`: a new build shows Season 14, a season-less overlay import shows Season 14, a remix of a Season 12 build stays Season 12, and a restored draft whose season you changed to Season 11 comes back as Season 11 (FR-011).

**Checkpoint**: The default is right on every day the list covers. On its own this phase plus a hand-added Season 15 would get through 1 December.

---

## Phase 4: User Story 2 - Each new season appears on its start day by itself (P1)

**Goal**: Seasons after the newest hand-written one are calculated from the schedule (FR-004, FR-005,
FR-008–010).

**Independent Test**: The day-by-day check from 2026-09-01 to 2030-12-31 passes. In the browser with a
faked clock, Season 15 appears on 2026-12-01 and not on 2026-11-30.

- [x] T011 [US2] In `buildSeasons` (`src/composables/filter/seasonDefaultProvider.js`), after resolving the hand-written ends, loop: take the newest entry; the candidate start is its `endDate` + 1 day; stop if that is after `now`; otherwise prepend `{ title: "Season " + (n + 1), tagline: <name> + " " + <year>, startDate, endDate: day before the next scheduled start strictly after startDate }`. Here `n` is read from the newest title with `/Season (\d+)/`. The name comes from the quarter containing the start month (Mar–May Spring, Jun–Aug Summer, Sep–Nov Fall, Dec–Feb Winter), and the year is the start year except for a Jan/Feb start, which takes the previous year (research R7). Leave `expansion` unset.
- [x] T012 [US2] In `scripts/check-seasons.mjs`, add the day-by-day loop for every local day from 2026-09-01 to 2030-12-31 (1,583 days; SC-002, SC-003). Each day the baseline invariants from T005 must hold, exactly one listed season must contain the day, and `currentSeason` must return it. Add pinned cases: on 2026-12-01, Season 15 is "Winter 2026", 2026-12-01 → 2027-02-28, and is current; on 2027-03-01, Season 16 is "Spring 2027" and Season 15 ends 2027-02-28; on 2028-02-29, the current season is "Winter 2027", ending 2028-02-29; `seasonDateRange` of Season 15 is `"Dec 1, 2026 – Feb 28, 2027"`.
- [x] T013 [US2] Run quickstart §3, the throwaway Puppeteer with a faked clock in the scratchpad, never added to the repo, at 2026-11-30 23:00, 2026-12-01 09:00 and 2027-03-01 09:00. Check the editor default, the filter list, the season tooltip's date range and the "current" marker. Report what was and was not seen.

**Checkpoint**: The rollover needs no hand-written entry. The deadline is met once this phase is in production.

---

## Phase 5: User Story 3 - The owner can still describe a season by hand (P3)

**Goal**: A hand-written entry replaces the calculated one, and a break shortens or lengthens exactly one
season (FR-007).

**Independent Test**: The synthetic hand lists in the check produce the dates in spec US3 scenarios 1–2.

- [x] T014 [US3] In `scripts/check-seasons.mjs`, add synthetic `hand` cases. (a) A complete Season 15 with `expansion: "X"`: on 2027-01-15 exactly one Season 15 is listed, it carries the expansion, and the day-by-day invariants hold to 2030 with that list. (b) Season 15 with `endDate` 2027-03-09: Season 16 is 2027-03-10 → 2027-05-31 and Season 17 starts 2027-06-01. (c) A Season 15 starting 2027-01-10 after a Season 14 with `endDate` 2027-01-09: Season 15 is calculated as "Winter 2026" (the R7 Jan/Feb case).
- [x] T015 [US3] Rewrite the header comment of `src/composables/filter/seasonDefaultProvider.js` so it is the owner's instruction sheet. It must say that seasons after the newest entry are calculated from the schedule; that an entry is written only to name an expansion or record a break; what an `endDate` now means (this season broke the schedule, R3); that an entry may be written before its start day and stays hidden until then; and to run `npm run check:seasons` after any edit.

**Checkpoint**: All three stories pass the check.

---

## Phase 6: Polish & Cross-Cutting

- [x] T016 Run quickstart §1's mutation test. Give Season 14 `endDate: new Date(2026, 10, 25)`: `check:seasons` must fail. Retitle Season 14 as "Season 16": it must fail. Revert both and confirm it passes again.
- [x] T017 [P] In `CLAUDE.md`, in the Netlify Node 22.1.0 rule, add `check-seasons.mjs` to the scripts that are exempt because they run only on GitHub Actions. That sentence currently names `refresh-snapshot.mjs` and `check-plurals.mjs`.
- [x] T018 [P] Confirm that the `mdi-*` icon list is unchanged (no new icons), that `grep -rn "seasons.value\[0\]" src` returns nothing, and that `seasonDefaultProvider.js` imports nothing but `vue`. The last one is SC-006: no database or network access when working out the season.
- [x] T019 After the push, harvest (CLAUDE.md): reconcile spec, plan and research with anything that changed during implementation, and record the result of T013 here.

---

## Dependencies & Execution Order

- **Setup (T001–T002)** comes first. T002 is [P] with T001.
- **Foundational (T003–T005)** runs in sequence (same file, then the check), and blocks everything else.
- **US1 (T006–T010)** needs Foundational. T007 and T008 are [P] with each other, after T006.
- **US2 (T011–T013)** needs Foundational. In practice it runs after US1, because T012 asserts through
  `currentSeason` (T006).
- **US3 (T014–T015)** needs T011, because a break only matters once seasons are calculated after it.
- **Polish (T016–T019)** comes after all stories. T017 and T018 are [P].

## Parallel Example

```text
After T006:  T007 (BuildEditor.vue)  ‖  T008 (useImportOverlayFormat.js)
Polish:      T017 (CLAUDE.md)        ‖  T018 (greps)
```

## Implementation Strategy

- **The minimum that meets the deadline is Phases 1–4.** US1 alone still needs a hand-written Season 15;
  US2 removes that need.
- US3 is mostly check cases and the instruction comment. The behaviour already falls out of T003 and T011,
  so it is cheap to finish in the same sitting.
- One commit for the code (T001–T015), when the owner asks for it. Never commit without being asked.

## Implementation notes (2026-11-24)

- **T010**: the editor default was **not** seen in a browser. `/builds/new` requires a signed-in, verified
  account, which the rig has no way to get. The default is one line (`currentSeason().title`). Its value is
  covered by `check:seasons` on every day to 2030, and `check:setup` confirms the setup() names resolve. The
  manual pass on remixes and drafts is still to be done by the owner, signed in.
- **T013**: the built app was served with `vite preview`, with the clock faked before load, at 1280px. On the
  build list's season filter:
  - 2026-11-24 and 2026-11-30 23:00: the list starts at Season 14, whose tooltip reads "Fall 2026 · Sep 1 –
    Nov 30, 2026 · current season".
  - 2026-12-01 09:00: the list starts at Season 15, "Winter 2026 · Dec 1, 2026 – Feb 28, 2027 · current
    season".
  - 2027-03-01 09:00: Season 16, "Spring 2027 · Mar 1 – May 31, 2027 · current season", with Season 15
    showing "Dec 1, 2026 – Feb 28, 2027".
  - No page errors on any date. Not checked: phone widths, where dates are shown as a subtitle instead of a
    tooltip (same `seasonDateRange`), and the light theme.
- **T016**: an `endDate` of Nov 25 on Season 14 made the check report 8 failures, and retitling it "Season 16"
  made it report 13. It passes again after reverting both.
