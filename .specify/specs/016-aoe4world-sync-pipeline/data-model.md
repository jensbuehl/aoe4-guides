# Data Model: AOE4World Sync Pipeline

All state lives as reactive `ref` / `computed` locals inside `Admin.vue setup()`. No Firestore, no Vuex.

---

## Reactive State

### `syncPhase: ref<SyncPhase>`

```
type SyncPhase = 'idle' | 'fetching' | 'preview' | 'downloading'
```

Controls which UI panel is rendered. Transitions:
- `idle` → `fetching` when admin clicks "Sync Data with AOE4WORLD"
- `fetching` → `preview` when all 4 fetch Promises settle (success or error)
- `preview` → `downloading` when admin clicks "Apply & Download"
- `downloading` → `idle` when all downloads have been triggered (auto-reset)

---

### `fetchStatus: ref<FetchStatusMap>`

```
interface FetchStatusMap {
  units:        'idle' | 'loading' | 'success' | 'error'
  buildings:    'idle' | 'loading' | 'success' | 'error'
  technologies: 'idle' | 'loading' | 'success' | 'error'
  abilities:    'idle' | 'loading' | 'success' | 'error'
}
```

Updated per-source as each fetch resolves. Drives the fetch-progress chips in the UI.

---

### `sourceData: ref<SourceDataMap>`

```
interface SourceDataMap {
  units:        AOE4WorldItem[] | null   // null = fetch failed
  buildings:    AOE4WorldItem[] | null
  technologies: AOE4WorldItem[] | null
  abilities:    AOE4WorldItem[] | null
}
```

Held in memory for the duration of the sync session. Cleared on reset.

---

### `categoryResults: ref<CategoryResult[]>`

One entry per category (12 total), populated after all fetches settle.

```
interface CategoryResult {
  key:         string           // e.g. 'unitEco'
  filename:    string           // e.g. 'unitEco.json'
  sourceKeys:  SourceKey[]      // ['units'] or ['buildings', 'technologies']
  localEntries: LocalEntry[]    // deep clone of the imported JSON array
  matched:     MatchedEntry[]   // automatic matches
  unmatched:   LocalEntry[]     // no automatic match found
  resolved:    ResolvedEntry[]  // manually mapped by admin
  skipped:     LocalEntry[]     // explicitly skipped by admin
  errored:     boolean          // true if any sourceKey fetch failed
}

interface LocalEntry {
  title: string
  id?:   string
  // ... other fields from the local JSON (imgSrc, civ, class, etc.)
}

interface AOE4WorldItem {
  id:          string
  name:        string
  baseId:      string
  description: string
  age:         number
  type:        string
  costs:       object
  influences?: object
}

interface MatchedEntry {
  local:  LocalEntry
  source: AOE4WorldItem
}

interface ResolvedEntry {
  local:    LocalEntry
  source:   AOE4WorldItem   // manually selected by admin
}
```

---

## Static Configuration

### `CATEGORY_CONFIG` (constant, not reactive)

```
interface CategoryConfig {
  key:        string
  filename:   string
  sourceKeys: SourceKey[]   // determines which sourceData entries to combine
  exploreType?: string      // path segment for exploreUrl (e.g. 'units', 'buildings')
  data:       LocalEntry[]  // the imported JSON module reference
}
```

The 12 entries:

| key               | filename               | sourceKeys                    | exploreType    |
|-------------------|------------------------|-------------------------------|----------------|
| unitEco           | unitEco.json           | ['units']                     | units          |
| unitReligious     | unitReligious.json     | ['units']                     | units          |
| unitMilitary      | unitMilitary.json      | ['units']                     | units          |
| unitHero          | unitHero.json          | ['units']                     | units          |
| buildingEco       | buildingEco.json       | ['buildings']                 | buildings      |
| buildingMilitary  | buildingMilitary.json  | ['buildings']                 | buildings      |
| buildingReligious | buildingReligious.json | ['buildings']                 | buildings      |
| buildingTech      | buildingTech.json      | ['buildings']                 | buildings      |
| landmarks         | landmarks.json         | ['buildings', 'technologies'] | buildings      |
| techEco           | techEco.json           | ['technologies']              | technologies   |
| techMilitary      | techMilitary.json      | ['technologies']              | technologies   |
| abilityHero       | abilityHero.json       | ['abilities', 'technologies'] | (none)         |

---

## Computed

### `canDownload: computed<boolean>`

`true` when:
- `syncPhase === 'preview'`
- At least one non-errored category exists
- Every non-errored category has zero entries remaining in `unmatched` (all resolved or skipped)

### `allFetchesSettled: computed<boolean>`

`true` when all four `fetchStatus` values are `'success'` or `'error'` (none still `'loading'`). Used to transition `syncPhase` from `'fetching'` to `'preview'`.
