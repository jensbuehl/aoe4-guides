# Contract: `useStepHighlight()`

**File**: `src/composables/builds/useStepHighlight.js` *(new)*
**Feature**: `025-eco-crosshair-step-link`

The single channel between the Timeline card and the build order. It is a **factory**: calling it
creates an independent highlight. It must never hold module-level state (FR-028, research R-9).

---

## Provide / inject

```js
export const STEP_HIGHLIGHT = Symbol("stepHighlight");
```

`BuildDetails.vue` calls the factory once and provides the result under that key. Both halves inject
it. A `Symbol` rather than a string so an injection cannot collide with anything else provided.

**Consumers MUST tolerate an absent injection.** `BuildOrderEditor` is also rendered by the editor
route, where no Timeline card exists and nothing provides the highlight. Injecting with a null
default and no-op'ing is what keeps this feature out of the editor (spec scope, A-6).

```js
const highlight = inject(STEP_HIGHLIGHT, null);
```

---

## Returned shape

```js
{
  // ---- read ----
  moment,          // ComputedRef<ActiveMoment | null>
  stepIndex,       // ComputedRef<number | null>  — convenience; null when no row is implicated
  source,          // ComputedRef<'plot' | 'table' | null>

  // ---- write ----
  setFromPlot,     // (point: SeriesPoint) => void
  setFromTable,    // (seconds: number, stated: boolean, stepIndex: number) => void
  clear,           // (from: 'plot' | 'table') => void

  // ---- navigation ----
  requestScroll,   // (stepIndex: number) => void
  onScrollRequest, // (handler: (stepIndex: number) => void) => void
}
```

### `moment`

`null` at rest. Otherwise the Active Moment described in [data-model.md](../data-model.md#2-active-moment-new).
`point` is `null` for a time-only moment — consumers MUST branch on that rather than assuming counts
exist (FR-020).

### `setFromPlot(point)`

Takes a full series point. Sets a **full** moment and claims `source = 'plot'`, replacing whatever
the table had (FR-030). Derives `seconds`, `stated` and `stepIndex` from the point, so the plot
cannot set a moment that disagrees with itself.

### `setFromTable(seconds, stated, stepIndex)`

Sets a **time-only** moment and claims `source = 'table'`. The caller passes a **flat** step index
(FR-029); translating from a section-local index is the caller's job and must use the shared offset
helper.

Callers MUST NOT call this while the Timeline card is out of the viewport (FR-022) or while the
scroll latch is engaged (FR-024). Those gates live in the calling component, not here — the
composable is a channel, not a policy.

### `clear(from)`

Clears **only if `source === from`**. A stale `mouseleave` from the table must not wipe a highlight
the plot has since taken over.

### `requestScroll(stepIndex)` / `onScrollRequest(handler)`

A one-shot signal, not state. The plot calls `requestScroll`; the build order registers the handler
and owns the actual scrolling — it is the only component that holds the row elements. Kept out of
`moment` because scrolling is an event, and folding it into reactive state would make a re-render
scroll the page a second time.

---

## Invariants

1. **Factory only.** No `ref` may be declared outside the exported function.
2. **One writer.** `source` is authoritative; a write from one source silently supersedes the other.
3. **Flat indices only.** Every `stepIndex` crossing this boundary is an index into
   `flattenSections(steps)`.
4. **No policy.** Intent delay, viewport gating and the scroll latch belong to the callers. This
   composable holds no timers and adds no listeners.
5. **No persistence.** Nothing here is written to storage or to Firestore.

---

## Non-goals

- **Not** a replacement for Focus mode's `currentStepIndex`. That is a playback position; this is a
  hover. Spec A-7 forbids merging them in this feature.
- **Not** a home for the plot's resource emphasis (`hovered` / `pinned`). Those stay local to
  `EcoLines.vue` — nothing outside the plot reads them (research R-10).
- **Not** a general step-selection bus. If a third consumer ever appears, revisit; until then the
  surface stays this small.
