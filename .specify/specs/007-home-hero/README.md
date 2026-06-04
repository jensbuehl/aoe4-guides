# Handoff: Home Featured "Hero" Build (`007-home-hero`)

**Feature 4 of 4** — the final piece of the Home redesign split (sidebar → civ picker → build tabs → **hero**).
Full Spec Kit set + an exact CSS reference built for **pixel fidelity** (you flagged Claude deviating before — this is the antidote).

## What it does
- Adds a **featured hero** at the top of the build section: the active lane's #1 build, civ flag full-bleed with a **theme-aware diagonal fade** — **near-black + white text on dark, near-white + navy text on light**.
- **Swaps per tab** (composes with 006): Trending / All-Time Classics / New each get their own #1 build + eyebrow label.
- Whole hero is **one link** to the build detail; **excluded** from the list below; meta shows **real fields only** (strategy, author, timeCreated, views — no invented difficulty/rating).
- Presentation only — no data, schema, or read/write changes.

## Files
| File | What |
|---|---|
| `spec.md` | 3 user stories, FRs, success criteria |
| `plan.md` | Constitution check (PASS), the theme-aware fade spelled out, per-lane behavior, a11y |
| `tasks.md` | 16 tasks by story, Conventional Commits |
| **`css-reference.md`** | ⭐ Resolved tokens both themes + the **`--hero-*` vars and scrim gradient to copy VERBATIM** + markup + per-lane table + a11y + Vuetify mapping |
| `assets/hero-dark.png` | Fade-to-black, white title, gold eyebrow, navy badge |
| `assets/hero-light.png` | Fade-to-white, navy title, muted-gold eyebrow |
| `../_home-wireframe/home-wireframe.html` | Runnable wireframe (shared by all 4 features) |

## Fidelity guardrails (because you asked)
- The **scrim gradient** and the **`--hero-*` theme variables** are marked **"copy verbatim"** in `css-reference.md` — these are the exact bits that get approximated and cause rework. Every value is resolved per theme; no guessing.
- The README/spec call out the **one known prototype quirk** (eyebrow icon is hard-coded `mdi-trending-up` for all lanes) so the implementer makes a deliberate choice (1:1 copy vs. per-lane icon) rather than an accidental deviation.
- Screenshots are tight crops of the real mock in both themes as the visual ground truth.

## Touch points (grounded in real source)
- `src/views/Home.vue` (or `BuildLanes.vue` from 006) — hero at the top of the build section.
- Optional `src/components/home/FeaturedBuild.vue`.
- Add `--hero-*` to the Vuetify theme; reuse the existing `BuildDetails` route.

## Use
1. Copy to `specs/007-home-hero/` (renumber if needed); branch `007-home-hero`.
2. Implement from `tasks.md`; copy the scrim + `--hero-*` **verbatim** from `css-reference.md`.
3. Best landed **after** 006 (tabs) so the hero is per-lane immediately; a standalone fallback is specified (T010).

---

### The four-feature split is now complete
`004-home-sidebar` · `005-home-civ-picker` · `006-home-build-tabs` · `007-home-hero` — each independently shippable, each with spec + plan + tasks + screenshots, sharing one runnable wireframe (`specs/_home-wireframe/home-wireframe.html`) and the spacing system defined in `004/plan.md`.
