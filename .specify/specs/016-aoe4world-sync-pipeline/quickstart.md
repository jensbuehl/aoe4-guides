# Quickstart: AOE4World Sync Pipeline (Updated Flow)

## How to run a sync

1. Log in as admin and navigate to `/admin`.
2. Click **"Sync Data with AOE4WORLD"**.
3. A fetch progress row appears — watch each source (units, buildings, technologies, abilities) flip to ✓ or ✗ as the fetches complete.
4. The **Preview** panel opens automatically once all fetches settle:
   - Each of the 12 categories shows a matched count and any unmatched entries.
   - Categories backed by a failed fetch are shown with an error badge and excluded from download.
5. For each unmatched entry, use the **search dropdown** to pick the correct AOE4World item (type ≥ 2 chars to filter), or click **Skip** to exclude it from enrichment.
6. Once all mismatches are resolved or skipped, **"Apply & Download"** becomes active.
7. Click it — the browser downloads up to 12 JSON files (Chrome may ask to allow multiple downloads).
8. Replace the corresponding files in `src/composables/builds/icons/json/` with the downloaded versions and commit.

## Skipped entries

Skipped entries are written to the downloaded JSON with their **original pre-sync data unchanged** — no data is lost. You can re-run the sync at any time to try resolving them again.

## Partial failures

If one source fetch fails (e.g. the `units` endpoint is down), the 4 unit categories are flagged as errored and excluded from the download. The remaining 8 categories that loaded successfully can still be downloaded normally.

## Resetting

After a download completes, the UI returns to the idle state. Click the button again to start a fresh sync.
