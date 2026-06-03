# Handoff: Home Sidebar Rework (`004-home-sidebar`)

**Feature 1 of 4** in the Home redesign split (sidebar → civ picker → build tabs → hero). Full Spec Kit set: spec + plan + tasks, with screenshots.

## What it does
- **Slims the News/Season card** to: season tag, title, one-line blurb, and a quiet **Donate · Discord · Contribute** link row (reusing the real Ko-fi / Discord / `/github` destinations already in `News.vue`). Removes the store-button cluster, embedded video, beta alert, and appeal paragraphs.
- **Top Contributors**: one ranked card that renders **all** contributors from the snapshot (not capped at 4 — verified at 8), names in theme primary (gold/navy).
- **Keeps** Video Guides and the conditional Register / Verify-email prompts.
- Presentation only — no data, schema, or read/write changes.

## Files
| File | State |
|---|---|
| `spec.md` | ✅ 3 user stories, FRs, success criteria |
| `plan.md` | ✅ Constitution check + **shared Home spacing/sizing system** |
| `tasks.md` | ✅ 17 tasks by story, Conventional Commits |
| `assets/sidebar-dark.png`, `assets/sidebar-light.png` | ✅ Focused sidebar stills |
| `../_home-wireframe/home-wireframe.html` | ✅ **Runnable** self-contained wireframe (shared by all 4 features) — open it directly, no server/assets needed |

## Reference wireframe
`specs/_home-wireframe/home-wireframe.html` is the **interactive** mock as a single portable file (flags inlined) — double-click to open, toggle the Tweaks panel to compare lane layout, civ-picker density, hero on/off, and dark/light. It's shared by all four Home features (004–007) so it isn't duplicated per folder.

## Touch points (grounded in real source)
- `src/components/notifications/News.vue` — slim down (Donate/Discord/Contribute already exist there as text buttons).
- `src/views/Home.vue` — sidebar `v-col`; remove the contributor count cap; reuse existing avatar/chip pattern.
- Optional `src/components/home/TopContributors.vue` — extract the duplicated xs/sm/md contributor blocks (Principle II win).

## Use
1. Copy to `specs/004-home-sidebar/` (renumber if needed); branch `004-home-sidebar`.
2. Implement from `tasks.md`; the spacing system is in `plan.md`.

Shared visual reference for all four features: `Home Redesign.html` (project root), or the portable single-file copy at `specs/_home-wireframe/home-wireframe.html` (bundled into this handoff).
