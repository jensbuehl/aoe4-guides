# Research: Desktop Build View & Editor Layout (`014-desktop-build-layout`)

> **Purpose**: Documents all resolved unknowns and the content-editable preservation contract. Read this before touching `BuildOrderSectionEditor.vue`.

---

## 1. Content-Editable State Management — Preservation Contract

> The user's explicit priority: "keep an eye on the complex content-editable state management that is in place. It shall work just like before."

### 1.1 The existing chain (do not break any link)

```
keyup event on description cell
  → handleContentEditableKeyUp(event, stepIndex)
    → contentEditableHelper.updateSearchText(contentEditable, searchText, keyCode, allIcons)
      → updates searchText ref → IconAutoCompleteMenu shows/hides

input event on description cell ("::") 
  → showAutoCompleteMenu(event, stepIndex)
    → sets autocompletePos → IconAutoCompleteMenu shows at cursor

IconAutoCompleteMenu emits @iconSelected
  → handleAutoCompleteMenuIconSelected(iconPath, tooltip, iconClass)
    → contentEditableHelper.addAutocompleteIcon(contentEditable, ...)
      → replaces "::..." text with <img> in innerHTML
      → restores cursor via getCursorPositionAfterIcon

click on IconSelector (from corner button / icon picker)
  → @mousedown.prevent="saveSelection($event)"    ← caret saved HERE
  → IconSelector emits @iconSelected
  → handleIconSelectorIconSelected(iconPath, tooltip, iconClass)
    → restoreSelection()                           ← caret restored HERE
    → document.execCommand("insertHTML", false, img)   ← icon inserted at caret
    → saveSelection()                              ← caret saved again

focusout on description cell
  → updateStepDescription(event, stepIndex)
    → stepsCopy[index].description = event.target.innerHTML
    → emit stepsChanged(stepsCopy)

addStep(index) / removeStep(index)
  → reads innerHTML from every description cell → syncs into steps[]
  → splices steps + stepsCopy
  → re-sets innerHTML from steps[] back into DOM cells (desktop only)
```

### 1.2 DOM access touch-points in `BuildOrderSectionEditor.vue`

These are the exact locations that read the contenteditable element. `stepsTable` and `descriptionColumnIndex` stay. The only change is `rows[index]` → `querySelectorAll('tr.step-row')[index]` because insert `<tr class="ins-row">` rows in `<tbody>` would corrupt the simple rows[] index:

| Location | Current expression | Updated expression |
|----------|--------------------|----------------|
| `showAutoCompleteMenu` — description | `stepsTable.value.rows[index].cells[descriptionColumnIndex]` | `stepsTable.value.querySelectorAll('tr.step-row')[index].cells[descriptionColumnIndex]` |
| `showAutoCompleteMenu` — gameplan | `gameplanContentEditable.value` | unchanged |
| `handleContentEditableKeyUp` — description | `stepsTable.value.rows[index].cells[descriptionColumnIndex]` | `stepsTable.value.querySelectorAll('tr.step-row')[index].cells[descriptionColumnIndex]` |
| `handleContentEditableKeyUp` — gameplan | `gameplanContentEditable.value` | unchanged |
| `handleAutoCompleteMenuIconSelected` — description | `stepsTable.value.rows[activeStepIndex.value].cells[descriptionColumnIndex]` | `stepsTable.value.querySelectorAll('tr.step-row')[activeStepIndex.value].cells[descriptionColumnIndex]` |
| `handleAutoCompleteMenuIconSelected` — gameplan | `gameplanContentEditable.value` | unchanged |
| `addStep` — pull display text | `stepsTable.value.rows[i].cells[descriptionColumnIndex].innerHTML` | `stepsTable.value.querySelectorAll('tr.step-row')[i].cells[descriptionColumnIndex].innerHTML` |
| `addStep` — restore display text | `row.cells[descriptionColumnIndex].innerHTML = steps[i].description` | same pattern; row is the querySelectorAll result |
| `removeStep` — pull display text | `stepsTable.value.rows[i].cells[descriptionColumnIndex].innerHTML` | `stepsTable.value.querySelectorAll('tr.step-row')[i].cells[descriptionColumnIndex].innerHTML` |
| `removeStep` — restore display text | (no restore needed after remove) | unchanged |

### 1.3 Refs — what stays, what changes, what is added

**Keep unchanged**:
```js
const stepsTable = ref(null);            // still bound to <tbody>
const descriptionColumnIndex = 7;        // still column 7 of each step row
```

**Add** (for FR-021 focus after ageUp only):
```js
const timestampRefs = ref([]);

function registerTimestampRef(el, index) {
  timestampRefs.value[index] = el;
}
```
Bound in template on each step row's timestamp `<input>`: `:ref="el => registerTimestampRef(el, index)"`.

