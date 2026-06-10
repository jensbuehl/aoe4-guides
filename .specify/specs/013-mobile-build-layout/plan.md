# Implementation Plan: Mobile Build View & Editor Layout

**Branch**: `013-mobile-build-layout` | **Date**: 2026-06-10 | **Spec**: `specs/013-mobile-build-layout/spec.md`

## Summary

Refactor the **mobile (`xs`/`sm`) presentation only** of the build **view** and **edit/create** routes so they are usable on a phone while keeping desktop and all business logic untouched. Three things change at the mobile breakpoint: (1) a **slim shared header** used by both routes; (2) a **lean hero** (title + status/civ/season chips, no flag block, no map/strategy line); (3) a **phone-friendly build-order step** — five fixed resource positions, a calculated villager total, an editable timestamp, a single "✕" remove affordance, an "age-down" confirmation, and a **WYSIWYG description editor** that renders icons inline. The Description and Video become their own mobile cards; management actions route through the existing owner-gated overflow; edit gets a sticky Draft/Publish action bar. Everything is built from Vuetify + theme tokens; no schema, store, routing, or rules change.

**The hard part is not layout — it is the WYSIWYG description editor's data sync and caret behaviour.** The user has hit this before: icons getting out of sync with the stored value, and the caret jumping when an icon is inserted. The bulk of this plan's risk budget is spent there (see "Critical: WYSIWYG sync & caret").

## Technical Context

**Language/Version**: JavaScript (ES2022), Vue 3.2 SFCs (Options API as in repo)

**Primary Dependencies**: Vue 3, Vuetify 3 (`v-app-bar`, `v-card`, `v-chip`, `v-text-field`, `v-textarea`/contenteditable host, `v-menu`, `v-list`, `v-bottom-sheet`, `v-dialog`, `v-btn`, `v-img`, display utilities `hidden-md-and-up` / `d-md-none`), Vuex 4, Vue Router 4, `@mdi/font`, `sanitize-html` (all already in project). **No new dependencies.**

**Components reused (unchanged behaviour)**: `BuildOrderEditor.vue` / `BuildOrderSectionEditor.vue` (build-order steps), `IconSelector.vue` (icon picker), `IconAutoCompleteMenu.vue` (inline `::` autocomplete), `IconToolTip.vue` (icon tile + class tint), `BuildHeader.vue` (shared header — `010` has already merged), `BuildEditor.vue` (unified editor — `010` has already merged).

**Composables reused (unchanged)**: `buildService`, `creatorService`, `contributorService`, `youtubeService`, `buildOrderValidator`, `useExportOverlayFormat`, `useCopyToClipboard`, `useDownload`, `useTimeSince`, the `*DefaultProvider`s, `useVerificationGuard`. None are touched.

**Storage**: Firestore `builds/{id}` — existing schema, **no changes**. The icon-shortcode serialization for descriptions is unchanged.

**Testing**: Manual golden-path per Constitution (no automated suite), plus the explicit round-trip / caret matrices in `spec.md` SC-004/SC-005.

**Target Platform**: Web SPA, mobile breakpoint (`xs`/`sm`); desktop untouched.

**Performance Goals**: No new network calls on mount. No new bundle weight beyond a few CSS rules and a small editor composable.

**Constraints**: Vuetify components only (Constitution III); theme tokens only — no hardcoded hex; `md-and-up` layout must be byte-for-byte unchanged; build-order **data model** untouched; reuse `IconSelector` / `IconAutoCompleteMenu` rather than reimplement.

**Scale/Scope**: Mobile-only template branches + scoped styles on the build view/edit components, one small WYSIWYG editor composable/wrapper, the icon picker presented as a bottom sheet on mobile. ~4–6 files touched, mostly additive template branches behind `hidden-md-and-up`.

## Constitution Check

| Principle | Assessment |
|---|---|
| **I. Simplicity First** | ✅ Zero new dependencies. Reuses every existing composable and the icon components verbatim. The one genuinely new logic unit — the WYSIWYG sync/caret composable — is justified because it fixes a known defect class; YAGNI is respected elsewhere (no new abstractions for layout that appears once). |
| **II. Incremental Quality** | ✅ Leaves desktop untouched and isolates mobile in `hidden-md-and-up` branches + scoped CSS, so the change is reversible and low-blast-radius. The age-down confirmation and the WYSIWYG round-trip guarantee make the editor *more* correct than before. Atomic Conventional Commits (`feat:`, `fix:`, `refactor:`, `style:`). |
| **III. Consistent UX & Component Reuse** | ✅ Vuetify-only; theme tokens only; the icon picker reuses `IconSelector` (presented via `v-bottom-sheet` on mobile), the inline autocomplete reuses `IconAutoCompleteMenu`, icon tiles reuse the `IconToolTip` class tints. Matches existing spacing/type/color. |
| **IV. Cost-Conscious Infrastructure** | ✅ Frontend-only. No new Firestore reads/writes, Functions, or Storage. |
| **V. Secure Defaults** | ✅ Owner-gating reuses existing guards (`useVerificationGuard`, ownership `v-show`/`v-if`). No schema or `firestore.rules` changes. |

