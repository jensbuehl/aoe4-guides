# Quickstart: Home Sidebar Rework

**Feature**: 004-home-sidebar | **Date**: 2026-06-03

---

## Prerequisites

- Node.js 18+ installed
- Firebase emulator **not required** — the sidebar reads from the live hourly home snapshot (read-only Firestore)
- `.env` with `VITE_FIREBASE_*` vars (copy from `.env.example` or existing dev env)

## Run the dev server

```bash
npm install      # if needed
npm run dev      # starts Vite dev server, typically http://localhost:5173
```

Open `http://localhost:5173` and navigate to the Home page.

## Manual test checkpoints

### Checkpoint 1 — Season card (US1)

1. Load `/` (Home).
2. Verify sidebar Season card shows:
   - Tag: **Season 13 · Live** (gold / accent color)
   - Title: **Yue Fei's Legacy** (bold heading)
   - One-liner blurb below the title
   - Three text-link buttons: **Donate** (red heart icon), **Discord**, **Contribute**
3. Verify the following are **absent**: store buttons (Steam/MS/Xbox), embedded YouTube iframe, beta alert, long appeal paragraphs, Season 11 banner image.
4. Click **Donate** → opens Ko-fi in a new tab.
5. Click **Discord** → opens Discord invite in a new tab.
6. Click **Contribute** → navigates to `/github` in-app.

### Checkpoint 2 — Top Contributors card (US2)

1. Verify contributors render as a **single bordered card** titled "Top Contributors".
2. Count rows — should match the number returned by the snapshot (currently 4; will be 8 after
   the optional Cloud Function update).
3. Each row shows: rank number, avatar (or gold initials), contributor name in primary color, view count chip, build count chip.
4. Click any contributor row → navigates to Builds page filtered by that author.
5. Verify no layout break at 4 rows (test at 8 with mock data if available).

### Checkpoint 3 — Video Guides + conditional prompts (US3)

1. Verify **YoutubeGuides** card renders with the same bordered style as the other two cards.
2. Sign out → verify `RegisterAd` appears below the Video Guides card.
3. Sign in with an unverified account → verify `EmailVerificationAd` appears instead.
4. Sign in with a verified account → verify neither prompt appears.

### Checkpoint 4 — Themes

1. Toggle to light theme (site settings).
2. Verify contributor names render in **navy** (`#294790`) — not gold.
3. Verify Season tag renders in **light accent** (`#CCAA55`).
4. Verify all three cards retain the subtle border in light mode.

### Checkpoint 5 — Scope guard

1. Verify the **Welcome card** is gone from the sidebar (both logged-out and logged-in states).
2. Run `git diff --name-only` and confirm changes are confined to:
   - `src/components/notifications/News.vue`
   - `src/components/notifications/YoutubeGuides.vue`
   - `src/components/home/TopContributors.vue` (new file)
   - `src/views/Home.vue` (sidebar `v-col` only)

No diffs in the build lists, civ picker, or unrelated components.
