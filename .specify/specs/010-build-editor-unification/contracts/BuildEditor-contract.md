# Component Contract: BuildEditor.vue

**Path**: `src/views/builds/BuildEditor.vue`
**Feature**: `010-build-editor-unification`
**Replaces**: `src/views/builds/BuildNew.vue` + `src/views/builds/BuildEdit.vue` (both retire to redirect shims)

The merged create/edit view. Driven by a `mode` prop. Uses `BuildHeader` for the hero, two metadata cards, a sticky footer, live YouTube validation, and `BuildOrderEditor` for steps. Reuses every existing composable and the existing save pipeline unchanged.

---

## Props

| Prop | Type | Required | Description |
|---|---|---|---|
| `mode` | `String` (`'new'` \| `'edit'`) | yes | Set by the route. Selects empty/template init vs. load-existing, and `addBuild` vs `updateBuild`. |
| `id` | `String` | edit only | Build id (edit mode). |

## Router

| Route name | Path | Props | Meta |
|---|---|---|---|
| `BuildNew` | `/builds/new` (existing) | `mode: 'new'` | `requiresAuth` (unchanged) |
| `BuildEdit` | `/builds/:id/edit` (existing) | `mode: 'edit'`, `id` | `requiresAuth` + ownership (unchanged) |

> Route **names** stay `BuildNew` / `BuildEdit` so existing `:to`/`router.push({ name })` calls (e.g. from `BuildDetails`, duplicate flow) keep working. Only the `component` they resolve to changes.

## Vuex interface

| Direction | Path | Description |
|---|---|---|
| Reads | `store.state.user` | Author identity for save |
| Reads | `store.state.template` | Duplicate → create pre-fill (consumed + cleared on mount) |
| Reads | `store.state.cache.builds[id]` | Edit-mode load shortcut before Firestore |
| Commits | `setTemplate(null)` | Clear the consumed template |
| Commits | `setBuild`, `setAllBuildsList(null)`, `setMyBuildsList(null)`, `setMyFavoritesList(null)` | Cache updates/resets (parity with current views) |
| Dispatches | `showSnackbar({ text, type })` | Success / error feedback |

## Composables reused (unchanged)

`buildService` (`addBuild`, `updateBuild`, `getBuild`, `getUserDraftsCount`), `creatorService` (`getCreator`, `addCreator`), `contributorService` (`getContributor`, `addContributor`, `incrementBuilds`), `youtubeService` (`extractVideoId`, `buildEmbedUrl`, `getVideoCreatorId`, `getVideoMetaData`, `getChannelIcon`), `buildOrderValidator` (`validateBuild`, `validateVideo`), `useExportOverlayFormat`, `useCopyToClipboard`, `useDownload`, `useTimeSince`, `civDefaultProvider`, `seasonDefaultProvider`, `mapDefaultProvider`, `strategyDefaultProvider`, `sanitize-html`.

## State

| Ref | Type | Purpose |
|---|---|---|
| `build` | Object | The working build |
| `originalBuild` | Object | Snapshot for Discard |
| `isLoaded` | Boolean | Gate the dirty watcher past initial hydrate |
| `isDirty` | Boolean | Footer "Unsaved changes" + Discard enablement |
| `error` | String\|null | Validation/service error |
| `ytState` | `'empty'\|'valid'\|'invalid'` | Video field feedback |
| `ytVideoId` | String\|null | Parsed id for the thumbnail |
| `clipboardIsSupported` | Boolean | Gates the overflow "Copy to overlay tool" |

## Handlers (ported)

| Handler | Mode | Source | Notes |
|---|---|---|---|
| `handleSave` | both | merge of `BuildNew`+`BuildEdit` | create → `addBuild` (+contributor); edit → `updateBuild`. Shared validate/sanitize/creator/snackbar/nav. Resets `isDirty`. |
| `handleDraft` | both | `BuildNew` | create: max-10 `getUserDraftsCount` guard; edit: set `isDraft` + save |
| `handleDiscard` | both | new | restore `originalBuild` snapshot; `isDirty=false` |
| `handleVideoInput` | both | `BuildEdit` | + 400 ms debounce driving `ytState`/`ytVideoId` |
| `handleStepsChanged` | both | `BuildEdit` | unchanged |
| `sanitizeSteps` | both | `BuildEdit` | unchanged |
| `handleDuplicate` | edit | `BuildEdit` | overflow |
| `handleCopyOverlayFormat` | edit | `BuildEdit` | overflow, clipboard-gated |
| `handleDownloadOverlayFormat` | edit | `BuildEdit` | overflow |

## Template structure

```
v-container (padding-bottom for footer clearance)
├─ BuildHeader :build="build"
│   └─ #actions: v-menu (v-if mode==='edit') — Duplicate/Copy/Download
├─ v-card "Build details"  → Title / Description / Video (+ YouTube preview/error)
├─ v-card "Classification" → v-row: Civilization | Season | Map | Strategy (cols=12 sm=6 md=3)
└─ BuildOrderEditor :steps :civ @stepsChanged
+ fixed .build-editor-footer → [Unsaved changes] Discard | Save as draft | Publish build
```

## YouTube validation

```text
handleVideoInput(value):
  isDirty = true
  clearTimeout(timer)
  if !value.trim(): ytState='empty'; return
  timer = setTimeout(400ms):
    id = extractVideoId(value)
    if id: ytVideoId=id; ytState='valid'; <run existing embed rewrite + creatorId/creatorName lookup>
    else:  ytState='invalid'
```

## States & rules

| State | Rule |
|---|---|
| Create, no template | Empty default build; hero badge "New"; no overflow |
| Create, template staged | Pre-filled from `store.state.template`; template cleared |
| Edit | Loaded build; hero badge reflects `isDraft`; overflow present |
| Clean | "Unsaved changes" hidden |
| Dirty | indicator shown; Discard reverts |
| Save success | `isDirty=false`; cache reset; navigate to `/builds/:id` |
| Save invalid | snackbar error (existing `validateBuild` message); stay on page |
| Delete | not in editor overflow — available on view route only |

## Out of scope

- `BuildOrderEditor` internals (reused as-is).
- `useImportOverlayFormat` / import flow (feature 009).
- The authoritative cascade delete (lives in `BuildDetails.handleDelete`).
