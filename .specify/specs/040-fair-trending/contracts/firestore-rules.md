# Contract: Firestore rules for `builds` and `contributors`

The rules are the contract: what any client — ours, a script, the browser console — may write.
Everything below is enforced by `firestore.rules`; the client merely complies.

## `builds/{id}`

```
// Fields only the scheduled jobs (Admin SDK) write.
SERVER   = [score, scoreAllTime, trend, trendBase, trendAt]
COUNTERS = [views, likes, upvotes, downvotes, comments]

read:    anyone

create:  signed in
         ∧ incoming authorUid == caller
         ∧ each of COUNTERS, score, scoreAllTime is absent or 0
         ∧ none of trend, trendBase, trendAt is present

update (author edit):
         signed in
         ∧ existing authorUid == caller
         ∧ authorUid unchanged
         ∧ changed keys contain none of COUNTERS ∪ SERVER

update (counter step) — exactly one key changes, and it is:
         views                               new == old + 1           anyone
         likes | upvotes | downvotes         new == old ± 1           signed in
         comments                            new == old ± 1           signed in
         (old read as resource.data.get(f, 0))

delete:  signed in ∧ existing authorUid == caller
```

The author may also make counter steps like any other signed-in visitor — the two update branches are
alternatives, not one combined rule.

### Must be refused (the SC-001 test list)

| # | Caller | Write | Today |
|---|---|---|---|
| B1 | anonymous | `views: old + 2` | allowed |
| B2 | anonymous | `views: 1000000` | allowed |
| B3 | anonymous | `views: old − 1` | allowed |
| B4 | anonymous | `likes: old + 1` | allowed |
| B5 | anonymous | `upvotes: old + 1` | allowed |
| B6 | signed-in | `likes: old + 5` | allowed |
| B7 | signed-in | `views: old + 1, likes: old + 1` in one write | allowed |
| B8 | signed-in, not author | `authorUid: caller, title: "x"` | **allowed — takeover** |
| B9 | author | `views: 0` (edit with stale counters) | allowed |
| B10 | author | `score: 99` | allowed |
| B11 | author | `trend: 1e6` | allowed |
| B12 | author | `authorUid: someoneElse` | allowed |
| B13 | signed-in | create with `views: 500` | allowed |
| B14 | signed-in | create with `trendBase: 0` | allowed |

### Must succeed

| # | Caller | Write |
|---|---|---|
| A1 | anonymous | `views: increment(1)` |
| A2 | signed-in | `likes: increment(1)`, then `increment(-1)` |
| A3 | signed-in | `upvotes`/`downvotes` ±1 |
| A4 | signed-in | `comments` ±1 |
| A5 | author | edit title, steps, `isDraft`, `timeCreated`, `timeUpdated` without counter keys |
| A6 | signed-in | create with every counter and score at 0 (editor, remix and import payloads) |
| A7 | author | delete |
| A8 | anonymous | `upvotes: increment(1)` on a build that has no `upvotes` field → **refused** (needs sign-in), and as signed-in → succeeds (missing reads as 0) |

## `contributors/{uid}` — the counter branch only

```
update (stat):
    changed keys == [viewCount] ∧ new == old + 1                          anyone
  ∨ changed keys == [viewCount] ∧ new <  old ∧ caller == uid              owner
  ∨ changed keys == [boCount]   ∧ new == old ± 1 ∧ caller == uid          owner
```

The profile-field branch and the repair `create` are unchanged.

| # | Caller | Write | Expect |
|---|---|---|---|
| C1 | anonymous | `viewCount: +1` | succeed |
| C2 | anonymous | `viewCount: +1000` | refuse |
| C3 | owner | `viewCount: −340` | succeed |
| C4 | other | `viewCount: −1` | refuse |
| C5 | other | `boCount: +1` | refuse |
| C6 | owner | `boCount: ±1` | succeed |
| C7 | owner | `boCount: +3` | refuse |
