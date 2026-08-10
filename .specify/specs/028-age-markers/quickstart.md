# Quickstart — 028 Age Markers

## Where the work is

Almost all of it is in one file:
`src/components/builds/BuildOrderSectionEditor.vue`, desktop half only (`hidden-xs`, from
[:528](../../../src/components/builds/BuildOrderSectionEditor.vue#L528) down).

One prop is added in `src/components/builds/BuildOrderEditor.vue`.

**Do not touch anything above line 528** — that is the mobile list, and it is out of scope.

## The four moves

1. **Advance banner → row.** Delete `.age-marker-md` and its markup
   ([:531](../../../src/components/builds/BuildOrderSectionEditor.vue#L531)). Add a `<tr>` as the
   first row of an `ageUp` section's table, shaped like the merge row
   ([:648](../../../src/components/builds/BuildOrderSectionEditor.vue#L648)): icon cell, `colspan=7`
   label cell, `step-actions` cell carrying the existing age-down ✕.
1b. **The table's guard.** Replace `v-if="steps?.length"` with a computed that asks whether the table
   has *any* row to draw — a step, a note with content, or an advance row. This is what lets the
   advance row exist in a stepless age-up, and it fixes the lost section note (move 5).
2. **Arrival time on the bar.** New `arrivalTime` prop, rendered right-aligned on `.age-plate-md`
   with the `~`-for-derived rule `resolvedTime()` already uses.
3. **The gold rail.** Write the `.age-lane-md` rules. The class is **already applied** to every row
   that needs it — it just has no CSS. Copy the shape of the `.alt-inside` rules
   ([:2968](../../../src/components/builds/BuildOrderSectionEditor.vue#L2968)–[:3016](../../../src/components/builds/BuildOrderSectionEditor.vue#L3016))
   with `--v-theme-accent`, and gate them on `:not(.alt-inside):not(.alt-row)` so the innermost
   context wins.
4. **The group.** `role="group"` + `aria-label` on the `ageUp` section card.
5. **Notes never get lost.** Falls out of 1b: with the guard fixed, a section carrying only a note
   draws its note. Leave a comment at the guard saying why it is not `steps?.length` — the next
   person will otherwise "simplify" it back. Verify a section with a note and no steps, and a section
   with an emptied note and no steps (which must render nothing at all).

## Verifying

`npm run build` compiles templates and cannot catch a `ReferenceError` in `setup()`. After touching
the `.vue` files:

```
npm run check:setup     # every .vue file's setup() actually runs
npm run check:steps     # nothing reads a build by iterating steps directly
npm run build
```

`check:steps` matters here even though this feature adds no traversal: relaxing the table's `v-if`
and adding a row changes what the desktop template iterates, and a section's `steps` holds notes and
alternatives blocks as well as steps.

### What the checks cannot tell you

Everything this feature is about. Colour, alignment, seams and the rail are visual, and no script in
this repo can see them. Open a browser and check, in both themes:

| Check | Where to look |
|---|---|
| The advance is a plain row, the arrival the only box | any build with an age-up |
| Columns do not shift | a railed row against an unrailed one, at several widths |
| No seam gold → alternatives → gold | an alternatives block inside an age-up |
| Empty transition has no gutter | an imported build (they have bare age-ups) |
| Editor: ✕ lands in the step ✕'s column, row is not taller | edit a build with a final age-up |
| **Light theme** | the whole list — this is the one flagged as likely to need tuning |

Say plainly which of these were checked and which were not.

### Testing the logic without a browser

Per `CLAUDE.md`: a harness importing `@vue/reactivity` must sit **inside the project** (Node resolves
from the importing file), with an alias loader beside it for `@/…`. Write both to the repo root, run,
delete. For this feature there is little pure logic to drive — the arrival-time selection is the only
piece worth a harness, and it is a single index lookup.

## Traps recorded before you hit them

- **`isBareAgeUp` is deliberate.** In the reading view an empty age-up draws only the boundary bar —
  no advance marker. That is not a bug to fix while you are in there; imported builds rely on it.
- **The rail overhang is load-bearing.** `top: -2px; bottom: -2px` exists because a flush rail shows
  a nick at every row seam and at the zero-height insert row. Do not "clean it up" to `0`.
- **Do not round the rail.** The design's 8px radius belongs to a wrapper-based construction that is
  not what ships. Square ends, 1px overhang at a run's ends.
- **There are two kinds of note.** A note *item* is a step of a different kind and lives in
  `section.steps`. The *section* note is `section.gameplan`, a section field with no index, from
  before notes could be placed. Only the second one was getting lost, and only on desktop, because
  its row is inside the step table. Do not try to unify them here.
