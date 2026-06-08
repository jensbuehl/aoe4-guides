# Component Contract: FileDropZone.vue (shared)

**Path**: `src/components/common/FileDropZone.vue`
**Feature**: `009-import-build-order-dialog`
**Extracted from**: `src/components/account/AvatarPicker.vue` (its `.drop-zone` markup + drag handlers + `resizeImage` trigger)

A reusable drag-and-drop + click-to-browse zone. Emits the chosen `FileList`; it does **not** know about images vs. build files — the consumer decides via `accept` and handles the files. Used by the avatar **Upload** tab (`accept="image/*"`) and the import **Upload file** tab (`accept=".json,.bo"`).

---

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `accept` | `string` | `"*"` | Passed to the hidden `<input type="file">` |
| `label` | `string` | `"Drop a file here or click to browse"` | Primary line |
| `hint` | `string` | `""` | Secondary line (e.g. "Accepts .json and .bo") |
| `icon` | `string` | `"mdi-cloud-upload-outline"` | Idle icon |
| `multiple` | `boolean` | `false` | Allow multiple files |

## Emits

| Event | Payload | When |
|---|---|---|
| `files` | `FileList` | File(s) dropped or chosen via browse |

## Internal state

| State | Notes |
|---|---|
| `isDragging` | `@dragover.prevent` → true; `@dragleave.prevent` / `@drop` → false. Drives the active style. |

## Structure (Vuetify + scoped CSS)

```html
<div class="drop-zone rounded-lg d-flex flex-column align-center justify-center ga-3 pa-6"
     :class="{ 'drop-zone--active': isDragging }"
     role="button" tabindex="0"
     @click="input.click()" @keydown.enter="input.click()"
     @dragover.prevent="isDragging = true"
     @dragleave.prevent="isDragging = false"
     @drop.prevent="onDrop">
  <v-icon size="40" :color="isDragging ? 'primary' : 'medium-emphasis'">{{ icon }}</v-icon>
  <p class="text-body-2 text-medium-emphasis text-center">{{ label }}</p>
  <p v-if="hint" class="text-caption text-medium-emphasis text-center">{{ hint }}</p>
  <input ref="input" type="file" :accept="accept" :multiple="multiple" class="d-none" @change="onChange" />
</div>
```

```css
/* lifted verbatim from AvatarPicker */
.drop-zone { border: 2px dashed rgba(var(--v-border-color), var(--v-border-opacity)); min-height: 160px; cursor: pointer; transition: border-color .15s, background-color .15s; }
.drop-zone:hover, .drop-zone--active { border-color: rgb(var(--v-theme-primary)); background-color: rgba(var(--v-theme-primary), .06); }
```

## Behaviour

| Action | Result |
|---|---|
| Drop / browse | Emits `files`; parent reads them (`file.text()` for builds, `FileReader`/canvas for avatar) |
| Keyboard | `Enter` on the focused zone opens the file picker (a11y) |
| Empty drop | No emit |

> The avatar Upload tab keeps its own **preview avatar** + resize logic in the consumer; `FileDropZone` only surfaces the files. This keeps the shared component generic (Principle III) without leaking image-specific concerns.
