# Research: Map Types and Strategy Guidance

The decisions below were made against the code on 2026-11-24. The measurements behind the scope are
in spec.md, Background.

## R0 — Why the Castle-time filter was dropped (kept for the record)

Sample: 280 published builds via the public API (40 per strategy and 40 with none), run through
`getAgeTimings()`.

| author's strategy | has Castle time | Castle median (p25–p75) | military in Feudal |
|---|---|---|---|
| Rush | 5/40 | 8:10 (7:30–9:00) | 23/40 |
| Fast Castle | 17/40 | 8:25 (7:45–9:40) | 8/40 |
| Boom | 9/40 | 10:14 (10:00–10:21) | 13/40 |
| Timing Attack | 4/40 | 10:30 | 19/40 |
| Fast Imperial | 22/40 | 8:42 (8:30–9:20) | 10/40 |
| Cheese | 6/40 | 9:50 | 24/40 |
| (empty) | 5/40 | 11:26 | 12/40 |

- 108 of the 280 have no age time at all: no step timestamps, or no age sections. Weighted by strategy
  frequency, about 20% of builds have a Castle time.
- Under 7:00 held 1 of 17 timed Fast Castle builds, because the stored time is the *arrival*.

The age-time gap is spec 020's interpolation limit, not this feature's to fix.

## R1 — Where the lists, explanations and normalisers live

**Decision**: In the two existing provider modules, which already own the lists.
- `strategyDefaultProvider.js`: each option gains `subtitle`. Adds `STRATEGY_TITLES` and
  `normaliseStrategy(value)`.
- `mapDefaultProvider.js`: the list becomes Land / Water / Hybrid. Adds `MAP_TYPES`, `DEFAULT_MAP`
  and `normaliseMap(value)`.

The normalisers work on plain constants, not on the exported `ref`s, so the Node cleanup script can
use them.

**Rationale**: One home per list (FR-007). A new "facets" module would split each list from its
options for no gain.

**Alternatives considered**: normalising inside `buildService.js` (rejected: the importer and the
cleanup need it too, and buildService pulls in Firebase).

## R2 — Normalisation rules (FR-008)

```text
normaliseMap(v):      trim, case-fold; "water" → Water, "hybrid" → Hybrid; anything else → Land
normaliseStrategy(v): trim, case-fold
                      exact match of an option          → that option
                      contains exactly one option name  → that option
                      otherwise (incl. "null", null)    → ""
```

"Contains" is checked longest name first, so "Fast Castle" isn't also counted as a hit for a shorter
name. No option name is a substring of another today ("Rush" is not inside "Boom", and so on), but
the order makes that safe for future options.

Expected outcome on the 26 typed-in values seen in the snapshot:

| value | → |
|---|---|
| Abbey of Kings Fast Castle → White Tower Knight Pressure (5) | Fast Castle |
| Ultra Fast Imperial (no Daimyo) (2) | Fast Imperial |
| Feudal Rush (1) | Rush |
| Pro Scouts → Varangian Flood Timing (4) | "" ("Timing" ≠ "Timing Attack") |
| Feudal Power Spike → Castle Timing (3) | "" |
| Aggression (2), Economic (1), Forward Fort Feudal Pressure (1) | "" |
| `null` (187) | "" |

Drafts aren't in the snapshot. The dry run reports their values too (FR-012).

## R3 — Applying it on every write (FR-009)

**Decision**: A `withFacets(build)` in `buildService.js`, next to `withAgeTimings()`, sets `build.map`
and `build.strategy` to their normalised values. It is applied in `addBuild` and `updateBuild`, which
create, edit and publish all funnel through.

**Rationale**: Same reasoning as `withAgeTimings()`: no caller can forget it. It also covers a
locally restored editor draft (`useEditorDraft`) that holds "Open", so its author never meets a
refusal for a value they didn't pick.

## R4 — Import (FR-010)

**Decision**: Apply both normalisers in `useImportOverlayFormat.js` (lines 23–24) and in
`BuildImportDialog.vue` (line 193). The editor then shows the value that will be saved, and R3 stays
the safety net.

