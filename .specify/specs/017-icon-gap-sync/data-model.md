# Data Model: Icon Gap Sync

All entities are ephemeral Vue reactive state in `Admin.vue setup()`. Nothing is persisted to Firestore.

---

## GapItem

A single (AOE4World item, civilization) pair representing one row in the gap list.

```ts
interface GapItem {
  id: string          // AOE4World item id (e.g. "villager-1")
  baseId: string      // AOE4World base id without age suffix (e.g. "villager")
  name: string        // AOE4World display name (e.g. "Villager")
  type: "unit" | "building" | "technology" | "ability"
  age: 1 | 2 | 3 | 4
  civ: string         // AOE4World civ slug for this specific gap (e.g. "ayyubids")
  civCode: string     // Local 3-letter code (e.g. "AYY")
  civCount: number    // Total number of civs this item appears in (drives folder resolution)
  description: string
  costs: { food: number, wood: number, stone: number, gold: number,
           total: number, popcap: number, time: number }
  exploreUrl: string  // https://aoe4world.com/explorer/civs/all/{type}s/{baseId}
  kind: "new" | "civ-extension"
  localEntry: LocalEntry | null   // null when kind === 'new'
  localCategory: CategoryConfig | null  // null when kind === 'new'
}
```

**Key**: `${gapItem.id}:${gapItem.civ}` — unique per (item, civ) pair.

**Identity rule**: One AOE4World item missing for N civs = N GapItems with the same `id` but different `civ`.

**State transitions**:
- Created by `buildGapList()` during scan
- Immutable after creation — all user state is in `gapAssignments` and `gapImageStatus`

---

## CategoryAssignment

Tracks the admin's assignment of a GapItem to a local JSON category, plus image metadata.

```ts
interface CategoryAssignment {
  gapKey: string        // "${id}:${civSlug}" — references the GapItem
  categoryKey: string   // One of the 12 CATEGORY_CONFIG keys
  autoSuggested: boolean // true if category was auto-filled, false if admin picked
  confirmed: boolean     // true once admin has accepted (auto = immediately; manual = on select)
  imageFolder: string | null  // resolved "{assetType}_{civOrGroup}" folder name (for kind=new)
  folderManual: boolean       // true if admin edited the folder (overrides auto-resolution)
  imgSrc: string        // "/assets/pictures/{folder}/{id}.webp" — set after image processed
                        // for civ-extension: copied from localEntry.imgSrc
                        // for new item: empty until image is processed
}
```

**Keyed by**: `gapKey` in `gapAssignments` ref: `{ [gapKey: string]: CategoryAssignment }`.

---

## ProcessedImage

In-memory result of image processing for a single new-item gap.

```ts
interface ProcessedImage {
  gapKey: string    // references the GapItem
  blob: Blob        // WebP image at 80% quality, scaled to target dimensions
  zipPath: string   // relative path within zip: "{folder}/{id}.webp"
                    // e.g. "unit_ayyubids/new-unit-1.webp"
}
```

Not persisted to state. Collected in a local array during `downloadGapImagesZip()` and handed to JSZip immediately.

---

## GapImageStatus

Per-item processing status, tracked in `gapImageStatus` ref.

```ts
type GapImageStatus =
  | "pending"     // not yet processed
  | "processing"  // fetch/convert in progress
  | "done"        // successfully converted; blob in zip
  | "exists"      // skipped — icon already exists locally (FR-015)
  | "skipped"     // skipped — civ extension, no image needed
  | "error"       // CDN fetch failed or canvas conversion failed
```

---

## LocalEntry (existing)

Shape of entries in the 12 local JSON category files (already in the codebase).

```ts
interface LocalEntry {
  title: string
  age: number
  imgSrc: string
  civ: string[]      // 3-letter local codes: ["ABB", "AYY", ...]
  class: string
  shorthand?: string[]
  description?: string
  id?: string        // AOE4World id — may be absent on older entries
  type?: string
  exploreUrl?: string
  costs?: object
  syncSkip?: boolean
  deprecated?: boolean
}
```

---

## Entity Relationships

```
GapItem  1 ──── 0..1 ──── CategoryAssignment
GapItem  1 ──── 0..1 ──── ProcessedImage
GapItem  1 ──── 1    ──── GapImageStatus

CategoryAssignment ──── references ──── CategoryConfig (from CATEGORY_CONFIG constant)
CategoryAssignment ──── references ──── LocalEntry (for civ-extension kind)

ProcessedImage ──── added to ──── JSZip instance (transient, during download only)
```