**Result**: PASS — no violations; Complexity Tracking not required.

## Critical: WYSIWYG sync & caret *(the user's known pain point — read before coding)*

> *"In the past I had issues with the WYSIWYG data to keep it in sync properly and also to make sure the cursor position is not jumping when adding elements."*

This is the feature's primary technical risk. The description field renders AOE4 icons inline (a `contenteditable` host), but the **source of truth** is the shortcode string (`::id::`) stored on the step. Two failure modes must be designed out, not patched later:

### Failure mode A — value desync (icons drift from the stored string)

**Root cause**: binding a `contenteditable` element with `v-html`/`innerHTML` to a reactive value re-writes the DOM on every keystroke, which (a) fights the browser's own editing and (b) resets the caret. The classic anti-pattern is `:innerHTML="value"` + `@input="value = $event.target.innerHTML"` — a two-way loop that re-renders mid-edit.

**Decision**:
- The `contenteditable` host is **uncontrolled during editing**. Vue sets its initial HTML **once** on mount/step-load (shortcodes → icon `<img>` nodes), and thereafter **does not** re-write `innerHTML` from the reactive value while the field has focus.
- The reactive/persisted value is updated **from** the DOM (serialize on `input`, debounced), never the reverse, while focused. Vue → DOM writes happen only when the field is **not** focused (e.g. external reset, discard, age-down re-render).
- **Serialization is deterministic and total**: `serialize(node)` walks child nodes — text nodes → their text, `img.ic[data-token]` → `::token::` — producing the canonical shortcode string. `deserialize(string)` is its exact inverse. Round-trip identity (`deserialize(serialize(x)) ≡ x` as DOM, `serialize(deserialize(s)) ≡ s` as string) is the contract behind SC-004 and is unit-checkable even without a test runner (a dev-time assertion).
- Each icon `<img>` carries `data-token` (the shortcode id) and `contenteditable="false"` so it is **atomic** (FR-014) and serialization never has to reverse-map a `src` URL back to an id.

### Failure mode B — caret jumps on insert

**Root cause**: inserting a node by string-concatenating `innerHTML`, or by appending to the end, throws away the user's selection; and opening the picker moves focus off the field, collapsing the selection.

**Decision**:
- **Persist the caret across focus loss.** On `selectionchange`/`blur` within the field, store a cloned `Range` (`savedRange`). Tapping the picker button uses `@mousedown.prevent` (or `pointerdown.prevent`) so the field **never loses focus/selection** in the first place; `savedRange` is the belt-and-braces fallback when focus was genuinely lost.
- **Insert at the range, not the end.** `insertIcon(token)` restores `savedRange` (validated to still be inside this field), `range.deleteContents()`, inserts the icon node (+ a trailing `\u00A0` so the caret has a text position to land on), then **moves the caret to immediately after** the inserted node via `range.setStartAfter(node); range.collapse(true)` and re-applies the selection. Never `focus()`-then-append.
- The same `insertIcon` path serves **both** the bottom-sheet picker (`IconSelector`) and the inline `::` autocomplete (`IconAutoCompleteMenu`); the autocomplete additionally deletes the typed `::query` range before inserting. One insertion primitive = one place for caret correctness.
- After insert, **re-save** `savedRange` to the post-insert collapsed range so consecutive inserts chain correctly.

### Why a small composable, not inline handlers

Extract `useIconRichText()` (or a thin `<IconRichText>` wrapper around the existing field) owning: `mount(initialString)`, `serialize()`, `insertIcon(token)`, `savedRange` tracking, and the focused/blurred write-gating. This keeps the rules in one audited place and lets both the picker and the autocomplete reuse the exact same caret-safe insert (Constitution III). It is the only net-new logic; everything else is layout. If the repo already has a richer description editor inside `BuildOrderSectionEditor.vue`, this composable formalizes its insert/serialize contract rather than replacing the component.

> **Acceptance gates** for this section are spec SC-004 (lossless round-trip) and SC-005 (20/20 caret-correct inserts) plus FR-012–FR-015. Treat them as blocking.

## Project Structure

### Documentation (this feature)

```text
specs/013-mobile-build-layout/
├── README.md            # Handoff entry / design input (this package's front door)
├── spec.md              # Scope (mobile-only) + 3 user stories + FR-001..021 + success criteria
├── plan.md              # This file — constitution check, mobile arch, WYSIWYG sync/caret strategy
├── design-input.md      # ⭐ Resolved theme tokens (both themes) + mock→Vuetify mapping + the
│                        #    mobile layout decisions + icon-class tints + the only custom CSS
└── assets/
    ├── Mobile Build Redesign.html   # ⭐ Interactive reference (Tweaks → View/Edit)
    └── 01-view-overview.png         # Still (MDI glyphs don't always rasterize — see note)
```

*(No `tasks.md` yet — task breakdown deferred to `/speckit-tasks`.)*

### Design Reference

