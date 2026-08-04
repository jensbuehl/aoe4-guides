# Quickstart — `020-age-up-timeline-strip`

How to build and verify this feature. No test framework is added (constitution: manual golden-path testing, no formal suite), so verification is a scratch harness for the derivation plus a manual pass.

---

## Build order

The derivation is the spine — everything else renders it. Do not start on layout until `getAgeTimings` is right against all four fixtures.

```
Phase 0  useAgeTimings.js + fixtures        ← nothing works until this is correct
Phase 1  desktop card (rail, three zones)
Phase 2  contextual visibility + 2 bug fixes
Phase 3  xs / sm chips
Phase 4  AgeTimeline on the details page
Phase 5  persist on save · snapshot field · backfill
Phase 6  regression
```

Phases 1–4 are independently shippable. Phase 5 can trail — the home lanes simply show no timings until it lands.

---

## Fixtures

Copy four real builds out of Firestore into a scratch file. These four cover every branch:

| # | Build | Expected `getAgeTimings()` |
|---|---|---|
| a | Sections reaching Imperial, several stated timestamps | 3 entries, mixed `derived` |
| b | Sections reaching Feudal only | 1 entry |
| c | Sections with no parseable timestamps | `[]` |
| d | Legacy flat build (`steps[0].type` undefined) | `[]` |

Plus these malformed inputs, all of which must return `[]` without throwing:
`null` · `[]` · a section with `steps: []` · a step with `time: "<br>"`.

**The `"<br>"` case is the important one** — it must come back `derived: true`. If it reports `derived: false`, the parse test is wrong (research R9) and the UI will present an interpolated guess as an author-stated fact.

### Cross-check

Open fixture (a) in Focus mode and compare its Feudal time to what `getAgeTimings` returns. They must match **to the second** — both come from the same `getTimings()` call, so a mismatch means the flattening drifted out of index alignment.

---

## Manual verification pass

### Derivation & rail
- [ ] Fixture (a) shows three crest rows with times; (b) shows one time and two `—`; (c) and (d) show no rail at all — not an empty one.
- [ ] An interpolated time shows `~`, lighter weight, and the tooltip "Estimated from villager count".
- [ ] No `??:??`, no `0:00`, no "unknown" anywhere.

### Layout
- [ ] At 1280 px with 10 cards, all age times sit on one right edge and every title starts at the same offset.
- [ ] A build with a very long author or creator name ellipsizes; the card does not change height.
- [ ] `md` cards are 112 px, `xs` 96 px.

### Contextual visibility
- [ ] Select one season → no card mentions a season. Select two → every card does.
- [ ] Sort by each of the six keys → views never disappear; `likes` adds the favorites count.
- [ ] Unfiltered list → the map is visible. *(This proves the dead-guard fix; it never renders today.)*
- [ ] `/builds?author=…` → no author on cards, `AuthorPageHeader` still names them.
- [ ] `MyBuilds` → no author, people line collapsed to two body lines, drafts still flagged.
- [ ] Dashboard → civ flag still present, no civ name in text.

### Mobile
- [ ] xs shows age chips and **no** season/map chips.
- [ ] Long title clamps to two lines without the card growing.
- [ ] Derived chips are outlined; stated chips are filled.

### Details page
- [ ] Timeline sits between the Description card and the Build Order card.
- [ ] Its times match the same build's list-card rail exactly.
- [ ] A build with no timings renders no timeline card at all.
- [ ] Edit/create route shows no timeline.
- [ ] A build reaching Imperial after 16:00 clamps its marker to the track and still prints the true time.

### Accessibility & theming
- [ ] A screen reader announces each rail row as age + time + estimated-or-not, not as a bare number.
- [ ] Both themes at xs / sm / md / lg / xl — rail divider, derived colour and `—` colour all come from tokens.

### Persistence (Phase 5)
- [ ] Save a build → its document gains `ageTimings` with only the ages it reaches.
- [ ] Edit it to remove an age-up → that key disappears from the document.
- [ ] Save a build with no usable timings → `ageTimings` is `{}`, and the card shows no rail.
- [ ] After the next hourly snapshot run, home lanes show timings.
- [ ] Home page reads no more build documents than before.

---

## Running the backfill

One-off, from a workstation with a service account. Bundled first because `timingsHelper.js` imports through the `@/` alias, which plain Node cannot resolve and which FR-006 forbids changing.

Keep the bundle command on **one line** — PowerShell treats a trailing `\` as an argument rather than a line continuation, and esbuild then reports "Must use outdir when there are multiple input files":

```powershell
npx esbuild scripts/backfill-age-timings.mjs --bundle --platform=node --external:firebase-admin --alias:@=./src --outfile=scripts/.build/backfill.cjs

$env:GOOGLE_APPLICATION_CREDENTIALS = "C:\path\to\dev-sa.json"
node scripts/.build/backfill.cjs            # dry run — the default
node scripts/.build/backfill.cjs --apply    # writes
```

**Which project it hits is decided entirely by the credentials.** `.firebaserc`'s `dev`/`prod` aliases mean nothing to the Admin SDK. The script prints the resolved project id before doing anything, and refuses to write if it cannot identify one. Rehearse against `aoe4-guides-dev` before pointing it at `aoe4-guides`.

Follows the `scripts/set-admin-claims.js` pattern. Writes in batches of at most 500. ~4k builds ≈ 8 batches, comfortably inside the free-tier daily write allowance.

**Dry run is the default**, and it logs the first 20 documents. Check that unreached ages have their key *omitted* rather than stored as `0` before committing — that is far cheaper to catch now than after 4k documents carry it.

---

## Things that will bite

- **Flattening drift** — if the flatten does anything other than concatenating `section.steps` (in particular, if it pushes `section.gameplan` as an entry), indices no longer line up with the `getTimings()` result and every time is silently wrong. It does not error; it just lies.
- **`BuildLaneTabs` serves two data shapes** — Dashboard feeds it full documents (steps present), Home feeds it summary entries (no steps, stored field only). Test both.
- **`build.loading` skeletons** must never reach the derivation.
- **`timingsHelper.js` stays untouched.** If something in it seems to need changing, that is a signal the composable is compensating in the wrong place.
