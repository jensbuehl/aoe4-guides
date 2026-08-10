# Feature Specification: Reorder Steps and Notes

**Feature Branch**: `029-step-reordering`

**Created**: 2026-08-10

**Status**: Draft

**Input**: User description: "Include on desktop drag and drop and on mobile a move up/down. Limited to moving regular steps (also cross sections) and notes (also cross sections). Also allow moving a step from an alternative out, and a step from outside into an alternative."

> **Scope guard:** this feature lets an author move an existing **step** or **note** to a different position in a build order. It adds no new item kind, changes no stored format, and needs no migration. Alternatives blocks and age-up advances are **not** movable — they are structure, not content. The reading view, focus mode, economy graph and overlay export are untouched; they render whatever order the author leaves behind, exactly as they do today.

> **Why now:** feature 027 deferred this on purpose. Its closing assumption reads: *"Drag-and-drop reordering of alternatives is out of scope. The two-marker pattern makes ordering an insert-and-delete problem, so reordering can be added later without a data migration."* This is that later. The bet holds: an alternative's membership is **positional**, so moving a step into one is the same move as moving it up two rows.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Fix the order on desktop by dragging (Priority: P1) 🎯 MVP

An author writing a Dark Age opening realises the "build a house" step belongs two rows earlier, before the sheep are pushed. Today the only way to fix that is to delete the row and retype it — text, icons, time and resources. Instead they grab the row by its handle, drag it up past two rows, and drop it on the line where it belongs.

**Why this priority**: This is the whole complaint. Authoring a build is iterative and the current editor has no way to change your mind about order. Within one section it is also the smallest shippable slice — no coordination between sections, no bracket rules.

**Independent Test**: In the build editor on desktop, drag a step from position 5 to position 2 within one section, save, reload → the step is at position 2 with its description, icons, time and resource values unchanged.

**Acceptance Scenarios**:

1. **Given** a step row in the editor, **When** the author points at it, **Then** a drag handle appears on the row; the row is draggable **only** by that handle.
2. **Given** the author drags a row, **When** the pointer passes over the list, **Then** the insert line nearest the pointer is marked as the drop position and the dragged row is shown as lifted.
3. **Given** a drag is in progress, **When** the author releases on a marked line, **Then** the step moves to that position and the build is marked changed.
4. **Given** a drag is in progress, **When** the author releases outside any valid drop position, or presses `Escape`, **Then** nothing moves and nothing is marked changed.
5. **Given** a step is dropped where it already was, **When** the drop completes, **Then** no change is emitted — an author who thinks better of a drag has not dirtied their build.
6. **Given** the author was typing in a description cell, **When** they start a drag, **Then** what they typed is committed to that step first, so the text travels with the row it was typed into and does not land on whatever row inherits its position.
7. **Given** a note row, **When** the author drags it, **Then** it behaves exactly as a step row does — a note is content and moves like content.

---

### User Story 2 - Fix the order on a phone (Priority: P1)

The same author, on a phone at the desk during a game, spots the same mistake. There is no room to drag and no accuracy to drag with. They open the step card's actions and press **move up** twice.

**Why this priority**: Mobile is a first-class editing surface here, and drag on a 390px card list with `contenteditable` fields is the wrong gesture. Equal priority to Story 1 because shipping only the desktop half leaves the phone with no way to reorder at all.

**Independent Test**: In the build editor at 390px, move a step card up two positions with the card's own controls, save, reload → the card is two positions earlier with its content intact.

**Acceptance Scenarios**:

1. **Given** a step or note card in the mobile editor, **When** it is rendered, **Then** the card offers a **move up** and a **move down** control alongside the controls it already has.
2. **Given** the author presses **move up**, **When** the move completes, **Then** the card swaps with the entry above it in document order and the build is marked changed.
3. **Given** a card at the very start of the build, **When** it is rendered, **Then** **move up** is disabled; likewise **move down** on the very last entry. A disabled control is shown, not hidden, so the row of controls does not change width between cards.
4. **Given** the author moved a card by mistake, **When** they press the opposite control once, **Then** the card returns to where it was. The reverse press is the undo.
5. **Given** the author presses a move control, **When** the card moves, **Then** it stays on screen — the view follows the card rather than the card leaving the view.
6. **Given** the author was typing in a card's description, **When** they press a move control, **Then** the typed text is committed to that card first (as US1 §6).

---

### User Story 3 - Move a step into or out of an alternative (Priority: P2)

