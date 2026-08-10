# Feature Specification: Age Markers — the Advance is a Step, the Arrival is a Boundary

**Feature Branch**: `028-age-markers`

**Created**: 2026-08-10

**Status**: Draft

**Input**: Age marker rework (desktop build list): make "Advance to X Age" a plain list row, make
"X Age reached" the sole boxed/tinted bar carrying the age icon, age name and arrival time, and run
a single 3px gold rail down the rows between them so the age-up reads as a phase. One rail gutter
for the whole list painting the innermost open context (gold for transition, secondary for an
alternatives block, gold resuming after the merge), never two rails, never an indent, seams
invisible.

> **Design reference:** the *Age Markers* canvases, checked in under `design-handoff/`. Two HTML
> documents — `Age Markers.html` (analysis of the current state and the three options considered)
> and `Age Markers B.html` (six frames: anatomy, alternatives in a section, the three nesting
> variants, the rules) — plus the design-side `README.md` and the extracted theme tokens. They are
> **design references authored in HTML, not production code**: they hand-roll the table, rows and
> chips the app already solves with Vuetify. **Where the mock and the real components disagree, the
> real components win** (Constitution Principle III). Port the decisions — which element is a row
> and which is a bar, the rail rule, the alignment guarantee, the seam rule — not the CSS.
> Fidelity is **medium**: hierarchy, colour roles, row rhythm and rail logic are decided; pixel
> values are indicative and should match the surrounding real components.

## The problem *(read first)*

The desktop build list draws "Advance to X Age" and "X Age reached" as identical full-width gold
bars. They are not the same kind of thing:

1. **They are different kinds of thing, drawn the same.** The advance is an **action** the player
   performs at a moment, exactly like "build a house". The arrival is a **boundary** the build
   crosses. Identical treatment gives the reader no clue which one they *do* and which one just
   *happens*.
2. **The bars out-shout the steps.** Four age-ups produce eight full-width boxed gold bars against
   roughly eleven step rows. The markers are the loudest thing on the page while the steps carrying
   the actual instructions are quieter. The emphasis is inverted.
3. **The transition is invisible.** The stretch between the advance and the arrival is a real phase
   with its own rules — landmark under construction, vulnerable window — but on screen it is two
   bars with unrelated-looking rows between them.
4. **The arrival has no time.** The one number a reader wants from "Feudal Age reached" is *when*,
   and it is not on the bar; it has to be inferred from the row above.
5. **The boundary leans on an icon that cannot carry it.** The age asset is a circled Roman numeral;
   at 20px in gold it is a near-twin of a circled transport glyph, and Ⅱ/Ⅲ/Ⅳ differ by one stroke.
6. **Repetition.** "Advance to Feudal Age" / "Feudal Age reached" says the word *Age* four times in
   eight rows, before the other two ages have had their turn.

## Scope & Non-Goals *(read second)*

**In scope:**

- The **desktop** build order list — the advance marker, the arrival marker, and the rows between
  them, in both the reading and the editing view (they are the same table).
- The single rail gutter shared with the alternatives lane from feature `027`.

**Explicitly NOT in scope (leave exactly as-is):**

- **The mobile (`xs`) step list.** Deliberately untouched, including its nested rails. If the two
  surfaces are unified later, unify *toward* the single-rail rule specified here.
- **Focus mode.** It shows one step at a time, so there is no rail to draw. The transition keeps
  contributing a cue at the advance and a cue at the arrival, exactly as today.
- **The age timeline strip and the economy graph** (`020`, `021`, `025`, `026`). The transition span
  is already drawn there; this feature does not restate it.
- **The alternatives data model, editor menu, path tabs, graph or focus-mode behaviour** (`027`).
  This feature changes only where the alternatives rail is *painted* on desktop.
- **New colours, new assets, new data.** Everything drawn here is already computed or already
  shipped.
- **A collapsed / summary rendering** of the markers. Recorded as an open item, not designed.

## Clarifications

