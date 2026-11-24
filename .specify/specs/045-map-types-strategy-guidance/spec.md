# Feature Specification: Map Types and Strategy Guidance

**Feature Branch**: `045-map-types-strategy-guidance`, created by tasks T001 in a separate worktree

**Created**: 2026-11-24

**Status**: Draft

**Input**: Started as "filter by Castle time instead of a tag, plus a gentle prompt at Publish when the
strategy is empty". Reshaped by measurement and by the owner:
- the Castle-time filter was dropped (see Background);
- map types are simplified to Land / Water / Hybrid, with everything else backfilled to Land;
- strategy stays the author's choice, explained in place;
- strategy and map values outside the allowed lists are cleaned up the hard way: mapped where
  unambiguous, removed otherwise, and refused from then on.

## Background: what the data showed

Measured 2026-11-24 against the committed snapshot (4,348 published builds, 9 Nov). The age
timings come from a 280-build sample fetched through the public API, 40 per strategy plus 40
with none, run through the app's own `getAgeTimings()`.

**Map is effectively unused, and its filter hides the builds it should find.**
- 3,694 builds (85%) have no map; in the last 12 months it is 86%.
- 517 are Open, 60 Water, 44 Hybrid, 29 Closed, 3 store the text `"null"` and 1 stores `"Arabia"`.
- An empty map almost always means "any land map". The filter treats it as no match, so "Open"
  shows 517 builds and hides about 3,700 that would work fine.
- Open versus Closed doesn't change a build order. Water and Hybrid do.

**Strategy is half-filled, and some of what is filled can never match the filter.**
- 55% of builds have one of the six strategies.
- 187 store `null` instead of the empty string the editor writes.
- 26 carry typed-in values from imports, such as "Abbey of Kings Fast Castle → White Tower Knight
  Pressure", that the strategy filter can't match.

**Strategy can't be derived from the build, and a Castle-time filter wouldn't work.**
- 108 of the 280 sampled builds have no age times at all. Only about 1 build in 5 has a Castle
  time, and among builds with no strategy only 1 in 8.
- The stored time is when the build *arrives* in Castle Age. Fast Castle builds arrive around 8:25
  (p25–p75 7:45–9:40), so a band of "under 7:00" holds 1 of 17 of them.
- Fast Castle, Fast Imperial and Cheese all land mostly in 7:00–10:00. Military units in Feudal
  don't separate Rush, Cheese and Timing Attack either (23, 24 and 19 of 40).

Any automatic label would be wrong for a large share of builds while looking authoritative.

**So**: keep strategy as the author's choice and make that choice easier. Make map a choice that
actually distinguishes builds. Clean both fields so every stored value is one the app offers.

## Clarifications

### Session 2026-11-24

- Q: Prompt at Publish when the strategy is empty? → A: **No.** Beginners often can't tell their
  build's strategy, and a prompt pushes them to guess. A guessed label is worse than none. Publish is
  unchanged (FR-016).
- Q: Filter by Castle time, as fixed bands or a free range? → A: **Neither: dropped.** Fixed bands
  were chosen first, then measurement (Background) showed they would cover about 20% of builds and
  wouldn't separate strategies. The owner also didn't want a second strategy-like filter on top of
  strategy.
- Q: Retire strategy and derive it from the build? → A: **No.** It can't be derived reliably
  (Background). It also feeds SEO page titles, RTS Overlay import/export and the public API.
- Q: Which map types? → A: **Land, Water, Hybrid.** Open, Closed, empty and junk values all become
  Land.
- Q: Strategy values outside the six options? → A: **The hard way.**
  - Map a value only when it names exactly one option (case-insensitive), e.g. "Feudal Rush" → Rush,
    "Ultra Fast Imperial (no Daimyo)" → Fast Imperial.
  - Remove (set empty) everything else, including `null`.
  - From then on, refuse any write that stores a value outside the lists, wherever it comes from.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Find builds for the kind of map I play (Priority: P1)

A player on a water map opens the filter, picks **Water** and sees the water builds. A player on a
land map picks **Land** and sees essentially every build, not the 12% that happened to be tagged.

**Why this priority**: Today the map filter actively hides most usable builds. This fixes a broken
filter rather than adding one.

**Independent Test**: After the backfill, filter by Land. The count equals all published builds
minus Water and Hybrid. Filter by Water: the 60 water builds.

**Acceptance Scenarios**:

1. **Given** the builds filter, **When** the map options open, **Then** they are exactly Land, Water,
   Hybrid.
2. **Given** a build that had Open, Closed, no map or a junk value, **When** the backfill has run,
   **Then** its map is Land.
3. **Given** a list card, **When** the build's map is Land, **Then** the card shows no map. Only
   Water and Hybrid are shown, because a label on 97% of cards stops meaning anything.
4. **Given** the build details page, **When** the map is Land, **Then** it is likewise not shown as
   metadata.

---

### User Story 2 - Choose a strategy without already knowing the jargon (Priority: P1)

A beginner writing their first build opens the strategy field. Each option carries one line saying
what it means ("Fast Castle: reach Castle Age as early as you can, with little army before"). They
pick one with confidence, or leave it empty if none fits.

