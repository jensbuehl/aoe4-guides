# Contract — `EcoLines.vue`

**File**: `src/components/builds/EcoLines.vue` (new)

A pure renderer. It derives no data, reads no store, fetches nothing, and owns no state. Everything
it draws arrives as a prop — which is what makes "the two charts can never disagree by a pixel"
a structural property rather than a discipline.

## Props

| Prop | Type | Required | Meaning |
|---|---|---|---|
| `series` | `Object` | yes | The `useEcoSeries` return value — `{ points, coverage, lastStatedSeconds }`. Never `null`: the parent does not render this component when the series is `null` |
| `scaleSeconds` | `Number` | yes | Full width of the track in seconds. **Passed down from `AgeTimeline.vue`, never recomputed** (FR-009) |
| `ages` | `Array` | yes | `getAgeTimings()` output. Guides are drawn from `age.seconds` — the same numbers the crests are positioned from ([research.md](../research.md) R-3) |

No emits. No slots. No `v-model`.

## Rendering contract

| # | Rule | Spec |
|---|---|---|
| P-1 | Exactly **five** polylines — builders, food, wood, gold, stone — of absolute villager counts, in the build order table's column order. No stacking, no total line | FR-008 |
| P-2 | x = `seconds / scaleSeconds`, clamped to `[0, 1]` of the plot width | FR-009 |
| P-3 | Step is the narrowest of `4, 8, 16` that keeps `ceil(max(16, maxValue) / step)` at **6 gridlines or fewer**; y max = `max(16, ceil(maxValue / step) * step)`; gridlines and left-edge labels every step; bare numbers, no "vils" suffix | FR-010 |
| P-4 | One dashed vertical guide per entry in `ages`, at `age.seconds` — **not** at any time this component derives | FR-011, R-3 |
| P-5 | Lines simply end at the last point — there is nothing carried, so nothing to fade. When the build's **ages continue past** `lastStatedSeconds`, the legend area carries **"No villagers assigned after m:ss"** | FR-012 |
| P-6 | Legend names all five columns with their line colours, and lists nothing the plot does not draw | FR-013 |
| P-7 | A column never assigned is drawn flat at zero and still appears in the legend — its absence is information | US1 scenario 3 |
| P-8 | Straight segments only. **No curve interpolation** — a spline would draw values the author never wrote | design-input §2 |
| P-9 | Non-interactive: no tooltip, crosshair, hover state, or pointer cursor | FR-014 |
| P-10 | `aria-hidden="true"`, not focusable, no `role="img"` and no text alternative. Every value is already in the build order table below, so the graphic is marked decorative | FR-021 |
| P-11 | A two-point excursion (one villager on stone for two steps) stays visible — minimum stroke, no smoothing that erases it | Edge Cases |

## Geometry and tokens

Resolved in [design-input.md](../design-input.md) §1–§2. Load-bearing values:

| Thing | Value |
|---|---|
| plot height | 140 px |
| y floor / step | 16 villagers in 4s; step widens to 8 then 16 past 6 gridlines |
| line stroke | 2.25 px, round join/cap |
| end cap | 2.6 px filled circle at the last point |
| age guides | 1 px dashed `3 3`, on-surface at `.22` |
| gridlines | on-surface at `.13`; axis labels at `--v-disabled-opacity`, 9 px |

Resource colours are declared **per theme** in scoped style, exactly like the existing `.age-seg-*`
ramp overrides `.v-theme--customLightTheme` in `AgeTimeline.vue`. Full-saturation game colours
overpower the light surface, so the light values are pulled down toward that ramp's weight.

**Stone is the risk case** — the only resource with no franchise colour, and at low saturation it
sits close to the neutral text colour. Check it on a Sacred Sites build in light theme before
closing the feature.

---

# Contract — `AgeTimeline.vue` (modified)

## Additions

| # | Rule | Spec |
|---|---|---|
| A-1 | The row and plot live **inside** the existing `d-none d-md-block` block. Absent at xs/sm, where the card already falls back to age chips | FR-019, US4 |
| A-2 | The row renders only when `useEcoSeries` returns non-`null` | FR-019 |
| A-3 | Row is a Vuetify `v-btn variant="text" block`, `justify-start`, `height="38"`, `border-top` in the card's existing divider colour | FR-016 |
| A-4 | Leading `mdi-chart-line`, label **Economy**, right-aligned subtitle, trailing `mdi-chevron-down` rotated 180° when open — CSS transform on the icon, never a glyph swap | FR-016 |
| A-5 | Subtitle copy, verbatim and **identical in both states**: **"villagers per resource"** | design-input §7 |
| A-6 | `aria-expanded` bound to the open state; focusable; activates on Enter/Space (a `v-btn` gives all three) | US2 scenario 4 |
| A-7 | `v-expand-transition` + `v-if`, **no `appear`** — so nothing animates on mount, and the SVG mounts only on expand | FR-017, NFR-004, R-9 |
| A-8 | Open state persists device-locally in one `localStorage` key, read once on setup and written on toggle. Default collapsed. Reads/writes wrapped so disabled storage degrades to "collapsed, does not persist" | FR-015, FR-018, R-8 |
| A-9 | The collapsed card is otherwise **pixel-identical** to today's — the only added height is the 38 px row | FR-020, SC-003 |

## Unchanged (must not move)

The section header, the age track and its segment ramp, the crests, the tooltips, the villager
markers, the axis, and the `d-md-none` `AgeChips` fallback. The `ages` and `scaleSeconds` computeds
gain a consumer; their definitions do not change.
