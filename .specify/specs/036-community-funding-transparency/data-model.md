# Phase 1 Data Model: Community Funding Transparency

**Feature**: `036-community-funding-transparency` | **Date**: 2026-08-13

No Firestore collection is added, no existing document gains a field, and no security
rule changes. Every entity below lives in a module bundled with the application — see
[research.md](research.md) R1 for why the footer's placement forces this.

The goal is stated **per calendar year**. That choice removes an entire layer of modelling:
because a yearly target counts money that actually arrived, there are no plans, no net
rates per arrangement, and no question of what a one-off tip is worth. Every euro counts
the same regardless of how it came in.

---

## Entity: Funding Constants

Deploy-time values (FR-001a, FR-023). Changed once a year.

| Field | Type | Meaning |
|---|---|---|
| `year` | number | The calendar year being counted. Set by hand — a rollover is a decision, never a side effect of the date changing (FR-013c). |
| `costPerYearEur` | number | The stated approximate running cost for that year. Presented as an approximation, never to the cent. |
| `coveredEur` | number | Net total received towards that year. **The one hand-typed figure**, updated in the same edit as the supporter list (FR-001c, FR-008). |

**Validation**: `year` a four-digit calendar year; `costPerYearEur` positive; `coveredEur`
zero or positive.

**Placeholders**: `costPerYearEur` (~240) and `coveredEur` until the maintainer confirms
them.

**Why `coveredEur` is stored rather than derived**: deriving it would require a per-person
amount, and the configuration ships to the browser — so those amounts would be public the
moment they were written down, whether or not any template rendered them (FR-001d). The
per-person record stays at the payment provider, which already holds it. This trades a
derived figure for a typed one; the trade is bounded by requiring both to change in the
same edit, so the total can lag reality but can never contradict the names beside it.

---

## Entity: Supporter Entry

One per person who has contributed during `year`. The maintained list is the entire job
(FR-013, FR-024).

One per person who contributed during `year`. It records **who**, never **how much**.

| Field | Type | Required | Meaning |
|---|---|---|---|
| `name` | string \| absent | no | The name the person supported under, copied from the payment dashboard. **Absent** means the contribution was private or they asked not to be named. |
| `anonymous` | boolean | no | Marks an entry that deliberately has no name, so it reads as intentional rather than as a missing field. Carries no private information — there is nothing to hide once amounts are not stored. |
| `uid` | string \| absent | no | Site user id, present **only** where the supporter volunteered their username of their own accord (FR-019, FR-019a). |

**Validation**:

- `name`, when present, non-empty after trimming (FR-016).
- Every entry has either a `name` or `anonymous: true`; an entry with neither is a mistake,
  not an anonymous supporter.
- `uid`, when present, a plausible Firebase uid. A `uid` matching nobody is harmless — it
  simply never renders — which is what makes the deletion lag in research R9 tolerable.

**No amount field exists** (FR-001d). Not "an amount that is never rendered" — no amount at
all. The configuration is delivered to every visitor's browser, so anything written here is
public regardless of what the page draws. Storing a per-person figure and declining to
display it would leak exactly what it claimed to protect.

**The anonymity rule** (FR-015, FR-014a, research R3): a supporter whose contribution was
private, or who asked not to be named, has **no `name`** — only `anonymous: true`. They
still occupy an entry, so the supporter count remains accurate (FR-013a), and there is
nothing beside the flag to give them away.

---

## Entity: Earlier Supporter

Names only, from years before `year` (FR-013b).

| Field | Type | Required | Meaning |
|---|---|---|---|
| `name` | string | yes | As above. Anyone who could not be named is simply not in this list — there is nothing to count here, so an entry without a name would carry no information. |

**Grows at each rollover and never shrinks** (FR-013d). This is what stops the wall from
appearing to lose people every January.

---

## Derived: Funding Status

Computed on demand. **Never stored** (FR-001b), which is what makes it impossible to go
stale (FR-008).

| Value | Derivation |
|---|---|
| `year` | `FUNDING.year`, passed through |
| `costEur` | `costPerYearEur`, passed through |
| `coveredEur` | `FUNDING.coveredEur`, passed through — hand-set, not summed |
| `supporterCount` | number of supporter entries, including anonymous ones — **derived**, so it can never disagree with the wall |
| `shortfallEur` | `max(0, costEur − coveredEur)` |
| `isCovered` | `coveredEur >= costEur` |

**State the display must handle** (FR-005, FR-006, and the Over-coverage and rollover edge
cases):

| State | Condition | Required reading |
|---|---|---|
| Empty | `supporterCount === 0` | An invitation, never a failure notice. This is what a fresh January looks like. |
| Partial | `0 < coveredEur < costEur` | A concrete shortfall for the named year, not an open-ended plea |
| Covered | `coveredEur >= costEur` | Celebration and thanks; no shortfall shown, no bar pinned at 100% reading like an error |

The year is named in every state (FR-004), which is what keeps a fresh January from
reading as data loss.

---

## Derived: Supporter Id Set

The set of `uid` values present across supporter entries, built once at module load.

Used by `isSupporter(uid)` for the badge (FR-020) and for suppressing the focus-mode ask
(FR-026). A set rather than a scan because it is consulted once per rendered card and once
per comment.

**Scope note**: only current-year entries carry a `uid`, so a badge reflects support this
year. Someone who supported in 2025 and not since is thanked on the wall but carries no
badge — which is the honest reading of both.

---

## Derived: Wall Lists

Two lists for the About page (FR-014):

| List | Entries | Reads as |
|---|---|---|
| `supporters` | current-year entries that have a `name`, in file order | People who have contributed this year |
| `earlierSupporters` | the earlier-supporters list | People who contributed in previous years |

Anonymous entries are excluded from the first list and still counted in `supporterCount` —
that is the whole of the anonymity mechanism.

**Collision** (edge case): two supporters may share a display name. Both must render and
both must count; the list must not de-duplicate by name. Keying by array position is
sufficient and is what the existing `contributors` list in `src/views/About.vue:132`
already does.

---

## What is deliberately absent

- **No Firestore collection.** See research R1.
- **No field on any existing document.** See research R2 — `BuildListCard` holds only the
  build document, so a per-user field would cost one read per card.
- **No custom claim.** A claim is readable only by its owner and the badge must render for
  other visitors, including signed-out ones.
- **No security rule change.** There is no client write path to guard; the list changes by
  commit only (FR-022).
- **No account-deletion trigger.** A stale `uid` matches nobody and renders nothing
  (research R9, amended FR-021c).
- **No plan or arrangement field, and no net-rate constants.** The yearly framing made them
  unnecessary; a euro is a euro whenever it arrived within the year.
- **No per-person amount, anywhere.** The bundle is the privacy boundary, not the rendered
  page. Whatever is stored here is readable by every visitor.
- **No automatic year rollover.** Deliberate (FR-013c) — a goal that empties itself at
  midnight looks like a defect.
