# Quickstart: Verifying Account Deletion Cleanup

**Feature**: 034-account-deletion-cleanup | **Date**: 2026-08-13

Verified against the **`aoe4-guides-dev` project**, not the emulator and not
production.

Why not the emulator: the reason to reach for it was blast radius, and a separate
dev project already provides that. It also removes an assumption rather than
adding one — "does the Auth emulator fire v1 `onDelete`?" is simply not a
question on a real project, and it was the premise the whole plan used to rest on.

Why not production: this feature decrements counters on build orders belonging to
real authors.

## §0 — Point at dev, and prove it

The Admin SDK does not read `.firebaserc`. **Aliases mean nothing to it** — the
project comes from the credentials alone, which is how a mistyped variable
silently hits production. Every step below prints its target before acting.

Preferred, no secret on disk:

```sh
gcloud auth application-default login
gcloud config set project aoe4-guides-dev
```

```powershell
$env:GOOGLE_CLOUD_PROJECT = "aoe4-guides-dev"
```

Fallback, matching the existing scripts: set `GOOGLE_APPLICATION_CREDENTIALS` to
a **dev** service-account JSON. Never commit it — the constitution forbids
credentials in source control, and the repo has no ignore rule that would catch a
stray key.

**Gate**: every script here refuses to run unless the resolved project is
`aoe4-guides-dev`. That guard is not a nicety; it is the only thing standing
between a typo and 4,000 production build orders.

## §D — Deploy the trigger to dev

```sh
firebase deploy --only functions:deleteUser --project dev
```

Only `deleteUser`. Deploying the whole codebase to dev would also push the
scheduled score jobs and the comment-notification mailer, which have side effects
nobody asked for.

---

## Part A — Checks that need only the dev app and console

### §1 — The core repair (US1, closes 032 T011)

Seed three build orders — A, B, C — and one throwaway account that favourites A,
upvotes B, downvotes C.

1. Record `A.likes`, `B.upvotes`, `C.downvotes`.
2. Delete the account **through the app**.
3. Re-read all three.

**Pass**: each exactly one lower; nothing else on A, B or C changed, including
`score`, `authorUid` and `author`.

This is the run that closes **032 T011** (FR-014) — the like decrement it proves
is the repair 032 shipped unverified.

4. Confirm `favorites/{uid}` and `users/{uid}` are gone and `contributors/{uid}`
   survives.

### §2 — A build in two lists

One account, one build D, both favourited and upvoted.

**Pass**: `D.likes` and `D.upvotes` each drop by exactly one.

### §3 — Administrative deletion (US2)

Repeat §1, but delete the account from the **Firebase console** rather than the
app. This is the hole that exists today — currently this path cleans nothing but
`users/{uid}`.

**Pass**: identical result.

### §5 — The floor (FR-007, SC-007)

Build E with `likes: 0`, favourited by the account.

**Pass**: `E.likes` is `0`, never `-1`. Repeat with `likes` **absent**: **pass**
is `0`, not `NaN`, and not left missing in a way that breaks the score job.

### §6 — A build that is gone (FR-008)

Account favourites build F; delete F first, then the account.

**Pass**: deletion completes, F is not resurrected as a stub, every other build in
the run is still adjusted.

### §9 — The user's experience (US3, SC-003)

An account with 100+ interactions, deleted through the app.

**Pass**: confirmation within 3 seconds.

### §10 — Long-idle session

Sign in, leave the session until Firebase considers it stale, then delete.

**Pass**: re-authentication is requested, deletion completes afterwards. This is
the 032 behaviour sitting amid the code this feature removed, and the most likely
casualty of the edit.

---

## Part B — Checks the trigger cannot give us

**§4 idempotency** and **§7 interruption** are the two that matter most, and
neither is reachable by deleting accounts: you cannot re-fire a real auth trigger,
and you cannot interrupt one on demand.

Both test `cleanUpAccountActivity` directly, which is the exact function the
trigger calls — so what is proven is the real code path, minus the trigger
wiring that §1 and §3 already prove.

Run through a throwaway harness in `functions/` (it must live there so Node
resolves `firebase-admin` to the same instance the module uses — a harness written
elsewhere initialises one copy of the SDK and calls into another, and fails with
"the default Firebase app does not exist"). Write it, run it, delete it.

### §4 — Idempotency (FR-006, SC-004)

Seed a favourites document and known counters, then call
`cleanUpAccountActivity(uid)` **twice**.

**Pass**: counts after the second call are **identical** to after the first. Not
one lower. A double decrement corrupts a build whose owner did nothing wrong,
which is worse than the bug being fixed.

### §7 — Interruption (FR-013)

Seed more than one chunk's worth (`CHUNK_SIZE` is 200, so seed ~250 or lower the
constant for the run). Make the second chunk throw, then re-run to completion.

**Pass**: after the failure, `favorites/{uid}` holds *exactly* the unprocessed
ids and the processed ones are gone; the re-run finishes with every count correct
and no double decrement of the chunk that did commit.

### §8 — Volume (FR-012, SC-005)

500+ combined interactions in one run.

**Pass**: all counters adjusted, no transaction-size error.

---

## Gates before merge

```sh
npm run check:setup
npm run build
```

`check:steps` and the mdi-icon allowlist check do not apply — no build-order
traversal, no new icon.

## Say plainly what was not verified

Dev proves the data behaviour. It does not prove production rules, production
data shapes, or anything about rendering and layout, which need a browser. If a
section was skipped, name it — "§1 through §3 passed" is a different claim from
"verified".
