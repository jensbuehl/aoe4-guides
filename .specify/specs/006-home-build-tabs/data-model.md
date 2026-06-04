# Data Model: Home Build Lane Tabs

**Date**: 2026-06-04 | **Feature**: 006-home-build-tabs

> No new entities, Firestore collections, or store state. This document captures the existing shapes consumed as props by `BuildLaneTabs.vue` and the internal static lane config.

## Component Props

### `BuildLaneTabs.vue`

| Prop | Type | Required | Description |
|---|---|---|---|
| `popularBuilds` | `Array` | Yes | Trending builds from store (`cache.popularBuildsList`) — may contain `{ loading: true }` skeleton sentinels |
| `allTimeClassics` | `Array` | Yes | All-time classics from store (`cache.allTimeClassicsList`) — may contain skeleton sentinels |
| `recentBuilds` | `Array` | Yes | Recent/new builds from store (`cache.recentBuildsList`) — may contain skeleton sentinels |

## Internal Lane Config (static constant, not a prop)

```js
const lanes = [
  { value: 'trending',  label: 'Trending',         icon: 'mdi-trending-up',      orderBy: 'score' },
  { value: 'classics',  label: 'All-Time Classics', icon: 'mdi-star',             orderBy: 'scoreAllTime' },
  { value: 'new',       label: 'New',               icon: 'mdi-clock-edit-outline', orderBy: 'timeCreated' },
];
```

`value` is the key for both `v-tabs` `v-model` and `v-window-item` value matching.
`orderBy` maps to the Builds route query for the View all button.

## Existing Build Item Shape (from home snapshot)

```js
// Real item (after snapshot loads)
{
  id: String,
  title: String,
  authorDisplayName: String,
  civ: String,
  // ... other BuildListCard fields
}

// Loading sentinel (before snapshot loads)
{ loading: true }
```

## Active Tab State

One `ref` in component setup:
```js
const activeTab = ref('trending');  // resets to 'trending' on every component mount
```

Shared as `v-model` between `v-tabs` and `v-window`.

## View All Route (derived)

```js
const viewAllRoute = computed(() => ({
  name: 'Builds',
  query: { orderBy: lanes.find(l => l.value === activeTab.value)?.orderBy },
}));
```