**Do NOT add**: `noteRefs` / `registerNoteRef` — not needed; `stepsTable + descriptionColumnIndex` serves the same purpose.

**Keep unchanged**: `gameplanContentEditable`, `selection`, `saveSelection`, `restoreSelection`, all `contentEditableHelper` imports.

### 1.4 The "two copies" pattern — must be preserved

`steps` and `stepsCopy` are maintained as two separate reactive arrays. `steps` drives the DOM (initial `v-html`). `stepsCopy` holds the canonical description values (synced on `focusout`). Before structural mutations (addStep/removeStep), the display text is *read from the DOM* into `steps` so that any in-flight edit not yet confirmed by `focusout` is captured.

**Rule**: In `addStep` and `removeStep`, the loop that reads description content uses `stepsTable.value.querySelectorAll('tr.step-row')[i].cells[descriptionColumnIndex].innerHTML` — the only change from the original `rows[i].cells[7].innerHTML` is the selector. The logic is identical.

### 1.5 `document.execCommand("insertHTML")` — keep as-is

`handleIconSelectorIconSelected` uses:
```js
document.execCommand("insertHTML", false, img);
```
This is deprecated but universally supported in all major browsers and is the approach used in `011`. Do NOT replace it with `Range.insertNode()` or any other method — the `011` WYSIWYG contract specifically validated this approach. Replacing it could break caret restoration (SC-003/004).

### 1.6 Corner Insert-icon button — no-CLS contract

Per `design-input.md §3.7`, the corner button must cause **0 px** card-height change:
```css
.wys-wrap { position: relative; }
.wys      { padding-right: 40px; }         /* space reserved permanently — no reflow */
.wys-fab  { position: absolute; right: 5px; bottom: 5px; opacity: 0; pointer-events: none; }
.wys-wrap:focus-within .wys-fab { opacity: 1; pointer-events: auto; }
```
The button `@mousedown.prevent` saves the selection before the click blurs the contenteditable:
```html
<v-btn @mousedown.prevent="saveSelection($event)" ...>
```
This is identical to the mobile `011` pattern — reuse it exactly.

---

## 2. `v-table` Layout — Decisions (Constitution III)

The desktop table stays as a Vuetify `v-table` (an HTML `<table>`). Fixed column widths are set via `<colgroup>` so sections align without a JS pass.

### 2.1 Column widths via `<colgroup>` (use inside `v-table`)

```html
<colgroup>
  <col style="width:64px">   <!-- time -->
  <col style="width:44px">   <!-- villagers (read-only) -->
  <col style="width:52px">   <!-- builder -->
  <col style="width:52px">   <!-- food -->
  <col style="width:52px">   <!-- wood -->
  <col style="width:52px">   <!-- gold -->
  <col style="width:52px">   <!-- stone -->
  <col>                      <!-- description — fills remaining width (min-width: 0) -->
  <!-- edit mode only: -->
  <col v-if="!readonly" style="width:30px">   <!-- ✕ -->
</colgroup>
```

Column order: time · villagers · Builder · Food · Wood · Gold · Stone · description (+ ✕ in edit).

Because every `v-table` in every section uses the same `<colgroup>` widths, columns stay pixel-aligned across sections automatically — identical to the CSS grid approach but using the Vuetify-native component.

### 2.2 `alignTableColumnWidthsAcrossSections` — safe to delete

This function exists because HTML `<table>` auto-sizes columns differently per section when content widths vary. With fixed `<colgroup>` widths applied identically in every section, the columns can no longer drift — the function is redundant.

**Touch-points to remove from `BuildOrderEditor.vue`**:
- `alignTableColumnWidthsAcrossSections()` definition (currently inline, not imported)
- `alignTableColumnWidthsAcrossSections()` call in `onMounted`
- `@textChanged="() => alignTableColumnWidthsAcrossSections()"` on `<BuildOrderSectionEditor>`
- The `textChanged` emit in `BuildOrderSectionEditor.vue` (only used for column alignment)

### 2.3 Insert line — `<tr class="ins-row">` in `<tbody>`

Template pattern inside `<tbody ref="stepsTable">`:
```html
<tbody ref="stepsTable">
  <!-- empty-build insert (edit mode, 0 steps) -->
  <tr v-if="!readonly && !steps.length" class="ins-row">
    <td :colspan="readonly ? 8 : 9" @click="addStep(-1)"><!-- insert affordance --></td>
  </tr>

  <template v-for="(item, index) in steps" :key="item._id ?? ('md-' + index)">
    <!-- insert before this step -->
    <tr v-if="!readonly" class="ins-row">
      <td :colspan="readonly ? 8 : 9" @click="addStep(index - 1)"><!-- insert affordance --></td>
    </tr>

    <!-- data row -->
    <tr class="step-row">
      <td><!-- timestamp --></td>
      <!-- … resource cells … -->
      <td :contenteditable="!readonly" …><!-- description --></td>
      <td v-if="!readonly"><!-- ✕ --></td>
    </tr>
  </template>

  <!-- trailing insert after last step -->
  <tr v-if="!readonly && steps.length" class="ins-row">
    <td :colspan="readonly ? 8 : 9" @click="addStep(steps.length - 1)"><!-- insert affordance --></td>
  </tr>
</tbody>
```

