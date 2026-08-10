---

description: "Task list for 028 Age Markers"
---

# Tasks: Age Markers

**Input**: Design documents from `.specify/specs/028-age-markers/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/render-contract.md, quickstart.md

**Tests**: No test tasks. The project has no automated suite (constitution, Development Workflow), and
none was requested. Verification is `check:setup`, `check:steps`, `build`, and a browser — the
verification tasks below are explicit about which is which.

**Organization**: Grouped by user story. US1 ships alone and is the MVP.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel. **Rare here** — nearly every task edits the same file
  (`src/components/builds/BuildOrderSectionEditor.vue`), so it is marked only where the file genuinely
  differs.
- **[Story]**: US1, US2, US3. Setup, Foundational and Polish carry no story label.

## Path Conventions

Single frontend project. All paths are from the repository root.

---

## Phase 1: Setup

**Purpose**: Record the "before" state, because two success criteria are stated as "unchanged".

> **Not done, and superseded for SC-008.** This project has no browser automation (no Playwright or
> Puppeteer in `package.json`), so neither baseline could be captured by the implementing session.
> SC-008 was instead established by diff — see T026, which is stronger than a screenshot comparison.
> SC-010 still needs T013 in a browser; the static argument is in the implementation notes.

- [ ] T001 Capture the baseline for SC-010: open a build containing an age-up **and** an alternatives
  block, and record every `data-step-index` value the desktop list renders, plus the economy
  crosshair landing on a known step. Save to the scratchpad — this is the only evidence that the new
  row costs no index drift.
- [ ] T002 [P] Capture the baseline for SC-008: screenshot the mobile (`xs`) build list in both
  themes, on a build with an age-up and one with an alternatives block. The mobile half must be
  pixel-identical at the end.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The step table's render guard. It blocks US1 (the advance row needs a table to live in)
and it is the whole of FR-031 (a note must not depend on the step count).

**⚠️ CRITICAL**: US1 cannot start until T004 is done.

- [X] T003 Add a `hasTableRows` computed to `setup()` in
  `src/components/builds/BuildOrderSectionEditor.vue`, true when the section has any row to draw:
  at least one step, **or** a section note with visible content (`hasVisibleContent(gameplan)`),
  **or** an advance row to draw (`section.type === 'ageUp' && !isBareAgeUp`). Return it from
  `setup()`.
- [X] T004 Replace `v-if="steps?.length"` on the desktop `<v-table>` at
  `src/components/builds/BuildOrderSectionEditor.vue:538` with `v-if="hasTableRows"`, and comment the
  guard with **why** it is not the step count: there are two kinds of note, and the section note
  (`section.gameplan`) is a section field with no index, so gating it on a count of items it is not
  among loses it. Without the comment this gets "simplified" back.
- [ ] T005 Verify FR-031 in a browser: a section with a note and **no** steps shows its note on
  desktop; a section whose note was typed and deleted (leaving `"<br>"`) shows **nothing at all** —
  no row, no header, no empty card. Check both reading and editing views.

**Checkpoint**: notes can no longer be lost, and the table exists wherever a marker needs to sit in it.

---

## Phase 3: User Story 1 — Tell what I do apart from what happens (Priority: P1) 🎯 MVP

**Goal**: The advance becomes a plain full-width row inside the table; the arrival becomes the only
boxed element in the list and carries its time.

**Independent Test**: Open a desktop build with three age-ups → each advance is a plain row at step-row
height carrying a glyph and a label and no time; each arrival is the only boxed bar, with the age
asset, the age name and the arrival time; nothing else in the list is boxed.

- [X] T006 [US1] Add an `arrivalTimes` computed to `src/components/builds/BuildOrderEditor.vue` beside
  `resolvedTimes` (`:254`), mapping each section index to `flatTimes[offsets[index + 1]]` — the
  resolved entry at the start of the next section, which is the same index `getAgeTimings` resolves
  as an age's arrival. `null` where absent, which includes the whole editing view because `flatTimes`
  short-circuits on `!readonly` (`:244`).
- [X] T007 [US1] Pass `:arrivalTime="arrivalTimes[index]"` to `BuildOrderSectionEditor` in
  `src/components/builds/BuildOrderEditor.vue:116`, and declare the prop in the component's props
  list (`:1040`–`:1060`). Shape per `contracts/render-contract.md`.
- [X] T008 [US1] Render the arrival time right-aligned on the `.age-plate-md` bar at
  `src/components/builds/BuildOrderSectionEditor.vue:971`, formatted with `formatAgeTime` and
  prefixed `~` unless `provenance === "stated"` — the same rule `resolvedTime()` applies at `:1113`.
  Render **no** time element at all when it is `null`; never a placeholder or a zero.
- [X] T009 [US1] Add the advance row as the first `<tr>` of an `ageUp` section's table in
  `src/components/builds/BuildOrderSectionEditor.vue`, mirroring the merge row's structure at
  `:648`: icon cell (`mdi-arrow-up-bold`), `:colspan="7"` label cell reading
  `Advancing to {{ targetAgeName }}`, and the `step-actions` cell. **No** `data-step-index`, no
  `@mousedown`/`@mouseover`/`@pointermove` handlers — it is a marker, not a step (FR-027).
- [X] T010 [US1] Move the age-down ✕ (`isLastAgeUp`, `@click="$emit('ageDownRequested')"`) into the
  advance row's `step-actions` cell so it lands in the same optical column as every step row's ✕
  (FR-026).
- [X] T011 [US1] Delete the `.age-marker-md` banner markup at
  `src/components/builds/BuildOrderSectionEditor.vue:531`, and delete its CSS at `:2788`–`:2825`
  including the `.age-marker-md .row-x` height cap — a full-width row is not fighting the column grid,
  so the workaround retires with the banner it was written for.
- [X] T012 [US1] Style `.age-advance-row` in the same stylesheet: step-row height, the standard 1px
  rules (do **not** copy `.alt-row`'s `border-top: none`), gold `--v-theme-accent` label in the
  annotation treatment the merge marker uses. No box, no fill, no tint.
- [ ] T013 [US1] Verify against T001: every `data-step-index` value is unchanged, and the economy
  crosshair still lands on the same step (SC-010). Then verify the advance row does nothing on hover
  and does not light up from the timeline (FR-027).
- [X] T014 [US1] Run `npm run check:setup`, `npm run check:steps`, `npm run build`.

**Checkpoint**: US1 is shippable on its own. It fixes four of the six observations in the analysis and
halves the boxed elements (SC-001).

---

## Phase 4: User Story 2 — See the age-up as a phase (Priority: P2)

**Goal**: A gold rail runs beside the transition's rows. No added row, no indent, no empty gutter.

**Independent Test**: A build whose age-up has intermediate steps shows a rail beside the advance row
and every row down to the boundary bar, and no others. One whose age-up has no steps shows no rail
and no gutter.

**Note**: `age-lane-md` is **already applied** to every row that needs it — step rows (`:673`), note
rows (`:754`), the section-note row (`:906`) — and has no CSS anywhere. This phase is mostly a
stylesheet block.

- [X] T015 [US2] Add `.age-advance-row` to the set of rows carrying `age-lane-md`, so the run starts
  at the advance row rather than below it (FR-009, confirmed against the v2 reference frame).
- [X] T016 [US2] Write the `.age-lane-md` rail rules in
  `src/components/builds/BuildOrderSectionEditor.vue`, copying the shape of `.alt-inside` at
  `:2991`–`:3005` with `--v-theme-accent`: `position: relative` on `td:first-child`, and a `::before`
  at `left: -3px; top: -2px; bottom: -2px; width: 3px; pointer-events: none`. **Keep the 2px
  overhang** — it exists because a flush rail nicks at every row seam and at the zero-height insert
  row. **No `border-radius`** (research R6).
- [X] T017 [US2] Add the gold row fade to `.age-lane-md`, matching `.alt-inside`'s gradient at
  `:2968` with `--v-theme-accent`: strongest at the rail, gone by the description, so the
  colour-coded resource pills are not dulled.
- [X] T018 [US2] Trim the run's ends to `-1px` on the first and last railed row of a transition, the
  way `.alt-row--start` / `.alt-row--end` do at `:3011`–`:3016`. The first is the advance row; the
  last is the final row of the `ageUp` section's table.
- [ ] T019 [US2] Verify in a browser: no column shifts between a railed and an unrailed row at
  several desktop widths (SC-002); an age-up with no steps shows no rail and no gutter (SC-006); the
  boundary bar is below the run's end and is not itself railed.

**Checkpoint**: the transition reads as a phase. US1 + US2 is the full feature for any build without
alternatives.

---

## Phase 5: User Story 3 — Follow one path without losing the age-up (Priority: P3)

**Goal**: One gutter, painting the innermost open context. Gold, then the alternatives colour for the
block, then gold again — as one unbroken line.

**Independent Test**: Author an alternatives block inside an age-up, save, reopen on desktop → gold
before the block, alternatives colour from the path tabs through the merge row, gold again after it
and up to the boundary bar; one continuous line; no row indents.

**Depends on**: `027-build-alternatives`, which has landed.

- [X] T020 [US3] Gate every `.age-lane-md` rule from T016 and T017 on
  `:not(.alt-inside):not(.alt-row)` so the innermost context wins (FR-015). State it explicitly
  rather than relying on stylesheet order — a reorder would otherwise flip the behaviour silently.
- [ ] T021 [US3] Verify the seam in a browser: a gold → alternatives → gold run shows no gap and no
  interior corner (SC-005). The segments overlap rather than abut, so the colour change happens
  within ≤3px; confirm it does not read as a break.
- [ ] T022 [US3] Verify the merge row carries the alternatives colour and the first row **after** it
  is gold again (FR-016).
- [ ] T023 [US3] Verify FR-020 by attempting it: in the editor, try to move an alternatives block's
  merge marker past the boundary bar of the transition it opened inside. It must be refused. This is
  a **test**, not an implementation — the section constraint from `027` already enforces it, because
  a transition is one `ageUp` section.

**Checkpoint**: all three stories functional.

---

## Phase 6: Polish & Cross-Cutting

- [X] T024 Add `role="group"` and an `aria-label` naming the transition to the `ageUp` section's card
  in `src/components/builds/BuildOrderSectionEditor.vue:529` (FR-029). Build the label from the
  internal age-name map, not from author content. This is the component's **first** `role`/`aria-*`
  attribute — keep it the only one; do not label rows.
- [X] T025 Light-theme pass on both rail colours (FR-025, SC-007). — **Root cause found and fixed, not
  tuned.** The two lanes were identical in light mode because `accent` and `alternative` are both
  `#294790` there. Added an `age` theme token, gold in both themes, used for the lane's rail and fills
  only; text stays on `accent`, because gold text on the light surface is the 2.1:1 failure that made
  `accent` navy in the first place. See research R13. **Whether `#CCAA55` at these alphas is strong
  enough on `#FAFAFA` is still a judgement only a browser can make** — `secondary-darken-1` `#8D7B4B`
  is the darker option if the rail reads too faint. Gold in light theme is `#CCAA55`
  on a `#FAFAFA` surface, and the alphas were tuned for a blue with good value contrast in both
  themes. Adjusting the gold rail's alpha is in scope; introducing a colour is not. **This is the
  task most likely to need real tuning, and nothing but a browser can judge it.**
