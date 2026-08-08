# Design input — 027 Build Order Alternatives

Decisions made during the design exploration, with the reasoning, so implementation does not have
to re-litigate them. Source: the *Branch Annotations* canvas; the HTML is not checked in, so the
frame captures in `assets/` — inlined in `spec.md` — are the record.

## The model

**One primitive.** Sub-branch and full fork are the same thing: a bracketed run of steps. A "fork"
is just a block whose closing marker sits at the end of the final section. The author never chooses
between two features.

**Rejoin is positional, not a pointer.** The block ends at its closing marker; the next step is
common again. Nothing can dangle or desync.

**Bounded by its section, not extended to it.** A block opens and closes inside one age section, and
steps may follow it before the age-up — the paths usually *should* rejoin before the age boundary.
This is why the closing marker is a real item rather than implicit.

**No main line by default.** Nobody declares a main line when writing a build down. An optional
`main` boolean on one path is the only thing that switches the reader from a pick-one control to a
collapsed detour. Same data, one boolean apart.

**Each path owns its timings.** Nothing after the block is re-timed; the common steps keep the times
the author wrote.

## Colour

Gold is already spoken for — ages, timings, primary actions. Alternatives use the brand's other
colour, **secondary** (`#294790`).

> Gold means *where you are in the build*. Blue means *which way you went*.

This is a decision, not an accident. It is also why the focus-mode pick is **not** the default gold
button: a gold button beside a gold age plate would claim the two are the same kind of thing.

The branch mark is `mdi-call-split` everywhere and `mdi-call-merge` for the close — never a rotated
split. The mark is the secondary colour on any neutral surface, and inherits only where it sits on a
filled secondary surface (selected chip, path bar) where blue-on-blue would vanish. Disabled menu
entries grey out whole, mark included.

## Why paths need titles

The graph legend forced it. A series cannot be labelled "the branch", and a condition like
"they scout your rush with the scout at 4:00" is far too long for a legend or a table row. So each
path carries a **short plain-text title** plus a **rich description**. The title is what the legend,
the focus-mode path bar, and the desktop pick row show; the description carries the knowledge and is
spelled out in the path's first step.

Corollary: **never truncate a description into the pick row.** Titles exist so that row stays one
line.

## Why the graph draws one path at a time

Overlaying both paths doubles every resource series and the chart becomes unreadable. So: one path,
named in the legend below the chart, with the split's span shaded. Outside that span the paths are
identical, so it is the only region that differs. Switching redraws only the shaded span, so the eye
stays put.

An earlier version showed a numeric "cost of the detour" delta at the rejoin. It was cut — the paths
level out at the merge, so the delta was bloat.

## Why authoring uses two markers and no dragging

The bracket pattern mirrors the age-up and its "reached" plate, which the editor already has. It
makes ordering an insert-and-delete problem, which means:

- nothing can be left dangling,
- membership is positional (above the merge line = this path, below = common),
- drag-and-drop reordering can arrive later without a data migration.

**There is no "Close" entry in the add menu.** The merge line always exists; closing is never
something you add. Invalid entries (Age up, nested Alternatives) are shown **disabled with the
reason in a tooltip** rather than hidden, so the constraint is learnable instead of mysterious.

The add menu replaces the current bottom-anchored add buttons, which reviewers found confusing.
That conversion is a standalone improvement and can ship before the rest.

## Matchups are not a field

The icon set already has every civ, so a matchup is just a civ icon inside the description — the
same `::` token as anything else. If civ filtering is wanted later, read the civ back out of the
description tokens. No extra field, no extra picker.

## Mobile

Same components as today — step card, 5-slot resource grid, age-up plate. Only two additions: the
pick card and the path rail.

- Options **stack** at 390px, full card width, ≥44px, description on a second line. There is room
  here; there is not in the desktop row.
- The pick card's rail and the lane's rail are **continuous** — no gap.
- **Rails nest, they do not compete.** Gold age rail outside, blue path rail inside. Two rails at
  once reads correctly: "you are in Feudal, on the aggression path."
- The pick card sticks to the top while scrolling inside a path, so the active choice is never
  off-screen.
- Pick options match the step cards' width, left/right edges, radius and border.

## Focus mode

An **integration, not a new screen.** The header, progress bars, resource dock and transport
controls must not move. The pick occupies the step-content area for one beat and hands back.

The countdown exists because the clock must never stall mid-game: it falls back to `main`, else the
first path, with a length equal to the gap to the next step (capped around 10s). After picking, a
thin (~22px) bar names the active path and offers an explicit **switch** — a read at 4:10 can be
wrong, so the choice stays reversible until the rejoin.

Implementation note: the focus-mode shell is a grid; adding the path bar needs an extra row track,
not just an inserted element, or the bar stretches.

## Open questions

- **Overlay round-trip.** Flattening to the active path on export is the safe default. Round-tripping
  needs a format change and was not decided.
- **Filtering.** Whether a civ icon in a path description should feed the browse filters — data
  supports it, UX not designed.
- **Reordering.** Deferred by design, not by omission.
