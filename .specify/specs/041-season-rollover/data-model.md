# Data Model: Season Rollover

There are no Firestore changes. Builds keep storing `season` as a title string, which is what
`queryParameterBuilder.js` filters with `where("season", "in", …)`. Everything below lives in the
client bundle.

## Hand-written season entry (source, in `seasonDefaultProvider.js`)

| Field | Required | Meaning |
|---|---|---|
| `title` | yes | `"Season N"`. N is consecutive. This string is stored on builds, so it never changes once used. |
| `tagline` | yes | The update name (Seasons 1–12) or the time of year (`"Fall 2026"`). |
| `expansion` | no | The expansion released during the season. |
| `startDate` | yes | Local midnight of the first day. |
| `endDate` | no | Local midnight of the last day. **Set only when the season broke the schedule**: ran past or stopped short of the next scheduled start, or the season after it is not hand-written and should not start on schedule. |

The entries are ordered newest first. They must not be mutated, because `buildSeasons` copies them.

## Season (built, as exposed by `seasons.value`)

The same fields, except that `endDate` is always present. It is resolved by R3: the entry's own value, or
the day before the next entry starts, or the day before the next scheduled start. A calculated entry carries
no marker. Nothing needs to tell the two kinds apart.

**Invariants**, enforced by `check:seasons`:

- newest first, and contiguous: `next.startDate` is the day after `prev.endDate`;
- no entry with `startDate > now`;
- titles consecutive, ending at the newest visible one;
- entries up to Season 14 have the same `startDate` and resolved `endDate` as before the feature.

## Schedule (constant)

| Start month (0-based) | Name |
|---|---|
| 2 (Mar) | Spring |
| 5 (Jun) | Summer |
| 8 (Sep) | Fall |
| 11 (Dec) | Winter |

Every season starts on day 1 of one of these months. Since Update 16.1.9737 the schedule holds from
Season 14 onward.

## Lifecycle of a season

```text
(not yet started) ── start day arrives ──▶ current ── next season's start day ──▶ past
     hidden everywhere                    default for new builds        listed, never default
```

A calculated season becomes hand-written only if the owner chooses to write it: to add an expansion or to
record a break. Nothing persists the calculated list. It is rebuilt on every page load from the visitor's
clock.
