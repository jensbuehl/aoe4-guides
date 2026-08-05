# 021 — Economy lines (collapsible)

Handoff package for the villager-distribution chart, resolved to **one** shape after five
alternatives were mocked and tested:

> A **collapsed-by-default disclosure** inside the existing `AgeTimeline.vue` card that reveals
> **four unstacked lines — absolute villagers on food / wood / gold / stone over time**, on the
> timeline's own x-scale.

| File | What it is |
|---|---|
| `spec.md` | The feature spec (scope, user stories, FRs, success criteria, open questions) |
| `design-input.md` | Resolved values — tokens, geometry, the series algorithm, copy |
| `tasks.md` | Ordered, checkable implementation tasks |
| `assets/Eco Shape Proposal.html` | Archival mock — all six options, including the rejected ones |

## Why this shape, in one paragraph

The pitch was a stacked-area sparkline. Mocked against three real archetypes (boom / feudal
all-in / stone build), stacking **failed the read test**: every band above food inherits food's
climb, so only the top edge has a readable gradient, and the three archetypes looked nearly
identical. Unstacking fixes it — each resource gets its own baseline, so slope is real and
crossings become events. Dropping the total-villager line (already printed on every age marker)
freed the top half of the plot. And making it a disclosure row removes the feature's biggest
objection: it no longer has to justify permanent vertical space above a build order that is
already near the fold.

**Rejected, with reasons, in the mock:** separate sparkline card (two x-axes a card apart),
discrete columns (literal but weak silhouette), per-age split bars (no spikes), stacked area
(the original pitch), list-card sparkline (unreadable at 112 px).
