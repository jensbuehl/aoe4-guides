# Contract: Contributor Profile Fields

**Feature**: `037-contributor-spotlight`

The interface between a signed-in contributor and their public profile. Both parties to this
contract are untrusted with respect to each other: the form cannot be relied on by the server, and
the server's rejection must be explainable by the form.

---

## Write contract — `contributors/{uid}`

### Who may write

| Actor | May change | Enforced by |
|---|---|---|
| Anonymous client | `boCount`, `viewCount` | existing rule, unchanged |
| Signed-in owner | `icon`, `bio`, `youtube`, `twitch`, `aoe4world`, and `authorId` pinned to their own uid | extended owner rule |
| Anyone else | nothing | ownership check |
| Admin SDK (functions) | anything, incl. `rank` | rules bypassed |

### Rule

```
match /contributors/{contributor} {
  allow read;

  // Unchanged: anonymous stat increments.
  allow update: if request.resource.data.diff(resource.data).affectedKeys()
                     .hasOnly(['boCount', 'viewCount']);

  // Extended: the owner's own presentation.
  //
  // `authorId` is in the key list because the profile write sends it, and a
  // record old enough to lack the field would otherwise show it as an
  // unexpected change and be refused. Pinned when present, so including it
  // grants nothing — and guarded with `in` rather than required outright, so
  // that the avatar write, which does not send it, still works against such a
  // record.
  allow update: if request.auth != null
                && request.auth.uid == contributor
                && request.resource.data.diff(resource.data).affectedKeys()
                     .hasOnly(['authorId', 'icon', 'bio', 'youtube', 'twitch', 'aoe4world'])
                && (!('authorId' in request.resource.data)
                    || request.resource.data.authorId == contributor)
                && profileFieldsValid();

  // New: the owner may bring their own record into existence.
  // See research R10 — every live account already has one, but a write against
  // a missing document is a create, and would otherwise fail with an error the
  // contributor has no way to act on.
  allow create: if request.auth != null
                && request.auth.uid == contributor
                && request.resource.data.keys()
                     .hasOnly(['authorId', 'icon', 'bio', 'youtube', 'twitch', 'aoe4world'])
                && request.resource.data.authorId == contributor
                && profileFieldsValid();
}

function profileFieldsValid() {
  return (!('bio' in request.resource.data)
          || (request.resource.data.bio is string
              && request.resource.data.bio.size() <= 180))
      && (!('youtube' in request.resource.data)
          || (request.resource.data.youtube is string
              && request.resource.data.youtube.matches(
                   '^(UC[A-Za-z0-9_-]{22}|@[A-Za-z0-9._-]{3,30})$')))
      && (!('twitch' in request.resource.data)
          || (request.resource.data.twitch is string
              && request.resource.data.twitch.matches('^[A-Za-z0-9_]{4,25}$')))
      && (!('aoe4world' in request.resource.data)
          || (request.resource.data.aoe4world is string
              && request.resource.data.aoe4world.matches('^[0-9]{1,20}$')));
}
```

**Four things this rule must keep true, and how each is achieved:**

1. *Anonymous view counting keeps working.* The first clause is untouched. `rank` is absent from
   every key list, so no client can write it — on create or update.
2. *Clearing a field is permitted.* A `deleteField()` write removes the key from
   `request.resource.data`, so `!('bio' in …)` short-circuits to allow. A bare `size()` check would
   reject the exact operation FR-019 requires.
3. *The pattern is anchored.* `matches()` is RE2 and is **not** implicitly anchored. Without `^…$`,
   `https://evil.example/@x` matches the handle branch and the whole of SC-008 is lost.
4. *A created document cannot forge identity or statistics.* `create` uses `keys().hasOnly(…)` —
   the whole document, not a diff, because there is no prior document to diff against — and pins
   `authorId` to the path. `boCount`, `viewCount`, `displayName` and `rank` are all excluded, so a
   client cannot bootstrap itself a record with a name it did not earn or a view count it did not
   receive.

> **`create` is a repair path, not a normal one.** Both the auth trigger and the display-name
> callable already create this document on the Admin SDK. A contributor reaching this clause has an
> account whose setup never completed — which is why the clause deliberately cannot supply a
> `displayName`, and why consumers must refuse to render a contributor without one.

### Accepted values

