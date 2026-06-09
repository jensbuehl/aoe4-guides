# Data Model: Build Editor Unification & Shared Build Header

**Feature**: `010-build-editor-unification` | **Date**: 2026-06-08

## Summary

**No new data entities.** The Firestore document schema is unchanged. No new collections, fields, indexes, or security rules are introduced by this feature.

---

## Existing Build Document (unchanged)

The `builds` collection document shape consumed by `BuildHeader`, `BuildEditor`, and `BuildDetails` — documented here as a reading reference for implementers, not a change.

| Field | Type | Notes |
|---|---|---|
| `id` | String | Document ID |
| `title` | String | |
| `description` | String | Sanitised via `sanitize-html` on save |
| `civ` | String | Civilisation key (used for flag lookup via `civDefaultProvider`) |
| `season` | String | |
| `map` | String | |
| `strategy` | String | |
| `video` | String | YouTube embed URL (rewritten from raw URL on save) |
| `creatorId` | String | YouTube channel ID (from `youtubeService`) |
| `creatorName` | String | |
| `isDraft` | Boolean | |
| `author` | String | Display name |
| `authorUid` | String | Firebase Auth UID (ownership gate) |
| `views` | Number | |
| `upvotes` | Number | |
| `comments` | Number | |
| `timeCreated` | Timestamp | |
| `timeUpdated` | Timestamp | |
| `steps` | Array | Build order steps (`BuildOrderEditor` schema — unchanged) |

## Component → Field Mapping

| Component | Fields read |
|---|---|
| `BuildHeader` (hero) | `title`, `civ`, `season`, `strategy`, `map`, `isDraft`, `author`, `views`, `upvotes`, `comments`, `timeCreated`, `timeUpdated` |
| `BuildEditor` (form) | all fields (read + write) |
| `BuildDetails` (view) | all fields (read only) |

## Vuex State (unchanged)

| Path | Purpose | Notes |
|---|---|---|
| `store.state.user` | Author identity | Read by editor for save |
| `store.state.template` | Duplicate → create pre-fill | Consumed + cleared on `onMounted` |
| `store.state.cache.builds[id]` | Edit-mode load shortcut | Read before Firestore fallback |
