# Design Input — `013-build-list-timings`

Resolved values for implementation. Everything here is either lifted from `jensbuehl/aoe4-guides@main` or from the interactive mock (`assets/Build List Proposal.html`). Where the mock and the app disagree on an asset path, **the app path wins** (noted inline).

---

## 1. Tokens (both themes — real Vuetify theme values)

| Role | Dark (`customDarkTheme`) | Light (`customLightTheme`) |
|---|---|---|
| page background | `#1D2432` | `#D8DCE0` |
| card surface | `#324156` | `#FAFAFA` |
| primary (title colour) | `#e7c05e` gold | `#294790` navy |
| accent / anchor | `#e7c05e` | `#CCAA55` |
| secondary | `#294790` | `#CCAA55` |
| chip / raised surface | `#3D516B` | `#E3E6EA` |

Use the Vuetify tokens (`rgb(var(--v-theme-surface))`, `text-medium-emphasis`, `color="accent"`), **not** the hexes — the hexes are here so you can verify the mock.

Derived from those, only for the new elements:

| New element | Dark | Light |
|---|---|---|
| rail divider | `rgba(255,255,255,.07)` | `rgba(0,0,0,.09)` |
| stated time | `#E6EAF1` (on-surface, 700) | `#26303F` |
| derived time | `#9BA7B8` (medium emphasis, 500) | `#5C6877` |
| `—` (age not reached) | `#5C6879` | `#8B93A0` |
| meta line text | `#8593A6` | `#6B7787` |
| separator `·` | same as meta at 40 % opacity | same |
| timeline track (empty) | `#2A3547` | `#E1E4E9` |
| track: Dark → Feudal | `#3D516B` | `#A9B2C2` |
| track: Feudal → Castle | `#6D7FA6` | `#6D7FA6` |
| track: Castle → Imperial | `#B99A4E` | `#294790` |
| track: Imperial → end | `#e7c05e` | `#CCAA55` |

**Type:** Inter (body font), base 15 px. Card title 16 px/700; meta lines 11.5–12 px/500; age times 12 px/700 with `font-variant-numeric: tabular-nums`; rail crests 17 px; timeline crests 22 px.

**Age crests (app paths):** `/assets/pictures/age/age_2.webp` (Feudal), `age_3.webp` (Castle), `age_4.webp` (Imperial). *(The mock loads `assets/res/age_*.webp` — same images, local copies.)*

---

## 2. Mock → Vuetify mapping