- [X] T026 Verify the mobile list against T002: pixel-identical at `xs` in both themes (SC-008,
  FR-022). Confirm nothing above `:528` was edited. — **Done by diff instead of by screenshot, which
  is stronger evidence**: every hunk in
  `src/components/builds/BuildOrderSectionEditor.vue` starts at old line 529 or later, and line 528 is
  the `<!--Desktop UI-->` marker. The mobile half is byte-identical, so there is nothing for a
  screenshot to disagree about.
- [ ] T027 Final verification sweep per `quickstart.md`: `npm run check:setup`, `npm run check:steps`,
  `npm run build`, then the browser table — both markers, column alignment, seams, empty transition,
  the editor's ✕ column and row height, both themes. **Report which of these were actually checked
  and which were not.** A green build cannot see any of them.
- [X] T028 [P] Reconcile `CLAUDE.md`: the rule "per-element rails cannot span siblings, so a lane
  belongs on a wrapper" reads as universal and is not — it was learned on the **mobile card list**,
  where cards carry their own margins and borders. On the desktop table the shipped solution is the
  opposite (per-row pseudo-elements with a deliberate overhang). Add the scope qualifier, in place;
  do not add a second note saying the reverse.
- [X] T029 Harvest per `CLAUDE.md` after the push: what the work taught, written once, cause not
  symptom. Candidates already known — the two kinds of note and why only one was lost; that
  `age-lane-md` shipped as a dead class; that `isBareAgeUp` is deliberate.

