# Feature Specification: Icon Gap Sync

**Feature Branch**: `017-icon-gap-sync`

**Created**: 2026-06-16

**Status**: Draft

**Input**: User description: "Add a second admin panel feature Icon Gap Sync that identifies AOE4World items missing from local JSON icon files and supports filling those gaps including image download."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Gap Detection with Civilization Filter (Priority: P1)

The admin wants to know which AOE4World units, buildings, and technologies are not yet represented in any of the 12 local JSON icon category files. They can filter the gap list by civilization (e.g., "show me only Ayyubids gaps") to focus on one civ at a time, which is the primary workflow for adding a newly released civilization.

**Why this priority**: Identifying gaps is the prerequisite for all other actions. Without knowing what's missing, nothing else can proceed. Filtering by civ enables the new-civ onboarding use case directly.

**Independent Test**: Admin opens the Icon Gap Sync panel, triggers a scan, and sees a filterable list of items not present in any local JSON. Can be fully tested without downloading anything — just the gap list with civ filter.

**Acceptance Scenarios**:

1. **Given** AOE4World source data is available, **When** the admin triggers a gap scan, **Then** the system shows a list of items (with name, type, age, civ) that have no matching entry in any of the 12 local JSON category files.
2. **Given** a gap list is shown, **When** the admin selects a civ from the filter (e.g., "Ayyubids"), **Then** only gap items belonging to that civilization are displayed.
3. **Given** a civ filter is active, **When** the admin clears the filter, **Then** all gap items across all civs are shown again.
4. **Given** no gaps exist for the selected civ, **When** the admin applies that civ filter, **Then** a clear "No gaps found" message is shown.

---

### User Story 2 — Category Assignment and JSON Export (Priority: P2)

The admin reviews gap items and assigns each one to the correct local JSON category file (e.g., "unitMilitary", "buildingEco"). For items that can be auto-assigned based on their AOE4World type and name, a suggested category is pre-filled. For ambiguous items, the admin picks the target category from a dropdown. Once all assignments are made, the admin downloads the updated JSON files (one per affected category).

**Why this priority**: Without category assignment, new entries cannot be placed into the correct files. JSON export is the core deliverable that closes the data gap.

**Independent Test**: Temporarily introduce a known missing entry, run gap scan, assign it to a category, export the JSON, confirm the new entry appears in the downloaded file with correct fields (title, civ, age, id, type, description, costs, exploreUrl). Image processing is not needed to validate this story.

**Acceptance Scenarios**:

1. **Given** a gap item's AOE4World type maps unambiguously to one category, **When** the gap list is shown, **Then** a suggested target category is pre-filled for that item.
2. **Given** a gap item's category is ambiguous, **When** the admin views that item, **Then** a category dropdown is shown with all 12 options and no pre-selection.
3. **Given** the admin selects a category for a gap item, **When** they confirm the assignment, **Then** the item moves out of the unassigned list into the assigned list under that category.
4. **Given** all gap items in the filtered view are assigned, **When** the admin clicks "Download JSONs", **Then** one updated JSON file per affected category is downloaded, each containing all existing entries plus the newly assigned items with correct fields populated.
5. **Given** a download is triggered, **Then** new entries in the JSON include: title, civ array, age, id, type, description, costs, exploreUrl, and a placeholder imgSrc (empty string until image is processed).
6. **Given** a gap item is a civ extension (matching entry already exists in a local JSON), **When** the admin confirms it, **Then** the downloaded JSON for that category shows the existing entry with the new civ appended to its `civ` array — no duplicate entry is created and the existing imgSrc is unchanged.

---

### User Story 3 — Image Processing and Zip Export (Priority: P3)

For each assigned gap item, the admin triggers image processing: the system fetches the item's icon from the AOE4World image CDN, converts it to WebP format at 80% quality, scales it to match the dimensions of existing local icons, and packages all processed images into a single zip download. The zip folder structure mirrors the local icon directory. If the correct subfolder for an item's images cannot be determined automatically, the admin is prompted to enter it.

