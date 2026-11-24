# Implementation Plan: Somewhere to Go From a Build Page

**Branch**: `046-related-builds` | **Date**: 2026-11-24 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `.specify/specs/046-related-builds/spec.md`

**Note**: `setup-plan` was not run. It resolves the feature from the shared `.specify/feature.json`, which points at 042 while another session works on it. This plan was copied from the template by hand, and `CLAUDE.md`'s plan pointer was left on 042 for the same reason. Repoint both when 046 gets its branch.

## Summary

At the end of the build read view, add two stacked rails: **More ‹Civ› builds** and **More by ‹author›**. Each has three `BuildListCard`s and a "View all" exit. One new component, `RelatedBuilds.vue`, owns both rails:
- It fetches with existing service calls (`getCivBuilds`, `getBuilds`) the first time it nears the viewport.
- It reserves its height with skeleton cards.
- It removes a rail that comes back empty or fails.

No new index, no rules change, no API change.

A refactor commit comes first. It extracts the section header and the "View all" button into shared components (`SectionHeader`, `ViewAllButton`) and moves their existing copies onto them, so the rails reuse rather than paste (constitution III).

## Technical Context

**Language/Version**: JavaScript (ES modules), Vue 3 (Options API with `setup()`, as in the surrounding components)

**Primary Dependencies**: Vuetify 3, `@vueuse/core` 13 (`useElementVisibility`), Firebase JS SDK (through `buildService`)

**Storage**: Cloud Firestore `builds`, read-only. Existing indexes (research R2).

**Testing**: `npm run build`, `npm run check:setup`, the icon allowlist check, and the `ux-gate` skill at 360/393 (Android UA) and 960/1280, light and dark. No unit harness is needed; the selection logic is small and pure, and it is checked in quickstart §3.

**Target Platform**: The SPA on Netlify. Mobile and desktop browsers.

**Project Type**: Web application (frontend only for this feature)

**Performance Goals**:
- Zero added reads unless the rails approach the viewport.
- At most 11 document reads once they do.
- Zero layout shift when they load.

**Constraints**:
- No new route or `/api` surface.
- Every icon must be in `src/plugins/mdiIcons.js`.
- Reserved heights come from `BuildListCard`'s measured values, never derived (CLAUDE.md).

**Scale/Scope**: 5,426 builds, about 4.35M counted views all-time. The feature itself is one new component of about 150 lines, plus one line in `BuildDetails.vue`. The refactor adds two small shared components and touches 6 existing files, with no visual change.

## Constitution Check

| Principle | Assessment |
|---|---|
| I. Simplicity First | ✅ One component, existing service calls, no new dependency or abstraction. Over-fetching (R4) was chosen over a cleverer query. |
| II. Incremental Quality | ✅ No smell introduced. The rail header reuses the existing `build-card-section-header` class rather than adding a lookalike. |
| III. Consistent UX & Reuse | ✅ *after the fix*. `BuildListCard` is reused, and the skeleton is the card's own `loading` state. The first draft **copied** two patterns, which /speckit-analyze flagged as CRITICAL (C1): the section header (pasted markup plus a pasted scoped `.build-card-section-header` rule, already in 5 files) and `BuildLaneTabs`' "View all" button. Both are now extracted (`SectionHeader`, `ViewAllButton`) and the existing copies migrated to them, in a refactor commit ahead of the feature. |
| IV. Cost-Conscious | ✅ Lazy fetch (SC-002). At most 11 reads per build view that reaches the end, and opening a rail card costs no read (cache, R6). |
| V. Secure Defaults | ✅ Read-only, public data only (`isDraft == false`). No rules change. A uid in a URL exposes nothing the build documents don't already (R1). |

No violations, so the Complexity Tracking section is empty.

## Project Structure

### Documentation (this feature)

```text
.specify/specs/046-related-builds/
├── spec.md
├── plan.md              # this file
├── research.md          # Phase 0
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1
├── contracts/
│   └── related-builds.md   # the component's props and behaviour
└── tasks.md             # /speckit-tasks (not yet)
```

### Source Code

