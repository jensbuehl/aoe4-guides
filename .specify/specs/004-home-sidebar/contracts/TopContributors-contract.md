# Component Contract: TopContributors.vue

**Component**: `src/components/home/TopContributors.vue`
**Feature**: 004-home-sidebar | **Date**: 2026-06-03

---

## Purpose

Renders a ranked list of all contributors provided by the home snapshot inside a single
bordered card. Replaces the per-contributor `v-card` blocks currently inline in `Home.vue`.

---

## Props

| Prop | Type | Required | Default | Description |
|---|---|---|---|---|
| `contributors` | `Array` | Yes | — | Array of contributor objects from `topContributorsList`. |

### Contributor object shape (see `data-model.md`)
```js
{
  displayName: String,   // contributor name
  authorId:    String,   // used for Builds route query
  icon:        String|null, // avatar URL; null → initials fallback
  viewCount:   Number,
  boCount:     Number,
  loading:     Boolean,  // skeleton guard
}
```

---

## Emits

None. Navigation is handled internally via `<router-link>` / `to` prop on the row.

---

## Behaviour

- Renders all items in `contributors` with no cap.
- Each row: rank numeral (index + 1), `v-avatar` (image or 2-letter initials in accent color), contributor name (primary color, truncated), `mdi-eye` chip (viewCount), `mdi-hammer` chip (boCount).
- Entire row is clickable → navigates to `{ name: 'Builds', query: { author: contributor.authorId } }`.
- If `contributors` is empty or has length 0, the card is hidden (`v-if="contributors.length"`).
- Skeleton loader shown while `contributor.loading === true`.

---

## Usage in Home.vue (sidebar)

```vue
<TopContributors :contributors="topContributorsList" />
```

---

## Visual spec

Card: `v-card border rounded="lg" class="mb-4"`
Header inside card: icon `mdi-account-star` + `text-h6` "Top Contributors"
Row height: ~52 px on desktop (`py-2` padding, 36 px avatar)