**Why this priority**: Images are needed for the icons to render in the app, but the data pipeline (P1+P2) delivers immediate value without them. Image processing is a separate, more complex step.

**Independent Test**: Assign one known gap item (e.g., an Ayyubids unit), trigger image processing for that item only, confirm a zip is downloaded containing a single WebP file at correct dimensions, confirm the JSON entry's imgSrc field is set to the expected path.

**Acceptance Scenarios**:

1. **Given** a gap item is assigned to a category, **When** the admin triggers image download for that item, **Then** the system fetches the icon from the AOE4World CDN using the pattern `{type}/{civ}/{id}.png`.
2. **Given** an icon is fetched, **When** it is processed, **Then** the output is WebP format at 80% quality, scaled to match the pixel dimensions of existing icons in the same category's image folder.
3. **Given** the target image subfolder can be inferred from existing entries in the same category, **When** the zip is built, **Then** the image is placed at the correct path within the zip.
4. **Given** the target image subfolder cannot be inferred, **When** the admin reviews the item, **Then** a text input is shown pre-filled with a best-guess path, and the admin can confirm or edit it before the image is included in the zip.
5. **Given** all assigned items have been processed, **When** the admin clicks "Download Images Zip", **Then** a single zip file is downloaded containing all processed images in their correct folder paths, ready to be extracted directly into the local icon directory.
6. **Given** the zip is downloaded, **Then** each corresponding JSON entry's imgSrc field is updated to the relative path of the processed image.
7. **Given** a CDN image fetch fails for an item, **When** the zip is built, **Then** that item is flagged as "image unavailable" and excluded from the zip, but does not block other items from being processed.
8. **Given** an icon file already exists in the resolved local folder for a gap item, **When** image processing runs, **Then** that item is marked "icon exists" and excluded from the zip download; its JSON entry retains the existing imgSrc path and no CDN fetch is attempted.
9. **Given** a gap item is a civ extension, **When** image processing runs, **Then** no image is fetched or included in the zip (the shared icon already covers all civs); only the JSON civ array update is exported.

---

### Edge Cases

