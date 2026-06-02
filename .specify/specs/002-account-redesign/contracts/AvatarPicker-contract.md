# Component Contract: AvatarPicker.vue

**Path**: `src/components/account/AvatarPicker.vue`
**Feature**: `002-account-redesign`

A `v-dialog` triggered by clicking the current avatar in the profile hero. Self-contained:
reads and writes avatar state exclusively via the Vuex `updateAvatar` action.

---

## Props

| Prop | Type | Required | Description |
|---|---|---|---|
| `modelValue` | `boolean` | yes | Controls dialog visibility (`v-model`) |

## Emits

| Event | Payload | When |
|---|---|---|
| `update:modelValue` | `boolean` | Dialog requests open/close |

## Vuex Interface

| Direction | Path | Description |
|---|---|---|
| Reads | `store.state.userAvatar` | Current avatar `{ type, ref }` — pre-selects active tab and item |
| Reads | `store.state.user.displayName` | Drives the initials preview |
| Dispatches | `updateAvatar({ type, ref })` | On Save button click |
| Dispatches | `showSnackbar({ text, type })` | On save success / upload error |

## Internal Tabs

| Tab | Key | Behaviour |
|---|---|---|
| Initials | `initials` | Shows preview of initials avatar; one-click saves `{ type:'initials', ref:null }` |
| Civilizations | `civ` | Grid of `flagSmall` images from `civDefaultProvider.js`; click to select, Save to persist |
| Upload | `upload` | File picker (image/*); client-side canvas resize to 256×256 WebP; shows preview; Save uploads to Storage then saves URL |

## Upload flow

```text
1. User picks file → FileReader loads it into <img>
2. Canvas draws 256×256 crop-center
3. canvas.toBlob(blob, 'image/webp', 0.82) → ~10–30 KB
4. Upload to Firebase Storage avatars/{uid}.webp (progress shown on button)
5. getDownloadURL → store.dispatch('updateAvatar', { type:'upload', ref: url })
6. Emit close
```

## Save / Cancel behaviour

| Action | Result |
|---|---|
| Save | Dispatches `updateAvatar`, closes dialog |
| Cancel / Esc / scrim click | Closes without saving; selected-but-unsaved state is discarded |
| Upload in-flight | Save button shows loading, is disabled |
| Upload > 200 KB after resize (edge case) | Snackbar error, dialog stays open |

## Usage (Account.vue)

```html
<AvatarPicker v-model="avatarPickerOpen" />
```

Trigger by setting `avatarPickerOpen = true` from the avatar click handler.
