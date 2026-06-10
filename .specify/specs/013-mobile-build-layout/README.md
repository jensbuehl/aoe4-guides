# Handoff: Mobile Build View & Editor Layout (`013-mobile-build-layout`)

Spec-Kit handoff to make the build **view** and **edit/create** screens usable on a phone — **mobile (`xs`/`sm`) layout only**, desktop and all logic untouched. A slimmer **shared header**, a leaner **hero**, and a phone-friendly **build-order step** (fixed 5 resource positions, calculated villager total, editable timestamp, WYSIWYG icon notes, unified ✕ remove, age-down confirmation). Description and Video become their own mobile cards; management actions stay in the owner-gated overflow; edit gets a sticky Draft/Publish bar.

## The ask (verbatim intent)
- On mobile the build screens are *"barely usable"* — fix the **mobile representation only**, keep the AOE4 identity.
- **Header:** slimmer/lighter, **fewer chips**, all actions in the **overflow**, **civ as text** (no flag). The header is **shared** between the edit and view pages on mobile.
- **Build area:** must work at phone width **and stay editable**. Resources sit in **fixed positions** ("this number is always at this place"), **villager count is calculated**, **timestamp is editable**, use the **icon picker**, **no reordering**.
- **Leave the rest as is** — only update the mobile representation.

## Scope (read before implementing)
**In:** the mobile-breakpoint layout of the build view + edit/create routes — header, hero, build-order step presentation & inline editing, Description/Video card placement, overflow, edit action bar.
**Out (unchanged):** the entire **desktop/tablet (`md-and-up`)** layout, the **data model / store / routing / Firestore rules**, the **save/draft/publish/delete/export logic**, the **`::id::` shortcode format**, and the **behaviour** of `IconSelector` / `IconAutoCompleteMenu` (mobile **reuses** them). This is a responsive **layout refactor**, not a rewrite.

## ⚠️ The one hard part: WYSIWYG sync & caret
The user has hit this before — *icons drifting out of sync with the stored value, and the cursor jumping when inserting an icon.* This is the feature's primary risk and is designed out explicitly in `plan.md` → **"Critical: WYSIWYG sync & caret."** In short:
- The `contenteditable` note is **uncontrolled while focused** — Vue sets its HTML once, then only reads **from** the DOM (no `innerHTML` re-writes mid-edit that reset the caret).
- **Deterministic serialize/deserialize** between icon nodes (`data-token`, `contenteditable="false"`, atomic) and `::token::` strings — round-trip identity is the contract.
- **One caret-safe insert primitive** (shared by the picker and the inline `::` autocomplete): persist the selection across focus loss (`@mousedown.prevent` + a saved `Range`), insert **at** the range, then place the caret **immediately after** the inserted icon — never append-to-end, never `focus()`-then-insert.
- Encapsulated in a small **`useIconRichText`** composable so the rules live in one audited place.
- **Blocking acceptance gates:** SC-004 (lossless round-trip) and SC-005 (20/20 caret-correct inserts), plus FR-012–FR-015.

