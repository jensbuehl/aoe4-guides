# Component Contract: BuildHeader.vue

**Path**: `src/components/builds/BuildHeader.vue`
**Feature**: `010-build-editor-unification`
**Consumed by**: `BuildEditor.vue` (create + edit) and `BuildDetails.vue` (view)
**Replaces**: the six hand-rolled hero blocks (3 views × 2 breakpoints) in `BuildNew.vue`, `BuildEdit.vue`, `BuildDetails.vue`

A presentational hero: civ-flag background + title + reactive chip row + a trailing `#actions` slot. It holds **no** consumer handlers — actions are injected via the slot (Constitution I). It derives all display from the `build` object, so editor consumers get live updates for free and the view consumer reflects the loaded build.

---

## Props

| Prop | Type | Required | Default | Description |
|---|---|---|---|---|
| `build` | `Object` | yes | — | The build (or draft) object. Reads `title`, `civ`, `season`, `strategy`, `map`, `isDraft`, `author`, `authorUid`, `views`, `upvotes`, `comments`, `timeCreated`, `timeUpdated`. |
| `readonly` | `Boolean` | no | `false` | View-route hint. When `true`, chips that filter (civ, author) may render as clickable `:to` links; when `false` (editor) they are plain. |
| `linkChips` | `Boolean` | no | `=readonly` | Whether civ/author chips link to `Builds` filtered routes (preserves the view route's existing `:to` behaviour). |

## Slots

| Slot | Scope | Description |
|---|---|---|
| `actions` | — | Trailing top-right cluster. Editor passes its overflow `v-menu`; view passes `<Vote>` + `<Favorite>` + one overflow `v-menu`. |
| `chips` *(optional)* | `{ build }` | Escape hatch to fully override the chip row if a consumer needs bespoke chips. Default slot content renders the standard chip set. |

## Emits

*None.* The component is presentational; interactions live in the slotted actions.

## Structure

```
v-card (flat, rounded="lg")
└─ v-row (no-gutters, responsive — ONE block, no hidden-* twins)
   ├─ v-col (flag)  → v-img cover, flagLarge/flagSmall + :gradient fade (any-* fallback)
   ├─ v-col (body)  → v-card-title {{ build.title }}
   │                  └─ chip group (v-if per field): draft, NEW(isNew), civ, season,
   │                     strategy, map, author, views, comments, upvotes, dates
   └─ v-col (auto)  → <slot name="actions" />   (pinned top-right)
```

## Composables used (internal)

| Composable | Use |
|---|---|
| `civDefaultProvider` | `getCivById(build.civ)` for chip label; `civs.find(...)` for `flagLarge`/`flagSmall` |
| `useTimeSince` | `timeSince(date)`, `isNew(date)` for date chips + NEW badge |

## Chip set (parity with current views)

| Chip | Condition | Icon | Notes |
|---|---|---|---|
| Draft | `build.isDraft` | `mdi-pencil-circle` | `color="error"` |
| NEW | `isNew(timeCreated)` | `mdi-alert-decagram` | `color="accent"` |
| Civ | `build.civ` | `mdi-earth` | `:to Builds?civ=` when `linkChips` |
| Season | `build.season` | `mdi-trophy` | |
| Strategy | `build.strategy` | `mdi-strategy` | |
| Map | `build.map` | `mdi-map` | |
| Author | always | `mdi-account-edit` | `:to Builds?author=` when `linkChips` |
| Views | `build.views` | `mdi-eye` | |
| Comments | `build.comments > 0` | `mdi-message` | view route only |
| Upvotes | `build.upvotes` | `mdi-thumb-up` | |
| Created / Updated | `build.timeCreated` | `mdi-clock-edit-outline` / `mdi-update` | `timeSince(...)` |

> The editor may pass a reduced chip set (it shows civ/season/strategy/draft, not views/votes/dates). Gate the engagement chips on `!readonly === false` or simply let `v-if` on the (zero) values hide them in create/edit. Keep it data-driven, not mode-branched where possible.

## Usage

**Editor (edit mode):**
```html
<BuildHeader :build="build">
  <template #actions>
    <v-menu><!-- Duplicate / Copy / Download / — / Delete --></v-menu>
  </template>
</BuildHeader>
```

**View route:**
```html
<BuildHeader :build="build" readonly>
  <template #actions>
    <Vote v-if="userData" v-model="userData" :buildId="build.id" … />
    <Favorite v-if="userData" v-model="userData" :buildId="build.id" />
    <v-menu><!-- Edit / Publish / Duplicate / Copy / Download / Open-in-Overlay / — / Delete --></v-menu>
  </template>
</BuildHeader>
```

## Rules

| Rule | Detail |
|---|---|
| One markup block | No `hidden-sm-and-down` / `hidden-md-and-up` duplication; responsive via `v-col` breakpoints + `flex-wrap` chips. |
| No handlers inside | All click logic lives in slotted content; the component never imports `buildService` etc. |
| Theme tokens only | Flag `:gradient` uses live `surface`; chips use `accent`/`error`; no hex. |
| Reactive | Chips/flag derive from `build`; editing fields in the editor updates the hero with no extra wiring. |

## Out of scope

- The action menus themselves (provided by consumers, or by the optional `BuildActionMenu.vue`).
- Vote / Favorite components (passed in by the view route, unchanged).
- The build-order steps (`BuildOrderEditor.vue`, separate).
