# Contract: Home Snapshot

**Feature**: `037-contributor-spotlight`

`home/home` is the single document the home page reads. This contract covers only what this feature
adds; the existing fields are unchanged and are documented here for completeness.

**Producer**: `functions/builds/updateHomeSnapshot.js`, scheduled `0 */6 * * *`.
**Consumer**: `src/views/Home.vue` via `getHomeSnapshot()`.

---

## Added field

```jsonc
{
  "featuredContributor": {
    "id": "zZqq3rZZJZdKPN5TFWBr6jNzJRS2",
    "authorId": "zZqq3rZZJZdKPN5TFWBr6jNzJRS2",
    "displayName": "Valdemar",
    "icon": "https://…",        // may be absent
    "boCount": 34,
    "viewCount": 121043,
    "bio": "…",                 // may be absent
    "youtube": "@valdemar",     // may be absent
    "rank": 2                   // may be absent
  }
}
```

Or, when nobody is nominated or the uid does not resolve:

```jsonc
{ "featuredContributor": null }
```

---

## Producer obligations

1. **Read the nomination from `FEATURED_CONTRIBUTOR`**, a module constant. An empty string means
   "nobody".
2. **Fetch that one document.** If the uid is empty, or the document does not exist, set
   `featuredContributor` to `null`.
3. **Write `null` explicitly.** The document is written with `{ merge: true }`; omitting the field
   would leave a previous spotlight in place indefinitely, which is the failure mode where an
   un-nomination silently does nothing.
4. **Never throw on a bad nomination.** A mistyped uid must produce `null` and a completed run, not
   a failed run that also leaves the rest of the snapshot stale.
5. **Populate it independently of `topContributors`.** The two are unrelated queries and may name
   the same person; neither suppresses the other.
6. **Spread the whole contributor document**, as `topContributors` already does. Every field on it
   is public by intent, so there is no picking to do — unlike `pickBuildFields`, which exists to
   trim build documents.

### Rank maintenance, same run

7. After computing the new top eight, **write `rank` (1-based)** onto each of those contributor
   documents.
8. **Read the previous `home/home`** before overwriting it, and **delete `rank`** from any uid that
   was in the old `topContributors` but is not in the new one. Without this step a contributor who
   drops out keeps a badge forever.
9. Rank writes must not fail the run. A contributor document that vanished between the query and the
   write is not an error condition.

**Cost per run**: 1 read (previous snapshot) + 1 read (featured contributor) + up to 16 writes
(8 set, 8 cleared), four times a day.

---

## Consumer obligations

1. **Treat `null` and absent identically.** A snapshot written before this feature shipped has no
   such field at all, and the first run after deploy is up to six hours away.
2. **Render nothing** — no card, no skeleton, no placeholder — when there is no featured contributor
   (FR-004, acceptance scenario 6).
3. **Tolerate every field but `id`/`authorId`/`displayName` being absent** (SC-009).
4. **Make no additional request** to fill anything in. If a value is not in the snapshot, it is not
   shown. This is the field's entire reason for existing (FR-013, SC-001).
5. **Do not use `featuredContributor` to alter `topContributors`.** The sidebar list is unchanged,
   including when it contains the same person (FR-027).

---

## Compatibility

| Situation | Behaviour |
|---|---|
| Frontend deployed, function not yet | No `featuredContributor` key. Consumer renders no spotlight. Safe. |
| Function deployed, frontend not yet | Extra key ignored by the old client. `rank` sits unused on contributor documents. Safe. |
| Neither deployed | Unchanged site. |

The two deploys are independent and may happen in either order — which matters here because they run
on different pipelines: the frontend on a Netlify push, the function by hand.