An author has written an alternatives block — "if they scouted you, defend" — and realises the wall step that sits after the merge line really belongs inside the defensive path. They move it up one position, past the merge line, and it becomes part of the path being edited. Later they change their mind and move it back out.

**Why this priority**: This is the ask that looks hardest and is nearly free: membership in a path *is* position, so this is the same move as any other. It is P2 rather than P1 only because the rules around the bracket need stating and testing.

**Independent Test**: With an alternatives block open on one of its paths, move a step from below the merge line to above it, save, reload → the step is stored inside that path; move it back out and it is stored on the common line again.

**Acceptance Scenarios**:

1. **Given** a step directly below an alternatives block's merge line, **When** it is moved up one position, **Then** it joins the **path currently being edited** and is drawn inside that path's lane.
2. **Given** a step inside a path, **When** it is moved down past the merge line, **Then** it becomes common to all paths and leaves the lane.
3. **Given** a step is being dragged near a block, **When** the drop positions are shown, **Then** the line above the merge marker and the line below it are visibly **different positions** — one inside the bracket, one outside — so an author can tell which one they are about to take.
4. **Given** a step joins or leaves a path, **When** the move completes, **Then** the other paths of that block are unchanged, keeping every step they held.
5. **Given** a path holding one step, **When** that step is moved out, **Then** the path is left empty and the block still saves — an empty path is a legitimate "do nothing different" (established in 027).
6. **Given** an alternatives block, **When** the author drags any row, **Then** the block's own markers are **never** a draggable row. The bracket moves as a whole or not at all, and "not at all" is this feature's answer.
7. **Given** a step is inside a path, **When** the author switches to a different path's tab, **Then** the step stays in the path it was put in — switching tabs shows a different path, it does not carry steps between them.

---

### User Story 4 - Move a step to another age section (Priority: P2)

The author realises a step written in Dark Age actually happens after the Feudal advance. They move it down past the section boundary and it becomes a Feudal step.

**Why this priority**: Genuinely useful — mis-aged steps are a common authoring error — but it is the one part with real machinery behind it, so it lands after the within-section cases are solid.

**Independent Test**: Move a step from the last position of one section to the first position of the next, save, reload → the step belongs to the second section, with its content unchanged.

**Acceptance Scenarios**:

1. **Given** a step at the end of a section, **When** it is moved down one position, **Then** it becomes the first entry of the following section.
2. **Given** a step at the start of a section, **When** it is moved up one position, **Then** it becomes the last entry of the preceding section.
3. **Given** a drag on desktop, **When** the pointer crosses into another section, **Then** that section's insert lines are valid drop positions like any other.
4. **Given** a step crosses a section boundary, **When** the move completes, **Then** its stated time and resource values are carried across **unchanged** (see FR-012) even though it now sits under a different age.
5. **Given** a section is emptied by moving its last step away, **When** it re-renders, **Then** it shows its empty state and offers an insert line, exactly as a newly created section does. The section itself is not removed.
6. **Given** a step moves between sections, **When** the move completes, **Then** every section it left and every section it joined re-renders with correct positions — no stale row, no duplicate, no row left behind.
7. **Given** an alternatives block, **When** any move is attempted, **Then** no step may enter or leave a path **across** a section boundary in one move — a block lives inside one section (027 FR-003), so a step arrives in the section first and joins the path with the next move.

---

### User Story 5 - Reorder without a mouse (Priority: P2)

An author using the keyboard reaches a step's move control by tabbing and moves it with the same one press that the phone uses.

**Why this priority**: The desktop affordance is a drag, and a drag alone is unreachable by keyboard. This project has just given the alternatives path tabs a keyboard (commit `266e83d`); a new control that only a mouse can operate would walk that back.

**Independent Test**: With no pointing device, tab to a step's move control and move the step one position in each direction.

**Acceptance Scenarios**:

1. **Given** the desktop editor, **When** the author tabs through a step row, **Then** a focusable control offers the same **move up** / **move down** actions the phone has.
2. **Given** a move control has focus, **When** it is activated, **Then** the step moves one position and focus stays with the moved step, so a second press moves it again.
3. **Given** any move control, **When** it is rendered, **Then** it carries a label naming what it does and what it will move, not an unlabelled icon.

---

### Edge Cases

