# Phase 0 research — 028 Age Markers

Everything below was resolved by reading the shipped code, not by inference from the design. Where
the design and the code disagree, the finding says so.

---

## R1 · The transition already has a container: the `ageUp` section

**Decision**: The rail's run is exactly the `ageUp` section's own rows. Nothing new has to be
computed to know where a transition starts or ends.

**Rationale**: A build's `sections` alternate `age` and `ageUp`. `BuildOrderSectionEditor` renders an
`ageUp` section as three things in order — the advance banner
([:531](../../../src/components/builds/BuildOrderSectionEditor.vue#L531)), the step table
([:537](../../../src/components/builds/BuildOrderSectionEditor.vue#L537)), and the arrival plate
([:971](../../../src/components/builds/BuildOrderSectionEditor.vue#L971)). That *is* the bracket the
design describes, already assembled. FR-013 ("the transition belongs to the age being left, the
boundary bar is the section's last item") is not a change — it is a description of what ships.

**Consequence**: the "one section" constraint from `027` holds automatically. An alternatives block
inside a transition is inside the `ageUp` section, so it cannot straddle the boundary without
straddling a section — which the editor already refuses (FR-020 needs no new rule, only a test).

**Alternatives considered**: computing runs from a flattened document walk. Rejected — it would
re-derive a grouping the section list already states, and it would have to be kept in sync with
`flattenSections`. Constitution I.

---

## R2 · The rail technique is already shipped, and it is per-row, not per-wrapper

**Decision**: Draw the gold rail exactly the way the alternatives rail is drawn — a pseudo-element on
each row's first cell, `left: -3px`, overhanging its neighbours vertically.

**Rationale**: `CLAUDE.md` records "per-element rails cannot span siblings, so a lane belongs on a
wrapper". That was learned on the **mobile card list**, where cards carry margins and borders of
their own. It does not transfer to the desktop table, and the code already proves it:

```css
.alt-row > td:first-child::before,
.alt-inside > td:first-child::before {
  content: ""; position: absolute;
  left: -3px; top: -2px; bottom: -2px; width: 3px;
  background: rgb(var(--v-theme-alternative));
}
.alt-row--start > td:first-child::before { top: -1px; }
.alt-row--end   > td:first-child::before { bottom: -1px; }
```

([:2995](../../../src/components/builds/BuildOrderSectionEditor.vue#L2995)) The 2px overhang is
deliberate and its comment states why: a shadow or a flush-ended rail shows a nick at every seam —
the collapsed border, and the zero-height insert row that sits between every pair of items.
Overlapping the neighbours leaves no seam to show through. **This is the mechanism FR-018 asks for,
already solved and already in production.**

`left: -3px` lands the rail in the table's own `mx-4` margin, so it costs zero layout — which is
FR-011 (no indent, columns never move) for free.

**Alternatives considered**:

- *A wrapper element spanning the run.* Impossible inside a table: a `<div>` cannot wrap a run of
  `<tr>`s. A `<tbody>` per run could, but `border-left` on a `<tbody>` is unreliable across browsers
  under `border-collapse: separate`, and it would fragment the table for the sake of a border.
- *An absolutely positioned overlay measured against the rows.* Rejected on SC-009 and on principle:
  it needs measurement, it needs re-measuring on resize, and the per-row version needs neither.

---

## R3 · `age-lane-md` exists in the template and has no CSS

**Decision**: Use the existing class. Do not invent a new name.

**Rationale**: `section.type === 'ageUp' && 'age-lane-md'` is already applied to step rows
([:673](../../../src/components/builds/BuildOrderSectionEditor.vue#L673)), note rows
([:754](../../../src/components/builds/BuildOrderSectionEditor.vue#L754)) and the section-note row
([:906](../../../src/components/builds/BuildOrderSectionEditor.vue#L906)) — and **there is no
`.age-lane-md` rule anywhere in the stylesheet**. The hook was placed and never painted. Every row
that needs the gold rail is already marked; User Story 2 is largely a stylesheet addition.

**Consequence for effort**: US2 is much smaller than the spec implies. The template work is the
advance row (US1), not the rail.

---

## R4 · "Innermost wins" is a CSS precedence question, expressed explicitly

**Decision**: Gate the gold rules on `:not(.alt-inside):not(.alt-row)` rather than relying on source
order.

**Rationale**: A row inside an alternatives block inside a transition carries **both**
`age-lane-md` and `alt-inside` today. Whichever rule wins paints the rail, and FR-015 says the
innermost context wins — the alternatives colour. Source order would deliver that (the `.alt-*`
rules sit later in the sheet), but silently: anyone reordering the stylesheet would flip the
behaviour with no warning. An explicit `:not()` states the rule in the place it is enforced.

The same gate applies to the row's background gradient, which `.alt-inside` also paints
([:2968](../../../src/components/builds/BuildOrderSectionEditor.vue#L2968)).

**FR-017 (never two rails) falls out**: one row, one first cell, one `::before`. Two rails side by
side are not expressible without adding a second pseudo-element, which nothing does.

---

## R5 · Seams where gold meets secondary

**Decision**: Accept the existing overhang geometry unchanged. No gap is possible; the colour
changes within a ≤3px overlap.

**Rationale**: The gold segment on the last row before a block overhangs 2px downward; the block's
first row (`alt-row--start`) overhangs 1px upward. They overlap rather than abut, so there is no
uncovered pixel between them — one is simply painted over the other for 1–2px. At 3px wide, in a
gutter, the transition point is not resolvable by eye. FR-018 is satisfied by the mechanism that
already exists.

---

## R6 · No rounded corners on the rail

**Decision**: The rail is square-ended, matching the shipped alternatives rail. The design's
"rail run radius 8px at the outer corners only" is **not** ported.

**Rationale**: The 8px radius belongs to the mock's wrapper-based rail
(`border-radius: 0 8px 8px 0` on `.trans`), which also carries the row background — a different
construction entirely. The shipped rail is a 3px bar with a 1px overhang tuned to meet the row
separator, and rounding it would reintroduce the nick that overhang exists to remove. Constitution
Principle III: where the mock and the real components disagree, the real components win.

**Effect on FR-018**: "no interior rounded corners" is satisfied trivially — there are no corners.
The requirement stands as written; the implementation meets it by having nothing to round.

---

## R7 · The arrival time exists, but only in the reading view

**Decision**: Pass the arrival time down from `BuildOrderEditor` as a prop on the `ageUp` section.
Show no time when it cannot be resolved — which includes the whole editing view.

**Rationale**: `flatTimes` short-circuits on `if (!readonly) return []`
([BuildOrderEditor.vue:244](../../../src/components/builds/BuildOrderEditor.vue#L244)), so no
resolved time of any kind exists while editing. The arrival second is already computed for the
reader: it is the resolved time at the start of the *next* section, i.e.
`flatTimes[offsets[index + 1]]` — the same index `getAgeTimings` calls `boundary.index` when it
resolves an age's arrival ([useAgeTimings.js:401](../../../src/composables/builds/useAgeTimings.js#L401)).

Formatting reuses the rule `resolvedTime()` already applies
([:1113](../../../src/components/builds/BuildOrderSectionEditor.vue#L1113)): `~` prefix unless
`provenance === "stated"`. FR-007 is "reuse", not "implement".

**Alternatives considered**: calling `getAgeTimings` from the section component. Rejected — it would
resolve the whole build once per section, and the parent already holds the answer.

---

## R8 · Empty transitions: the reader already drops the advance

**Decision**: Keep `isBareAgeUp` exactly as it behaves. FR-012's "the advance row sits directly on
the boundary bar" describes the **editor**; in the reading view an empty transition shows the
boundary bar alone.

**Rationale**: `isBareAgeUp` is `readonly && type === 'ageUp' && !steps.length && !gameplan`
([:1167](../../../src/components/builds/BuildOrderSectionEditor.vue#L1167)), and its comment records
the reasoning: imported builds have these because the overlay format does not record the steps taken
while ageing up, and a marker that says only what the plate below already says is noise. The reader
gets no rail and no gutter, which is what FR-012 is protecting. **This is a reconciliation, not a
change** — noted so implementation does not "fix" a deliberate behaviour.

---

## R9 · The table is hidden when a section has no steps — and that loses notes

**Decision**: The table renders whenever it has **any** row to draw — a step, a note with content, or
an advance row. Not when `steps.length` happens to be non-zero.

**Rationale**: Two separate things collide on one guard,
`v-if="steps?.length"` ([:538](../../../src/components/builds/BuildOrderSectionEditor.vue#L538)).

*The advance row* has to live inside the table to sit on the same rules and heights as the rows below
it. An age-up with a step and one without cannot draw the same marker two different ways.

*The section note* is the real defect. There are two kinds of note in this component and only one is
a step:

| | Stored as | Has an index | Desktop guard |
|---|---|---|---|
| Note item (`027`) | an item in `section.steps`, identified by `isNote(item)` — `item.gameplan != null` ([:1695](../../../src/composables/../components/builds/BuildOrderSectionEditor.vue#L1695)) | yes | its own row |
| Section note (legacy) | `section.gameplan`, a section field ([:1157](../../../src/components/builds/BuildOrderSectionEditor.vue#L1157)) | **no** | trapped inside the table |

The section note predates placeable notes, is not an item, and is not in `steps` — yet its row sits
inside a table gated on the step count, so **a section with a note and no steps silently loses it on
desktop**. Mobile has never had the bug: the same note renders as a plain sibling guarded only on
`hasVisibleContent(gameplan)` ([:507](../../../src/components/builds/BuildOrderSectionEditor.vue#L507)).
Constitution III — desktop borrows the treatment that already works rather than inventing a second
one.

**The rule this establishes**: *a note's visibility depends on the note.* It is shown when it has
content and hidden when it is empty, and nothing else enters into it — least of all a count belonging
to a different kind of item.

**Empty notes need no new work.** `hasVisibleContent` already exists for exactly this: an author who
types a note and deletes it leaves `"<br>"` behind, which is truthy and would otherwise draw an empty
card. Both mobile guards and the desktop row already use it.

**Scope**: the guard is fixed for all section types, not just `ageUp`. Narrowing it to `ageUp` would
leave the same note dying in an `age` section, which is the more common case.

---

## R10 · Colour tokens: the spec's "secondary" is the theme's `alternative`

**Decision**: Gold is `--v-theme-accent`. The alternatives colour is `--v-theme-alternative`.
Neither is `secondary`.

**Rationale**: `main.js` defines `alternative` as a first-class theme colour — `#8AA9E8` dark,
`#294790` light — with the comment that deriving alternatives off `secondary` "would paint them gold
in light mode, which is" the one thing the colour split forbids. `accent` is gold in both themes
(`#e7c05e` / `#CCAA55`), which is why `.age-marker-md` already uses it. This closes the terminology
item deferred at clarification: the spec's wording stays readable prose, the code uses the tokens.

**FR-024 (no new colours)** is met — both tokens ship.

---

## R11 · Accessibility: the group is the section

**Decision**: Label the `ageUp` section's card as a group. Do not label rows, and do not rely on
`aria-label` on a row group.

**Rationale**: FR-029 asks that entering and leaving a transition be announced once each. The
transition is already one card containing exactly the railed run, so `role="group"` plus an
`aria-label` naming the age-up puts the announcement on a real boundary rather than on an invented
one. `aria-label` on `<tbody>` / `role="rowgroup"` is announced inconsistently and would have meant
fragmenting the table — worse structure for less reliable output.

The two markers carry their own text regardless ("Advancing to Imperial", "Imperial Age ~16:40"), so
even where the group is not announced the boundaries are still spoken. FR-030 holds without extra
work: neither the glyph nor the age asset is the sole carrier of anything.

**Note**: the component has **no** `aria-*` or `role` attributes today. This is the first, and it is
deliberately the only one.

---

## R13 · The light theme collapses gold onto navy — found on screen, not in the code

**Decision**: Add an `age` theme token, gold in both themes (`#e7c05e` dark, `#CCAA55` light), and use
it for the age lane's rail and fills only. Text stays on `accent`.

**Rationale**: `accent` is `#294790` navy in the light theme, changed there deliberately: gold
`#CCAA55` text on the `#FAFAFA` surface is 2.1:1 against the 4.5:1 normal text needs, and 96
components read `accent` for text and icons. But `alternative` is *also* `#294790` — so an age rail
read off `accent` came out the same navy as the alternatives rail, and the two phases were
indistinguishable in light mode.

`main.js` already contains both halves of the answer. Its `alternative` comment explains why a colour
whose role swaps between themes needs its own token — this is the mirror-image case. And its `accent`
comment states the division to follow: *"Gold keeps its place in light mode where it is a fill and
contrast is computed against it."* So the rail and the fills go gold; the labels stay navy, because
gold text on that surface is the exact failure that caused the swap.

**What this corrects**: the `alternative` comment claimed the navy was "unmistakably not the gold that
ages and timings use". True when written; false once `accent` went navy. The claim is now removed
rather than left to mislead.

**Alternatives considered**:

- *`secondary`* — gold in light, navy in dark. Exactly backwards.
- *A darker gold for the text* (`#8D7B4B`, already in the light palette) — 3.97:1 on `#FAFAFA`, and
  these labels are 11px bold, which does not qualify as large text. Fails.
- *Leaving it* — the colour rule the whole feature rests on ("gold is where you are, blue is which way
  you went") does not survive one of the two themes.

## R12 · Light theme is the one thing that cannot be verified here

**Decision**: Treat the light-theme pass as its own task with browser verification, and state plainly
that it is unverified until then.

**Rationale**: Gold in light theme is `#CCAA55` on a `#FAFAFA` surface. The alternatives rail's
alphas (0.12 → 0.02 → 0 for the fade, solid for the 3px bar) were tuned for a blue that has good
value contrast in both themes; muted gold on near-white does not, and the design flags exactly this
("watch the light theme specifically"). Nothing in `npm run build`, `check:setup` or `check:steps`
can see a colour. Per `CLAUDE.md`, rendering, layout and interaction need a browser — this plan says
so rather than implying otherwise.

---

## Summary of `NEEDS CLARIFICATION` items

None. Every unknown in the Technical Context resolved against shipped code.
