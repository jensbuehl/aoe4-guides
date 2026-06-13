# Contract: BuildOrderSectionEditor.vue

> `src/components/builds/BuildOrderSectionEditor.vue`

## Props (unchanged)

| Prop | Type | Description |
|------|------|-------------|
| `section` | Object | `{ type, age, gameplan, steps[] }` — one age section |
| `readonly` | Boolean | `true` = view mode; `false` = edit mode |
| `civ` | String | Civilization short name — drives icon service |
| `focus` | Boolean | Whether this section is the currently focused one |
| `isLastAgeUp` | Boolean | True if this is the last ageUp section — controls ✕ visibility |

## Emits (unchanged)

| Event | Payload | When |
|-------|---------|------|
| `stepsChanged` | `steps[]` | After any step mutation (add, remove, field update) |
| `selectionChanged` | — | When the user clicks into this section |
| `gameplanChanged` | `string` (HTML) | When gameplan contenteditable blurs |
| `ageDownRequested` | — | When the ✕ on the ageUp header is clicked |

> Note: `textChanged` emit (previously used to trigger `alignTableColumnWidthsAcrossSections`) is **removed** in this feature since fixed `<colgroup>` widths make the JS alignment pass obsolete.

## DOM Invariants (WYSIWYG preservation contract)

These invariants must hold. The desktop `v-table` is kept; only the row selector changes to account for insert rows.

### stepsTable ref (unchanged)

```js
const stepsTable = ref(null);          // bound to <tbody>
const descriptionColumnIndex = 7;      // description is still column 7 of each step row
```

- `stepsTable.value.querySelectorAll('tr.step-row')[i].cells[descriptionColumnIndex]` is the `contenteditable` DOM element for `steps[i].description`
- The `querySelectorAll('tr.step-row')` selector filters out `<tr class="ins-row">` insert rows that are interspersed in `<tbody>`
- Data rows are marked: `<tr class="step-row" …>`
- Used in: `showAutoCompleteMenu`, `handleContentEditableKeyUp`, `handleAutoCompleteMenuIconSelected`, `addStep`, `removeStep`

### timestampRefs array (new — for FR-021/FR-029 only)

```js
const timestampRefs = ref([]);
function registerTimestampRef(el, index) { timestampRefs.value[index] = el; }
```

- `timestampRefs.value[i]` is the timestamp `<input>` element for `steps[i].time`
- Bound in the desktop `v-for` as `:ref="el => registerTimestampRef(el, index)"` on the timestamp input
- Used by `BuildOrderEditor.vue` to focus the new timestamp after `ageUp()` (FR-021)
- Also used by Tab-key handler in Note cell (FR-029)

### gameplanContentEditable ref (unchanged)

```js
const gameplanContentEditable = ref(null);
```

- Bound directly to the gameplan `<td>` contenteditable (same pattern as before — no change)

### Two-copy invariant

`steps[i].description` and `stepsCopy[i].description` stay in sync via:
- `updateStepDescription(event, i)` on `focusout` of the note cell → writes `stepsCopy`
- `addStep` / `removeStep` → reads from `stepsTable.value.querySelectorAll('tr.step-row')[i].cells[descriptionColumnIndex].innerHTML` before mutating arrays, then restores after mutation
- Never write to the `contenteditable` cell via `v-html` while the element has focus

## Desktop Layout — Table Structure (`v-table`)

```
v-table (desktop, d-none d-md-block)
├── colgroup                (fixed column widths: 64px · 44px · 52×5 · minmax(0,1fr) [· 30px edit])
├── thead
│   └── tr.bo-legend        (header: time · villagers · Builder · Food · Wood · Gold · Stone · Desc [· ✕])
└── tbody (ref="stepsTable")
    ├── tr.ins-row           (trailing insert — edit only, shown when steps.length === 0)
    ├── [v-for each step]
    │   ├── tr.ins-row       (insert before this step — edit only)
    │   └── tr.step-row
    │       ├── td.bo-time   (timestamp — view) | td > input (edit)
    │       ├── td.bo-pop    (villager total — read-only)
    │       ├── td.rc        (Builder — view) | td > input.rc (edit)  ← ×5 for Builder/Food/Wood/Gold/Stone
    │       └── td.wys-wrap
    │           ├── [contenteditable] .wys  (description)
    │           └── .wys-fab               (corner Insert-icon button — edit only, focus-revealed)
    │   └── tr.ins-row       (trailing insert after last step — edit only)
    └── tr.bo-noterow        (gameplan / section note row — colspan all, always last)
        └── td.wys-wrap
            ├── [contenteditable] .wys  (gameplan)
            └── .wys-fab               (corner Insert-icon button — edit only)
```

## Acceptance Gates

- SC-002: row heights and column positions pixel-identical in view and edit (measure with browser devtools)
- SC-003/004: icon round-trip lossless; caret lands after insertion; 0 px height on focus
- FR-020: hover insert line reachable after the last step row
- FR-025: no new hex colors, no new dependencies
