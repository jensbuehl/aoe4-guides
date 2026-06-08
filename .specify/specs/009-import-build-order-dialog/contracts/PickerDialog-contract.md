# Component Contract: PickerDialog.vue (shared shell)

**Path**: `src/components/common/PickerDialog.vue`
**Feature**: `009-import-build-order-dialog`
**Extracted from**: `src/components/account/AvatarPicker.vue` (its `v-dialog`/`v-card`/title+close/`v-card-actions` chrome)

A reusable dialog **shell**. Owns the outer `v-dialog`, the `v-card`, the title row (title + close button), and the `v-card-actions` footer. It does **not** own the tab/body content — consumers fill the default slot. Both `AvatarPicker` and `BuildImportDialog` consume this so there is **one** dialog implementation, not two.

---

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `modelValue` | `boolean` | — | Dialog visibility (`v-model`) |
| `title` | `string` | `""` | Title text (overridable by `#title` slot) |
| `titleIcon` | `string` | `null` | Optional leading `mdi-*` icon |
| `maxWidth` | `number\|string` | `540` | `v-dialog` max-width (avatar uses `480`) |

## Emits

| Event | Payload | When |
|---|---|---|
| `update:modelValue` | `boolean` | Open/close (✕, Esc, scrim, programmatic) |

## Slots

| Slot | Purpose |
|---|---|
| `title` | Replace the default title row content (defaults to `titleIcon` + `title`) |
| default | Body — consumer's `v-tabs` + `v-window` (or any content) |
| `actions` | Footer buttons rendered inside `v-card-actions` (right-aligned) |

## Structure (Vuetify)

```html
<v-dialog :model-value="modelValue" :max-width="maxWidth"
          @update:model-value="$emit('update:modelValue', $event)">
  <v-card rounded="lg">
    <v-card-title class="d-flex align-center pt-5 px-6 pb-1">
      <slot name="title">
        <v-icon v-if="titleIcon" color="primary" class="me-3">{{ titleIcon }}</v-icon>
        <span>{{ title }}</span>
      </slot>
      <v-spacer />
      <v-btn icon="mdi-close" variant="text" size="small" @click="close" />
    </v-card-title>
    <v-card-text class="px-6 pt-4 pb-2"><slot /></v-card-text>
    <v-card-actions class="px-6 pb-5"><v-spacer /><slot name="actions" /></v-card-actions>
  </v-card>
</v-dialog>
```

## Behaviour

| Action | Result |
|---|---|
| ✕ / Esc / scrim click | Emits `update:modelValue=false` |
| Focus | Vuetify `v-dialog` traps focus and restores it to the activator on close |
| `titleIcon` | Rendered `color="primary"` to match the avatar/import headers |

> Keep the close button as the **only** absolute element; everything else flows. Matches `AvatarPicker`'s existing header rhythm (`pt-5 px-6`).