---

## Dependencies & Execution Order

### Phase dependencies

- **Setup (T001–T002)**: no dependencies. Must happen **before** any edit, or the baselines are
  worthless.
- **Foundational (T003–T005)**: blocks US1. Also delivers FR-031 on its own.
- **US1 (T006–T014)**: needs Foundational. Independently shippable.
- **US2 (T015–T019)**: needs US1 — the run starts at the advance row, which US1 creates.
- **US3 (T020–T023)**: needs US2 — it gates rules US2 writes.
- **Polish (T024–T029)**: T024 needs US1; T025 needs US2 and US3; T026–T029 need everything.

### Why the stories are not independent here

The template assumes stories can be built in parallel. They cannot in this feature, and pretending
otherwise would be a lie: US2 paints a rail whose run begins on the row US1 creates, and US3 is a
precedence gate on the rules US2 writes. They are independently **shippable in sequence** — US1
alone is a real improvement — but not independently **buildable**.

### Parallel opportunities

Almost none, and that is the honest answer for a two-file feature edited by one person:

- T002 runs alongside T001 (different surface, no edits).
- T028 touches `CLAUDE.md` and nothing else.

Everything else edits `src/components/builds/BuildOrderSectionEditor.vue`.

---

## Implementation Strategy

### MVP

1. Phase 1 (baselines) → Phase 2 (guard) → Phase 3 (US1).
2. **Stop and verify.** US1 plus FR-031 is a shippable improvement on its own: the action reads as an
   action, the boundary as a boundary, the arrival states its time, and no note can be lost.
