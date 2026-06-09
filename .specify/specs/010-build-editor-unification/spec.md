# Feature Specification: Build Editor Unification & Shared Build Header

**Feature Branch**: `010-build-editor-unification`

**Created**: 2026-06-08

**Status**: Draft

**Input**: Three views — `BuildNew.vue`, `BuildEdit.vue`, and the header of `BuildDetails.vue` — each hand-roll the **same hero card** (civ-flag background + title + chip row + action cluster), and each duplicates that markup **twice more** internally for `hidden-sm-and-down` / `hidden-md-and-up` breakpoints. `BuildNew` and `BuildEdit` are ~44 KB of near-identical create/edit logic with no shared code. The action affordances diverge: the editor exposes a bare save icon + a small overflow; the view route exposes Vote + Favorite + a standalone **Edit pencil** *outside* a larger overflow menu. This feature **extracts one shared `BuildHeader.vue`**, merges `BuildNew` + `BuildEdit` into a single `BuildEditor.vue`, refreshes the editor's metadata layout and adds a sticky save/publish footer with live YouTube validation, and **refactors the view route's header onto the shared component with a single overflow menu** so all three routes are visually and behaviourally consistent.

> **Design reference**: interactive mock at `BuildEdit Design.html` (project root). Shows the hero card (rounded, flag-image left, reactive chips), the two-card metadata layout (Build details + 4-col Classification), the sticky footer (Discard / Save as draft / Publish build + unsaved indicator), the edit-mode overflow menu, and the live YouTube preview/error. Tweaks panel toggles dirty state, hero badge, and the video field state.

## The ask (verbatim intent)

- Apply this design to the **`new`** and **`edit`** routes (one shared look + behaviour).
- Update the **`view`** route header to be **consistent** — **use only an overflow menu** in the header (fold the standalone Edit pencil into it), and **re-use the component** rather than duplicating the hero a third time.

## How the reuse is done (the important part)

Rather than restyle three headers independently, the plan **extracts** the hero into one component and points all consumers at it — mirroring how `009` extracted `PickerDialog`/`FileDropZone`:

```
BuildHeader.vue  (flag bg + title + reactive chips + #actions slot)   ← shared hero
        ▲                       ▲                        ▲
BuildEditor.vue (new)   BuildEditor.vue (edit)   BuildDetails.vue (view)
  #actions = overflow      #actions = overflow      #actions = Vote + Favorite
  (hidden in new)          (Duplicate/Copy/         + ONE overflow (Edit now
                            Download/Delete)          inside it)
```

Refactoring `BuildDetails` onto the shared header is **in scope** and is its own atomic commit — it proves the component against a second real consumer with a different action set (Constitution Principle III: *any UI pattern that appears more than once MUST be extracted*). Net result: **one** hero pattern (instead of three views × two breakpoint copies = six hand-rolled hero blocks), and the change **deletes** a route view (`BuildNew`/`BuildEdit` collapse to one).

## User Scenarios & Testing *(mandatory)*

### User Story 1 — One editor view for create and edit (Priority: P1) 🎯 MVP

A user creating a new build and a user editing an existing build both land in the same `BuildEditor.vue`. The route sets the mode: `BuildNew` route → create mode (empty form, or pre-filled from a duplicate template); `BuildEdit` route → edit mode (loaded build). All behaviour — fields, validation, save, the hero, the footer — is identical except the overflow action set (US3).

**Why this priority**: This is the core value. Halving the surface area means every later fix or field lands once instead of twice.

**Independent Test**: Open the create route → empty form, "New build" hero badge. Open the edit route for an existing build → fields pre-filled. Saving in create calls `addBuild`; saving in edit calls `updateBuild`. Both navigate to the build detail page on success.

**Acceptance Scenarios**:

1. **Given** a logged-in user on the create route, **When** the page renders, **Then** `BuildEditor` is in create mode with empty fields (unless a duplicate template is staged in Vuex) and the hero badge reads "New".
2. **Given** a logged-in user on the edit route, **When** the page renders, **Then** `BuildEditor` is in edit mode, all fields pre-fill from the loaded build, and the hero badge reflects `isDraft`.
3. **Given** create mode, **When** the user publishes, **Then** `addBuild` runs (incl. the existing contributor add/increment), the success snackbar shows, and the router navigates to `/builds/:newId`.
4. **Given** edit mode, **When** the user publishes, **Then** `updateBuild` runs, the snackbar shows, and the router navigates to `/builds/:id`.
5. **Given** an unauthenticated visitor, **When** they hit either route, **Then** the existing `requiresAuth` guard redirects them.

---

### User Story 2 — Sticky footer with draft / publish actions (Priority: P1)

