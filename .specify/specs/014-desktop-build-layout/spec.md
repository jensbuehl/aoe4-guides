# Feature Specification: Desktop Build View & Editor Layout

**Feature Branch**: `014-desktop-build-layout`

**Created**: 2026-06-12

**Status**: Draft

**Input**: User description: "We shipped the mobile build view/edit redesign (`011`). The desktop build **header** and **build-order steps viewer/editor** are now the outdated half — the desktop table is generic and the edit fields drifted out of sync with the read-only view. Bring the desktop representation up to the same bar: a build header with a prominent civilization lockup, and a refined build-order table (fixed 5 resource positions, calculated villagers, gold age-transition lane, inline delta affordance) that looks **identical** in view and edit except for the edit affordances. Keep the AOE4 identity; reuse Vuetify and the real theme tokens."

## Scope & Non-Goals *(read first)*

**In scope — desktop / tablet breakpoint only (`md-and-up`):**

- The **build header** (hero) as it renders on desktop for both the **view** route (`BuildDetails.vue`) and the **edit/create** route (`BuildEditor.vue` — the `010` unified editor): the civilization lockup, title, classification chips, vote/favorite/overflow actions, and the in-header **Publish** action + overflow `Save as draft` / `Discard` on the edit route.
- The **build-order steps** presentation and inline editing **at desktop width** — the fixed resource columns, calculated villager total, editable timestamp, step description (WYSIWYG icons), step add/remove, age-up add/remove, the gold **age-transition lane**, and the **delta affordance**.
- The desktop placement of the **Description** card and the **Video** card around the build order.

**Explicitly NOT in scope (leave exactly as-is):**

- **Touch/tap interaction at `md-and-up`**: hover affordances (insert line, ✕ reveal, corner Insert-icon) are pointer/mouse-only at this breakpoint. Touch tablets that land in `md-and-up` are an accepted gap for this iteration.
- The **mobile (`xs`/`sm`)** layout delivered in `011`.
- Any **data model**, Firestore schema, Vuex store shape, routing, or `firestore.rules`.
- The **save / draft / publish / delete / duplicate / export / import** *logic* (only the desktop *placement* of their triggers changes).
- The **icon shortcode format** (`::id::`) and the **`IconSelector` / `IconAutoCompleteMenu` behaviour** — desktop reuses them unchanged.
- The **icon class → tile-background color coding** (the dynamic radial-gradient tile per icon class). This stays **exactly** as today; only icon **size** may be tuned for the desktop layout.
- **Focus mode** — its behaviour and entry point are untouched (the "Focus mode" affordance in the build-order card header stays as a trigger only).
- Comments, Discussion, Vote, Favorite behaviour (only their desktop placement, if touched, follows existing patterns — no behavioural change).

> This feature is a **desktop layout refresh + view/edit parity pass**, not a rewrite. Every business rule and the entire mobile layout stay. The deliverable is "the same features, with a sharper desktop table that reads identically whether you're viewing or editing."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Read a build on desktop (Priority: P1)

A player studies a build on a wide screen before a match. They scan the build order top-to-bottom: timestamps, villager counts, where each resource goes (always in the same column), the age transitions, and the step notes with their AOE4 icons.

**Why this priority**: Viewing is the dominant desktop case. The fixed-column table is what makes a build *scannable*; if only this ships, desktop is already materially better.

**Independent Test**: Load a published build at ≥1280 px. Confirm the header shows a prominent civ lockup + title + classification chips; the build order is a single fixed-column table where each resource occupies a stable column; age transitions read as a bracketed gold lane; and step notes render `::icons::` inline.

**Acceptance Scenarios**:

