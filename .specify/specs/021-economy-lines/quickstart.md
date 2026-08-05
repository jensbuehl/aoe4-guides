# Quickstart — `021-economy-lines`

The manual verification pass. The constitution requires no formal suite but does require the golden
path to be walked before merge, so this is the merge gate.

```powershell
npm run dev
```

Open a build details page at **≥960 px** (the `md` breakpoint). The Timeline card sits above the
build order.

---

## 1. Fixtures

Seven builds. Copy real ones out of Firestore into a scratch file rather than inventing steps — the
whole point of the gate constants is that they hold on real authoring habits.

| # | Fixture | Expect |
|---|---|---|
| F1 | Well-filled resource cells, most steps stamped | Economy row present; five lines with real slope |
| F2 | Author stops filling cells partway, but the build ages up later | Row present; lines **end** at the last step that assigns anybody; note **"No villagers assigned after m:ss"** |
| F3 | **Trailing steps unstamped**, cells well filled | Row present. This is the [R-1](research.md) regression — under the spec as written this build would have shown nothing |
| F4 | Prose-heavy, <50 % of steps state any cell | **No row.** Not present-but-empty |
| F5 | Short build, ratio passes but <4 plotted points state a cell | **No row** (the floor half of the gate) |
| F6 | No timestamps anywhere, cells well filled | **No row** — nothing can be placed on the axis |
| F7 | Legacy flat build (no sections) | No card at all, so no row — unchanged from today |

## 2. Golden path

1. **Collapsed on first load.** Clear the eco `localStorage` key, reload F1. The plot is collapsed.
   No expand animation, no layout shift on mount.
2. **Expand.** Activate the Economy row. The plot expands with the standard Vuetify expand
   transition; the chevron rotates.
3. **Alignment — the one that matters.** Screenshot the card. Each dashed vertical guide sits at the
   same x as the crest above it. Zoom to 400 % and check the Feudal guide against the Feudal crest:
   `±0 px`, not "close" (SC-001).
4. **No total line.** Count the lines: exactly five — builders, food, wood, gold, stone. Legend names
   exactly five, in that order.
5. **The counts agree with the table (SC-001a).** Pick three steps at random. At each, the five line
   values must sum to the `N vils` figure on that row of the build order. This is the check that
   catches the plot drifting from the numbers beside it — it failed before blank cells were fixed to
   read as zero.
6. **Stone.** On a build that never assigns stone, the stone line is flat at zero and still in the
   legend. Same for builders on a build that never pulls anyone onto construction.
7. **Preference across builds.** With Economy expanded on F1, open a different build. It opens
   expanded (SC-004). Reload: still expanded. Collapse, reload: still collapsed.
8. **Keyboard.** Tab to the row: focus is visible. Enter toggles. Space toggles. `aria-expanded`
   flips in the inspector.
9. **Collapsed height.** Compare against `main` in two windows. The card is taller by exactly the
   38 px row and nothing else has moved (SC-003).

## 3. Themes

Toggle light and dark with the plot expanded.

- All five lines readable on both surfaces.
- **Stone in light theme is the known risk** — it has no franchise colour and at low saturation sits
  near the neutral text colour. Check it on a **Sacred Sites** build specifically, where stone
  actually carries the build.
- Gridlines, guides and axis labels track the theme (they are on-surface tokens, not fixed colours).

## 4. Phones

At xs/sm: the card shows what it shows today — age chips, no Economy row, no plot. Resize a desktop
window down through `md` with the plot expanded: the row disappears cleanly, no error.

## 5. Robustness

With the dev console open, no errors or warnings across F1–F7. Then confirm the composable's guards
by hand on a scratch build: a section with `steps: []`, a step with `time: "<br>"`, a step with all
cells empty, duplicate timestamps, and times that run backwards. Nothing throws; the card still
renders.

## 6. Focus mode is untouched (SC-007)

`git diff main -- src/composables/builds/timingsHelper.js` must be **empty**. Then open F3 — the
build with unstamped trailing steps that now charts — and enter Focus mode: autoplay must still be
**unavailable** there, exactly as on `main`. That contrast is the feature working as designed: the
chart draws the known part, the player refuses a build it cannot play through.

Also spot-check a fully-stamped build (F1): autoplay still available, still steps at the right times.

## 7. Refactor check (commit 1, before any feature code)

The flatten extraction must be invisible. On a build with all four ages, screenshot the timeline
before and after the refactor commit — crest positions, times, `~` estimate markers, click-up
tooltips, and villager counts must all be identical. This is the Principle II gate: if anything
moved, the extraction changed behaviour and the commit is wrong.

## 8. Record the gate constants

Per assumption A-8, the 50 % / 4-point numbers are tuned offline, not measured in production. While
building, sample real builds and write the observed coverage distribution here — how many of the
sample pass, how many fail on the ratio, how many on the floor — so a later reader can see why the
constants are what they are instead of finding two unexplained numbers.

| Sample size | Pass | Fail (ratio) | Fail (floor) | Fail (no points) |
|---|---|---|---|---|
| _fill in_ | | | | |

## Not checked here

SC-005 (three archetypes distinguishable by silhouette alone) was **demoted on 2026-08-05** and does
not gate the feature. Worth a look while building; not a reason to hold the merge.
