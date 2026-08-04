# Tasks — `020-age-up-timeline-strip`

> **Inherited from the `013-build-list-timings` design handoff and reconciled with the clarified spec.**
> This predates `/speckit-plan` — treat it as a starting point, not plan output. Run `/speckit-plan` then `/speckit-tasks` to regenerate properly.

Work in order. **T-02 is the spine** — the card layout is meaningless until the timings are right. Conventional Commits (`feat:`, `fix:`, `refactor:`, `style:`), one concern per commit.

## Phase 0 — Derivation (do this first)

- [ ] **T-01** Create fixtures for manual/unit checking: four real builds copied out of Firestore into a scratch file — (a) sections reaching Imperial with several stated timestamps, (b) sections reaching Feudal only, (c) sections with **no** parseable timestamps, (d) a **legacy flat** build (`steps[0].type` undefined). Reference: `BuildOrderEditor.initializeSections`.
- [ ] **T-02** Add `src/composables/builds/useAgeTimings.js` implementing `design-input.md` §4: flatten sections like `FocusMode.vue` (concat `section.steps`, never push `section.gameplan`), collect boundaries from `type === 'age' && age > 1`, call the **unmodified** `getTimings()`, honour its `null` contract. **Correction to §4**: flag `derived` by testing whether the source step yields a *parseable* timestamp (`toDateFromString(step.time) !== null`), **not** `!step.time` — a present-but-unparseable `time` was interpolated and must be reported as an estimate. Export `getAgeTimings(steps)` plus a memoized `useAgeTimings(buildRef)` wrapper. *(FR-001..007)*
- [ ] **T-03** Verify against the four fixtures: (a) three ages with the right times, (b) one age, (c) `[]`, (d) `[]`; no throw for `steps: []`, `steps: null`, a section with `steps: []`, and a step with `time: "<br>"` — which must come back `derived: true`, not stated. Cross-check one build's Feudal time against Focus mode for the same step; they must match to the second. *(SC-002, SC-011)*

## Phase 1 — Desktop card (md+)

- [ ] **T-04** In `BuildListCard.vue` switch from `:height` to `:min-height` and set the breakpoint map to `xs 96 · sm 125 · md 112 · lg 112 · xl/xxl 125` (md and xs grow from 90 — accepted, see Clarifications). *(FR-016)*
- [ ] **T-05** Restructure the md+ body: title (single line, ellipsis), a **people** line (author link · creator link), a **stats** line (date · views · comments · season · map). Both meta lines `text-caption text-medium-emphasis`, `nowrap` + `overflow:hidden`, `·` separators as their own spans at 40 % opacity. A meta line with no content **collapses** rather than rendering blank. Remove the md+ chip group except `Draft` and `New`. *(FR-014, FR-015, FR-015a, FR-017)*
- [ ] **T-06** Add the age rail as a third `v-col cols="auto"` (`.blc-ages`, 132 px, left divider) rendering three `.blc-agerow`s — crest `v-img` (17 px, `/assets/pictures/age/age_{2,3,4}.webp`) + right-aligned tabular time; `—` at low emphasis for an age not reached; rail omitted entirely when `ages.length === 0`. Each row carries an accessible label naming the age, its time and whether it is estimated. *(FR-009..012, FR-011a, NFR-005)*
- [ ] **T-07** Derived times: `~` prefix, weight 500, `text-medium-emphasis`, wrapped in a `v-tooltip` reading "Estimated from villager count". No underline, no dotted rule. *(FR-013)*
- [ ] **T-08** Measure: at 1280 px with 10 cards, all age times share one right edge and every card in the list has an identical title offset. Long author/creator/season names ellipsize and do not change card height. *(SC-001)*

## Phase 2 — Contextual visibility

