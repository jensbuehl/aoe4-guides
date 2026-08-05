# Specification Quality Checklist: Focus Mode — Floating Window (Document Picture-in-Picture)

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-08-05
**Feature**: [spec.md](../spec.md)

## Content Quality

- [~] No implementation details (languages, frameworks, APIs) — **deliberate deviation, see Notes**
- [x] Focused on user value and business needs
- [~] Written for non-technical stakeholders — **same deviation**
- [x] All mandatory sections completed

## Requirement Completeness

- [x] No `[NEEDS CLARIFICATION]` markers remain — all 5 open questions closed 2026-08-05, see Notes
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
- [~] No implementation details leak into specification — **same deviation**

## Notes

### Deliberate deviation: implementation detail is present, and stays

The spec names source files, Vuetify components and the Document Picture-in-Picture API. This
fails the template's generic "no implementation details" rule and is kept anyway, for three
reasons:

1. **House style.** Every prior spec in `.specify/specs/` (see `022-step-time-resolution/spec.md`)
   scopes by file path. Diverging here would make this feature harder to review, not easier.
2. **The constitution mandates the stack.** Principle III requires Vuetify components before
   custom ones; naming `v-btn-group` in NFR-001 *is* the requirement, not an implementation leak.
3. **The feature is defined by a platform capability.** "An always-on-top window containing live
   DOM" has exactly one web implementation. Abstracting the API out of the spec would describe a
   feature that cannot be built.

The scope guard under Success Criteria depends on the file list being explicit.

### Clarification session 2026-08-05 — all five closed

| ID | Resolution | Effect |
|---|---|---|
| NC-1 | Composable + `localStorage`, matching the theme toggle | Resolved by inspection, no question spent |
| NC-2 | Close the window on any navigation away from the build page | Tightened FR-004, added FR-004a |
| NC-3 | **Reframed**: risk is opener timer throttling, not speech. Tick from the visible PiP document | Added FR-024, FR-025 |
| NC-4 | No badge, no badge mechanism | Cut T046 |
| NC-5 | Standalone `fix:` commit on `main` ahead of this branch | FR-016 became a prerequisite, added T004 |

**NC-3 was the load-bearing one, and it changed the design.** As written it asked whether speech
survives a backgrounded tab — the wrong subsystem. Speech synthesis is not throttled; the autoplay
timer that *triggers* it is. A hidden opener tab can drop to roughly one tick per minute, so the
step never advances and nothing is ever spoken. Driving the tick from the visible PiP document
fixes both at once, and turns what looked like a feature-splitting risk into two requirements.

One assumption now carries the feature: **a visible PiP window is not throttled while its opener is
hidden.** That is recorded under Assumptions and as T005, to be prototyped before Phase 3 is
committed to. It is the single thing most likely to invalidate the design.

### Status

Clarified. No open questions remain. Ready for `/speckit-plan`, whose first job is T005.