**Why this priority**: This addresses the real reason strategy is empty on half the builds: the
options are names, not explanations.

**Independent Test**: Open the editor's strategy select. Every option shows its explanation. The
field can still be left empty and Publish behaves as before.

**Acceptance Scenarios**:

1. **Given** the editor, **When** the strategy select opens, **Then** each of the six options shows a
   one-line explanation under its name.
2. **Given** the builds filter, **When** its strategy select opens, **Then** the same explanations
   appear, from the same source.
3. **Given** the filter sheet on a phone, which offers strategies as chips, **When** the player taps
   "What do these mean?" under the Strategy chips, **Then** the six one-line explanations appear, from
   the same source.
4. **Given** a build with no strategy, **When** it is published, **Then** no prompt, warning or block
   appears.

---

### User Story 3 - Every stored value is one the app offers (Priority: P1)

After the cleanup, every build's strategy is one of the six options or empty, and every map is Land,
Water or Hybrid. A build imported from RTS Overlay with "Feudal Rush" is saved as Rush; one with
"Forward Fort Feudal Pressure" is saved with no strategy. Nobody can store anything else, not through
the editor, the importer or a hand-crafted write.

**Why this priority**: A value the filter can't match makes a build silently unfindable by that
filter. And without enforcement, a cleanup decays back the next time someone imports.

**Independent Test**: Import an overlay file carrying `strategy: "Aggression"`, `map: "Arabia"`, and
save. The build stores strategy empty and map Land. A direct write of `strategy: "Aggression"` from
the browser console is refused.

**Acceptance Scenarios**:

1. **Given** the existing collection, **When** the cleanup has run, **Then** no build stores a
   strategy outside the six options plus empty, and no build stores a map outside the three.
2. **Given** a stored strategy that names exactly one option, **When** cleaned, **Then** it becomes
   that option. **Given** one that names none or several, **Then** it becomes empty.
3. **Given** the cleanup's dry run, **When** reviewed, **Then** it lists every changed value, old →
   new, before anything is written.
4. **Given** an import, **When** its strategy or map is outside the lists, **Then** the same
   normalisation applies before the build is shown in the editor.
5. **Given** any write, from any client, **When** it would store a value outside the lists, **Then**
   it is refused.
6. **Given** a visitor liking, upvoting or viewing a build, **When** that build somehow still holds an
   old value, **Then** the counter write is not blocked by it. Value checks apply to the author's own
   writes only.

### Edge Cases

- **Drafts** are cleaned and enforced like published builds. They are builds too, and they publish
  without re-entering the editor's selects.
- **A locally saved editor draft** (from before the release) holding "Open" or a typed-in strategy:
  the save path normalises it, so the author never meets a refusal for a value they didn't choose.
- **A tab opened before the release** still offers Open/Closed. A save choosing one is refused once
  the enforcement is live. The release order (Plan) keeps that window to long-open tabs, and the
  error is the existing save-failure message.
- **Case and spacing**: "fast castle", " Rush " map to the option. Matching is case-insensitive and
  trims whitespace.
- **The empty strategy** stays valid everywhere. It means "the author didn't say".
- **The map filter in an open session** holding "Open": filter choices aren't persisted, so a reload
  clears it. No migration needed.
- **A legacy build opened in the editor** between the app release and the cleanup shows the
  normalised value (e.g. Land for "Open") in the select, which is what saving will store. Only the
  display is normalised: `map` and `strategy` are tracked draft fields, so rewriting them on load
  would look like an unsaved edit on every legacy build.
- **Too many filter combinations**: a selection whose seasons × maps × strategies exceeds 30 can't be
  queried. The filter says so instead of failing (FR-017).

## Requirements *(mandatory)*

### Functional Requirements

**Map**

- **FR-001**: The allowed map values MUST be exactly Land, Water, Hybrid. Map is required: there is no
  empty value.
- **FR-002**: The editor MUST preselect Land for a new build and MUST NOT offer clearing the map.
- **FR-003**: The builds filter MUST offer the three values and nothing else.
- **FR-004**: Cards and the details page MUST show the map only when it is Water or Hybrid. This
  amends spec 020 FR-022, which shows the map whenever it distinguishes rows.

**Strategy**

- **FR-005**: The allowed strategy values MUST be the six existing options (Rush, Boom, Fast Castle,
  Fast Imperial, Timing Attack, Cheese) plus empty. Strategy stays optional.
- **FR-006**: Each option MUST carry a one-line, beginner-readable explanation. It MUST be shown
  wherever the options are offered:
  - in the editor's select and the desktop filter's select, as a subtitle per option;
  - in the phone filter sheet, where strategies are chips that can't carry a subtitle, behind a
    "What do these mean?" toggle under the Strategy chips.
- **FR-007**: The explanations MUST live in one place, next to the option list, so the editor and the
  filter can't drift apart.

**Normalisation (one implementation)**

- **FR-008**: A single normalisation MUST define what any incoming value becomes:
  - **map**: Water and Hybrid kept (case-insensitive); everything else, including empty, missing and
    junk, becomes Land.
  - **strategy**: a value equal to an option (case-insensitive, trimmed) is kept; one containing
    exactly one option name becomes that option; everything else, including `null`,
    becomes empty.
