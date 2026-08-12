# Specification Quality Checklist: Prerendered SEO Head Tags for Build Pages

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-08-11
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

**Validation**: one pass over the written spec. The requirements were drafted in
technology-neutral form rather than rewritten into it, so there is no earlier draft to diff against.
Two success criteria did fail the technology-agnostic item on review and were corrected:

- SC-005 named the build command; now "a local production build".
- SC-008 named the database product; now "added database reads".

The implementation detail supplied in the feature request — the specific file paths, the traversal
helper names, the environment variable and flag names — was deliberately **not** carried into the
requirements. It belongs in `plan.md`. What the requirements keep is the constraint each detail
exists to satisfy, which is what makes them testable: FR-002 keeps "the built shell, not the source
shell" without naming either file; FR-012 keeps "visit every path, never iterate a section's item
list directly" without naming the helper.

**Deliberate deviations from the checklist, accepted**:

- *"Written for non-technical stakeholders"* passes only in the weak sense. This feature has no
  end-user-facing surface — its users are crawlers, unfurlers and the maintainer — so the scenarios are
  written for someone who understands what a link preview and a search result are, not for someone who
  understands the build pipeline. That is the right audience for this spec; a strictly non-technical
  reading is not available for infrastructure work.
- The three framing blockquotes above the first user story carry implementation reasoning (why the body
  is left empty, why no snapshot function). They are retained because the *decisions they record* are
  the expensive part of this spec — both were arrived at by rejecting a more elaborate design, and a
  reader who does not know why will rebuild the elaborate one.

**Open risk carried into planning, not a spec defect**:

- The load-bearing assumption in Assumptions — that the host serves `builds/<id>.html` for
  `/builds/<id>`, and that a real file beats the existing catch-all rewrite — is unverified. It is
  stated as the first thing to test, with a one-file experiment, before any generator is written. If it
  is false, FR-001 and FR-024 need re-specifying. Flagged here so `/speckit-plan` treats it as research
  task one rather than an accepted premise.

**Amendment (same day, after review)** — the first version treated icon-to-text conversion as a
supporting detail of the structured-data story. That was wrong, and the author said so: a build order is
written in icons, so conversion quality *is* what any non-JavaScript reader receives. Changes:

- US4 raised P2 → P1 and rewritten around step-text quality rather than around structured data.
- FR-013 expanded into FR-013a–g covering unresolved icons, spacing, pluralisation, the irregular-plural
  set, a check guarding it, indexed lookup and origin-independent path normalisation.
- Scope guard amended. It previously claimed nothing about the running application changes; the
  converter is shared with focus mode's text-to-speech, so improving it changes what focus mode says.
  That is now stated as a deliberate, intended exception rather than left as a contradiction.
- SC-009a/b and four edge cases added; two new exclusions recorded (curating the vocabulary,
  interpreting icon pairs as compounds).

Four claims in those requirements were verified against the running code rather than assumed, and the
measurements are quoted inline in the FRs so a planner does not have to re-derive them: the `undefined`
defect reproduces; naive `+s` pluralisation is wrong for a bounded and enumerable set; lookup costs
~0.02 ms per image; path normalisation strips exactly two hardcoded origins.

**Amendment 2 (during planning)** — the owner rejected a per-deploy database cost. Not on the
arithmetic (it was $0.02–0.10/month) but on principle: deploys fire on every push to `main`, and knowing
that shipping an ordinary feature costs money is itself a cost in a project paid for out of pocket. That
is a legitimate constraint and it is theirs to set. Changes:

- New requirement group "Where the build data comes from": FR-025–FR-029. A deploy must perform **zero**
  database reads, reading a snapshot committed to the repository instead; credentials must exist only
  where the refresh runs.
- FR-019's skip condition changed from "credentials absent" to "build data absent" — the generator no
  longer has credentials to be missing.
- Old FR-026 (title flash) renumbered to FR-030. FR-001–FR-024 unchanged.
- SC-008 rewritten from a cost target to a verifiable property: deploy with no credentials present
  anywhere and observe a complete set of pages.
- The exclusion list previously rejected "any trigger, snapshot function or intermediate storage" on
  cost grounds, which after this change contradicted FR-025. Rewritten to reject *hosted services* in
  the refresh path while permitting the committed file — the distinction that actually matters.

Three designs were tried and rejected reaching this, each recorded in research R11 with the reason:
a write-triggered function feeding object storage; skipping generation on pushes (fails — Netlify
deploys are atomic replacements, so the pages would vanish until the next scheduled build); and a
Netlify build cache holding the HTML (fails — pages embed hashed asset filenames that go stale).

Snapshot size was measured rather than estimated: ~1,042 bytes per build across a sample of real
published builds, ~4.0 MB for 4,000.

**Cross-reference check after amendment**: FR-001–FR-030 present with no gaps or duplicates; every
FR referenced from plan, research, data-model, quickstart and the three contracts resolves to an
existing requirement; no document still describes a per-deploy read.

**Status**: All items pass. Spec and plan are consistent.
