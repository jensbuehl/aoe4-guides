---

description: "Task list for 034-account-deletion-cleanup"
---

# Tasks: Account Deletion Cleanup

**Input**: Design documents from `.specify/specs/034-account-deletion-cleanup/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: No automated test tasks. The project has no test suite by constitutional choice; verification is emulator-based and manual, per [quickstart.md](./quickstart.md). `firebase-functions-test` is a declared but never-used devDependency and this feature does not adopt it.

**Organization**: Grouped by user story. Note the ordering constraint below — it is not the usual one.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)

## Path Conventions

Existing repository layout, unchanged: `functions/` for Cloud Functions, `src/` for the Vue client.

---

## ⚠️ Read before sequencing

`deleteAccount` currently **deletes `favorites/{uid}`** before the `onDelete`
trigger fires. That document is the trigger's entire work list. So the client
does not duplicate the trigger's job — it destroys the trigger's ability to do it.

Consequences for these tasks:

- **US1 is not verifiable until US3's client removal has landed.** Phase A alone
  fixes administrative deletions only.
- **US3 is not cosmetic here.** It normally reads as a performance nicety; in this
  feature it is load-bearing for correctness on the in-app path.
- **Do not do US3 before US2.** Removing the client's cleanup while nothing has
  replaced it leaves a window where deletions clean up nothing at all.

---

## Phase 1: Setup

**Purpose**: Point at dev and get the trigger there. (Was an emulator premise check; superseded — see [research.md](./research.md) R-5.)

- [X] T001 Point credentials at `aoe4-guides-dev` and prove the target, per [quickstart.md](./quickstart.md) §0 — `gcloud auth application-default login`, then set the project. The Admin SDK ignores `.firebaserc`, so the resolved project must be printed and guarded before anything writes
- [X] T001a Deploy only the trigger to dev: `firebase deploy --only functions:deleteUser --project dev` ([quickstart.md](./quickstart.md) §D). Not the whole codebase — that would also push the scheduled score jobs and the comment mailer

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The chunked, idempotent decrement pass. Shared by US1 and US2 — neither can begin without it.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T002 Create `functions/users/accountCleanup.js` exporting a single function that takes a uid and performs the counter adjustments described in [contracts/deletion-cleanup-contract.md](./contracts/deletion-cleanup-contract.md). Read `favorites/{uid}`; return early if absent. For each mapping — `favorites`→`likes`, `upvotes`→`upvotes`, `downvotes`→`downvotes` — process the build ids in chunks of at most 200 (named constant, mirroring the `BATCH_SIZE` idiom in `functions/builds/updateBuildScore.js`)
- [X] T003 Within T002's chunk loop, use **`db.runTransaction`, not `db.batch`** ([research.md](./research.md) R-3): read every build reference in the chunk, write `Math.max(0, (current ?? 0) - 1)` to the mapped field for each build **that exists**, and `arrayRemove` every id in the chunk — including ids of builds that did not exist — from its source array on `favorites/{uid}`, all inside the one transaction. The array removal and the decrement it authorises MUST commit atomically together; this is the entire idempotency mechanism ([research.md](./research.md) R-2)
- [X] T004 Add logging to `functions/users/accountCleanup.js` per the contract's Logging section — the uid and per-category adjusted counts on success; on failure the uid plus which category and chunk was in flight. Do not narrate success per build

**Checkpoint**: the module exists and is independently re-runnable. Nothing calls it yet.

---

## Phase 3: User Story 1 — A departing account stops counting (P1) 🎯 MVP

**Goal**: Every counter a deleted account contributed to drops by exactly its contribution — likes, upvotes and downvotes alike.

**Independent test**: [quickstart.md](./quickstart.md) §1 — account favourites A, upvotes B, downvotes C; delete; all three counts exactly one lower and nothing else on those builds changed.

**⚠️ Not verifiable until T012 (US3) has landed** — see "Read before sequencing". Implement here; confirm after Phase 5.

- [X] T005 [US1] Wire `accountCleanup` into the `deleteUser` trigger in `functions/users/deleteUser.js`: run the counter adjustments first, then delete `favorites/{uid}`, then delete `users/{uid}`. Preserve the existing `users/{uid}` deletion behaviour exactly; the ordering is the invariant from [data-model.md](./data-model.md) and must not be rearranged for tidiness
- [X] T006 [US1] Remove the 2024 TODO comment at `functions/users/deleteUser.js:19` and replace the function's JSDoc with what it now does — it no longer only deletes a user document, and a doc comment describing the old behaviour is worse than none
- [X] T007 [US1] Verify [quickstart.md](./quickstart.md) §2 (a build in two lists takes two independent adjustments), §5 (the zero floor, both for `likes: 0` and for an absent `likes` field), and §6 (a build deleted before the account is skipped without being resurrected as a stub)

**Checkpoint**: administrative deletions are now fully cleaned. In-app deletions still fix likes only — expected, and fixed in Phase 5.

---

## Phase 4: User Story 2 — Cleanup happens however the account goes (P2)

**Goal**: An account removed by an administrator, with the app never involved, is cleaned identically.

**Independent test**: [quickstart.md](./quickstart.md) §3 — delete from the Auth emulator UI rather than through the app; same counters move.

**No implementation tasks.** Putting the work in `onDelete` satisfies this story by construction — the trigger fires for every deletion regardless of origin, which is the whole reason for R-1's choice. This phase is verification only, and saying so is more honest than inventing tasks to fill it.

- [X] T008 [US2] Verify [quickstart.md](./quickstart.md) §3 — delete an account directly in the **Firebase console** for the dev project and confirm the favourites, upvote and downvote counters move exactly as in §1, and that `favorites/{uid}` and `users/{uid}` are both gone while `contributors/{uid}` survives
- [X] T009 [US2] Verify [quickstart.md](./quickstart.md) §4 — **idempotency**. A real auth trigger cannot be re-fired, so call `cleanUpAccountActivity(uid)` twice from a throwaway harness in `functions/` and confirm every count is *identical*, not one lower. This is the sharpest risk in the feature; a double decrement corrupts a build whose owner did nothing wrong
- [X] T010 [US2] Verify [quickstart.md](./quickstart.md) §7 — **interruption**, via the same harness (a trigger cannot be interrupted on demand). Force a failure after the first chunk; confirm `favorites/{uid}` survives holding exactly the unprocessed ids, `users/{uid}` survives, and re-firing completes correctly with no double decrement of the chunk that did commit

**Checkpoint**: the server-side path is correct, idempotent and recoverable.

---

## Phase 5: User Story 3 — The goodbye is not a wait (P3)

**Goal**: Confirmation is immediate however much history the account had — and, because the client stops destroying the work list, the in-app path finally gets US1's fix.

**Independent test**: [quickstart.md](./quickstart.md) §9 — delete an account with 100+ interactions through the app and time it; under 3 seconds.

- [X] T011 [US3] Slim `deleteAccount` in `src/store/index.js` to auth concerns only — re-authenticate if required, delete the auth user, clear state. Remove the favourites read, the like decrements and the favourites deletion. **The `auth/requires-recent-login` branch and its `reauthenticate` dispatch MUST survive**; it sits directly amid the code being removed and its loss is invisible until an idle session tries to delete
- [X] T012 [US3] Replace the ordering comment above the removed Firestore work in `src/store/index.js` ("Order matters, and it used to be the other way round…"). The constraint it describes ceases to exist with the code it describes; leave what is true afterwards — that cleanup is the trigger's job. Keep a sentence recording that build orders stay published, which is a decision a reader still looks for here
- [X] T013 [US3] Remove the now-unused imports from `src/store/index.js` — `getUserFavorites` and `deleteUserFavorites` at minimum; check whether `decrementLikes` is still needed there (it is still used by `src/components/Favorite.vue`, so the service function stays)
- [X] T014 [P] [US3] Delete `deleteUserFavorites` from `src/composables/data/favoriteService.js` — it loses its only caller in T011. Confirm no other caller first. Leave `getUserFavorites` if anything else still uses it
- [ ] T015 [US3] Verify [quickstart.md](./quickstart.md) §9 (confirmation within 3s for a 100+ interaction account) and §10 (a long-idle session is asked to re-authenticate and then deletes successfully)

**Checkpoint**: US1 is now verifiable end to end on the in-app path.

---

## Phase 6: Polish & Verification

- [X] T016 Verify [quickstart.md](./quickstart.md) §1 in full, now that the in-app path is complete — this is the run that closes **spec 032 T011** (FR-014), the verification 032 shipped without. Mark T011 complete in `.specify/specs/032-google-sign-in/tasks.md` and note where it was actually verified
- [X] T017 Verify [quickstart.md](./quickstart.md) §8 — an account with 500+ combined interactions clears completely with no transaction-size error in the log (FR-012, SC-005)
- [X] T018 Run the gates: `npm run check:setup` then `npm run build`. `check:steps` and the mdi-icon allowlist check do not apply — this feature touches no build-order traversal and adds no icon
- [X] T019 Update GitHub issue [#100](https://github.com/jensbuehl/aoe4-guides/issues/100) to record that the account-deletion cleanup is done, and close the pointer note added when this spec was split out
- [X] T020 Harvest per `CLAUDE.md`: record what this taught. The candidate worth writing is the cause, not the symptom — *a client that cleans up after itself and then deletes its own work list starves any server-side handler that runs afterwards; when moving cleanup to a trigger, the client's deletion of the evidence must go in the same change, not the follow-up.* Check whether it belongs in `CLAUDE.md`, a `project` memory, or a comment at `functions/users/deleteUser.js`, and write it in exactly one of them

---

## Dependencies

```text
T001 (point at dev) ─> T001a (deploy trigger to dev)
  └─> T002 ─> T003 ─> T004        Phase 2, strictly sequential (same file)
                        │
                        ├─> T005 ─> T006 ─> T007        US1 implementation
                        │                      │
                        │                      └─> T008 ─> T009 ─> T010    US2 verification
                        │                                            │
                        │                                            └─> T011 ─> T012 ─> T013 ─> T015
                        │                                                 └─> T014 [P]
                        │                                                              │
                        └──────────────────────────────────────────────────────────────┴─> T016 ─> T017 ─> T018 ─> T019 ─> T020
