# Design Input — `021-economy-lines`

Resolved values. Source of truth for anything visual is
`assets/Eco Shape Proposal.html` (Option F, and Option E row 1). Where the mock and the app
disagree on a path or token name, **the app wins**.

---

## 1. Tokens

Reuse everything `AgeTimeline.vue` already declares. Only the four resource line colours are new.

| Line | Dark | Light |
|---|---|---|
| Builders | `#8C6D4F` | `#6B5133` |
| Food | `#C05C4A` | `#A8452F` |
| Wood | `#6E8F55` | `#4E6F3B` |
| Gold | `#D8B45C` | `#B8913A` |
| Stone | `#8894A6` | `#6B7787` |

Builders are a muted brown — the hammer's material, and far enough from gold's yellow that the two
do not read as one line where they cross low on the plot.

Declared per theme in the component's scoped style, exactly like the existing `.age-seg-*` ramp
(`.v-theme--customLightTheme` overrides). These are the icon hues pulled down toward that ramp's
weight — full-saturation game colours overpower the light surface.

Everything else — gridlines, guides, labels — is
`rgba(var(--v-theme-on-surface), …)` at the opacities already used in `AgeTimeline.vue`
(`.13` gridlines, `.22` age guides, `--v-disabled-opacity` axis labels).

**Stone is the risk case.** It is the only resource with no franchise colour, and at low saturation
it sits close to the neutral text colour. Check it on a Sacred Sites build in light theme.

---

## 2. Geometry

| Thing | Value |
|---|---|
| plot height | 140 px (md+ only) |
| x scale | `scaleSeconds` **passed as a prop from `AgeTimeline.vue`** — never recomputed |
| y floor | 16 villagers *(was 24 — see note)* |
| y extension | `Math.max(16, Math.ceil(maxValue / 4) * 4)` |
| gridlines | every 4 villagers, label at the left edge, 9 px |
| line stroke | 2.25 px, `stroke-linejoin/linecap: round`, no smoothing |
| end cap | 2.6 px filled circle at the last stated point |
| age guides | 1 px dashed `3 3`, on-surface at .22 |
| faded tail | *removed — with no carry-forward there is nothing to fade; the line just ends* |
| disclosure row | 38 px tall, `border-top` in the card's existing divider colour |

**No curve interpolation.** Straight segments between stated points. A build order is a list of
snapshots; a spline would draw values the author never wrote.

**The y floor was 24 in the mock and is wrong at that value.** 24 was sized for the total-villager
line §6 rejects — no single resource gets near it. Built and viewed on a real build, the lines drew
in the bottom third of an empty box. 16 with gridlines every 4 keeps the shared-scale property that
earns the floor while giving the lines the plot and doubling the gridline resolution.

---

## 3. Series algorithm — `useEcoSeries.js`

> **Superseded during implementation.** The pseudocode below carries values forward across steps,
> which is wrong: `aggregateVillagers` reads a blank cell as nobody, so a carried plot contradicts
> the `N vils` figure on the very same row. The live contract is
> [contracts/eco-series.md](contracts/eco-series.md) — each step is read on its own, blanks are zero,
> and a step that assigns nobody contributes no point. Builders are also drawn now. Kept here for
> the shape of the derivation only.

```
getEcoSeries(steps):
  1. flat = flattenSections(steps)          // SHARED helper, extracted from useAgeTimings.js
     if (!flat.length) return null
  2. timings = getTimings(flat)             // reused unchanged (020 contract)
     if (!timings) return null
  3. cur = { food:0, wood:0, gold:0, stone:0 }
     points = []; statedCount = 0; lastStated = null
     for (i, step) of flat:
       stated = false
       for key of ['food','wood','gold','stone']:
         raw = step[key]
         if (raw != null && String(raw).trim() !== ''):     // "0" IS a stated zero
           cur[key] = parseVillagerCountString(String(raw)) // same parser as the vils numbers
           stated = true
       if (stated) { statedCount++; lastStated = timings[i]?.startTime }
       if (timings[i]?.startTime != null)
         points.push({ seconds: timings[i].startTime, ...cur, stated })
  4. coverage = statedCount / flat.length
     if (coverage < 0.5) return null                        // NC-2: instrument this
  5. return { points: sortBy(points, 'seconds'), coverage, lastStatedSeconds: lastStated }
```

Notes:

- `builders` is read by nobody here — deliberately. It is transient, and its dips would read as eco
  collapsing. It still counts toward the `N vils` markers above, which is correct and unchanged.
- Step 3 uses `parseVillagerCountString` (currently module-private in `villagerAggregator.js`).
  Export it; do not reimplement the `a+b` handling anywhere else.
- Memoize with `computed` over the `steps` prop, like `getAgeTimings` already is.

---

## 4. Component structure

```
AgeTimeline.vue  (existing card — collapsed view unchanged)
├── section header · mdi-timer-sand · TIMELINE
├── track + crests + axis                      ← untouched
└── v-if="eco"  (md+ only)
    ├── disclosure row  · mdi-chart-line · Economy · hint · chevron
    └── v-expand-transition
        └── <EcoLines :series="eco" :scale-seconds="scaleSeconds" :ages="ages" />
```

`EcoLines.vue` props: `series` (from the composable), `scaleSeconds`, `ages`. No store access, no
data derivation of its own — it is a pure renderer, which keeps it testable and keeps the two
charts on one scale by construction.

---

## 5. Vuetify mapping

| Element | Vuetify |
|---|---|
| disclosure row | `v-btn variant="text" block` — `justify-start`, `height="38"`, `:aria-expanded` |
| row icons | `v-icon` `mdi-chart-line` (leading), `mdi-chevron-down` (trailing, `rotate-180` when open) |
| reveal | `v-expand-transition` |
| legend | plain flex row of 9 px swatches + `text-caption text-medium-emphasis` |
| plot | inline `<svg>` — no chart library (Principle I) |

The chevron rotation is a CSS transform on the icon, matching how the app's other expanders behave;
don't swap the icon glyph.

---

## 6. What NOT to build (all mocked and rejected — see the archival mock)

| Rejected | Why |
|---|---|
| Stacked area | Bands above food inherit food's climb; the three archetypes looked alike |
| Total-villager line | Sits above everything, halves the usable plot; already on every marker |
| Separate card under the header | Two x-axes a card apart; the reader has to align them by eye |
| Discrete columns | Honest to the data, but the silhouette — the whole point — gets weaker |
| Per-age split bars | Readable, but averages away every spike |
| List-card sparkline | Unreadable at 112 px beside a 132 px age rail |
| Share-of-pop lines | Separates archetypes well, but "how big is this eco" is the commoner question. Keep as a possible toggle later; **not** in this feature |

---

## 7. Copy (verbatim)

- Disclosure label: **Economy**
- Subtitle (medium emphasis), **the same open and closed**: **villagers per resource**
  *(The mock swapped this for "food · wood · gold · stone over time" when collapsed. Dropped: the
  row reads as a heading, and a heading that rewrites itself on click is movement without meaning.)*
- Legend items, in the build order table's column order: **Builders · Food · Wood · Gold · Stone**
- Note when the build continues past its last villager assignment:
  **No villagers assigned after 7:10**
- y-axis labels: bare numbers (`8`, `16`, `24`) — no "vils" suffix, the legend carries the meaning