3. Ship it before starting the rail if the appetite is smaller — the design says so explicitly, and
   nothing in US2 or US3 is owed anything by US1.

### Then

4. US2 → verify → US3 → verify.
5. Polish, with T025 (light theme) treated as real work rather than a formality.

---

## Harvest (2026-08-10, after the push)

Written once, in the place that will be read again. Nothing here is duplicated
into memory or into `CLAUDE.md`; the pointers say where each thing actually lives.

**Where each lesson went**

| What the work taught | Where it lives now |
|---|---|
| A cause recorded without its conditions gets misapplied — the "rails belong on a wrapper" rule was learned on the mobile card list and the desktop table needs the opposite | `CLAUDE.md`, rewritten in place with the conditions attached |
| Two kinds of note, and only one is in `steps` | code comment at the guard, research R9, and the existing traversal memory extended |
| A CSS fix that appears to do nothing was usually discarded, not wrong | a `feedback` memory; the two repo-specific cases are commented beside the rules themselves |
| `accent` is navy in the light theme, so gold for the age lane needs its own token | `main.js`, next to the `alternative` token that exists for the mirror reason |
| The rail technique, the bracket container, and `age-lane-md` were already built | research R1–R3 — this is the finding that most changed the shape of the work |

**Scope that changed during the feature**

- **Mobile came into scope, twice, deliberately.** It was excluded on the
  reasonable belief that the desktop work was desktop-only. Both exclusions
  turned out to be wrong for the same reason: the light-theme colour collision
  and the unlabelled merge marker were never desktop problems, and fixing one
  surface would have left the colour rule true in three places out of four.
  FR-022 now describes what is actually protected — the layout — and SC-008's
  "pixel-identical" claim is retired rather than quietly failed.
- **The arrival time was built and then deleted.** Spec'd, plumbed through a new
  prop, implemented, and removed a session later when the revised brief landed.
  The plumbing went with it; nothing dead was left behind. Recorded because the
  cost was real and the reversal was correct.

**What a future session should not re-litigate**

Read `design-input.md` before proposing nested rails, a twin stripe, or one
marker per age — all three were built and rejected, with reasons. Read research
R8 before "fixing" `isBareAgeUp`, and R6 before rounding the rail.

**Still open, and honestly so:** T001, T002, T005, T013, T019, T021–T023, T027.
Every one needs a browser. The feature's whole subject — colour, seams,
alignment, both themes — is unverified by anything that ran here.

## Implementation notes (2026-08-10)

**Two computeds, not one.** The plan foresaw `hasTableRows`. A second was needed: `hasTransitionBody`
(`steps.length || hasVisibleContent(gameplan)`). Without it the rail opened on a *stepless* age-up —
the run starts at the advance row, so the advance row alone painted a gutter with nothing inside it,
which is exactly what FR-012 and SC-006 forbid. The two questions are genuinely different: "is there
a table" includes the advance row, "is there a transition to bracket" must not.