- What happens when the AOE4World sync pipeline (feature 016) has not been run yet and source data is not loaded? → The Icon Gap Sync panel triggers its own data fetch.
- What happens when an item exists in multiple civs with the same id? → Gap detection deduplicates by item id; the civ filter then shows which civs are affected.
- What happens when a CDN image URL returns 404 or a network error? → The item is flagged as "image unavailable"; the rest of processing continues.
- What happens when the admin tries to assign an item that is already present in a local JSON via a different field match? → That item would not appear in the gap list at all (gap detection uses the same matching logic as the sync pipeline).
- What happens when an icon file already exists locally for a gap item? → The image is skipped from CDN fetch and zip packaging (FR-015); the JSON entry preserves the existing imgSrc and is still exported.
- What happens when the same unit (e.g., Villager) exists in one local JSON for some civs and the new civ is being added? → Gap detection classifies this as a **civ extension**; the JSON export appends the civ to the existing entry instead of creating a duplicate; no image download is triggered.
- What happens when the same item appears in two different local JSON categories (ambiguous category)? → Both entries are candidates; the admin is shown which category already holds the item and chooses whether to update that entry or a different one.
- What happens when no AOE4World source data is loaded (first-ever use)? → A "Fetch AOE4World data first" prompt is shown with a button to load it.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST identify two kinds of gaps: (a) **new items** — AOE4World items with no matching entry in any local JSON category file; (b) **civ extensions** — AOE4World items that have a matching entry in a local JSON file but where the item's civilization is not present in that entry's `civ` array. Both kinds are surfaced in the gap list; the kind must be visually distinguishable. Each GapItem represents exactly one (item, civilization) pair — if an item is missing for three civs, it appears as three separate rows.
- **FR-002**: The system MUST derive the list of available civilizations from the AOE4World source data and present them as a filter; no hardcoded civ list.
- **FR-003**: The admin MUST be able to filter gap items by civilization, with an "All civs" default view.
- **FR-004**: The system MUST suggest a target category for each gap item where the AOE4World type (unit/building/technology) maps unambiguously to one category.
- **FR-005**: For gap items where the category cannot be auto-determined, the admin MUST be able to pick a target category from a dropdown of all 12 options before the item can be exported.
- **FR-006**: For **new items** (no matching local entry), the system MUST generate a new JSON entry containing: title (from AOE4World name), civ (array), age, id, type, description, costs, exploreUrl, and imgSrc (empty until image is processed). For **civ extensions** (matching entry exists but civ is missing), the system MUST update the existing entry by appending the new civilization to its `civ` array — no new entry is created and the existing imgSrc is preserved unchanged.
- **FR-007**: The admin MUST be able to download one JSON file per affected category as soon as items are assigned, without requiring image processing to be completed first. New item entries will have an empty imgSrc until P3 is run.
- **FR-008**: The system MUST fetch icon images from the AOE4World CDN using the pattern `https://data.aoe4world.com/images/{type}/{civ}/{id}.png`, using the first available civ for the item.
- **FR-009**: The system MUST convert fetched images to WebP format at 80% quality and scale them to **48 × 48 px**.
- **FR-010**: The system MUST package all processed images into a single downloadable zip file with a folder structure that mirrors `src/composables/builds/icons/`.
- **FR-011**: The system MUST resolve the target image subfolder using the defined `{assetType}_{civOrGroup}` mapping table. When a match is found the path is set automatically; when no match is found the admin MUST be shown a text input pre-filled with `{assetType}_{primaryCiv}` as a best-guess, which they can confirm or correct before the image is included in the zip.
- **FR-012**: Each JSON entry's imgSrc field MUST be updated to the relative icon path once an image is successfully processed.
- **FR-013**: Image fetch failures MUST be surfaced per item with a clear status indicator; they MUST NOT block the download of successfully processed images.
- **FR-014**: The feature MUST appear as a separate card on the existing Admin page, below the Sync Data pipeline card.
- **FR-015**: Before fetching a CDN image for a gap item, the system MUST skip image download if either: (a) an icon file already exists in the resolved target folder matching the item's id, or (b) the gap item is a **civ extension** (its existing local entry already has a valid imgSrc). Only genuinely new items with no existing local icon are fetched, converted, and included in the zip. Skipped items retain their existing imgSrc in the JSON export.

### Key Entities

- **GapItem**: A single (AOE4World item, civilization) pair representing one gap row. Fields: id, name, type, age, civ (single string — the specific missing civilization), description, costs, baseId, exploreUrl, kind (`new` | `civ-extension`). One AOE4World item missing for N civs produces N GapItems. The `kind` field drives whether a new JSON entry is created (`new`) or an existing entry's `civ` array is updated (`civ-extension`).
- **CategoryAssignment**: A GapItem paired with the admin-selected (or auto-suggested) target local JSON category key.
- **ProcessedImage**: A WebP-converted, dimension-matched icon image ready for inclusion in the zip, with its resolved zip path.
- **ImageFolderHint**: The resolved or admin-provided subfolder path within `src/composables/builds/icons/` where an item's image file belongs.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The admin can identify all gap items for a specific civilization within 15 seconds of triggering the scan.
- **SC-002**: 100% of unambiguous gap items (type maps to exactly one category) receive an auto-suggested category without admin input.
- **SC-003**: The admin can assign, process, and download all assets for a new 10-unit civilization in under 10 minutes.
- **SC-004**: Downloaded JSON files can be dropped directly into the project without manual editing and pass the build without errors.
- **SC-005**: Downloaded zip files can be extracted directly into `src/composables/builds/icons/` without path conflicts with existing images, because items whose icons already exist locally are excluded from the zip entirely.
- **SC-006**: Image fetch failures are surfaced per item and do not prevent downloading the rest of the processed assets.

## Clarifications

### Session 2026-06-16

- Q: How are civ extension GapItems displayed in the "All civs" view? → A: One row per missing-civ pair (e.g., separate "Villager · ayyubids" and "Villager · jin" rows, not one combined row).
- Q: What is the "many civs" threshold for image folder resolution (civ-specific vs functional group)? → A: 4 or more civs → use functional group folder; 1–3 civs → use `{assetType}_{primaryCiv}` civ-specific folder.
- Q: Can the admin download updated JSONs (P2) before image processing (P3) is complete? → A: Yes, fully independent. JSON download is available immediately after category assignment; imgSrc is left empty for new items until images are processed separately.

