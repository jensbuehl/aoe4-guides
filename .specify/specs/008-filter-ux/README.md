# Handoff: Filter UX Redesign (`008-filter-ux`)

Spec-Kit handoff for the build-order **filter experience**, across every page that has a filter. Full set: spec + plan + tasks + an exact CSS/Vuetify reference + screenshots.

## Scope
**All filtered pages**, three contexts:
- **Default** — *All Builds*, *My Builds*, *My Favorites*, *Dashboard* (all filters editable).
- **Civ-locked** — civ pre-selected & not editable; reduced filters; sort hidden; **count on top of each of the 3 lists** (moves into the tab once feature 006 lands).
- **Author-locked** — author pre-selected; all filters editable; author shown as a proper **page header**.

What it adds (keeping **apply-on-demand** — no document fetches until Apply):
- **Active-filter chips** (glanceable + one-click remove) with an empty state.
- **Draft → Apply** model with **pending** indicators and a **sticky Apply bar** ("Apply N changes", no layout shift).
- **Live count preview** ("≈ N results if applied") that reuses the **existing `getBuildsCount()`** aggregation — count only, no doc reads; with an "off" fallback.
- **Separated Sort** group and a **unified count pill** shown once per page.
- Replaces the small in-filter-column contributor strip with a real **author page header**.

## Explicitly out of scope / deferred
- **`BuildListCard` is NOT changed.** Only the filter bar, states, count placement, and page headers.
- Civ **tabbed-lanes** (feature 006) and the broader header redesign are deferred; per-list counts are the interim civ treatment.

## Files
| File | What |
|---|---|
| `spec.md` | Clarifications + 4 user stories + FRs (incl. FR-014 bug fix) + success criteria |
| `plan.md` | Constitution check (PASS), the **draft/applied state model**, contexts table, a11y, structure |
| `tasks.md` | 27 tasks by story, Conventional Commits |
| **`css-reference.md`** | ⭐ Resolved tokens (both themes) + the two **contrast fixes** + full CSS for chips/footer/heroes + the **Vuetify component mapping** |
| `assets/main-default.png` | Default, no filters (chips empty-state, separated Sort, sticky bar) |
| `assets/main-staged.png` | Staged: chips + pending dots + "Apply 2 changes" + "≈ 5 results if applied" |
| `assets/author-locked.png` | Author page header replacing the in-column strip |
| `assets/civ-locked.png` | Civ field hidden + lock note + sort hidden + per-list counts |
| `assets/main-light.png` | Light theme |

## Why the controls look custom in the mock (important)
The prototype hand-rolls its select boxes **only because it's a framework-free HTML mock** — there's no Vuetify in it. **The implementation keeps the existing Vuetify `v-autocomplete` / `v-select multiple chips` / `v-select` controls.** `css-reference.md` §7 maps every UI piece to its Vuetify component and marks the only genuinely-custom CSS (chips-pending tint, pending dot, sticky footer, sort divider, hero headers). This is called out so Claude Code doesn't faithfully reproduce the mock's custom widgets and trigger rework.

## Grounded in real source
- `FilterConfig.vue` — the shared bar (and the `creat`→`creator` typo bug, fixed here as FR-014).
- `Builds.vue` — already calls **`getBuildsCount(filterConfig)`** (count aggregation) on apply → the preview reuses it; and hosts the duplicated 70px contributor strip the author header replaces.
- `MyBuilds.vue` / `MyFavorites.vue` / `Dashboard.vue` — other hosts of the same bar.

## Use
1. Copy to `specs/008-filter-ux/` (renumber if needed); branch `008-filter-ux`.
2. Implement from `tasks.md`; pull exact styling + the Vuetify mapping from `css-reference.md`.

Interactive reference: `Filter UX.html` (project root) — Tweaks toggle context, theme, count-preview on/off, chips, and sort placement.
