# Feature Specification: Mobile Build View & Editor Layout

**Feature Branch**: `013-mobile-build-layout`

**Created**: 2026-06-10

**Status**: Draft

**Input**: User description: "On mobile the build view/edit screens are barely usable — the header is heavy and the build-order step layout breaks down at phone width. Redesign the **mobile representation only** so it keeps the AOE4 identity but is usable on a phone. Slimmer shared header (shared between the view and edit routes). Fewer chips; secondary info (map/strategy) dropped on mobile. Build-order steps need a layout that works at phone width and stays editable. Leave desktop and all non-layout behaviour as is."

## Scope & Non-Goals *(read first)*

**In scope — mobile breakpoint only (`xs`/`sm`, Vuetify `hidden-md-and-up`):**

- The **shared build header** as it renders on phones, used by both the **view** route (`BuildDetails.vue`) and the **edit/create** route (`BuildEditor.vue` — the `010` unified editor; until that lands, `BuildEdit.vue` / `BuildNew.vue`).
- The **build-order step** presentation and inline editing **at mobile width** — the resource columns, villager total, timestamp, step description (WYSIWYG icons), step add/remove, and age-up add/remove.
- Mobile placement of the **Description** card, the **Video** card, the **overflow menu**, and the **edit action bar**.

**Explicitly NOT in scope (leave exactly as-is):**

- The **desktop / tablet (`md-and-up`)** layout of every screen above.
- Any **data model**, Firestore schema, Vuex store shape, routing, or `firestore.rules`.
- The **save/draft/publish/delete/duplicate/export/import** *logic* (only the mobile *placement* of their triggers changes).
- The **icon shortcode format** (`::id::`) and the existing `IconAutoCompleteMenu` / `IconSelector` *behaviour* — mobile reuses them, it does not redefine them.
- Comments, Discussion, Vote, Favorite, FocusMode behaviour (only their mobile placement, if touched, follows existing patterns — no behavioural change).

> This feature is a **responsive layout refactor**, not a rewrite. Every desktop pixel and every business rule stays. The deliverable is "the same features, laid out for a thumb."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Read a build on a phone (Priority: P1)

A player opens a shared build link on their phone between matches. They need to scan the build order — times, villager counts, where each resource goes, and the step notes with their AOE4 icons — without pinch-zooming or horizontal scrolling.

**Why this priority**: Viewing is the overwhelmingly common mobile case (shared links, looking something up mid-session). If only this ships, the site is already usable on a phone.

**Independent Test**: Load a published build on a 390 px-wide viewport. Confirm the header, hero, description, every build-order step, and the video all read top-to-bottom with no horizontal scroll and no text below the legibility floor.

**Acceptance Scenarios**:

1. **Given** a published build on a 390 px viewport, **When** the page loads, **Then** the header is a single slim row (logo + profile/overflow) and the hero shows title + status/civ/season chips with no civilization flag block crowding the title.
2. **Given** a build-order step, **When** it renders on mobile, **Then** the five resource positions (Builder · Food · Wood · Gold · Stone) appear in a fixed order with the villager total and the editable-in-edit timestamp, and the step note renders its `::icons::` inline as real icon tiles.
3. **Given** a long build description, **When** the user taps the Description card header, **Then** it collapses/expands and the collapsed header keeps its title vertically centered.

---

### User Story 2 - Edit a build step on a phone (Priority: P1)

An author fixes a build on their phone: corrects a villager count, edits a timestamp, rewrites a step note and drops in an icon, adds a step, and removes a mis-placed age-up.

**Why this priority**: Editing on mobile is the screen the user called out as "barely usable." It shares the header with view, so it is co-delivered.

**Independent Test**: On a 390 px viewport in edit mode, change a resource value and confirm the villager total recomputes; edit a timestamp; focus a note, insert an icon via the picker, and confirm the caret does not jump and the saved value round-trips to the correct shortcodes.

**Acceptance Scenarios**:

1. **Given** a step in edit mode, **When** the user changes a resource slot's number, **Then** that step's villager total recomputes live and is never directly editable (it is always the sum of the five slots).
2. **Given** a step's timestamp in edit mode, **When** the user edits it, **Then** the typed value is stored verbatim (it is free text, not derived/calculated).
3. **Given** a focused step note, **When** the user opens the icon picker and taps an icon, **Then** the icon is inserted **at the caret position** (not appended to the end), the caret lands immediately after the inserted icon, and focus stays in the note.
4. **Given** a step note containing inline icons, **When** the build is saved and reloaded, **Then** the note's text and icons round-trip exactly (no duplicated, dropped, or reordered icons; no raw `::id::` text leaking into the rendered view).
5. **Given** the user wants to remove a step, **When** they tap the step's remove control, **Then** a single consistent "✕" affordance removes that step (the same control shape is used for steps and age-ups — no mixed trashcan/✕).
6. **Given** an age-up marker with steps after it, **When** the user removes the age-up, **Then** a confirmation explains this "ages down" — it removes the age-up **and every step after it** — and only on confirm are they removed.

---

### User Story 3 - Manage a build you own, from a phone (Priority: P2)

