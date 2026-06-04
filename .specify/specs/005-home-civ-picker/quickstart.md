# Quickstart: Home Civilization Picker

**Feature**: 005-home-civ-picker | **Branch**: `005-home-civ-picker`

## What's changing

`Home.vue` loses ~180 lines: the two duplicated civ v-row blocks (mobile + desktop) and the standalone search `v-text-field`. In their place: one `<CivPicker>` component.

## Files

| File | Change |
|---|---|
| `src/components/home/CivPicker.vue` | **NEW** |
| `src/views/Home.vue` | **EDIT** — remove civ rows + search; add CivPicker + `snapshotLoaded` ref |

## CivPicker in Home.vue

```vue
<!-- In Home.vue template, replacing the search field + both civ v-row blocks -->
<CivPicker
  :civs="civs"
  :recent-civ-builds="recentCivBuilds"
  :loading="!snapshotLoaded"
/>
```

```js
// In Home.vue setup()
const snapshotLoaded = ref(false);

const initData = async () => {
  const snapshot = await getHomeSnapshot();
  recentCivBuilds.value = snapshot?.recentCivBuilds ?? [];
  // ... other commits ...
  snapshotLoaded.value = true;  // ← add this line at the end
};

// Remove civFilter and filteredCivs from setup() return — they move into CivPicker
```

## CSS token mapping

The scoped CSS in CivPicker uses Vuetify CSS custom properties already exposed by the theme:

| Token in css-reference.md | Vuetify equivalent |
|---|---|
| `var(--primary)` | `rgb(var(--v-theme-primary))` |
| `var(--surface)` | `rgb(var(--v-theme-surface))` |
| `var(--accent)` | `rgb(var(--v-theme-accent))` |
| `var(--hero-fade)` | `var(--v-theme-background)` (RGB triplet, no `rgb()` wrapper) |

> Use `rgb(var(--v-theme-X))` for all color properties except the gradient, where you need the raw triplet: `rgba(var(--v-theme-background), .92)`.

## Golden-path test checklist

- [ ] Desktop: 5-column grid; hover a tile → name fades in, tooltip appears
- [ ] ≤1080px: 4 columns
- [ ] ≤720px: 3 columns; names always visible (no hover needed)
- [ ] Type in search → grid filters live; clear → all civs return
- [ ] Search with no match → empty state shows
- [ ] Keyboard: Tab through tiles; focus ring visible; Enter navigates to Dashboard
- [ ] Light theme: name is navy (`#294790`); dark theme: name is gold (`#e7c05e`)
- [ ] Civ with recent build shows NEW badge
- [ ] Before snapshot loads: skeleton tiles in grid shape; after: live tiles
