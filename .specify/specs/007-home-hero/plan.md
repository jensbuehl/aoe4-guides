# Implementation Plan: Home Featured Hero Build

**Branch**: `007-home-hero` | **Date**: 2026-06-04 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `.specify/specs/007-home-hero/spec.md`

## Summary

Add a featured "hero" build card at the top of the `BuildLaneTabs` section: the active lane's #1 build displayed with its civ flag as a full-bleed background, a theme-aware diagonal scrim, eyebrow label, title, 2-line description, strategy badge, and meta row. The hero swaps on tab change (reads the same Vuex store lane arrays already loaded by Home.vue) and links to the build's detail. One new component (`HeroBuild.vue`), one file modified per change layer (`BuildLaneTabs.vue`, `base.css`, `updateHomeSnapshot.js`). No new data fetching, no schema changes beyond a 300-char description trim in the snapshot function.

## Technical Context

**Language/Version**: Vue 3 (JavaScript, no TypeScript), Node.js 18 (Firebase Functions)

**Primary Dependencies**: Vuetify 3, Vue Router, Vuex, Firebase Functions v2, Firestore

**Storage**: Cloud Firestore — read-only for this feature (home snapshot pre-generated hourly). One write-path change: description truncated to 300 chars in `updateHomeSnapshot.js`.

**Testing**: Manual golden-path (no formal test suite per constitution). Test: dark + light themes, all three lanes, keyboard nav, empty lane, loading state.

**Target Platform**: Web SPA (Netlify), desktop + mobile (≤720px breakpoint)

**Performance Goals**: No new Firestore reads. Hero data is already in Vuex store on page load.

**Constraints**: Free-tier Firebase; no new npm dependencies; no changes to `BuildListCard`, sidebar, or `Home.vue` setup logic.

**Scale/Scope**: 3 lanes × 10 builds each. Hero always shows `items[0]`; list renders `items.slice(1)` (or filtered by id).

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Simplicity First | ✅ Pass | One new component; hero lives inside BuildLaneTabs (no state lifting). |
| II. Incremental Quality | ✅ Pass | Atomic commits per layer; no broken patterns introduced. |
| III. Consistent UX & Component Reuse | ✅ Pass | Vuetify `v-card`, `v-img`, `v-skeleton-loader`, `v-chip` used for Vuetify-native pieces; custom CSS only for the scrim + hero vars. |
| IV. Cost-Conscious Infrastructure | ✅ Pass | Zero new Firestore reads; description truncation reduces snapshot payload. |
| V. Secure Defaults | ✅ Pass | No auth surface; no new data writes; no new routes. |

No violations. Complexity Tracking table not required.

## Project Structure

### Documentation (this feature)

```text
.specify/specs/007-home-hero/
├── plan.md              # This file
├── research.md          # Phase 0 — all decisions resolved
├── data-model.md        # Existing build shape + snapshot change
├── contracts/
│   └── HeroBuild.vue.md # Component prop contract
└── tasks.md             # Phase 2 output (/speckit-tasks)
```

### Source Code (changes only)

```text
src/
├── assets/
│   └── base.css                       # Add --hero-* and --accent/--shadow vars to both theme blocks
├── components/home/
│   ├── BuildLaneTabs.vue              # Import HeroBuild; compute heroBuild/heroCiv; dedupe laneList
│   └── HeroBuild.vue                  # NEW — hero card component

functions/
└── builds/
    └── updateHomeSnapshot.js           # Add description.slice(0,300) trim in pickBuildFields
```

`Home.vue` and `BuildListCard.vue` are **not modified**.

## Phase 0: Research — Resolved

See [research.md](research.md) for all decisions. Summary:

| Decision | Outcome |
|----------|---------|
| `description` in pickBuildFields | Already present; add 300-char trim |
| Hero placement | Inside `BuildLaneTabs.vue` — has `activeTab` + lane arrays |
| Civ flag/name resolution | `civDefaultProvider.civs.find(c => c.shortName === build.civ)` |
| CSS vars location | `base.css` in `.v-theme--customDark/LightTheme` blocks |
| De-duplication | `laneList` filters hero build by id when hero is visible |
| Tab-swap animation | Instant (no transition); hero is a computed that updates reactively |
| Loading state | `v-skeleton-loader` when `items[0]?.loading === true` |

## Phase 1: Design

### Layer 1 — Cloud Function (`updateHomeSnapshot.js`)

**Change**: In `pickBuildFields`, replace:
```js
description: data.description ?? null,
```
with:
```js
description: data.description ? data.description.slice(0, 300) : null,
```

This is the only backend change. Deploy separately if needed; the client already handles `null` description.

---

### Layer 2 — CSS Variables (`base.css`)

Append to the existing `.v-theme--customDarkTheme` block:

```css
--hero-fade: 20,26,37;
--hero-title: #fff;
--hero-text: rgba(255,255,255,.86);
--hero-meta: rgba(255,255,255,.82);
--hero-shadow: 0 2px 8px rgba(0,0,0,.5);
--accent: #e7c05e;
--shadow: 0 8px 28px rgba(0,0,0,.35);
```

Append to the existing `.v-theme--customLightTheme` block:

```css
--hero-fade: 250,250,250;
--hero-title: #294790;
--hero-text: #41506b;
--hero-meta: #5b6573;
--hero-shadow: none;
--accent: #b9962f;
--shadow: 0 8px 28px rgba(40,50,70,.16);
```

---

### Layer 3 — New component (`HeroBuild.vue`)

See [contracts/HeroBuild.vue.md](contracts/HeroBuild.vue.md) for the full prop contract.

Props received from `BuildLaneTabs`:
- `build` — raw build object or null
- `flagUrl` — resolved civ flag URL
- `civName` — resolved civ display name
- `eyebrow` — full eyebrow string (e.g. `"#1 Trending · Ottomans"`)
- `icon` — MDI icon string matching the lane
- `loading` — boolean

Template structure (maps to `css-reference.md` §2 + §6 Vuetify mapping):
```
<router-link :to="BuildDetails route">   ← whole hero is one link
  <v-card :to=... class="aoe-featured">
    <v-img (cover, aria-hidden, alt="")>  ← flag background
    <span class="aoe-featured-scrim">     ← diagonal gradient (verbatim from css-reference.md §3)
    <div class="aoe-featured-content">
      <span eyebrow>                      ← v-icon + eyebrow text
      <h2 title>
      <p description (v-if)>              ← hidden if absent/empty
      <div meta row>                      ← v-chip strategy + author/time/views spans
```

Loading state: when `loading` prop is true, render `<v-skeleton-loader type="image" height="230" />` instead.

Scoped CSS: copy verbatim from `css-reference.md` §3 (`.aoe-featured`, `.aoe-featured-scrim`, `.aoe-featured-content`, `.aoe-featured-eyebrow`, `.aoe-featured-title`, `.aoe-featured-opening`, `.aoe-featured-row`, `.aoe-featured-meta`, `.aoe-badge`, `.aoe-badge--strat`, focus ring, responsive).

---

### Layer 4 — `BuildLaneTabs.vue` modifications

**Additions to `<script>` setup**:

```js
import { civs } from "@/composables/filter/civDefaultProvider";
import HeroBuild from "@/components/home/HeroBuild.vue";

// Lane metadata already defines icon per lane:
const laneEyebrows = {
  trending: { label: "#1 Trending", icon: "mdi-trending-up" },
  classics: { label: "#1 All-Time Classic", icon: "mdi-star" },
  new: { label: "Latest Build", icon: "mdi-clock-edit-outline" },
};

// Active lane's first build (or null if empty/loading)
const heroBuild = computed(() => {
  const items = laneList(activeTab.value);
  return items.length > 0 ? items[0] : null;
});

const heroCiv = computed(() =>
  civs.value.find(c => c.shortName === heroBuild.value?.civ) ?? null
);

const heroEyebrow = computed(() => {
  const meta = laneEyebrows[activeTab.value];
  const civTitle = heroCiv.value?.title ?? "";
  return civTitle ? `${meta.label} · ${civTitle}` : meta.label;
});

const heroIcon = computed(() => laneEyebrows[activeTab.value]?.icon);

const isLoading = computed(() => heroBuild.value?.loading === true);
```

**Modify `laneList`** to exclude hero build by id:

```js
const laneList = (value) => {
  const items =
    value === "trending" ? props.popularBuilds :
    value === "classics" ? props.allTimeClassics :
    props.recentBuilds;
  const hero = items[0];
  return hero && !hero.loading ? items.filter(b => b.id !== hero.id) : items;
};
```

**Add to `<template>`** (before `<v-tabs>`, inside the root `div.build-lane-tabs`):

```html
<HeroBuild
  v-if="isLoading || heroBuild"
  :build="isLoading ? null : heroBuild"
  :flag-url="heroCiv?.flagLarge ?? null"
  :civ-name="heroCiv?.title ?? null"
  :eyebrow="heroEyebrow"
  :icon="heroIcon"
  :loading="isLoading"
  class="mb-4"
/>
```

**Add `HeroBuild` to `components`**:
```js
components: { BuildListCard, HeroBuild },
```

---

## Implementation Order

1. `updateHomeSnapshot.js` — description trim (1 line change; deploy-able independently)
2. `base.css` — add `--hero-*` vars to both theme blocks
3. `HeroBuild.vue` — new component (verbatim CSS from css-reference.md §3)
4. `BuildLaneTabs.vue` — import HeroBuild, add computed properties, modify laneList, add hero to template

Manual test checklist before merge:
- [ ] Dark mode: near-black fade, white title, gold eyebrow, navy strategy badge
- [ ] Light mode: near-white fade, navy title, muted-gold eyebrow
- [ ] Tab switch: hero updates build + eyebrow for each lane
- [ ] Hero build absent from list below it (all 3 lanes)
- [ ] Empty lane: hero hidden
- [ ] Loading state: skeleton visible before snapshot arrives
- [ ] Click hero: navigates to BuildDetails
- [ ] Keyboard tab to hero: focus ring visible
- [ ] Mobile (≤720px): title 22px, full-width hero
- [ ] Long description: clamped to 2 lines
- [ ] Missing description: slot hidden
