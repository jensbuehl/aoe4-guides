# Component Contract: HeroBuild.vue

**Location**: `src/components/home/HeroBuild.vue`
**Used by**: `BuildLaneTabs.vue`

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `build` | Object \| null | yes | Active lane's #1 build object from store (null = hide hero) |
| `flagUrl` | String \| null | yes | Resolved flag image URL (e.g., `"assets/flags/ott-large.webp"`) |
| `civName` | String \| null | yes | Resolved civ display name (e.g., `"Ottomans"`) for eyebrow |
| `eyebrow` | String | yes | Full eyebrow label (e.g., `"#1 Trending · Ottomans"`) |
| `icon` | String | yes | MDI icon name for eyebrow (e.g., `"mdi-trending-up"`) |
| `loading` | Boolean | no | When true, render skeleton at hero dimensions. Default: false |

## Emits

None. The hero is a read-only display component.

## Slots

None.

## Behaviour

- When `loading` is true: render a `v-skeleton-loader` at `min-height: 230px` (full hero dimensions).
- When `build` is null and `loading` is false: render nothing (the hero is hidden; controlled by parent).
- When `build` is present: render full hero — flag background, diagonal scrim, eyebrow, title, description (if non-empty), meta row.

## Navigation

The entire hero is wrapped in a `<router-link :to="{ name: 'BuildDetails', params: { id: build.id } }">`
so the whole card is one keyboard-accessible click target.

## Accessibility

- Flag `v-img`: `alt=""` + `aria-hidden="true"` (decorative).
- The `<h2>` title is the accessible name for the hero region.
- `:focus-visible` ring defined in scoped CSS using `var(--accent)`.

## Theme vars consumed

All via CSS; no JS theme awareness needed:

| Var | Purpose |
|-----|---------|
| `--hero-fade` | RGB triplet for the diagonal gradient |
| `--hero-title` | Title color |
| `--hero-text` | Description color |
| `--hero-meta` | Meta-row text color |
| `--hero-shadow` | Title text-shadow |
| `--accent` | Eyebrow color and focus ring |
| `--shadow` | Card box-shadow |
