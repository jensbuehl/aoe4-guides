# Contract — Age Timings

This feature exposes no HTTP surface. Its contracts are the internal module boundary and the persisted document field that crosses process boundaries (browser ↔ Firestore ↔ scheduled function ↔ backfill script).

---

## 1. Module contract — `src/composables/builds/useAgeTimings.js`

### `getAgeTimings(steps) → AgeTiming[]`

| | |
|---|---|
| **Input** | `steps` — a build's `steps` field: either the sections array (`{type, age, gameplan, steps[]}[]`) or a legacy flat step array. `null`, `undefined` and `[]` are valid inputs. |
| **Output** | An array, ascending by `age`. Possibly empty. **Never `null`.** |
| **Throws** | Never. Any malformed shape yields `[]`. |

```ts
type AgeTiming = {
  age: 2 | 3 | 4;      // 2 Feudal, 3 Castle, 4 Imperial
  seconds: number;     // whole seconds from game start
  derived: boolean;    // true when interpolated rather than author-stated
};
```

**Guarantees**

1. Returns `[]` when `steps` is empty/absent, when the build is legacy-flat (`steps[0].type` undefined), when no `age` section above 1 exists, or when `getTimings()` returns `null`.
2. Never returns an entry with a `null` or `NaN` `seconds`.
3. `derived` reflects whether the boundary step's own timestamp **parsed**, not merely whether a `time` field was present.
4. Does not mutate `steps`.
5. Never modifies or re-implements `timingsHelper.js`; `getTimings()` is called unchanged and its `null` contract is honoured rather than worked around.

### `useAgeTimings(buildRef) → ComputedRef<AgeTiming[]>`

Memoized wrapper. Prefers `build.ageTimings` when present, otherwise derives from `build.steps`. Returns `[]` for a loading skeleton build.

---

## 2. Document contract — `builds/{buildId}.ageTimings`

```ts
type StoredAgeTimings = {
  feudal?:   { t: number; e: boolean };
  castle?:   { t: number; e: boolean };
  imperial?: { t: number; e: boolean };
};
```

**Producers**: `buildService.addBuild` / `buildService.updateBuild`; the one-off backfill script.
**Consumers**: `BuildListCard`, `AgeTimeline`, `updateHomeSnapshot` (copy only), and any future age-time sort query.

**Invariants**

| # | Rule | Why it matters |
|---|---|---|
| C1 | An age the build does not reach has **no key** | A `0` or `null` sentinel would sort to the front of "fastest Castle" |
| C2 | The map is replaced wholesale on every save | Ages removed by an edit must vanish (FR-033) |
| C3 | `t` is a whole number of seconds | Keeps list, Focus mode and timeline agreeing to the second |
| C4 | No timings derivable → `{}` | Uniform payload; behaves identically to absent for ordering |
| C5 | Written only by the build's author or the Admin SDK | Enforced by existing rules; no rules change |

**Compatibility**: absent (`undefined`) on any build saved before this feature. Consumers must treat absent and `{}` identically and fall back to deriving from `steps` when steps are available.

**Age-name ↔ section-age mapping** — the one place the two numbering schemes are reconciled:

| Section `age` | Stored key |
|---|---|
| 2 | `feudal` |
| 3 | `castle` |
| 4 | `imperial` |

---

## 3. Snapshot contract — `home/home` lane entries

`pickBuildFields` gains `ageTimings: data.ageTimings ?? null`.

- **Copy only.** The scheduled function must not compute timings; doing so would create a second implementation and break FR-030.
- Entries written before this feature carry `null`; the card renders no timings for them (FR-034).
- Adds no Firestore reads — the field rides along in documents the job already fetches.

---

## 4. Component contract — `BuildListCard`

New prop:

```ts
context: 'default' | 'civ-locked' | 'author-locked'   // default: 'default'
```

`'author-locked'` is **new to the codebase** — `FilterConfig` currently recognises only `'default'` and `'civ-locked'`.

**Host responsibilities**

| Host | Passes | Note |
|---|---|---|
| `Builds.vue` | `author-locked` when `filterConfig.author` is set, else `default` | |
| `MyBuilds.vue` | `default` + own-list flag | author suppressed |
| `MyFavorites.vue` | `default` | |
| `BuildLaneTabs.vue` | forwards from its own host | **Not a direct host**: Dashboard and Home both render the card through this component, with different data shapes |
| `Dashboard.vue` | `civ-locked` → `BuildLaneTabs` | full build documents (steps present) |
| `Home.vue` | `default` → `BuildLaneTabs` | summary entries (no steps; stored `ageTimings` only) |

The card must not infer context from the route (FR-023).
