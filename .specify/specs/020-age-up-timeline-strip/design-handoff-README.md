# Handoff: Build List Card — Timings In, Chips Out (`013-build-list-timings`)

Spec-Kit handoff for the **build list card** (`BuildListCard.vue`) and a new **age timeline** on the build details page. The card keeps its flag-left row shape but is re-zoned into **identity · what it is · who and when**: age-up times get a fixed, right-aligned rail (Feudal / Castle / Imperial as the game's own age crests), passive metadata drops to one quiet line, and chips are kept only for things that are **actionable or a state**. Card metadata also becomes **context-aware** — a field that is constant across the current list is not repeated on every row.

## The ask (verbatim intent)
- Design proposal for **listing builds** — are the cards and the list of cards OK, would I enrich or re-layout, is there a better practice.
- Add the **age-up timeline strip**: "Scanning `Builds.vue` tells you civ, author, season, map, views — but not the one thing that actually determines whether a build is what you want: when does it hit Feudal and Castle? A 2 TC Castle-at-9:00 boom and a Feudal-at-3:20 all-in are indistinguishable in the list. You have to open every card."
  - `getTimings(steps)` already interpolates missing timestamps from villager deltas; section structure already gives the age boundaries.
  - Firestore's client SDK has no field projection → the list query already ships `steps`; only CPU per card is new.
  - `getTimings` returns `null` when unusable → render no timings, never `??:??`.
  - On small screens show **age chips instead of** season/map, not in addition.
  - Interpolated times are estimates — visually distinct from author-stated ones.
- Use the **age icons** (Feudal/Castle/Imperial crests) instead of the words.
- **Fixed three-line body** — the title starts at the same offset on every card: title / people (author · creator) / stats (date · views · comments · season · map). The meta lines never wrap.
- Double-check **context-dependent data visibility** (civ view? sort criterion?).
- Include the **build details timeline** as a separate section, and say where it goes next to the existing data.

## Scope
**In:** `BuildListCard.vue` at all breakpoints; the contextual visibility rules it needs from `filterConfig` and its host views (`Builds`, `MyBuilds`, `MyFavorites`, `Dashboard`, home `BuildLaneTabs`); a new `useAgeTimings` composable; a new read-only `AgeTimeline.vue` on `BuildDetails.vue`.

**Out (unchanged):** the filter bar and its contexts (`008`), pagination and caching, the build editor and `BuildOrderSectionEditor` (`010`–`012`), Focus mode, `timingsHelper.js` itself (**read-only reuse — do not edit**), the icon-class tints, Firestore rules, routing, and the query/sort logic (adding `orderBy: castleTime` is explicitly a *later* feature, only enabled by this one).

## ⚠️ The three hard parts

### 1. Deriving the age boundaries (the whole feature depends on it)
`build.steps` is **two shapes**: legacy flat steps (no `type`) and the current sections array (`{type:'age'|'ageUp', age, gameplan, steps[]}`). `getTimings()` takes the **flattened step list** — flatten exactly the way `FocusMode.vue` does (concat `section.steps`, never insert section `gameplan` as its own item) or the indices won't line up with the timings array. "Age *n* reached" = the timing of the **first step of the first section with `type === 'age'` and `age === n`**; the `ageUp` section holds the "while aging up" steps and carries the age you are *leaving*. Legacy builds (`age: 0`, one section) have **no** boundaries → no rail. `design-input.md` §4 gives the resolved algorithm and the derived/stated flag.

### 2. Home lanes have no `steps`
`functions/builds/updateHomeSnapshot.js#pickBuildFields` writes a **whitelist** of fields — `steps` is not in it, so on the home lanes the card cannot derive anything client-side. Either ship the rail as "list views only" and let home degrade to no rail (zero backend work), or denormalize the timings on write and add one field to the snapshot. **NC-2** — decide before starting Phase 5.

### 3. Visibility must be driven by the list, not the card alone
Today the card decides alone and gets it wrong: the map chip is **dead code** (`filterConfig.map` doesn't exist — the field is `maps[]`), and views appear only for three of the six sort keys, so the row's content changes under the reader when they re-sort. The rule in `design-input.md` §3 is one sentence — *a field that is constant across the current list is not repeated on every row; the metric you sorted by is always shown* — and it needs the applied `filterConfig` plus one `context` prop.

## What changes
- **Desktop card (md+)** — three zones: flag (unchanged, `cols=3`) · body (title + a **people** line + a **stats** line) · **age rail** (132 px, right-aligned tabular times, `age_2/3/4.webp` crests, `—` for ages the build never reaches). The body is always exactly three lines, so body and rail are vertically centred and the title sits at a constant offset. Same card height as today (md grows 90 → 112 px).
- **Chips** — only `Draft` and `New` stay chips (state). Author and creator become links on the people line; date, views, comments, season and map form the stats line.
- **xs/sm** — age chips replace season and map in the existing chip row; one meta line of author · date · views; two-line title allowed.
- **Derived vs stated** — a plain time was stamped by the author; a `~`-prefixed lighter time was interpolated, with a "Estimated from villager count" tooltip. No dotted/underlined treatment (reads as a link).
- **Details page** — new `AgeTimeline.vue`: one shared 0–16:00 track, age markers with time + villager count, same `~` convention. Placed **directly above the Build Order card** (view route only) — see §5 of `design-input.md` for why there and not in the header.
- **Fixes** — the dead map chip, and views/score no longer disappear depending on `orderBy`.

## Fidelity
High-fidelity, **Vuetify only** (Principle III). The mock is not code to paste: `v-card`/`v-row`/`v-col` shell stays, the rail is a third `v-col`, crests are `v-img`, chips are `v-chip label size="small"`, the estimate note is a `v-tooltip`. `design-input.md` §1 lists the real theme tokens for both themes, §2 maps every mock element to its Vuetify component, §6 gives the **only** custom CSS (the rail grid, the fixed-title offset, the meta line).

## Files in this package
| File | What |
|---|---|
| `spec.md` | Scope + non-goals + 4 prioritized user stories + FR-001..028 + success criteria + 3 `[NEEDS CLARIFICATION]` |
| `design-input.md` | ⭐ Tokens · mock→Vuetify mapping · **contextual visibility matrix** · the age-boundary algorithm · details-page placement · the only custom CSS |
| `tasks.md` | ⭐ T-01..T-19 in 6 phases (composable → desktop card → context rules → xs/sm → details timeline → regression) |
| `assets/Build List Proposal.html` | ⭐ **Interactive reference** — today's chip soup, the recommended card, the three age treatments, derived/stated, xs, light theme, details strip |

> The working copy lives at **project root** (`Build List Proposal.html`) where `assets/flags/*` and `assets/res/*` resolve; the copy in `assets/` is archival. The mock loads the age crests from `assets/res/age_{2,3,4}.webp` — in the app they are `/assets/pictures/age/age_{2,3,4}.webp`.

## Grounded in real source (`jensbuehl/aoe4-guides@main`)
- `src/components/builds/BuildListCard.vue` — the card being reworked (chip sets, `height` per breakpoint, `orderBy`/`filterByMap` guards).
- `src/composables/builds/timingsHelper.js` — `getTimings()` **reused unchanged**, including its `null` contract.
- `src/components/builds/BuildOrderEditor.vue` — the authoritative section/age data model (`type: 'age' | 'ageUp'`, `age`, legacy migration).
- `src/components/builds/FocusMode.vue` — the existing, correct flattening of sections before `getTimings()`; copy that behaviour into the composable.
- `src/views/builds/{Builds,MyBuilds}.vue`, `src/components/home/BuildLaneTabs.vue`, `src/views/builds/Dashboard.vue` — the five consuming contexts.
- `src/components/filter/FilterConfig.vue` — the six sort keys and the `default | civ-locked | author-locked` contexts this card must respect.
- `src/views/builds/BuildDetails.vue`, `src/components/builds/BuildHeader.vue` — where the timeline section lands.
- `functions/builds/updateHomeSnapshot.js` — the field whitelist behind NC-2.

## Relationship to earlier features
- `006-home-build-tabs` and `008-filter-ux` both froze `BuildListCard` as out of scope. **This feature is the one that unfreezes it** — expect to touch home lanes only through the card's props.
- Composes with `012`: the details timeline uses the same age crests and gold age language as the desktop build-order lane.

## Use
1. Copy to `specs/013-build-list-timings/` (renumber if taken); branch `013-build-list-timings`.
2. Answer the three `[NEEDS CLARIFICATION]` in `spec.md` (NC-1 flag on civ-locked lists, NC-2 home lanes / denormalization, NC-3 timeline placement).
3. Work `tasks.md` in order — **T-02 (the composable) is the spine**; the card layout is meaningless until the timings are right.
4. Verify against the interactive mock, both themes, at xs/sm/md/lg, with: a build with full timings, a feudal-only build, a legacy flat build, and a build with no timestamps at all.
