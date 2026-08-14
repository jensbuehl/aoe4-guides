---

description: "Task list for community funding transparency"
---

# Tasks: Community Funding Transparency

**Input**: Design documents from `.specify/specs/036-community-funding-transparency/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/](contracts/), [quickstart.md](quickstart.md)

**Tests**: No test tasks. The constitution requires no formal suite; verification is
`npm run check:setup`, `npm run build`, and manual browser checks, which appear as explicit
tasks because `npm run build` cannot catch a `ReferenceError` in `setup()`.

**Organization**: Grouped by user story. Phase order follows the plan's implementation
order, so the story IDs are not sequential — US3 (the wall) ships before US2 (the
maintainer routine) because the routine is mostly satisfied by the design of the others.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US5)

## Path Conventions

Single frontend project. All paths are from the repository root: `src/config/`,
`src/composables/`, `src/components/`, `src/views/`.

---

## Phase 1: Setup

**Purpose**: Confirm the two external facts the implementation depends on. No scaffolding
and no new dependency — see plan Technical Context.

- [X] T001 [P] Confirm `mdi-heart` and `mdi-account-star` are both present in `src/plugins/mdiIcons.js` and choose which the badge uses; if any other glyph is chosen instead it MUST be added there, because an icon missing from that allowlist renders as nothing behind a green build
- [ ] T002 [P] Confirm the Ko-fi monthly (€2) and annual (€20) membership products exist and capture their URLs for `src/config/supporters.js`; add the "include your site username if you'd like a badge" prompt to the Ko-fi page description, which is the entire badge opt-in mechanism (FR-019a)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The config module and the composable. Every user story reads from these.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T003 Create `src/config/supporters.js` exporting `FUNDING` (`year`, `costPerYearEur` ~240, `coveredEur` — placeholders), `SUPPORTERS`, `EARLIER_SUPPORTERS`, and the two Ko-fi URLs, per the shape in `contracts/supporters-config.md`; include header comments stating that **no per-person amount may ever be stored here because this file is delivered to every visitor's browser**, that `coveredEur` must be updated in the same edit as the list, that anonymity is `anonymous: true` with no name, that `year` is rolled over by hand and never derived from the clock, and that this file must never be imported by `scripts/prerender.mjs`
- [ ] T003a Seed the seventeen existing contributors listed in `quickstart.md`, split by year and **as names only**: those who gave during `FUNDING.year` into `SUPPORTERS`, everyone else into `EARLIER_SUPPORTERS`; set `coveredEur` to the net total for the current-year group, worked out once on the Ko-fi dashboard and never broken down in the file. **First check each one's public/private flag and use `anonymous: true` for any private contribution** (FR-014a), and check whether `louis` is the same person as the `Louis` already credited in the About contributors list
- [X] T004 Create `src/composables/useFunding.js` exporting `useFunding()` returning `year`, `costEur`, `coveredEur`, `shortfallEur`, `supporterCount`, `isCovered` and `state` (`"empty" | "partial" | "covered"`), and `useSupporters()` returning `isSupporter(uid)`, `supporters` and `earlierSupporters`; both synchronous with no network access, `isSupporter` returning `false` for null/undefined without throwing, `shortfallEur` never negative
- [X] T004a Ensure `supporterCount` is derived from the list length (including anonymous entries) so it can never disagree with the wall, while `coveredEur` passes through `FUNDING.coveredEur` unchanged
- [X] T004b Confirm no per-person amount exists anywhere in `src/config/supporters.js`, including in comments, and that no composable or component can expose one (FR-001d) — the bundle is the privacy boundary, not the rendered page
- [X] T005 Verify with a throwaway harness written to the repository root (not the scratchpad — Node resolves packages from the importing file): empty, partial, covered and over-covered states; anonymous entries counting towards `supporterCount` but absent from the wall; and a fresh-year state yielding `coveredEur === 0`, `supporterCount === 0` and `state === "empty"` while `earlierSupporters` stays populated; delete the harness and its alias loader afterwards

**Checkpoint**: Data and derivations exist and are proven. User stories can begin.

---

## Phase 3: User Story 1 - Visitor sees what the site costs (Priority: P1) 🎯 MVP

**Goal**: Replace three generic "Donate" buttons with one funding status carrying a real
number, placed where people actually are.

**Independent Test**: Visit home, About, the account page and any build page signed out.
Each shows the cost, covered amount, supporter count and a monthly/annual support action —
and no page shows it twice.

- [X] T006 [US1] Create `src/components/common/FundingStatus.vue` taking a single `variant` prop (`"compact"` for the footer, `"card"` for pages), reading its own data from `useFunding()`, naming the year in every state (FR-004), and rendering the three states so that empty reads as an invitation, partial states a concrete shortfall, and covered reads as thanks with no shortfall and no bar pinned at 100% (FR-005, FR-006)
- [X] T007 [US1] Add the monthly/annual support action to `src/components/common/FundingStatus.vue`, monthly first and annual marked as better value, implemented as ordinary outbound links so it still works when a widget or script is blocked (FR-010, FR-011)
- [X] T008 [US1] Edit `src/components/Footer.vue`: remove the Donate button at line 6, render `FundingStatus` with `variant="compact"`, and suppress it entirely on routes that carry their own block (home, About, account) with a comment stating the list must grow whenever a page gains one (FR-007, research R10)
- [X] T009 [US1] Edit `src/views/Home.vue`: add `FundingStatus` with `variant="card"` to **both** sidebar stacks — the desktop column around line 29 and the duplicated mobile stack around line 20. These are separate elements, not one responsive component, so adding it to one is a silent half-fix that looks correct on whichever width you happen to test (FR-003a)
- [X] T010 [P] [US1] Edit `src/components/notifications/News.vue`: remove the Donate button and its anchor at line 55, leaving the Discord and remaining buttons in the row (FR-007a) — its card sits directly beside the new funding card in the same sidebar
- [X] T011 [P] [US1] Edit `src/views/About.vue`: replace the donation paragraph and the "Donate on Ko-fi" button around lines 149–155 with `FundingStatus` `variant="card"`, keeping the surrounding "How you can support it" section's other two routes (GitHub, write a build order) intact
- [X] T012 [P] [US1] Edit `src/views/account/Account.vue`: add `FundingStatus` `variant="card"` once, as its own card matching the existing flat rounded card stack
- [X] T013 [US1] Run `npm run check:setup` and `npm run build`
- [ ] T014 [US1] Browser check: home at phone and desktop width (card present in both stacks), About, account, and a build page (footer only); confirm exactly one ask per page, no footer overflow at phone width, and that the empty state reads as an invitation rather than a failure notice

**Checkpoint**: The whole hypothesis is shippable here. Everything after this is amplification.

---

## Phase 4: User Story 3 - Supporter sees their name on the wall (Priority: P2)

**Goal**: Public recognition that requires no identity mapping and no site account.

**Independent Test**: Add a name to `SUPPORTERS`, confirm it appears on About and raises
the count; add an entry with no `name`, confirm it counts but does not appear.

- [X] T015 [US3] Add a supporters wall to `src/views/About.vue` in two sections — `supporters` (this year) and `earlierSupporters` (previous years) — following the existing hand-maintained `contributors` list markup around line 132 so the page reads as one convention rather than two
- [X] T016 [US3] Confirm the wall keys by array position rather than by name, so two supporters sharing a display name both render and both count (data-model Collision edge case), and that no individual amount is rendered anywhere (FR-001d)
- [ ] T017 [US3] Run `npm run check:setup`, then browser-check with a temporary entry that has no `name`: it must raise the supporter count and the covered amount while producing no blank row on the wall

**Checkpoint**: Supporters get something visible for their €2. US1 + US3 is a complete, honest release.

---

## Phase 5: User Story 2 - Maintainer keeps the list current (Priority: P2)

**Goal**: Prove the monthly routine is a transcription job and nothing more.

**Independent Test**: Add and remove entries, confirm the funding status and wall both
follow with no other action, without touching a user account.

- [X] T018 [US2] Add a header comment to `src/config/supporters.js` pointing at `quickstart.md` for the monthly routine, so the file explains itself to whoever opens it in a year
- [ ] T019 [US2] Dry-run the routine end to end: add two names and bump `coveredEur` in the same edit, confirm the line and the wall both follow, and confirm the whole thing is doable from github.com in a browser without a checkout (FR-024)
- [ ] T019a [US2] Dry-run a year rollover: bump `FUNDING.year`, move `SUPPORTERS` into `EARLIER_SUPPORTERS` as names alone, and confirm the page reads as a new year beginning rather than as data lost — the year named, the wall still full, the total honestly at zero (FR-013c, FR-013d)
- [ ] T020 [US2] Confirm no client write path to the supporter data exists — no Firestore document, no security rule, no admin screen — so FR-022 is satisfied by repository access rather than by a guard someone must maintain

**Checkpoint**: The operational cost of the feature is proven to be minutes per month.

---

## Phase 6: User Story 4 - Opt-in supporter badge (Priority: P3) — ❌ DESCOPED

> **Not built, and removed after being built.** The badge needs a Ko-fi identity to map to a
> site account, and nothing provides that mapping. Even opt-in it was judged not worth the
> per-supporter friction. FR-021d required this phase be removable in full without touching
> anything else, and it was: the component, the five call sites and the `uid` field are all
> gone, and the funding status, the wall and the maintainer routine are unaffected.
>
> Consequence to know: with no account link, **no supporter can be recognised by the site at
> all**, so the focus-mode ask in Phase 7 cannot be suppressed for them (FR-026 is
> unsatisfiable as written). Everyone would see it, supporters included.

## Phase 6 (original tasks, retained for the record)

**Goal**: Recognition where people actually look. Separable — FR-021d requires this whole
phase be removable without touching anything else.

**Independent Test**: Add a `uid` to a supporter entry, confirm the badge renders on every
surface naming that user while signed out, and that supporters without a `uid` are
unaffected.

- [ ] T021 [US4] Create `src/components/common/SupporterBadge.vue` taking a `uid`, rendering nothing when `isSupporter(uid)` is false, and carrying a tooltip explaining what it means with a route to supporting (FR-021a)
- [ ] T022 [US4] Edit `src/components/builds/BuildListCard.vue`: add the badge beside the author link at **both** render positions — around line 97 and around line 151, which are the mobile and desktop layouts of the same card, the same duplication trap as `Home.vue`
- [ ] T023 [P] [US4] Edit `src/components/builds/BuildMetaLines.vue`: add the badge beside the author name around line 15, using `build.authorUid`
- [ ] T024 [P] [US4] Edit `src/components/Comment.vue`: add the badge beside the author chip around line 41, using `comment.authorId`
- [ ] T025 [P] [US4] Edit `src/components/home/TopContributors.vue`: add the badge beside the contributor title around line 37, using `contributor.authorId`
- [ ] T026 [US4] Edit `src/components/page/AuthorPageHeader.vue`: add the badge beside the author name around line 14; the `contributor` prop may not carry an id, in which case pass the uid down from `src/views/builds/Builds.vue`, which already holds it as `filterConfig.author`
- [ ] T027 [US4] Run `npm run check:setup` and the icon allowlist check from `CLAUDE.md`, which must print only `mdi-svg` and `mdi-xxx`
- [ ] T028 [US4] Browser check **signed out** on a build list, a build page, a comment thread, the home sidebar and an author page — the badge must be visible to visitors holding no token at all, which is the whole reason it is not a custom claim

**Checkpoint**: All recognition surfaces live. Deleting this phase leaves US1–US3 intact.

---

## Phase 7: User Story 5 - The ask after a focus-mode session (Priority: P3) — ❌ DESCOPED

> **Not built.** Two reasons, and the second is a consequence of Phase 6 being dropped.
> It was always the riskiest part of the feature — it intrudes on focus mode, the thing
> people love the site for. And with no supporter recognition left, it could not be hidden
> from people who had already given (FR-026 unsatisfiable), so it would periodically nag
> exactly the people it should thank. Skipped rather than shipped compromised.

## Phase 7 (original tasks, retained for the record)

**Goal**: One quiet line at the highest-intent moment on the site.

**Independent Test**: Finish a focus-mode session as a non-supporter — the line appears
once, dismisses, and does not return within the suppression period. As a linked supporter
it never appears.

- [ ] T029 [US5] Edit `src/components/builds/FocusMode.vue`: extend the `closeDialog` emit at line 1464 to carry `{ stepsAdvanced }` derived from `currentStepIndex`; it reports a fact about the session and must not know the ask exists, and the existing handler must keep working if the payload is ignored
- [ ] T030 [US5] Edit `src/views/builds/BuildDetails.vue`: on `closeDialog`, show a single dismissible supporter line when `stepsAdvanced` clears a meaningful-progress threshold, gated by a `localStorage` timestamp of roughly a month and skipped for signed-in users where `isSupporter(store.state.user?.uid)` is true (FR-025 – FR-028), following the storage pattern in `src/composables/usePlayTargetPreference.js`
- [ ] T031 [US5] Write the line's copy so it reads acceptably to someone who already supports — an unlinked supporter cannot be recognised and will see it (FR-026); this is a wording obligation, not a technical one
- [ ] T032 [US5] Run `npm run check:setup`, then browser-check three paths: a short session (no line), a full session (line once, dismissible), and a session run in the floating picture-in-picture window (line appears in the returned-to page, never in the detached window)

**Checkpoint**: All five stories live.

---

## Phase 8: Polish & Cross-Cutting Concerns

- [ ] T033 Replace the two placeholder figures in `src/config/supporters.js` with real ones — the stated yearly cost and `coveredEur`, the latter taken from actual Ko-fi payouts rather than computed, since fees depend on plan and processor. **Blocked on the maintainer supplying them; launch is gated on this, implementation is not**
- [X] T033a Inspect the deployed production bundle for any per-person amount, by searching the served JavaScript for the supporter names and for currency-shaped values near them; this is the check that the privacy rule actually held in the artefact rather than only in the source (FR-001d)
- [ ] T034 [P] Full-site pass confirming exactly one donation ask per page and that no previously free capability now requires supporter status (FR-031 – FR-033, SC-001a, SC-007)
- [X] T035 [P] Confirm `scripts/prerender.mjs` still imports nothing but `node:` builtins, and that a prerendered build page renders the footer status correctly on a live visit
- [ ] T036 Run the `quickstart.md` routine once as written and correct the document wherever it does not match what shipped

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: no dependencies
- **Foundational (Phase 2)**: depends on Phase 1 — blocks every user story
- **US1 (Phase 3)**: depends on Phase 2. The MVP
- **US3 (Phase 4)**: depends on Phase 2. Independent of US1, though both edit `About.vue`
- **US2 (Phase 5)**: depends on Phases 3 and 4 existing to be meaningful — it verifies them
- **US4 (Phase 6)**: depends on Phase 2 only. Fully separable (FR-021d)
- **US5 (Phase 7)**: depends on Phase 2; reads `isSupporter`, so US4's data shape matters but not its components
- **Polish (Phase 8)**: after whichever stories ship

### Within User Story 1

T006 → T007 (same file, action added to the component) → T008–T012 (call sites) → T013 → T014.

### Parallel Opportunities

- T001 and T002 in Phase 1
- T010, T011 and T012 within US1 — three different files, all consuming a finished `FundingStatus.vue`
- T023, T024 and T025 within US4 — three different components
- T034 and T035 in Polish

**Not parallel, despite looking it**: T009 and T022 each touch two render positions in one
file. T011 (About funding block) and T015 (About wall) are the same file in different
phases — sequence them.

---

## Parallel Example: User Story 1

```text
# After T006 and T007 land, these three are independent:
Task: "Remove the Donate button from src/components/notifications/News.vue"
Task: "Replace the donation paragraph in src/views/About.vue with FundingStatus"
Task: "Add FundingStatus once to src/views/account/Account.vue"
```

---

## Implementation Strategy

### MVP (User Story 1 only)

Phases 1 → 2 → 3, then stop and validate. That is the entire hypothesis: one ask with a
number on it, in the footer and — more importantly — in the home sidebar. If it converts,
the rest is worth building; if it does not, no tier system would have converted either.

### Incremental delivery

1. Phases 1–2 → foundation
2. + US1 → **deploy** (MVP)
3. + US3 → deploy (supporters get something visible)
4. + US2 → the monthly routine is proven
5. + US4 → deploy (badges, if anyone volunteers a username)
6. + US5 → deploy (the well-timed ask)

Stop after any of these. US1 + US3 is already a complete, honest release.

---

## Notes

- Solo project: the parallel markers describe which tasks are safe to interleave, not staffing
- Commit per task or logical group; do not push without being asked
- `npm run build` compiles templates but cannot catch a `ReferenceError` in `setup()` — hence a `check:setup` task in every phase that touches a `.vue` file
- `npm run check:steps` is not relevant: nothing here reads a build order's `steps`
- Rendering, layout and interaction need a browser and must be reported as unverified until one has been used
