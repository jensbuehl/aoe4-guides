# CSS & Vuetify Reference — Import Build Order dialog

Exact values for `BuildImportDialog.vue` + the shared `PickerDialog.vue` / `FileDropZone.vue`. Everything is grounded in the app's real theme tokens (`reference/design-tokens.md`). **Chrome is Vuetify** — the table in §6 maps each mock element to its Vuetify component. Only §3–§5 (drop zone, preview card, error banner) are genuinely custom CSS.

The prototype (`Import UX.html`) hand-rolls a dialog/segmented control/drop zone **only because it's a framework-free HTML mock**. Do **not** reproduce those hand-rolled widgets — use Vuetify per §6.

---

## 1. Resolved theme tokens

Use Vuetify theme colors (`rgb(var(--v-theme-*))`), never hard-coded hex. For reference the resolved values are:

| Role | Dark (`customDarkTheme`) | Light (`customLightTheme`) |
|---|---|---|
| `background` | `#1D2432` | `#D8DCE0` |
| `surface` (dialog card) | `#324156` | `#FAFAFA` |
| `primary` (CTA / accents) | `#e7c05e` gold | `#294790` navy |
| `on-primary` (CTA text) | `#1D2432` | `#FFFFFF` |
| `secondary` | `#294790` | `#CCAA55` |
| field/sunken (textarea, seg track) | `#2c3a4e`–`#3a4a61` | `#ECEEF1`–`#F2F3F5` |
| divider | `rgba(255,255,255,.12)` | `rgba(0,0,0,.10)` |
| success (preview tint) | `#6fce9f` | `#2e7d52` |
| error (error tint) | `#ff8a8a` | `#c62828` |
| text-muted | `rgba(233,235,238,.58)` | `#5b6573` |

Body font **Inter**; icons **MDI** (`mdi-*`). Dialog card `border-radius: lg` (Vuetify `rounded="lg"` ≈ 8–12px).

## 2. Dialog metrics (PickerDialog)

- `v-dialog max-width="540"` (import) / `480` (avatar).
- `v-card` padding rhythm: title `pt-5 px-6 pb-1`; body `px-6 pt-4 pb-2`; actions `px-6 pb-5`.
- Title: `mdi-tray-arrow-down` `color="primary"` + 21px/700 text; close `v-btn icon="mdi-close" variant="text" size="small"` top-right.
- Tabs: `v-tabs color="primary"` directly under the title; `v-window` for panes. Min body height ≈ 200px so the dialog doesn't jump between empty/preview states.

## 3. Drop zone (FileDropZone) — CUSTOM

```css
.drop-zone {
  border: 2px dashed rgba(var(--v-border-color), var(--v-border-opacity));
  min-height: 178px; border-radius: 12px; cursor: pointer;
  transition: border-color .15s, background-color .15s;
}
.drop-zone:hover,
.drop-zone--active {
  border-color: rgb(var(--v-theme-primary));
  background-color: rgba(var(--v-theme-primary), .06);   /* .11 while actively dragging */
}
```
- Idle icon `mdi-cloud-upload-outline` (size 40, `medium-emphasis`); dragging swaps to `mdi-tray-arrow-down` (`primary`).
- Copy: **"Drop your build order here or <u>click to browse</u>"** + caption **"Accepts `.json` and `.bo` exports from the overlay tool"**.

## 4. Preview card ("Build detected") — CUSTOM

```css
.import-preview {
  border-radius: 13px; padding: 15px 16px;
  background: rgba(var(--v-theme-success), .09);
  border: 1px solid rgba(var(--v-theme-success), .34);
}
```
- Eyebrow: `mdi-check-circle` + "BUILD DETECTED" (11.5px/700, `success`, letter-spacing .4px, uppercase).
- Body: civ flag `52×52 rounded-lg` (`v-img` of `civ.flagSmall`) + title (15.5px/700) + "by {author} · {civ}" (12.5px muted).
- Metas: `v-chip size="small" variant="tonal"` row — **"{N} steps"** (`mdi-format-list-numbered`), strategy (`mdi-sword-cross`), season (`mdi-calendar`), "Video" (`mdi-youtube`) — render only the ones present.

## 5. Error banner — CUSTOM

```css
.import-error {
  display: flex; gap: 11px; align-items: flex-start;
  border-radius: 11px; padding: 12px 15px;
  background: rgba(var(--v-theme-error), .13);
  border: 1px solid rgba(var(--v-theme-error), .38);
}
```
- `role="alert"`. Icon `mdi-alert-circle-outline` (`error`). Bold **"Couldn't read that as a build order"** + muted `{reason}` + " Export again from the AoE4 Overlay tool or age4builder, then retry."
- Reasons from `parseBuild`: *"That isn't valid JSON…"*, *"Expected a build-order object…"*, *"Missing a build name or step list…"*.
- `v-alert type="error" variant="tonal"` is an acceptable Vuetify substitute for the hand-styled banner.

## 6. Mock → Vuetify component mapping

| Mock element (Import UX.html) | Vuetify implementation |
|---|---|
| Scrim + centered card | `v-dialog` + `v-card rounded="lg"` (**PickerDialog**) |
| Title + ✕ | `v-card-title` row + `v-btn icon="mdi-close" variant="text"` |
| Segmented "Upload file / From clipboard" | **`v-tabs color="primary"`** + `v-window`/`v-window-item` (NOT a custom segmented control) |
| Dashed drop zone | **FileDropZone** (`.drop-zone`, §3) |
| Selected-file chip | `v-list-item`/`v-card` row: `mdi-file-document-outline` + name + size + `v-btn icon="mdi-close"` |
| "Paste from clipboard" button | `v-btn color="primary" variant="tonal" prepend-icon="mdi-content-paste"` block |
| Manual paste box | `v-textarea variant="outlined"` monospace, `:error="…"` |
| "Build detected" preview | custom card §4 (flag = `v-img`; metas = `v-chip variant="tonal"`) |
| Error banner | custom §5 or `v-alert type="error" variant="tonal"` |
| Footer Cancel / Import | `v-card-actions` → `v-btn variant="text"` + `v-btn color="primary" :disabled="!valid"` |
| Civ flag image | existing civ provider `flagSmall` (`src/composables/filter/civDefaultProvider.js`) — already used by `AvatarPicker` |
| Add Build menu icon | `mdi-tray-arrow-down` |

## 7. The only custom CSS (everything else is Vuetify)
1. `.drop-zone` (§3) — shared via `FileDropZone` (lifted from `AvatarPicker`).
2. `.import-preview` (§4) — the detected-build confirmation card.
3. `.import-error` (§5) — or use `v-alert`.

All three use theme CSS vars (`--v-theme-*`) so light/dark are automatic. No hard-coded hex in components.

## 8. Light/dark checklist
- Drop-zone dashed border + hover tint legible on `surface` in both themes.
- Preview success tint readable on `surface` (dark gold-navy / light grey).
- Error tint + text contrast AA in both.
- Textarea sunken fill distinct from the card surface.
- CTA: gold-on-navy (dark) / navy-on-white (light) — both ≥ AA.