## R5 — Editor and filter UI

- **Map select** (`BuildEditor.vue:243–258`): items Land / Water / Hybrid, not `clearable`. A new
  build starts with `map: "Land"` (line 472). The `|| null` workaround described in the comment above
  it no longer applies to map, since map is never empty. Keep it for strategy only and update the
  comment.
- **Strategy select**: the editor's select and the filter card's autocomplete share
  `strategyItemProps` and `STRATEGY_MENU_PROPS` from `strategyDefaultProvider.js` (FR-006/007). As
  built and measured (T027), two Vuetify defaults had to change:
  - **`lines: false`.** A list clamps subtitles through the item's `--{n}-line` class and defaults
    to one line. With the default, the explanations were cut off with "…" and the filter's menu grew
    to 620px over the build list. Even `lines: "three"` cut the longest one in the editor's 226px
    field. With no lines class there is no clamp, so no CSS override is needed. An override in
    `main.css` was tried and lost to `vuetify.min.css` on import order: amend the owner, don't
    out-rank it.
  - **`maxWidth: 0`.** Vuetify sets the menu's `min-width` to the field's width, and a smaller
    `max-width` loses to it, so the menu is exactly as wide as its field: 341px in the filter card,
    226px in the editor at 1280, 256px at 360. A fixed number would fit one layout and stick out
    past the field in the others.
- **Phone filter sheet** (`FilterConfig.vue`, `chipFacets` loop): Map and Strategy render as chip
  groups, and a chip can't carry a subtitle. The Strategy facet has `explain: true`, which adds a
  link-style native `<button>` "What do these mean?" toggling a `<dl>` of the same items' titles and
  subtitles, collapsed by default.
  - It is a link, not a `v-btn`. A text button's padding indented its label 8px from the chips, and
    pulling it back with a negative margin is a pattern the owner has rejected, because the hover
    fill crosses the edge. The link has no box, its text starts on the chips' edge (24px = 24px,
    measured), and its 44px height is the hit area.
  - Rejected: tooltips (no hover on phones) and always-on subtitles (six extra lines in a sheet that
    has to fit the screen).
- **The editor normalises for display, never on load.** The selects bind
  `normaliseMap(build.map)` and `normaliseStrategy(build.strategy) || null`, so a legacy "Open" or a
  typed-in strategy reads as what a save will store. Nothing is written back: `map` and `strategy`
  are in `useEditorDraft`'s `DRAFT_FIELDS`, so a load-time rewrite would register as an author edit
  on every legacy build. Cards and meta lines normalise their map label the same way.
- **Map display**: `BuildListCard.vue:337` `showMap` and `BuildMetaLines.vue:69–71` show the map only
  when it is not `DEFAULT_MAP`. This amends spec 020 FR-022; record the amendment there.
- **No new icons.** `mdi-map` and `mdi-strategy` are already in use.

## R6 — Enforcement (FR-014, FR-015)

**Decision**: A rules function in `match /builds/{build}`:

```text
function allowedFacets() {
  let d = request.resource.data;
  return d.get('map', '') in ['Land', 'Water', 'Hybrid']
      && d.get('strategy', '') in ['', 'Rush', 'Boom', 'Fast Castle',
                                   'Fast Imperial', 'Timing Attack', 'Cheese'];
}
```

It is AND-ed into `allow create` and the **author's** `allow update`, and not into the counter
branch. A missing `strategy` reads as `""` (allowed); a missing `map` reads as `""` (refused).

- **Transcribed, not imported.** Rules can't import, so the lists are mirrored with a comment on both
  sides, the same pattern as `counters()` ↔ `NON_EDITABLE_FIELDS`.
- **Test first** (CLAUDE.md): new cases go in `contracts/firestore-rules.md` and in a new
  `tests/rules/facets.rules.test.mjs`. A separate file avoids colliding with the 042 sessions'
  edits to `builds.rules.test.mjs`. Each refusal case must fail against the deployed rules
  (`RULES_FILE=<copy>`) before it passes against the new ones.

