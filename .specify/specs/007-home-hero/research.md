# Research: Home Featured Hero Build (007)

## Decision 1: description field in pickBuildFields

**Finding**: `description` is **already present** in `pickBuildFields` (line 12 of `updateHomeSnapshot.js`):
```js
description: data.description ?? null,
```
No field addition is needed. The only required change is adding a 300-character server-side trim (per clarification Q3) to bound snapshot size across ~4,000 builds.

**Decision**: Modify the existing line to:
```js
description: data.description ? data.description.slice(0, 300) : null,
```

**Rationale**: Keeps description storage bounded at ~1.2MB max across 4k builds; CSS line-clamp handles visual truncation client-side.

---

## Decision 2: Hero placement — inside BuildLaneTabs.vue

**Alternatives evaluated**:

| Option | Approach | Verdict |
|--------|----------|---------|
| A (chosen) | Hero rendered inside `BuildLaneTabs.vue` | Simplest — `activeTab` + lane data already available |
| B | Hero in `Home.vue`, lift `activeTab` up as prop/emit | Requires changing both files + prop plumbing |
| C | Hero in `Home.vue`, import the module-level `activeTab` ref | Couples `Home.vue` to `BuildLaneTabs.vue` internals |

**Decision**: Place `HeroBuild.vue` at the top of `BuildLaneTabs.vue`'s template — before the `v-tabs`. This requires no state changes and no prop lifting.

**Rationale**: Constitution principle I (Simplicity First). The "build section" referenced in the spec corresponds to `BuildLaneTabs.vue`; the hero is part of that section.

---

## Decision 3: Civ flag URL and display name lookup

**Finding**: Build objects from the snapshot include `civ: shortName` (e.g., `"OTT"`). The `civDefaultProvider.js` exports `civs` as a ref array with `{ shortName, title, flagLarge, flagSmall }` per civilization.

**Decision**: In `BuildLaneTabs.vue`, import `civs` from `civDefaultProvider` (already used by `Home.vue`). Compute hero civ as:
```js
const heroCiv = computed(() => civs.value.find(c => c.shortName === heroBuild.value?.civ));
```
Pass `heroCiv.value?.flagLarge` and `heroCiv.value?.title` into `HeroBuild.vue`.

**Rationale**: No new data fetching; re-uses existing static civ registry.

---

## Decision 4: CSS custom properties — where to define them

**Finding**: Theme-scoped CSS vars are defined in `src/assets/base.css` in `.v-theme--customDarkTheme` and `.v-theme--customLightTheme` blocks. Vuetify color tokens (accent, primary) are available as `rgb(var(--v-theme-{name}))`.

**Decision**: Add `--hero-fade`, `--hero-title`, `--hero-text`, `--hero-meta`, `--hero-shadow` to each theme block in `base.css`. Also add `--accent` (maps to Vuetify theme accent) and `--shadow` (the card elevation shadow) to both blocks.

```css
/* Dark */
.v-theme--customDarkTheme {
  /* existing ... */
  --hero-fade: 20,26,37;
  --hero-title: #fff;
  --hero-text: rgba(255,255,255,.86);
  --hero-meta: rgba(255,255,255,.82);
  --hero-shadow: 0 2px 8px rgba(0,0,0,.5);
  --accent: #e7c05e;
  --shadow: 0 8px 28px rgba(0,0,0,.35);
}

/* Light */
.v-theme--customLightTheme {
  /* existing ... */
  --hero-fade: 250,250,250;
  --hero-title: #294790;
  --hero-text: #41506b;
  --hero-meta: #5b6573;
  --hero-shadow: none;
  --accent: #b9962f;
  --shadow: 0 8px 28px rgba(40,50,70,.16);
}
```

**Rationale**: Consistent with existing pattern in `base.css`; `HeroBuild.vue`'s scoped CSS uses `var(--hero-*)` without any JS theme awareness.

---

## Decision 5: De-duplication of hero build from lane list

**Finding**: `BuildLaneTabs.vue` uses `laneList(lane.value)` to render items. Currently it returns the raw prop array.

**Decision**: Modify `laneList` to exclude the hero build (by id) when the hero is shown:
```js
const laneList = (value) => {
  const items = value === "trending" ? props.popularBuilds
    : value === "classics" ? props.allTimeClassics
    : props.recentBuilds;
  const hero = heroForLane(value);
  return hero ? items.filter(b => b.id !== hero.id) : items;
};
```

**Rationale**: FR-006 requires the hero build not appear again as first list item; filtering by id is robust to ordering changes.

---

## Decision 6: Tab-swap animation

**Decision**: Instant content swap — no CSS transition on hero content (per clarification Q4). The existing `v-window` handles tab transitions for the list; the hero renders from a computed property that updates reactively on `activeTab` change.

**Rationale**: Simplest; reduced-motion requirement trivially satisfied. No separate animation handling needed.

---

## Decision 7: Skeleton loading state

**Finding**: Store initializes with `popularBuildsList: Array(10).fill({ loading: true })`. Loading sentinel is `{ loading: true }` on individual items.

**Decision**: Show hero skeleton when `heroBuild.value?.loading === true` OR when hero is null but lane is still loading. Detect loading via the first item of the active lane list (`items[0]?.loading === true`).

**Rationale**: Consistent with how `BuildListCard` handles loading (it already has `item.loading` guards). No new loading state needed.
