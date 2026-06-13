# Contract: BuildHeader.vue — Desktop Hero

> `src/components/builds/BuildHeader.vue` — desktop section (`d-none d-md-block`) only

## Props (unchanged)

| Prop | Type | Description |
|------|------|-------------|
| `build` | Object | The build document (`{ title, civ, isDraft, season, map, strategy, author, authorUid, upvotes, views, comments, timeCreated, timeUpdated }`) |
| `readonly` | Boolean | `true` = view mode; `false` = edit mode |
| `linkChips` | Boolean | Optional override — whether chips link to filtered browse |

## Slots (unchanged)

| Slot | Usage |
|------|-------|
| `actions` | Pinned top-right — vote/favorite/overflow (view) or Publish/overflow (edit) |

## Desktop Hero Layout Contract (FR-001/002)

The desktop section (`v-card flat rounded="lg" class="d-none d-md-block"`) has three columns:

```
┌─────────────────────────────────────────────────────────────────┐
│ Flag col (3/4) │ Body col (grow)                   │ Actions col │
│                │  ┌─────────────────────────┐      │             │
│  [flag image   │  │ [CIV FLAG 46×34] CIV    │      │  [actions   │
│   full-bleed   │  │ NAME (text-h6 bold)     │      │   slot]     │
│   with right   │  └─────────────────────────┘      │             │
│   gradient]    │  [title text-h5/h6]               │             │
│                │  [chips: Draft · New · Season ·   │             │
│                │   Map · Strategy · Author · ...]  │             │
└─────────────────────────────────────────────────────────────────┘
```

### Civ lockup (new — FR-001/002)

Add as the **first element** in the body column's flex container, before the title and chips:

```html
<div v-if="civEntry" class="d-flex align-center ga-2 ml-4 mt-2 mb-1">
  <v-img
    :src="civEntry.flagSmall"
    width="46"
    height="34"
    rounded="sm"
    cover
  ></v-img>
  <span class="text-h6 font-weight-bold">{{ civLabel }}</span>
</div>
```

- Uses `civEntry` (already computed in setup) — no new data fetching
- Uses `civEntry.flagSmall` (already computed) for the inline flag image
- Renders only when `civEntry` is non-null (i.e., a specific civ is selected, not "ANY")
- Font: `text-h6 font-weight-bold` — visually distinct from the metadata chips

### Civ chip — remove

Remove the `v-chip` for `build.civ` from the desktop chip group. The civ is now the lockup, not a chip. All other chips remain unchanged:
- Draft chip (`build.isDraft`)
- New chip (`isNew(createdDate)`)
- Season chip (`build.season`) — keep
- Strategy chip (`build.strategy`) — keep
- Map chip (`build.map`) — keep
- Author chip (`build.author`, readonly only) — keep
- Views, comments, upvotes, time chips — keep

### Mobile section — untouched

The mobile section (`d-md-none`) is not changed. The civ chip in the mobile section stays as-is.

## Acceptance Gates

- FR-001: Civ lockup (flag img + name text) is visually prominent and distinct from chips
- FR-002: No civ chip in the desktop chip group
- SC-001: Page renders without horizontal scroll at ≥1280 px
- Mobile (`xs`/`sm`) renders identically to before this feature (visual regression)