- [ ] **T-09** Add a `context` prop to `BuildListCard` (`'default' | 'civ-locked' | 'author-locked'`, default `'default'`). **Note**: `author-locked` is *new* — `FilterConfig` recognises only `default` and `civ-locked` today. **`Dashboard.vue` is not a direct host** — it renders `BuildLaneTabs`, so context must be forwarded through that component, which also serves the home page. Pass from `Builds.vue` (`author-locked` when `filterConfig.author`), `MyBuilds.vue`, `MyFavorites.vue`, and `BuildLaneTabs.vue` (`civ-locked` from Dashboard, `default` from Home). *(FR-023)*
- [ ] **T-10** Implement the single-value rule from `design-input.md` §3 as computed flags (`showSeason`, `showMap`, `showAuthor`, `showCreator`) reading the **applied** `filterConfig` + `context` + host list. *(FR-018, FR-020, FR-021)*
- [ ] **T-11** `fix:` the dead map guard — replace `filterConfig.map` (which does not exist) with `filterConfig.maps?.length` semantics; the map now renders in unfiltered lists. *(FR-022, SC-005)*
- [ ] **T-12** `fix:` sort-dependent metadata — views always render; add the favorites count when `orderBy === 'likes'`; drop the `orderBy` `v-show` chain. *(FR-019, SC-003)*
- [ ] **T-13** Check all hosts by hand: one season selected → no season anywhere; two → season everywhere; `?author=` → no author but `AuthorPageHeader` present; `MyBuilds` → no author, people line collapsed, drafts still flagged; Dashboard → flag kept, no civ text. *(SC-004)*

## Phase 3 — xs / sm

- [ ] **T-14** In the xs/sm branch: age chips (`v-chip label size="x-small"`, outlined + `~` for derived, each with an accessible label) **replace** the season and map chips; keep author and date; allow the title to clamp to two lines (`.blc-title--xs`). Confirm the card stays within 96 px (xs) / 125 px (sm). *(FR-024, FR-011, FR-011a, FR-013, SC-006)*

## Phase 4 — Details page timeline

- [ ] **T-15** Add `src/components/builds/AgeTimeline.vue` (read-only, props `steps`): fixed 0–16:00 track of proportional segments, absolutely-positioned markers at `seconds/960*100%` (clamped) with crest + time (`~` if derived) + **age name in text** + `aggregateVillagers` count, and a 0/4/8/12/16 axis. `.age-ticks` height 80 px so the axis clears the labels. Renders nothing when `getAgeTimings()` is empty. *(FR-025, FR-027, FR-011b)*
- [ ] **T-16** Mount it in `BuildDetails.vue` **between the Description card and `BuildOrderEditor`**, in its own `v-card flat rounded="lg" class="mt-4"` with the existing `build-card-section-header` (`mdi-timer-sand`, label "Timeline"). View route only. At xs render the three age chips instead of the track. Do **not** touch `BuildHeader.vue` or the existing build-order age plates. *(FR-026, FR-028)*
- [ ] **T-17** Verify the strip's times are identical to the same build's list-card rail, and that a build with no timings renders no card at all (not an empty one). *(SC-007)*

## Phase 5 — Persisted timings & home lanes

- [ ] **T-18** Compute `ageTimings` with the Phase 0 composable on the **client save path** (`buildService` write) and store it on the build document as a **map**, unreached ages omitted:
      `ageTimings: { feudal: { t: 220, e: false }, castle: { t: 535, e: true } }`.
      Never write `0` or `null` for an age that is not reached — a missing key is what keeps those builds out of a future `orderBy('ageTimings.castle.t')`. Rewrite the whole field on every save so ages that disappear are removed. *(FR-029..033)*
- [ ] **T-19** Add `ageTimings` to the `pickBuildFields` whitelist in `functions/builds/updateHomeSnapshot.js` — the field is copied through; no derivation logic enters `functions/`. *(FR-029, FR-030)*
- [ ] **T-20** Make the card prefer stored `build.ageTimings` and fall back to deriving from `build.steps`, so one component serves summary-fed home lanes, full-document Dashboard lanes and the builds list. *(FR-032)*
- [ ] **T-21** One-off backfill of existing builds with `ageTimings`, in batches of at most 500 writes. Verify home lanes show timings after the next scheduled snapshot run. *(FR-036, SC-008, SC-010)*

## Phase 6 — Regression & polish

- [ ] **T-22** Self-review + regression: `timingsHelper.js` untouched; skeleton cards (`build.loading`) never derive; both themes at xs/sm/md/lg/xl; no console errors on all four fixtures; total derivation for a 10-card page under 10 ms; home page reads no more build records than before. *(SC-009, SC-012, NFR-001..005)*
