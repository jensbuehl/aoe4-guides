# Contract: Account Deletion Cleanup

**Feature**: 034-account-deletion-cleanup | **Date**: 2026-08-13

Two surfaces change: the `deleteUser` trigger gains the cleanup, and the
`deleteAccount` store action loses it.

---

## `deleteUser` — auth `onDelete` trigger, `functions/users/deleteUser.js`

Fires once per deleted authentication account, whatever caused the deletion —
the app, an administrator, the Firebase console, or the Admin SDK.

| | |
|---|---|
| **Trigger** | `functions.auth.user().onDelete()` (v1 — see R-1) |
| **Input** | the deleted `user` object; only `user.uid` is used |
| **Authority** | Admin SDK. Bypasses `firestore.rules` entirely, which is the point (FR-005) |
| **Returns** | a promise resolving when cleanup is complete |

### Does

1. Read `favorites/{uid}`. If absent, skip to step 3.
2. For each of `favorites` → `likes`, `upvotes` → `upvotes`, `downvotes` →
   `downvotes`, in chunks of at most 200 build ids, run one transaction that:
   - reads every build reference in the chunk
   - for each build that exists, writes `max(0, (current ?? 0) - 1)` to the
     mapped field
   - removes every id in the chunk from its source array on `favorites/{uid}`,
     including the ids of builds that did not exist
3. Delete `favorites/{uid}` (no-op if it was never there).
4. Delete `users/{uid}`.

### Guarantees

- **Idempotent.** Running it twice for the same uid leaves every counter where
  one run left it. The array entry and the decrement it authorises are removed in
  the same atomic transaction, so no committed work is visible as outstanding.
- **No counter goes negative.** Ever, including counts that were already 0 or
  absent before this ran.
- **Partial failure is recoverable and visible.** An interrupted run leaves
  `favorites/{uid}` holding exactly the outstanding items and `users/{uid}` still
  present. Re-firing the trigger for that uid completes the job correctly.
- **Never touches build orders authored by the account**, their authorship, their
  scores, or `contributors/{uid}`.

### Does not

- Adjust `score` or `scoreAllTime` — the scheduled recalculation owns those (R-6).
- Adjust `views` — not attributable to an account.
- Touch comments (out of scope).
- Repair damage from deletions that happened before it shipped (decided; see
  `spec.md`).

### Logging

Enough to satisfy FR-013 without narrating success: the uid, the count of builds
adjusted per category, and on failure the uid plus which category and chunk was
in flight. The surviving `favorites/{uid}` is the durable record; the log says
where to look.

---

## `deleteAccount` — store action, `src/store/index.js`

| | |
|---|---|
| **Does** | re-authenticates if the session is too old, deletes the authentication account, clears user state |
| **No longer does** | reads favourites, decrements likes, deletes the favourites record — all now server-side |
| **Preconditions** | a user is signed in |
| **Resolves** | once the account itself is gone; **does not wait for cleanup** (FR-011, US3) |
| **Rejects** | with a user-facing message when deletion or re-authentication fails |

### Must survive the edit

- The `auth/requires-recent-login` branch and its `reauthenticate` dispatch. This
  is the only path by which a long-idle session can delete anything, it arrived
  in 032, and it sits directly amid the code being removed.
- The intent that **build orders stay published** — currently carried by a
  comment in this action. The behaviour lives server-side now, but the decision
  still deserves a sentence where a reader looks for it.

### Must not survive the edit

- The ordering comment explaining why the Firestore work precedes `deleteUser`.
  That constraint disappears with the code it describes. Replace it with what is
  true afterwards — that cleanup is the trigger's job — rather than leaving a
  correct-sounding explanation of an order that no longer exists.

---

## Unchanged by this feature

- `firestore.rules` — no client capability is added or removed.
- `createUser` / `createContributor` — untouched.
- `favoriteService.addFavorite` / `addUpvote` / `addDownvote` and the counter
  increments in `Favorite.vue` and `Vote.vue` — the normal un-vote path is
  correct and stays as it is.
