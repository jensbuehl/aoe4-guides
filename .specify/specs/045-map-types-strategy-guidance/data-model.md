# Data Model: Map Types and Strategy Guidance

## Build document (`builds/{id}`): constrained fields

| Field | Allowed values | Required | Before |
|---|---|---|---|
| `map` | `"Land"`, `"Water"`, `"Hybrid"` | yes | `""`, `"Open"`, `"Closed"`, `"Hybrid"`, `"Water"`, the text `"null"`, free text |
| `strategy` | `""`, `"Rush"`, `"Boom"`, `"Fast Castle"`, `"Fast Imperial"`, `"Timing Attack"`, `"Cheese"` | no (`""` = not stated) | the same, plus `null` and free text from imports |

No field is added or renamed, so the existing indexes on `map` and `strategy` stay valid.

**Cleanup mapping** (one-off, R7):

| `map` before | after |
|---|---|
| Water, Hybrid (any case) | unchanged (canonical case) |
| anything else, including `""`, missing, `null` | `Land` |

| `strategy` before | after |
|---|---|
| an option (any case, trimmed) | that option |
| contains exactly one option name | that option |
| anything else, including `null` | `""` |

**Enforced by**: `allowedFacets()` in `firestore.rules`, on author create and update only
(contracts/firestore-rules.md).

## Option lists (`src/composables/filter/`)

### `strategyDefaultProvider.js`

Draft wording; the owner tunes it.

| title | subtitle |
|---|---|
| Rush | Attack early in Feudal Age; Castle Age comes late or not at all. |
| Boom | Grow your economy first (extra Town Centers, more villagers) and fight later. |
| Fast Castle | Reach Castle Age as early as you can, with little army before. |
| Fast Imperial | Race through Castle Age to reach Imperial Age quickly. |
| Timing Attack | Build up to one strong attack at a planned moment, often right after an age-up. |
| Cheese | A surprise plan, such as forward towers or buildings, to catch the opponent off guard. |

Exports: `strategies` (ref, as today), `STRATEGY_TITLES`, `normaliseStrategy(value)`.

### `mapDefaultProvider.js`

| title |
|---|
| Land |
| Water |
| Hybrid |

Exports: `maps` (ref, as today), `MAP_TYPES`, `DEFAULT_MAP = "Land"`, `normaliseMap(value)`.

## Display rule

The map is shown on cards and the details page only when `map !== DEFAULT_MAP` (and, on lists, when
the existing rule from spec 020 FR-022 would show it). Strategy display is unchanged.