`querySelectorAll('tr.step-row')[index]` maps 1:1 to `steps[index]` because insert rows carry class `ins-row`, not `step-row`. The `descriptionColumnIndex = 7` of the step row is unaffected.

---

## 3. Delta Accent — Render-only, Not Persisted

The delta accent (FR-014) compares each step's resource value to the previous step's value. It is pure render-time — no model change:

```js
function hasDeltaUp(field, index) {
  if (index === 0) return false;
  const curr = parseInt(steps[index][field]) || 0;
  const prev = parseInt(steps[index - 1][field]) || 0;
  return curr > prev;
}
```

Applied as a class on each resource cell:
```html
<div :class="['rc', hasDeltaUp('builders', index) && 'd-up']">...</div>
```

Fields to compare: `builders`, `food`, `wood`, `gold`, `stone`.

**Decision rationale**: Increase-only (not decrease) — keeps the accent meaningful as "attention here" rather than a noisy diff view. First step has no predecessor → no accent.

---

## 4. Age-Transition Lane — CSS Box-Shadow, Not Border

Per `design-input.md §3.5` and FR-013, the lane left-edge MUST be:
```css
.lane { box-shadow: inset 3px 0 0 var(--aug); }
```
**Not** `border-left` or `padding-left`. A `border-left` or padding would indent the row content, breaking column alignment with adjacent step rows. The inset box-shadow draws *inside* the element bounds — no layout shift.

Token `--aug` is the gold brand constant (not the theme accent), consistent across dark and light themes.

---

## 5. Section Note Rows (Gameplan) — NC-3 Implementation

The gameplan field already uses the WYSIWYG chain (`gameplanContentEditable` ref, `handleContentEditableKeyUp`, `showAutoCompleteMenu`, `updateSectionGameplan`). What changes for the desktop:

1. **View mode**: `v-html="gameplan"` already renders icons inline — no change needed.
2. **Corner button**: Replace the existing "add icon" menu (currently hidden behind `selection && gameplanSelected` condition in the `v-table` actions column) with the same `.wys-wrap` / `.wys-fab` pattern used for step notes.
3. **Full-width span** (FR-028): The gameplan `.bo-noterow` spans all columns (`grid-column: 1 / -1`).
4. **WYSIWYG host**: The gameplan `contenteditable` div uses the same event handlers, same `contentEditableHelper.js` chain, same `saveSelection` / `restoreSelection`. No change to the logic.

---

## 6. Tab Order (FR-029)

The Tab order contract: Timestamp → Builder → Food → Wood → Gold → Stone → Note → next row's Timestamp.

**Implementation**: Use `tabindex` on each table cell in the correct order. In the `v-table`, DOM column order already matches visual order (time, villagers, builder, food, wood, gold, stone, note). The villager cell is `tabindex="-1"` (read-only). Each row's Note cell gets a `@keydown.tab.prevent` handler to manually focus the next row's timestamp:

```js
function handleNoteTabKeydown(event, index) {
  if (!event.shiftKey) {
    event.preventDefault();
    timestampRefs.value[index + 1]?.focus();
  }
}
```

Shift-Tab from the first cell (Timestamp) to the previous row's Note is handled by natural browser Shift-Tab since the DOM order is timestamp → ... → note → (next row) timestamp.

---

## 7. Key Files — Quick Reference

| File | What to change |
|------|---------------|
| `src/components/builds/BuildOrderSectionEditor.vue` | Add `<colgroup>` fixed widths; change `rows[index]` → `querySelectorAll('tr.step-row')[index]`; add `timestampRefs`; add `<tr class="ins-row">` insert rows; corner button; delta accent; empty state; gameplan WYSIWYG corner button |
| `src/components/builds/BuildOrderEditor.vue` | Remove `alignTableColumnWidthsAcrossSections` + all call-sites; remove `@textChanged` on section editor; update `ageUp()` to focus new timestamp after nextTick |
| `src/components/builds/BuildHeader.vue` | Desktop section only: add civ lockup (flag img + name text) before chips; remove civ chip from chip group |
| `src/views/builds/BuildDetails.vue` | **No changes** — layout already correct |
| `src/views/builds/BuildEditor.vue` | **No changes** — header actions already correct |
| `src/composables/builds/contentEditableHelper.js` | **No changes** — preserved exactly as-is |
