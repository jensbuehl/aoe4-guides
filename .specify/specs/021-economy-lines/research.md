# Research — `021-economy-lines`

**Phase 0 output.** Everything here was checked against the code on `main`, not inferred from the
handoff.

**Status**: the corrections R-1, R-2 and R-5 called for have been **applied to
[spec.md](spec.md)** (FR-006 split into FR-006/FR-006a, US3 scenario 3 rewritten, SC-006 widened,
SC-007 and A-9 added).

---

## R-1 — `getTimings()` returns `null` for any build whose trailing steps are unstamped

**This is the finding that matters most. As specified, the feature would be invisible on a large
share of builds.**

The spec's series algorithm gates on `getTimings(flat)`: `if (!timings) return null`. `getTimings`
([timingsHelper.js:3](../../../src/composables/builds/timingsHelper.js#L3)) builds a timing per
step, interpolates the gaps, and then returns `null` unless **every** step resolved:

```js
const valid = timings.every((element) => element.startTime !== null);
return valid ? timings : null;
```

`interpolate()` only fills gaps *between* two anchor steps. Steps after the last anchor are never
filled, so a single unstamped trailing step nulls the whole build.

Probed against representative shapes (throwaway harness, both helpers copied verbatim):

| Build shape | `getTimings` result |
|---|---|
| Every step stamped | `0, 60, 120, 210` |
| Gaps in the middle, last step stamped | `0, 60, 135, 210` |
| **Stamped early, last two steps unstamped** | **`null`** |
| Stamped only at age-ups, last step stamped | `0, 120, 210, 305, 420` |
| First step stamped but assigns nobody | `0, 60, 120` |
| Resource cells filled, no timestamps at all | `null` |

"Stops stamping partway" is not an exotic case — it is the shape [US3 acceptance scenario 4](spec.md)
explicitly designs the faded tail for. The spec therefore contains a contradiction: it promises a
faded tail for builds that stop stating values, while gating on a function that returns `null` for
exactly those builds.

`useAgeTimings.js` already knows this. It isolates the call in its own `try`, with the comment *"It
gives up on the whole build if any single step is unresolvable — common"*, and falls back to each
age boundary's own stated timestamp. That is why the Timeline card survives where `getTimings`
does not.

### Decision — place points per step, not per build

`useEcoSeries` resolves each step's x independently, in this order:

1. the step's own stated time, via `toDateFromString(step.time)` — authoritative when present;
2. otherwise `getTimings(flat)[i].startTime`, **when that call succeeded** — the interpolated value;
3. otherwise the step is not plottable and contributes no point.

`getTimings` stays in the picture as a bonus, wrapped in `try`/`catch` exactly as
`getAgeTimings` wraps it, and its `null` return stops being fatal.

### `timingsHelper.js` itself must not change — Focus mode depends on the strict contract

Worth being explicit, because "fix `getTimings` to return partial timings" is the tempting shortcut
and it would break something real:

```js
stepsTimings.value = getTimings(steps.value);
autoplaySupported.value = stepsTimings.value ? true : false;
```

[FocusMode.vue:346](../../../src/components/builds/FocusMode.vue#L346). Autoplay is binary — a build
either has a time for every step and can be played through, or it cannot be played automatically at
all. There is no half-auto, half-manual mode to degrade into. The all-or-nothing return **is** that
answer, and it is correct there.

A chart is the opposite kind of consumer: it can honestly draw the part that is known and say
nothing about the rest. So the asymmetry is the design, not an inconsistency — the same call, read
strictly by the player and leniently by the plot.

**Decision**: `timingsHelper.js` is byte-identical to `main` when this feature merges (SC-007). All
leniency lives in `useEcoSeries`. Recorded as assumption **A-9** in the spec so a later reader does
not "clean up" the helper and silently hand autoplay builds it cannot play.

**Rationale**: plotting a subset of steps is honest — the line simply has fewer vertices. Nothing is
invented, and a build that stamps only its age-ups still draws a real chart. It also makes step 1
the same rule the crests use, so the two charts read time identically by construction rather than by
coincidence.

**Alternatives considered**:

- *Keep the `getTimings` gate as specified.* Rejected — silently hides the feature on the builds it
  was designed for, and the absence is indistinguishable from the coverage gate firing.
- *Reuse `getAgeTimings`'s `resolveAt` wholesale.* Rejected — it is entangled with boundary and
  click-up resolution and would drag age semantics into an eco composable. The three-line rule
  above is the part that transfers.
- *Interpolate the trailing steps ourselves.* Rejected — inventing times past the last anchor states
  as fact something the author never wrote.

### Spec corrections — applied

- **FR-006** split: FR-006 now defines per-step time resolution and states that a build-wide failure
  must not suppress the chart; FR-006a carries the coverage gate.
- **US3 acceptance scenario 3** rewritten. It claimed *"the whole card is already absent in this
  case under `020`"*, which is false — `getAgeTimings` survives a `null` from `getTimings`, so the
  card renders with crests while the Economy row would vanish. It now asserts that a build with **no
  plottable points** shows no row.
- **SC-007** and **A-9** added to pin `timingsHelper.js` unchanged (see below).

---

## R-2 — The coverage floor needs to count plotted points, not stated steps

Follows from R-1. Once a step can fail to be plottable, "≥4 stated steps" and "≥4 points on the
chart" stop being the same number: a build could state eight resource cells and place two of them.

**Decision**: the ratio half of FR-006a keeps its denominator (all flattened steps — it is measuring
whether the *author* filled the build in). The floor half moves to plotted points: **≥4 points that
both state at least one resource cell and resolve to a time.** That is the number that decides
whether the chart has a shape, which is what the floor was added for.

---

## R-3 — Age-up guides must come from the `ages` prop, never recomputed

`getAgeTimings` rounds interpolated boundaries (`Math.round(interpolated)`) while `getTimings`
returns unrounded floats. On a 960-second scale across ~700 px, a half-second difference is ~0.36 px
— below perception but not `±0 px`, which is what [SC-001](spec.md) demands.

**Decision**: `EcoLines` draws its dashed guides from the `ages` prop it is handed, the same array
the crests are positioned from. No independent derivation of age times inside the plot. SC-001 then
holds by construction rather than by arithmetic luck.

Residual, accepted: an eco *point* whose step is an interpolated age boundary may sit up to ~0.4 px
from that age's guide. Invisible, and documented here so it is not rediscovered as a bug.

---

## R-10 — A blank cell means **zero**, not "unchanged" *(found during implementation, supersedes R-4)*

The spec's FR-003 said an unset cell means "unchanged" and each column carries forward. Built and
looked at on a real build, that produces a plot that contradicts the numbers printed beside it.

`aggregateVillagers` — the source of the `N vils` figure on every age marker and step row — sums the
five cells and reads a blank as nobody:

```js
return builders + food + wood + gold + stone || null;
```

So on a step whose only filled cell is `wood 7`, the villager total is **7**. A carried-forward plot
claimed food was still 6 on that same step, i.e. 13 villagers. The plot and the marker disagreeing
about one row is precisely what FR-005 and C-5 exist to prevent — and carry-forward broke it while
appearing to honour it, because it used the right parser on the wrong model.

**Decision**: each point is one step's own reading. Blank cells are `0`. Nothing carries.

A step that assigns **nobody at all** is a separate case: an age-up, a comment, a bare timestamp. It
makes no claim about the economy, so it contributes no point rather than dragging every line to
zero. This is exactly what `villagersAt()`
([useAgeTimings.js:152](../../../src/composables/builds/useAgeTimings.js#L152)) already does — it
walks back to the last step with a *non-null* total, skipping the silent ones. The distinction I
missed originally is that it skips **whole steps**; it does not carry **individual columns** across
steps that do speak.

**Consequences**:

- **R-4 is obsolete.** It argued `hasResourceValue()` could not be reused because it reads `"0"` as
  unset while FR-004 wanted a stated zero. There is no longer a distinction to preserve: a blank and
  a typed `"0"` mean the same thing, which is also how the build order table renders them (both `–`,
  via that same helper). Recorded as assumption **A-10**.
- **The faded tail loses its subject.** It existed to mark carried values as unobserved. With no
  carried values, a line simply ends where the author stopped assigning villagers. The note survives
  in reduced form — shown only when the build's *ages continue past* that moment, so an early ending
  reads as the description stopping rather than the build stopping.
- **New SC-001a**: every point's five counts must sum to that step's `N vils` figure. Asserted
  mechanically in the harness, because this is the invariant that failed silently.

---

## R-4 — `hasResourceValue()` must not be reused for stated-cell detection *(superseded by R-10)*

[villagerAggregator.js:27](../../../src/composables/builds/villagerAggregator.js#L27) already exports
a tempting-looking helper:

```js
export function hasResourceValue(value) {
  return parseVillagerCountString(value != null ? String(value) : "") > 0;
}
```

It treats an explicit `"0"` as unset — the direct opposite of **FR-004**, which requires `"0"` to
count as a stated zero. Reusing it would make "moved everyone off gold" invisible to the coverage
gate and, worse, carry the previous gold value forward across the very step that zeroed it.

**Decision**: `useEcoSeries` tests raw non-emptiness itself (`raw != null && String(raw).trim() !==
""`). `hasResourceValue` is left alone; a comment in the new composable records why it was not used.

---

## R-5 — `parseVillagerCountString` is module-private and must be exported

It is not exported today ([villagerAggregator.js:31](../../../src/composables/builds/villagerAggregator.js#L31)).
FR-005 requires the plot to use the same parser as the `N vils` markers, so the export is
unavoidable.

**Decision**: export it unchanged, in the refactor commit. Its two known defects — only the first
two `+` operands are read, and a fishing boat counts as a villager — are inherited deliberately per
assumption A-1. A comment on the export records that this is a shared contract now, so a future
fix is understood to move every villager number on the site at once.

**Consequence for SC-006**: the criterion listed four files that may change. `villagerAggregator.js`
is a fifth — SC-006 has been widened accordingly.

---

## R-6 — Flatten extraction: a cursor, not a second nested loop

`getAgeTimings` flattens sections and collects age boundaries in **one** pass, because a boundary
records `index: flat.length` at the moment it is seen. Extracting a pure `flattenSections(steps)`
removes the running length the boundary logic depends on.

**Decision**: `flattenSections(steps)` returns the flat array only. The boundary pass then walks
sections again with its own cursor:

```js
const flat = flattenSections(steps);
let cursor = 0;
for (const section of steps) {
  const len = section?.steps?.length ?? 0;
  /* ageUp / age boundary logic, using `cursor` where `flat.length` was */
  cursor += len;
}
```

Two cheap passes over an array of ~30. Behaviour is identical, including the `pendingClickUpIndex`
carry and the "section without steps cannot be a boundary" rule, both of which stay in the second
pass untouched.

**Alternatives considered**: returning `{ flat, sectionOffsets }` — rejected as a wider contract
than either caller needs (Principle I); leaving the flatten duplicated in `useEcoSeries` — rejected,
it is the one thing the spec's Principle II refactor exists to prevent.

---

## R-7 — Legacy flat builds

`getAgeTimings` returns `[]` when `steps[0]?.type` is undefined, so legacy builds render no card at
all and the Economy row is unreachable. **Decision**: `useEcoSeries` applies the same guard and
returns `null` rather than treating a flat array as one giant section. No behaviour to design.

---

## R-8 — Open-state persistence: no new composable

The app's only preference precedent is
[useThemePreference.js](../../../src/composables/useThemePreference.js) — a three-function module
over one `localStorage` key. Per the 2026-08-05 clarification the eco preference is device-local, so
it needs the same mechanism.

**Decision**: keep it inline in `AgeTimeline.vue` — a module-level storage key plus a read on setup
and a write on toggle, roughly eight lines. Principle I: one call site does not justify a module,
and SC-006 already counts files. If a second collapsible preference appears later, that is the
second occurrence that earns the extraction.

Reads are wrapped so a browser with storage disabled degrades to "collapsed, does not persist"
rather than throwing during render.

---

## R-9 — `v-expand-transition` does not animate on mount

Vue transitions skip the initial render unless `appear` is set. Wrapping the plot in
`<v-expand-transition>` therefore satisfies **FR-017** as long as `appear` is not added — including
for a reader whose stored preference is "open", where the child starts present and simply renders
without animating. Recorded because it looks like a risk and is not one.

**Decision**: `v-expand-transition` + **`v-if`**, no `appear`. `v-if` rather than `v-show` because
NFR-004 asks for the SVG to exist only when expanded; `v-show` would render all five polylines into
the DOM for every reader and then hide them with CSS, which is the opposite of the point. The cost
is one component mount on first expand, on data already computed.
