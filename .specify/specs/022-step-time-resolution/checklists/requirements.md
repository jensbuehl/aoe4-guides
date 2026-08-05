# Specification Quality Checklist: Step Time Resolution

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-08-05
**Updated**: 2026-08-05 — after clarification session; all items pass
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs) — **accepted deviation**, see Notes
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders — **partial**, see Notes
- [x] All mandatory sections completed

## Requirement Completeness

- [x] No open questions remain — Q1 and Q2 resolved in the 2026-08-05 clarification session
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Success criteria are technology-agnostic — **accepted deviation**, see Notes
- [x] All acceptance scenarios are defined
- [x] Edge cases are identified
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria
- [x] User scenarios cover primary flows
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] No implementation details leak into specification — **accepted deviation**, see Notes

## Evidence Quality

Added for this feature, because its premise is a bug report.

- [x] Every defect claimed in the Evidence table was **reproduced** against the shipping helper
      before the spec was written, not inferred by reading it
- [x] Each defect names the observable consequence, not just the faulty mechanism
- [x] Each defect has a matching acceptance scenario (US1.1–US1.5) and a success criterion (SC-001)
- [x] The blast radius of each defect was checked against real call sites — D3 was narrowed to
      legacy flat builds after confirming that section gameplans are folded into step descriptions
      rather than passed through as entries
- [x] The clarification answers were checked against the shipping UI before being written up — which
      is how the proposed `~` marker for extrapolation was found to be already in use for
      interpolation, changing the answer to Q2

## Internal Consistency

Checked after the clarification edits, because Q1 and Q2 touched requirements written before them.

- [x] US4.1 ("unchanged to the second") and US4.6 ("interpolated steps gain `~`") no longer
      contradict — US4.1 now names the marker as the single permitted difference
- [x] SC-005 permits the same difference US4.1 does
- [x] SC-005a's "runs past the horizon" fixture exists in SC-003's fixture set
- [x] Scope's in/out lists match the files named in SC-006
- [x] Every FR added during clarification (FR-015a, FR-019–FR-023) has a matching acceptance scenario

## Notes

**Accepted deviation — the spec names files and functions.** Three checklist items are marked pass
despite the spec naming modules (`timingsHelper.js`), functions (`resolveStepTimes`, `getTimings`)
and a shipping artefact (`"alid"`). This is deliberate and follows the precedent set by `020` and
`021`, both of which name the same modules. The reason: this feature's subject *is* an internal
seam. Its primary requirement (FR-002 — one place, and only one place, assigns a step a time) cannot
be stated without naming the seam being created, and its primary risk (Focus mode's autoplay gate)
cannot be bounded without naming the contract that must not move. A version of this spec written
without those names would be less testable, not more stakeholder-friendly.

**Partial — non-technical readability.** The user-facing half (US1–US4, the Evidence table's "why it
matters" column, both Clarification answers) reads without technical background. The requirements
half does not, and reasonably cannot: a reader who is not going to touch the resolver has no
decision to make about it.

**Two consequences accepted rather than resolved**, both recorded in the Clarifications section:
playback drifts across an extrapolated tail and the `~` cannot say by how much; and a timeline reader
who skips the footnote cannot tell a projected age time from an interpolated one. Neither blocks the
feature; both are the deliberate price of the answers given to Q1 and Q2.

**Post-plan update (2026-08-05).** Phase 0 invalidated three spec statements, all now corrected in
place and logged in [plan.md](../plan.md#spec-corrections--applied-2026-08-05):

- NFR-002's "no backfill" → **NFR-002a requires one** (R-1). The most consequential correction: the
  spec as written would have shipped fixes that were correct and invisible.
- FR-016's "provenance replaces `derived`" → **additive** (R-2), plus SC-009 guarding two components
  the spec never knew were consumers.
- FR-015a's implied single call → **Focus mode calls two functions** (R-4, R-5).

This is a checklist item the template does not have and probably should: *were the spec's claims
about existing code verified against that code?* Three of them were not, and all three were wrong in
the same direction — assuming the surrounding system was simpler than it is.

**Ready for `/speckit-tasks`.** No blocking items remain.