### Session 2026-08-10 (b) — revised design brief, supersedes parts of session (a)

A second brief arrived during implementation, with the frame *V1 · Milestone row* as its target. It
reverses three decisions taken below. They are **not** edited out of the record: the earlier reading
was faithfully implemented and then seen on screen, which is what changed it.

- Q: Is the arrival a boxed bar? → A: **No — it is a row like the advance.** Full-bleed, no inset, no
  border, no radius, no larger type. It stands out on **fill alone**, and nothing else in the list is
  filled. *Why:* the bordered plate floated above the list and read as a widget dropped onto the
  build rather than a row of it, and sitting outside the table it left the rail stopping short of the
  thing the transition ends on.
- Q: Does the arrival carry the arrival time? → A: **No — remove it.** *Why:* the row that follows
  already states that moment, and the timeline above the build states the span; on the bar the number
  was both a restatement and stranded away from the time column. This reverses FR-006/FR-007 and
  retires the whole `arrivalTime` prop added for them.
- Q: Where does the rail end? → A: **On the arrival row, inclusive.** The transition terminates on
  the thing it was heading for instead of stopping beside it.
- Q: Are the two rows drawn alike? → A: **Identical** — same grid, height, padding, icon column and
  label size, weight and case, so they read as one bracket opening and closing.

### Session 2026-08-10 (a)

