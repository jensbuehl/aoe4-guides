# Specification Quality Checklist: Community Funding Transparency

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-08-13
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
- [x] Scope is clearly bounded — non-goals stated as binding requirements (FR-031 – FR-033)
- [x] Dependencies and assumptions identified

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria
- [x] User scenarios cover primary flows
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] No implementation details leak into specification

## Notes

- All items pass. Spec is ready for `/speckit-plan`.
- **Resolved (Q1 / FR-023, FR-024)**: the running cost is a hard-wired deploy-time value; coverage
  and supporter count are *derived* from the supporter marks rather than maintained separately.
  This removed the staleness requirement (old FR-008), an edge case, and the maintainer's recurring
  figure-update step, and shrank User Story 2 to marking accounts.
- **Amended after the real supporter data arrived**: all seventeen existing contributions are
  **one-off tips**, not recurring memberships. Against a monthly goal they would have counted zero,
  producing a €0 coverage line under a wall of seventeen names. The goal is therefore stated **per
  calendar year** (FR-001, FR-004), where a past tip genuinely counts towards the year it was given
  in. This deleted the plan/arrangement model and two of the three constants: each entry now records
  the net amount actually received (FR-001c), and a one-off and a membership are recorded
  identically. Rollover is manual and past supporters move to a permanent thank-you list
  (FR-013b–FR-013d) so the wall only ever grows.
- **Added**: FR-014a — a name may only be published if that contribution was public at the payment
  provider. Someone who tipped privately gave money, not permission to be listed.
- **Corrected after review — per-person amounts (FR-001c, FR-001d, FR-008)**: the design stored an
  `eur` per supporter and required only that it never be *rendered*. That was wrong: the config is
  bundled and delivered to every visitor, so the amounts would have been readable in dev tools
  regardless of what the page drew. The boundary is the bundle, not the template — the same rule
  already applied to anonymous supporters' names, missed one field over. No per-person amount is now
  stored anywhere; `coveredEur` is a single hand-set total and the breakdown stays on Ko-fi.
  Accepted cost: one figure is typed rather than derived, bounded by requiring it to change in the
  same edit as the list (FR-008a). `supporterCount` stays derived, so the count can never disagree
  with the wall. T033a verifies the rule held in the deployed bundle, not just in the source.
- **DESCOPED during implementation — the supporter badge (User Story 4, FR-019 – FR-021d)**: not
  built. The badge needs a mapping from a Ko-fi identity to a site account and nothing provides one;
  even opt-in, the per-supporter friction was judged not worth it. FR-021d's requirement that the
  badge be removable in full without disturbing anything else was exercised for real and held — the
  component, its five call sites and the `uid` field came out cleanly, leaving the funding status,
  the wall and the maintainer routine untouched. **Knock-on**: with no account link, no supporter is
  recognisable by the site, so FR-026 (never show the focus-mode ask to a supporter) is
  unsatisfiable as written; User Story 5 needs that decided before it is built.
- **Added during implementation — small-cell disclosure (FR-001e, FR-001f)**: publishing the total,
  the count and the names together defeats the no-per-person-amounts rule at low n — two named
  supporters beside a €10 total tells each of them what the other gave. Suppressing the count alone
  was not enough, since the count is just the length of the visible list, so below three current-year
  supporters the wall renders as one merged list of everyone who has ever contributed. The money
  stays visible: it is the mechanism, and unlike the count it cannot be derived from anything else.
  One constant, `DISCLOSURE_THRESHOLD`, drives both.
- **Outstanding input, not a blocker**: the yearly cost figure and the covered total are
  placeholders. Two numbers. Needed before launch; not needed to plan or build.
- **Amended after review (FR-003, FR-007)**: the original placement set was footer + About +
  account, which left the home page — by far the most-visited — with the ask only in the footer,
  below everything. Home sidebar added as the primary placement (FR-003, FR-003a), footer demoted
  to fallback (FR-003b). FR-007 was also self-contradictory as written: it forbade more than one
  funding status per page while the footer renders on every page, so About and account already
  violated it. Now stated as one per page with the footer suppressing itself. FR-007a additionally
  requires the pre-existing generic "Donate" controls to be removed rather than left alongside —
  there were three (`Footer.vue:6`, `News.vue:55`, `About.vue:153`), not one.
- **Amended during planning (FR-021c)**: `deleteUser.js` does not delete a user's build orders, so
  a deleted supporter's badge would survive on them until the next monthly pass. Immediate removal
  would require either automation that cannot write to a repository file or the Firestore-backed
  design rejected on read-cost grounds. The lag is now permitted explicitly, matching the lag
  already accepted for lapsed supporters. See plan research R9.
- **Restructured after review**: there is no way to map a payment identity to a site account —
  provider display names do not match site usernames and no lookup exists. Requiring that mapping
  for every supporter would turn each new supporter into a conversation the maintainer must start.
  The mapping is now confined to the badge (User Story 4, P3, opt-in), while the funding status and
  supporters wall derive from a supporter list holding no account reference at all. FR-021d requires
  the badge be removable in full without touching anything else.
- **Carried into planning, not a spec gap**: the supporter link must be readable by *anyone*
  rendering a user's name (FR-021), which a private per-user account token cannot satisfy. Recorded
  in Assumptions so the plan resolves it deliberately.
