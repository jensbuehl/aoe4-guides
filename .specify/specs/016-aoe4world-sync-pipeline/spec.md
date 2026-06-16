# Feature Specification: AOE4World Sync Pipeline Improvement

**Feature Branch**: `016-aoe4world-sync-pipeline`

**Created**: 2026-06-16

**Status**: Draft

**Input**: Improve the "Sync Data with AOE4WORLD" admin pipeline in Admin.vue. Currently it fetches units/buildings/techs/abilities from data.aoe4world.com and matches them against 12 local bundled JSON files, but silently drops unmatched items (only console.warn). The improvement should be a two-phase approach: Phase 1 previews the sync results in the UI (matched count, unmatched local entries), Phase 2 lets the admin resolve mismatches via a simple search dropdown (fuzzy match by name against the fetched aoe4world data), then applies and downloads the updated JSONs. Keep it simple — no server-side changes, stays client-side in Admin.vue.

## Clarifications

### Session 2026-06-16

- Q: If one of the 4 AOE4World source fetches fails, should the entire sync be blocked or only the categories backed by that source? → A: Continue with successful sources — only categories backed by the failed fetch are blocked; others proceed normally.
- Q: Should the UI show progress during the fetch phase? → A: Show per-source status as each fetch resolves (e.g. "units ✓", "buildings ✓", "technologies…", "abilities ✓").

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Preview Sync Results (Priority: P1)

As an admin, after clicking "Sync Data with AOE4WORLD", I want to see a summary of what the sync found before anything is downloaded — how many items matched, and which local entries had no match in the AOE4World data.

**Why this priority**: Without a preview, bad syncs silently produce incomplete JSON files that get committed. This is the core safety improvement.

**Independent Test**: Click "Sync Data with AOE4WORLD", wait for fetch to complete. A results panel appears showing matched counts per category and a list of unmatched local entries. No files are downloaded yet.

**Acceptance Scenarios**:

1. **Given** the admin clicks "Sync Data with AOE4WORLD", **When** each source fetch completes, **Then** its status updates inline (e.g. "units ✓", "buildings…"); once all 4 fetches finish, the full results panel is shown with per-category matched counts and unmatched entries.
2. **Given** one of the four AOE4World API fetches fails, **When** the error occurs, **Then** the panel shows a clear error for every category backed by that source; categories backed by successful fetches remain usable and their "Apply & Download" is unaffected.
3. **Given** all items match, **When** the preview is shown, **Then** the "Apply & Download" action is enabled with no resolution required.

---

### User Story 2 - Resolve Mismatches (Priority: P2)

As an admin, when local entries have no automatic match in the AOE4World data, I want to manually pick the correct AOE4World item from a searchable dropdown and confirm the mapping before downloading.

**Why this priority**: This replaces silent data loss with an explicit resolution step, ensuring the downloaded JSON is complete and correct.

**Independent Test**: Introduce a local JSON entry with a slightly different name/ID to force a mismatch. After preview, a resolution row appears for that entry with a dropdown. Select the correct AOE4World item, confirm, and verify the downloaded JSON contains the resolved data.

**Acceptance Scenarios**:

1. **Given** one or more unmatched local entries exist, **When** the preview is displayed, **Then** each unmatched entry shows a searchable dropdown populated with AOE4World items from the same category.
2. **Given** the admin types in the dropdown, **When** at least 2 characters are entered, **Then** the list filters to fuzzy-match candidates by name.
3. **Given** the admin selects a candidate from the dropdown, **When** the selection is confirmed, **Then** the entry is marked as resolved and the "Apply & Download" action becomes enabled (once all mismatches are resolved or skipped).
4. **Given** the admin chooses to skip a mismatch, **When** they click "Skip", **Then** the entry is excluded from the download and noted as skipped in the summary.

---

### User Story 3 - Apply and Download (Priority: P3)

As an admin, once all mismatches are resolved or skipped, I want to apply the sync and download the updated JSON files — the same end result as today but only after a confirmed, clean preview.

**Why this priority**: The download is the existing behaviour; this story just gates it behind the two-phase flow.