- **The build's only step** → both move controls are disabled and no drop position exists. Nothing is hidden; nothing is broken.
- **Moving past an age-up advance** → permitted. The step changes age and its stated time may now read out of order; the author's numbers are never rewritten (FR-012). *(No time-order warning exists today and none is added here — see Assumptions.)*
- **A step lands between two markers of a block whose tab shows another path** → not reachable. Only the path being edited is present to be moved into; the others are reached by switching tabs first.
- **A drag released over the block's own marker rows** → resolves to the nearest valid insert line, never to "inside a marker".
- **A long build dragged past the bottom of the window** → the list scrolls while the drag continues, so a step can reach a section that was off screen when the drag began.
- **A move while an autocomplete or icon menu is open** → the menu closes and the move proceeds; a half-open menu must not attach itself to whatever row inherits the index.
- **Reduced motion** → the lift and settle are the only animation, and both respect the user's motion preference.
- **The readonly viewer** → gains nothing. A reader sees no handles, no move controls, and no change of any kind.
- **Concurrent edits to the same build** → out of scope; this feature is no more concurrent than typing in a cell already is.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: An author MUST be able to move an existing **step** to any other valid position in the build order without deleting and re-entering it.
- **FR-002**: An author MUST be able to move an existing **note** by the same means and under the same rules as a step. Notes are content.
- **FR-003**: Alternatives-block markers and age-up advances MUST NOT be movable by this feature. They are structure; a build's shape is changed by inserting and removing, not by dragging.
- **FR-004**: On pointer-capable screens the editor MUST offer **drag and drop**, initiated from a dedicated **handle** on the row — never from the row body. Description and resource cells are editable text and MUST keep their ordinary selection behaviour.
- **FR-005**: During a drag the editor MUST show (a) which row is being moved and (b) the single position it would land in, using the insert positions the editor already draws between rows.
- **FR-006**: A drag MUST be cancellable by `Escape` and by releasing outside a valid position, leaving the build untouched and unmarked.
- **FR-007**: On small screens the editor MUST offer **move up** and **move down** controls on each step and note, each moving the entry exactly **one position in document order**. Boundaries — sections and alternatives brackets — are crossed by continuing to press, not by a separate action.
- **FR-008**: Move controls MUST be **disabled, not hidden**, where a direction is unavailable, so a card's control row keeps a constant shape.
- **FR-009**: The same one-position move actions MUST be reachable by keyboard on every screen size, with accessible labels, and focus MUST stay with the moved entry so repeated presses move it repeatedly.
- **FR-010**: Moving an entry across an **alternatives merge line** MUST change its membership: above the line it belongs to the path being edited, below it is common to all paths. Nothing MUST be stored to record membership beyond position.
- **FR-011**: A move MUST NOT alter any other path of a block, MUST leave a path legitimately empty if its last step is moved out, and MUST NOT move steps between two paths in one action.
- **FR-012**: A move MUST carry the entry's content **verbatim** — description, icons, note text, stated time, villager count and every resource value. The system MUST NOT renumber, re-time, re-estimate or otherwise rewrite an author's stated values because a step changed position.
- **FR-013**: An entry MUST be movable **across section boundaries** in both directions, including into and out of an age-up section, becoming an ordinary member of the section it lands in.
- **FR-014**: A step MUST NOT cross a section boundary and enter or leave an alternatives path in the **same** move — an alternatives block lives entirely within one section (027 FR-003) and that invariant MUST hold at every intermediate position.
- **FR-015**: Text the author has typed into an editable cell MUST be committed to its own entry **before** any move reorders the rows, so no edit is ever applied to the wrong step.
- **FR-016**: A move MUST leave every position-derived reading correct — resolved times, economy series, the timeline link and per-row controls MUST all address the entry now at that position, not the one that used to be there.
- **FR-017**: A move that results in no change of position MUST NOT mark the build as changed.
- **FR-018**: The stored document format MUST be unchanged. A build that nobody reorders MUST be byte-identical to what it is today, and **no migration** MUST be required.
- **FR-019**: The reading view, focus mode, the economy graph and the overlay export MUST gain no reordering affordance and MUST require no change beyond reading whatever order the author saved.
- **FR-020**: A section left empty by a move MUST keep existing, showing its ordinary empty state and insert affordance. Moving a step out of a section MUST NOT delete the section.
- **FR-021**: Moving MUST also be reachable as **Alt + ↑ / ↓** from anywhere in the row, including while a description is being written — not only from the move controls. *(Added during implementation: the editor already used Alt as its modifier for `Alt+Enter` to add a step and `Alt+Backspace` to remove one, so moving joined an existing family rather than starting one. The controls satisfy FR-009 on their own; this is what makes the action usable without leaving the text.)*
- **FR-022**: Every shortcut the editor answers to MUST be **stated somewhere a mouse user will meet it** — on the control's tooltip where one exists, and in the insert menu for the two entries that have one. *(Added during implementation: `Alt+Enter` and `Alt+Backspace` had existed since before this feature and were written down nowhere, which is the same as not existing. Adding more hidden shortcuts would have made that worse.)*
- **FR-023**: A shortcut MUST NOT be offered for an action that is refused in context. Alternatives and Advance are offered **only** from the insert menu, because the menu states *why* they are unavailable and a shortcut can only fail silently. *(Added during implementation.)*

