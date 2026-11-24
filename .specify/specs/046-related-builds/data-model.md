# Data Model: Somewhere to Go From a Build Page (046)

No stored data changes. This feature reads existing `builds` documents and writes nothing.

## Fields read (from `builds/{id}`)

| Field | Used for |
|---|---|
| `id` | excluding the current build, deduplicating across rails, card link |
| `civ` | civ rail filter, civ name and slug for the title and "View all" link |
| `authorUid` | author rail filter, "View all" link (`/builds?author=<uid>`) |
| `author` | author rail title. If it is empty, the author rail does not render |
| `isDraft` | `== false` filter, which excludes drafts and unlisted builds (039) |
| `score` | ordering (040's popularity score, the Popular list's order) |
| everything else `BuildListCard` reads | the card itself, unchanged |

## Derived, in memory only

**Rail** `{ key: "civ" | "author", title, icon, viewAllRoute, builds[], state }`

- `state`: `idle` → `loading` → `ready` | `hidden`.
  - `idle`: not near the viewport yet. Renders nothing, fetches nothing.
  - `loading`: the header, 3 skeleton cards, and View all (C2).
  - `ready`: the header, 1–3 cards and "View all".
  - `hidden`: the query returned nothing usable, or failed. Renders nothing.
- Selection:
  - `civBuilds = civResult.filter(b => b.id !== current.id).slice(0, 3)`
  - `authorBuilds = authorResult.filter(b => b.id !== current.id && !civIds.has(b.id)).slice(0, 3)`

  If the civ query **failed** (as opposed to returning empty), `civIds` is empty and the author rail deduplicates only against the current build.

## Validation rules

- The civ rail requires `build.civ` to be set and present in `civDefaultProvider`.
- The author rail requires both `build.authorUid` and a non-empty `build.author` (edge case: deleted account).
- N = 3 is one named constant in the component (FR-003).
