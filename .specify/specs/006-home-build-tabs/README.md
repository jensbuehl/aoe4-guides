# Handoff: Home Build Lane Tabs (`006-home-build-tabs`)

**Feature 3 of 4** in the Home redesign split (sidebar → civ picker → **build tabs** → hero).
Full Spec Kit set + an exact CSS reference.

## What it does
- Replaces the three **stacked** build lists with a **tabbed** section — Trending · All-Time Classics · New — one lane visible at a time, **swapped in place** (no navigation, no refetch).
- Adds a contextual **View all** that links to the existing Builds list pre-sorted for the active lane (`score` / `scoreAllTime` / `timeCreated`) — exactly today's section-arrow behavior.
- **Reuses the existing `BuildListCard` unchanged** — the card is explicitly out of scope.
- Implements the proper **tab a11y model** (tablist/tab/tabpanel, arrow-key roving focus, visible focus, reduced-motion).
- Presentation only — no data, schema, or read/write changes; switching tabs causes **no** new Firestore reads.

## Files
| File | What |
|---|---|
| `spec.md` | 3 user stories, FRs, success criteria |
| `plan.md` | Constitution check (PASS), structure, a11y plan, Vuetify mapping |
| `tasks.md` | 16 tasks by story, Conventional Commits |
| **`css-reference.md`** | ⭐ Resolved tokens (both themes) + full tab CSS + markup + behavior contract + View-all→orderBy table + Vuetify (`v-tabs`/`v-window`) mapping + a11y |
| `assets/tabs-trending.png` | Trending active (gold underline; placeholder card below) |
| `assets/tabs-new.png` | New active (list swaps in place) |
| `../_home-wireframe/home-wireframe.html` | Runnable wireframe (shared by all 4 features) |

## Note on the screenshots
The cards shown in the stills are the existing/placeholder card — this feature changes the **tab structure**, not the card. `BuildListCard` is reused as-is (FR-003).

## Touch points (grounded in real source)
- `src/views/Home.vue` — build-list section; the three sorted slices already exist here (they feed today's stacked lists).
- Optional `src/components/home/BuildLanes.vue` — `v-tabs` + `v-window` + the slices + View all.
- Existing Builds route + `orderBy` values reused unchanged.

## Use
1. Copy to `specs/006-home-build-tabs/` (renumber if needed); branch `006-home-build-tabs`.
2. Implement from `tasks.md`; pull exact styling/behavior from `css-reference.md`.

Shared visual reference for all four features: `Home Redesign.html` (project root) / `specs/_home-wireframe/home-wireframe.html`.