## What changes (mobile only)
- **Shared slim header** — one compact row (logo/wordmark + profile + overflow), gold/navy hairline, **no search control**. Used by both view and edit so they feel like one app.
- **Lean hero** — title + **3 chips** (status / **civ-as-text** / season); **no flag block**, **no map/strategy line** (that info stays in the editor's Classification + on desktop). Overflow ⋮ top-right.
- **Build-order step** — **five fixed resource positions** (Builder · Food · Wood · Gold · Stone; empty = placeholder so the column meaning is stable), **calculated** villager total (read-only, icon-only badge), **editable** free-text timestamp, **WYSIWYG** note with inline class-tinted icons, **focus-revealed** Insert-icon, **`v-bottom-sheet` icon picker** (reusing `IconSelector`), **unified ✕** remove, **age-down confirmation** when removing an age-up, and **no drag/reorder**.
- **Description card** (view, collapsible, centered title when collapsed) and **Video card** (after the build order).
- **Edit** gets a **sticky action bar** (Unsaved changes · Draft · Publish); the edit overflow has **no Delete and no Preview** (Delete lives only on the owner's view route).

## Fidelity
**High-fidelity**, grounded in the real Vuetify theme tokens. Recreate with **Vuetify components** — the mock is **not** code to paste. `design-input.md` §2 maps every mock element to its Vuetify component (e.g. icon picker → `v-bottom-sheet` + the existing `IconSelector`; age-down → `v-dialog`), and §1/§3 give the resolved tokens, icon-class tints, and the only custom CSS allowed.

## Files in this package
| File | What |
|---|---|
| `spec.md` | Mobile-only scope + non-goals + 3 prioritized user stories + FR-001..020 + success criteria (incl. the WYSIWYG round-trip/caret gates) + 2 `[NEEDS CLARIFICATION]` |
| `plan.md` | Constitution check (PASS) + mobile architecture + ⭐ **"Critical: WYSIWYG sync & caret"** strategy + file map + design decisions |
| `design-input.md` | ⭐ Resolved tokens (both themes) + **mock→Vuetify mapping** + icon-class tints + the only custom CSS + verbatim copy/action sets + mobile structure |
| `assets/Mobile Build Redesign.html` | ⭐ **Interactive reference** — Tweaks panel toggles View / Edit |
| `assets/01-view-overview.png` | Still of the mobile view route (overview) |

> **No `tasks.md`** — task breakdown is intentionally omitted per the request (`/speckit-tasks` later).
> MDI (`mdi-*`) icons render live but don't always rasterize in the static PNG — use the **interactive HTML** as the source of truth.

## Grounded in real source (`jensbuehl/aoe4-guides@main`)
- `src/views/builds/BuildDetails.vue` — view route; add the mobile slim-header/hero/cards branch, leave `md-and-up` untouched.
- `src/views/builds/BuildEditor.vue` (or `BuildEdit.vue` / `BuildNew.vue` until `010` lands) — edit/create; shared slim header + sticky action bar + overflow (no Delete/Preview).
- `src/components/builds/BuildOrderSectionEditor.vue` — the build-order steps; add the mobile fixed-5-slot / calc-villager / editable-time / ✕-remove / age-down layout.
- `src/components/builds/IconSelector.vue`, `IconAutoCompleteMenu.vue`, `IconToolTip.vue` — **reused**: picker (in a bottom sheet), inline `::` autocomplete, and icon-class tints.
- `src/components/builds/BuildHeader.vue` — if `010-build-editor-unification` has landed, the slim mobile header is a branch here (the natural shared home).
- Composables (`buildService`, `youtubeService`, `buildOrderValidator`, `useExportOverlayFormat`, `useCopyToClipboard`, `useDownload`, `useVerificationGuard`, the `*DefaultProvider`s) — **reused as-is**.

## Relationship to `010-build-editor-unification`
This composes with `010` (the unified `BuildHeader` / `BuildEditor`): ideally the mobile slim header is a branch of the shared `BuildHeader`. If `010` is not yet merged, apply the mobile layout to the current three views and re-converge — see `spec.md` **NC-1**.

## Use
1. ~~Copy to `specs/011-mobile-build-layout/`~~ Already placed at `specs/013-mobile-build-layout/`; branch `013-mobile-build-layout`.
2. Answer the two **[NEEDS CLARIFICATION]** in `spec.md` (NC-1: compose with `010` now or ship against current views; NC-2: inline tap-to-type slots vs. a per-step editor sheet).
3. Generate tasks (`/speckit-tasks`) — **not** included here by request. Suggested ordering when you do: shared slim header → lean hero/overflow → Description/Video cards → build-order mobile step layout → **`useIconRichText` (WYSIWYG sync/caret) before wiring the picker/autocomplete** → age-down confirm → sticky action bar.
4. Pull exact styling + the Vuetify mapping from `design-input.md`; keep desktop `md-and-up` byte-for-byte unchanged.
5. Regression-check both routes at `xs`/`sm` **and** `md-and-up`: mobile is the new layout; desktop must be pixel-identical to before (SC-006). Run the WYSIWYG round-trip + caret matrices (SC-004/005) on a real device.