1. **Given** a published build on desktop, **When** the page loads, **Then** the hero leads with a **civilization lockup** (flag + civ name) distinct from the metadata chips (status / season / map / strategy), with the title beneath and vote / favorite / overflow on the right.
2. **Given** a build-order step, **When** it renders, **Then** the five resource positions (Builder · Food · Wood · Gold · Stone) appear as **fixed columns** with a calculated villager total and the timestamp, and the step note renders its `::icons::` inline as real class-tinted icon tiles.
3. **Given** a resource value that increased from the previous step, **When** the row renders, **Then** that cell shows a subtle **gold top-border delta accent** ("attention here"); decreases and unchanged cells show no accent.
4. **Given** an empty resource position, **When** the row renders, **Then** the cell shows a faint placeholder dash (no border, no tile) so the column meaning stays learnable while filled numbers dominate.
5. **Given** an age-up, **When** the build order renders, **Then** the "while aging up" steps are bracketed by a gold left-stripe **lane** between an "Age up to {age}" marker and a "{age} Age reached" plate (both as full-radius gold cards), with no row indentation that breaks column alignment.
6. **Given** a multi-line step note, **When** it wraps, **Then** the timestamp, villager total, and resource cells **top-align** with the note's first line (read top-down), and the note flows beneath.

---

### User Story 2 - Edit a build on desktop, identical to view (Priority: P1)

An author edits a build on desktop. Every field is inline-editable in place, and the page does not visually re-arrange between view and edit — the table, columns, and alignment are identical; only the edit affordances (inputs, the ✕, the insert line, the corner Insert-icon) appear.

**Why this priority**: The drifted edit fields are the specific regression called out. View/edit parity is the heart of this feature.

**Independent Test**: Toggle a build between view and edit on desktop. Confirm row heights, column positions, and the first-line alignment of time / villagers / resources are pixel-identical; the only differences are the edit controls.

**Acceptance Scenarios**:

1. **Given** edit mode, **When** a step renders, **Then** the timestamp is a free-text input, each resource is a tap-to-type cell, and the villager total recomputes live and stays read-only — all sitting in the **same positions and alignment** as the view-mode reference (time / villagers / resources centered on the first note line).
2. **Given** edit mode, **When** the user focuses a step note, **Then** a corner **Insert-icon** button appears at the note's bottom-right (revealed on focus only, zero layout shift), opening the icon picker; inserting drops the icon **at the caret** (caret lands after it, focus retained).
3. **Given** edit mode, **When** the user hovers between two rows **or after the last row**, **Then** a gold **insert line** appears to add a step at that position (there is **no** "Add step" button — the hover insert is the only step-add affordance, and it is reachable after the final row).
4. **Given** edit mode, **When** the user clicks **Add age-up**, **Then** a new age-up is appended **already initialised** with one empty step in the "aging up" lane and one empty step in the new age's section, and **focus lands in the first new step's timestamp cell** ready to type.
5. **Given** a step or age-up in edit mode, **When** the user hovers the row, **Then** a single consistent **✕** remove control is revealed (same shape for steps and age-ups).
6. **Given** an age-up with steps after it, **When** the user removes it, **Then** an "age down" confirmation states it removes the age-up **and every step after it**, and only on confirm are they removed.
7. **Given** edit mode, **When** the user wants to publish, **Then** **Publish** is a primary action in the build header (always reachable, no sticky bottom bar), and `Save as draft` / `Discard changes` live in the header overflow (⋮).

---

### User Story 3 - Use desktop width well (Priority: P2)

A player on a wide screen benefits from the description and video being readable without pushing the build order far down the page.

**Why this priority**: Layout polish that improves first-screen density; lower priority than the table and parity work.

**Independent Test**: At ≥1280 px confirm the page reads header → description → build order → video in a single centered column with comfortable proportions. The side-rail layout is out of scope for this iteration (NC-2).

**Acceptance Scenarios**:

1. **Given** the view route on desktop, **When** the page loads, **Then** the Description sits in its own collapsible card above the build order and the Video in its own card, with the build order as the dominant element.
2. **Given** the edit route on desktop, **When** the page loads, **Then** Build details + Classification appear as stacked cards (single column, like the original editor) above the build order.

---

### Edge Cases