Save and draft move from the hero corner to a **sticky footer** that is always visible while editing: an "Unsaved changes" indicator (only when dirty), a "Discard" text button, a "Save as draft" outlined button, and a "Publish build" primary button. The footer's inner content is constrained to the same width as the page cards so the buttons sit flush with the content on wide screens.

**Why this priority**: The current save icon in the hero corner is easy to miss on a long build. A persistent footer keeps save reachable without scrolling and matches the redesign direction.

**Independent Test**: Scroll a long build → footer stays visible. Edit a field → "Unsaved changes" appears. Discard → form reverts, indicator hides. "Save as draft" → `isDraft = true` + save. "Publish build" → `isDraft = false` + save.

**Acceptance Scenarios**:

1. **Given** an unedited form, **When** it renders, **Then** the "Unsaved changes" indicator is hidden.
2. **Given** any field changes, **When** the user edits, **Then** "Unsaved changes" appears in the footer.
3. **Given** a dirty form, **When** the user clicks "Discard", **Then** the form reverts to its last-loaded/saved state and the indicator hides.
4. **Given** "Save as draft" in create mode, **When** clicked, **Then** `isDraft = true` and the existing **max-10-drafts** guard (`getUserDraftsCount`) applies.
5. **Given** "Publish build", **When** clicked, **Then** `isDraft = false` and the build saves.
6. **Given** any viewport width, **When** the footer renders, **Then** its buttons align with the content cards (shared max-width).

---

### User Story 3 — Hero overflow menu with contextual actions (Priority: P2)

`BuildHeader.vue` exposes a trailing **`#actions` slot**. Each consumer fills it, but all management actions live behind a **single `mdi-dots-vertical` overflow menu** — never a mix of loose icon buttons + a menu.

- **Create mode**: no overflow (nothing to act on before the build exists).
- **Edit mode**: overflow = Duplicate build · Copy to overlay tool (clipboard-gated) · Download as file.
- **View route**: Vote + Favorite stay as their dedicated engagement controls; **all management actions collapse into one overflow** = Edit *(moved in from the standalone pencil)* · Publish (drafts only) · Duplicate · Copy to overlay tool · Download · Open in RTS Overlay · ─ · Delete (owner only).

**Why this priority**: Removes the redundant save icon from the editor and the loose Edit pencil from the view route, giving every route a single, predictable action affordance.

**Independent Test**: Create mode → no overflow. Edit mode → overflow with three actions (Duplicate, Copy, Download) — no Delete. View route → Vote + Favorite + one overflow containing Edit and the rest; no standalone pencil button.

**Acceptance Scenarios**:

1. **Given** create mode, **When** the hero renders, **Then** no overflow button shows.
2. **Given** edit mode, **When** the user opens the overflow, **Then** Duplicate, Copy to overlay tool, and Download appear; "Copy" is hidden when the clipboard API is unsupported. No Delete action is present in the edit-mode overflow.
3. **Given** the view route as the build's owner, **When** the user opens the overflow, **Then** Edit, Publish (if draft), Duplicate, Copy, Download, Open in RTS Overlay, and Delete appear — and **no standalone Edit pencil** exists outside the menu.
4. **Given** the view route as a non-owner, **When** the overflow opens, **Then** owner-only items (Edit, Publish, Delete) are hidden but Duplicate/Copy/Download/Open-in-Overlay remain.
5. **Given** any overflow action, **When** clicked, **Then** it invokes the exact existing handler (`handleDuplicate`, `handleCopyOverlayFormat`, `handleDownloadOverlayFormat`, `handlePublish`, `handleOpenInOverlayTool`, `deleteDialog = true`).

---

### User Story 4 — Refreshed metadata layout (Priority: P2)

The editor's metadata becomes **two stacked cards**:
- **Build details**: Title, Description, Video (full width; live YouTube preview — US5).
- **Classification**: Civilization, Season, Map, Strategy in a **4-column responsive grid** (`cols=12 sm=6 md=3`).

The shared hero's title and chips update **live** as Title, Civilization, Season, and Strategy change, and the flag swaps with Civilization.

**Why this priority**: The current 2-column left/right split is imbalanced (narrative gets 2/3, selects get 1/3). The two-card stack gives every field room and groups them logically.

**Independent Test**: Editor shows two cards below the hero. Type in Title → hero title updates. Change Civilization → hero chip + flag update. Resize below `sm` → the 4-col grid collapses to 2-col.

**Acceptance Scenarios**:

1. **Given** the editor, **When** it renders, **Then** "Build details" and "Classification" cards are visible.
2. **Given** the Title field, **When** the user types, **Then** the hero title updates in real time.
3. **Given** the Civilization select, **When** it changes, **Then** the hero flag and civ chip update.
4. **Given** a viewport below `sm`, **When** Classification renders, **Then** the 4-col grid collapses to 2-col.

---

### User Story 5 — Live YouTube URL validation and thumbnail preview (Priority: P2)

