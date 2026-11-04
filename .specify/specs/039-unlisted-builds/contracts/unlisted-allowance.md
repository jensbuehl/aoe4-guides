# Contract: `src/composables/builds/unlistedAllowance.js`

An import-free module, so a Node harness can test it as-is (research R1).

```js
export const UNLISTED_BASE = 10;
export const UNLISTED_PER_PUBLISHED = 2;
export const UNLISTED_CAP = 50;

/**
 * @param {number|undefined} publishedCount  the author's published builds; anything that isn't a
 *                                           finite number ≥ 0 counts as 0 (FR-007)
 * @return {number}                          10 … 50
 */
export function unlistedAllowance(publishedCount) {}

/**
 * The snackbar text for a refused save.
 * @param {number} allowance  the value unlistedAllowance returned
 * @return {string}           FR-006 wording when allowance === UNLISTED_CAP, FR-005 otherwise
 */
export function unlistedLimitMessage(allowance) {}
```

## Required results

| Input | `unlistedAllowance` |
|---|---|
| `0`, `1` | 10 |
| `2` | 11 |
| `30`, `31` | 25 |
| `79` | 49 |
| `80`, `81`, `500` | 50 |
| `undefined`, `null`, `NaN`, `-4`, `"12"` | 10 |

`unlistedLimitMessage(50)` mentions no unlocking. `unlistedLimitMessage(n)` for `n < 50` names `n`, the
1-per-2 rule and the 50 cap. Both take their numbers from the constants, never from literals.

## Call site: `BuildEditor.handleDraft`

```text
needsCheck = mode === "new" || originalBuild.isDraft === false
if needsCheck:
    [unlisted, published] = await Promise.all([getUserDraftsCount(uid), getUserBuildsCount(uid)])
    allowance = unlistedAllowance(published)
    if unlisted >= allowance: showSnackbar(unlistedLimitMessage(allowance), "error"); return
build.isDraft = true
handleSave()
```

As today, an `unlisted` value of `undefined` (count failed) does not block the save.
