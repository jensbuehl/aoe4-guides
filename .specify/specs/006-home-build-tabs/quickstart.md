# Quickstart: Home Build Lane Tabs

**Feature**: 006-home-build-tabs | **Branch**: `006-home-build-tabs`

## What's changing

`Home.vue` loses its three stacked build-list sections (~80 lines: headers, tooltips, v-rows). In their place: one `<BuildLaneTabs>` component receiving the same three data arrays.

## Files

| File | Change |
|---|---|
| `src/components/home/BuildLaneTabs.vue` | **NEW** |
| `src/views/Home.vue` | **EDIT** — remove stacked sections; add BuildLaneTabs + import |

## BuildLaneTabs in Home.vue

```vue
<!-- Replace all three stacked build v-row blocks with: -->
<BuildLaneTabs
  :popular-builds="popularBuildsList"
  :all-time-classics="allTimeClassicsList"
  :recent-builds="recentBuildsList"
/>
```

```js
// Add to imports in Home.vue script
import BuildLaneTabs from "@/components/home/BuildLaneTabs.vue";

// Add to components: { ..., BuildLaneTabs }
```

The three `popularBuildsList`, `allTimeClassicsList`, `recentBuildsList` computed refs are already in Home.vue setup — no new store wiring needed.

## Lane config reference

```js
const lanes = [
  { value: 'trending',  label: 'Trending',         icon: 'mdi-trending-up',        orderBy: 'score' },
  { value: 'classics',  label: 'All-Time Classics', icon: 'mdi-star',               orderBy: 'scoreAllTime' },
  { value: 'new',       label: 'New',               icon: 'mdi-clock-edit-outline',  orderBy: 'timeCreated' },
];
```

## Reduced motion detection

```js
// In BuildLaneTabs setup()
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
// Pass to v-window:
// :transition="reducedMotion ? false : undefined"
// :reverse-transition="reducedMotion ? false : undefined"
```

## Golden-path test checklist

- [ ] Home loads → Trending tab active, Trending list visible (skeleton cards while loading)
- [ ] Click "All-Time Classics" → list swaps in place, URL unchanged, no network request
- [ ] Click "New" → list swaps, tab underline moves
- [ ] Click "View all" on Trending → navigates to `/builds?orderBy=score`
- [ ] Click "View all" on All-Time Classics → `/builds?orderBy=scoreAllTime`
- [ ] Click "View all" on New → `/builds?orderBy=timeCreated`
- [ ] Navigate away, return to Home → Trending tab is active (reset)
- [ ] Tab key to tab bar → arrow keys move focus between tabs; focus ring visible
- [ ] Light theme: active tab label/underline is navy; dark theme: gold
- [ ] `prefers-reduced-motion: reduce` (DevTools) → tab switch has no slide animation
