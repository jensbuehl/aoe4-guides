# Quickstart & Verification: Age-Up Band

**Feature**: `026-age-up-band` | **Date**: 2026-08-07

No automated suite exists (spec A-6, constitution). This document **is** the test script.

---

## Run it

```bash
npm run dev            # Vite dev server
```

Open any build's detail page. The Timeline card sits above the build order. **Widen the window past
960 px** — below `md` the card falls back to `AgeChips` and there is no track to draw on (spec A-5).

---

## Fixtures needed

Four builds, per spec A-6. Note the ids here once found, so re-verification uses the same four.

| | Build | Needed for |
|---|---|---|
| **B1** | Fully stamped, age-up sections on every age | Bands on every transition, US1 |
| **B2** | Sparsely stamped — times derived | Bands drawn the same as B1's; only the crests' `~` differs |
| **B3** | Has an age-up section for one age but not another | Mixed presence, US3 |
| **B4** | No age-up sections at all | Regression, US4 / SC-006 |

A build that ages up twice in quick succession (**B5**) is wanted for item 8 but is rare; if none
exists on the site, force it by editing a local copy's timestamps.

---

## Phase gates

Each phase must pass its own items before the next begins.

### Phase 0 — ramp refactor *(behaviour-neutral)*

| # | Check | Expect |
|---|---|---|
| 1 | Open B1 in **dark** theme, screenshot the track. Compare against `main`. | Pixel-identical |
| 2 | Same in **light** theme. | Pixel-identical |
| 3 | `git diff` the composable | **Empty** — Phase 0 is CSS only |

If items 1–2 are not identical, the custom properties were transcribed wrong. Fix before continuing;
everything downstream inherits these four triplets.

### Phase 1 — bands drawn

| # | Check | Expect | Covers |
|---|---|---|---|
| 4 | Open **B1** | A striped band precedes each crest, spanning click-up → arrival | FR-001, US1 |
| 5 | Hover each crest, read "Age-up took" against the band's width | The longest duration is the widest band, proportionally | FR-002, SC-001 |
| 6 | Look at any band | No text on it | FR-003 |
| 7 | Look at a band and the segment after it | Same hue, clearly different treatment — not one continuous age | FR-004 |
| 8 | Open **B5** (or forced fixture) | Two touching bands stay separable | FR-017, **R-10's overturn check** |
| 9 | Open **B3** | Bands only where an age-up section exists; track continuous, no gap | FR-013, FR-018 |
| 10 | Open **B4**, compare against `main` | Indistinguishable | FR-018, SC-006 |
| 11 | On every fixture, sum the run widths in devtools | 100% — no second drawn twice or dropped | FR-007, SC-004 |
| 12 | Compare card height and crest x-positions against `main`, all fixtures | Identical | FR-019, FR-020, SC-005 |
| 13 | Find the shortest real age-up on the site | Band visible, and **not** wider than its duration warrants | FR-008 |

### Phase 2 — the stripe

US2 was withdrawn: there is no solid variant and no hatched variant, so the old items 14–16
(solid on B1, hatched on B2, compare the two) no longer exist. What remains is that the stripe
itself works.

| # | Check | Expect | Covers |
|---|---|---|---|
| 14 | Open **B1** and **B2** side by side | Bands drawn **identically** — provenance is not on the track | FR-009 |
| 15 | Look at any band against the segment it leads into | Reads as "in progress", not as a paler age | FR-004 |
| 16 | *(retired — was: compare a hatched and a solid band)* | — | — |
| 17 | Find the shortest band on the site | Stripe still legible — not one ambiguous diagonal | FR-011, SC-002 |
| 18 | Open a build with age-ups on every age, step back from the screen | Still reads as a timeline, not as a texture | SC-007 |
| 19 | Toggle theme with bands on screen, both directions | Bands correct in both; no flash of an unthemed fill | FR-006 |
| 20 | Hover any crest on B1 and B2 | Tooltip still names click-up, arrival and duration, `~` on derived — **now the only provenance signal** | FR-012 |

---

### Cross-cutting

| # | Check | Expect | Covers |
|---|---|---|---|
| 21 | Open a build with a **zero-duration** click-up (same timestamp on the age-up and age section) | **No band.** Tooltip still shows "Age-up took 0:00" | FR-015, R-5 |
| 22 | Open the economy plot on a build with bands; sweep the crosshair | Dashed age guides and the rule are unchanged and still land on arrivals | Spec non-goals |
| 23 | Tab through the card with a screen reader | Nothing new announced; crest labels unchanged | NFR-005 |
| 24 | Console, all fixtures | No warnings — particularly no Vue duplicate-key warning | G-4 |

---

## Success criteria → items

| SC | Items |
|---|---|
| SC-001 | 5 |
| SC-002 | 17 |
| SC-003 | 9, 21 — extend to ten builds |
| SC-004 | 11 |
| SC-005 | 12 |
| SC-006 | 10 |
| SC-007 | 18 |

**SC-003 needs ten builds, not four.** Items 9 and 21 are the check; run them across a ten-build
sample before calling the feature done. This is the single most tedious item here and the one most
likely to be skipped — it is also the one that would catch a bad admission rule.

---

## No degradation path needed

An earlier draft leaned on `color-mix` and accepted that browsers without it would render bands
indistinguishably. The stripe is built from `rgba()` over channel triplets instead (research R-8),
which is universally supported — there is no fallback to test and none to get wrong.