### Key Entities

- **Movable entry** — a step or a note. Identified by its **position** in the build; it carries no field saying where it belongs and gains none here.
- **Drop position** — a place *between* two entries (or at a section's start or end). The positions immediately above and below an alternatives merge line are **distinct** positions with different meanings, and that is the only rule membership needs.
- **Move** — a single reordering action: one entry, one origin, one destination. Not persisted, not stacked, not undoable by any mechanism other than moving the entry back.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: An author can put any step or note anywhere else in the build without re-entering any of its content — text, icons, time and every resource value arrive unchanged, verified by reload.
- **SC-002**: On a 390px screen, moving a step one position takes exactly one press, and reversing it takes exactly one press.
- **SC-003**: A step can be moved into an alternative path and back out, and the build reloads each time with the step where it was left and every other path untouched.
- **SC-004**: A step can be moved from one age section to another in both directions, and the build reloads with it under the new age.
- **SC-005**: Every reordering action is reachable and operable **without a pointing device**.
- **SC-006**: No stated time or resource value is ever changed by a move — an author's numbers are theirs.
- **SC-007**: Builds where nobody reorders anything are unchanged in storage and in every reading surface; no migration runs.
- **SC-008**: No new colour, icon family or component vocabulary is introduced — the handle, the drop line and the move controls are built from what the editor already draws.
- **SC-009**: A build containing an alternatives block can be fully reordered without any path ever losing a step it was not asked to lose, across every case in User Story 3.

## Assumptions

- **Built from the design system already in use** (Constitution III). The drop position indicator reuses the insert lines the editor already renders between rows, rather than introducing a second kind of line meaning something similar.
- **No new dependency is assumed** for dragging (Constitution I). If a sortable library turns out to be genuinely necessary, that needs justifying against what the editor already provides — the insert positions it draws are already the drop targets.
- **Mobile move controls are persistent, not a mode** (confirmed with the author, 2026-08-10). A reorder mode would keep the cards cleaner but turns one press into three, and long-press drag is imprecise at 390px and fights the editable text fields. The cost is accepted: two small controls join the action row each card already draws.
- **No undo stack.** The reverse move is the undo, on every surface. An author who mis-drops drags it back; an author who mis-presses presses the other control. Anything more is a general editor concern, not this feature's.
- **No time-order validation is added.** Moving a step past an earlier one can leave stated times out of sequence, and the editor does not warn about that today. Rewriting or flagging an author's times is a separate decision with its own consequences, and guessing at it here would be this feature quietly changing build data.
- **Whole alternatives blocks are not movable**, and neither are age-up advances. 027's rule that a block cannot span an advance is preserved by construction rather than by a check, because the only thing that moves is a single entry.
- **Moving a step from one path of a block to another** is out of scope: move it out, switch tab, move it in. Two moves, no new rule.
- **Multi-select and multi-entry moves** are out of scope. One entry per move.
- **Reordering is an editor-only concern.** The readonly viewer, focus mode, the economy graph and the overlay export are read-side and unchanged.
- **Cross-section moves need coordination the editor does not have today.** Each age section's editor owns its own working list, initialised once, with nothing syncing it back from above; moving an entry between two of them is the one part of this feature that is not a local operation. This is where the risk sits, and it is why User Story 4 is sequenced after the within-section stories rather than bundled into them.
- **The editor keeps two parallel working lists per section**, held aligned by position, and every existing mutation splices both. A move is a mutation like any other and must respect that, or typed text lands on the wrong row — which is what FR-015 exists to prevent.
- **Rows already carry stable identity** for rendering purposes, so reordering does not depend on introducing one.
- **No Firestore schema change and no security-rule change**, since nothing new is stored (Principle V review is therefore a confirmation, not a change).

## Dependencies

- **027 Build Alternatives** — supplies the positional-membership model this feature depends on entirely (FR-010). Its deferral note is this feature's premise.
- **The existing insert-position affordance** in the editor, which becomes the drop target.
- **The existing per-row and per-card control clusters**, which is where the move controls and the drag handle have to fit without growing the row.
