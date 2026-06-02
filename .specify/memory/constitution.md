<!--
  Sync Impact Report
  ==================
  Version change:    N/A (first formal ratification) → 1.0.0
  Bump type:         MINOR (new constitution — all sections added)

  Principles added:
    I.   Simplicity First
    II.  Incremental Quality
    III. Consistent UX & Component Reuse
    IV.  Cost-Conscious Infrastructure
    V.   Secure Defaults

  Sections added:
    - Core Principles (5)
    - Tech Stack & Constraints
    - Development Workflow
    - Governance

  Sections removed:  none (first ratification)

  Templates checked:
    - .specify/templates/plan-template.md   ✅ Constitution Check section is generic — compatible
    - .specify/templates/spec-template.md   ✅ No constitution-specific references
    - .specify/templates/tasks-template.md  ✅ No constitution-specific references
    - .specify/templates/commands/          ✅ No command files present

  Deferred TODOs:    none
-->

# AoE4 Guides Constitution

## Core Principles

### I. Simplicity First

Every feature, component, and architectural decision MUST favour the simplest viable solution.
YAGNI (You Aren't Gonna Need It) applies at all times. Abstractions are introduced only when
duplication has appeared at least twice and the pattern is well understood. New dependencies
MUST be justified: what problem does this solve that a native Vue/Vuetify/Firebase primitive
cannot?

**Rationale**: This is a solo hobby project. Complexity accumulates silently and compounds
maintenance cost. Keeping every layer simple preserves the joy of the project.

### II. Incremental Quality

Every commit MUST leave the code in a better state than it found it — even by a small margin.
Code smell identified during development MUST be noted as a TODO comment or tracked item and
addressed within the same feature cycle. Refactors are welcome as dedicated, atomic commits
separate from feature changes. No broken windows: do not add code that is clearly wrong or
unclear just to get something working.

**Rationale**: Sustained quality is achieved through constant small improvements, not periodic
large rewrites. Each commit is an opportunity to learn and practise better patterns — this
aligns directly with the project's learning goal.

### III. Consistent UX & Component Reuse

Vuetify components MUST be used before building custom ones. Custom components MUST follow the
same spacing, colour, and typography conventions as the project's Vuetify theme. Any UI pattern
that appears more than once MUST be extracted into a shared component. Pages are assembled from
components; business logic belongs in composables or services, not in page templates.

**Rationale**: Consistency reduces cognitive load for users and prevents style drift.
Component reuse keeps the bundle lean and makes design changes propagate automatically.

### IV. Cost-Conscious Infrastructure

All backend work MUST default to Firebase/Google Cloud free-tier capabilities first. Use of
paid features requires explicit justification with a rough cost estimate before implementation.
Firebase Functions MUST be stateless and short-lived. Firestore reads/writes MUST be minimised
through client-side caching and disciplined query design. Any Cloud Run service MUST be sized
to the minimum viable instance.

**Rationale**: This is a hobby project with no revenue. Every unnecessary spend is out-of-pocket
cost. Free-tier-first thinking also naturally enforces simpler architectures.

### V. Secure Defaults

Firebase Auth is the single source of truth for identity. Authentication state MUST be
validated server-side in any Firebase Function that accesses user data. Firestore security
rules MUST be reviewed with every schema change. No credentials, API keys, or personal data
MUST ever be committed to source control. Frontend routes that require authentication MUST
redirect unauthenticated users to the login page.

**Rationale**: The small surface area of this project makes comprehensive security achievable
with minimal overhead. Protecting users and the project owner from accidental exposure is
non-negotiable even for a hobby project.

## Tech Stack & Constraints

**Frontend**: Vue 3 + Vuetify 3, hosted on Netlify (free tier).
**Auth**: Firebase Authentication (email/password and/or OAuth providers).
**Database**: Cloud Firestore.
**Backend tasks**: Firebase Functions (Node.js) — preferred for simple triggered or scheduled work.
**API project**: Separate Node.js/TypeScript service on Google Cloud Run — for HTTP-facing or
compute-heavier backend logic.
**CI/CD**: Netlify auto-deploy from `main`; Firebase Functions deployed via Firebase CLI.

The tech stack is intentionally straightforward and was chosen for rapid onboarding and low
operational cost. Changes are open for discussion but MUST be documented before implementation.
Any new service or dependency MUST pass the Cost-Conscious Infrastructure principle check.

## Development Workflow

- Feature work happens in short-lived branches off `main`.
- Each commit SHOULD be atomic and self-describing; commit messages MUST use Conventional
  Commits format: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`, `style:`.
- Before merging, self-review the diff for: unused code, duplicated UI patterns, unextracted
  components, magic numbers, or hardcoded strings that belong in constants or config.
- Small quality improvements (renaming, extracting a composable, tightening a Firestore rule)
  are always welcome as standalone commits without requiring a feature ticket.
- No formal test suite is required, but manual testing of the golden path MUST be done before
  merging any user-facing change.
- The guiding question before every merge: "Is this code simpler and clearer than before?"

## Governance

This constitution supersedes all other informal project practices. Amendments require:
1. A clear rationale for the change.
2. An updated version number following semantic versioning:
   - MAJOR: a principle is removed or fundamentally redefined.
   - MINOR: a new principle or major section is added.
   - PATCH: clarification, wording fix, or non-semantic refinement.
3. The `Last Amended` date updated to the ISO amendment date (YYYY-MM-DD).

All spec, plan, and task documents SHOULD reference the relevant constitution principle when
making decisions that trade off simplicity against capability or cost.

**Version**: 1.0.0 | **Ratified**: 2026-06-02 | **Last Amended**: 2026-06-02
