# Implementation Plan: Account Deletion Cleanup

**Branch**: `034-account-deletion-cleanup` | **Date**: 2026-08-13 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `.specify/specs/034-account-deletion-cleanup/spec.md`

## Summary

When an account is deleted, give back every like, upvote and downvote it cast,
on every build order it touched — and do it wherever the deletion came from.

Today the cleanup lives in the client, handles likes only, and never runs at all
for an administrative deletion. It moves into the existing `deleteUser` auth
trigger, where it runs on the Admin SDK and cannot be refused by security rules.

The design turns on one idea (R-2): the favourites record is **both** the map of
what must be undone and one of the things to be deleted. Each chunk of work
adjusts the builds and erases its own entries from that map in a single atomic
transaction, so a retry can only ever see work not yet done. That makes the whole
thing idempotent without a flag, a lock, or any new state — and an interrupted
run leaves a record of exactly what is outstanding.

## Technical Context

**Language/Version**: Node.js 22 (Cloud Functions); Vue 3 + Vuetify 3 (client)

**Primary Dependencies**: `firebase-admin` ^13, `firebase-functions` ^6 (v1
namespace for auth triggers — R-1), `firebase` ^10 JS SDK on the client. **No new
dependency.**

**Storage**: Cloud Firestore — `builds`, `favorites`, `users`, `contributors`.
No schema change, no new index.

**Testing**: No formal suite, by constitutional choice. Emulator-based manual
verification per [quickstart.md](./quickstart.md), gated on `npm run check:setup`
and `npm run build`.

**Target Platform**: Firebase Cloud Functions; SPA on Netlify.

**Project Type**: Web application with serverless backend functions.

**Performance Goals**: deletion confirmed to the user within 3s regardless of
history size (SC-003); cleanup completes for an account with 500+ interactions
(FR-012).

**Constraints**: free-tier-first; ≤500 operations per Firestore transaction, so
chunked at 200 (R-3); cleanup may not depend on the deleted account's own
permissions, which no longer exist (FR-005).

**Scale/Scope**: work is bounded by one departing account's own activity —
typically a handful of interactions. Nothing scales with the ~4k build
collection.

## Constitution Check

*GATE: passed before Phase 0, re-checked after Phase 1 design. Result unchanged.*

| Principle | Assessment |
|---|---|
| **I. Simplicity First** | **Pass.** No new dependency, no new collection, no new field. One new module in `functions/users/`, and the client gets *smaller* — the net line count is negative. The idempotency mechanism is deliberately the absence of a mechanism: no flag, no lock, no bookkeeping document, just the observation that the work list can be its own ledger (R-2). |
| **II. Incremental Quality** | **Pass, and it pays three debts.** It removes a TODO that has sat in `deleteUser.js` since 2024; it deletes client code that becomes dead (`deleteUserFavorites` loses its only caller); and it closes 032 T011, a verification task that was never run, so a shipped repair stops being unproven. The stale ordering comment in `deleteAccount` is explicitly scheduled for replacement rather than left to mislead (R-4). |
| **III. Consistent UX & Component Reuse** | **Pass.** No UI change beyond the delete flow getting faster. Server-side, it reuses the established idiom from `updateBuildScore.js` — chunked writes, a named size constant, `logger.log` progress — rather than inventing a second style. |
| **IV. Cost-Conscious Infrastructure** | **Pass.** Reads and writes are bounded by one account's own interactions, not by collection size. It adds one read per affected build, which buys three requirements at once (R-3): the zero floor, skipping deleted builds, and race-safety. Net against today it *removes* a client read and moves N writes from client to server. Well inside free tier. |
| **V. Secure Defaults** | **Pass, and it is the main security improvement.** Privileged cleanup stops running in client code under security rules and moves to a server-side trigger on the Admin SDK — the project's established pattern for privileged work. `firestore.rules` needs no change, because no client capability is added or removed. |

No violations. Complexity Tracking section omitted.

## Project Structure

### Documentation (this feature)

