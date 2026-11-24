# Contract: `RelatedBuilds.vue`

## Props

| Prop | Type | Required | Notes |
|---|---|---|---|
| `build` | Object | yes | The build being read. The component reads only `civ`, `authorUid` and `author`, once, at setup. |
| `buildId` | String | yes | The id from the route. Not `build.id`: a build served from the in-app cache need not carry its own id (BuildDetails says so where it records a view). |

No events, no slots, no store writes beyond what `getCivBuilds` and `getBuilds` already do (`setBuilds` into `cache.builds`).

## Behaviour

| # | Given | Then |
|---|---|---|
| C1 | The container is more than 600px below the viewport | No query has run |
| C2 | It comes within 600px | Both queries start at once, and each eligible rail (C7–C8) shows its header, 3 skeleton cards **and its View all**. The exit's route depends only on the build being read. Adding it on arrival grew the rail by 42px and pushed everything below down, which the first ux-gate run measured. |
| C3 | Civ query result | Up to 3 builds, current excluded, `score` descending, `isDraft == false` |
| C4 | Author query result | Up to 3 builds, current and civ-rail ids excluded, `score` descending |
| C5 | A rail with 0 builds after filtering, or whose query failed | The rail is removed. No message |
| C6 | Firestore refuses the civ query (App Check) | `getCivBuilds` tries the public API. `ANY` has no fallback, so C5 applies |
| C7 | `build.civ` is missing or unknown | No civ rail |
| C8 | `build.author` is empty | No author rail |
| C9 | Civ title | `More ‹title› builds`. For `ANY`: `More builds for any civilization` |
| C10 | Author title | `More by ‹author›`, truncated with an ellipsis, never wrapped |
| C11 | Civ "View all" | `civPageRoute(civ)`: `/civ/<slug>`, or for `ANY` the dashboard filtered to it |
| C12 | Author "View all" | `/builds?author=<authorUid>&orderBy=score` |
| C13 | A card is clicked | Router navigates to `BuildDetails`. The page remounts (keyed `router-view`) and the build is served from `cache.builds` with no read |
| C14 | The current build changes while mounted | Cannot happen: the view remounts per path |

## Rendering

- Rails stacked, civ first. Each rail is `<SectionHeader :icon :label>`, then cards wrapped in `router-link` exactly as in `BuildLaneTabs`, then `<ViewAllButton :to :label>`. Both shared components are extracted from the existing pages (plan), and neither is copied.

## Shared components (extracted in the refactor step)

| Component | Props | Slot | Guarantees |
|---|---|---|---|
| `SectionHeader` | `icon: String`, `label: String` | default, after the label (trailing controls) | 36px tall, icon 16px `accent`, caption uppercase bold with `0.05em` letter-spacing, label truncates on one line |
| `ViewAllButton` | `to: [String, Object]`, `label: String = "View all"` | — | identical to `BuildLaneTabs`' former exit, full width below md, label truncates on one line |
- Cards: `BuildListCard`, with `context="default"` for the civ rail and `context="author-locked"` for the author rail.
- No surrounding `v-card`.