**Independent Test**: Complete phase 1 and 2, then click "Apply & Download". Verify 12 JSON files are downloaded with correct enriched data, including any manually resolved entries.

**Acceptance Scenarios**:

1. **Given** no unresolved mismatches remain, **When** the admin clicks "Apply & Download", **Then** all 12 enriched JSON files are triggered for browser download.
2. **Given** skipped entries exist, **When** files are downloaded, **Then** skipped entries retain their original data (no data loss, no enrichment applied).

---

### Edge Cases

- What happens when AOE4World is unreachable or returns non-200? → Show a fetch error for all categories backed by that source; categories backed by other successful fetches are unaffected and remain downloadable.
- What happens if a category has zero matches (e.g. completely renamed API data)? → Show a warning, allow the admin to skip the whole category or resolve all items.
- What if the admin closes the browser tab mid-resolution? → State is not persisted; starting fresh is acceptable (dev tool used rarely).
- What happens with the Chrome 10-download limit? → Existing comment notes this; the pipeline should retain the current behaviour (downloads fire sequentially) — no change required.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The sync action MUST be split into two phases: a fetch-and-preview phase and an apply-and-download phase; neither phase automatically triggers the other.
- **FR-002**: The preview panel MUST display, per category, the count of matched items and a list of all unmatched local entries (title/id).
- **FR-003**: If an AOE4World source fetch fails (units, buildings, technologies, or abilities), the preview panel MUST display a clear error for every category backed by that source and MUST block the apply phase for those categories only; categories backed by successful fetches MUST remain downloadable independently.
- **FR-004**: Each unmatched local entry MUST have a search dropdown that filters AOE4World candidates from the same category by name (fuzzy, case-insensitive, minimum 2 characters).
- **FR-005**: The admin MUST be able to skip individual unmatched entries, excluding them from enrichment without data loss.
- **FR-006**: The "Apply & Download" action MUST be disabled until all unmatched entries are either resolved or skipped.
- **FR-007**: Resolved entries MUST be enriched with the manually selected AOE4World data (same fields as automatic matches: description, age, id, type, costs, exploreUrl).
- **FR-008**: Skipped entries MUST be written to the downloaded JSON with their original pre-sync data unchanged.
- **FR-009**: All changes MUST remain client-side within Admin.vue; no server-side calls or new routes are introduced.
- **FR-010**: During the fetch phase, the UI MUST display a per-source progress indicator that updates as each of the 4 AOE4World fetches completes (showing source name and success/failure state inline).

### Key Entities

- **SyncCategory**: One of the 12 local JSON targets (e.g. `unitEco`, `techMilitary`). Has a source type (`units`, `buildings`, `technologies`, `abilities`), a local entry list, and a list of matched/unmatched results after fetch.
- **SyncResult**: Per-entry outcome — `matched` (automatic), `resolved` (manually mapped), `skipped`, or `unmatched` (pending resolution).
- **AOE4WorldDataset**: The four raw arrays fetched from aoe4world.com (`units`, `buildings`, `technologies`, `abilities`), held in memory during the session.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: After clicking sync, the admin sees a results preview in under 10 seconds (subject to AOE4World API response time).
- **SC-002**: Zero unmatched local entries are silently dropped — every item is either matched, manually resolved, or explicitly skipped before download.
- **SC-003**: An admin can complete a full sync cycle (fetch → preview → resolve all mismatches → download) in under 5 minutes for a typical update with 0–5 mismatches.
- **SC-004**: The feature introduces no regressions to the existing happy path (all items match → download fires as before).

## Assumptions

- The feature is used exclusively by admins in a browser environment; mobile or offline support is out of scope.
- The 12 local JSON categories and their AOE4World source types (units/buildings/technologies/abilities) do not change as part of this feature.
- Fuzzy matching is a simple client-side substring/case-insensitive filter — no external library required.
- The Chrome 10-simultaneous-download limit is a known limitation and is unchanged by this feature.
- Persisting resolution state across page reloads is out of scope (dev tool, used occasionally).
