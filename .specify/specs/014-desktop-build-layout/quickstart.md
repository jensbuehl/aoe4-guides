# Quickstart: Desktop Build View & Editor Layout (`014-desktop-build-layout`)

## Orientation

Three source files change. Everything else is untouched.

```
BuildHeader.vue            ← civ lockup (smallest change, do this first to warm up)
BuildOrderEditor.vue       ← remove alignment function, update ageUp seeding
BuildOrderSectionEditor.vue ← the main event: update desktop v-table (colgroup widths, insert rows, querySelectorAll)
```

Read `research.md` before touching `BuildOrderSectionEditor.vue`. Specifically section 1 (WYSIWYG chain) and section 1.2 (DOM access touch-points).

## Where to start

**Start with `BuildHeader.vue` desktop section** (`d-none d-md-block`):
1. Add the civ lockup div (flag img + civ name) before the chip group in the body column
2. Remove the `v-chip` for `build.civ` from the desktop chip group
3. Verify at 1280 px — civ lockup should be prominent; no horizontal scroll (SC-001)
4. Verify mobile — no visual change

**Then `BuildOrderEditor.vue`**:
1. Delete `alignTableColumnWidthsAcrossSections` and all call-sites (onMounted, nextTick wrapper)
2. Remove `@textChanged` handler from `<BuildOrderSectionEditor>`
3. Update `ageUp()` — after `nextTick`, call `focusFirstNewTimestamp()` (which the section editor exposes via a scoped method or a prop callback)

**Then `BuildOrderSectionEditor.vue` desktop section** — the main work, do in this order:
1. Add `<colgroup>` with fixed column widths to the existing `v-table` (view mode only, no interactivity changes yet). Verify columns align across sections.
2. Implement step row cells in view mode: timestamp, villager total, 5 resource cells, description (read-only `v-html`). Mark each data row `class="step-row"`.
3. Add delta accent (`hasDeltaUp` computed + `.d-up` class on resource `<td>`s)
4. Add empty cell rendering (faint dash when value is absent)
5. Add the age-transition lane (`.lane-group`, `.age-marker`, `.lane`, `.age-plate`) — view mode
6. Implement edit mode: timestamp `<input>` (bind `registerTimestampRef`), resource inputs, WYSIWYG note with corner button
7. Implement insert rows (`<tr class="ins-row">` between step rows + trailing insert — edit only); update all `stepsTable.value.rows[index]` references to `stepsTable.value.querySelectorAll('tr.step-row')[index]`
8. Implement hover ✕ remove per row
9. Add section note row (gameplan) WYSIWYG — replace the old gameplan table + button with a `<tr class="bo-noterow">` spanning all columns + corner button
10. Add Tab key handler (FR-029)
11. Add empty build state (0 steps) — header row + placeholder row + leading insert row (edit mode)

## First acceptance check

After step 1 (colgroup + view mode cells), run SC-001:
> At ≥1280 px, the view route reads header → description → build order → video with no horizontal scroll, and every resource value sits in a stable column across all rows.

After step 6 (edit mode), run SC-002:
> Toggle between view and edit — row heights, column positions, and first-line alignment should be identical (measure with browser devtools overlay).

After step 6, run SC-003/004:
> Insert 3+ icons in a step note, save, reload — icons present, no raw `::id::` visible. Insert icon at various caret positions — caret lands after icon, 0 px height change.

## Reference files

| What | Where |
|------|-------|
| Interactive prototype | `.specify/specs/014-desktop-build-layout/assets/Desktop Build Redesign.html` (open from project root) |
| Resolved tokens + CSS | `design-input.md` §1 (tokens), §3 (visual reference — column widths adapted to `<colgroup>`, not CSS grid) |
| Mock → Vuetify mapping | `design-input.md` §2 |
| WYSIWYG chain | `research.md` §1 |
| DOM touch-points | `research.md` §1.2 (querySelectorAll update table) |
| Component contract | `contracts/BuildOrderSectionEditor-contract.md` |
| Header contract | `contracts/BuildHeader-contract.md` |

## What NOT to change

- `src/composables/builds/contentEditableHelper.js` — frozen
- `src/components/builds/IconSelector.vue` — frozen
- `src/components/builds/IconAutoCompleteMenu.vue` — frozen
- `src/views/builds/BuildDetails.vue` — no changes needed
- `src/views/builds/BuildEditor.vue` — no changes needed
- All mobile CSS in `BuildOrderSectionEditor.vue` (`hidden-sm-and-up` section and all `.xs-*` classes) — byte-for-byte unchanged
- The icon-class tile radial-gradient tints (FR-009) — do not touch