- **Empty build order (0 steps) in view mode**: render the fixed column header row with a single centered placeholder row ("No steps yet"). The build-order card remains visible.
- **Empty build order (0 steps) in edit mode**: render the fixed column header row with the same placeholder row, and expose the **trailing insert line** immediately (the standard hover affordance from FR-020 serves as the "add first step" CTA — no dedicated button is added).
- **Empty step note** in edit mode shows a placeholder hint; it disappears once content exists and is not repeated as persistent chrome.
- **Insert-icon corner button** is revealed only while a step note is focused; it is absolutely positioned so revealing it causes **zero** card-height change (no CLS).
- **A step with all five resources empty** still renders the five fixed columns (faint dashes); its villager total reads zero.
- **First step in the build** has no "previous" row — it shows **no** delta accents (nothing to compare against).
- **Last row** must expose the hover insert affordance (a trailing insert line), so a step can be appended without a dedicated button.
- **Removing the first/only step**, or an age-up that is the **last** element, leaves the build valid (no orphaned section state).
- **Caret in an empty note** vs **between two icons** — insertion lands at the real caret in both; if focus was lost (clicking the picker), insertion uses the **last known caret**, never a silent append.
- **Multi-line note** never decouples its row's numbers from the first line (top-alignment holds at any note length).
- **Very long title** wraps (`text-wrap: balance`) without pushing the header actions off-screen.
- **Theme**: every desktop surface renders correctly in dark and light (gold/navy role swap); delta accents and the age lane use the theme accent, not a hardcoded color.

## Requirements *(mandatory)*

### Functional Requirements

**Build header (view + edit)**

- **FR-001**: The desktop hero MUST lead with a **civilization lockup** — the civ flag plus the civ name — visually distinct from and more prominent than the metadata chips.
- **FR-002**: The metadata chips MUST show status (New/Draft), season, map, and strategy; the civilization MUST NOT be reduced to just another equal chip (it is the lockup, per FR-001).
- **FR-003**: On the **edit** route, **Publish** MUST be a primary action in the build header, and `Save as draft` + `Discard changes` MUST live in the header overflow (⋮) — there MUST be **no** sticky bottom action bar on desktop.
- **FR-004**: The editable title MUST be inline-editable in edit mode with a calm affordance (no permanent underline; an accent cue on focus) and MUST NOT shift layout between view and edit.

**Build-order table (view + edit)**

- **FR-005**: Each step MUST present resources in **five fixed columns** in a stable order (Builder · Food · Wood · Gold · Stone); an unset resource MUST still occupy its column as a faint placeholder dash (no tile, no border) rather than collapsing the layout.
- **FR-006**: The villager total per step MUST be **calculated** as the sum of the five resource slots and MUST be read-only in all modes.
- **FR-007**: The step timestamp MUST be **editable free text** in edit mode and MUST NOT be derived/calculated.
- **FR-008**: Step descriptions MUST render AOE4 icons inline as real class-tinted icon tiles in both view and edit; raw `::id::` shortcodes MUST NOT be visible to the reader or the editor.
- **FR-009**: The **icon class → tile-background color coding** MUST be preserved exactly as today (no change to the dynamic radial-gradient tiles); only icon **size** may be adjusted to suit the desktop layout.
- **FR-010**: Reordering of steps MUST NOT be offered (no drag handles) in this iteration.
- **FR-011**: Step and age-up removal MUST use a single consistent affordance (the "✕"), hover-revealed per row, not a mix of icons.
- **FR-012**: Removing an age-up MUST be treated as "age down": it removes the age-up **and all steps after it**, and MUST require a confirmation stating this consequence before applying.

**Age transitions & delta affordance**

- **FR-013**: An age-up MUST render as a gold **transition lane**: an "Age up to {age} Age" marker card, the "while aging up" steps bracketed by a gold left-stripe lane (drawn with an *inset* edge so it does **not** indent or misalign the columns), and a "{age} Age reached" plate card. Marker and plate are full-radius gold cards with consistent vertical padding matching the step rows.
- **FR-014**: A resource cell whose value **increased** versus the previous step MUST show a 2 px **gold top-border** delta accent. Decreased and unchanged cells MUST show no accent. The first step (no predecessor) MUST show no accents.

**Inline editing & WYSIWYG (the critical risk — see `011` precedent)**

- **FR-015**: Inserting an icon (via picker or inline autocomplete) MUST insert at the user's **caret position**, place the caret immediately after the inserted icon, and keep focus in the field — the caret MUST NOT jump.
- **FR-016**: The editor's in-memory value and the persisted value MUST round-trip **losslessly** (icons ↔ shortcodes), with no duplicated, dropped, or reordered tokens; multi-line notes MUST round-trip their line breaks.
- **FR-017**: Inline icons in the editor MUST behave as **atomic** units (one backspace removes a whole icon; the caret cannot land inside an icon).
- **FR-018**: The Insert-icon trigger MUST be a **corner button** revealed only when a step note is focused, absolutely positioned so it causes **zero** layout shift, and activating it MUST NOT lose the caret.
- **FR-019**: `Enter` inside a step note MUST insert a **line break** within the note (multi-line editing); it MUST NOT create a new step.

