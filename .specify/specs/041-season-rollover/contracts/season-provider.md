# Contract: `seasonDefaultProvider.js` exports

The module's public surface after this feature. Callers outside the provider rely on nothing else.

| Export | Signature | Contract | Change |
|---|---|---|---|
| `seasons` | `Ref<Season[]>` | Every season that has started by page load, newest first, each with a resolved `endDate`. Calculated seasons are included. | Contents now calculated past the hand-written list, and filtered by start date |
| `buildSeasons` | `(now?: Date, hand?: Entry[]) => Season[]` | The same list for any given day. `hand` defaults to the module's hand-written list; the check passes made-up lists. Pure: it never mutates `hand`. | **New**. Used by `seasons` and by `check:seasons` |
| `currentSeason` | `(list?: Season[], now?: Date) => Season` | The season containing `now`. If there is none, the newest in `list`. If `list` is empty (a clock set before Season 1), Season 1. **Never `undefined`**: the editor reads `.title` from it in `setup()`, where a throw blanks the page. | **New**. Replaces `seasons.value[0]` as the default |
| `getSeasonByTitle` | `(title: string) => Season \| null` | Looks the title up among *started* seasons. Returns `null` for unknown or not-yet-started titles. | Unchanged signature |
| `seasonDateRange` | `(season) => string` | `"Dec 1, 2026 – Feb 28, 2027"`, or `"Sep 1 – Nov 30, 2026"` when both dates fall in one year. Never `"Since …"`. | `Since` branch removed |
| `isSeasonCurrent` | `(season, now?: Date) => boolean` | `startDate <= now < day after endDate`, counting calendar days. | Calendar arithmetic replaces `+ 86400000` |
| `seasonEndDate` | — | — | **Removed**. It had no callers outside the module; `season.endDate` is now always set |

## Call sites that change

| File | Before | After |
|---|---|---|
| `src/views/builds/BuildEditor.vue:473` | `seasons.value[0].title` | `currentSeason().title` |
| `src/composables/converter/useImportOverlayFormat.js:22` | `build.season \|\| seasons.value[0].title` | `build.season \|\| currentSeason().title` |

The `:items="seasons"` lists in `BuildEditor.vue` and `FilterConfig.vue`, and both season components, keep
working as they are: their input has the same shape, with more entries over time.
