# Data Model: Home Civilization Picker

**Date**: 2026-06-04 | **Feature**: 005-home-civ-picker

> No new entities, Firestore collections, or store state. This document captures the existing shapes consumed as props by `CivPicker.vue`.

## Component Props

### `CivPicker.vue`

| Prop | Type | Required | Description |
|---|---|---|---|
| `civs` | `Civ[]` | Yes | Filtered civ list (excludes `ANY`); sourced from `civDefaultProvider.js` |
| `recentCivBuilds` | `RecentCivBuild[]` | Yes | Array of `{ civ: string, timeCreated: Timestamp }` from home snapshot; drives NEW badge |
| `loading` | `Boolean` | Yes | When `true`, renders skeleton tiles instead of the grid. Driven by Home.vue's `snapshotLoaded` ref |

---

## Existing Shapes (read-only — no changes)

### `Civ` (from `civDefaultProvider.js`)

```js
{
  title: String,       // e.g. "Abbasid Dynasty"
  shortName: String,   // e.g. "ABB" — used as route query param
  tagLine: String,     // e.g. "Technology, Camels, City Planning" — searchable
  flagLarge: String,   // relative path, e.g. "assets/flags/abb-large.webp"
  flagSmall: String,   // relative path (lazy-src)
}
```

### `RecentCivBuild` (from home snapshot `recentCivBuilds` array)

```js
{
  civ: String,                  // matches Civ.shortName
  timeCreated: FirestoreTimestamp  // .toDate() fed into isNew()
}
```

### `isNew(date)` (from `useTimeSince.js`)

Returns `true` when `date` is within the past 2 days. Used to decide whether to render the NEW badge on a tile.

---

## Home.vue State Change

One new ref added to `Home.vue` setup:

```js
const snapshotLoaded = ref(false);
// set to true at the end of initData()
```

Passed to `CivPicker` as `:loading="!snapshotLoaded"`.
