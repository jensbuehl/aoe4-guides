# Data Model: Desktop Build View & Editor Layout (`014-desktop-build-layout`)

> **No Firestore schema change.** This feature is a desktop layout refresh — it reads and writes the same `builds/{id}` document fields as before.

## Existing Entities (unchanged)

### Build Document (`builds/{id}`)

| Field | Type | Notes |
|-------|------|-------|
| `title` | string | Inline-editable on desktop (FR-004) |
| `civ` | string | Short name — drives civ lockup (flag + name) in desktop hero (FR-001) |
| `season` | string | Metadata chip |
| `map` | string | Metadata chip |
| `strategy` | string | Metadata chip |
| `description` | string | Plain text — Description card |
| `video` | string | YouTube embed URL — Video card |
| `isDraft` | boolean | Draft chip; gates Publish action |
| `steps` | array | Build-order sections (see below) |
| `author`, `authorUid`, `upvotes`, `views`, `comments` | various | Header display only |

### Build-Order Section (element of `steps[]`)

| Field | Type | Notes |
|-------|------|-------|
| `type` | `"age"` \| `"ageUp"` | Drives age-transition lane rendering (FR-013) |
| `age` | number | 0–4; maps to age name and icon |
| `gameplan` | string | HTML; the section note row content (FR-026/027/028); already WYSIWYG |
| `steps` | array | The step rows (see below) |

### Build-Order Step (element of `section.steps[]`)

| Field | Type | Notes |
|-------|------|-------|
| `time` | string | Editable free text (FR-007) |
| `builders` | string | Resource count; empty = faint dash (FR-005) |
| `food` | string | Resource count |
| `wood` | string | Resource count |
| `gold` | string | Resource count |
| `stone` | string | Resource count |
| `description` | string | HTML string with `<img>` icon tiles and `<br>` line breaks; WYSIWYG (FR-008/015–019) |

### Derived / Render-Only State (not persisted)

| Concept | Derivation | FR |
|---------|------------|-----|
| Villager total | `sum(builders, food, wood, gold, stone)` via `aggregateVillagers()` | FR-006 |
| Delta accent | `curr[field] > prev[field]` computed per cell at render time | FR-014 |
| Empty resource | `!item[field]` → render faint dash, no tile | FR-005 |
| Age name | `{ 1: "Feudal Age", 2: "Castle Age", 3: "Imperial Age" }[section.age]` | FR-013 |

## Icon Token Contract (unchanged)

Icons in descriptions and gameplans are stored as `<img>` elements with AOE4-specific CSS classes:
```html
<img src="/assets/..." class="icon-tech" title="Blacksmith">
```
The class determines the tile background via `radial-gradient` (frozen, FR-009). The `contentEditableHelper.js` chain and `sanitizeHtml` allowlist in `BuildEditor.vue` handle the read/write contract. No changes to either.

## Stable `_id` Client-Side Key

Steps carry a `_id` field added client-side (not persisted) for stable `v-for` keys. The `_nextStepId` monotonic counter in `BuildOrderSectionEditor.vue` assigns these on mount and on `addStep`. This pattern is unchanged.
