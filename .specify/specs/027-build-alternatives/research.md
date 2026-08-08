# Phase 0 — Research: Build Order Alternatives

What reading the code changed about the design. Every finding below is a fact about this
repository, not a preference; each ends with what it decides.

The spec describes a feature in four surfaces. The code says it is really one change to a
**coordinate system**, plus four presentations of it. That reframing is R-1 and everything else
follows from it.

---

## R-1 — The flat step list is the app's shared coordinate system

Every derived reading of a build runs over a single flattened array, and the position in that array
is the identity of a step.

[`flattenSections(steps)`](../../../src/composables/builds/useAgeTimings.js#L97-L105) concatenates
`section.steps` in order. Its own docstring states the contract: *"the indices must line up with
getTimings()"*. Four things then consume that index space:

| Consumer | Reads | Keyed by |
|---|---|---|
| [`resolveStepTimes`](../../../src/composables/builds/timingsHelper.js#L87) | flat list | index-aligned output, one entry per step |
| [`redundantMask`](../../../src/composables/builds/stepVisibility.js#L105) | flat list | index-aligned boolean mask |
| [`getEcoSeries`](../../../src/composables/builds/useEcoSeries.js#L84) | flat list | `point.stepIndex` |
| [`getTimings`](../../../src/composables/builds/timingsHelper.js#L463) (focus mode) | flat list | `currentStepIndex` |

`redundantMask`'s docstring is explicit about why it returns a mask rather than a filtered list:
*"the resolver, the age boundaries and the economy series are all keyed by position in the flattened
list, and handing them a shorter array would silently shift every one of them."*

[`sectionOffsets`](../../../src/composables/builds/useAgeTimings.js#L124-L134) exists solely to
translate between the flat space and the section slices the table renders — added, per its comment,
because *"every caller that computed it for itself was one more place the two index spaces could
quietly disagree."*

**Decision.** An alternatives block must never reach any of those four. The branch is resolved
**during flattening**: `flattenSections(sections, selection)` walks the block, splices in the active
path's steps, and returns the same linear array of the same step objects it returns today. The four
consumers are then correct with **zero changes** — they keep receiving one ordered list of steps and
keep being right about it.

**Alternative rejected**: teaching each consumer about paths. That is four branch-aware
implementations of the same traversal, in four files whose entire shared contract is that they agree
on what step *n* is. It is precisely the drift `sectionOffsets` was extracted to prevent.

**Consequence to carry**: the flat index space becomes **selection-relative**. Step 14 under path A
and step 14 under path B are different steps. That is safe only because one selection is shared
(FR-014) — see R-6.

---

## R-2 — There are four flatteners, not one

`flattenSections` is *a* flattener, not *the* flattener. Three more walk sections independently:

1. [`FocusMode.vue:391-419`](../../../src/components/builds/FocusMode.vue#L391-L419) — its own
   `forEach` + `concat`, which additionally folds `section.gameplan` into the previous step's
   description.
2. [`useExportOverlayFormat.js:29-38`](../../../src/composables/converter/useExportOverlayFormat.js#L29-L38)
   — `convertSectionsToSteps`, which also stamps `step.age` from the section.
3. [`BuildOrderEditor.vue:247`](../../../src/components/builds/BuildOrderEditor.vue#L247) — uses the
   shared one (the only caller that does, besides `useEcoSeries` and `AgeTimeline`).

**Decision.** Phase 0 of implementation is a **behaviour-neutral refactor** routing (1) and (2)
through `flattenSections`, keeping their extra per-step work as arguments or as a post-pass. Only
then is there one place to teach about paths.

Skipping this does not fail loudly — it fails by emitting an alternatives block **into a step list**,
where it becomes a row with no time and no resources in the overlay export, and a blank card in focus
mode. FR-018 (export the active path flattened) is otherwise a second place branch logic must be
written correctly.

---

## R-3 — The economy chart already refuses builds that contain alternatives

This is the most consequential finding, and it is unprompted evidence for the feature.

[`useEcoSeries.js:36-55`](../../../src/composables/builds/useEcoSeries.js#L36-L55) defines
`REWIND_SECONDS = 120` and a `rewinds()` guard that **returns no chart at all** when a build's clock
jumps backwards by two minutes or more. The comment says why:

> *"A build that rewinds is not one economy. Authors describe variations by writing them out one
> after another in the same list — play to 6:15, then start again at 4:00 down a different path —
> and sorting the result by time interleaves two games into a single line that reads as one. That is
> worse than no chart: it looks like data."*

Authors are **already** writing alternatives. They have no primitive for it, so they concatenate the
paths and the site silently drops their economy chart. One real build is cited (6:15 → 4:00).

**Decisions:**

- The `rewinds()` guard **stays**, unchanged, for builds without alternatives. It is the correct
  answer to an undeclared variation.
- Once flattening resolves to one path (R-1), a build using the new primitive **cannot rewind** —
  every step in the returned list belongs to one linear play-through. Such builds get their chart
  back for free, with no change to `getEcoSeries` at all.
- This is worth a success measure the spec does not have: **builds that today lose their chart to
  `rewinds()` get one once their author converts them.** Add as SC-007.

---

## R-4 — The reading view and the editor are the same component

There is no separate read-only renderer.
[`BuildDetails.vue:248-255`](../../../src/views/builds/BuildDetails.vue#L248-L255) renders
`BuildOrderEditor` with `:readonly="true"`, which renders
[`BuildOrderSectionEditor.vue`](../../../src/components/builds/BuildOrderSectionEditor.vue) — **2196
lines** holding four layouts in one file, switched by `readonly` and by breakpoint:

| | Editable | Read-only |
|---|---|---|
| **Desktop** | `<table>` rows with `contenteditable` cells | same table, `v-if="readonly"` spans |
| **Mobile (xs)** | step cards + `step-insert-xs` dividers | step cards, `.gameplan-card-xs` |

The spec treats "build editor", "desktop steps" and "mobile steps" as three surfaces (US1, US2).
**They are three states of one file**, and this feature adds a fifth thing to each of them.

**Decision.** The pick control and the path lane go in **new child components**
(`AlternativesPick.vue`, `AlternativesLane.vue`), rendered by `BuildOrderSectionEditor` at the block's
position, not as more inline branches. Constitution Principle III mandates extraction for repeated UI
patterns; here the pattern repeats across four layout states in the largest file in the codebase.

**Risk recorded**: this is the single largest implementation surface in the feature. If any phase
overruns, it is this one.

---

## R-5 — Focus mode's queue is a mount-time snapshot, and FR-015 breaks that assumption

[`FocusMode.vue:385-493`](../../../src/components/builds/FocusMode.vue#L385-L493) builds its playback
queue **once**, in `onMounted`, and the construction is destructive:

1. flatten (its own loop, R-2);
2. `getTimings()` → `stepsTimings`, index-aligned;
3. `resolveStepTimes()` → `stepDerived`, index-aligned;
4. `readAgeUpMarkers` / `readAgeMarkers` → two more index-aligned arrays;
5. **mutates `step.time` in place** for every step (line 463-465);
6. **filters** the queue by `redundantMask` and filters all four parallel arrays to match
   (lines 475-482);
7. `currentStepIndex` indexes the result.

The comment at line 472 states the ordering constraint: *"After the timings, never before: the
resolver and the gate above are keyed by position in the full list, and filtering first would shift
every anchor."*

FR-015 requires switching path **mid-run, until the rejoin**. Every index in that list changes when
the block's contents change, and there are five parallel arrays plus a playback cursor to keep
aligned.

**Decision.** A switch **rebuilds the queue from scratch** (the same `onMounted` construction,
extracted into a `buildQueue(selection)` function) and then **re-seeks by elapsed time, not by
index**: the timer is authoritative and never stops, so the new cursor is the last step whose
`startTime <= totalElapsedTime`. The clock is the anchor.

This also answers FR-015's countdown requirement without special-casing: if the reader never picks,
the countdown fires, the queue is built with the fallback selection, and the seek lands where the
clock already is. **Nothing about auto-advance needs to know a choice happened.**

**Alternative rejected**: splicing only the block's span in place. It preserves indices before the
block and invalidates every index after it — the same rebuild, done partially, with five arrays to
patch by hand.

---

## R-6 — `stepIndex` crosses components, and is about to become ambiguous

[`useStepHighlight.js`](../../../src/composables/builds/useStepHighlight.js) is a provide/inject
channel between the economy plot and the build order table. Its `setFromTable` docstring is emphatic:
*"@param {number} stepIndex - Position in the FLATTENED step list, never a section-local index."*

Under R-1 that space is selection-relative. A highlight taken under path A and read under path B
points at a different step.

**Decisions:**

- FR-014's shared selection is not a nicety, it is what keeps this channel sound. Recorded as an
  invariant in [data-model.md](./data-model.md), not just as a requirement.
- Switching path **clears the highlight** (`clear()` on both holders). Cheap, and the alternative is
  a highlight that lies.
- `requestScroll(index)` has the same exposure and is covered by the same clear.

---

## R-7 — The economy legend already spends both of its gestures

[`EcoLines.vue:164-180`](../../../src/components/builds/EcoLines.vue#L164-L180) renders the resource
legend, where **hover dims the other four** (with a settle delay, line 243) and **click pins** one
(line 598: *"Pinning a resource is the legend's gesture — a click meaning two things"*).

FR-014 puts the path selector "in the legend below the chart". A sixth entry in that row would
inherit two gestures that mean something else.

**Decision.** The path selector is a **separate control in the legend region**, visually and
structurally distinct from the five resource entries — its own row beneath them, with the split mark
and the path titles. It shares the region, not the row.

---

## R-8 — The inline insert affordance already exists; FR-007 is precisely worded

The section editor already has an insert line **between every row**
([`ins-row` / `ins-zone`](../../../src/components/builds/BuildOrderSectionEditor.vue#L415-L416),
`+ Step`) and, on mobile, a 44px `step-insert-xs` divider between cards (line 210). What is
*bottom-anchored* is the pair of `v-btn` "add" buttons at lines 66 and 613.

FR-007 says the menu replaces "the current bottom-anchored add buttons" — that is exactly right, and
the inline lines are the natural anchor for the new menu.

**Decision.** The add menu attaches to the existing inline insert zones (which already carry the
insert-at-index semantics FR-006 needs) and replaces the two bottom buttons. The design-input note
that *"the add-menu conversion is a standalone improvement and can ship before the rest"* is
confirmed by the code: it touches no data.

---

## R-9 — "Note" in FR-007's menu has no writer today

The menu in FR-007 offers **Step, Note, Age up, Alternatives**. `step.gameplan` is **read** in three
places — [`saysNothing`](../../../src/composables/builds/stepVisibility.js#L45),
[`isNoteAt`](../../../src/composables/builds/timingsHelper.js#L486) (which exempts notes from the
timing requirement that gates autoplay), and
[`FocusMode.vue:881`](../../../src/components/builds/FocusMode.vue#L881) — and **written by nothing**.
`grep` finds no assignment outside `section.gameplan`.

So a step-level note is a shape the readers already understand and no editor can produce. Notes today
are **per section** (one `gameplan` per section, in a fixed row), not per position.

**Decision — taken (author's call, 2026-08-08).** Notes become a first-class item kind, carried in
`step.gameplan`. The readers are already correct; only the writer is missing. FR-019…FR-021 record it.

The three readers are not incidental — each one is a decision about notes that someone already made:

| Reader | What it already decides |
|---|---|
| [`saysNothing`](../../../src/composables/builds/stepVisibility.js#L45) | A note is content, so a note is never a redundant row |
| [`isNoteAt`](../../../src/composables/builds/timingsHelper.js#L486) | A note needs no timestamp, so it cannot disable autoplay |
| [`resourceSource`](../../../src/components/builds/FocusMode.vue#L878-L882) | *"A gameplan note states no economy of its own — it is commentary sitting between two steps — so it shows the position it was written about, which is the step before it."* |

Two consequences follow, and both are work:

1. **The editor's automatic note row goes.**
   [`BuildOrderSectionEditor.vue:560`](../../../src/components/builds/BuildOrderSectionEditor.vue#L560)
   renders the section note as `(hasVisibleContent(gameplan) && readonly) || !readonly` — read-only
   shows it only when it says something, **the editor always shows it**, as the last row of every
   section. That is the row FR-020 removes. Existing section notes keep rendering and stay editable
   where they are; no migration (FR-020).
2. **The overlay export would emit a note as an empty step.**
   [`convertStepToOverlayFormat`](../../../src/composables/converter/useExportOverlayFormat.js#L57-L74)
   reads `step.description` and never `step.gameplan`, so a note would export with empty notes,
   `villager_count: -1` and no time. FR-021 closes that. Worth noting this gap exists *today* for
   section notes too — they are folded into focus mode's step descriptions but dropped from the
   export entirely.

**Scope note kept rather than deleted**: this is a second item kind in a feature specified for one,
and it is now in scope by decision, not by drift. It stays in Phase 1, which touches no build data and
ships alone.

---

## R-10 — Age numbering is positional, so the block cannot be a section

[`getCurrentAge()`](../../../src/components/builds/BuildOrderEditor.vue#L477-L479) is
`sections.filter(sec => sec.type == "age").length` — the current age is the **count** of age
sections, not a stored number. `ageUp()` pushes an `ageUp` section then an `age` section (lines
436-447).

If an alternatives block were a section, the age section containing it would have to split in two,
and every subsequent age would shift by one. A build in Feudal would report Castle.

**Decision.** The block is an item **inside** `section.steps`, exactly as FR-001 says. This is now
grounded rather than assumed: it is not a stylistic preference but the only shape that leaves age
numbering intact.

Corollary confirming FR-003 (a block lives in one age section): a block cannot span an age-up because
an age-up **is** a section boundary, and the block is inside a section's step array. **FR-003 is
enforced by the data shape, not by validation.**

---

## R-11 — Legacy builds, and what FR-017 costs

Builds predating sections have no `section.type`; three places detect this and branch:
[`initializeSections`](../../../src/components/builds/BuildOrderEditor.vue#L556) migrates on load,
[`getEcoSeries`](../../../src/composables/builds/useEcoSeries.js#L89) bails, and
[`FocusMode.vue:387`](../../../src/components/builds/FocusMode.vue#L387) copies flat.

**Decision.** Alternatives exist only in sectioned builds. Legacy builds are untouched — they cannot
contain a block, so `flattenSections(sections, selection)` returns byte-identical output for them
with any selection. FR-017 is satisfied by the absence of the field: a step with no `kind` is an
ordinary step, so **every existing document parses identically with no migration** (data-model §2).

Storage is one Firestore document field (`build.steps`), so this is additive with **no new
collection, no rules change beyond the review Principle V requires, and no new read**. The selection
is view state and never persisted to Firestore (FR-001 Key Entities), so it costs nothing against the
project's read budget.

---

## Summary of decisions

| # | Decision | Drives |
|---|---|---|
| R-1 | Resolve the branch **in the flattener**; the four consumers stay branch-unaware | Whole architecture |
| R-2 | Refactor four flatteners into one **before** teaching it about paths | Phase 0 |
| R-3 | Keep `rewinds()`; converted builds regain their chart; add SC-007 | US3 |
| R-4 | Extract `AlternativesPick` / `AlternativesLane` rather than inline a fifth state | US1, US2 |
| R-5 | Focus mode **rebuilds the queue and re-seeks by clock**, never by index | US4 |
| R-6 | One shared selection is an invariant; switching clears the highlight | US2, US3 |
| R-7 | Path selector is its own control in the legend region, not a sixth entry | US3 |
| R-8 | Add menu attaches to the existing inline insert zones | US1 |
| R-9 | Notes become a real item kind in `step.gameplan`; the editor's automatic note row goes; the export learns to carry one | US1 |
| R-10 | Block is an item in `section.steps`; FR-003 is structural | Data model |
| R-11 | No migration, no schema change, no new read | Constitution IV, V |
