# Contract: Firestore rules for likes, upvotes and the account's lists (042)

Extends `.specify/specs/040-fair-trending/contracts/firestore-rules.md`, which stays the contract for
everything else on `builds/{id}`. Where the two disagree about `likes`, `upvotes` or `downvotes`, this
one wins; the 040 cases it replaces are listed at the end and must be updated in
`tests/rules/builds.rules.test.mjs`.

New cases go in `tests/rules/votes.rules.test.mjs`. **Write each refused case first and run it against
the deployed rules (`RULES_FILE=<copy of the deployed rules>`): it must fail there — the deployed rules
allow the write — before it passes against the new ones.**

## `builds/{id}` — counter branch, likes and upvotes

```
FAV(uid)   = /favorites/{uid}
LIST       = likes → "favorites", upvotes → "upvotes"
before(L)  = exists(FAV) ? get(FAV).L : []
after(L)   = getAfter(FAV).L

likes | upvotes   +1   signed in ∧ email_verified
                       ∧ id ∉ before(LIST) ∧ id ∈ after(LIST)
                  −1   signed in
                       ∧ id ∈ before(LIST) ∧ id ∉ after(LIST)
                       ∧ new value ≥ 0
downvotes         any change refused
```

Exactly one key changes per write, as in 040.

## `favorites/{uid}`

```
read:           caller == uid
delete:         refused (account cleanup uses the Admin SDK)
create, update: caller == uid
                ∧ changed keys ⊆ {favorites, upvotes, lastChange}        (downvotes frozen)
                ∧ at most one of favorites / upvotes changed
                ∧ if one changed (call it L, with C its counter, id = lastChange.buildId):
                    lastChange.list == L
                    add:    after(L) as set == before(L) as set ∪ {id}, id ∉ before(L)
                            ∧ email_verified
                            ∧ build id exists ∧ getAfter(build).C == get(build).C + 1
                    remove: after(L) as set == before(L) as set ∖ {id}, id ∈ before(L)
                            ∧ ( ¬exists(build)
                              ∨ get(build).C ≤ 0 ∧ getAfter(build).C == get(build).C
                              ∨ getAfter(build).C == get(build).C − 1 )
```

`before(L)` on a create is `[]`. A write that changes no list (e.g. `createUserFavorites`' empty
`arrayUnion()`) is allowed.

## Cases

Callers: `alice` (verified), `una` (signed in, unverified), anonymous. Build `b1` seeded with
`likes: 3, upvotes: 5, downvotes: 1`; `b0` with `likes: 0`; `gone` does not exist.

### Must succeed

| # | Caller | Write (one batch) |
|---|---|---|
| V1 | alice | b1 `likes +1` + favorites `arrayUnion(b1)`, lastChange favorites/b1 — favorites doc did not exist (merge creates it) |
| V2 | alice (b1 already in favorites) | b1 `likes −1` + favorites `arrayRemove(b1)` |
| V3 | alice | same as V1/V2 for `upvotes` and the `upvotes` list |
| V4 | alice (`gone` in favorites) | favorites `arrayRemove(gone)` alone |
| V5 | alice (b0 in favorites, b0 `likes: 0`) | favorites `arrayRemove(b0)` alone |
| V6 | una (b1 in favorites) | b1 `likes −1` + `arrayRemove(b1)` — taking back stays open to unverified |
| V7 | alice | favorites `set({favorites: arrayUnion()}, merge)` — no list change |
| V8 | alice (list holds b1 twice, legacy) | b1 `likes −1` + `arrayRemove(b1)` |

### Must be refused

| # | Caller | Write | Deployed rules |
|---|---|---|---|
| X1 | alice | b1 `likes +1` alone | allowed |
| X2 | alice (b1 already in favorites) | b1 `likes +1` + `arrayUnion(b1)` | allowed |
| X3 | alice (b1 in favorites) | favorites `arrayRemove(b1)` alone, b1 `likes` 3 | allowed |
| X4 | alice | favorites `arrayUnion(b1)` alone | allowed |
| X5 | alice | b1 `likes −1` alone (b1 not in her list) | allowed |
| X6 | alice | b1 `likes +1` + favorites of **bob** `arrayUnion(b1)` | refused (bob's doc) |
| X7 | alice | b1 `likes +1` + `arrayUnion(b1, b2)` | allowed |
| X8 | alice | b1 `likes +1` + `arrayUnion(b2)`, lastChange b1 | allowed |
| X9 | una | b1 `likes +1` + `arrayUnion(b1)` | allowed |
| X10 | alice | b1 `downvotes +1` | allowed |
| X11 | alice (b1 in downvotes) | favorites `arrayRemove` from `downvotes` | allowed |
| X12 | alice | delete `favorites/alice` | allowed |
| X13 | alice (b0 in favorites, `likes: 0`) | b0 `likes −1` + `arrayRemove(b0)` | allowed |
| X14 | alice | b1 `likes +1` + `upvotes +1`… (two keys) | refused (040) |
| X15 | alice | b1 `likes +1` + favorites `arrayUnion(b1)` **and** `upvotes: arrayUnion(b1)` | allowed |
| X16 | anonymous | b1 `likes +1` | refused (040) |
| X17 | alice | b1 `likes +1` + b2 `likes +1` + favorites `arrayUnion(b1)` (two builds, one list change) — FR-010 | allowed (each step alone is) |

### `trendWeights` (server-owned, US5) — in `tests/rules/builds.rules.test.mjs`

| # | Caller | Write | Deployed rules |
|---|---|---|---|
| B15 | author | update `trendWeights: 2` | allowed |
| B16 | anyone | create a build carrying `trendWeights` | allowed |

Both refused now. (B13/B14 were already taken by 040.)

## 040 cases this changes

| 040 case | Was | Now |
|---|---|---|
| B4, B5 (anonymous likes/upvotes +1) | refused | refused (unchanged; still listed in 040) |
| A2 (`likes` +1 then −1, bare) | allowed | **refused** → replaced by V1/V2 |
| A3 (`upvotes`/`downvotes` ±1, bare) | allowed | **refused**; upvotes → V3, downvotes → X10 |
| A8 (`upvotes` +1 on a build without the field) | allowed when signed in | allowed only as a V3 batch |
