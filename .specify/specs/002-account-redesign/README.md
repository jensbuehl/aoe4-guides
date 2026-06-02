# Handoff: Account Page Redesign & User Avatars

A handoff package for **Claude Code** + **GitHub Spec Kit**. This round delivers the **spec only** — `plan.md` and `tasks.md` are intentionally left for you to generate later with `/speckit-plan` and `/speckit-tasks`.

## What's in this folder

| File | State | Notes |
|---|---|---|
| `spec.md` | ✅ **Filled** | Feature spec — 5 prioritized user stories (US1 avatars = MVP), FRs, key entities, success criteria, open clarifications |
| `assets/` | ✅ Bundled | Design reference stills (account page + avatar picker) |
| `plan.md` | ⏳ Later | Generate with `/speckit-plan` once the open clarifications are resolved |
| `tasks.md` | ⏳ Later | Generate with `/speckit-tasks` after the plan |

## How to use it

1. Copy this folder into the repo at `specs/002-account-redesign/` (renumber if `002` is taken — your `create-new-feature` script normally assigns the number).
2. Create branch `002-account-redesign`.
3. **Resolve the two open clarifications** at the top of `spec.md` first:
   - curated crests + initials only, or also custom upload in v1?
   - where do avatars render across the app (header/account only, or also build cards/comments)?
4. Run `/speckit-plan`, then `/speckit-tasks`.

## Designs

- **Interactive prototype**: `Account Redesign.html` (project root) — click the avatar to open the picker. The **Upload** tab runs a real client-side crop + resize to a 256px WebP, demonstrating the cost-saving step described in `spec.md` FR-005. Tweaks panel toggles theme, verified state, and default avatar source.
- **Stills**: `assets/account-page.png`, `assets/avatar-picker.png` (bundled so this folder is self-contained).
- The civilization-crest images already ship in the repo at `src/assets/pictures_original_size/civilization_flag/` — the curated avatar path needs no new assets.

## Scope at a glance

- **In**: account-page layout redesign (profile hero, read-only identity rows, grouped sections, danger zone), password change with confirmation, contextual verify-email banner with **corrected copy** (no notifications claim), and **avatars** (initials + curated AOE4 crests; custom upload pending the clarification). Display name is shown **read-only** (denormalized into build docs — editing deferred).
- **Reuses**: existing display-name update, change-password, verify-email, and delete-account flows — this is primarily UI/UX + avatar persistence, not new auth logic.
- **Constitution fit**: Vuetify-only, existing theme tokens, no new dependency; curated-first keeps storage/cost/moderation at zero (Principles I, III, IV).

> Note: the verification copy in the old page promised "build order notifications" — a feature that does not exist yet. The redesign and FR-010 explicitly require neutral, accurate copy. Notifications can be a separate future feature.