## Assumptions

- AOE4World source data (units, buildings, technologies) is either already loaded by the existing sync pipeline or can be fetched by this feature independently using the same endpoints.
- The AOE4World image CDN at `https://data.aoe4world.com/images/{type}/{civ}/{id}.png` is publicly accessible without authentication.
- All icon images are processed at a fixed **48 × 48 px** output size. This matches the existing icon convention and is hardcoded — no runtime dimension discovery is performed.
- The "first civ" heuristic for image URL construction (using the first entry in a gap item's civs array) is acceptable; if that image 404s, the admin is notified.
- JSZip is an acceptable new client-side dependency for zip packaging.
- The feature operates entirely client-side; no server-side processing, no Firebase writes.
- The existing 12-category structure covers all AOE4World item types; no new categories need to be created as part of this feature.
- Auto-category suggestion uses a simple type-based heuristic: `unit` → military/eco/religious/hero bucket via secondary signals (name keywords); `building` → building categories; `technology` → tech categories. Ambiguous cases always fall back to the admin dropdown.
- The image asset folder for a new gap item can be resolved deterministically using the following mapping, derived from the existing `/assets/pictures/` folder structure. The rule is `{assetType}_{civOrGroup}` where `assetType` and `civOrGroup` are looked up in the tables below. If an item is civ-specific (few civs), the civ folder takes priority; if it is a shared unit type (many civs), the functional group folder is used instead.

**Asset type prefix** (from AOE4World `type` field):

| AOE4World type | Folder prefix |
|---|---|
| `unit` | `unit_` |
| `building` (non-landmark) | `building_` |
| `building` (landmark category) | `landmark_` |
| `technology` | `technology_` |
| `ability` | `ability_` |

**Civ-specific folders** (suffix = AOE4World civ slug):

| AOE4World civ slug | Folder suffix |
|---|---|
| `abbasid` | `abbasid` |
| `ayyubids` | `ayyubids` |
| `byzantines` | `byzantines` |
| `chinese` | `chinese` |
| `delhi` | `delhi` |
| `english` | `english` |
| `french` | `french` |
| `golden_horde` | `golden_horde` |
| `hre` | `hre` |
| `japanese` | `japanese` |
| `jeanne` | `jeanne` |
| `jin` | `jin` |
| `lancaster` | `lancaster` |
| `macedonian` | `macedonian` |
| `malians` | `malians` |
| `mongols` | `mongols` |
| `ottomans` | `ottomans` |
| `rus` | `rus` |
| `sengoku` | `sengoku` |
| `templar` | `templar` |
| `tughluq` | `tughluq` |
| `zhuxi` | `zhuxi` |
| `dragon` | `dragon` |

**Functional/shared folders** (used when item spans many civs):

| Functional group | Folder |
|---|---|
| Cavalry units | `unit_cavalry` |
| Infantry units | `unit_infantry` |
| Siege units | `unit_siege` |
| Naval/ship units | `unit_ship` |
| Worker/villager units | `unit_worker` |
| Religious units | `unit_religious` |
| Economy buildings | `building_economy` |
| Military buildings | `building_military` |
| Defensive structures | `building_defensive` |
| Religious buildings | `building_religious` |
| Technology buildings | `building_technology` |
| Economy technologies | `technology_economy` |
| Military technologies | `technology_military` |
| Defensive technologies | `technology_defensive` |
| Naval technologies | `technology_naval` |
| Religious technologies | `technology_religious` |
| Unit upgrade technologies | `technology_units` |

**Resolution algorithm**: (1) If item has 1–3 civs → use `{assetType}_{primaryCiv}`. (2) If item has 4 or more civs → match against functional group by name/type keywords. (3) If no match is found in either step → show admin UI input pre-filled with `{assetType}_{primaryCiv}` as best guess.