The owner of a build, viewing it on a phone, wants to edit, duplicate, export to the overlay tool, download, or delete it — without those actions cluttering the slim header.

**Why this priority**: Management rounds out the mobile experience but is lower-frequency than read/edit. The actions already exist; this is about reachable mobile placement.

**Independent Test**: As the owner on a 390 px viewport, open the hero overflow on the view route and confirm all owner actions are present (including Delete); as the editor, confirm the overflow has no Delete and that Draft/Publish live in the action bar.

**Acceptance Scenarios**:

1. **Given** the **view** route and the viewer **owns** the build, **When** they open the hero overflow (⋮), **Then** management actions including **Delete** are available (owner-gated, exactly as on desktop).
2. **Given** the **view** route and the viewer does **not** own the build, **When** they open the overflow, **Then** they see engagement/secondary actions (Favorite, Like, Share, Copy to overlay, Download, Report) and **no** Delete or Edit.
3. **Given** the **edit** route, **When** the user opens the hero overflow, **Then** it offers Duplicate / Copy to overlay / Download / Discard changes and **no** "Delete build" and **no** "Preview" (delete lives only on the owner's view route; edit ≈ the detail view, so a dedicated preview is unnecessary).
4. **Given** the **edit** route, **When** the user scrolls, **Then** a sticky bottom action bar shows an "Unsaved changes" indicator plus **Draft** and **Publish** actions.

---

### Edge Cases

- **Slow / failed load** — while data fetches, the view route shows structural skeleton rows (header + hero + step placeholders). If the Firestore read fails, the page shows an inline error with a retry action (no blank screen).
- **Empty step note** in edit mode shows a placeholder hint (the `::`/Insert-icon affordance) that disappears once content exists — the hint is not repeated as persistent chrome on every step.
- **Insert-icon affordance** is revealed only while a step note is focused, so it does not repeat down every row.
- **A step with all five resources empty** still renders the five fixed positions (each as a dim placeholder), so the column meaning stays learnable; its villager total reads zero.
- **Caret in an empty note** vs. **caret between two existing icons** — insertion must land at the real caret in both cases; if focus was lost (e.g. tapping the picker), insertion uses the **last known caret** inside that note, never a silent append.
- **Removing the first/only step** or an age-up that is the **last** element — the build must remain valid (no orphaned section state).
- **Very long title** wraps without pushing the overflow button off-screen.
- **No video** on a build — the Video card is omitted on the view route; in edit it shows the empty URL field.
- **Theme**: every mobile surface must render correctly in both dark and light themes (gold/navy role swap).

## Requirements *(mandatory)*

### Functional Requirements

**Shared header (view + edit)**

- **FR-001**: On mobile, the build screens MUST present a single slim app-header row shared between the view and edit routes (no tall multi-row header).
- **FR-002**: The mobile header MUST NOT show a search control (search does not exist on these screens yet).
- **FR-003**: The mobile hero MUST show the build title plus a reduced chip set (status, civilization-as-text, season) and MUST NOT render a civilization flag block that competes with the title.
- **FR-004**: The mobile hero MUST drop the secondary map/strategy line (this info remains available in the editor's Classification fields and on desktop).

**Build-order step (view + edit)**

- **FR-005**: Each step MUST present resources in **five fixed positions** in a stable order (Builder · Food · Wood · Gold · Stone); an unset resource MUST still occupy its position as a placeholder rather than collapsing the layout. In edit mode, tapping a resource slot MUST activate an inline numeric input directly in that position (no bottom sheet or modal).
- **FR-006**: The villager total per step MUST be **calculated** as the sum of the five resource slots and MUST be read-only in all modes.
- **FR-007**: The step timestamp MUST be **editable free text** in edit mode and MUST NOT be derived/calculated.
- **FR-008**: Step descriptions MUST render AOE4 icons inline as real icon tiles (styled by icon class, matching desktop), in both view and edit; raw `::id::` shortcodes MUST NOT be visible to the reader or the editor.
- **FR-009**: Reordering of steps MUST NOT be offered (no drag handles) in this iteration.
- **FR-010**: Step and age-up removal MUST use a single consistent affordance (the "✕"), not a mix of icons.
- **FR-011**: Removing an age-up MUST be treated as "age down": it removes the age-up **and all steps after it**, and MUST require a confirmation that states this consequence before applying.

**WYSIWYG description editing (the critical risk — see plan)**

- **FR-012**: Inserting an icon (via picker or inline autocomplete) MUST insert at the user's **caret position**, place the caret immediately after the inserted icon, and keep focus in the field — the caret MUST NOT jump to the start/end of the field.
- **FR-013**: The editor's in-memory value and the persisted value MUST stay in sync such that a note's content **round-trips losslessly** through serialize → save → load → render (icons ↔ shortcodes), with no duplicated, dropped, or reordered tokens.
- **FR-014**: Inline icons in the editor MUST behave as **atomic** units (a single backspace/delete removes a whole icon, the caret cannot land "inside" an icon).
- **FR-015**: The Insert-icon trigger MUST appear only when a step note is focused (not as persistent per-row chrome), and activating it MUST NOT steal/scroll focus such that the caret position is lost.

**Loading state**

- **FR-021**: While build data is fetching on the mobile view route, the page MUST display skeleton placeholder rows that match the structural outline of the header, hero, and build-order steps (using `v-skeleton-loader` or equivalent Vuetify primitive). A full-page spinner MUST NOT be used. Content MUST swap in without cumulative layout shift once data is ready.

**Mobile placement of existing pieces**

- **FR-016**: The build **Description** MUST appear as its own card on the mobile view route, collapsible, with the header title remaining vertically centered when collapsed (equal top/bottom padding).
- **FR-017**: The **Video** MUST appear as its own card placed after the build order (a thumbnail/play affordance on view; the URL field on edit).
- **FR-018**: On the edit route, the mobile layout MUST provide a sticky bottom action bar with an unsaved-changes indicator plus Draft and Publish triggers. When the soft keyboard is open (a field is focused), the action bar MUST scroll off-screen rather than pinning above the keyboard; it MUST reappear as a sticky bar once the keyboard dismisses.
- **FR-019**: Management actions MUST be reachable from the hero overflow menu, **owner-gated** exactly as today: the view route shows Delete only to owners; the edit route's overflow MUST NOT contain Delete or a dedicated Preview.
- **FR-020**: Every mobile change MUST be implemented with the project's existing component library (Vuetify) and theme tokens — no new colors, no hardcoded hex, no new dependencies (Constitution I & III).

### Key Entities

- **Build**: existing Firestore `builds/{id}` document — unchanged. Mobile reads/writes the same fields (title, civ, season, map, strategy, video, description, build order).
- **Build-order section / step**: existing structure — a step has a timestamp (text), per-resource values (food/wood/gold/stone/builder), an implied villager total (sum), and a description containing icon shortcodes. Age-up markers separate age phases. **No schema change** — mobile only re-presents these.
- **Icon token**: existing `::id::` shortcode ↔ rendered icon tile (class-tinted). The serialization contract is unchanged; mobile must honor it on round-trip.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: On a 390 px-wide viewport, the entire view route (header → hero → description → all build-order steps → video) reads with **zero horizontal scrolling** and no pinch-zoom required.
- **SC-002**: No interactive control on mobile is smaller than the **44 px** minimum touch target.
- **SC-003**: No body/step text on mobile renders below the project's legibility floor (build-order step text ≥ 13 px; nothing relies on sub-12 px text).
- **SC-004**: A step note containing a mix of text and ≥ 3 icons **round-trips losslessly** through save → reload (0 duplicated/dropped/reordered icons; 0 raw shortcodes visible) in 100% of test cases.
- **SC-005**: In 20 consecutive icon insertions at varied caret positions (start, middle, end, between two icons), the caret lands immediately after the inserted icon **every time** and never jumps to field start/end.
- **SC-006**: The desktop (`md-and-up`) layout of all affected screens is **pixel-unchanged** versus before the feature (visual regression check).
- **SC-007**: Removing an age-up never leaves steps from a later age stranded — confirmed by the confirmation flow removing the age-up plus all subsequent steps in 100% of cases.

## Assumptions

- **`010` dependency (clarified):** `010-build-editor-unification` has **already merged** — `BuildEditor.vue` and `BuildHeader.vue` are the live integration points. This feature targets those directly: `BuildHeader.vue` for the slim shared mobile header, `BuildEditor.vue` for the edit route, `BuildDetails.vue` for the view route, and `BuildOrderSectionEditor.vue` for the step layout. No re-convergence step needed.
- The five resource slots (Builder · Food · Wood · Gold · Stone) and the villager-as-sum rule reflect the existing build-order data model; "Builder" is the existing builder/repair count column.
- The existing `IconAutoCompleteMenu` (inline `::`) and `IconSelector` (picker) are reused; on mobile the picker is presented as a bottom sheet but its icon catalog and selection result are the same.
- Icon-class → tint mapping reuses the existing icon-class system (`IconToolTip`/`IconSelector`); the prototype's category→class map is a faithful stand-in until wired to the real per-icon class data.
- "Owner-gated" reuses the existing ownership/verification guards; no new permission logic is introduced.
- Mobile breakpoint is Vuetify's `xs`/`sm` (`hidden-md-and-up`), consistent with the existing twin-block responsive pattern in the build views.

## Clarifications

### Session 2026-06-10

- Q: When `010-build-editor-unification` has not yet merged, should this feature wait for it or ship against current views? → A: Ship now. Confirmed: `010` has already merged — `BuildEditor.vue` and `BuildHeader.vue` are the live integration points; no re-convergence needed.
- Q: Should mobile build-order step resource slots be inline-editable or open a per-step editor sheet? → A: Inline tap-to-type — tap a slot to edit its value in place; villager total recomputes live.
- Q: What loading state should the mobile view route show while build data fetches? → A: Skeleton screens — placeholder rows matching the header/hero/step structure, then swap in real content.
- Q: Should the sticky bottom action bar (Draft/Publish) stay pinned above the soft keyboard when a field is focused in edit mode? → A: No — the bar scrolls off when the keyboard opens and reappears when the keyboard dismisses.

