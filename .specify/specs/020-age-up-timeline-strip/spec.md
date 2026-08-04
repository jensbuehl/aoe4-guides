# Feature Specification: Age-Up Timeline Strip — Timings In, Chips Out

**Feature Branch**: `020-age-up-timeline-strip`

**Created**: 2026-08-04

**Status**: Draft

**Input**: User description: "Scanning the builds list tells you civ, author, season, map, views — but not the one thing that actually determines whether a build is what you want: when does it hit Feudal and Castle? A 2 TC Castle-at-9:00 boom and a Feudal-at-3:20 all-in are indistinguishable in the list. You have to open every card." Extended by the `013-build-list-timings` design handoff: add the age timings, quiet the passive metadata, make what's shown depend on the list's context, and add a timeline strip to the build details page.

**Design package**: [design-input.md](design-input.md) (tokens, mock→Vuetify mapping, visibility matrix, derivation algorithm, placement, custom CSS) · [assets/Build List Proposal.html](assets/Build%20List%20Proposal.html) (interactive reference) · [design-handoff-README.md](design-handoff-README.md) (original handoff intent) · [tasks.md](tasks.md) (inherited task breakdown, pre-`/speckit-plan`)

## Clarifications

### Session 2026-08-04

- Q: Where are the pre-computed home-lane timings produced? → A: Option B — computed on save in the client write path and stored on the build document as `ageTimings`; the summary job only adds the field to its whitelist. Chosen because the derivation depends on ES modules in `src/composables` that `functions/` (CommonJS, separate package) cannot import, so computing in the job would mean a second copy of the logic and structural drift risk against FR-030.
- Q: Must `ageTimings` be usable for future Firestore sorting (fastest Feudal, sort by Castle time)? → A: Yes — stored as a **map**, not an array of maps, so `orderBy('ageTimings.castle.t')` works. Ages never reached omit their key entirely so those builds drop out of the sort rather than sorting first.
- Q: Accept the taller md card the three-row rail needs, or hold today's height? → A: Option A — accept it. `md` grows 90 → 112 px and `xs` 90 → 96 px; other breakpoints unchanged. The 90 px height predates the rail, and holding it would leave both rail and body within ~2 px of overflow.
- Q: How is the crest-only rail labelled for users who cannot read the crests? → A: Option A — crest-only visually, with an accessible label per row naming the age, the time and whether it is estimated. Age **names stay in text** on the details-page timeline and on the existing build-order age plates: those are the surfaces that teach the crest→age mapping, and they have no space pressure. The existing plates are out of scope and remain untouched.
- Q: What happens to the people line when the visibility rules leave it empty (e.g. `MyBuilds`, where the author is hidden and most builds have no creator)? → A: Option B — the line collapses and the body becomes two lines. Because visibility rules apply list-wide, every card in that list collapses identically, so titles still align within the list the reader is scanning; card height therefore varies by list rather than being global.
- Q: Does the civ flag panel stay on civ-locked lists, where every card shares one civ? → A: Option A — keep it everywhere. The flag is the card's visual left edge and identity anchor rather than a competing data field; dropping it would create a second card layout to build, theme and regression-test for no reclaimable space.

## Scope & Non-Goals *(read first)*

**In scope:**

- `src/components/builds/BuildListCard.vue` at every breakpoint — zoning, the age rail, the quiet meta lines, the reduced chip set, and the per-breakpoint card height.
- A new composable `src/composables/builds/useAgeTimings.js` deriving `[{ age, seconds, derived }]` from `build.steps` on top of the existing `getTimings()`.
- **Contextual visibility**: which metadata the card shows given the applied `filterConfig` and its host list.
- A new read-only `src/components/builds/AgeTimeline.vue` and its placement on `BuildDetails.vue`.
- The two visibility defects in the current card (dead map chip, sort-dependent views).
- Carrying age timings to the home page lanes, which have no step data of their own.

**Explicitly NOT in scope (leave exactly as-is):**