The Video field validates 400 ms after typing stops. A valid YouTube URL (patterns `?v=`, `youtu.be/`, `embed/`, `shorts/`) shows a thumbnail preview card (`img.youtube.com/vi/{id}/mqdefault.jpg`) + a "Valid YouTube link" badge; an unrecognised URL shows an error card + "Invalid URL" badge; empty shows neither. On valid input the existing `handleVideoInput` logic (embed rewrite + `creatorId`/`creatorName` lookup) runs unchanged.

**Why this priority**: Today errors only surface via a snackbar after blur/submit — late and easy to miss. Inline feedback is a clear quality win.

**Independent Test**: Paste a valid URL → thumbnail within 400 ms. Type a Twitch URL → error card. Clear → both hide. The embed rewrite still happens on valid input.

**Acceptance Scenarios**:

1. **Given** an empty Video field, **When** it renders, **Then** no preview or error shows.
2. **Given** a valid YouTube URL, **When** 400 ms elapses, **Then** a thumbnail card + "Valid YouTube link" badge appear.
3. **Given** an unrecognised URL, **When** 400 ms elapses, **Then** an error card + "Invalid URL" badge appear.
4. **Given** the field is cleared, **When** empty, **Then** both cards hide.
5. **Given** a valid URL, **When** the preview appears, **Then** the existing embed rewrite + creator lookup still run.

---

### Edge Cases