**Why the author's update checks the whole document, not just changed keys**: it keeps the rule
simple, and after the cleanup every document conforms. The only builds it could block are ones the
cleanup missed, and SC-001 proves there are none.

## R7 — Cleanup script (FR-011–013)

**Decision**: A new `scripts/backfill-map-strategy.mjs`, structured like `backfill-age-timings.mjs`:
- Admin SDK;
- prints the project first;
- dry run by default, `--apply` to write;
- batches of 500;
- esbuild bundle with `--alias:@=./src`.

Differences:
- It updates **only** documents whose `map` or `strategy` changes, and writes **only** those two keys
  (FR-013).
- The dry run prints an old → new table with counts, split by published and draft.

**Why a new script, not an extension of the age-timings one**: different purpose and a different
write set. Folding them together would make the age-timings rewrite, which touches every document,
ride along with a two-field cleanup.

## R8 — Release order

1. **App deploy** (one Netlify build): new options, explanations, the save-path normalisation and
   import normalisation. From here on, no client of the new bundle can write a disallowed value.
2. **Cleanup**: dry run on dev, then prod. The owner reviews the removal list, then runs `--apply`.
   Re-run the dry run: zero changes (SC-001).
3. **Rules deploy**, after `npm run test:rules` passes, a few days after step 1 so that tabs opened
   before the release have mostly closed.

The order matters. Rules before the cleanup would refuse authors editing legacy builds. Rules before
the app would refuse the current editor's empty map.

**No index changes**: the field names are unchanged, and the existing 12 `map` and 12 `strategy`
indexes keep serving the filter.

## R9 — Downstream effects

- **SEO snapshot** (`data/seo-snapshot.ndjson`): the next weekly refresh rewrites about 4,250 lines
  once. That is nearly the whole file, because every build except Water/Hybrid changes map; 206 of
  them also change strategy. It's a one-off diff, not the repeating kind FR-027 guards against.
- **Home snapshot**: regenerated on its schedule; nothing to do.
- **Public API and RTS Overlay export** now emit `map: "Land"` where they emitted `"Open"`/`null`.
  RTS Overlay treats map as plain display text (confirmed by the owner, 2026-11-24), so nothing
  downstream breaks.
- **`About.vue:349`** still says "Filter by … map, strategy": still true.

## R10 — The 30-combination guard (FR-017)

**Finding**: Firestore expands every `in` filter into a disjunctive normal form and refuses a query
with more than 30 disjunctions. `getFilterQueryParams()` adds one `in` each for seasons, maps and
strategies, with nothing bounding their product. 3 seasons × 2 maps × 6 strategies = 36 is reachable
in the filter today. (Civ, creator and author are single-value `in`s and count as 1.)

**Decision**:
- `disjunctionCount(config)` in `queryParameterBuilder.js`, next to the code that builds the `in`s,
  returns the product of the non-empty multi-select lengths.
- `FilterConfig.vue` disables Apply, in both the card and the phone sheet, when the draft exceeds
  `MAX_DISJUNCTIONS = 30`, with one line: "Too many combinations — remove a season, map or strategy."
- No count preview for such a draft: `FilterConfig` passes `enabled: isDirty && !tooManyCombinations` to `useFilterCountPreview`, which already honours `enabled`. Also guard `handleApply` itself (it has several callers: the apply bar, the sheet, chip removal), so no path can apply an oversized draft.

**Verified on dev (T023, 2026-11-24)**: the list query with 3 seasons × 2 maps × 6 strategies is
refused with `invalid-argument`, "Too many disjunctions after normalization. Result had 36
disjunctions which is more than the maximum of 30". The same with 5 strategies (30) succeeds, so
the bound is inclusive at 30.

The list reads through `collectionService.getAll`, which catches the error, logs it to the console
and returns `undefined`. A user therefore sees an empty list, as if nothing matched, with no hint
that the filter itself was the problem. The guard's message replaces exactly that silence.

**Why here**: Constitution II, "a smell identified during development MUST … be addressed within the
same feature cycle". It was found while planning this feature's filter work.
