# Data Model: Account Deletion Cleanup

**Feature**: 034-account-deletion-cleanup | **Date**: 2026-08-13

No schema changes. This feature adjusts and removes existing documents; it adds
no collection, no field, and no index.

## Documents involved

### `favorites/{uid}` — the work list

| Field | Type | Role in this feature |
|---|---|---|
| `favorites` | `string[]` of build ids | each entry means one `likes` to give back |
| `upvotes` | `string[]` of build ids | each entry means one `upvotes` to give back |
| `downvotes` | `string[]` of build ids | each entry means one `downvotes` to give back |
| `id` | `string` | the uid; unchanged |

This document carries the feature's whole design tension: it is **both the map of
what must be undone and one of the things to be deleted**. Deleting it before
reading it is what caused the original bug, and deleting it before *acting* on it
is what would cause the next one.

During cleanup it doubles as the progress ledger (R-2). Each processed id is
removed from its array in the same atomic write that adjusts the build. Its
lifecycle within one cleanup run:

```
{favorites:[a,b,c], upvotes:[d], downvotes:[e]}   ← start
{favorites:[],      upvotes:[],  downvotes:[]}    ← all chunks committed
(document deleted)                                ← cleanup complete
```

An interrupted run leaves it part-drained, holding exactly the outstanding work.
That state is legitimate and is the record FR-013 requires.

**Absent document**: valid. Accounts predating the record, and Google accounts
abandoned at the display-name prompt, may have none. Cleanup treats this as "no
work" and proceeds to delete the user document.

### `builds/{buildId}` — the counters being repaired

| Field | Type | Adjustment |
|---|---|---|
| `likes` | `number` | −1 per entry in the account's `favorites` |
| `upvotes` | `number` | −1 per entry in the account's `upvotes` |
| `downvotes` | `number` | −1 per entry in the account's `downvotes` |
| `score`, `scoreAllTime` | `number` | **not touched** — recomputed on schedule (R-6) |
| `authorUid`, `author`, everything else | — | **not touched** — builds outlive their authors |

**Validation rules**:

- A count may never go below zero. New value is `max(0, (current ?? 0) - 1)`.
- A missing or absent count reads as `0`, so it clamps to `0` rather than `NaN`.
- A build that no longer exists is skipped, and its id is still removed from the
  array — otherwise a deleted build would block the run from ever completing.
- A build appearing in two arrays takes two independent adjustments to two
  independent fields.

### `users/{uid}` — removed

Already handled today. Deleted once counter adjustments are complete, so that a
surviving user document is a visible signal that cleanup did not finish.

### `contributors/{uid}` — untouched

Survives deliberately. The account's build orders stay published, and this record
is what attributes them on author pages and in Top Contributors. Deleting it
would orphan them.

## Ordering constraint

The single invariant the whole feature rests on:

> **Nothing that records what an account did may be deleted before the record has
> been acted on.**

Concretely: counter adjustments, then `favorites/{uid}`, then `users/{uid}`. The
original defect was this order reversed; the 032 repair fixed it on the client
path only.

## Volume

Bounded by one departing account's own activity — typically a handful of
interactions, and required to work at 500+ (FR-012). Chunked at 200 per
transaction (R-3), so an account with 500 interactions costs three transactions.
Nothing here scales with the ~4k build collection.
