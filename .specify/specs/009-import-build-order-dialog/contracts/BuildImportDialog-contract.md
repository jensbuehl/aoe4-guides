# Component Contract: BuildImportDialog.vue

**Path**: `src/components/builds/BuildImportDialog.vue`
**Feature**: `009-import-build-order-dialog`
**Replaces**: `src/views/builds/BuildImport.vue` (route `/import/:paste?`)

The merged import dialog. Built on `PickerDialog` (chrome) + `FileDropZone` (Upload tab). Reads/writes via Vuex; reuses the existing import pipeline. Triggered from the Add Build menu via `openImportDialog`, mounted once in `App.vue` (mirrors `AuthDialog`).

---

## Props / v-model

| Prop | Type | Required | Description |
|---|---|---|---|
| `modelValue` | `boolean` | yes | Dialog visibility (`v-model`), bound to `store.state.importDialog.open` in `App.vue` |

## Emits

| Event | Payload | When |
|---|---|---|
| `update:modelValue` | `boolean` | Open/close (forwarded from `PickerDialog`) |

## Vuex Interface

| Direction | Path | Description |
|---|---|---|
| Reads | `store.state.user`, `user.emailVerified` | Auth/verification gate (parity with the old route meta) |
| Commits | `setTemplate(template)` | The converted build → consumed by `BuildNew` |
| Dispatches | `showSnackbar({ text, type })` | Success / (rare) hard-error feedback |
| Dispatches | `closeImportDialog` *(or* `update:modelValue=false`*)* | On success / cancel |

## Composables reused (unchanged)

| Composable | Use |
|---|---|
| `useImportOverlayFormat()` | `convert(overlayObj)` → template (note-token conversion included) |

## Internal tabs

| Tab | Key | Behaviour |
|---|---|---|
| Upload file | `file` | `FileDropZone accept=".json,.bo"` → `file.text()` → `parseBuild` → chip + preview |
| From clipboard | `clipboard` | "Paste from clipboard" (`navigator.clipboard.readText`) **and** a manual `v-textarea`; live `parseBuild` |

## Validation: `parseBuild(text)`

```text
JSON.parse(text)                    → fail: { ok:false, reason:"That isn't valid JSON…" }
require object (not array)          → fail: "Expected a build-order object…"
require name && Array.isArray(build_order)
                                    → fail: "Missing a build name or step list…"
ok → { ok:true, build: {
        title, author, civCode, civFlag, civName,
        steps: build_order.length, strategy, season, hasVideo } }
```
(civ name → code/flag via the existing `mapCivilizations` / civ provider.)

## Import flow (on "Import build")

```text
1. obj = JSON.parse(activeText)
2. template = useImportOverlayFormat().convert(obj)   // existing
3. store.commit("setTemplate", template)              // existing newFromTemplate logic
4. store.dispatch("showSnackbar", { text:"Build order imported successfully", type:"success" })
5. router.push({ name: "BuildNew" })
6. close dialog
```

## States & rules

| State | Rule |
|---|---|
| Idle | Tabs shown; Import **disabled** |
| Valid input | "Build detected" preview; Import **enabled** |
| Invalid input | Inline error banner (`role="alert"`); Import **disabled**; dialog stays open |
| Tab switch | Staged file/text preserved |
| Clipboard blocked | Manual textarea still works; non-blocking hint; no dead-end |
| Cancel / Esc / scrim / ✕ | Close, discard staged input |
| Unverified user | Same guard as today — gate the action; reuse "Please verify your email…" snackbar |

## Usage (App.vue)

```html
<!-- next to <AuthDialog /> -->
<BuildImportDialog v-model="importOpen" />
```
```js
const importOpen = computed({
  get: () => store.state.importDialog.open,
  set: (v) => store.commit("SET_IMPORT_DIALOG", v),
});
```
Trigger from `Header.vue`: `@click="$store.dispatch('openImportDialog')"`.

## Out of scope
- `useImportOverlayFormat` conversion internals (reused as-is).
- The `BuildNew` editor and `setTemplate` shape (unchanged).
- Export/clipboard-copy (`useExportOverlayFormat`, `useCopyToClipboard`) — not touched.
