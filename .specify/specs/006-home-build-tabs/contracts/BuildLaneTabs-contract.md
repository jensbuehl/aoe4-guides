# Component Contract: BuildLaneTabs

**File**: `src/components/home/BuildLaneTabs.vue`
**Feature**: 006-home-build-tabs

## Props

| Prop | Type | Required | Validation |
|---|---|---|---|
| `popularBuilds` | `Array` | Yes | Items are either build objects or `{ loading: true }` skeleton sentinels |
| `allTimeClassics` | `Array` | Yes | Same shape as `popularBuilds` |
| `recentBuilds` | `Array` | Yes | Same shape as `popularBuilds` |

## Emits

None. Tab switching is internal state; View all is a router-link.

## Slots

None.

## Behaviour Contract

| Condition | Expected output |
|---|---|
| Initial render | Trending tab active, Trending list visible |
| Component unmounts and remounts | Active tab resets to Trending |
| Click/activate a tab | That lane's list swaps in; `v-model` updates; URL unchanged |
| Click View all (Trending active) | Navigate to `{ name: 'Builds', query: { orderBy: 'score' } }` |
| Click View all (Classics active) | Navigate to `{ name: 'Builds', query: { orderBy: 'scoreAllTime' } }` |
| Click View all (New active) | Navigate to `{ name: 'Builds', query: { orderBy: 'timeCreated' } }` |
| Lane list contains only `{ loading: true }` items | Skeleton cards render via BuildListCard; tab bar unaffected |
| Lane list is empty (no items, no skeletons) | Empty state `v-alert` shown inside panel; tab bar intact |
| `prefers-reduced-motion: reduce` | `v-window` transitions disabled (`transition="false"`) |
| Arrow key pressed on focused tab | Focus moves to adjacent tab (Vuetify v-tabs handles this) |
| Screen reader reaches tab bar | Announced as `tablist`; active tab as `aria-selected="true"` |

## Accessibility Requirements

- Tab bar must be a `role="tablist"` with each `role="tab"` (provided by `v-tabs`/`v-tab`)
- Each panel must be `role="tabpanel"` (provided by `v-window-item`)
- Active tab `aria-selected="true"`; inactive `aria-selected="false"` (Vuetify)
- Panel associated to its tab via `aria-controls`/`aria-labelledby` (Vuetify)
- View all button must have an accessible label (visible text is sufficient)
- Focus ring must be visible on focused tab (Vuetify `:focus-visible` outline)
