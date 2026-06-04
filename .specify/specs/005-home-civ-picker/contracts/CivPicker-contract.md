# Component Contract: CivPicker

**File**: `src/components/home/CivPicker.vue`
**Feature**: 005-home-civ-picker

## Props

| Prop | Type | Required | Validation |
|---|---|---|---|
| `civs` | `Array` | Yes | Non-empty array of `{ title, shortName, tagLine, flagLarge, flagSmall }` |
| `recentCivBuilds` | `Array` | Yes | Array of `{ civ: String, timeCreated: FirestoreTimestamp }` — may be empty |
| `loading` | `Boolean` | Yes | `true` → show skeleton grid; `false` → show live tiles |

## Emits

None. Navigation is handled internally via Vue Router `:to` bindings.

## Slots

None.

## Behaviour Contract

| Condition | Expected output |
|---|---|
| `loading === true` | 15 skeleton tiles in the same CSS grid layout |
| `loading === false`, no filter | All `civs` rendered as flag tiles |
| `loading === false`, filter matches | Only matching civs rendered (match on `title`, `shortName`, `tagLine` — case-insensitive) |
| Filter matches nothing | Empty-state message in place of grid |
| `recentCivBuilds` contains entry for a civ within 2 days | NEW badge rendered on that tile |
| Viewport ≤720px | Civ name always visible (no hover required) |
| Viewport >720px | Civ name hidden; revealed on hover and `:focus-visible` |
| Keyboard focus on tile | Focus ring visible AND name overlay revealed |
| Any tile activated (click/Enter/Space) | Navigation to `{ name: 'Dashboard', query: { civ: shortName } }` |

## Accessibility Requirements

- Each tile must have `aria-label="<civ title>"` and `title="<civ title>"`
- Flag `<img>` must have `alt="<civ title>"`
- Search `v-text-field` must have `label` or `aria-label="Search civilizations"`
- Clear button provided automatically by Vuetify `clearable` prop

## Scoped CSS Classes (internal)

| Class | Purpose |
|---|---|
| `.civ-grid` | CSS grid wrapper (5/4/3 columns at breakpoints) |
| `.civ-tile` | Individual tile — `aspect-ratio: 16/10`, overflow hidden |
| `.civ-tile__overlay` | Hover/focus name reveal overlay with legibility gradient |
| `.civ-tile__name` | Civ name text in `color: rgb(var(--v-theme-primary))` |
