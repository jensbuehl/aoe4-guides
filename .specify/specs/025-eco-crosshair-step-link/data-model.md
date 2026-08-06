# Phase 1 Data Model: Crosshair Readout & Step ↔ Timeline Linking

**Feature**: `025-eco-crosshair-step-link` | **Date**: 2026-08-06

All state here is client-side and lives for one page view. **No Firestore document, field or index
changes.** Nothing is persisted — not even to `localStorage`, unlike the plot's open/closed
preference.

---

## 1. Series point *(modified — additive)*

Produced by `getEcoSeries()` in `useEcoSeries.js`. One per described moment.

| Field | Type | Source | Notes |
|---|---|---|---|
| `seconds` | `number` | `resolveStepTimes` | Position on the shared time axis |
| `stated` | `boolean` | `resolveStepTimes` provenance | `false` ⇒ the time is displayed with `~` |
| `builders` `food` `wood` `gold` `stone` | `number` | the step's cells | Always integers the author entered |
| **`stepIndex`** | **`number`** | **flattened step position** | **NEW.** Index into `flattenSections(steps)` |

**Invariants**

- `stepIndex` is an index into the **flattened** list, never a section-local one (FR-029).
- Points remain sorted ascending by `seconds`. The sort happens after `stepIndex` is attached, so
  `stepIndex` is *not* monotonic — a build with out-of-order timestamps sorts its points while the
  indices stay attached to their rows. **Do not assume `points[i].stepIndex === i`.**
- The five counts are authored values (FR-008). Nothing downstream may compute a displayed count.

**Why additive only**: the coverage gates, the rewind check, the redundant-step mask and the sort
are all untouched. A build that charts today charts identically after this change, which is what
makes the change committable on its own (NFR-003).

---

## 2. Active moment *(new)*

What both halves agree is currently highlighted. **Time is the required part; everything else is
optional** — this is the shape that lets a comment row light up the age track (FR-020).

| Field | Type | Required | Notes |
|---|---|---|---|
| `seconds` | `number` | ✅ | Where the rule is drawn, on both the age track and the plot |
| `stated` | `boolean` | ✅ | Whether to render `~` beside the time |
| `stepIndex` | `number \| null` | — | The row to highlight. `null` ⇒ no row highlight |
| `point` | `SeriesPoint \| null` | — | `null` ⇒ no dots and no counts, rule only |

**State transitions**

```text
                 pointer moves inside plot, within drawn range
   (none) ────────────────────────────────────────────────────►  full
                                                                (seconds + point + stepIndex)
   (none) ────────────────────────────────────────────────────►  time-only
                 row hovered, card visible, step has a time        (seconds, point = null)

   full | time-only ──── pointer leaves plot ─────────────────►  (none)
   full | time-only ──── row unhovered ──────────────────────►  (none)
   full | time-only ──── other source takes over ────────────►  replaced (FR-030)
   full ─────────────── click inside plot ───────────────────►  unchanged + scroll to stepIndex
```

**Invariants**

- Exactly one of `{ none, full, time-only }`. A `point` without `seconds` is unrepresentable.
- When `point` is set, `seconds === point.seconds` and `stepIndex === point.stepIndex` — the plot
  never disagrees with itself.
- A row hover may produce a **full** moment when that row happens to have a series point; the two
  shapes are distinguished by the data, not by which source set them.

---

## 3. Highlight source *(new)*

Which half currently drives. Exists only so the two cannot fight (FR-030).

| Value | Set by | Cleared by |
|---|---|---|
| `"plot"` | pointer movement inside the economy plot | pointer leaving the plot |
| `"table"` | a build order row hover surviving the intent delay | row unhover, or the card leaving the viewport |
| `null` | — | resting state |

**Invariants**

- Setting a moment from one source replaces whatever the other had. Last writer wins; there is no
  queue and no precedence order.
- Clearing only takes effect if the clearing source is the one currently holding. A stale
  `mouseleave` from the table must not wipe a highlight the plot has since taken over.

---

## 4. Section offset map *(new, extracted)*

Not new *state* — a derived mapping that already exists twice in the codebase (research R-3),
extracted so all three callers share one implementation.

| Input | Output |
|---|---|
| the sections array | for each section, the flat index its first step occupies |

**Invariants**

- Sections with no `steps` array contribute a length of zero and do not break the walk. This matches
  the existing behaviour in `BuildOrderEditor.vue:228-232`, which the extraction must preserve
  exactly — it is a refactor, not a fix.
- `offset[i] + sectionLocalIndex` is the flat index. This is the **only** sanctioned translation
  between the two index spaces.

---

## 5. Local plot emphasis *(existing — unchanged)*

`hovered` and `pinned` in `EcoLines.vue`, holding a resource key. Recorded here only to state that
they are **deliberately excluded** from the shared state (research R-10). Nothing outside the plot
reads them, and FR-012 requires only that they coexist with the crosshair.

---

## Entity relationships

```text
  BuildDetails.vue
        │  creates one   useStepHighlight()
        │  provides ───────────────┬───────────────────────────┐
        ▼                          ▼                           ▼
  AgeTimeline.vue            BuildOrderEditor.vue        (any future consumer)
        │                          │
        │ owns scale               │ owns section offsets
        ▼                          ▼
  EcoLines.vue              BuildOrderSectionEditor.vue
   writes: full moment        writes: time-only moment
   reads:  seconds (rule)     reads:  stepIndex (row highlight)
```

The arrows are the whole contract. Neither leaf imports the other, and neither knows the other
exists — they know only about the highlight.
