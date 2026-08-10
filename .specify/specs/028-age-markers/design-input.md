# Design input — 028 Age Markers

Decisions made during the design exploration, with the reasoning, so implementation does not have to
re-litigate them. Source: the *Age Markers* canvases in `design-handoff/` — `Age Markers.html`
(current state and the three options) and `Age Markers B.html` (six frames of detail). The HTML is
checked in here because no frame captures were produced; it is a **design reference**, not
production code.

## What the analysis found

Six observations, in the order they cost a reader the most:

1. The advance is an **action**, the arrival is a **state change** — drawn identically today, so the
   list says nothing about which one you *do*.
2. Eight full-width gold bars against eleven step rows. The markers win a page they are only meant
   to organise.
3. The transition between them is a real phase with its own rules, and it is invisible.
4. The arrival carries no time — the one number a reader wants from it.
5. The boundary leans on a circled Roman numeral that cannot carry it: a near-twin of a circled
   transport glyph at 20px in gold, and Ⅱ/Ⅲ/Ⅳ differ by a single stroke.
6. "Advance to Feudal Age" / "Feudal Age reached" — the word *Age* four times in eight rows.

## The three options

**A · Asymmetry only** — the advance becomes a step row, only the arrival stays a bar, now with the
age asset and the time. Fixes 1, 2, 4, 5 and 6; touches one row type; costs nothing structurally.
Leaves 3. *Worth shipping alone if the appetite is smaller* — which is exactly why it is User Story 1
and why it does not depend on `027`.

**B · Asymmetry + transition bracket** — A, plus a gold rail down the rows between the advance and
the arrival. **Chosen.** The rail is the same vocabulary as the alternatives lane, one colour apart:
gold for *where you are in the build*, secondary for *which way you went*. Cost: one nesting level in
the renderer — already true for the alternatives block.

**C · One marker per age** — drop the advance entirely; one divider per age carrying both times.
**Rejected.** It is the cleanest list by a distance, but "up at 0:32" as a footnote on a later bar
does not tell a player *when in the step order* to click the landmark, which is the whole point of
the marker. It also breaks focus mode, where the advance has to fire as its own cue at its own time.
Keep it in mind as the **collapsed / summary** rendering — a build card preview, or the economy
graph's age ticks.

> **Note on the cap and its times.** An intermediate draft of option B put the span on the advance
> row — `0:32 → ~1:11 · 39s`. That is dropped, and so is the click-up time that Option A's frame put
> in the time column. The timeline above the build states the span better than a text fragment can,
> and the arrival is on the boundary bar. **The cap carries no times**: a glyph and a label, spanning
> the list's width, off the column grid. Confirmed against the v2 reference frame during
> clarification.

## The nesting question

An alternatives block can sit **inside** a transition: "while the landmark is up, either wall or push
out." Three ways to draw that were built and compared.

**v1 · Nested rails** — secondary rail indented inside the gold one, both contexts visible at once.
*Honest but wide.* Reads correctly, and depth is only ever 2 so it never gets worse than this. But it
costs ~14px of the description column and, worse, the nested rows no longer line up with the rows
above them — which is the one thing the table format is good at.

**v2 · One rail, innermost wins** — **Chosen.** A single rail channel at a fixed x, gold while the
transition is the innermost context, secondary for the span of the alternatives, then gold again. No
indentation.

- **Columns never move.** Every row in the build sits on the same grid, at any nesting depth, at any
  width.
- **The rail answers the local question.** "Which of the two am I on" is the actionable one. "Am I
  still ageing up" is already answered by the advance above and the boundary bar below, which
  bracket the whole thing.
- **The gold resuming after the merge** is what tells you the transition never ended.
- **Cost:** a reader glancing at one row mid-block sees secondary only. Accepted, not mitigated — an
  age-up phase is a handful of rows, so both brackets are on screen anyway. This is also why nothing
  is sticky.

**v3 · Twin stripe** — both rails side by side in the same 8px gutter, no indent. *Too fine.* It
keeps both signals and the alignment (the second stripe painted inside the first rail's padding
rather than added as a border — verified zero shift). But two 3px stripes 1px apart is a hairline
pattern: it reads as one thick smudged rail at mobile density, and in the light theme gold and
secondary at low alpha are close enough in value to merge. The signal it buys is the one v2 argues
you do not need. **Recorded so it is not proposed again.**

## Rules that fall out of v2

- **One rail channel.** Exactly one gutter, at a fixed x, for the whole build. Its colour is the
  innermost open context. Never two at once.
- **Depth is capped at two by construction.** Transition ⊃ alternatives is the only nesting that
  exists — alternatives cannot nest and an age-up cannot open inside a path — so a third rail is
  unreachable.
- **Nothing sticks.** What makes "innermost wins" safe is that the transition is short. If a build
  ever has a transition long enough for that to fail, that build has a bigger problem than the rail.
- **A block cannot straddle a boundary.** A block opening inside a transition must close inside it.
  The editor refuses to push the merge marker past the boundary bar — the same rule that already
  stops it crossing an age-up.
- **Focus mode is unaffected.** One step at a time means no rail. Nesting is a list-rendering concern
  only.
- **Where the transition lives.** It belongs to the age being *left* — "Advance to Feudal" happens in
  Dark Age — so the bracket sits at the tail of a section and the boundary bar is the section's last
  item. That is also what keeps an alternatives block inside a transition compliant with `027`'s
  one-section constraint.
- **Seams must be invisible.** Gold → secondary → gold is one line: no margin gaps, no interior
  rounded corners, corners only at the outer ends of a run. Both were visible defects in the first
  draft.

## This reverses the mobile handoff

`027`'s design said "rails nest, they do not compete." That was written for the **mobile card list**,
where indenting is cheap. In the desktop table it is not, because indenting costs column alignment.
Mobile keeps its current nested treatment; if the two surfaces are unified later, unify **toward**
the single-rail rule.

## Colour

No new colours. From `design-handoff/reference/design-tokens.md` and the Vuetify theme:

| Role | Token |
|---|---|
| Transition rail, advance label, boundary bar text and border | gold — `accent` / `primary` (dark) |
| Alternatives rail | the alternatives / `secondary` colour from `027` |
| The 1px row rule | the existing row border |

Gold denotes **where you are in the build** — ages, timings, primary actions. Secondary denotes
**which way you went** — alternatives. The rail obeys that split and nothing else. The mock's literal
values (`#e7c05e`, `rgba(231,192,94,.09)`, `#7fa0e8`, …) are listed in the handoff README only so
they can be mapped onto real tokens, never copied.

## Suggested build order

1. Advance → plain row; arrival → boxed bar with the arrival time. **Ships alone, fixes most of it.**
2. Transition rail, including the empty-transition collapse.
3. Single-rail context stack + seam handling. Only meaningful once `027` has landed.
4. Light-theme pass on both rail colours.
