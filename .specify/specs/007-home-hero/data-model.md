# Data Model: Home Featured Hero Build (007)

## No new entities

This feature is presentation-only. It reads from existing Firestore data (home snapshot) already loaded into the Vuex store. No new collections, documents, fields, or store slices are introduced.

## Existing build object shape (snapshot)

The hero reads from the top item of the active lane (already in store). All fields are pre-existing:

```js
{
  id: String,           // Firestore doc id
  title: String,        // build title
  description: String | null,  // ≤300 chars after this feature's snapshot change
  author: String,       // display name
  authorUid: String,
  civ: String | null,   // shortName key (e.g. "OTT") — resolved to flagLarge + civTitle client-side
  strategy: String | null,
  score: Number,
  scoreAllTime: Number,
  views: Number,
  timeCreated: Timestamp | null,
  // ... other fields not used by hero
}
```

## Snapshot function change

**File**: `functions/builds/updateHomeSnapshot.js`
**Change**: Add 300-char truncation to `description` in `pickBuildFields`:

```js
// Before
description: data.description ?? null,

// After
description: data.description ? data.description.slice(0, 300) : null,
```

This is the only backend change. No schema migration, no new fields, no Firestore rule changes.

## Client-side civ resolution

Builds store a `civ` shortName. The hero resolves it to a display name and flag URL from the static `civDefaultProvider`:

```js
// In BuildLaneTabs.vue (or HeroBuild.vue if passed as props)
import { civs } from "@/composables/filter/civDefaultProvider";
const heroCiv = computed(() =>
  civs.value.find(c => c.shortName === heroBuild.value?.civ)
);
// heroCiv.value?.flagLarge  → flag image URL
// heroCiv.value?.title      → civ display name for eyebrow
```

No new service calls, no new Firestore reads.
