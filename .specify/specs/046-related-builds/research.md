# Research: Somewhere to Go From a Build Page (046)

All findings are from the code as of 2026-11-24 (`main` at `f3f6e07`).

## R1 — What `?author=` filters by

**Decision**: The "View all by ‹author›" link is `/builds?author=<authorUid>`.

**Rationale**: `Builds.vue` commits `route.query.author` to `filterConfig.author`, and `getFilterQueryParams` turns that into `where("authorUid", "in", [author])`. So the filter takes a **uid**, not a display name. `authorUid` is already public: it is in every build document, and the rules allow anyone to read builds. A uid in the URL therefore reveals nothing new.

**Alternatives considered**: A name-based link. Rejected: display names are not unique and can change. There is no author page (out of scope).

## R2 — Indexes

**Decision**: No new composite index.

**Rationale**:
- The civ rail runs the same query civ pages already run: `isDraft == false`, `civ in [X]`, `orderBy score desc`.
- The author rail is the shape `/builds?author=…&orderBy=score` already produces: `isDraft == false`, `authorUid in [X]`, `orderBy score desc`.

`firestore.indexes.json` has `isDraft+score`, `civ+score` and `authorUid+score` (both directions). Firestore answers equality filters plus one order by merging those indexes. `in` with a single value is an equality.

**Verification**: quickstart §2. A missing index shows in the console as `FAILED_PRECONDITION` with a create link, and the rail would silently hide (FR-010). That is why the check is explicit and not left to be noticed.

## R3 — Drafts and unlisted builds

**Decision**: Rely on the existing filter. `getFilterQueryParams` adds `isDraft == false` unless `drafts` is set.

**Rationale**: Spec 039 renamed drafts to "unlisted" with no data migration. Both are `isDraft == true` (the card shows "Unlisted" for `build.isDraft`), so one filter excludes both (FR-012).

## R4 — Excluding the current build, and the overlap between rails

**Decision**:
- Civ rail: fetch `N + 1` (N = 3) and drop the current build.
- Author rail: fetch `2N + 1` (7). Drop the current build and any id the civ rail shows, then take N.

**Rationale**: Firestore cannot combine `id != X` with `orderBy score` without ordering by `id` first. A `civ != current` filter on the author rail would hit the same restriction, and would wrongly drop same-civ author builds the civ rail did not show. Over-fetching is simple, and the cost has a fixed ceiling: at most 4 + 7 = **11 document reads**, once, for a reader who reaches the end of the page. Most authors have few builds, so the author query usually returns fewer. The author rail waits for the civ rail's result before deduplicating, but both queries run in parallel.

**Alternatives considered**: One query per rail with `limit(N)` and accepting a short rail. Rejected: a rail of two when the author has ten builds looks broken.

## R5 — Lazy loading

**Decision**: `useElementVisibility(railsEl, { rootMargin: "600px", once: true })` from `@vueuse/core` 13. The page already uses `useElementVisibility` for `timelineEl`. The two queries fire the first time the rails' container comes within 600px of the viewport.

**Rationale**: SC-002 requires zero extra reads for a reader who stays near the top (someone following the build in-game). `once` stops observing after the first trigger. The 600px margin starts the fetch about a screen ahead, so a normal scroll reaches loaded cards.

## R6 — Which service call

**Decision**:
- Civ rail: `getCivBuilds(config, 4)`. It falls back to the public API when Firestore refuses (FR-011), and `apiCanServe` accepts `orderBy: "score"` with a limit ≤ 10.
- Author rail: `getBuilds(config, 7)`. No fallback, and the `/api` proxy stays narrow.

**Rationale**: Both commit their results to `store.state.cache.builds` (`setBuilds`). `BuildDetails` reads `cache.builds[id]` before fetching, so **opening a rail card costs no read**. The list query already loaded the whole document.

**Note**: When the API fallback answers, it returns the civ's own list (`/builds?civ=&orderBy=`). Its length is the API's page size, so the rail slices it client-side. "Any civilization" (`ANY`) is excluded by `apiCanServe`. That rail simply hides when Firestore refuses.

## R7 — Navigating to a rail card

**Finding**: Nothing extra is needed. `App.vue` keys `<router-view>` by `$route.path`, so `/builds/a → /builds/b` remounts `BuildDetails` with fresh rails. `scrollBehavior` returns `{ top: 0 }` for a new entry and the saved position on Back. The spec's edge case about the "back to list" logic does not apply: `listRoutes` is consulted only after a delete, and it never lists `/builds/:id`.

## R8 — Card context

**Decision**: Civ rail uses `context="default"`. Author rail uses `context="author-locked"`, which drops the author name that the rail header already states.

**Rationale**: `civ-locked` exists in the prop's validator but changes nothing in the card today, and the flag is the card's anchor. Keeping it on the civ rail is consistent with civ pages.

## R9 — Civ name and the "any civ" title

**Decision**: Take the display name and slug from `civDefaultProvider` (`civs` → `title`, `slug`).
- Title: `More ${title} builds`.
- For `ANY`: "More builds for any civilization". The `ANY` entry has no `slug`, so there is no civ page. "View all" uses the existing `civPageRoute(code)` in `civDefaultProvider`, which every other link to a civ uses: `/civ/<slug>` when there is one, otherwise the dashboard filtered to the civ. (The plan first hand-built `/builds?civ=ANY`; the helper was found during implementation.)
- Every other civ: "View all" goes to `/civ/<slug>`.