```text
src/
├── components/common/
│   ├── SectionHeader.vue        # NEW (refactor): icon + uppercase caption, 36px, default slot for trailing controls
│   └── ViewAllButton.vue        # NEW (refactor): the BuildLaneTabs exit, label truncates
├── components/builds/
│   ├── RelatedBuilds.vue        # NEW: both rails, lazy fetch, skeletons, dedupe
│   ├── BuildListCard.vue        # unchanged, used as is
│   ├── AgeTimeline.vue          # refactor: header → SectionHeader
│   └── BuildOrderEditor.vue     # refactor: header → SectionHeader (trailing controls in slot)
├── components/home/
│   └── BuildLaneTabs.vue        # refactor: exit → ViewAllButton
├── components/Discussion.vue    # refactor: header → SectionHeader (removed later by 047)
├── views/builds/
│   ├── BuildDetails.vue         # refactor: Description (desktop) + Video headers → SectionHeader;
│   │                            # + <RelatedBuilds :build="build" /> after the video card
│   └── BuildEditor.vue          # refactor: its two headers → SectionHeader
├── composables/data/
│   └── buildService.js          # unchanged: getCivBuilds, getBuilds
└── plugins/mdiIcons.js          # unchanged: flag-outline, account-outline, chevron-right already allowlisted
```

**Structure Decision**: The two extracted pieces go in `src/components/common/`, beside `CivFlag` and `UserAvatar`, because they serve the build pages and Home alike. The rails component goes in `src/components/builds/` beside `BuildListCard`. Both rails share one visibility trigger and one dedupe step (FR-004), so they are one component, not two instances of a generic rail. A generic `<BuildRail>` would be the abstraction Principle I warns against until a second page needs one.

## Design Notes

- **Placement**: after the video card, before `<Discussion>` (FR-006, while Comments still exist).
- **Rendered once the page has loaded its build**: `v-if="!loading"` (the page's own flag, set after `build` is assigned), with `:build-id="id"` from the route, because a cached build may lack `id`. The component reads the build once at setup. That is safe because `<router-view>` is keyed by path, so a different build is a fresh mount. The `/builds/new` route and the editor don't use this view's read path (FR-013). Focus mode is a dialog over the page, so the rails sit behind it and never trigger while it is open.
- **Skeletons**: each rail renders `Array(3).fill({ loading: true })` through `BuildListCard`, which already sizes its skeleton to its per-breakpoint height. Headers render with the skeletons. A rail that turns out shorter is trimmed, and one that turns out empty is removed. Either is a shift *below* the rail only, never above it (FR-009, US3-AS4). See research R5: the fetch starts 600px early, so it normally happens off-screen.
- **`SectionHeader`**:
  - Props: `icon` and `label`. A default slot holds trailing controls (BuildOrderEditor's buttons, AgeTimeline's toggle).
  - It owns the single `.build-card-section-header` rule (`letter-spacing: 0.05em; height: 36px`) and `d-flex align-center px-4 ga-2`.
  - The label span is `text-truncate` with `min-width: 0` (FR-015).
  - Not migrated: the **mobile Description header** in `BuildDetails`, which is a click-to-expand row with a chevron and `cursor: pointer`. It can use the component through the slot only if the click target is preserved. Migrate it only if that is the case; otherwise leave it and say so in the commit.
  - The refactor must not change a pixel. Compare the existing headers before and after with the ux-gate rig.
  - Icons used by the rails: `mdi-flag-outline` (civ) and `mdi-account-outline` (author), both already allowlisted.
- **`ViewAllButton`**:
  - Props: `to` and `label` (default "View all").
  - It is exactly `BuildLaneTabs`' current `v-btn` (`variant="text"`, `color="primary"`, `rounded="lg"`, `height="38"`, `:block="smAndDown"`, `append-icon="mdi-chevron-right"`), with the label wrapped in a `text-truncate` span so "View all by ‹long name›" stays on one line (FR-015).
  - Its wrapper `div.d-flex.justify-center.mt-1` moves in with it.
## Complexity Tracking

Empty: no violations.
