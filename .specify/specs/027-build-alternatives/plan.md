# Implementation Plan: Build Order Alternatives

**Branch**: `027-build-alternatives` | **Date**: 2026-08-08 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `.specify/specs/027-build-alternatives/spec.md`

## Summary

Let an author mark a point where there are **two ways to play on**, and let a reader pick one and
follow it through the step list, the economy graph and focus mode.

The spec presents this as four surfaces. Phase 0 found it is really **one change to a coordinate
system**, plus four presentations of it.

Every derived reading of a build — times, redundancy, economy series, focus-mode queue — runs over a
single flattened step array in which **position is identity**
([R-1](./research.md#r-1--the-flat-step-list-is-the-apps-shared-coordinate-system)). So the branch is
resolved **inside the flattener**: `flattenSections(sections, selection)` splices in the active path
and returns the same linear array of the same step objects it returns today. The four consumers keep
receiving one ordered list and keep being right about it, **unchanged**. That single decision is what
keeps a feature touching five components from becoming five implementations of path logic.

Three findings shaped the rest:

- **The economy chart already refuses builds that contain alternatives**
  ([R-3](./research.md#r-3--the-economy-chart-already-refuses-builds-that-contain-alternatives)).
  `useEcoSeries` has a `rewinds()` guard that drops the chart when a build's clock jumps back two
  minutes, with a comment explaining that authors write variations out one after another. They are
  *already doing this feature by hand* and paying for it. Builds that convert get their chart back for
  free — no change to `getEcoSeries` at all. Recorded as a new **SC-007**.
- **Focus mode's queue is a mount-time snapshot**
  ([R-5](./research.md#r-5--focus-modes-queue-is-a-mount-time-snapshot-and-fr-015-breaks-that-assumption)) —
  built once, filtered, with `step.time` mutated in place and five parallel index-aligned arrays. FR-015's
  mid-run switch cannot patch that. It **rebuilds the queue and re-seeks by elapsed time**: the clock
  is the anchor, not the index. This also makes the countdown fallback need no special case.
- **The reading view and the editor are the same 2196-line component**
  ([R-4](./research.md#r-4--the-reading-view-and-the-editor-are-the-same-component)). US1 and US2 are
  not two files; they are four layout states of one. This is the largest risk in the feature and the
  reason the pick control and the lane are extracted rather than inlined.

One thing grew: **notes become a real item kind**
([R-9](./research.md#r-9--note-in-fr-007s-menu-has-no-writer-today)). `step.gameplan` is read by three
consumers and written by none — the site already knows what a note is (content, exempt from the
autoplay timing gate, showing the previous step's resources) but nothing could create one. Notes were
per-section and appeared as an **empty row at the bottom of every section** in the editor. Taken by
the author's decision: that row goes, and a note becomes something inserted where it is wanted
(FR-019…FR-021). It carries two pieces of work beyond the menu entry — removing the automatic row, and
teaching the overlay export to carry a note's text rather than emit an empty step.

## Technical Context

**Language/Version**: JavaScript (ES2022), Vue 3 — Options API `setup()`, matching every file touched

**Primary Dependencies**: Vue 3, Vuetify 3.8. **No new dependency.** Pick controls are
`v-btn-toggle`/`v-btn`, path tabs `v-tabs`, the add menu `v-menu` + `v-list` with `disabled` items and
tooltips — all present. The design HTML hand-rolls these; the Vuetify equivalents win (Principle III,
spec Assumptions)

**Storage**: Cloud Firestore, **additive within an existing field**. One new item kind nested inside
`build.steps`; no new collection, no new document, no migration, no version field, and no new read or
write. Active-path selection is view state — `localStorage` in the reading view, in-memory in focus
mode, never server-side ([R-11](./research.md#r-11--legacy-builds-and-what-fr-017-costs))

**Testing**: No automated suite (constitution; spec A-6). [quickstart.md](./quickstart.md) items 1–44
are the script, gated per phase; SC-001…SC-007 map onto them. Item 3 — a byte-identical overlay export
diff — is the one guarding the riskiest step

**Target Platform**: Web, both breakpoints. Unlike 026 this is **not** desktop-only: FR-013 specifies
the mobile pick card and rail nesting at 390px, and focus mode adds a micro tier

**Project Type**: Single-page web application, frontend only

**Performance Goals**: Nothing meaningfully changed. Flattening gains one level of recursion over an
array of realistic length 2–3 (spec Assumptions). Switching path re-runs the same derivations the page
already runs on load

**Constraints**: Builds without alternatives must render **byte-identically** (FR-017) — guaranteed by
contract [G-3](./contracts/flatten-sections.md#guarantees) rather than checked after the fact, since a
step with no `kind` is an ordinary step. Focus mode's clock **must never stall** (FR-015, SC-004),
which is why the switch re-seeks by time. Gold is reserved for age/timing/primary action; alternatives
are **secondary** throughout (FR-016)

**Scale/Scope**: **~8 source files**, 2 new components, 1 function signature extended, 2 ad-hoc
flatteners retired, 1 always-on editor row removed. Realistic data volume 2–3 paths per block, 1–2
blocks per build

## Constitution Check

*GATE: passed before Phase 0. Re-checked after Phase 1 — see bottom.*

| Principle | Assessment | Verdict |
|---|---|---|
| **I. Simplicity First** | No new dependency. The branch is resolved at **one** seam, so four consumers stay unchanged (R-1). The block is nested rather than bracketed by two marker items, which makes "nothing can dangle" unrepresentable instead of enforced (data-model §2). Two shapes were rejected as YAGNI: a rejoin pointer (FR-002 forbids it; positional rejoin needs no id) and per-block ids (identity is positional everywhere else in this codebase). | **PASS** |
| **II. Incremental Quality** | Phase 0 is a **net deletion**: two ad-hoc section walks in `FocusMode` and `useExportOverlayFormat` collapse into the shared `flattenSections` (R-2). It ships behaviour-neutral, guarded by a byte-identical export diff. The feature is then five commits, each atomic, each independently shippable in the spec's own priority order. | **PASS** |
| **III. Consistent UX & Component Reuse** | Vuetify for every control. The path description **reuses the existing step-note editor as-is**, including `::` autocomplete and the icon picker (FR-010) — no second editor. Two new components are extracted rather than inlined precisely because the pattern repeats across four layout states (R-4). No new colour: `secondary` is an existing theme role. | **PASS** |
| **IV. Cost-Conscious Infrastructure** | Zero backend impact. No new collection, no Function, no Cloud Run, no migration job, **no additional Firestore read or write**. The selection never leaves the browser. Against a project already at 2.7× the free read tier, this feature costs nothing. | **PASS** |
| **V. Secure Defaults** | No auth surface and no new user data. Path descriptions run through the **existing** `sanitizeStepDescription` (`img`+`br` allowlist); titles are stripped to plain text on save, matching how `time` and the resource cells are already handled — and mattering more, because a title is rendered into a chart legend and a focus-mode bar that do not render HTML (contract). Schema change is additive but **rules must still be reviewed**, per this principle. | **PASS** |

**No violations. Complexity Tracking section omitted as unnecessary.**

Two notes recorded rather than waived:

- **Against Principle I**: `flattenSections` gains a parameter and a level of recursion, and
  `sectionOffsets` must be called with the same selection (invariant O-1). That is real coupling
  between two functions that were independent. It earns its place because the alternative is four
  branch-aware traversals, which is the drift `sectionOffsets` was extracted to prevent.
- **Against Principle II**: this feature adds meaningful weight to `BuildOrderSectionEditor.vue`,
  already the largest file in the repo at 2196 lines. Extracting the two new components keeps it from
  growing further, but does not shrink it. A follow-up splitting its desktop and mobile layouts is
  worth a standalone `refactor:` — **noted, not smuggled into this feature.**

## Project Structure

### Documentation (this feature)

```text
.specify/specs/027-build-alternatives/
├── spec.md                          # Feature spec (harvested 2026-08-08)
├── plan.md                          # This file
├── research.md                      # Phase 0 — R-1…R-11
├── data-model.md                    # Phase 1 — block shape, selection, admission rules, invariants
├── quickstart.md                    # Phase 1 — the manual test script, gated per phase
├── design-input.md                  # Design decisions and their reasoning (harvested)
├── contracts/
│   ├── flatten-sections.md          # Phase 1 — the one seam; guarantees and non-goals
│   └── alternatives-block.md        # Phase 1 — document shape, invariants, sanitisation
├── assets/                          # Seven design frame captures
├── checklists/requirements.md       # Spec quality checklist
└── tasks.md                         # Phase 2 output — /speckit-tasks, NOT created here
```

### Source Code (repository root)

```text
src/
├── components/builds/
│   ├── AlternativesPick.vue           # NEW — the pick control (desktop row, mobile card, focus beat)
│   ├── AlternativesLane.vue           # NEW — the rail wrapping an active path's steps
│   ├── BuildOrderSectionEditor.vue    # MODIFIED — renders the block; add menu; path tabs;
│   │                                  #   positional notes, automatic note row removed
│   ├── BuildOrderEditor.vue           # MODIFIED — passes selection; block-aware insert commands
│   ├── EcoLines.vue                   # MODIFIED — path selector in the legend region; shaded span
│   └── FocusMode.vue                  # MODIFIED — queue rebuild + re-seek; path bar; countdown
├── composables/builds/
│   ├── useAgeTimings.js               # MODIFIED — flattenSections/sectionOffsets take a selection
│   └── useActivePath.js               # NEW — the shared selection (provide/inject, per page)
└── composables/converter/
    └── useExportOverlayFormat.js      # MODIFIED — routed through flattenSections (FR-018);
                                       #   carries a note's text (FR-021)
```

**Structure Decision**: The established single-project SPA layout, unchanged.

`useActivePath` is a **factory composable provided per page**, deliberately mirroring
[`useStepHighlight`](../../../src/composables/builds/useStepHighlight.js) — whose docstring explains
why module-level state would be wrong: *"preview cards and focus mode can put a second build on
screen, and both builds would then share one highlight."* The identical hazard applies here, so the
identical shape is used rather than a new one.

The branch logic goes in `flattenSections` and not in a new `resolveAlternatives()` helper, because a
separate function would hand every caller two things to combine — which is the seam R-1 exists to
close.

## Phase Sequencing

Five commits. The order is the spec's own priority order, with one refactor in front.

| Phase | Commit | Content | Gate |
|---|---|---|---|
| **0** | `refactor:` | Route `FocusMode` and `useExportOverlayFormat` through `flattenSections`. No signature change yet. | **No behaviour change.** Overlay export byte-identical; focus mode plays. Quickstart 1–5 |
| **1** | `feat:` | Insert menu on the existing inline zones; bottom-anchored add buttons removed. Disabled entries with reasons. **Notes**: positional via the menu, automatic section row removed, export carries note text | FR-007, FR-019…FR-021. Quickstart 6–10g |
| **2** | `feat:` | The block: data shape, `flattenSections(sections, selection)`, `useActivePath`, editor authoring, desktop + mobile reading | US1, US2 — SC-001, SC-002, SC-005. Quickstart 11–22 |
| **3** | `feat:` | Economy graph: path selector in the legend region, shaded span, shared selection both ways | US3 — SC-003, SC-007. Quickstart 23–30 |
| **4** | `feat:` | Focus mode: pick beat, countdown fallback, queue rebuild + re-seek, path bar | US4 — SC-004. Quickstart 31–39 |

**Phase 0 must land first.** Teaching a flattener about paths while three others exist means the
overlay export emits a block into a step list and focus mode shows a blank card — and both would be
found late, by a human, rather than by the byte-diff in quickstart item 3.

**Phase 1 ships alone and is worth shipping alone.** It adds no data to any existing build, and
design-input records that reviewers already found the bottom-anchored add buttons confusing. It is a
standalone improvement that happens to be a prerequisite.

It is also where notes land, and that pairing is not arbitrary: the automatic note row and the
bottom-anchored add buttons are the same mistake — the editor deciding for the author what belongs at
the end of a section. One commit removes both and replaces them with a menu that inserts where asked.

**Phase 2 is the feature.** Phases 3 and 4 are independently shippable on top of it, in either order —
though 3 before 4 matches the spec's priorities and puts the lower-risk surface first.

## Phase 0 Findings That Changed the Design

Full reasoning in [research.md](./research.md).

1. **One seam, not five** (R-1). Position in the flat list *is* step identity, and four consumers plus
   a provide/inject channel depend on that. Resolving the branch during flattening leaves all of them
   correct with no changes. The obvious alternative — each surface understanding paths — is four
   implementations of one traversal in files whose only shared contract is agreeing on what step *n* is.
2. **Authors are already doing this by hand, and the site punishes them** (R-3). `rewinds()` drops the
   economy chart for exactly the builds this feature is for. Converted builds regain it with no code
   change — a measurable outcome the spec did not claim, now **SC-007**.
3. **Focus mode cannot be patched, it must be rebuilt** (R-5). Five parallel index-aligned arrays, a
   destructive filter and an in-place `step.time` mutation, all at mount. Re-seeking by clock instead
   of by index turns a fragile index-repair problem into a rebuild, and makes the countdown fallback
   fall out for free.
4. **The block cannot be a section** (R-10). `getCurrentAge()` is `sections.filter(type === "age").length`
   — the current age is a **count**. A block as a section would shift every age after it. This also
   makes FR-003 (a block lives in one age section) structural rather than validated.
5. **Nesting beats bracketing in the data** (data-model §2). The two markers stay exactly as designed
   *on screen*; in the document the block is one object, which makes an orphan marker and steps
   outliving their block unrepresentable rather than detectable.
6. **The legend has no free gestures** (R-7). Hover already dims and click already pins. The path
   selector shares the legend region but not the row.
7. **The site already knows what a note is; nothing could make one** (R-9). `step.gameplan` is read by
   three consumers — each encoding a decision about notes — and written by none. Supplying the writer
   is most of the work already done, and it lets the editor stop showing an empty note row on every
   section whether or not the author wanted one.

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| `BuildOrderSectionEditor` (2196 lines, 4 layout states) becomes unworkable under a fifth state | **High** | The two extracted components are the mitigation, decided in Phase 0 rather than discovered mid-phase. If Phase 2 overruns, it overruns here — cut mobile polish before cutting the extraction |
| Focus-mode switch lands the player on the wrong step, or the clock jumps | **Medium** | Re-seek by elapsed time, never by index (R-5). Quickstart 34 is the specific check; 32 watches the clock across the split against a wall clock |
| Phase 0's refactor changes overlay export subtly (it stamps `step.age`, and mutates the source step doing it) | **Medium** | Byte-identical JSON diff, quickstart 3. The `step.age` mutation is pre-existing; **preserve it exactly, do not fix it here** — a behaviour-neutral commit is not the place |
| A stale `stepIndex` survives a path switch and the crosshair points at the wrong row | Medium | Invariant S-2: clear the highlight on switch. Quickstart 28 |
| The path selector inherits the legend's hover-dim and click-pin semantics | Low | Separate control in the legend region (R-7). Quickstart 24 |
| Authors nest blocks or age up inside a path | Low | A-4 ignored by the flattener and disabled in the menu **with the reason shown**; A-5 structurally impossible (R-10) |
| A note turns autoplay off, because it has no timestamp | Low | `isNoteAt` already exempts notes from the gate (invariant N-3) — this is why notes ride on `gameplan` rather than on a new field. Quickstart 10c is the explicit check |
| Removing the automatic note row loses an existing section note | **Medium** | The row stays for sections that have one; only the empty row goes (FR-020). No migration, no rewrite of the field. Quickstart 10g |
| A note exports as an empty overlay step | Medium | FR-021, in the same phase. Note this gap exists **today** for section notes, which the export drops entirely |

The risk that would have cost the most unplanned time — discovering mid-implementation that focus
mode, the graph and the table each needed their own path logic — **no longer exists**. It was
dissolved by R-1 before any code was written.

## Constitution Re-check (post-design)

Re-evaluated after the Phase 1 artifacts. **Still PASS on all five.**

The design added no dependency, no backend surface and nothing persistent server-side. Since the
pre-check, two things moved *toward* the principles: Phase 0 turned out to be a **net deletion** of
duplicated traversal logic rather than an addition (Principle II), and the economy graph was found to
need **no change at all** to support paths (Principle I, R-3).

One thing moved against them, and is recorded above rather than waived: the largest file in the
codebase grows again. The follow-up refactor it deserves is named, and deliberately not bundled here.

The contracts' non-goals sections are the guard worth keeping. `flattenSections` reports one ordered
list of steps and explicitly refuses to re-time, validate, repair, or decide what a block *means* —
which is what keeps FR-006 (each path owns its timings; nothing after the block is re-timed)
enforceable in code rather than merely intended.
