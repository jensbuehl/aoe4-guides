# Quickstart: Manual Test Scenarios

## Prerequisites

- Admin account logged in to the app
- Dev server running (`npm run dev`)
- Browser devtools open (Network tab for CDN requests)

---

## Story 1 — Gap Detection with Civ Filter

**Goal**: Verify the gap list appears and the civ filter works.

1. Navigate to `/admin`
2. Scroll to the **Icon Gap Sync** card
3. Click **Scan**
4. Observe: a list of gap items appears with "NEW" and "CIV+" badges
5. Click a civ chip (e.g., "ayyubids")
6. Observe: only rows with `civ = ayyubids` are shown
7. Click **All**
8. Observe: all rows reappear
9. Click a civ with no gaps (if one exists)
10. Observe: "No gaps found" message

**Pass criteria**: SC-001 — scan completes within 15 seconds of clicking Scan.

---

## Story 2 — Category Assignment and JSON Export

**Goal**: Assign a gap item to a category and verify the downloaded JSON is drop-in compatible.

**Setup**: Temporarily remove one known entry from a local JSON (e.g., delete the "Scout" entry from `unitMilitary.json`) and restart the dev server.

1. Click **Scan** — Scout should appear as a "NEW" gap item
2. Verify a category is auto-suggested (should be `unitMilitary`)
3. Click **Download JSONs**
4. Open the downloaded `unitMilitary.json`
5. Verify Scout appears with: `title`, `civ[]`, `age`, `id`, `type`, `description`, `costs`, `exploreUrl`, `imgSrc: ""`
6. Drop the file into `src/composables/builds/icons/json/`
7. Restart dev server — no build errors

**Civ extension test**:
1. Take an existing entry (e.g., "Spearman" in unitMilitary.json) and remove one civ from its `civ[]` array (e.g., remove "AYY")
2. Restart dev server, click **Scan**
3. Spearman should appear as a "CIV+" row for ayyubids
4. Verify category is auto-assigned to `unitMilitary` (no dropdown shown)
5. Click **Download JSONs**
6. Open the downloaded `unitMilitary.json`
7. Verify Spearman's `civ[]` includes "AYY" again; no duplicate Spearman entry exists

**Pass criteria**: SC-004 — downloaded JSON drops in without manual editing and passes the build.

---

## Story 3 — Image Processing and Zip Export

**Goal**: Verify image is fetched, converted to WebP at correct dimensions, and packaged correctly.

**Setup**: Use a known gap item with a real AOE4World CDN image.

1. Assign one new-item gap to a category
2. Verify the image folder chip is shown (auto-resolved or admin input)
3. Click **Process & Download Images**
4. Observe: processing status changes to spinner, then ✓ or ✗ per item
5. A zip file is downloaded (`icon-gap-sync.zip`)
6. Extract the zip — verify folder structure matches `public/assets/pictures/{folder}/{id}.webp`
7. Drop extracted files into `public/assets/pictures/`
8. Check the downloaded JSON's `imgSrc` field — should point to the correct path
9. Load the app — icon renders in the build editor

**Existing icon test** (FR-015):
1. Pick a gap item whose id matches an existing icon (e.g., same unit exists in another civ's folder)
2. Click **Process & Download Images**
3. Verify that item shows "icon exists" status — no CDN fetch in Network tab, not included in zip
4. Verify its JSON entry's `imgSrc` is set to the existing local path

**Civ extension image test**:
1. Pick a civ extension gap item
2. After clicking **Process & Download Images**
3. Verify that item shows "skipped" status — no CDN fetch, not in zip
4. Verify the civ extension JSON entry's `imgSrc` is the same as the existing entry's

**Pass criteria**:
- SC-005: zip extracts cleanly without overwriting any existing file
- SC-006: items with errors show a per-item error badge; zip download still proceeds for successful items