**Add-step / add-age-up affordances**

- **FR-020**: There MUST be **no** "Add step" button. A new step is added via a gold **hover insert line** between rows, and this affordance MUST also be available **after the last row** (trailing insert line).
- **FR-021**: **Add age-up** MUST append a new age-up **pre-seeded** with one empty step in the "aging up" lane and one empty step in the new age's section, and MUST move **focus into the first new step's timestamp cell**.

**Section note rows (WYSIWYG parity)**

- **FR-026**: A **section note row** (description-only row with no timestamp or resource cells) MUST render its icon shortcodes as class-tinted inline tiles in view mode — identical to step notes (FR-008 extended).
- **FR-027**: In edit mode, section note rows MUST become fully WYSIWYG using the same `useIconRichText` host as step notes: icons are atomic, the Insert-icon corner button is revealed on focus, and the round-trip MUST be lossless (FR-016/FR-017/FR-018 apply equally). Raw `::id::` shortcodes MUST NOT be visible.
- **FR-028**: A section note row in edit mode MUST span the full width of the table (all five resource columns collapsed), preserving column alignment for adjacent step rows above and below it.

**Keyboard navigation (edit table)**

- **FR-029**: In the edit table, **Tab** MUST advance focus left-to-right through a step row's interactive cells in this order: Timestamp → Builder → Food → Wood → Gold → Stone → Note; from Note, Tab MUST move to the **next row's Timestamp**. Shift-Tab MUST reverse this order. This applies to step rows only; section note rows participate in Tab order as a single focusable field.

**View/edit parity & desktop layout**

