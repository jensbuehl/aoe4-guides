# Render contract — 028 Age Markers

The interface this feature exposes is a rendered list, not an API. This is what the desktop build
list guarantees after the change, written so it can be checked against a running page.

## Component contract

### `BuildOrderSectionEditor` — new prop

| Prop | Type | Required | Meaning |
|---|---|---|---|
| `arrivalTime` | `{ seconds: number, provenance: string } \| null` | no | The moment this `ageUp` section's target age is reached. `null` in the editing view and wherever it cannot be resolved. |

Supplied by `BuildOrderEditor` as `flatTimes[offsets[index + 1]]`. No other new prop, no new emit, no
new inject.

### Classes this feature owns

| Class | Applied to | Status |
|---|---|---|
| `age-lane-md` | every row of an `ageUp` section | **already applied in the template; gains its first CSS rule** |
| `age-advance-row` | the advance row | new |
| `age-plate-md` | the boundary bar | exists; gains a time |
| `age-marker-md` | the old advance banner | **removed** |

`alt-row`, `alt-row--start`, `alt-row--end`, `alt-inside` belong to `027` and are read, never
modified.

## Structural guarantees

1. **One box.** Exactly one element in the desktop list carries a fill, a border and a radius: the
   boundary bar. Verifiable by counting elements matching a background-and-border rule inside the
   build list.
2. **One rail per row.** Each row paints at most one rail segment, and it is always the
   `::before` of that row's first cell. No row has two.
3. **The gutter is outside the grid.** The rail is drawn at `left: -3px`, inside the table's `mx-4`
   margin. No column's computed x differs between a railed and an unrailed row.
4. **No added rows.** The rail introduces no element that occupies a row slot.
5. **The run.** For an `ageUp` section with at least one step, the railed run begins on the advance
   row and ends on the last row of that section's table. The boundary bar is not railed.
6. **Precedence.** A row carrying both `age-lane-md` and (`alt-inside` | `alt-row`) paints the
   alternatives colour, for both the rail and the row's background fade.

## Colour contract

| What | Token |
|---|---|
| Transition rail, advance label and glyph, boundary bar text, border and fill | `--v-theme-accent` |
| Alternatives rail and row fade | `--v-theme-alternative` |
| Row rule | the table's existing separator |

No literal colour values. No new tokens. Both are defined in both themes.

## Accessibility contract

- The `ageUp` section's card exposes `role="group"` with an `aria-label` naming the transition.
- The rail is decorative: it is a pseudo-element with `pointer-events: none` and contributes no text.
- The advance row's label and the boundary bar's age name are real text; the glyph and the age asset
  are `alt=""` / decorative and duplicate nothing.
- No row announces its rail context.

## What callers may rely on not changing

- `data-step-index` values, for every existing build.
- `flattenSections`, `sectionOffsets`, `forEachStep` behaviour and results.
- The economy crosshair link, the age timeline highlight and focus mode's step queue.
- Every `*-xs` class, rule and element — the mobile list is byte-identical.
- The build document schema.