| Field | Accepted | Rejected |
|---|---|---|
| `bio` | any string ≤ 180 chars, or field deletion | > 180 chars; non-string |
| `youtube` | `UC` + 22 of `[A-Za-z0-9_-]`; `@` + 3–30 of `[A-Za-z0-9._-]`; or field deletion | any URL; bare words; video ids; `/c/` or `/user/` names; anything unanchored |
| `twitch` | 4–25 of `[A-Za-z0-9_]`; or field deletion | any URL; hyphens; `/videos/…` and `/directory/…` paths |
| `aoe4world` | 1–20 digits; or field deletion | any URL; the `id-Name-Slug` form; non-`/players/` paths |

### Client obligations before writing

These are the form's job. None of them is a substitute for the rule above; they exist so the user
sees a sensible message rather than a permission error.

1. Normalise the bio: collapse whitespace runs to single spaces, trim.
2. If the normalised bio is empty, write a field deletion — never `""`.
3. Reject a bio over 180 characters, and show the remaining allowance while typing. **The displayed
   allowance must count the same way the rule counts** — see the note below.
4. Accept a pasted profile URL in the **input** by extracting the identifier from it, then store
   only the extracted value. A URL that yields none is rejected with an explanation.
5. If a link is cleared, write a field deletion.
6. Write `authorId` alongside the fields and use a merging write, so that a missing document is
   created rather than erroring (R10).

> **The counter and the rule must agree.** The form counts with JavaScript `String.length` (UTF-16
> code units); the rule counts with Firestore `size()`. For emoji these can differ — `"👍".length`
> is 2 in JavaScript. Measure which unit `size()` applies **before finalising the counter**, then
> make the client count that way. Never the reverse: the rule is the boundary and cannot be relaxed
> to match a counter. If the counter is the more permissive of the two, a contributor sees
> "180/180" and gets `permission-denied` with nothing to act on.

> Point 4 is a convenience, not a relaxation: contributors will paste a URL because that is what
> they have. Extraction happens before the write, and what is stored is still only an id or a
> handle. If extraction is ambiguous, reject rather than guess.

---

## Read contract — what consumers may assume

| Assumption | Holds because |
|---|---|
| `bio`, when present, is a non-empty single-line string ≤ 180 chars | normalisation on write + rule |
| `bio` is safe to interpolate | Vue escapes `{{ }}`; no consumer may use `v-html` |
| each link, when present, matches its own anchored pattern | rule |
| a rendered link points at the site it names | the URL is built, never stored |
| `rank`, when present, is 1–8 | only the scheduled function writes it |
| Absent means absent | empty values are deleted, never stored blank |

Consumers must tolerate **every** field except `authorId` being absent — including `displayName`.
A contributor who has written a build order but never opened their account page has no `icon`, no
`bio`, no links and no `rank` (SC-009).

**One field is not merely tolerated but required to render**: a contributor with no `displayName`
MUST NOT be presented at all — no spotlight card, no author header. A card showing a face, a bio and
no name is broken, and the `create` clause above makes such a document reachable for the first time.
The existing `v-if` on the author header already has this effect by accident, because a missing
document yields `null`; after this change it has to be intentional.

---

## Link URL construction

```
youtube    UCxxxxxxxxxxxxxxxxxxxxxx  →  https://www.youtube.com/channel/UCxxxxxxxxxxxxxxxxxxxxxx
youtube    @handle                   →  https://www.youtube.com/@handle
twitch     name                      →  https://www.twitch.tv/name
aoe4world  2942077                   →  https://aoe4world.com/players/2942077
any        anything else             →  no link rendered
```

The last row is not defensive padding. It is what makes the invariant hold if the rule is ever
loosened by mistake: a value that does not match a known shape produces no link at all, rather than
a link somewhere unexpected.

Rendered with `target="_blank" rel="noopener"`, matching the outbound links in `EventBanner.vue`.

---

## Deletion contract

On `deleteUser`:

| Field | Fate | Why |
|---|---|---|
| `bio`, `youtube`, `twitch`, `aoe4world` | **deleted** | The author can no longer edit or withdraw them, and they could still be published on the home page. |
| `displayName`, `icon`, `boCount`, `viewCount`, `rank` | survive | Published build orders keep their attribution — the existing, deliberate behaviour recorded in `deleteUser.js`. |

The contributor document itself is **not** deleted. That remains correct and must not change.