```text
.specify/specs/034-account-deletion-cleanup/
├── plan.md                              # This file
├── spec.md                              # Requirements, scenarios, the historical-orphan decision
├── research.md                          # R-1 … R-7
├── data-model.md                        # Documents touched, ordering invariant
├── quickstart.md                        # §0 … §10 verification
├── checklists/requirements.md           # Spec quality gate — passing
├── contracts/
│   └── deletion-cleanup-contract.md     # Trigger + store action contracts
└── tasks.md                             # NOT created by /speckit-plan
```

### Source Code (repository root)

```text
functions/
├── index.js                          # unchanged — deleteUser is already exported
└── users/
    ├── deleteUser.js                 # EXTENDED — orchestrates cleanup, drops the 2024 TODO
    └── accountCleanup.js             # NEW — the chunked, idempotent decrement pass

src/
├── store/
│   └── index.js                      # SLIMMED — deleteAccount keeps only auth concerns
└── composables/data/
    └── favoriteService.js            # deleteUserFavorites removed (loses its only caller)
```

**Structure Decision**: the existing layout, unchanged. `functions/users/` already
groups account-lifecycle triggers, and `deleteUser.js` is where a reader looks for
what happens on deletion. The decrement pass is extracted to its own module
because it is the only part with real logic worth reading — and worth re-firing —
in isolation; the trigger stays a thin, obvious orchestration.

## Phased approach

**Phase A — the repair, server-side.** Write the cleanup module and wire it into
the trigger.

**Phase B — remove the client's copy.** Slim `deleteAccount`, delete the dead
service function, replace the stale ordering comment. US3 (immediate
confirmation) lands here.

**Phase C — verify.** [quickstart.md](./quickstart.md) §0–§10, starting with the
premise check. §4 (idempotency) and §7 (interruption) are the ones that matter;
§1 closes 032 T011.

### The client starves the trigger, so B is not optional-later

A and B must both land before the in-app path is fixed, and the reason is worth
stating precisely because it is easy to get backwards.

Today `deleteAccount` **deletes `favorites/{uid}`** as its last cleanup step. The
`onDelete` trigger fires afterwards. So with Phase A alone, an in-app deletion
hands the trigger an account whose work list has already been destroyed — the
trigger finds nothing, and upvotes and downvotes still go un-decremented. The
client does not merely duplicate the trigger's work; it removes the trigger's
ability to do it.

The intermediate state after Phase A is therefore *better than today but not
complete*: administrative deletions are fully cleaned, in-app deletions still fix
likes only. That is a safe place to stop overnight, and not a place to declare
US1 done.

The reverse order is worse: B before A removes the client's cleanup while nothing
has replaced it, leaving a window in which deletions clean up nothing at all. A
then B, promptly, is the only correct sequence — separate commits, one after the
other, not one this week and one next.

## Risks

| Risk | Handling |
|---|---|
| **A double decrement corrupts an innocent build** — worse than the bug being fixed | The atomic work-list-as-ledger design (R-2), plus quickstart §4 and §7 as explicit adversarial checks |
| **The emulator may not fire v1 `onDelete`**, which the entire verification plan assumes | Confirmed first, in quickstart §0, with a stated fallback — before any test steps are written or trusted |
| **The `requires-recent-login` branch is deleted by accident** in Phase B; it sits amid the code being removed and its loss is invisible until an idle session tries to delete | Called out in the contract as "must survive the edit", and covered by quickstart §10 |
| **A stale comment outlives the constraint it describes** | Named as a deliverable in R-4 and in the contract, not left to reviewer diligence |
| **Phase A is mistaken for a finished feature** — it fixes administrative deletions only, because the client still destroys the work list before the trigger sees it | Stated above and reflected in the task phases: US1 is not verifiable until the client stops deleting `favorites/{uid}` |

## Notes for `/speckit-tasks`

- Phase A and Phase B must be separate commits — the constitution asks for atomic
  commits, and these are independently revertible.
- Verify `getUserFavorites` still has callers before removing anything beyond
  `deleteUserFavorites`.
- Do not add a score-recalculation task. Scores are recomputed on schedule and
  repair themselves (R-6).
- Do not add a historical-repair task. Decided against on 2026-08-13; the
  reasoning is in `spec.md`.
