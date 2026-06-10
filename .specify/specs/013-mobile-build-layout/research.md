# Research — Mobile Build View & Editor Layout (`013-mobile-build-layout`)

All unknowns from the Technical Context and spec clarifications resolved. No blockers remain.

---

## Decision 1 — `010-build-editor-unification` dependency

**Decision**: Target `BuildHeader.vue` and `BuildEditor.vue` directly — `010` has already merged.

**Rationale**: The unified editor and shared header already exist in the codebase (`src/components/builds/BuildHeader.vue`, `src/views/builds/BuildEditor.vue`). The slim mobile header goes into `BuildHeader.vue` as a mobile branch; the edit route's action bar and overflow into `BuildEditor.vue`. No separate re-convergence step.

**Alternatives considered**: Wait for `010` (unnecessary — it landed); apply mobile layout to the old `BuildEdit.vue`/`BuildNew.vue` then re-converge (those files are superseded).

---

## Decision 2 — Resource slot editing model

**Decision**: Inline tap-to-type — each resource slot is a `v-text-field` (`type="number"`, `density="compact"`, `hide-details`, `variant="plain"`) activated on tap, rendered in the fixed 5-slot grid.

**Rationale**: Matches the prototype UX and the spec's acceptance scenario ("the user changes a resource slot's number"). A bottom sheet would add a modal round-trip for a simple numeric edit and reduce usability.

**Alternatives considered**: Per-step editor bottom sheet (higher friction, not matching the prototype).

---

## Decision 3 — Loading state

**Decision**: Skeleton screens using `v-skeleton-loader` (or equivalent Vuetify primitive), shaped to match the header/hero/step structure. Swaps in real content without cumulative layout shift.

**Rationale**: Skeletons avoid CLS (which spinners cause), reinforce the mobile layout before data arrives, and are idiomatic in Vuetify 3. Error state shows an inline retry action.

**Alternatives considered**: Full-page spinner (causes CLS, hides structure); no loading state (blank flash on slow connections).

---

## Decision 4 — Sticky action bar vs. soft keyboard

**Decision**: The sticky Draft/Publish action bar scrolls off when the soft keyboard opens and reappears when the keyboard dismisses.

**Rationale**: Pinning the bar above the keyboard shrinks the edit viewport to ~30% of screen height, making the step list nearly unusable. The unsaved-changes indicator is most useful when the user finishes typing — not mid-keystroke. This is achievable by relying on the browser's default scroll behavior rather than fighting it with `position: fixed` adjustments.

**Alternatives considered**: Always-pinned bar (cripples edit viewport); collapsing indicator (higher implementation cost, minimal gain over scrolling off).

---

## Decision 5 — WYSIWYG contenteditable strategy

**Decision**: Uncontrolled-during-edit pattern (see `plan.md` "Critical: WYSIWYG sync & caret"). Vue sets `innerHTML` once on mount/step-load; thereafter the DOM is the source of truth while focused. Serialization uses a deterministic node-walker (`text → text`, `img[data-token] → ::token::`). Caret is preserved via `savedRange` + `@mousedown.prevent` on the picker trigger.

**Rationale**: This design-out of the two known failure modes (desync on re-render, caret jump on insert) is the primary risk mitigation for this feature. Blocking gates SC-004/SC-005 validate it.

**Alternatives considered**: Controlled two-way binding (`v-html` + `@input`) — known to cause both failure modes; ProseMirror/Tiptap — new dependency, Constitution I violation, overkill for icon-in-text.

---

## Open research items

None. All NEEDS CLARIFICATION resolved before planning. No external API integrations. No new dependencies.
