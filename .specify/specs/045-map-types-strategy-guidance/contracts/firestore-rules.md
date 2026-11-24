# Contract: map and strategy values on `builds/{id}`

This adds to the build cases in `.specify/specs/040-fair-trending/contracts/firestore-rules.md` and
`.specify/specs/042-vote-integrity/contracts/firestore-rules.md`. The tests are in
`tests/rules/facets.rules.test.mjs`.

**Test-first rule** (CLAUDE.md): every **F-refuse** case must fail against the currently deployed
rules (`RULES_FILE=<copy>`), which shows it covers a hole, and then pass against the new ones.

## Must be refused

| id | actor | write | why |
|---|---|---|---|
| F1 | author | create with `map: "Open"` | not an allowed map |
| F2 | author | create with `map: ""` | map is required |
| F3 | author | create with no `map` key | map is required |
| F4 | author | create with `strategy: "Aggression"` | not an allowed strategy |
| F5 | author | create with `strategy: null` | null is not the empty string (the normaliser sends `""`) |
| F6 | author | update an allowed build to `map: "Closed"` | edits are checked too |
| F7 | author | update an allowed build to `strategy: "Feudal Rush"` | normalisation is the client's job; the rule accepts only canonical values |
| F8 | author | create with `strategy: "fast castle"` | case matters in storage |

## Must succeed

| id | actor | write |
|---|---|---|
| F9 | author | create with each of `Land`, `Water`, `Hybrid` |
| F10 | author | create with each of the six strategies and with `""` |
| F11 | author | create with no `strategy` key (reads as empty) |
| F12 | author | update title only, on a build with allowed values |
| F13 | anyone | `views` +1 on a build whose stored `map` is `"Open"` (legacy). Counter writes are not value-checked (FR-015). |
| F14 | signed-in, verified | like (batched with own favorites list) on a build with a legacy `strategy`. Same reason as F13. |

## Unchanged

Every existing case in the 040 and 042 contracts must still pass.
