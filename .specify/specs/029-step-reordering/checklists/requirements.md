# Specification Quality Checklist: Reorder Steps and Notes

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-08-10
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs) — *with one accepted deviation, see Notes*
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

**Reviewed in one pass; no rewrite iterations were needed.** What the review actually
turned up:

**One accepted deviation from "no implementation details".** Two Assumptions describe the
editor's internal structure — that each section's editor owns its working list with nothing
syncing it from above, and that it keeps two parallel lists held aligned by position. Both
are implementation facts and would normally be struck from a spec. They are kept because:

- The first is the single largest risk in the feature and the reason User Story 4 is
  sequenced separately rather than bundled into Stories 1–2. Removing it would hide why
  the story order is what it is.
- The second is the *reason* FR-015 exists. Without it, FR-015 reads as a nicety rather
  than as the thing preventing an author's typing from landing on the wrong step.
- Feature 027 set the house precedent of carrying technical assumptions in this section.

Both are confined to Assumptions; no functional requirement names an internal structure.

**Items left to planning, deliberately — these are design decisions, not gaps:**

- The visual form of the desktop drag handle and where it sits in the row's control
  cluster. Constrained only by SC-008 (nothing new introduced) and FR-004 (the row body
  is not a drag surface).
- Whether the keyboard move actions (FR-009) are the mobile controls surfaced at all
  widths or a separate affordance. Either satisfies the requirement.

**Deliberate non-decisions**, recorded in Assumptions so a later reader does not mistake
them for oversights: no undo stack, no time-order validation, no multi-entry moves, no
path-to-path moves.

**One design fork, raised and settled (2026-08-10).** FR-007 puts persistent move controls
on every mobile step card, which adds permanent chrome to a 390px card list where space is
already tight. The alternatives considered were a reorder *mode* entered from the card's
action row, and long-press drag. **Persistent up/down buttons confirmed by the author.**
Rationale: it is the only option that keeps a move to one press (SC-002) — a mode costs
three, and long-press drag is imprecise at that width and fights the editable text fields.
Planning inherits this as decided, not open.
