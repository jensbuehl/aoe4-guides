# Research: Home Sidebar Rework

**Feature**: 004-home-sidebar | **Date**: 2026-06-03

This feature is pure presentation — no backend, no new dependencies, no new data sources. Research focuses on four decisions that affect template structure.

---

## Decision 1 — Card border approach

**Question**: How to add a consistent subtle border to all sidebar cards?

**Decision**: `v-card border rounded="lg"` (Vuetify 3 `border` prop).

**Rationale**: The `border` prop uses `currentColor` with a low opacity via CSS variable, adapting automatically to both light and dark themes without any custom CSS. `variant="outlined"` forces the card surface colour to transparent, which breaks the interior fill. A raw CSS `border` bypasses Vuetify's theme variables. The `border` prop is the idiomatic choice.

**Alternatives considered**:
- `variant="outlined"` — transparent background breaks dark-mode card fill.
- Custom CSS `border: 1px solid rgba(...)` — bypasses theme variables, requires manual dark/light upkeep.

---

## Decision 2 — Top Contributors layout: single card vs individual cards per row

**Question**: Keep one `v-card` per contributor (current) or wrap all rows inside one card?

**Decision**: Single `v-card border rounded="lg"` wrapping all contributor rows.

**Rationale**: The design prototype shows a unified ranked list — one card, no card-per-row borders. Individual cards give each contributor equal visual weight and create a fragmented appearance with 8 entries. A single card with lightweight rows (alternating hover tint or subtle dividers) reads as a leaderboard. It also reduces DOM depth.

**Alternatives considered**:
- Individual `v-card` per row (current approach) — breaks down visually at 8+ rows; too much chrome.

---

## Decision 3 — Top Contributors cap location

**Question**: Is the current 4-contributor cap enforced in UI code or in the Cloud Function?

**Decision**: Cap is in the **Cloud Function** (data), not the UI. No `.slice()` or breakpoint-count cap exists in `Home.vue` or its computed properties (verified by code review). The template iterates `v-for="contributor in topContributorsList"` with no limit.

**Rationale**: The Cloud Function `updateHomeSnapshot` writes `topContributors: [top4]`. This feature makes the UI layout correct for any count; the Cloud Function change to emit 8+ contributors is tracked as a separate optional task.

**Impact on implementation**: T008 in `tasks.md` does not need to remove a UI `.slice()`. Instead, it verifies the `v-for` has no cap and that the card layout handles 8 rows without breaking.

---

## Decision 4 — Season card copy (static text)

**Question**: What is the exact hardcoded copy for the Season 13 card?

**Decision**: Write the copy directly in `News.vue` template, matching the design prototype. Proposed strings:

| Element | Copy |
|---|---|
| Tag | `Season 13 · Live` |
| Title | `Yue Fei's Legacy` |
| Blurb | `The new Jin Dynasty civilization is fully supported — start sharing your guides.` |

**Rationale**: Existing `News.vue` already uses hardcoded static strings for the season title and description; the design screenshot shows this exact copy. No data binding needed.

**Note**: The stale Season 11 banner (`/Season11-banner.webp`) is removed. The beta alert and store buttons are removed.

---

## Decision 5 — YoutubeGuides card consistency

**Question**: Does `YoutubeGuides.vue` need changes to match the new card style?

**Decision**: Yes — add `border` prop to its internal `v-card flat` to become `v-card border rounded="lg"`, and move the title ("Youtube Guides") inside the card as a `v-card-title`.

**Rationale**: The design prototype shows the Video Guides card with the same bordered-card treatment as the Season and Top Contributors cards. The current `YoutubeGuides.vue` uses `v-card flat` and has its section header (`v-row` with icon + text) rendered outside the card — inconsistent with the new pattern.