- **FR-022**: Edit mode MUST be **visually identical** to view mode except for the edit affordances: row heights, column positions, and the **first-line alignment** of timestamp / villager total / resource cells MUST match the view-mode reference (all centered on the note's first line; top-aligned on multi-line steps).
- **FR-023**: The build-order card header MUST keep the existing **Focus mode** trigger unchanged (entry point only; no behavioural change) and MUST NOT add age-jump shortcuts (removed for simplicity).
- **FR-024**: The last row of the table MUST NOT render a bottom separator; a note row directly above an age-up MUST NOT render a bottom separator (avoid double lines against the gold cards).
- **FR-025**: Every desktop change MUST be implemented with the project's existing component library (Vuetify) and theme tokens — no new colors, no hardcoded hex, no new dependencies (Constitution I & III).

### Key Entities

- **Build**: existing Firestore `builds/{id}` document — unchanged. Desktop reads/writes the same fields (title, civ, season, map, strategy, video, description, build order).
- **Build-order section / step**: existing structure — a step has a timestamp (text), per-resource values (food/wood/gold/stone/builder), an implied villager total (sum), and a description containing icon shortcodes. Age-up markers separate age phases. **No schema change** — desktop only re-presents these. The "delta accent" is a pure render-time comparison to the previous step; it is **not** persisted.
- **Icon token**: existing `::id::` shortcode ↔ rendered class-tinted icon tile. The serialization contract and the per-class tile color coding are unchanged.
- **Section note row**: a build-order row that contains **only** a text+icon description field — no timestamp, no resource cells, no villager count. Appears inline between steps (e.g., "Keep the scout looping…"). Distinct from a build-order step (which always has timestamp + resource columns).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: At ≥1280 px, the view route reads header → description → build order → video with no horizontal scroll, and every resource value sits in a stable column across all rows.
- **SC-002**: Toggling a build between view and edit produces **no** change in row heights, column positions, or the first-line alignment of timestamp / villager / resource cells (measured: identical center offsets, ±1 px).
- **SC-003**: A step note containing a mix of text and ≥3 icons (including a multi-line note) **round-trips losslessly** through save → reload (0 duplicated/dropped/reordered icons; line breaks preserved; 0 raw shortcodes visible) in 100% of test cases.
- **SC-004**: In 20 consecutive icon insertions at varied caret positions (start, middle, end, between two icons), the caret lands immediately after the inserted icon **every time** and never jumps; focusing a note causes **0 px** card-height change.
- **SC-005**: The delta accent appears on exactly the cells whose value increased vs the previous step (0 false positives on unchanged/decreased cells; 0 accents on the first step) across a full build.
- **SC-006**: Clicking **Add age-up** yields an age-up + one empty aging-up step + one empty reached-section step, with focus in the first new step's timestamp cell, in 100% of cases.
- **SC-007**: The hover insert line is reachable **after the last row** (a step can be appended with no "Add step" button present), and removing an age-up removes it plus all later steps only on confirm (100%).
- **SC-008**: The icon-class tile color coding is **unchanged** versus before the feature (visual diff of the rendered tiles), and Focus mode behaviour is unchanged.

## Assumptions

- This feature ships the desktop refresh against the existing `BuildDetails.vue`, `BuildEdit.vue`, and `BuildNew.vue` at `md-and-up`. Re-convergence with the `010-build-editor-unification` shared `BuildHeader`/`BuildEditor` happens in a follow-up after `010` lands (NC-1 resolved).
- The five resource slots (Builder · Food · Wood · Gold · Stone) and the villager-as-sum rule reflect the existing build-order data model.
- The existing `IconAutoCompleteMenu` (inline `::`) and `IconSelector` (picker) are reused unchanged; on desktop the picker is the existing dialog/menu, not a bottom sheet.
- The icon-class → tile color coding reuses the existing per-icon class data; the prototype's category→class map is a faithful stand-in until wired to the real data.
- "Owner-gated" reuses existing ownership/verification guards; no new permission logic.
- Desktop breakpoint is Vuetify's `md-and-up`, consistent with the twin-block responsive pattern in the build views; this feature is the desktop sibling of `011`.
- Hover-based affordances (insert line, ✕ reveal, Insert-icon corner button) are pointer/mouse-only at `md-and-up`. Touch tablets that reach `md-and-up` are an accepted gap for this iteration; touch users below `md` are served by the `011` mobile layout.

## Clarifications

### Session 2026-06-12

- Q: Are hover-only affordances (insert line, ✕ reveal, corner Insert-icon) required on touch tablets at `md-and-up`? → A: No — pointer/mouse-only at `md-and-up`; touch tablets at this breakpoint are an accepted gap.
- Q: Structurally, what is a "section note row"? → A: A build-order row with only a text+icon description field — no timestamp, no resource cells, no villager count. Appears inline between steps (e.g., "Keep the scout looping…"). FR-026/027/028 added.
- Q: In the edit table, what does Tab do inside a resource cell? → A: Tab advances Timestamp → Builder → Food → Wood → Gold → Stone → Note → next row's Timestamp (left-to-right, then next row). FR-029 added.
- Q: When a build has 0 steps, what renders in the build-order card (view mode)? → A: Column header + centered placeholder row ("No steps yet"). Edit mode additionally shows the trailing insert line immediately as the add-first-step affordance (no dedicated button). Edge cases updated.
- Q: What does Enter do in a timestamp or resource cell (not a note)? → A: Browser default / no-op. No special Enter handling for these input types; FR-019 applies only to step notes.
- Q: Should the desktop build-order table keep the Vuetify `v-table` or be replaced with CSS grid? → A: Keep `v-table` (Constitution III — Vuetify components before custom ones). Insert lines rendered as `<tr class="ins-row">` in `<tbody>`; data-row DOM access updates to `querySelectorAll('tr.step-row')[index]`.

## Resolved Decisions

- **NC-1 (resolved)**: This feature ships the desktop refresh against the **current three views** (`BuildDetails.vue`, `BuildEdit.vue`, `BuildNew.vue`) and re-converges with `010-build-editor-unification` after that spec lands. The hero and header work is applied at `md-and-up` on the existing views.
- **NC-2 (resolved)**: Ship the **single centered column only**. The optional `lg`-and-up sticky side-rail is excluded from this iteration.
- **NC-3 (resolved)**: Section-level note rows **become WYSIWYG** in edit mode — full parity with step notes. Icons render inline and are editable via the same `useIconRichText` composable and icon picker.