- **Delete (view only)**: Delete is not available in the editor overflow; it exists exclusively on the view route via the existing `deleteDialog` + `handleDelete` flow — only its trigger moves into the shared overflow.
- **Draft limit (create)**: the max-10-drafts guard (`getUserDraftsCount`) is preserved for "Save as draft" in create mode.
- **Template carry-over**: `store.state.template` (duplicate → create) still pre-fills create mode on mount.
- **Dirty tracking**: clean on load; any field change sets dirty; successful save resets dirty **and** refreshes the deep-clone snapshot used by Discard.
- **YouTube thumbnail CORS**: `img.youtube.com` can fail in sandboxed dev; the `onerror` handler hides the `<img>` and keeps the valid badge.
- **Edit mode loading/error**: while the build is fetching, `BuildEditor` renders a skeleton/spinner in place of the form. If the build is not found or the user is forbidden, the router redirects to `/404`.
- **Dirty navigation guard**: navigating away (back button, nav link, router push) while `isDirty` triggers a confirmation prompt; confirming leaves without saving, cancelling keeps the user on the editor.
- **Reactive chips with no value**: chips for civ/season/strategy render only when the field is set (`v-if`), matching today.
- **Mobile**: footer buttons ≥ 44 px; chip row wraps; overflow menu must not clip off-screen; the per-breakpoint hero duplication is **removed** (one responsive `BuildHeader` replaces the `hidden-*` pairs).
- **Vote/Favorite (view)**: remain stateful engagement controls outside the overflow — they are not management actions and are not folded into the menu.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A new `BuildHeader.vue` MUST render the hero (civ-flag background via existing `flagLarge`/`flagSmall` + gradient fade, title, reactive chip row) responsively in **one** markup block (no `hidden-sm-and-down` / `hidden-md-and-up` duplication) and expose a trailing **`#actions` slot**.
- **FR-002**: `BuildHeader.vue` MUST be consumed by `BuildEditor.vue` (create + edit) **and** `BuildDetails.vue` (view). It MUST NOT be duplicated per consumer or per breakpoint.
- **FR-003**: `BuildEditor.vue` MUST replace `BuildNew.vue` + `BuildEdit.vue`, accept a `mode` prop (`'new'` | `'edit'`) and optional `id`, and MUST NOT duplicate the form template or save logic per mode.
- **FR-004**: The editor MUST present a sticky footer (Discard / Save as draft / Publish build) whose inner content is constrained to the page card width, with an "Unsaved changes" indicator shown only when dirty.
- **FR-005**: "Discard" MUST revert all fields to the state at last load/save. The snapshot MUST be a deep clone (`JSON.parse(JSON.stringify(build))`) taken in component state on mount and refreshed after each successful save; no extra Vuex mutations or re-fetch are required.
- **FR-006**: Management actions in every consumer MUST live behind a **single overflow menu**; no consumer may present a loose action icon (e.g. the view route's standalone Edit pencil) alongside the overflow. Vote and Favorite on the view route are exempt (engagement controls, not management actions).
- **FR-007**: In create mode the overflow MUST NOT render. In edit mode it MUST contain Duplicate, Copy to overlay tool (clipboard-gated), and Download only — no Delete. On the view route it MUST contain Edit, Publish (drafts only), Duplicate, Copy, Download, Open in RTS Overlay, and Delete — owner-gated where applicable, matching today's `v-show` conditions.
- **FR-008**: The editor metadata MUST be two `v-card`s: Build details (title, description, video) and Classification (civ, season, map, strategy in a 4-col responsive grid).
- **FR-009**: The hero title, chips, and flag MUST update reactively from `build` state as the corresponding fields change (editor); on the view route they reflect the loaded build (read-only).
- **FR-010**: The Video field MUST validate after a 400 ms debounce — valid YouTube URL → thumbnail preview card; unrecognised → error card; empty → neither — and MUST run the existing `handleVideoInput` embed/creator logic on valid input.
- **FR-011**: All existing composable wiring MUST be preserved: `buildService`, `creatorService`, `contributorService`, `youtubeService`, `buildOrderValidator`, `useExportOverlayFormat`, `useCopyToClipboard`, `useDownload`, `useTimeSince`, the four `*DefaultProvider`s, `useVerificationGuard` (view route), and `sanitize-html`.
- **FR-012**: The existing route guards (`requiresAuth`, ownership checks) MUST be preserved; the `BuildOrderEditor` child MUST be reused unchanged in both editor and view.
- **FR-013**: `BuildNew.vue` and `BuildEdit.vue` MUST be deleted once `BuildEditor.vue` is complete. The router entries for `/builds/new` and `/builds/:id/edit` MUST remain at their existing paths — only their `component:` binding changes to `BuildEditor`. No redirects or shim files. `BuildDetails.vue` MUST keep all its non-header behaviour (Vote, Favorite, Description, video iframe, Discussion, FocusMode, swipe) unchanged.
- **FR-014**: All styling MUST use existing Vuetify theme tokens (`rgb(var(--v-theme-*))`) in both light and dark themes — no hard-coded hex.
- **FR-015**: `BuildEditor` MUST implement an `onBeforeRouteLeave` guard that, when `isDirty`, prompts "You have unsaved changes — leave anyway?" and cancels navigation if the user declines.

### Key Entities

- *No new data entities.* The build document schema is unchanged. No Firestore schema or security-rule changes.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The hero card exists in exactly **one** component (`BuildHeader.vue`); the six hand-rolled hero blocks (3 views × 2 breakpoints) are eliminated.
- **SC-002**: `BuildNew.vue` + `BuildEdit.vue` duplication (~44 KB) collapses to one `BuildEditor.vue`.
- **SC-003**: The view route presents a **single** management affordance (one overflow menu); the standalone Edit pencil is gone, with zero loss of the existing actions.
- **SC-004**: Create, edit, and view golden paths all pass with no regression in save, draft, publish, duplicate, copy, download, open-in-overlay, delete, vote, or favorite.
- **SC-005**: The Video field gives inline feedback within 400 ms (no snackbar-only URL validation).

## Assumptions

- Routes stay full-page (not dialogs); the editor form is complex enough to warrant its own page.
- `BuildHeader.vue` takes a `build` object + a `mode`/`readonly` hint and renders chips/flag from it; consumers supply actions via the `#actions` slot (keeps the component free of consumer-specific handlers — Constitution I).
- Vote + Favorite stay as the view route's dedicated engagement controls beside (not inside) the overflow.
- `store.state.template` (duplicate → create) is preserved as-is; no Vuex changes are required.
- YouTube thumbnail fetch works for public videos; the `onerror` fallback covers private/unlisted.
- No new npm dependencies.

## Clarifications

### Session 2026-06-08

- Q: Should the view route's Vote and Favorite also move into the overflow menu? → A: **No.** Only **management** actions consolidate into the single overflow (the consistency target is removing the loose Edit pencil). Vote and Favorite are stateful engagement controls and remain beside the menu.
- Q: Should "Delete build" appear in the edit-mode overflow at all? → A: **No** — Delete is available only from the view route overflow. The editor overflow contains only Duplicate, Copy to overlay tool, and Download.
- Q: How should Discard restore form state — deep clone, re-fetch, or Vuex snapshot? → A: **Deep clone** — `JSON.parse(JSON.stringify(build))` captured on mount and refreshed after each successful save; no re-fetch or Vuex mutation needed.
- Q: Should `/builds/new` and `/builds/:id/edit` route paths change as part of this feature? → A: **No** — paths stay unchanged; only the router `component:` binding switches from `BuildNew`/`BuildEdit` to `BuildEditor`. The old `.vue` files are deleted, no shims.
- Q: What should `BuildEditor` show while the build is loading or if it fails to load in edit mode? → A: **Skeleton + redirect** — show a skeleton/spinner during fetch; redirect to `/404` on not-found or forbidden.
- Q: Should `BuildEditor` guard against accidental navigation away with unsaved changes? → A: **Yes** — `onBeforeRouteLeave` prompts "Unsaved changes — leave anyway?" when `isDirty`; cancelling blocks navigation.
