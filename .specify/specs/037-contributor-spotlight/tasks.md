---
description: "Task list for 037-contributor-spotlight"
---

# Tasks: Contributor Spotlight

**Input**: Design documents from `.specify/specs/037-contributor-spotlight/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md),
[data-model.md](data-model.md), [contracts/](contracts/)

**Tests**: No formal test suite — the constitution does not require one and this project has none.
Verification tasks appear explicitly instead (`check:setup`, the icon allowlist check, a throwaway
reactivity harness for pure logic, browser checks, and direct server writes for the rules). They are
not optional: `npm run build` cannot see a `ReferenceError` in `setup()`, and a passing form proves
nothing about a Firestore rule.

**Organization**: grouped by user story so each ships on its own.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (different files, no dependency on incomplete work)
- **[Story]**: US1 / US2 / US3, mapping to the user stories in spec.md

## Path Conventions

Vue SPA in `src/`, Firebase Functions in `functions/`, rules at the repository root. Paths below are
repository-relative and exact.

---

## Phase 1: Setup

**Purpose**: capture the baseline the success criteria are measured against, before anything changes.

- [ ] T001 Record the home page's current Firestore read count as the SC-001 baseline: load `/` with devtools open, filter network to `firestore.googleapis.com`, and note the count in a comment at the top of `.specify/specs/037-contributor-spotlight/quickstart.md`. SC-001 is "the same number as before"; without the before, it is unfalsifiable.
- [X] T002 [P] Confirm the icons this feature needs are already in `src/plugins/mdiIcons.js` — `mdi-youtube`, `mdi-trophy`, `mdi-account-star`, `mdi-open-in-new`, `mdi-eye`, `mdi-hammer`, `mdi-pencil`. Research R8 says they are; verify rather than trust, because a missing icon renders as nothing behind a green build.

---

## Phase 2: Foundational (blocks US1 and US2)

**⚠️ US1 and US2 both consume the shared identity component and the profile composable. Neither can start until this phase completes.**

- [X] T003 [P] Create `src/config/event.js`, moving `PRIZE_POOL`, `LINKS`, `STARTS` and `ENDS` out of `src/components/home/EventBanner.vue` and exporting an `isEventLive()` predicate alongside them (research R3). `EventBanner.vue` imports from it and must render byte-identically — this task changes no pixel.
- [X] T004 [P] Create `src/composables/useContributorProfile.js` exporting `normaliseBio(text)` (collapse whitespace runs to single spaces, trim, return `null` when empty), `isValidChannel(value)` (the anchored `^(UC[A-Za-z0-9_-]{22}|@[A-Za-z0-9._-]{3,30})$` pattern), `channelUrl(value)` (returns `null` for anything that fails `isValidChannel`, never a bare-host fallback) and `isRecognisedChannel(value)` (membership test against `creatorId` values in `src/composables/filter/featuredCreatorDefaultProvider.js`).
- [X] T005 Create `src/components/page/ContributorIdentity.vue` — the body shared by both surfaces: `UserAvatar`, display name, optional bio, stat chips for build count and views, optional channel link with `target="_blank" rel="noopener"`. It must render **nothing at all** when `displayName` is missing (FR-032) and must compose with any combination of absent `icon` / `bio` / `youtube` (SC-009). Colours come only from the `--hero-*` tokens in `src/assets/base.css`; define no new ones. Depends on T004 for `channelUrl` and `isRecognisedChannel`.

**Checkpoint**: shared pieces exist and `EventBanner` still renders exactly as before.

---

## Phase 3: User Story 1 — Spotlight on the home page (Priority: P1) 🎯 MVP

**Goal**: one curated contributor is introduced by name and face at the top of the home page, in the slot the event banner would otherwise occupy.

**Independent Test**: nominate a uid, deploy the function, run it once from the console, load `/` signed out at phone and desktop width. The card names that person and reaches their builds. Works with zero profile fields set.

- [X] T006 [US1] In `functions/builds/updateHomeSnapshot.js`, add a `FEATURED_CONTRIBUTOR` module constant (a uid, or `""` for nobody) with a comment pointing at `quickstart.md` for the rotation routine, and fetch that one contributor document inside the scheduled handler.
- [X] T007 [US1] In the same file, write the result into `home/home` as `featuredContributor` — the whole document spread plus `id`, or **explicit `null`** when the constant is empty or the document does not exist. Explicit `null` matters: the write uses `{ merge: true }`, so omitting the key would strand a previous spotlight forever. A bad uid must produce `null` and a completed run, never a thrown one.
- [X] T008 [P] [US1] Create `src/components/home/ContributorSpotlight.vue` — the translucent radial-gradient wash and layout of `src/components/home/EventBanner.vue`, with an eyebrow ("Community · Contributor in focus"), `ContributorIdentity` as its body, and a primary action routing to `{ name: 'Builds', query: { author: id } }`. Stacks below the width at which avatar plus a readable text column stop fitting the `md=8` column — measure it, do not guess a device breakpoint.
- [X] T009 [US1] In `src/views/Home.vue`, render `ContributorSpotlight` in the same position as `EventBanner`, guarded by `v-if="!eventLive && featuredContributor"`, reading `featuredContributor` from the snapshot in `initData()`. Add it to **both** the desktop and the mobile stacks if it belongs in both — the file's own comment warns that they are duplicates, not responsive variants.
- [ ] T010 [US1] Deploy the function with `npm --prefix functions run deploy`, run `updateHomeSnapshot` once from the Firebase console, and confirm in the console that `home/home` now carries `featuredContributor`, and that it carries `null` when the constant is empty.
- [ ] T011 [US1] Browser verification: light and dark, phone and desktop; event banner live → no spotlight, event banner expired → spotlight in its place; a contributor with no avatar, no bio and no channel → no empty blocks; a very long display name → no horizontal overflow; the card's action reaches the author page.

**Checkpoint**: US1 ships on its own. The card shows name, avatar and counts; bio and channel appear later with no further work here.

---

## Phase 4: User Story 2 — The author page reads like a profile (Priority: P2)

**Goal**: the author-filtered builds view opens with a header worth landing on, including the author's standing.

**Independent Test**: open `/builds?author=<uid>` for a top-eight contributor and for one outside it. The first shows a rank chip, the second shows nothing in its place. Neither makes a request the page did not already make.

- [X] T012 [US2] In `functions/builds/updateHomeSnapshot.js`, read the existing `home/home` document at the start of the run, before overwriting it, so the previous `topContributors` list is available to diff against.
- [X] T013 [US2] In the same file, write `rank` (1-based) onto each contributor document in the new top eight, and delete `rank` from any uid present in the previous list but absent from the new one. A contributor document that vanished between query and write is not an error — the run must complete regardless.
- [X] T014 [US2] Rewrite `src/components/page/AuthorPageHeader.vue` to use `ContributorIdentity` as its body, adding the rank chip when `contributor.rank` is present and rendering nothing in its place when it is not (FR-017). Keep the existing measured-height behaviour keyed off `useDisplay().name`, and keep it visually a sibling of the spotlight (FR-018). `src/views/builds/Builds.vue` needs **no change** — it already fetches the contributor document and passes it whole.
- [ ] T015 [US2] Deploy the function, run it once, and confirm in the Firebase console that `rank` appears on the top eight and is removed from a contributor pushed out of the list.
- [ ] T016 [US2] Browser verification: a ranked and an unranked author, both themes, phone and desktop; removing the author filter hides the header; devtools confirms no additional Firestore request versus the pre-feature page.

**Checkpoint**: US1 and US2 both work independently.

---

## Phase 5: User Story 3 — A contributor writes their own introduction (Priority: P3)

**Goal**: a signed-in contributor maintains a 180-character introduction and a channel, enforced by the server, and they appear on the two surfaces above.

**Independent Test**: sign in, save an introduction and a channel, reload the author page and see them. Then attempt the same write against another contributor and an over-length value directly — both refused.

- [ ] T017 [US3] **No longer blocking — now a confirm-and-relax.** `bioLength` was implemented as UTF-8 byte length, which is the largest of the candidate measures (an emoji is 1 code point, 2 UTF-16 units, 4 bytes) and therefore cannot be looser than the rule under any reading of `size()`. The counter can only stop a contributor early, never let them reach an apparently valid length the server refuses. Measure the real behaviour in the emulator anyway and, if `size()` turns out to count code points, relax `bioLength` in `src/composables/useContributorProfile.js` so a bio full of umlauts is not cut short. Record the answer in `research.md` under R11.
- [X] T018 [US3] Extend `src/composables/useContributorProfile.js` with `bioLength(text)` counting the way T017 established the rule counts, and `extractChannel(input)` which pulls an id or handle out of a pasted YouTube URL and returns `null` when the input yields neither — never a guess.
- [X] T019 [P] [US3] Add `getContributorProfile(uid)` and `updateContributorProfile(uid, { bio, youtube })` to `src/composables/data/userService.js`, writing with `setDoc(…, { merge: true })` including `authorId` so a missing document is created rather than erroring (research R10), and using `deleteField()` for any value that normalises to empty — never `""`. **Landed in `userService.js`, not `contributorService.js` as this task originally said**: `updateContributorIcon` already lives there, and what groups these is not the collection they write to but who may write them — this file holds what a signed-in person changes about their own account, while `contributorService` is the read and stat-increment side of the same collection.
- [X] T020 [US3] In `firestore.rules`, extend the owner `update` clause on `contributors/{contributor}` from `hasOnly(['icon'])` to `hasOnly(['icon','bio','youtube'])` with the validation from `contracts/contributor-fields.md`, add the `create` clause, and factor the shared checks into a `profileFieldsValid()` function. Leave the anonymous `hasOnly(['boCount','viewCount'])` clause untouched. `rank` must appear in **no** client key list — that absence is what forbids a client writing it. Keep the `^…$` anchors: `matches()` is RE2 and is not implicitly anchored.
- [X] T021 [US3] Add a "Public profile" card to the right column of `src/views/account/Account.vue`, between Security and `FundingStatus`: a bio field with a live remaining-allowance counter using `bioLength` from T018, a channel field accepting a pasted URL via `extractChannel`, and a sentence stating plainly that both appear on the author page and may appear on the home page (FR-025).
- [X] T022 [US3] In `functions/users/deleteUser.js`, clear `bio` and `youtube` from `contributors/{uid}` while leaving `displayName`, `icon`, `boCount`, `viewCount` and `rank` intact, and amend the file's header comment — which currently says the contributor document simply "stays with them" — to record why these two fields are the exception (research R4, FR-029).
- [ ] T023 [US3] Deploy: `firebase deploy --only firestore:rules` and `npm --prefix functions run deploy`. Neither is covered by the Netlify push.
- [X] T024 [US3] Server-side verification from the console or emulator, per the table in `quickstart.md`. **Done via the Security Rules test API, 23/23 as specified** — see research R12, including the encoding trap that makes a broken harness look like a strict ruleset. The emoji row is the one thing still unmeasured; it belongs to T017.
- [ ] T025 [US3] Browser verification: save, clear and re-save a bio; paste a channel URL and confirm only the identifier is stored; confirm the saved bio then appears on the author page and on the spotlight card.

**Checkpoint**: all three stories independently functional.

---

## Phase 5b: Two more profile links (added after US3 shipped)

**Added on request after the spec had closed** — the original Out of Scope line read "additional
social links beyond the single video channel", and that line is now narrowed to "beyond the three
named in FR-022". Recorded rather than quietly rewritten, because the reason the limit existed
(every link is a live outbound destination on the home page) still applies to the fourth.

- [X] T032 [US3] Restructure `src/composables/useContributorProfile.js` around a link table keyed by kind — `youtube`, `twitch`, `aoe4world` — each carrying its anchored `pattern`, accepted `hosts`, a `fromPath` extractor and a `url` builder, and replace `isValidChannel`/`channelUrl`/`extractChannel` with `isValidLink`/`linkUrl`/`extractLink` taking a kind. A table rather than three near-identical functions: the third copy is where patterns start drifting, and the pattern is the one thing that must not.
- [X] T033 [US3] Render the links as a list in `src/components/page/ContributorIdentity.vue`, and change the rank chip icon from `mdi-trophy` to `mdi-star` — `About.vue` already spends the trophy on aoe4world, and one icon cannot mean two things in the same card.
- [X] T034 [US3] Extend `getContributorProfile`/`updateContributorProfile` in `src/composables/data/userService.js` with `twitch` and `aoe4world`, listing the fields explicitly rather than spreading a map, so a fourth link is a visible edit here and in the rules.
- [X] T035 [US3] Add both fields to the `hasOnly` key lists and to `profileFieldsValid()` in `firestore.rules`, with their own anchored patterns.
- [X] T036 [US3] Drive the three inputs in `src/views/account/Account.vue` from `PROFILE_LINK_KINDS`, so adding a kind changes one module rather than three files, and extend the dirty check to all of them.
- [X] T037 [US3] Add `twitch` and `aoe4world` to the field list cleared in `functions/users/deleteUser.js`. **This is the silent one** — forgetting it breaks nothing, it just lets a value outlive the person who wrote it, and the CommonJS package cannot import the list from `src/`.
- [ ] T038 [US3] Deploy the rules and functions again: `firebase deploy --only firestore:rules` and `npm --prefix functions run deploy`.
- [X] T039 [US3] Server-side verification for the two new patterns per the table in `quickstart.md` — covered by the same 23-case run (research R12).

---

## Phase 6: Polish & Cross-Cutting

- [X] T026 Run `npm run build` and `npm run check:setup` — the latter catches a `ReferenceError` in `setup()` that the build cannot, which blanks a component behind a green build.
- [X] T027 [P] Run the icon allowlist check from `CLAUDE.md` and add any icon introduced during implementation to `src/plugins/mdiIcons.js`. It should print only `mdi-svg` and `mdi-xxx`.
- [X] T028 [P] Write a throwaway `@vue/reactivity` harness **at the repository root** (not the scratchpad — Node resolves packages from the importing file) driving `normaliseBio`, `isValidChannel`, `channelUrl`, `extractChannel` and `bioLength` against their edge cases: whitespace-only, newlines, 180/181 characters, emoji, pasted URLs, `/c/` and `/user/` legacy names, and a bare video id. Delete the harness and its alias loader afterwards.
- [ ] T029 Verify SC-001 against the T001 baseline: the home page must make the same number of Firestore requests as it did before this feature, with a spotlighted contributor who is **not** in the top eight.
- [ ] T030 [P] Update `quickstart.md` with the `size()` answer measured in T017, replacing the "see research R11" pointer with the actual rule.
- [X] T031 Reconcile the spec and plan against what was actually built, and record what the work taught per the harvest rule in `CLAUDE.md` — a trap in this codebase, a document that now contradicts the code, or scope that turned out already built.

---

## Dependencies & Execution Order

### Phase dependencies

- **Setup (T001–T002)**: no dependencies. T001 must happen **before any code changes**, or the baseline it captures is not a baseline.
- **Foundational (T003–T005)**: blocks US1 and US2. Does not block US3's rules or service work.
- **US1 (T006–T011)**: needs T005.
- **US2 (T012–T016)**: needs T005. Independent of US1, though both edit `updateHomeSnapshot.js` — see the conflict note below.
- **US3 (T017–T025)**: needs T004. Benefits from US1 and US2 shipping first, because that is what makes the bio visible, but does not require them.
- **Polish (T026–T031)**: after the stories being shipped.

### Within US3

T017 blocks T018 (which counts the way T017 discovered) and T021 (whose counter uses it). T020 is
independent of the client work and can land first — the rule refusing a write the form never makes
is harmless.

### File conflict to respect

`functions/builds/updateHomeSnapshot.js` is edited by **both** US1 (T006, T007) and US2 (T012, T013).
Those four tasks are not parallel with each other regardless of which story they belong to. If the
stories are worked separately, land US1's edits first.

### Parallel opportunities

- T002 alongside T001.
- T003 and T004 together — different files, no shared symbols.
- T008 alongside T006/T007 — the component and the function do not touch each other.
- T019 alongside T017/T018 — the service write is independent of how characters are counted.
- T027, T028 and T030 together.

---

## Parallel Example: Foundational

```
Task: "Create src/config/event.js, moving the constants out of EventBanner.vue"   (T003)
Task: "Create src/composables/useContributorProfile.js"                           (T004)
```

Then T005, which needs T004.

---

## Implementation Strategy

### MVP: User Story 1 only

1. Phase 1 (T001–T002) — capture the baseline first.
2. Phase 2 (T003–T005).
3. Phase 3 (T006–T011).
4. **Stop and validate.** The spotlight works with no profile fields in existence. If it does not
   earn its place on the home page, US2 and US3 are wasted effort — and US3 is the only part that
   accepts public input, so not building it is a real option, not a failure.

### Incremental delivery

| Increment | Tasks | Deploys needed |
|---|---|---|
| US1 | T001–T011 | frontend (push) + functions (manual) |
| US2 | T012–T016 | frontend (push) + functions (manual) |
| US3 | T017–T025 | frontend (push) + functions (manual) + rules (manual) |

Two of the three pipelines are manual. A frontend push alone makes none of the backend changes live,
and the spotlight will simply not render until the function has been deployed and has run.

### Deliberately not in this list

The existing `src/components/home/TopContributors.vue` sidebar list. It is unchanged by design
(FR-027) — automatic, unmoderated, and therefore never showing a bio. If a task appears that edits
it, the scope has drifted.