- Q: Does the advance row sit on the table's column grid with a time, or is it a full-width label
  row? → A: **Full-width label row** — an advance glyph and the label, spanning the list's width. No
  time, no villager count, no resource cells. Resolves the conflict between the handoff README ("the
  standard time column") and the anatomy frame; the frame wins, and it agrees with the design's own
  rule that the cap carries no times.
- Q: Where does the rail start and where does it stop? → A: It **starts at the advance row itself**
  and runs to the last row before the boundary bar. The boundary bar sits outside the run and closes
  it visually rather than being railed.
- Q: Which colour does an alternatives block's merge marker row carry? → A: **Secondary** — the
  block's rail runs through the merge row, and gold resumes on the first row *after* it.
- Q: Does the advance row participate in step highlighting and the economy crosshair link? → A: **No
  — annotation only.** It takes no step index, does not respond to the shared highlight and is not a
  crosshair target. Its click-up moment is already answered by the transition band on the timeline,
  and it has no point on the economy series to light up from.
- Q: Does the transition need a non-visual equivalent of the rail? → A: **Group the run.** The railed
  rows form one labelled group, so entering and leaving a transition — and an alternatives block
  inside it — is announced once each. Individual rows announce nothing extra, and the rail itself
  stays decorative.
- Q: Where does the age-down control live once the advance is a full-width row? → A: **The same
  optical column as every other row's ✕**, right-aligned at the same inset. It stays on the advance
  row, not on the boundary bar, and the existing height-capping workaround retires with the banner.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Tell what I do apart from what happens (Priority: P1) 🎯 MVP

A reader scanning a build wants to know, at a glance, which line is an instruction they carry out
and which line is a milestone the build passes. The advance drops to a plain list row and stays in
its place in the step order — it is the row on which the player clicks the landmark, so its position
*is* the information. The arrival becomes the only boxed, tinted element in the list, and it finally
states the time the age is reached.

**Why this priority**: It fixes four of the six observations above — the action/boundary confusion,
the inverted emphasis, the missing arrival time, and the icon carrying a signal it cannot carry —
and it halves the bar count without deleting any information. It ships alone, ahead of the rail, and
touches one row type.

**Independent Test**: Open a desktop build with three age-ups → each advance renders as a plain row
in the step table at the same height and with the same rules as a step row, carrying its label and
its time in the standard time column; each arrival renders as the only boxed bar, carrying the age
asset, the age name and the arrival time; nothing else in the list is boxed.

**Acceptance Scenarios**:

1. **Given** a build with an age-up, **When** the desktop list renders, **Then** the advance is a
   plain list row — no box, no fill, no tint, no border beyond the 1px row rules every step row has
   — at the same height as a step row.
2. **Given** the advance row, **When** it renders, **Then** it spans the list's full width and
   carries a glyph and a label and **nothing else**: no time, no villager count, no resource values.
3. **Given** the advance row, **When** it renders, **Then** it occupies the position in the step
   sequence where the landmark is clicked, unchanged from today.
4. **Given** the arrival marker, **When** it renders, **Then** it is boxed and tinted, and carries
   the canonical age asset, the age name, and the arrival time right-aligned.
5. **Given** the whole desktop list, **When** it renders, **Then** the arrival bar is the **only**
   boxed, tinted element in it — the advance row, the path tabs, a note row and the merge marker are
   all plain list rows.
6. **Given** an arrival whose time is derived rather than authored, **When** it renders, **Then** it
   is marked as derived using the same convention the rest of the build uses, not a new one.
7. **Given** the editing view, **When** an age-up renders, **Then** it has the same shapes as the
   reading view and its existing controls keep working in the editor's action column.
8. **Given** the advance row, **When** the reader hovers it or the timeline and the economy crosshair
   move across its moment, **Then** nothing about the row changes — it is a marker, not a step.
9. **Given** the editing view and the final age-up, **When** the advance row renders, **Then** its
   age-down control sits in the same optical column as the control closing every step row, and the
   row is exactly as tall as a step row.

---

### User Story 2 - See the age-up as a phase (Priority: P2)

A reader wants to know which steps fall *inside* the age-up — the landmark is under construction,
the window is vulnerable, and those rows behave differently from the rest of the age. A gold rail
runs down the left gutter beside exactly those rows, so the transition reads as a bracketed phase
rather than as two unrelated bars with strangers in between.

**Why this priority**: This is what the analysis called the one thing option A leaves unfixed. It
depends on Story 1 having established which element opens and which closes the bracket, but it needs
nothing from `027`.

**Independent Test**: Open a desktop build whose age-up has intermediate steps → a rail runs beside
those rows and no others, no row is added, no content shifts right. Open one whose age-up has no
intermediate steps → no rail, and no empty gutter.

**Acceptance Scenarios**:

1. **Given** an advance followed by at least one row before its arrival, **When** they render,
   **Then** a 3px rail runs in a left gutter beside the advance row and every row down to the
   boundary bar, fading right, and it adds **no row** to the list.
2. **Given** the rail, **When** it renders, **Then** row content does **not** indent — every time,
   villager, resource and description column sits at exactly the same x as on a row with no rail.
3. **Given** an age-up with no rows between the advance and the arrival, **When** it renders,
   **Then** there is no rail and no empty gutter; the advance row sits directly on the boundary bar.
4. **Given** the transition, **When** the list renders, **Then** it sits at the tail of the age
   section it is leaving and the boundary bar is that section's last item.
5. **Given** a build with three age-ups, **When** the list renders, **Then** each transition's rail
   starts at its own advance row and ends at the last row before its boundary bar — never earlier,
   never later, never spanning two transitions.
6. **Given** the boundary bar, **When** it renders, **Then** it sits below the end of the rail run
   and is not itself railed; its own border closes the bracket.

---

### User Story 3 - Follow one path without losing the age-up (Priority: P3)

An author writes "while the landmark is up, either wall or push out." The reader picks a path inside
the transition and follows it. There is exactly one rail gutter and it paints the **innermost open
context**: gold while the transition is innermost, secondary for the span of the alternatives block,
gold again after the merge. Never two rails side by side. Never an indent.

**Why this priority**: It is the correct behaviour, but it only becomes reachable once an
alternatives block can sit inside a transition, so it lands last. Stories 1 and 2 do not depend on
it.

**Independent Test**: Author an alternatives block inside an age-up, save, reopen on desktop → the
gutter is gold before the block, secondary for the block's rows, gold again after the merge and up
to the boundary bar; the three runs render as one unbroken line; no row indents.

**Acceptance Scenarios**:

1. **Given** an alternatives block inside a transition, **When** the list renders, **Then** the
   block's rows — path tabs row through merge marker row inclusive — carry the secondary-coloured
   rail, and the rows before it and after it carry the gold one, in the same gutter at the same x.
2. **Given** that gold → secondary → gold run, **When** it renders, **Then** it reads as one
   continuous line: no gap between segments and no rounded corner in the interior. Corners round
   only at the very start and the very end of a run.
3. **Given** an alternatives block **outside** a transition, **When** it renders, **Then** its rail
   is secondary and no gold rail is present — the transition ended at its boundary bar.
4. **Given** any row in any build, **When** it renders, **Then** at most one rail is painted beside
   it. Two rails are never drawn side by side and a rail is never nested inside another.
5. **Given** the editor, **When** the author tries to move an alternatives block's merge marker past
   the boundary bar of the transition it opened inside, **Then** it is refused, with the same
   treatment that already stops a block crossing an age-up.
6. **Given** a long transition, **When** the reader scrolls, **Then** nothing sticks — no sticky cap,
   no sticky path tabs.

---

### Edge Cases

- **The advance has no resolvable time.** Changes nothing — the advance row shows no time in any
  case. The moment it names is its position in the sequence.
- **The arrival has no resolvable time.** The bar renders with the asset and the age name and no
  time, rather than with a placeholder or a zero.
- **A zero-length transition** (the click-up and the arrival resolve to the same second): treated as
  an empty transition — no rail, no gutter.
- **The transition's only content is an alternatives block.** The gutter is secondary for the whole
  run; there is no gold segment before or after it, and no gap where one would have been.
- **A single-row transition.** The rail is one row tall and rounds at both ends — one run, both
  corners outer.
- **A build with no age-ups at all.** No rails, no boundary bars, no gutter, no reserved space.
- **A section with a note and no steps.** The note is shown. A section with an empty note and no
  steps renders nothing at all — no empty row, no header, no card.
- **High zoom / narrow viewport.** If the gutter falls out of view, the group boundary and the two
  markers still state where the transition starts and ends; no information exists only in the rail.
- **Light theme.** The rail gradient at low alpha must stay visible without becoming a solid block,
  and the gold and secondary rails must stay distinguishable from each other.
- **Narrow desktop widths.** The gutter must not come out of the description column's budget in a
  way that reflows the resource columns; the alignment guarantee holds at every desktop width.

## Requirements *(mandatory)*

### Functional Requirements

**The advance**

- **FR-001**: The advance marker MUST render as a plain list row in the desktop step list — the same
  height as a step row, the same 1px top and bottom rules, no box, no fill, no tint.
- **FR-002**: The advance row MUST keep its position in the step sequence: it is the row on which the
  player clicks the landmark, and that position is the information it carries.
- **FR-003**: The advance row MUST span the list's full width rather than sitting on the column grid,
  and MUST carry an advance glyph and a label and **nothing else** — no time of any kind, no villager
  count, no resource cells. The transition's span is already stated by the timeline above the build,
  and its end by the boundary bar.
- **FR-004**: The advance label MUST name the target age without repeating the word "Age", which the
  boundary bar already states, and MUST be set in the annotation treatment that distinguishes a
  marker from an instruction — the same treatment the alternatives merge marker uses, so the two read
  as the same kind of statement.

**The arrival**

- **FR-005**: The arrival marker MUST be a plain full-bleed row, drawn identically to the advance row
  — same grid, height, padding, icon column, and label size, weight and case — so the two read as one
  bracket opening and closing. It MUST have no inset, no rounded corners and no border of its own.
- **FR-005a**: The arrival row MUST stand out on **fill alone**: a left-to-right gold gradient, and
  nothing else. It MUST be the only filled row in the list, and no element in the list may acquire a
  box or a border. Larger type is not permitted as a substitute.
- **FR-006**: The arrival row MUST carry the canonical age asset in the leading time column, centred
  and at the same optical size as the advance row's glyph, and the age name as its label.
- **FR-007**: The arrival row MUST carry **no time**. The row that follows already states that
  moment, and the timeline above the build states the span.
- **FR-008**: The boundary signal MUST be carried by the fill and the age name. The age asset
  identifies *which* age and MUST NOT be the thing that says a boundary was crossed — at this size the
  circled numeral reads as a pause glyph, a near-twin of the transport control below the list, and
  Ⅱ/Ⅲ/Ⅳ differ from one another by a single stroke.

**The rail**

- **FR-009**: The transition MUST carry a 3px rail in a left gutter, with a gradient fading to the
  right. The run **starts at the advance row and ends on the arrival row, inclusive**, so the
  transition visibly terminates on the thing it was heading for. The arrival row MUST NOT draw a
  second rail of its own — one line in the gutter, never two.
- **FR-010**: The rail MUST add no row to the list.
- **FR-011**: The rail MUST NOT indent row content. Every column MUST sit at the same x on a railed
  row as on an unrailed one, at every desktop width and at any nesting depth.
- **FR-012**: A transition with no rows between the advance and the arrival MUST render with no rail
  at all and no empty gutter — the advance row alone does not open a run. In the editing view the
  advance row sits directly on the boundary bar. In the reading view an entirely empty transition
  keeps its existing behaviour and shows the boundary bar alone, without an advance row: imported
  builds carry these because the overlay format does not record the steps taken while ageing up, and
  a marker stating only what the bar below already states is noise.
- **FR-013**: The transition MUST belong to the age being *left*, so the bracket sits at the tail of
  a section and the boundary bar is that section's last item.

**One rail, innermost wins**

- **FR-014**: There MUST be exactly one rail gutter, at a fixed x, for the whole list.
- **FR-015**: The gutter's colour MUST be the innermost open context: gold inside a transition,
  secondary inside an alternatives block, nothing on plain rows.
- **FR-016**: An alternatives block inside a transition MUST paint secondary for the block's rows —
  from its path-tabs row through its merge marker row inclusive — and gold before it and from the
  first row *after* the merge marker, in that one gutter.
- **FR-017**: Two rails MUST NEVER be painted side by side, and a rail MUST NEVER be nested inside
  another.
- **FR-018**: Seams MUST be invisible. A contiguous run of rail — gold → secondary → gold — MUST
  render as one continuous line: no margin gaps between segments, no interior rounded corners.
  Corners round only at the very start and the very end of a run.
- **FR-019**: Nothing in the transition MUST be sticky — no sticky cap, no sticky path tabs.
- **FR-020**: An alternatives block that opens inside a transition MUST close inside it. The editor
  MUST refuse to move the merge marker past the boundary bar, with the same treatment that already
  refuses to move it across an age-up.

**Boundaries of the change**

- **FR-021**: Every row in the list — steps, the advance, the arrival, the alternatives path tabs, a
  note, the merge marker — MUST share one row rhythm: the height of a step row and the same 1px row
  rule. No rule anywhere in the list may be gold.
- **FR-021a**: Every annotation row MUST name itself. The merge marker previously carried its icon
  alone, on the grounds that the rail ending said it and a label would have been the only text in the
  block naming itself. Once the age markers became labelled rows in the same column, that inverted:
  the merge line became the only annotation row with nothing in it. Its wording MUST NOT count the
  paths — a block may hold three or more — so "the paths rejoin", never "both paths continue".
- **FR-022**: The mobile (`xs`) step list keeps its **layout** unchanged, including its cards, its
  boxed age markers and its current nested-rail treatment. Two exceptions were taken deliberately,
  after the desktop work exposed problems that were never desktop-only:
  - **FR-022a**: Mobile's age rail, fills and borders MUST read from the same both-themes gold token
    as desktop's. Its markers had the identical light-theme collision — an age rail and the
    alternatives rail nested inside it, both navy — and fixing one surface only would have left the
    colour rule true in three places out of four. Labels stay on `accent` here too.
  - **FR-022b**: Mobile's merge marker MUST carry the same label as desktop's, at this list's own type
    scale. Same wording, same reason (FR-021a); a marker that names itself on one surface and not the
    other is two answers to one question.
- **FR-023**: Focus mode MUST be unaffected: it shows one step at a time, so no rail is drawn, and
  the transition keeps contributing a cue at the advance and a cue at the arrival.
- **FR-024**: The feature MUST introduce no new colour **values** and no new assets. It MUST use the
  existing theme palette — gold for *where you are in the build* (ages, timings, primary actions),
  the alternatives colour for *which way you went* — and the age assets already shipped.
- **FR-024a**: The age lane MUST read from a theme token that is gold in **both** themes, and that
  token MUST be used for its rail and fills only, never for its text. `accent` cannot serve: it is
  navy in the light theme, changed there because gold text on that surface is 2.1:1 against a 4.5:1
  requirement — and `alternative` is the same navy, which made the two lanes indistinguishable in
  light mode. Adding the token mirrors why `alternative` exists and maps to values already in the
  palette (`#e7c05e` dark, `#CCAA55` light), so FR-024 holds.
- **FR-025**: Both the light and the dark theme MUST work. The age lane and the alternatives lane MUST
  be distinguishable from each other in both. In the light theme specifically, the gold rail gradient
  at low alpha MUST stay visible without becoming a solid block, and age-lane **text** MUST stay in
  the theme's readable colour rather than following the rail.
- **FR-026**: The reading view and the editing view MUST use the same shapes. In the editing view the
  age-down control stays on the advance row and MUST sit in the same optical column as the control
  that closes every step row, at the same inset. It MUST NOT make the advance row taller than a step
  row — a constraint the full-width row satisfies without the height cap the banner needed.
- **FR-031**: A note MUST be shown whenever it has content and hidden only when it is empty. Its
  visibility MUST NOT depend on anything else — in particular not on how many steps its section has.
  This closes a defect the feature would otherwise have to work around: the desktop section note is
  drawn inside the step table, so a section with a note and no steps silently loses it, while the
  same note renders correctly on mobile.
- **FR-027**: The advance row MUST stay a marker semantically. It takes no step index, does not
  respond to the highlight shared with the age timeline, and is not a target for the economy
  crosshair link. Drawing it as a row is a visual change only.
- **FR-028**: The step indices that the timeline, the economy crosshair and focus mode share MUST be
  unchanged by this feature. No marker, rail or bar may add, remove or shift one.
- **FR-029**: A railed run MUST be exposed as one labelled group, so that entering and leaving a
  transition — and an alternatives block inside one — is announced once on each boundary to a reader
  who is not seeing the rail. Individual rows MUST NOT announce their context, and the rail itself
  MUST be decorative.
- **FR-030**: The advance row's glyph and the age asset on the boundary bar MUST NOT be the only
  carrier of any information: the advance's label and the boundary bar's age name state in words what
  the glyph and the asset state in pictures.

### Key Concepts

- **Advance** — the action of clicking up. A row in the step sequence, at the moment it happens.
- **Arrival / boundary** — the moment the new age is reached. The one boxed bar; closes the rail.
- **Transition** — the span between the two, belonging to the age being left. Everything inside it is
  bracketed by the rail.
- **Rail gutter** — one channel, at one fixed x, for the whole list. Carries the colour of the
  innermost open context and nothing else.
- **Context stack** — at most two deep by construction: *transition ⊃ alternatives*. Alternatives
  cannot nest and an age-up cannot open inside a path, so a third rail is unreachable.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The desktop list contains **zero** boxed, bordered or inset elements, down from six in a
  build with three age-ups. Exactly one row kind is filled — the arrival — and there are three of
  them, one per age.
- **SC-002**: Column alignment is exact: on a railed row and an unrailed row, the time, villager,
  resource and description columns sit at the same horizontal position — **0px** of shift — at every
  desktop width and at both nesting depths.
- **SC-003**: A reader shown the list without explanation correctly identifies which marker is
  something they perform and which is something that happens, in at least 4 of 5 attempts.
- **SC-004**: The arrival time is readable **on** the arrival bar in 100% of age-ups whose time
  resolves — no reader has to infer it from the row above.
- **SC-005**: A gold → secondary → gold run shows no visible break: 0px of gap and no interior
  corner rounding along the whole run.
- **SC-006**: An age-up with no intermediate steps adds **0px** of horizontal gutter and 0 rows to
  the list.
- **SC-007**: In both themes, the rail is distinguishable from the row background and the two rail
  colours are distinguishable from each other at a glance; the gold rail never reads as a filled
  block behind the rows.
- **SC-008**: The mobile step list renders identically before and after the change — no visual
  difference at `xs`.
- **SC-009**: A long build opens and scrolls as smoothly as it does today — no perceptible delay is
  added by the markers or the rail, at any build length the app supports.
- **SC-010**: For every existing build, the step indices the timeline, the crosshair and focus mode
  share are identical before and after the change — the markers cost zero index drift.
- **SC-012**: Across every build in the collection, no note with content fails to render on desktop,
  and no empty note renders anywhere — in either mode, at any step count.
- **SC-011**: A reader who is not seeing the rail is told exactly twice per transition that they have
  entered and left it — once on each boundary — and no railed row repeats it.

## Assumptions

- **Label wording and treatment.** The advance reads as a present participle naming the target age
  without the word "Age" — "Advancing to Imperial" — set as an annotation caption rather than as
  sentence text, per the reference frame. The arrival keeps its full age name, since it is the
  element that identifies the age.
- **The advance carries no time.** The click-up second stays where it already is — the timeline above
  the build, and the transition band `026` draws on it. Putting it on the row as well would state the
  same number twice, two elements apart.
- **Reading and editing are one surface.** The desktop list is rendered by the same component in both
  modes, so both get the change together; only the editor's action column differs, as it does today.
- **The rail belongs to a wrapper, not to each row.** Per-element rails cannot span siblings and
  cannot be continuous across rows with different borders — the mobile lane already learned this. The
  gutter is one element spanning the run.
- **Pixel values from the design are indicative** — rail 3px, row height ≈41px, boundary bar radius
  ≈9px, rail run radius ≈8px at outer corners only. Where they disagree with the surrounding real
  components, the real components win.
- **`027` has landed.** User Story 3 depends on the alternatives block existing, on its secondary
  colour, and on the editor rule that stops a block crossing an age-up. Stories 1 and 2 do not.
- **The single-rail rule reverses the mobile handoff.** `027`'s "rails nest, they do not compete" was
  written for the mobile card list, where indenting is cheap. On the desktop table it is not, because
  indenting costs column alignment — the one thing the table format is good at. Mobile keeps its
  treatment; if the two are unified later, unify toward this rule.
- **The accepted cost is not mitigated.** A reader glancing at one row mid-block sees only the
  secondary rail and cannot tell from that row alone that an age-up is still open. Accepted: an
  age-up phase is a handful of rows, so the advance above and the boundary bar below are almost
  always both on screen. This is also why nothing is sticky.

## Dependencies

- **`027-build-alternatives`** — User Story 3 only: the block, its secondary rail colour, its path
  tabs and merge marker, and the editor's boundary rule.
- **Existing age timing resolution** — the click-up and arrival seconds, and the convention for
  marking a derived time, are already computed and are read, not re-derived.
- **Existing age assets** (`age_2`, `age_3`, `age_4`) and the existing MDI glyphs. No new assets.

## Open Items

- **Mobile.** Deliberately untouched. Unify toward the single-rail rule if the two surfaces are ever
  unified.
- **Collapsed / summary rendering.** The rejected "one marker per age" layout (see
  `design-input.md`) is a good fit for a build card preview or for the economy graph's age ticks. Not
  designed, not in scope.
