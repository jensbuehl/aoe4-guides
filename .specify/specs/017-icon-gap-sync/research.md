# Research: Icon Gap Sync

## AOE4World API Item Shape

**Decision**: Each item in `data.data` from `/units/all.json`, `/buildings/all.json`, `/technologies/all.json`, and `/abilities/all.json` represents a single (item, civ) pair and carries:

```js
{
  id: "villager-1",          // shared across civs for the same item
  baseId: "villager",        // base id without age suffix (used in exploreUrl)
  name: "Villager",
  type: "unit",              // "unit" | "building" | "technology" | "ability"
  age: 1,                    // 1–4
  civilization: "english",   // civ slug for THIS particular entry
  civilizations: [...],      // may be present — all civs that have this item
  description: "...",
  costs: { food, wood, stone, gold, total, popcap, time },
}
```

**Rationale**: The existing `getCategorySourceItems` deduplicates by `id` before autocomplete, confirming that the same item appears once per civ with identical `id`. The gap scan must NOT deduplicate — it iterates per-civ entries to detect civ-level gaps.

**Alternatives considered**: A dedicated `/items/all.json` with one entry per item (with civs[]). Does not exist; per-civ is the only endpoint.

---

## Civ Slug → Local ShortName Mapping

**Decision**: A hardcoded `CIV_SLUG_MAP` constant in Admin.vue, derived from the existing `civDefaultProvider.js`:

| AOE4World slug | Local code | | AOE4World slug | Local code |
|---|---|---|---|---|
| `abbasid` | ABB | | `malians` | MAL |
| `ayyubids` | AYY | | `mongols` | MON |
| `byzantines` | BYZ | | `dragon` | DRA |
| `chinese` | CHI | | `ottomans` | OTT |
| `delhi` | DEL | | `rus` | RUS |
| `english` | ENG | | `sengoku` | SEN |
| `french` | FRE | | `tughluq` | TUG |
| `golden_horde` | GOH | | `zhuxi` | ZXL |
| `hre` | HRE | | `lancaster` | HOL |
| `japanese` | JAP | | `templar` | KTE |
| `jin` | JIN | | `macedonian` | MAC |
| `jeanne` | JDA | | | |

**Rationale**: civDefaultProvider.js already has `shortName` for all civs; this is a direct copy of that mapping in slug form. No dynamic lookup needed — the civ set is stable for a given game version.

**Alternatives considered**: Derive at runtime from civDefaultProvider. Adds complexity; the slugs are stable and known upfront.

---

## Browser WebP Support via Canvas

**Decision**: Use `canvas.toBlob('image/webp', 0.8)`.

**Rationale**: All target browsers (Chrome 32+, Firefox 96+, Safari 14+, Edge 18+) support encoding to WebP via `canvas.toBlob`. This is the only client-side path to WebP conversion without a library. Quality `0.8` matches the spec's 80% requirement.

**Alternatives considered**: Using a WebP encoder library (webp-wasm). Adds ~200 KB+ to bundle and is unnecessary given native browser support.

---

## JSZip

**Decision**: Use JSZip v3.x (`npm install jszip`).

**Rationale**: No native browser API for creating a zip file. JSZip is the standard, minimal (~100 KB), widely used solution. Accepts `Blob` objects directly: `zip.file('path/file.webp', blob)`.

**Usage pattern**:
```js
import JSZip from 'jszip'
const zip = new JSZip()
zip.file('unit_cavalry/new-unit.webp', blob)
const zipBlob = await zip.generateAsync({ type: 'blob' })
```

**Alternatives considered**: `fflate` (smaller, faster). JSZip preferred for familiarity and simpler API for this use case.

---

## Icon Target Dimensions

**Decision**: Hardcode **48 × 48 px** for all processed images. No runtime dimension discovery.

**Rationale**: All existing icons are 48×48 px. Hardcoding eliminates an async load-and-read step, removes a potential error path, and keeps the processing pipeline simpler (constitution I: Simplicity First).

**Alternatives considered**: Discover at runtime by loading one existing icon's `naturalWidth × naturalHeight`. Rejected — adds async complexity and a failure mode with no benefit given the uniform 48×48 convention.

---

## Image Zip Path vs Public Folder

**Decision**: Zip paths mirror `public/assets/pictures/`, e.g., `unit_cavalry/new-unit.webp`. When extracted, the user drops files into `public/assets/pictures/`.

**Rationale**: The imgSrc values in JSON files are paths like `/assets/pictures/unit_cavalry/scout.webp`, served from `public/`. The zip structure should match what the user needs to extract to complete the workflow (SC-005).

---

## Client-Side Existing Icon Check (FR-015)

**Decision**: Use `findLocalIconByName()` (already in Admin.vue) to check if an icon exists for a new-item gap. If it returns a path, reuse it and skip CDN fetch.

**Rationale**: No filesystem access from the browser. All known icons are encoded in the imported JSON files (CATEGORY_CONFIG.data). If any existing entry has `imgSrc` for the same item id/name, the icon file exists locally under that path.
