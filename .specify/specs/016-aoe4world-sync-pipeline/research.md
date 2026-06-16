# Research: AOE4World Sync Pipeline Improvement

## Decision Log

### State management for sync session

**Decision**: Local `ref` objects inside `setup()` — no Vuex changes.

**Rationale**: The sync state (fetch status, category results, current phase) is ephemeral admin-tool state with no cross-component or cross-session relevance. Vuex is for app-wide persistent state; adding sync state there would violate Simplicity First.

**Alternatives considered**: Vuex store slice — rejected (unnecessary coupling, adds boilerplate for a one-screen tool).

---

### syncData refactor: mutation → pure match pass

**Decision**: Replace the current void/mutate `syncData()` with a function that returns `{ matched, unmatched }` arrays without touching the source JSON. Enrichment is applied only at download time from the match results.

**Rationale**: Mutating the imported module-level JSON arrays is a side effect that makes it impossible to re-run the sync without a page reload. Returning results cleanly enables the preview phase and lets the admin change their mind before committing to a download.

**Alternatives considered**: Clone the array before mutating — rejected (still conflates matching and applying, harder to add resolution step on top).

---

### Mismatch resolution UI

**Decision**: Vuetify `v-autocomplete` component, `:items` bound to the fetched source array for that category, filtered client-side by name substring (case-insensitive, min 2 chars).

**Rationale**: `v-autocomplete` is already available in the project's Vuetify 3 install and handles the search/filter/select pattern out of the box with no additional dependency. Keeps the UI consistent with the rest of the project (Constitution III).

**Alternatives considered**: Custom `<input>` with `<datalist>` — rejected (inconsistent with Vuetify design system). External fuzzy-search library — rejected (no library needed for simple substring matching, Constitution I).

---

### Per-source fetch status tracking

**Decision**: A reactive object `{ units, buildings, technologies, abilities }` where each value is `'idle' | 'loading' | 'success' | 'error'`, updated as each `fetch()` settles. Displayed as status chips next to each source name.

**Rationale**: Gives the admin real-time visibility during the fetch phase without blocking the UI. Maps directly to FR-010.

**Alternatives considered**: Single global spinner — rejected (user can't tell which source is slow or failed). `v-progress-linear` indeterminate — rejected (doesn't communicate per-source success/failure).

---

### Partial fetch failure isolation

**Decision**: Each of the 4 fetches is wrapped in its own `try/catch`. A failed fetch sets that source's status to `'error'` and leaves its data as `null`. Categories backed by that source are flagged as errored and excluded from the download button; categories backed by successful sources are unaffected.

**Rationale**: Maps directly to FR-003 and the clarified behaviour from the spec (Q1 answer: continue with successful sources).

**Special cases**:
- `landmarks` uses `buildings.concat(technologies)` — blocked if either `buildings` or `technologies` fails.
- `abilityHero` uses `abilities.concat(technologies)` — blocked if either `abilities` or `technologies` fails.

---

### Phase / UI state machine

**Decision**: A single `syncPhase` ref with values `'idle' | 'fetching' | 'preview' | 'downloading'` controls which UI sections are rendered via `v-if`.

**Rationale**: Clean, readable conditional rendering. No hidden state.

---

### Category configuration

**Decision**: A static `CATEGORY_CONFIG` array defined inside `setup()` maps each of the 12 categories to its filename, source key(s), and imported local JSON array. This replaces the current ad-hoc sequential calls.

**Rationale**: Eliminates the 24-line repetitive block of `syncData(…); downloadObjectAsJSONFile(…)` calls. Makes adding or removing categories a single-line change.
