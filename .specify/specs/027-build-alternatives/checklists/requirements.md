# Specification Quality Checklist: Build Order Alternatives

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-08-08
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

**Re-validated 2026-08-08 after planning.** The spec grew during `/speckit-plan`:
SC-007 (builds that lose their economy chart today regain it) and FR-019…FR-021
(notes as a first-class item kind), plus US1 scenarios 1a/1b, two edge cases and
one assumption. All 16 items re-checked against the larger spec and still pass.
Both additions came from reading the code rather than from re-reading the spec,
and both are marked in-place as decided during planning — see research
[R-3](../research.md#r-3--the-economy-chart-already-refuses-builds-that-contain-alternatives)
and [R-9](../research.md#r-9--note-in-fr-007s-menu-has-no-writer-today).

The spec was harvested from a completed design exploration, so it arrives with
decisions already made. Two things a reviewer should know about how it was scored:

- **Design vocabulary in the requirements is intentional.** FR-012, FR-013 and
  FR-016 name a colour role, an icon pair and rail/target dimensions. These are
  the design contract, not implementation choices — the reasoning is recorded in
  `design-input.md` (gold denotes age/timing, so alternatives take the brand's
  other colour). They were kept rather than abstracted away, because abstracting
  them would discard the decision.
- **Framework naming is confined to Assumptions and the Design Reference.** The
  requirements themselves state outcomes; the Assumptions section names the
  component library because reusing it is a project constitution rule (Principle
  I & III) and therefore a real constraint on the work, not a leak.
- **SC-006** was reworded during validation to drop a framework name while
  keeping its meaning ("built entirely from the design system already in use").

Success criteria are verifiable but mostly qualitative. That fits a feature whose
value is comprehension rather than throughput; if quantitative targets are wanted
(e.g. time to choose a path), add them during `/speckit-clarify`.

Also corrected during validation: the design-reference paths. The spec pointed at
`Branch Annotations.html` "at the project root" and at `reference/design-tokens.md`,
neither of which exists in the repo, plus three sibling design files by bare
filename. Paths now point at the real locations under each feature's `assets/`,
and the spec states plainly that the Branch Annotations HTML is not checked in —
the seven captures are the authoritative record.

Three questions are deliberately parked as out-of-scope defaults rather than
[NEEDS CLARIFICATION] markers — overlay round-tripping, civ filtering from path
descriptions, and drag-and-drop reordering. Each has a stated v1 behaviour in
Assumptions, so none blocks planning. A fourth was parked and has since been
decided by the author: notes are in scope (FR-019…FR-021).
