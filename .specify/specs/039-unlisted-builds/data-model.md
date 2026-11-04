# Data Model: Unlisted Builds, Earned by Sharing

**No stored data changes.** No new fields, no migration, no Firestore rule change, no index change.

## Build (existing, unchanged)

| Field | Meaning | Change |
|---|---|---|
| `isDraft: boolean` | `true` = **unlisted** (reachable by link, left out of every list, search, snapshot and sitemap). `false` = **published**. | Name only: shown to users as "Unlisted". The stored field keeps its name (spec FR-013, research R6). |
| `authorUid` | Owner, used for both counts | none |

### State transitions

```text
              Save as unlisted (new)            ── allowance checked
   (none) ──────────────────────────────▶ unlisted
   (none) ──────── Publish / Save ──────▶ published

   published ─── Save as unlisted (edit) ──▶ unlisted   ── allowance checked (new in this feature)
   unlisted  ─── Save as unlisted (edit) ──▶ unlisted   ── never checked
   unlisted  ─────────── Publish ──────────▶ published  ── never checked
```

## Unlisted allowance (derived, never stored)

```text
allowance(published) = min(CAP, BASE + floor(published / PER_PUBLISHED))
BASE = 10, PER_PUBLISHED = 2, CAP = 50
```

| Published | Allowance |
|---|---|
| 0–1 | 10 |
| 2–3 | 11 |
| 30–31 | 25 |
| 80 and above | 50 |

Validation: a published count that isn't a finite, non-negative number counts as 0 (FR-007).
A save is refused when `unlistedCount >= allowance`. Existing unlisted builds above the allowance
are never touched (FR-004).

## Robots signal on the build page (derived, never stored)

`<meta name="robots" content="noindex">` is in `document.head` exactly while the build page shows a
build with `isDraft === true`. See research R4.