```text
Mobile Build Redesign.html   # Interactive mock (project root + assets/). Tweaks panel toggles
                             # View / Edit. Shows: slim header, lean hero, fixed 5-slot steps,
                             # calculated villager total, editable time, WYSIWYG note + icon
                             # bottom-sheet picker, age-down confirm, sticky edit action bar.
```

### Source Code Changes (mobile branches only)

```text
src/
├── components/builds/
│   ├── BuildOrderSectionEditor.vue   # EDIT — add mobile (hidden-md-and-up) step layout:
│   │                                 #   fixed 5-slot grid, calc villager total, editable time,
│   │                                 #   ✕ remove, age-down confirm. Desktop branch untouched.
│   ├── BuildOrderEditor.vue          # EDIT (if needed) — mobile wrappers / card placement only.
│   ├── IconSelector.vue              # REUSE — presented via v-bottom-sheet on mobile (no behaviour change).
│   ├── IconAutoCompleteMenu.vue      # REUSE — unchanged.
│   ├── IconToolTip.vue               # REUSE — icon tile class tints reused by the WYSIWYG editor.
│   └── BuildHeader.vue               # EDIT — slim mobile header branch. `010` has merged; this is
│                                     #   the shared integration point used by both routes.
├── composables/
│   └── useIconRichText.js            # NEW — caret-safe insert + deterministic serialize/deserialize
│                                     #   + focused/blurred write-gating (the WYSIWYG contract).
└── views/builds/
    ├── BuildDetails.vue              # EDIT — mobile: slim header, lean hero, Description card,
    │                                 #   Video card after build order, owner-gated overflow. Desktop untouched.
    └── BuildEditor.vue               # EDIT — mobile: shared slim header (via BuildHeader.vue),
                                      #   sticky Draft/Publish action bar, overflow w/o Delete/Preview.
```

**Structure Decision**: All changes are **additive mobile branches** gated by Vuetify display utilities (`hidden-md-and-up` / `d-md-none`) plus scoped CSS, so the `md-and-up` markup is literally the same nodes as today (SC-006). The only extracted unit is `useIconRichText` because the caret/serialize rules are genuinely repeated (picker **and** autocomplete) and are the known defect surface — extraction here is Constitution III, not speculative abstraction. The icon picker is **not** reimplemented; `IconSelector` is reused inside a `v-bottom-sheet` on mobile.

## Key Design Decisions (from the approved mock)

- **Slim shared header**: a single `v-app-bar`-height row — menu/logo wordmark · profile/overflow — with a gold hairline bottom border (dark mode) / navy in light. **No search control** (FR-002). Used by view + edit so the two routes feel like one app. Reuses the brand wordmark; the civ flag does **not** appear here.
- **Lean hero**: title (`v-card-title`) + a 3-chip group (status / civilization-as-text / season). **No flag column** and **no map/strategy line** on mobile (FR-003/FR-004); civ reads as a text chip. Overflow (⋮) pinned top-right.
- **Fixed 5-slot resource grid**: a `repeat(5, 1fr)` row in a stable order **Builder · Food · Wood · Gold · Stone**; an unset slot renders as a dim placeholder so "this number is always in this place" holds (FR-005). Each slot = icon tile + value; in edit the value is a tap-to-type numeric input.
- **Villager total = calculated**: shown as a read-only badge (icon + number, no "vil" label — the icon carries the meaning), always the **sum** of the five slots; live-recomputed on input (FR-006). Never directly editable.
- **Editable timestamp**: free-text input in edit mode (`m:ss`), stored verbatim (FR-007). Not derived.
- **WYSIWYG step note**: a `contenteditable` host rendering inline icon tiles (class-tinted via `IconToolTip`'s system), ~26 px tall, 4 px radius. Empty notes show a placeholder hint; the **Insert-icon** trigger is revealed only on focus (`@mousedown.prevent` to preserve the caret). Inline `::` autocomplete reuses `IconAutoCompleteMenu`. See "Critical: WYSIWYG sync & caret."
- **Icon picker as bottom sheet**: `IconSelector` inside a `v-bottom-sheet` on mobile — tabbed categories + search; tapping inserts at the caret. Same catalog/result as desktop.
- **Unified ✕ removal**: steps and age-ups share one "✕" affordance (FR-010).
- **Age-down confirmation**: removing an age-up opens a `v-dialog` explaining it removes the age-up **and every step after it** ("age down"), destructive-styled, applied only on confirm (FR-011/SC-007).
- **No reordering**: no drag handles this iteration (FR-009).
- **Description card** (view): own card, collapsible, header title vertically centered when collapsed (equal top/bottom padding) (FR-016).
- **Video card**: own card after the build order — thumbnail/play on view, URL field on edit (FR-017).
- **Sticky edit action bar**: bottom bar with "Unsaved changes" + Draft + Publish (FR-018); page content padded so it clears the bar.
- **Owner-gated overflow**: view route shows Delete to owners only; edit overflow = Duplicate / Copy to overlay / Download / Discard changes, **no Delete, no Preview** (FR-019). Reuses existing guards.

## Complexity Tracking

> No Constitution violations — section intentionally empty.
