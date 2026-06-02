# Handoff: Unified Authentication Dialog

A Spec Kit-ready feature package to redesign the AOE4 Guides login/register/reset flow into a single in-context dialog. Built from the real repo source (`Header.vue`, `store/index.js`, `views/account/*`, `firebase/index.js`) and the approved interactive mock.

**Approved direction**: `link` switcher · `plain` voice · dialog-over-context · email/password only (no new providers). Three modes: **login / register / reset**.

## What's in this folder

| File | Spec Kit phase | What it is |
|---|---|---|
| `spec.md` | `/speckit-specify` | Feature spec — 4 prioritized, independently-testable user stories (US1 MVP dialog, US2 validation, US3 entry points, US4 reset mode), FRs, success criteria |
| `plan.md` | `/speckit-plan` | Implementation plan — tech context, **Constitution Check (PASS)**, file-level structure decision |
| `tasks.md` | `/speckit-tasks` | 28 tasks grouped by user story, with `[P]` parallel markers + Conventional Commit prefixes |
| `checklist.md` | `/speckit-checklist` | Pre-merge author self-review (requirements, edge cases, constitution, golden path) |
| `design-notes.md` | — | **The mock→code bridge**: component contract, verbatim copy, field rules, full error map, store slice, header + router edits |

## How to use it with Spec Kit

1. Copy this folder into your repo at `specs/001-unified-auth-dialog/` (renumber to the next free feature number if `001` is taken — your `create-new-feature` script normally assigns this).
2. Create the branch: `001-unified-auth-dialog` (matches the spec/plan headers).
3. These docs are written to the output shape of `/speckit-specify` → `/speckit-plan` → `/speckit-tasks`, so you can either accept them as-is or re-run the commands to regenerate against them.
4. Implement from `tasks.md` (MVP = Phases 1–3). `design-notes.md` makes each task mechanical — copy strings, rules, and the error map are all spelled out.
5. Self-review against `checklist.md` before merge.

## Scope guardrails

- **In**: one `AuthDialog.vue` with **three modes (login / register / reset)**, a small Vuex `ui.authDialog` slice + a `resetPassword` action, a `useAuthErrors.js` map, edits to `Header.vue` + router, retirement of the three duplicate view files (`Login.vue`, `Register.vue`, `ResetPassword.vue`).
- **Out**: Google/Discord/Microsoft sign-in (the layout leaves room; it's a later feature); **completing** a reset from the emailed `oobCode` link — that stays its existing route (`AccountAction.vue`, untouched); any Firestore schema or rules change.
- **No new dependencies.** All UI is Vuetify. Passes all five Constitution principles (see `plan.md`).

## Design reference

Key stills are bundled in `assets/` (so this folder is self-contained):

- `assets/login-dark.png` — login, dark (approved baseline)
- `assets/register-validation.png` — register + inline validation
- `assets/reset-password.png` — in-dialog reset request
- `assets/login-light.png` — light theme

The full interactive mock lives in the project root:
- `Auth Redesign.html` — opens to the approved baseline; Tweaks panel flips theme/mode (login/register/reset)/variant.
- `reference/design-tokens.md` — extracted theme tokens (single source of truth for color/type)

## Suggested commit sequence

```
chore: scaffold unified auth dialog branch + folders        (T001–T002)
feat: add authDialog ui state + open/close actions          (T003)
feat: add firebase auth error → friendly message map        (T004)
feat: add AuthDialog component with login/register modes     (T005–T009)  ← MVP
feat: add validation, error banner, password toggle, loading (T011–T015)
refactor: surface firebase error codes cleanly from store    (T016)
refactor: single header auth CTA + route-driven dialog open  (T017–T018)
feat: redirect authed users off auth routes                  (T019–T020)
feat: add resetPassword action + in-dialog reset mode         (T021–T023)
style: theme/mobile/reduced-motion polish                    (T024–T026)
refactor: remove temp trigger + dead login/register/reset views (T027)
docs: final checklist pass                                   (T028)
```