- **FR-009**: Every build write path (create, edit, publish) MUST apply it, so the editor, a restored
  local draft and an import can never send a disallowed value.
- **FR-010**: Overlay import MUST apply it before the imported build is shown, so the author sees what
  will be saved.

**Cleanup**

- **FR-011**: A one-off cleanup MUST apply FR-008 to every existing build, drafts included.
- **FR-012**: Its dry run MUST list every value it would change (old → new, with counts) and MUST
  default to writing nothing.
- **FR-013**: It MUST change only `map` and `strategy`. Counters, scores, timestamps and content are
  untouched.

**Enforcement**

- **FR-014**: The database MUST refuse an author's create or edit that would store a map or strategy
  outside the allowed lists.
- **FR-015**: Writes by other visitors (views, likes, upvotes, comments) MUST NOT be subject to the
  value check.
- **FR-016**: Publishing MUST NOT prompt, warn or block when the strategy is empty.

**Filter integrity**

- **FR-017**: The builds filter MUST NOT apply a selection that the database would refuse, i.e. one
  whose multi-select values expand to more than 30 combinations (selected seasons × maps × strategies,
  each counted as 1 when empty). In that state it MUST disable applying, say in one line which
  filters to narrow, and request no result-count preview. This was found during this feature, and
  Constitution II requires a smell found in a feature cycle to be addressed in it.

### Key Entities

- **Map type**: one of Land, Water, Hybrid; required on every build.
- **Strategy**: one of six named options, or empty; each option has a title and a one-line
  explanation.
- **Normalisation**: the single rule turning any incoming value into an allowed one. It is used by
  the save path, the importer and the cleanup.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: After the cleanup, 100% of builds store an allowed map and an allowed strategy. A
  re-run of the dry run reports zero changes.
- **SC-002**: Filtering by Land returns all published builds except the Water and Hybrid ones (about
  4,240 today, versus 517 for "Open" before).
- **SC-003**: A hand-crafted write of a disallowed value is refused, and every allowed value is
  accepted. Proven by rules tests that fail against the current rules and pass against the new ones.
- **SC-004**: Every strategy option shows its explanation in the editor, the desktop filter and the
  phone filter sheet.
- **SC-005**: The Publish flow has the same steps and outcomes as before.
- **SC-006**: Selecting 3 seasons × 2 maps × 6 strategies (36 combinations) disables applying with an
  explanation. No query error appears in the console, and the previous results stay on screen.

## Assumptions

- **Land is the honest default for an empty map.** An author who didn't set a map wrote a land build
  in practice: water and hybrid builds are distinct enough that their authors tag them, as 104 did.
- **Removed typed-in strategies are not preserved elsewhere.** The owner chose the hard way. The dry
  run lists them, so anything worth keeping can be moved into a description by hand before `--apply`.
- **Explanation wording** is drafted in the plan's data model and is the owner's to tune. It isn't a
  requirement beyond FR-006.
- **Separate worktree.** The main worktree is on `042-vote-integrity` with uncommitted work from
  parallel sessions (042 tasks, specs 046 and 047), so 045 is implemented in its own worktree (T001).
  The main worktree's `.specify/feature.json` and `CLAUDE.md` plan pointer stay on 042.

## Out of Scope

- **A Castle-time filter, Castle bands, or any age-time filter**: see Background. What would make one
  possible is better age-time coverage, i.e. spec 020's interpolation gap (it abandons a build
  missing one step time). That is a feature of its own.
- **Deriving or suggesting a strategy automatically**: see Background.
- **A strategy prompt at Publish**: see Clarifications.

## Source Verification

- `src/composables/filter/mapDefaultProvider.js` and `strategyDefaultProvider.js` hold the option
  lists. The editor (`BuildEditor.vue:243–267`) stores `""` for unset and allows clearing both.
- `src/composables/converter/useImportOverlayFormat.js:23–24` and `BuildImportDialog.vue:193` pass
  imported `map`/`strategy` through unchecked. That is where the typed-in strategies came from.
- `src/composables/data/buildService.js`: `addBuild`/`updateBuild` funnel through `saveable()` (and
  `withAgeTimings()`), the single place to apply FR-009.
- `firestore.rules` validates counters and authorship on builds, but never `map` or `strategy`
  (FR-014 is new). The author's update branch is separate from the counter branch, so FR-015 falls
  out of placing the check in the author branches only.
- `FilterConfig.vue:188–212`: the phone bottom sheet renders Map and Strategy as chip groups from
  `chipFacets`, not selects. That is why FR-006 names it separately.
- `queryParameterBuilder.js:183–198` adds one `in` per multi-select field with no bound on their
  product, and `FilterConfig` has no guard (FR-017).
- `BuildListCard.vue:337` and `BuildMetaLines.vue:69–71` render the map (the details page through
  `BuildHeader` → `BuildMetaLines`). Strategy is also read by
  `scripts/prerender.mjs:247` (SEO titles), the overlay export, the public API mapper and the home
  snapshot. All of them keep working, since the field stays.
