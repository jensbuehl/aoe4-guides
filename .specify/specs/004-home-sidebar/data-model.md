# Data Model: Home Sidebar Rework

**Feature**: 004-home-sidebar | **Date**: 2026-06-03

No new entities are introduced. The sidebar reads from the existing home snapshot via Vuex.

---

## Existing: Contributor (read-only, from home snapshot)

Source: `store.state.cache.topContributorsList` → populated from `snapshot.topContributors`
in `getHomeSnapshot()` (`src/composables/data/homeService.js`).

| Field | Type | Notes |
|---|---|---|
| `displayName` | `string` | Shown in the contributor row; truncated with ellipsis if long. |
| `authorId` | `string` | Used as `author` query param in the `Builds` route. |
| `icon` | `string \| null` | Avatar URL; `null` triggers 2-letter initials fallback. |
| `viewCount` | `number` | Displayed with `mdi-eye` chip. |
| `boCount` | `number` | Displayed with `mdi-hammer` chip. |
| `loading` | `boolean` | Skeleton loader guard (set during initial load). |

**Rank**: derived at render time as `index + 1` from the array position (no rank field in the snapshot).

---

## Static Season Copy (hardcoded in `News.vue`)

Not a data entity — presented here for reference.

| Element | Value |
|---|---|
| Tag | `Season 13 · Live` |
| Title | `Yue Fei's Legacy` |
| Blurb | `The new Jin Dynasty civilization is fully supported — start sharing your guides.` |

---

## No changes to Firestore schema or Cloud Function output.

The `topContributors` array in the home snapshot is currently capped at 4 by the Cloud Function.
Increasing it to 8 is a separate, optional follow-up (tracked as `[P]` in `tasks.md`).