**SC-010 argued statically, still unverified.** `data-step-index` is emitted from
`v-for="(item, index) in steps"`, which is untouched; the advance row sits outside that loop, carries
no index, and is `.age-advance-row` rather than `.step-row`, so the crosshair's
`querySelector('tr.step-row[data-step-index=…]')` cannot match it. That is an argument, not a
measurement — T013 still stands.

**`.age-advance-row > td:first-child::before { top: -1px }` is inert when unrailed.** The pseudo-element
only gets `content` from the `.age-lane-md` rule, so on a stepless age-up the trim rule sets a
property on nothing. Intentional — the alternative was duplicating the gate.

**Readonly empty age-ups keep drawing only the bar.** `isBareAgeUp` was left exactly as it was; a
build imported from the overlay format has no steps between the markers and gets no advance row in the
reading view (research R8). The editor still draws one.

**The advance row draws its own top rule.** Reported from a screenshot: nothing separated the last
step of an age from the advance below it. Cause — the previous section's last row has its bottom
border deliberately stripped so it does not double with its card's edge (`:3316`), and the two rows
are in different tables in different cards. The banner never showed the gap because it was a bordered
box in its own margin; a plain row has to draw the separator itself, with the same declaration every
other separator uses. This is FR-001's "same 1px top and bottom rules" made real rather than assumed.

**The label drops the word "Age".** `targetAgeShortName` strips the trailing " Age", so the advance
reads "ADVANCING TO FEUDAL" against the bar's "FEUDAL AGE" — FR-004, and observation 6 of the
analysis (the word appeared four times in eight rows). The first implementation missed it. Mobile
still uses the full `targetAgeName` and is untouched.

**The run's ends are asymmetric: top `-1px`, bottom `0`.** Settled by eye, and the asymmetry is the
point — each end stops where the thing it meets actually is. The advance row draws its own 1px top
rule and the run begins *at* that line, so the top includes it; the closing row's bottom border is
stripped by the `:last-child` rule, so there is nothing down there to include and reaching for one
puts the rail in the card's padding.

**The route there, kept because the wrong turns are the instructive part.** Reported from a screenshot as the rail overdrawing
the hairline at both ends. Cause — the `-1px` end trim was copied from the alternatives rail, where it
is correct *because* that rail's opening row carries `border-top: none` and is reaching out to meet a
separator owned by the row above. Neither end of an age run is in that position: the advance row draws
its own top rule (so the overhang paints over a hairline the row already owns), and the closing row's
bottom border is stripped by the `:last-child` rule (so the overhang reaches into card padding for a
separator that is not there). Ends are now `0`; the 2px overhang stays for interior seams, which is
the only thing it was ever for. **The lesson is not "use 0" — it is that an end trim is a function of
which element owns the boundary, so it cannot be copied between two lanes without checking.**

The first attempt at that fix did nothing, for a second reason worth recording: the base rail rule
carries three class-level selectors (`.age-lane-md:not(.alt-row):not(.alt-inside)`), and the end-trim
override carried two, so it silently lost. The bottom trim happened to be specific enough and the top
was not — one run, two ends, behaving differently with nothing at the declaration to explain it.
**Any rule overriding the guarded rail rule must repeat the guard**, which is now stated in the
stylesheet beside both trims. This is the cost of gating on `:not()` rather than source order; it is
still the right trade, because source order fails silently in a worse way.

**Possible double hairline, flagged not tuned.** In the *editor*, a stepless age-up has no trailing
insert row, so the advance row is not `:last-child` and keeps its bottom border directly above the
arrival bar's top border. Two adjacent hairlines. Whether that reads as heavy needs a browser; it is
not worth guessing a fix from here.

**One consequence of the guard, accepted.** A readonly section with a note and no steps now shows both
its note row and the existing "No steps yet" line. Both statements are true and neither is misleading,
so nothing was added to suppress it.

## Notes

- Nothing in this feature writes to Firestore. The note migration the user decided on is a
  **separate** feature; it must not ride along in a rendering commit.
- Do not "fix" `isBareAgeUp`. In the reading view an empty age-up deliberately draws only the boundary
  bar; imported builds rely on it.
- Do not touch anything above `src/components/builds/BuildOrderSectionEditor.vue:528` — that is the
  mobile list, and SC-008 says it must be identical.
- Commit per phase, Conventional Commits, and only when asked.
