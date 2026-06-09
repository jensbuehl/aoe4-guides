# Component Contract: BuildActionMenu.vue *(optional extraction)*

**Path**: `src/components/builds/BuildActionMenu.vue`
**Feature**: `010-build-editor-unification`
**Status**: **Optional** — implement only if the edit/view `v-list` boilerplate proves repetitive in practice (Constitution III: extract when duplicated ≥ twice and well understood). The view route alone has seven items; the editor has four. If you build it, both consumers collapse to `<BuildActionMenu :items="…">`.

A single `v-menu` + `v-list` driven by a declarative `items` array, so the overflow content is data, not three copies of `v-list-item` + `v-tooltip` markup.

---

## Props

| Prop | Type | Required | Default | Description |
|---|---|---|---|---|
| `items` | `Array<Item>` | yes | — | Ordered menu entries (see `Item` below). Falsy/`show:false` entries are skipped. |
| `icon` | `String` | no | `mdi-dots-vertical` | Activator icon. |
| `color` | `String` | no | `accent` | Activator + icon color. |

### `Item` shape

```ts
{
  title: string,          // list-item label
  icon: string,           // mdi-* leading icon
  onClick?: () => void,   // click handler (omit if `to` is used)
  to?: RouteLocation,     // router link (e.g. Edit → { name:'BuildEdit', params:{id} })
  show?: boolean,         // default true; false hides the item (owner/clipboard gates)
  danger?: boolean,       // render in error color (Delete)
  diviverBefore?: boolean // insert a v-divider above this item
}
```

## Emits

*None.* Each item owns its `onClick`/`to`.

## Structure

```
v-menu
├─ activator → v-btn icon variant="text" :color
└─ v-list
   └─ for each visible item:
      (v-divider if item.dividerBefore)
      v-list-item (:to or @click=item.onClick)
        ├─ v-icon (:color = danger ? 'error' : 'accent') {{ item.icon }}
        └─ {{ item.title }}
```

## Example — editor (edit mode)

```js
const editItems = computed(() => [
  { title: 'Duplicate build',      icon: 'mdi-content-duplicate', onClick: handleDuplicate },
  { title: 'Copy to overlay tool', icon: 'mdi-content-copy',      onClick: handleCopyOverlayFormat, show: clipboardIsSupported.value },
  { title: 'Download as file',     icon: 'mdi-download',          onClick: handleDownloadOverlayFormat },
  // No Delete in editor — view route only (spec clarification Q1)
]);
```

## Example — view route

```js
const viewItems = computed(() => [
  { title: 'Edit',              icon: 'mdi-pencil',            to: { name: 'BuildEdit', params: { id } }, show: isOwner.value },
  { title: 'Publish',           icon: 'mdi-publish',           onClick: handlePublish, show: !!user.value && build.value.isDraft },
  { title: 'Duplicate build',   icon: 'mdi-content-duplicate', onClick: handleDuplicate, show: !!user.value },
  { title: 'Copy to overlay tool', icon: 'mdi-content-copy',   onClick: handleCopyOverlayFormat, show: clipboardIsSupported.value },
  { title: 'Download',          icon: 'mdi-download',          onClick: handleDownloadOverlayFormat },
  { title: 'Open in RTS Overlay', icon: 'mdi-button-cursor',   onClick: handleOpenInOverlayTool },
  { title: 'Delete',            icon: 'mdi-delete',            onClick: () => (deleteDialog.value = true), show: isOwner.value, danger: true, dividerBefore: true },
])
```

> **Edit is the first item** on the view route — this is the consistency fix: the standalone `v-btn icon="mdi-pencil"` is deleted and folded into the single overflow.

## Rules

| Rule | Detail |
|---|---|
| Owner/clipboard gates | Preserved via `show` (mirrors today's `v-show` conditions exactly). |
| Single affordance | This menu is the **only** management control in any consumer (Vote/Favorite are separate engagement controls). |
| Theme tokens only | Activator `color="accent"`; danger items `error`; no hex. |
| Tooltips | The existing per-item `v-tooltip` hints may be reattached via a `hint` field if desired; not required for parity. |

## Out of scope

- The handlers themselves (owned by each consumer view).
- The confirmation dialogs (`showDeleteConfirm` in editor; `deleteDialog` in view) — triggered by an item, rendered by the consumer.
