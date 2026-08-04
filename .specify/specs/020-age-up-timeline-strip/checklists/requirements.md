# Specification Quality Checklist: Age-Up Timeline Strip

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-08-04
**Updated**: 2026-08-04 — after harvesting the `013-build-list-timings` design handoff and a 5-question clarify pass
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Success criteria are technology-agnostic (no implementation details)
- [x] All acceptance scenarios are defined
- [x] Edge cases are identified
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria
- [x] User scenarios cover primary flows
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] No implementation details leak into specification

## Notes

**Caveat on "no implementation details"**: this spec names specific files, CSS classes and asset paths, which a pure spec normally would not. That is deliberate — the design handoff resolved those decisions already and losing them would waste the design work. The user-facing requirements remain testable independently of them.

**Resolved this session** (5 questions, all recorded in the spec's Clarifications section):

1. Home-lane timings produced on the client save path and stored on the build document (not derived in the Cloud Function) — `functions/` is a separate CommonJS package that cannot import the ES-module derivation, so computing there would mean a second copy of the logic.
2. `ageTimings` stored as a sortable map with unreached ages omitted, so a future "fastest Feudal" / "sort by Castle time" needs no reshaping and no backfill twice.
3. `md` card grows 90 → 112 px (and `xs` 90 → 96) to fit the three-row rail.
4. Crest-only rail with per-row accessible labels; age names stay in text on the details timeline.
5. An empty meta line collapses rather than rendering blank; the civ flag is kept on civ-locked lists.

**Corrections applied to the inherited handoff** (verified against `main` — see the spec's Source Verification section):

- `Dashboard.vue` is not a direct host of the card; it goes through `BuildLaneTabs`, which also serves the home page with a *different* data shape.
- `author-locked` is a new context value, not one that mirrors `FilterConfig`.
- The proposed `derived` test (`!step.time`) would mislabel an unparseable timestamp as author-stated.

**Verified as claimed**: the dead map chip, the age crest asset paths, the `BuildDetails.vue` section order, the home snapshot field whitelist, and the absence of Firestore field projection on the list query.

All checklist items pass; spec is ready for `/speckit-plan`.
