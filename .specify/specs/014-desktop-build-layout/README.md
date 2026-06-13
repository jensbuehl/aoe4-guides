# Handoff: Desktop Build View & Editor Layout (`014-desktop-build-layout`)

Spec-Kit handoff to bring the **desktop** build **header** and **build-order steps viewer/editor** up to the bar set by the mobile redesign (`011`). A build header led by a prominent **civilization lockup**, and a refined build-order **table** — fixed 5 resource columns, calculated villager total, a gold **age-transition lane**, an increase-only **gold delta accent**, quiet empty cells — that looks **identical in view and edit** except for the edit affordances. The drifted desktop edit fields are re-synced to the read-only view as the alignment reference.

## The ask (verbatim intent)
- We shipped the mobile redesign; now improve the **desktop** layout of the **build header** and the **build-order steps viewer + editor**.
- **Adhere closely to the design proposal** (the interactive prototype in this package).
- **Do not change the icon color coding** (the dynamic per-class icon-tile background) — you **may** adjust icon **size**.
- **Do not touch the icon selector**; **do not touch focus mode.**
- **Edit page:** remove the "Add step" button after the last row — rely on the **hover** insert action, and make sure that hover affordance is available **after the last step** too.
- **Add age-up** must initialise with an empty step **right away** (one in the aging-up lane, one in the age-up-reached section) and **focus the timestamp cell** to start typing immediately.
- **View page alignments are the reference** — they're slick. In edit mode a few fields were outdated / out of sync; edit must look **identical** to view except for the edit capabilities.

## Scope (read before implementing)
**In:** the desktop (`md-and-up`) layout of the build view + edit/create routes — the hero/header (civ lockup, chips, in-header Publish + overflow), and the build-order table (fixed columns, calc villager, editable timestamp, WYSIWYG notes, gold age lane, delta accent, hover insert, ✕ remove, age-down confirm), plus desktop placement of the Description/Video cards.
**Out (unchanged):** the entire **mobile (`xs`/`sm`)** layout (`011`), the **data model / store / routing / Firestore rules**, the **save/draft/publish/delete/export logic**, the **`::id::` shortcode format**, the **`IconSelector` / `IconAutoCompleteMenu` behaviour**, the **icon-class → tile color coding** (size-only changes allowed), and **Focus mode**. This is a desktop **layout refresh + view/edit parity pass**, not a rewrite.

## ⚠️ The two hard parts