- `src/composables/builds/timingsHelper.js` — **read-only reuse**. Its interpolation and its `null`-when-unusable contract are the contract this feature builds on.
- The filter bar and its contexts (`008`), pagination, the Vuex cache, and the query/sort logic. **Sorting or filtering by age time is a later feature, only enabled by this one.**
- The build editor, `BuildOrderEditor` / `BuildOrderSectionEditor` (`010`–`012`), Focus mode, the icon-class tints, the `::id::` shortcode format.
- Firestore rules, routing, `BuildHeader.vue` — the timeline is a **new sibling section**, not a header change.

> This is a **presentation + information-priority** feature. Browsing an existing list fetches no new data: the list query already ships `steps` because the Firestore client SDK has no field projection.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Choose a build from the list without opening it (Priority: P1)

A player browsing All Builds wants a fast Castle time on Arabia. They scan down the list and read each build's Feudal / Castle / Imperial times in the same place on every row.

**Why this priority**: This is the whole point of the feature. If only this ships, the list is materially more useful.

**Independent Test**: Open `/builds` at ≥1280 px with a mix of builds. Confirm every card shows a right-hand rail with up to three age crests + times, aligned on a shared right edge across all rows, and that a build with no Castle shows `—` rather than a blank or `??:??`.

**Acceptance Scenarios**:

1. **Given** a build whose sections reach Imperial, **When** its card renders, **Then** the rail shows three rows — Feudal, Castle, Imperial crests with `m:ss` times — right-aligned, in tabular numerals, at the same vertical offsets as every other card in the list.
2. **Given** a build that only reaches Feudal, **When** its card renders, **Then** Feudal shows a time and Castle + Imperial show a low-emphasis `—` (the rail keeps three rows so the column meaning stays learnable).
3. **Given** a build whose steps carry no usable timestamps (`getTimings()` returns `null`), **When** its card renders, **Then** **no** times are shown — the rail is omitted entirely, not filled with placeholders — and the card layout does not shift.
4. **Given** a legacy build (flat `steps`, no sections), **When** its card renders, **Then** no age rail is shown (there are no age boundaries to read) and nothing errors.
5. **Given** a time that was interpolated rather than stated by the author, **When** it renders, **Then** it is prefixed `~`, set in lighter weight/colour than a stated time, and carries a tooltip reading "Estimated from villager count".
6. **Given** any card, **When** its author, creator or season names are long, **Then** the card is still exactly three lines tall (title / people / stats) — the meta lines ellipsize rather than wrap, so the title and age rows sit at the same offset on every card.

---

### User Story 2 - Read only what distinguishes this list (Priority: P1)

A player filters to English + Season 10, or opens an author's page, or the civ Dashboard. The cards stop repeating the thing every row shares and keep showing the metric they sorted by.

**Why this priority**: Without it the space freed by removing chips is immediately re-filled with noise, and the two existing defects stay.

**Independent Test**: Apply exactly one season; the season disappears from every card. Sort by Favorites; the favorites count appears in the meta line. Open `/builds?author=…`; the author disappears (the page header already names them).

**Acceptance Scenarios**:

1. **Given** a filter with exactly **one** value selected for a field (civ, season, map, strategy, creator, author), **When** the list renders, **Then** that field is **omitted** from every card — it is constant across the list and already stated by the filter bar or page header.
2. **Given** a filter with two or more values for a field, **When** the list renders, **Then** the field **is** shown on each card (it now distinguishes rows).
3. **Given** any sort key, **When** the list renders, **Then** the metric that key sorts by is shown on every card, and views are **always** shown regardless of sort key, so the row's content no longer changes when the reader re-sorts.
4. **Given** an unfiltered list, **When** a card renders, **Then** the map is shown — today it never renders at all, because the guard reads a `filterConfig` field that does not exist.
5. **Given** `MyBuilds`, **When** a card renders, **Then** the author is omitted (every build is the viewer's) and a `Draft` chip still marks drafts.
6. **Given** the civ-locked Dashboard, **When** a card renders, **Then** the civ name is not repeated in text form.

---

### User Story 3 - Same decision on a phone (Priority: P2)

A player on a phone scans the same list and still sees the age times.

**Why this priority**: Mobile is a first-class case for this product, but the desktop rail is the reference layout.

**Independent Test**: At xs, confirm the chip row shows up to three age chips and **no** season/map chips, and the meta line is author · date · views.

**Acceptance Scenarios**:

1. **Given** xs/sm, **When** a card renders, **Then** the age chips occupy the slot season/map used to occupy — replacing them, not added to them.
2. **Given** xs/sm, **When** a title is long, **Then** it may wrap to **two** lines and clamp, without the card growing past its breakpoint height.
3. **Given** xs/sm, **When** a time is derived, **Then** its chip is an outlined `~` chip against filled chips for stated times.

---

### User Story 4 - See the whole shape of a build on its details page (Priority: P2)

A player opens a build and, before reading 30 steps, sees when each age lands and how many villagers were on at each age-up.

**Independent Test**: Open a build with full timings; a timeline strip sits directly above the Build Order card, spanning a shared 0–16:00 track with markers for each age reached.

**Acceptance Scenarios**:

1. **Given** the view route with derivable timings, **When** the page renders, **Then** an age timeline section appears **between the Description card and the Build Order card**, styled with the existing `build-card-section-header` pattern.
2. **Given** the strip, **When** it renders, **Then** each age marker shows the crest, the time (`~`-prefixed if derived), the age name, and the villager count at that step; the track segments are proportional on a **fixed** 0–16:00 scale shared by every build.
3. **Given** a build with no usable timings or no age-ups, **When** the page renders, **Then** the section is **not rendered at all** (no empty card).
4. **Given** the edit/create route, **When** the page renders, **Then** the strip is **absent** (view route only).
5. **Given** xs, **When** the page renders, **Then** the strip degrades to the same three age chips used on the list card, inside its own compact card.

---

### User Story 5 - See the same timings on the home page (Priority: P2)

A player landing on the home page browses the trending, classics and newest lanes. Those cards show age timings exactly as the builds list does, so the most-visited surface is not the one place the feature silently disappears.

**Why this priority**: The home page uses the same card but is fed from a reduced pre-generated summary that carries no step data, so it needs its own delivery path. It ranks below the builds list because the lanes show a curated handful of builds rather than the full catalogue.

**Independent Test**: Load the home page after build summaries have been refreshed and confirm the lane cards show the same age timings the same builds show in the builds list.

**Acceptance Scenarios**:

1. **Given** a build in a home lane whose summary carries age timings, **When** the home page renders, **Then** the card shows those timings in the same form as a builds-list card.
2. **Given** a build whose summary carries no age timings — none exist, or the summary predates this feature — **When** the home page renders, **Then** the card shows no timings and renders as it does today.
3. **Given** a build shown both in a home lane and in the builds list, **When** the two cards are compared, **Then** the age timings are identical.
4. **Given** the civ Dashboard, whose lanes are fed with full build documents rather than summaries, **When** its cards render, **Then** timings are derived directly from steps and match the builds list.

---

### Edge Cases

- `getTimings()` returns `null` → no rail, no strip, no fallback text. Never `??:??`, never `0:00`.
- A build where the author stamped only the first and last step: interpolation fills the rest; every age time on such a build is `~`-marked.
- A step carrying a timestamp that cannot be parsed (`"<br>"`, `"~4:20"`, empty after sanitising) is an **interpolated** time, not a stated one, and MUST be marked `~`.
- A build reaching Imperial before 4:00 (nonsense data) or after 16:00 — the strip **clamps** the marker to the track and still prints the real time.
- An `ageUp` section with no steps, or an `age` section whose first step has no villagers — the boundary is still the first step of that section; if its timing is `null`, that age row shows `—`.
- Skeleton cards (`build.loading`) must not attempt any derivation.
- A card in the drafts block of `MyBuilds` shows `Draft` plus the rail; drafts are frequently timing-incomplete, so the `—` path is common there.
- Very long author or creator names must not push the rail off-card — the rail is fixed-width and the body ellipsizes.
- Light and dark: the rail divider, the derived colour and the `—` colour all come from theme tokens, never hardcoded.
- **Home summary lag**: a build edited since the last summary refresh shows its previous timings on the home page until the next run; a summary written before this feature shipped shows none. Neither renders a placeholder.
- **Timings removed by an edit**: a build that stops producing a timeline must have its stored summary timings cleared at the next refresh, not retained.

## Requirements *(mandatory)*

### Functional Requirements

**Age timings (derivation)**

- **FR-001**: A composable MUST derive, from `build.steps`, an ordered list of the ages the build reaches as `{ age, seconds, derived }`.
- **FR-002**: It MUST flatten sections into a step list the same way `FocusMode.vue` does — concat `section.steps` in order; section `gameplan` MUST NOT become a list item — before calling `getTimings()`, so indices align.
- **FR-003**: The boundary for age *n* MUST be the **first step of the first section with `type === 'age'` and `age === n`** (`2` = Feudal, `3` = Castle, `4` = Imperial). An `ageUp` section is never a boundary.
- **FR-004**: It MUST return an empty result for legacy flat builds and for builds where no age boundary is resolvable, and MUST NOT throw for any malformed step shape.
- **FR-004a**: An age whose own boundary step carries a **parseable** timestamp MUST be reported from that timestamp, **even when `getTimings()` returns `null` for the build as a whole**. `getTimings()` abandons an entire build if any single step is unresolvable, which is common — a build stamped only at its age-ups has no villager trail to interpolate the rest from — so its result is a bonus, not a precondition. Interpolation fills only the boundaries that state nothing themselves.
- **FR-005**: A time MUST be flagged `derived: true` when it came from interpolation rather than from a parseable timestamp on the boundary step itself. The test is the parsed result, not the mere presence of a `time` field, so a present-but-unparseable value is correctly reported as an estimate.
- **FR-006**: `timingsHelper.js` MUST NOT have its interpolation algorithm changed. *(Revised mid-implementation, with the author's approval: one guard was added to `interpolate()` because it dereferenced `timings[-1]` and threw whenever a build's first step carried a timestamp but no villager assignment — a common shape. That crash also aborted Focus mode's `onMounted` part-way, losing its timer and text-to-speech setup. The fix turns the throw into the `null` return every caller already handles; no timing values changed. Verified by a dedicated check that builds which already resolved are unaffected.)*
- **FR-007**: Derivation MUST be memoized per build, not recomputed on re-renders driven by unrelated state.

**List card layout**

- **FR-008**: The card MUST keep the flag-left row shape (`cols=3` flag, gradient into `surface`) and remain a single click target linking to the build. The flag MUST be retained on every list including civ-locked ones, so there is exactly one card layout; only the civ **name** in text is suppressed when the list is civ-locked.
- **FR-009**: At md+ the card MUST have three zones — flag · body (title + two fixed meta lines) · fixed-width age rail — with body and rail vertically centred.
- **FR-010**: Age times MUST be right-aligned in tabular numerals so times align vertically across adjacent cards.
- **FR-011**: On the list card, ages MUST be labelled with the game's age crests (`/assets/pictures/age/age_2|3|4.webp`) rather than the words Feudal/Castle/Imperial, at md+ and at xs.
- **FR-011a**: Each rail row and age chip MUST expose an accessible label naming the age, its time, and whether the time is estimated, so the rail is not image-and-number only to assistive technology.
- **FR-011b**: Ages MUST be identified by crest alone on the details-page timeline as well, with the age name carried only as an accessible label. *(Revised: the timeline originally kept the name in visible text as the surface that teaches the crest-to-age mapping. That teaching already happens further down the same page — the build order's age plates render the crest beside "{Age} reached" — so repeating it under every marker was redundant.)*
- **FR-012**: An age the build does not reach MUST render a low-emphasis `—`; when the build has no timings at all the rail MUST be omitted entirely.
- **FR-013**: Derived times MUST be visually distinguished by a `~` prefix plus lighter weight/colour, with an "Estimated from villager count" tooltip, and MUST NOT use an underline or dotted rule (reads as a link).
- **FR-014**: **At md+**, chips MUST be reduced to **state** only: `Draft` and `New`. Author and video creator become links on the people line (author still routes to `Builds?author=…`); everything else becomes plain text on the stats line. This does not govern xs/sm, where the chip row is retained and carries `Draft`, `New`, author, date and the age chips required by FR-024.
- **FR-015**: The body MUST be title, a **people** line (author · video creator) and a **stats** line (date · views · comments · season · map). Both meta lines are low-emphasis, `·`-separated, and MUST NOT wrap; a card MUST NOT change height because a name is long.
- **FR-015a**: A meta line left empty by the visibility rules MUST collapse rather than render blank. Because those rules apply list-wide, every card in a given list collapses identically, so titles stay aligned within that list; the card's height is therefore a property of the list, not a global constant. Note that at md+ the three-row rail, not the body, sets the card's `min-height` floor — collapsing a meta line removes the blank line but does not shorten the card.
- **FR-016**: Card heights MUST become `min-height` rather than fixed `height` so the three-row rail cannot clip, with per-breakpoint values `xs 96 · sm 125 · md 112 · lg 112 · xl/xxl 125`. This grows `md` from 90 and `xs` from 90; the resulting increase in list length at those breakpoints is accepted.
- **FR-017**: The title MUST stay single-line + ellipsis at md+ and MUST clamp to two lines at xs/sm.

**Contextual visibility**

- **FR-018**: A metadata field whose applied filter has **exactly one** selected value MUST be omitted from every card in that list.
- **FR-019**: The metric of the active sort key MUST always be shown, and **views MUST always be shown** regardless of `orderBy`, removing today's `orderBy`-dependent guard.
- **FR-020**: The author MUST be omitted when the list is author-scoped (`filterConfig.author` set, or `MyBuilds`).
- **FR-021**: The video creator MUST be omitted when a creator filter is applied.
- **FR-022**: The map MUST be shown when it distinguishes rows, replacing the current guard on the non-existent `filterConfig.map` with one on `filterConfig.maps`.
- **FR-023**: The card MUST take its context from an explicit prop plus the applied `filterConfig`, and MUST NOT infer context from the route. Host lists that render the card indirectly MUST forward that context.
- **FR-024**: On xs/sm the age chips MUST replace the season and map chips, not accompany them.

**Details page timeline**

- **FR-025**: A read-only timeline component MUST render a shared fixed-scale (0–16:00) track with one marker per age reached, showing crest, time, age name and villager count at that step.
- **FR-026**: It MUST render on the **view** route only, between the Description card and the Build Order card, using the existing section-header pattern.
- **FR-027**: It MUST not render at all when there are no derivable age timings.
- **FR-028**: It MUST use the same `~`/lighter treatment for derived times as the list card, and MUST degrade to the list card's age chips at xs.

**Home page lanes**

- **FR-029**: Age timings MUST be computed on the client save path and stored on the build document as `ageTimings`, so the summary generation job needs no derivation logic of its own — only the field added to its whitelist.
- **FR-030**: There MUST be exactly one implementation of the derivation rules. The stored timings and any client-derived timings MUST come from that same implementation, so they cannot disagree for the same build.
- **FR-031**: `ageTimings` MUST be stored as a **map keyed by age name**, each value carrying the arrival time in seconds and whether it was estimated — not as an array — so it is orderable via a field path. An age the build never reaches MUST omit its key entirely; a sentinel such as `0` or `null` MUST NOT be written, because documents missing the field must drop out of a future age-time sort rather than sort first.
- **FR-032**: The card MUST prefer stored `ageTimings` when present and derive from `steps` otherwise, so the same component serves both the summary-fed home lanes and the fully-loaded Dashboard and builds-list cards.
- **FR-033**: Stored timings MUST be rewritten on every build save, and ages that a build no longer reaches MUST have their keys removed rather than retained.
- **FR-034**: A build or summary carrying no timings MUST render as a card with no timings, never as a placeholder or an error.
- **FR-035**: Rendering the home page MUST NOT read more build records than it does today.
- **FR-036**: Existing builds MUST be backfilled with `ageTimings` in a one-off pass, in batches of at most 500 writes.

### Non-Functional

- **NFR-001**: Vuetify components only — no custom select/chip/card primitives (Principle III).
- **NFR-002**: No new Firestore reads on any browse path, no new indexes, no new dependency (Principles I + IV).
- **NFR-003**: Both themes correct via theme tokens; no hardcoded colours.
- **NFR-005**: Every age timing MUST be reachable by assistive technology as text — no timing may be conveyed by crest imagery or colour alone.
- **NFR-004**: Derivation MUST stay off the critical path for a 10-card page — total derivation under 10 ms on a mid-range phone.

### Key Entities

- **Build**: An existing build order — metadata plus an ordered structure of age sections (or, for legacy builds, a flat step list). Unchanged by this feature except as decided for FR-029.
- **Age section**: A segment belonging to one age (`type: 'age'`, `age` 1–4) or a transition between ages (`type: 'ageUp'`). Provides the boundaries from which arrival points are read.
- **Build step**: A single instruction, optionally carrying an author-entered timestamp and villager assignments — the raw inputs for derivation.
- **Age timings**: The derived result for one build — the ages reached, each with an arrival time in seconds and a flag for whether it was estimated. Computed on save and stored on the build document as a map keyed by age name (`feudal` / `castle` / `imperial`), with unreached ages absent. Derived in memory as a fallback wherever steps are present but the stored field is not.
- **Build summary**: The existing reduced, pre-generated representation used by the home page lanes. Gains the stored age timings by whitelist; otherwise unchanged. Regenerated on a schedule, so it can lag the build it describes by up to one refresh interval.

## Success Criteria

- **SC-001**: On a 10-card list at 1280 px, the age times of all cards align to a shared right edge, and every card in that list has an identical title offset — three body lines where the people line has content, two where the list's visibility rules empty it.
- **SC-002**: For a fixture set of four builds (full timings / feudal-only / no timestamps / legacy flat), the card renders per FR-012 and FR-004 with no console errors.
- **SC-003**: Re-sorting the list by each of the six sort keys never removes views from the cards, and always adds that key's metric.
- **SC-004**: With one season selected, zero cards mention a season; with two selected, every card does.
- **SC-005**: The map is visible on cards in an unfiltered list, proving the dead-guard fix.
- **SC-006**: xs cards show age chips and no season/map chips, and stay within their breakpoint height with a two-line title.
- **SC-007**: The details timeline appears only on the view route, only when timings exist, and its markers match the list card's times exactly for the same build.
- **SC-008**: Age timings appear on every surface that shows build cards — builds list, MyBuilds, MyFavorites, Dashboard lanes and home lanes — with no surface silently omitting them.
- **SC-009**: Rendering the home page reads no more build records than it does today.
- **SC-010**: A build edited to change its age timings shows the updated values on the home page within one refresh cycle.
- **SC-011**: Every displayed time is unambiguously identifiable as author-stated or estimated, including times whose source timestamp was present but unparseable.
- **SC-012**: `timingsHelper.js` keeps its interpolation algorithm unchanged (see FR-006 for the one crash guard added), and the feature's own diff stays within the card, the new components, the new composable, `BuildDetails.vue`, the host views' card props, and the summary generation path. Fixes to pre-existing defects found along the way are tracked separately and are expected to fall outside that set.

## Assumptions

- **Age-arrival semantics**: "Feudal 3:45" means the age was *reached* at 3:45, not that the age-up was started then. Consistent with the existing "{Age} reached" marker in the build order view.
- **Existing derivation is reused unchanged**: `getTimings()` — including its interpolation from villager deltas and its `null`-when-unusable contract — is the single source of truth, so list, Focus mode and timeline agree to the second.
- **Data is already available in lists**: browsing already retrieves complete build documents including steps, so deriving timings costs only CPU. Verified: the list path returns whole documents with no field projection.
- **Legacy builds are out of scope**: builds without age structure are not retrofitted; no attempt is made to infer age boundaries from step content.
- **No filtering or sorting by age time**: surfacing the timings is the whole of this feature; ordering by them is a later feature this one enables.
- **Backfill is explicit**: existing builds are backfilled once with `ageTimings`; home summaries then pick the field up on their next scheduled regeneration.
- **Sorting by age time stays out of scope**: `ageTimings` is deliberately shaped to make it possible later (FR-031), but no sort key, filter or index for it is added by this feature. Combining an age-time sort with the existing filters will require composite indexes when that feature is built.
- **Build content is client-authored**: no server-side function writes build steps — the scheduled functions only update scores — so computing timings on the client save path covers every way a build's steps can change.

## Source Verification

The design handoff's claims were checked against `main` before merging. Confirmed:

- `filterConfig` has `maps: []` and **no** `map` field, so `filterByMap` in [BuildListCard.vue:208](../../../src/components/builds/BuildListCard.vue#L208) is permanently `undefined` — the map chip is dead code, as claimed.
- Age crests exist at `public/assets/pictures/age/age_{1,2,3,4}.webp`.
- [BuildDetails.vue](../../../src/views/builds/BuildDetails.vue) renders Header → Description (conditional) → BuildOrderEditor → Video → Discussion, and `build-card-section-header` is an established pattern there, so the proposed placement is valid.
- [updateHomeSnapshot.js:8-27](../../../functions/builds/updateHomeSnapshot.js#L8-L27) whitelists 15 fields and omits `steps`.
- The list path returns full documents (`snapshot.docs.map((doc) => doc.data())`), so no field projection occurs.

Corrected in this spec:

- **`Dashboard.vue` is not a direct host of the card** — it renders `BuildLaneTabs`, the same component the home page uses. Context must therefore be forwarded *through* `BuildLaneTabs` (FR-023).
- **Dashboard lanes and home lanes carry different data shapes** — Dashboard feeds `BuildLaneTabs` from `getBuilds()` (full documents, steps present) while Home feeds it from the summary (no steps). One component, two shapes; hence FR-031.
- **`author-locked` does not exist today** — `FilterConfig` recognises only `default` and `civ-locked`. It is a new value this feature introduces, not one it mirrors.
- **The `derived` flag test was wrong** — the handoff proposed `!step.time`, which reports a present-but-unparseable timestamp as author-stated even though it was interpolated. FR-005 tests the parsed result instead.

## Deferred to a Later Feature

- **`timingsHelper.interpolate()` crashes on a common shape** — when the build's **first** step carries a timestamp but no villager assignment (e.g. "0:00 build a house"), `firstValidStepIndex` resolves to `-1` and [line 152](../../../src/composables/builds/timingsHelper.js#L152) dereferences `timings[-1]`, throwing `Cannot read properties of undefined (reading 'startTime')`. This feature isolates the call so stamped boundaries still resolve, but **Focus mode calls `getTimings()` unguarded** and would surface the same throw. Fixing it means editing `timingsHelper.js`, which FR-006 forbids here — worth its own change.
- **The `a+b` resource notation is undocumented, and fishing boats have no model at all.** `parseVillagerCountString` sums both operands with only the comment "Accumulate values separated by `+`", so `4+1` counts as 5 villagers everywhere. If the second operand denotes a non-villager unit (a fishing boat), then every "N vils" label is overstated, while the interpolation that consumes the same number is arguably still correct — boats take production time too. Resolving it means splitting the two uses: a display count that reads only villagers, and `aggregateVillagers` left alone so derived timings do not silently shift across the app. Deliberately **not** decided here; it needs the authoring convention settled first, and probably a real model for non-villager economy units.
- **The resource delta marker only flags increases, and parses with `parseInt`**, so `12` → `12+3` shows no marker. Whether that is a bug depends on the answer above.
- **Estimated timings are rendered but effectively unreachable.** A timing is only marked estimated when the age boundary states no time of its own *and* `getTimings()` resolved the whole build — and the second condition is what fails on most real builds, which is why FR-004a exists at all. The `~` treatment, its tooltip and its accessible label are all implemented and verified against fixtures, but no real build has been observed producing one, so the feature is deliberately **not advertised** in the home news card. It should become common once the interpolation item below is addressed. A read-only diagnostic that counts derived timings across a project can be rebuilt from `getAgeTimings` if the number is wanted.
- **Interpolation quality**: `getTimings()`'s villager-delta interpolation resolves fewer builds than this feature would like — it abandons a build entirely if any single step is unresolvable, and trailing untimed steps are a common cause. FR-004a works around that by reading stamped boundaries directly, which covers the common authoring pattern. Improving the interpolation itself is explicitly **out of scope here** and left as a follow-up; `timingsHelper.js` stays read-only in this feature (FR-006).
- **Sorting and filtering by age time**: enabled by the `ageTimings` shape (FR-031) but not built here.

## Needs Clarification

None outstanding. The design handoff's three open questions (NC-1 flag on civ-locked lists, NC-2 home lanes / denormalization, NC-3 timeline placement) and two gaps found during the clarify pass (crest labelling, empty meta line) are all resolved — see [Clarifications](#clarifications). Timeline placement follows `design-input.md` §5 as written, verified against the current `BuildDetails.vue` section order.
