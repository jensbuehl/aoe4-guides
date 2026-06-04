# Handoff: Home Civilization Picker (`005-home-civ-picker`)

**Feature 2 of 4** in the Home redesign split (sidebar → **civ picker** → build tabs → hero).
Full Spec Kit set **plus** an exact CSS reference so Claude Code can replicate pixel-faithfully.

## What it does
- Replaces the tall 2-column civ **list** with a **dense flag-tile grid** (uniform 16:10 tiles; 5/4/3 responsive columns).
- **Name on hover + keyboard focus + tooltip** — tiles stay clean, identity stays accessible (name always in the a11y tree via `aria-label`/`alt`).
- **Header search** filters live by **name or tagline**, with a clear control and an **empty state**.
- Keeps the existing **NEW** recent-build marker and the existing navigation target.
- Presentation only — no data, schema, or read/write changes.

## Files
| File | What |
|---|---|
| `spec.md` | 3 user stories, FRs, success criteria |
| `plan.md` | Constitution check (PASS), structure, a11y plan, Vuetify mapping |
| `tasks.md` | 18 tasks by story, Conventional Commits |
| **`css-reference.md`** | ⭐ **Resolved tokens (both themes) + full drop-in CSS + markup + a11y rules + Vuetify cheatsheet** |
| `assets/civ-grid-dark.png` | Dense grid (dark) |
| `assets/civ-hover-reveal.png` | Hover/focus name reveal |
| `assets/civ-search-filter.png` | Live search filtering |
| `../_home-wireframe/home-wireframe.html` | Runnable wireframe (shared by all 4 features) |

## Why the CSS reference exists
You asked for "accessible CSS information so Claude Code with Spec Kit can replicate in the most perfect way." `css-reference.md` delivers exactly that:
- Every `var(--*)` **resolved to a concrete hex for both themes** (no guessing).
- The **complete CSS** for search, grid, tile, hover-reveal, NEW badge, empty state, and breakpoints.
- An **accessibility section** (the name is hover-revealed, so the non-visual name path is specified in full).
- A **Vuetify mapping** so the implementer reaches for `v-text-field`/`v-card`/`v-img`/`v-chip` first and only drops to custom CSS for the two bits Vuetify can't express (hover-reveal overlay, focus ring) — honoring Constitution III.

## Touch points (grounded in real source)
- `src/views/Home.vue` — civ-picker region; remove duplicated xs/sm/md list blocks.
- Optional `src/components/home/CivPicker.vue` — one responsive component holding search + grid (Principle II win).
- Existing civ provider + civ→builds route/query reused unchanged.

## Use
1. Copy to `specs/005-home-civ-picker/` (renumber if needed); branch `005-home-civ-picker`.
2. Implement from `tasks.md`; pull exact styling from `css-reference.md`.

Shared visual reference for all four features: `Home Redesign.html` (project root) / `specs/_home-wireframe/home-wireframe.html`.
