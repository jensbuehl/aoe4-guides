# Handoff: Age Marker Rework (desktop)

## Overview

The build list draws "Advance to X Age" and "X Age reached" as identical full-width gold bars. They
are not the same kind of thing: the advance is an **action** the player takes at a moment, the
arrival is a **boundary** the build crosses. With four ages that is eight bars against roughly
eleven step rows — the markers out-shout the instructions they are meant to organise, and the
age-up transition between them is invisible.

This rework makes the advance a plain list row, makes the arrival the only boxed bar, and runs a
rail down the rows in between so the transition reads as a phase. It also defines how that rail
behaves when an alternatives block (feature 023) sits inside a transition.

**Desktop build list only. The mobile step list is explicitly unchanged.**

---

## About the design files

`Age Markers B.html` is a **design reference created in HTML** — a pannable canvas of six frames.
`Age Markers.html` holds the analysis of the current state and the options considered. Neither is
production code.

**The target is the real app: Vue 3 + Vuetify + Vuex, per `CLAUDE.md` and the project
constitution.**

> **Seamless integration beats fidelity to the mock.** Where the mock and the real components
> disagree, the real components win. The mock hand-rolls the table, rows and chips that the app
> already solves with Vuetify. Port the *decisions* — which element is a row and which is a bar,
> the rail rule, the alignment guarantee, the seam rule — not the CSS. Constitution Principle III
> (Vuetify before custom) governs.

## Fidelity

**Medium-fidelity.** Hierarchy, colour roles, row rhythm and the rail logic are decided and should
be followed. Pixel values are indicative — match the surrounding real components. Where the doc
gives a number it is stating intent ("same height as a step row"), not a constant to hard-code.

---

## The change

### 1 · Advance becomes a row

"Advance to X Age" renders as a **plain list row**: same height as a step row, same 1px top and
bottom rules, no box, no fill. It keeps its position in the step sequence — it is the row on which
the player clicks the landmark, so its place in the order is the information.

It carries the label and the standard time column, and **nothing else**. No duration, no arrival
time: the timeline above the build already states the span, and the arrival is on the boundary bar
two rows later.

### 2 · Arrival stays a bar

"X Age reached" becomes the **only boxed, tinted element in the list**. It carries:

- the age asset (`assets/res/age_2.webp` etc. — canonical, keep it),
- the age name,
- the **arrival time**, right-aligned.

Note on the icon: it is a circled Roman numeral, which at 20px in gold is a near-twin of a circled
transport glyph, and Ⅱ/Ⅲ/Ⅳ differ by one stroke. There is nothing to swap it for and it should
stay — but the **bar treatment and the age name** are what signal "boundary crossed". The numeral
only identifies which age. Do not lean on it.

### 3 · The transition gets a rail

Rows falling between an advance and its arrival carry a **3px gold rail** in a left gutter, with a
gradient fading right.

- It adds **no row**.
- It **does not indent** row content. Resource columns stay on the same grid as every other row.
- An age-up with no intermediate steps renders with **no rail and no empty gutter**.

The transition belongs to the age being *left* — "Advance to Feudal" happens in Dark Age — so the
bracket sits at the tail of a section and the boundary bar is the section's last item. That is what
keeps an alternatives block inside a transition compliant with the one-section constraint from 023.

---

## The nesting rule (depends on feature 023)

An alternatives block can sit **inside** a transition: "while the landmark is up, either wall or
push out."

**There is exactly one rail gutter for the whole list, and it paints the innermost open context.**

| Context | Rail |
|---|---|
| Plain rows | none |
| Inside a transition | gold |
| Inside an alternatives block | secondary |
| Alternatives inside a transition | secondary for the block's rows, gold before and after |

Never two rails side by side. Never an indent.

**Why not nest them:** indenting costs column alignment, which is the one thing the table format is
good at. The rail answers the *local* question — which of the two paths am I on — which is the
actionable one; whether you are still ageing up is already answered by the cap above and the age bar
below. The gold resuming after the merge is what tells you the transition never ended.

> ⚠️ This **reverses** the "rails nest, they do not compete" line in the 023 handoff. That was
> written for the mobile card list where indenting is cheap. Mobile keeps its current treatment for
> now; if the two are unified later, unify toward this rule.