### 1. View/edit parity (the headline ask)
The build order must **not re-arrange** between view and edit — same row heights, same column positions, same first-line alignment of timestamp / villager total / resource cells. The edit fields had drifted (smaller font, airy `line-height:2.1`, wrong vertical offset). `design-input.md` §3.2 gives the **resolved alignment contract** (all leading cells centered at ≈25 px on the note's first line, top-aligned on multi-line steps, identical in both modes). **Build view first, then make edit match it.** Gate: **SC-002**.

### 2. WYSIWYG sync & caret (inherited from `011`)
Same risk as mobile — icons drifting out of sync with the stored value, caret jumping on insert. **Reuse the `011` `useIconRichText` composable** (uncontrolled-while-focused contenteditable, deterministic `::token::`↔HTML round-trip, one caret-safe insert primitive, atomic icons). New here: **multi-line notes** — `Enter` is a line break **within** the note (never "new step"); `\n`↔`<br>` must round-trip. The Insert-icon trigger is a **corner button** revealed on focus with a **0 px** no-CLS contract (§3.7). Gates: **SC-003 / SC-004**, FR-015–019.

## What changes (desktop only)
- **Hero** — leads with a **civ lockup** (flag + civ name) distinct from the metadata chips (status / season / map / strategy); the civ is no longer just a chip. Vote / favorite / overflow on the right (view); **Publish** primary + ⋮ `Save as draft` / `Discard` (edit). **No sticky bottom action bar** on desktop. Inline-editable title (calm, accent-on-focus).
- **Build-order table** — **five fixed resource columns** (Builder · Food · Wood · Gold · Stone; empty = faint dash, no tile), **calculated** read-only villager total, **editable** free-text timestamp, **WYSIWYG** notes with inline class-tinted icons (in-note tiles **36 px**, legend **28 px** — size is the only icon change), sticky legend, and a **gold delta accent** (2 px top-border) on cells that **increased** vs the previous step (increase-only, no first-step accent).
- **Age transitions** — a gold **"Age up to {age} Age"** marker → a **lane** of aging-up steps with a gold **inset** left edge (no indentation — columns stay aligned) → a gold **"{age} Age reached"** plate.
- **Edit affordances** (the only view/edit difference) — tap-to-type cells (live villager recompute), a corner Insert-icon (focus-only, no CLS) opening the existing `IconSelector`, a hover **insert line** between rows **and after the last row** (no "Add step" button), a unified hover **✕**, **Add age-up** that seeds two empty steps and focuses the new timestamp, and an **age-down** confirmation.
- **Separators** — no bottom line on the last row or on a note row directly above an age-up.
- **Removed** — the age-jump shortcut chips (Keep-It-Simple). **Focus mode** stays as-is.

## Fidelity
**High-fidelity**, grounded in the real Vuetify theme tokens. Recreate with **Vuetify components** — the mock is **not** code to paste. `design-input.md` §2 maps every mock element to its Vuetify component (picker → `v-dialog` + the existing `IconSelector`; age-down → `v-dialog`), §1 gives both-theme tokens, and §3 gives the **only** custom CSS (the alignment contract, the inset lane, the no-CLS corner button, the delta accent) with resolved values. §3 also reproduces the frozen icon-class tints **for reference only — do not modify them**.

## Files in this package
| File | What |
|---|---|
| `spec.md` | Desktop-only scope + non-goals + 3 prioritized user stories + FR-001..025 + success criteria (incl. the SC-002 parity gate and the WYSIWYG round-trip/caret gates) + 3 `[NEEDS CLARIFICATION]` |
| `design-input.md` | ⭐ Resolved tokens (both themes) + **mock→Vuetify mapping** + the **only** custom CSS (alignment contract §3.2, inset age lane §3.5, no-CLS corner button §3.7, delta accent §3.3) + frozen icon-class tints + verbatim copy/action sets + desktop structure |
| `tasks.md` | ⭐ T-00..T-23 in 7 phases (header → table shell/alignment → view rendering → WYSIWYG/edit → add/remove → width → polish/regression) with FR/SC acceptance hooks |
| `assets/Desktop Build Redesign.html` | ⭐ **Interactive reference** — Tweaks panel toggles Mode (view/edit), Theme (dark/light), Layout (classic/sidebar) |
| `assets/desktop-final-*.jsx` | Source of the prototype (`data` = tokens/sample/round-trip · `parts` = header/hero/cards/dialogs/picker · `steps` = table/lane/inline-edit · `app` = state/handlers/Tweaks) |
| `assets/01-view-overview.png` | View route — hero + description + table head |
| `assets/02-view-build-order.png` | View route — age lane + delta accents + multi-line note |
| `assets/03-edit-build-order.png` | Edit route — synced fields, tap-to-type cells, WYSIWYG notes |

> The working interactive file lives at **project root** (`Desktop Build Redesign.html`), where `assets/res/*` and `assets/flags/*` resolve; the copy in `assets/` is the archival source.
> MDI (`mdi-*`) icons render live but don't always rasterize in static PNGs — use the **interactive HTML** as the source of truth.

## Grounded in real source (`jensbuehl/aoe4-guides@main`)
- `src/views/builds/BuildDetails.vue` — view route; refresh the **desktop** hero + build-order presentation, leave mobile (`011`) untouched.
- `src/views/builds/BuildEditor.vue` (or `BuildEdit.vue` / `BuildNew.vue` until `010` lands) — edit/create; in-header Publish + overflow, the synced inline-edit table.
- `src/components/builds/BuildOrderSectionEditor.vue` — the build-order steps; the desktop fixed-column / calc-villager / delta / age-lane / hover-insert / age-down layout, view↔edit parity.
- `src/components/builds/BuildHeader.vue` — if `010` has landed, the desktop hero refresh (civ lockup, Publish, overflow) is a branch here.
- `src/components/builds/IconSelector.vue`, `IconAutoCompleteMenu.vue`, `IconToolTip.vue` — **reused unchanged**: picker (in a `v-dialog`), inline `::` autocomplete, and the **frozen** icon-class tints.
- Composables (`buildService`, `youtubeService`, `buildOrderValidator`, the WYSIWYG `useIconRichText` from `011`, the `*DefaultProvider`s) — **reused as-is**.

## Relationship to `010` and `011`
- Composes with **`010-build-editor-unification`** (shared `BuildHeader`/`BuildEditor`) — ideally the desktop hero refresh is a branch of the shared header (see `spec.md` NC-1).
- The **desktop sibling of `011-mobile-build-layout`**: same data model, same WYSIWYG contract, same five-slot / calc-villager / unified-✕ / age-down decisions — re-presented for `md-and-up`. Mobile stays exactly as `011` shipped.

## Use
1. Branch `014-desktop-build-layout` (already created); spec lives at `.specify/specs/014-desktop-build-layout/`.
2. Answer the three **[NEEDS CLARIFICATION]** in `spec.md` (NC-1: compose with `010` now or ship against current views; NC-2: ship single column or include the `lg` side-rail; NC-3: promote section note rows to WYSIWYG or keep plain-text in edit).
3. Work `tasks.md` in order — **T-06 (alignment contract) is the spine**; do view rendering before edit affordances; reuse the `011` WYSIWYG host before wiring the picker/inputs.
4. Pull exact styling + the Vuetify mapping from `design-input.md`; keep the mobile (`011`) layout and all save/publish/export logic byte-for-byte unchanged.
5. Regression-check both routes at `md-and-up` **and** `xs`/`sm`: desktop is the new layout; mobile must be pixel-identical to `011`. Run the parity measurement (SC-002), the WYSIWYG round-trip + caret matrices (SC-003/004) on a real build, and confirm the icon-class tiles + Focus mode are unchanged (SC-008).