| Mock element | Vuetify | Notes |
|---|---|---|
| card shell | `v-card rounded="lg" flat :min-height="height"` | change `height` → `min-height` (FR-016) |
| flag zone | existing `v-col cols="3"` + `v-img` with the `to right, transparent, surface` gradient | unchanged |
| body zone | `v-col` (flex column, `justify-center`, `ga-2`) | three lines, see §6 |
| title | plain `div.text-subtitle-1.font-weight-bold` with `color: primary` | keep the existing per-breakpoint title split |
| people / stats lines | two `div.text-caption.text-medium-emphasis.d-flex.align-center.ga-2` | `·` as its own `<span>` at 40 % opacity |
| author / creator links | `router-link` (author → `{name:'Builds', query:{author}}`) with `text-decoration-none` | keep today's route target |
| `Draft` / `New` | `v-chip label size="small" color="error" / "accent"` | unchanged from today |
| age rail | third `v-col cols="auto"` with a fixed `width: 132px` + `border-left` | plain flex column, not a `v-list` |
| age row | 2-col CSS grid (crest `v-img` 17 px + time) | see §6 |
| xs age chips | `v-chip label size="x-small"` (stated) / `variant="outlined"` (derived) | replaces season + map chips |
| estimate hint | `v-tooltip` on the time span, text **"Estimated from villager count"** | one tooltip per derived time |
| details timeline card | `v-card flat rounded="lg"` + the existing `build-card-section-header` div pattern from `BuildDetails.vue` | header icon `mdi-timer-sand`, label **"Timeline"** |
| timeline track | plain flex div of proportional `span`s | no `v-progress-linear` (it can't do 4 segments) |

---

## 3. Contextual visibility — the rule

> **A field that is constant across the current list is not repeated on every row. The metric you sorted by is always shown.**

Implementation inputs: the applied `store.state.filterConfig` and a new `context` prop on the card (`'default' | 'civ-locked' | 'author-locked'`, mirroring `FilterConfig`).

"Constant" = the filter for that field has **exactly one** selected value (`seasons`, `maps`, `strategies` are arrays; `civs`, `creator`, `author` are scalars).

### Field matrix

| Field | Show when | Hide when |
|---|---|---|
| civ flag | always (identity anchor) | — *(NC-1: possibly on `civ-locked`)* |
| civ **name** (text) | never on the card (the flag carries it) | always |
| author | default lists, favorites, home lanes | `filterConfig.author` set, `context='author-locked'`, or `MyBuilds` |
| video creator | `build.creatorId` present | `filterConfig.creator` set |
| season | `seasons.length !== 1` | exactly one season selected |
| map | `build.map` present and `maps.length !== 1` | exactly one map selected |
| strategy | not shown today; out of scope | — |
| date | always | — |
| views | **always** | never (removes today's `orderBy` guard) |
| comments | `build.comments > 0` | — |
| favorites (`likes`) | `orderBy === 'likes'` | otherwise |
| `Draft` | `build.isDraft` | — |
| `New` | `isNew(timeCreated)` | — |
| age rail | timings derivable | `getTimings()` null / legacy flat build |

### Sort-key → metric mapping (FR-019)

| `orderBy` | Extra metric on the card |
|---|---|
| `scoreAllTime` (default) | — (views already shown) |
| `score` (Trending) | — (views already shown) |
| `views` | — (views already shown) |
| `likes` (Favorites) | favorites count (`mdi-heart`) |
| `timeCreated` | — (date already shown) |
| `sortTitle` | — |

Today's bugs this replaces:

1. `const filterByMap = computed(() => store.state.filterConfig.map)` — **`filterConfig` has no `map`**, only `maps: []`. The map chip therefore never renders. Fix: `filterConfig.maps?.length`.
2. `v-show="build.views && (orderBy == 'views' || orderBy == 'score' || orderBy == 'scoreAllTime')"` — the row's content changes when the reader re-sorts, and `likes`/`timeCreated`/`sortTitle` sorts show no metric at all.
3. The author chip renders even where every row has the same author (`MyBuilds`, `?author=`), where `AuthorPageHeader` already names them.

### Per-host summary

| Host | Context | Consequences |
|---|---|---|
| `Builds.vue` | `default`, or `author-locked` when `filterConfig.author` | full rules; hide author on author pages |
| `MyBuilds.vue` | `default` + own-list | hide author; drafts block keeps `Draft` chips and often shows `—` ages |
| `MyFavorites.vue` | `default` | authors differ → keep author |
| `Dashboard.vue` | `civ-locked` | no civ text; three lanes each with a fixed `orderBy` |
| `BuildLaneTabs.vue` (home) | `default` | lane sets `orderBy`; **no `steps` in the snapshot → no rail** (NC-2) |

---

## 4. Age-boundary derivation (the algorithm)

New file: `src/composables/builds/useAgeTimings.js`.

```
getAgeTimings(steps):
  1. if !steps?.length            -> []
  2. sections = steps[0]?.type ? steps : null      // legacy flat build
     if (!sections) return []                       // no age boundaries exist
  3. flat = []; boundaries = []                     // flatten EXACTLY like FocusMode.vue
     for section of sections:
       if (section.type === 'age' && section.age > 1
           && !boundaries.some(b => b.age === section.age))
         boundaries.push({ age: section.age, index: flat.length })
       flat.push(...(section.steps ?? []))          // never push section.gameplan
  4. timings = getTimings(flat)                     // reused unchanged
     if (!timings) return []                        // null contract: show nothing
  5. return boundaries
       .filter(b => timings[b.index]?.startTime != null)
       .map(b => ({
          age: b.age,                               // 2 | 3 | 4
          seconds: Math.round(timings[b.index].startTime),
          derived: !flat[b.index]?.time              // no own timestamp => interpolated
       }))
```

Notes:
- `age` values are the section's own numbering: `2` = Feudal, `3` = Castle, `4` = Imperial. Legacy/`age: 0` sections are skipped by step 3's `age > 1` test.
- The `ageUp` section carries the age being **left**, so it is never a boundary — only `type === 'age'` sections are.
- `derived` is deliberately "the source step had no parseable `time` of its own". `getTimings()` interpolates in place, so this is the only signal left after the fact; it is the same test `timingsHelper` used to decide to interpolate.
- Format with the existing `getFormattedTime(toDateFromSeconds(seconds))` from `timingsHelper.js` (already exported) so the list, Focus mode and the timeline agree to the second.
- Memoize per build id (`computed` over `props.build`) — FR-007.
- The rail renders three rows regardless: `[2,3,4].map(age => result.find(r => r.age === age) ?? null)`, `null` → `—`.

---

## 5. Details page — where the timeline goes

`BuildDetails.vue` renders, in order: `BuildHeader` → Description card (collapsible on mobile) → `BuildOrderEditor` → Video card → `Discussion`.

**Recommended placement: its own flat card between the Description card and `BuildOrderEditor`.**

Why there:
- The timeline is a **summary of the steps**, so it belongs to the build-order block, immediately before it — the reader gets the shape, then the detail. Placed after the build order it would be a footnote nobody scrolls back to.
- The header is already dense (civ lockup, title, up to five chips, the author/upvotes/views/remix line). Adding a 90 px graphic there pushes the build order below the fold on laptops and competes with the civ lockup for first attention.
- It reuses the existing `build-card-section-header` pattern, so it reads as one of the page's stacked sections rather than a new kind of element — and it needs **no** change to `BuildHeader.vue` or `BuildOrderEditor.vue` (both are `010`–`012` territory).
- The description is optional; when a build has none, the timeline sits directly under the header, which still reads correctly.

Rejected alternatives: inside the Build Order card header (needs a `BuildOrderEditor` slot → touches `012`); in `BuildHeader` (density, above); as a sticky rail (no room at `md`).

Structure (view route only, `v-if="ages.length"`):

```
[ ⏳ TIMELINE ────────────────────────────── ]
  ▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   ← 0:00–16:00 fixed scale, 12 px, radius 6
       ⛊            ⛊              ⛊
      4:20         8:55          ~14:10
     FEUDAL       CASTLE        IMPERIAL
     21 vils      34 vils        48 vils
  0:00    4:00    8:00    12:00    16:00
```

- Fixed 16:00 scale (not per-build): two builds compared in two tabs have comparable bars.
- Markers are absolutely positioned at `seconds / 960 * 100%`, `translateX(-50%)`, clamped to `[0,100]`.
- Villager count comes from `aggregateVillagers(flat[index])` — already imported in the app.
- xs: replace the track with the same three age chips the list card uses, inside the same card.

---

## 6. The only custom CSS

Everything else is Vuetify utilities. Scope these to the components.

```css
/* --- age rail (BuildListCard, md+) --- */
.blc-ages{width:132px;flex-shrink:0;border-left:1px solid rgba(255,255,255,.07);
  padding:14px 16px;display:flex;flex-direction:column;justify-content:center;gap:5px}
.v-theme--customLightTheme .blc-ages{border-left-color:rgba(0,0,0,.09)}

.blc-agerow{display:grid;grid-template-columns:17px 1fr;align-items:center;gap:8px;
  min-height:18px;font-size:12px;line-height:1;font-variant-numeric:tabular-nums}
.blc-agerow b{text-align:right;font-weight:700}
.blc-agerow--derived b{font-weight:500}      /* colour via text-medium-emphasis */

/* --- three-line body (BuildListCard) --- */
.blc-body{padding:14px 18px;display:flex;flex-direction:column;
  justify-content:center;gap:7px;min-width:0}
.blc-title{font-size:16px;font-weight:700;line-height:1.25;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.blc-meta{display:flex;align-items:center;gap:10px;font-size:11.5px;
  white-space:nowrap;overflow:hidden}      /* never wraps → card height is stable */
.blc-meta--who{font-size:12px}
.blc-meta .sep{opacity:.4}

/* xs only */
.blc-title--xs{white-space:normal;display:-webkit-box;-webkit-line-clamp:2;
  -webkit-box-orient:vertical;overflow:hidden;font-size:13.5px}

/* --- details timeline (AgeTimeline) --- */
.age-track{position:relative;height:12px;border-radius:6px;display:flex;overflow:hidden}
.age-track span{height:100%}
.age-ticks{position:relative;height:80px;margin-top:8px}   /* must clear crest+3 lines */
.age-tick{position:absolute;top:0;width:96px;transform:translateX(-50%);text-align:center}
```

Card `min-height` per breakpoint (was `height`): `xs 96 · sm 125 · md 112 · lg 112 · xl/xxl 125`. **md must grow from 90 → 112** or the three-row rail clips.

---

## 7. Copy (verbatim)

- Tooltip on a derived time: **Estimated from villager count**
- Details section header: **Timeline**
- Age names on the timeline: **Feudal · Castle · Imperial** (uppercase, letter-spaced caption)
- Villager count suffix: **21 vils**
- Age not reached: an em dash **—** (never `??:??`, never `0:00`, never "unknown")