**Accepted cost:** a reader glancing at one row mid-block sees only the secondary rail. Not
mitigated — an age-up phase is a handful of rows.

### Hard requirements that fall out of it

- **Depth is capped at two by construction.** Transition ⊃ alternatives is the only nesting;
  alternatives cannot nest and an age-up cannot open inside a path. A third rail is unreachable.
- **Seams must be invisible.** Gold → secondary → gold renders as one continuous line: no margin
  gaps between segments, no interior rounded corners. Corners round only at the very start and end
  of a run. (Both were visible defects in the first draft.)
- **Nothing is sticky.** No sticky caps, no sticky tabs. The transition is short enough.
- **A block cannot straddle a boundary.** An alternatives block opening inside a transition must
  close inside it; the editor refuses to move the merge marker past the age bar — the same rule that
  already stops it crossing an age-up.
- **Focus mode is unaffected.** It shows one step at a time, so there is no rail. The transition
  contributes a cue at the advance and a cue at the arrival, exactly as today.

---

## Row rhythm

Every annotation row is a plain list row — same height as a step row, same 1px rules:

- the advance cap
- the alternatives path tabs
- a note row
- the merge marker

**"X Age reached" is the sole boxed element in the list.** That exception is the whole signal. If
anything else acquires a box, the feature stops working.

---

## Design tokens

Do not introduce new colours. Use the real theme tokens from `reference/design-tokens.md` and the
Vuetify theme; the mock's values are listed only so you can map them.

Gold denotes **where you are in the build** — ages, timings, primary actions. Secondary denotes
**which way you went** — alternatives. The rail obeys that split and nothing else.

| Mock value | Role |
|---|---|
| `#e7c05e` | Transition rail, advance label, boundary bar text and border |
| `rgba(231,192,94,.09)` → transparent | Transition rail gradient |
| `rgba(231,192,94,.2)` → `rgba(231,192,94,.03)` | Boundary bar fill |
| `rgba(231,192,94,.28)` | Boundary bar border |
| `#7fa0e8` | Alternatives rail (from 023) |
| `rgba(255,255,255,.07)` | The 1px row rule |

Geometry (indicative): rail 3px; row height ≈41px; boundary bar radius 9px; rail run radius 8px at
the outer corners only.

Both light and dark themes must work. Watch the light theme specifically — the gold rail gradient at
low alpha needs to stay visible without becoming a solid block.

---

## Assets

Age icons `assets/res/age_2.webp`, `age_3.webp`, `age_4.webp` — already in the app.
MDI `mdi-arrow-up-bold`, `mdi-call-split`, `mdi-call-merge`, `mdi-information-outline` — already in
the app. No new assets.

---

## Suggested build order

1. Advance → plain row; arrival → boxed bar with the arrival time. Ships alone, fixes most of it.
2. Transition rail, including the empty-transition collapse.
3. Single-rail context stack + seam handling. Only meaningful once 023 has landed.
4. Light-theme pass on both rail colours.

---

## Open items

- **Mobile.** Deliberately untouched. Its current treatment nests the rails; if the two surfaces are
  unified later, unify toward the single-rail rule.
- **Collapsed/summary rendering.** The rejected "one marker per age" layout is a good fit for a build
  card preview or the economy graph's age ticks. Not designed.

---

## Files

- `Age Markers B.html` — the detailed design. Six frames: anatomy, alternatives in a section, the
  three nesting variants, and the rules.
- `Age Markers.html` — analysis of the current state and the three options considered.
- `Branch Annotations.html` — feature 023, which this interacts with.
- `reference/design-tokens.md` — real theme tokens from `jensbuehl/aoe4-guides@main`.
- `assets/` — age, resource, unit and building icons used by the mocks.

## Spec Kit

Repo spec at `specs/024-age-markers/` — `spec.md` (user stories, FR-001…FR-013, success criteria),
`design-input.md` (the reasoning, and the two rejected variants), `assets/` (frame captures). Follow
the repo's spec → plan → tasks flow from there; this README is the design-side companion.

Related: `specs/023-build-alternatives/`. User Story 3 depends on it; Stories 1 and 2 do not.
