# Contract: Firestore rules for remix lineage (044)

Tested in `tests/rules/lineage.rules.test.mjs`. Every refusal is first shown to
**pass** against the deployed rules (`RULES_FILE=<copy of live>`), which proves
the hole is real, and then to fail against the new ones (see CLAUDE.md).

## Changes

- `serverOwned()` gains `duplicateOf`, `stepsHash`, `stepsSince`,
  `remixCredit` and `remixes`. Transcribe the same five fields into
  `NON_EDITABLE_FIELDS` in `buildService.js`.
- **On create**: `duplicateOf` may be absent or `null`, and nothing else.
  `stepsHash`, `stepsSince`, `remixCredit` and `remixes` must be absent.
- `remixOf` is unchanged: the author may write it, as today.

## Cases

| Id | Who | Write | Expect |
|---|---|---|---|
| L1 | author | create a build with `duplicateOf: null` | allowed |
| L2 | author | create without `duplicateOf` (an old cached client) | allowed |
| L3 | author | create with `duplicateOf: { id: "x", … }` | **refused** |
| L4 | author | create with `remixCredit: 5`, or with `remixes`, `stepsHash` or `stepsSince` (one case each) | **refused** |
| L5 | author | update their build, changing `duplicateOf` from `{…}` to `null` (un-hiding it themselves) | **refused** |
| L6 | author | update `remixCredit`, `remixes`, `stepsHash` or `stepsSince` (one case each) | **refused** |
| L7 | author | update title and steps, with none of the L5 or L6 fields in the payload | allowed (an ordinary save) |
| L8 | author | update `remixOf` to point at another build | allowed (bounded by the credit rule: one credit per account) |
| L9 | another user | update any of the L5 or L6 fields on someone else's build | **refused** (already refused before 044, because only the author may update a build; kept to catch a regression) |

The existing A, B and V cases keep passing. In particular, B15 and B16
(`trendWeights`) carry over unchanged.
