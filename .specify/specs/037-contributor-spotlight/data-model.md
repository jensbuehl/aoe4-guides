# Data Model: Contributor Spotlight

**Feature**: `037-contributor-spotlight` | **Date**: 2026-08-21

No new collection. Two documents gain fields.

---

## `contributors/{uid}`

Public read (`firestore.rules`). Created by the `createContributor` auth trigger with `authorId`
only; the rest accumulates.

| Field | Type | Origin | New? | Notes |
|---|---|---|---|---|
| `authorId` | string | `createContributor` trigger | | Equals the document id. |
| `displayName` | string \| absent | `updateUserDisplayName` callable | | Shown everywhere a contributor is named. Absent only on an account whose setup never completed — such a contributor is not rendered at all (FR-032). |
| `icon` | string \| absent | owner, via `AvatarPicker` | | Resolved avatar URL. Absent means initials. |
| `boCount` | number | client increment | | Published build orders. |
| `viewCount` | number | client increment | | Cumulative reads. Any client may increment — see spec Context. |
| `bio` | string \| absent | **owner** | **yes** | ≤ 180 chars, plain text, single line. Absent when never set or cleared. |
| `youtube` | string \| absent | **owner** | **yes** | Channel id or handle. Never a URL. |
| `twitch` | string \| absent | **owner** | **yes** | Twitch login, 4–25 of `[A-Za-z0-9_]`. Never a URL. |
| `aoe4world` | string \| absent | **owner** | **yes** | Numeric player id. Never a URL, never the name slug. |
| `rank` | number \| absent | **`updateHomeSnapshot`** | **yes** | 1-based position among the top eight by `viewCount`. Absent means unranked. |

### `bio`

- **Validation**: `is string && size() <= 180`, enforced in `firestore.rules` (FR-020, SC-007). The
  form enforces the same limit and shows the remaining allowance, but the rule is the boundary.
- **Normalisation before write**: collapse all whitespace runs (including newlines) to single
  spaces, then trim. This makes the "whitespace only" and "contains newlines" edge cases the same
  case, resolved at the source rather than in each consumer's CSS.
- **Empty is absent**: a normalised empty string is written as a field deletion, never as `""`.
  Consumers therefore test presence only, and no consumer needs to also test for blankness.
- **Rendering**: ordinary interpolation. Never `v-html` — the escape is the whole of FR-021.

### `youtube`

- **Accepted forms** (anchored, RE2, identical in the module and in the rule):

  ```
  ^(UC[A-Za-z0-9_-]{22}|@[A-Za-z0-9._-]{3,30})$
  ```

- **Never stored**: a URL, a host, a path, a video id, a legacy `/c/` or `/user/` name.
- **Rendered link**: built at display time — `https://www.youtube.com/channel/{id}` for an id,
  `https://www.youtube.com/@{handle}` for a handle. The stored value cannot express a host, so no
  value a contributor is able to save can send a visitor off-platform (SC-008).
- **Recognised channel**: `true` when the stored value matches a `creatorId` in
  `src/composables/filter/featuredCreatorDefaultProvider.js`. Ids only — a handle never matches,
  because that list stores ids. A false negative here is cosmetic.

### `twitch`

- **Accepted form**: `^[A-Za-z0-9_]{4,25}$` — a Twitch login.
- **Never stored**: a URL, a host, a `/videos/…` or `/directory/…` path. Extraction accepts only a
  single-segment path, because `twitch.tv/videos/123` would otherwise yield `videos`, which passes
  the pattern and links nowhere useful.
- **Rendered link**: `https://www.twitch.tv/{login}`.

### `aoe4world`

- **Accepted form**: `^[0-9]{1,20}$` — the numeric player id, which covers both short profile ids and
  17-digit Steam ids.
- **Never stored**: a URL, or the decorative name slug. A profile address is
  `/players/2942077-VES-Valdy`; only `2942077` is kept, because the slug changes when a player
  renames and the id does not — and because `About.vue` already links aoe4world with a bare id.
- **Rendered link**: `https://aoe4world.com/players/{id}`.

### `rank`

- Written only by the scheduled function via the Admin SDK, which bypasses rules. It appears in no
  client `hasOnly` list, which is what forbids a client from writing it.
- **Cleared** for any uid in the previous top eight that is absent from the new one, so a
  contributor who drops out carries a stale badge for at most one refresh interval.
- Absent means "not in the top eight", which the header renders as nothing at all (FR-017) — not as
  "unranked".

### Lifecycle

| Event | Effect |
|---|---|
| Account created | Document created with `authorId` by the auth trigger. All new fields absent. |
| Account setup completed | `displayName` set by the callable, which also creates the document if the trigger never ran. |
| Owner edits profile | `bio` and/or any link field set or deleted. Creates the document, with `authorId` only, if it is somehow still missing (research R10). |
| Scheduled run | `rank` set on the new top eight, deleted from those who left it. |
| **Account deleted** | `bio` and every link field deleted. `displayName`, `icon`, `boCount`, `viewCount`, `rank` survive so published build orders keep their attribution (FR-029, research R4). |

---

## `home/home`

Public read. Written only by `updateHomeSnapshot` with `{ merge: true }`. Read by the client exactly
once per home page load.

| Field | Type | New? | Notes |
|---|---|---|---|
| `popularBuilds`, `allTimeClassics`, `recentBuilds` | array | | Unchanged. |
| `topContributors` | array | | Unchanged — top 8 by `viewCount`, whole documents spread. Drives the sidebar list, which stays as it is (FR-027). |
| `buildsCount` | number | | Unchanged. |
| `recentCivBuilds`, `recentVideos` | array | | Written by other routines. Unchanged. |
| `featuredContributor` | object \| `null` | **yes** | The spotlighted contributor's whole document plus `id`. `null` when unnominated or not found. |

`featuredContributor` is populated whether or not that person appears in `topContributors`; the two
are independent and may name the same person. Writing explicit `null` rather than omitting the field
matters: `{ merge: true }` would otherwise leave a previous value in place forever.

**Size**: one contributor object — well under a hundred bytes beyond what the document already
carries. It does not move the snapshot toward any limit.

---

## Nomination (not stored data)

`FEATURED_CONTRIBUTOR` — a `const` at the top of `functions/builds/updateHomeSnapshot.js`, holding a
uid or an empty string.

It is deliberately **not** a Firestore document and **not** a `src/config/` module. Research R1
records why: `functions/` is CommonJS and cannot import from `src/`, and any client-side source of
truth would force a second read on the home page for a contributor outside the top eight. A constant
keeps the choice of who is honoured in the commit history, which a console-edited document would
not.

---

## Derived values (computed, never stored)

| Value | Derived from | Where |
|---|---|---|
| Outbound link URLs | `youtube`, `twitch`, `aoe4world` | `useContributorProfile.js` |
| Which links to render | presence of each field | `useContributorProfile.js` link table |
| Recognised channel | `youtube` vs `featuredCreators` | `useContributorProfile.js` |
| Has a bio | `bio` presence | consumers |
| Formatted view count | `viewCount` | existing `useTimeSince().formatCount` |
| Event is live | dates in `src/config/event.js` | `isEventLive()` |
