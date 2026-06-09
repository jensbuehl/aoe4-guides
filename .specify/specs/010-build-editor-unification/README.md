# Handoff: Build Editor Unification & Shared Build Header (`010-build-editor-unification`)

Spec-Kit handoff to apply one design to the **new**, **edit**, and **view** build routes by **extracting a shared `BuildHeader.vue`** — merging `BuildNew` + `BuildEdit` into a single `BuildEditor.vue`, refreshing its layout + actions, and **refactoring the view route's header onto the same component with a single overflow menu** (no more standalone Edit pencil).

## The ask (verbatim intent)
- Apply this design to the **`new`** and **`edit`** routes.
- Update the **`view`** route header to be **consistent** — **use only an overflow menu** in the header, and **re-use the component** instead of duplicating the hero.

## How the reuse is done (the important part)
Today the build hero is hand-rolled in **three** views, each duplicated **twice** for `hidden-sm-and-down` / `hidden-md-and-up` — six copies. The plan **extracts** it once and points all three consumers at it (mirroring how `009` extracted `PickerDialog`/`FileDropZone`):

```
BuildHeader.vue  (flag bg + title + reactive chips + #actions slot)
        ▲                  ▲                       ▲
BuildEditor(new)    BuildEditor(edit)      BuildDetails(view)
  #actions: —         overflow:              Vote + Favorite + ONE overflow
  (no overflow)       Duplicate/Copy/        (Edit folded IN — pencil deleted)
                      Download/Delete
```
Refactoring `BuildDetails` onto the shared header is **in scope** and its own atomic commit — it proves the component against a second consumer with a different action set (Constitution III: *extract repeated patterns*). Net result: **one** hero (instead of six), **one** editor (instead of two ~22 KB views), and **one** management affordance per route.

## What changes per route
- **new / edit** → a single `BuildEditor.vue` (`mode` prop): shared hero, two metadata cards (**Build details** + **Classification** 4-col), a **sticky footer** (Discard / Save as draft / Publish build + "Unsaved changes"), and **live YouTube validation** (thumbnail preview or inline error). Edit mode gets a hero overflow (Duplicate / Copy to overlay / Download / Delete); create mode has none.
- **view** → `BuildDetails.vue` header swaps its twin hero blocks for `<BuildHeader>` and collapses actions into **one** overflow: **Edit** (moved in from the loose pencil) / Publish / Duplicate / Copy / Download / Open in RTS Overlay / Delete — all owner-gated as today. Vote + Favorite stay beside the menu (engagement, not management). Everything below the header (Description, steps, video, Discussion, FocusMode, swipe, delete flow) is **unchanged**.

## Fidelity
**High-fidelity.** Colors, spacing, type, and interactions are final and grounded in the real Vuetify theme tokens. Recreate with **Vuetify components** (it is **not** code to paste) — `css-reference.md` §6 maps every mock element to its Vuetify component, so the mock's hand-rolled header/footer/selects/menu are **not** reproduced literally.

## Files in this package
| File | What |
|---|---|
| `spec.md` | The ask + reuse constraint + 5 user stories + FRs + success criteria + the Vote/Favorite and editor-Delete clarifications |
| `plan.md` | Constitution check (PASS), the **reuse architecture**, the one-vs-two-extraction decision, file map, key design decisions |
| `tasks.md` | 37 tasks; **Phase 2 (shared `BuildHeader`) first**, then editor logic/body/footer/overflow, route migration, then **Phase 9 view-route refactor**; optional `BuildActionMenu` phase; Conventional Commits |
| `css-reference.md` | ⭐ Resolved tokens (both themes) + the **mock→Vuetify mapping** + the only custom CSS (sticky footer, YouTube preview/error; the hero fade is the existing `:gradient`) |
| `contracts/BuildHeader-contract.md` | Shared hero — props/slots/chip set/structure |
| `contracts/BuildEditor-contract.md` | Merged editor — props/router/Vuex/composables/handlers/states |
| `contracts/BuildActionMenu-contract.md` | *(optional)* overflow menu driven by an `items` array |
| `assets/01-editor-overview.png` | Editor: hero + two cards + sticky footer |
| `assets/02-overflow-menu.png` | Edit-mode hero overflow (Duplicate / Copy / Download / Delete) |
| `assets/03-video-valid.png` | Video field: valid YouTube → thumbnail + "Valid YouTube link" |
| `assets/04-video-invalid.png` | Video field: unrecognized URL → inline error |
| `assets/05-published-badge.png` | Hero badge variants (Tweaks: draft / published / new) |

> The MDI (`mdi-*`) icons render live but don't always rasterize in the static PNG captures — exact icon names are in the contracts + `css-reference.md`. **Interactive reference:** `BuildEdit Design.html` at the project root (Tweaks → dirty state, hero badge, video field empty/valid/invalid).

## Grounded in real source (`jensbuehl/aoe4-guides@main`)
- `src/views/builds/BuildNew.vue` + `src/views/builds/BuildEdit.vue` — the two near-identical views → **merged** into `BuildEditor.vue`.
- `src/views/builds/BuildDetails.vue` — the view route with the twin hero blocks + standalone Edit pencil → **refactored** onto `BuildHeader`, single overflow.
- `src/components/builds/BuildOrderEditor.vue` — the steps editor → **reused unchanged** in editor + view.
- `src/composables/...` — `buildService`, `creatorService`, `contributorService`, `youtubeService`, `buildOrderValidator`, `useExportOverlayFormat`, `useCopyToClipboard`, `useDownload`, `useTimeSince`, the `*DefaultProvider`s, `useVerificationGuard` — **reused as-is**.
- `src/router/index.js` — `BuildNew` / `BuildEdit` route entries → **remapped** to `BuildEditor` (route **names** preserved so existing `:to`/`push({name})` keep working).

## Use
1. Copy to `specs/010-build-editor-unification/` (renumber if `010` is taken); branch `010-build-editor-unification`.
2. Answer the **[NEEDS CLARIFICATION]** in `spec.md`: should the editor's "Delete build" fully wire the cascade delete, or stay a shell that defers to the view route's existing `handleDelete`?
3. Implement from `tasks.md` — **Phase 2 first** (shared `BuildHeader`), then the editor, then **Phase 9** (refactor `BuildDetails` onto it). Pull exact styling + the Vuetify mapping from `css-reference.md`; component shapes from `contracts/`.
4. Regression-check all three routes after the refactor: create, edit, and view must each show the same hero and a single overflow, with no loss of any existing action (save, draft, publish, duplicate, copy, download, open-in-overlay, delete, vote, favorite).