```

**Story completion order**: US1 (implemented) → US2 (verified) → US3 → US1 (verified). US1 is bracketed deliberately: its code lands first and its proof lands last, because the client removal in US3 is what lets the trigger see the work list at all.

**Hard constraint**: T011 must not precede T005. Removing the client's cleanup before the trigger's exists leaves a window in which deletions clean up nothing.

## Parallel opportunities

Very few, and that is inherent rather than a planning failure — this feature is one logic path touching four files in a required order.

- **T014** is the only genuinely parallel task: a different file from T011–T013, and it only needs T011's call site removed first.
- Within Phase 2, T002–T004 all edit `functions/users/accountCleanup.js` and are strictly sequential.
- Verification tasks (T007, T008–T010, T015, T016–T017) each need the preceding deploy, so they serialise.

## Implementation strategy

**MVP** is Phase 1 + Phase 2 + Phase 3 (T001–T007): administrative deletions clean up completely and the decrement logic is proven for the floor, the missing-build case and the two-lists case. Genuinely shippable — it is strictly better than today and safe to leave overnight.

**But it is not the feature.** The in-app path — the one almost every real deletion uses — is not fixed until T011 lands. Phase 5 is not optional polish here.

**Commits**: Phase 2+3 as one commit (the server-side repair), Phase 5 as a second (the client removal). Both are independently revertible, per the constitution's atomic-commit rule. Do not squash them; the two changes have different blast radii.

**Do not add**:

- A score recalculation task — scores are recomputed on schedule and repair themselves ([research.md](./research.md) R-6)
- A historical-orphan repair task — decided against 2026-08-13, reasoning in [spec.md](./spec.md)
- Firestore rules changes — cleanup runs on the Admin SDK and bypasses rules entirely
