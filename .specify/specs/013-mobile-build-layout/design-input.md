# Design Input — Mobile Build View & Editor (`013-mobile-build-layout`)

> The visual + interaction reference for the mobile refactor. Pairs with `spec.md` (what & why) and `plan.md` (how, incl. the WYSIWYG sync/caret strategy).
> **Interactive source of truth:** `assets/Mobile Build Redesign.html` (also at project root). Tweaks panel toggles **View / Edit**. Recreate with **Vuetify components** — the mock's hand-rolled header/sheet/dialog are **not** to be pasted; this doc maps each mock element to its Vuetify equivalent.

---

## 1. Resolved theme tokens (use verbatim — both themes)

From `reference/design-tokens.md` (real Vuetify theme values). **Never hardcode hex; bind theme tokens.** Gold + navy swap roles between themes.

### Dark theme — `customDarkTheme` (default)
| Role | Token | Hex |
|---|---|---|
| App background | `background` | `#1D2432` |
| Cards / header / footer | `surface` | `#324156` |
| Tooltip surface | `surface-variant` | `#3D516B` |
| **Primary (gold)** — actions, links, accents | `primary` | `#e7c05e` |
| Primary darken | `primary-darken-1` | `#8D7B4B` |
| **Secondary (navy)** | `secondary` | `#294790` |
| Accent / anchor / info | `accent` | `#e7c05e` |
| Icon tile bg | `icon-background` | `#4F5866` |
| Icon tile bg (hover) | `icon-background-highlight` | `#646C79` |

### Light theme — `customLightTheme`
| Role | Token | Hex |
|---|---|---|
| App background | `background` | `#D8DCE0` |
| Cards / header / footer | `surface` | `#FAFAFA` |
| **Primary (navy)** | `primary` | `#294790` |
| **Secondary (muted gold)** | `secondary` | `#CCAA55` |
| Accent / anchor / info | `accent` | `#CCAA55` |
| Icon tile bg | `icon-background` | `#C5C5C6` |
| Icon tile bg (hover) | `icon-background-highlight` | `#DEDEDF` |

> **Brand logic:** dark = gold primary on navy; light = navy primary with muted-gold accent. The slim header's hairline is `primary` (gold in dark, navy in light). Status chips use `primary`; the civ chip uses `secondary`.

### Typography
- Body font **Inter** (`Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, …`), base **15 px / 1.6**.
- Icons: **Material Design Icons** (`mdi-*`, `@mdi/font`) — Vuetify default.
- **Mobile legibility floor:** build-order step text ≥ **13 px**; nothing below 12 px; touch targets ≥ **44 px**.

---

## 2. Mock → Vuetify mapping

The prototype is hand-rolled HTML/CSS. Build it with these Vuetify components — do **not** reproduce the mock's raw markup.

| Mock element (in `Mobile Build Redesign.html`) | Build with |
|---|---|
| Slim app header row (`.appbar`) | `v-app-bar` (density `compact`), flat, `color="surface"`, with a 1 px bottom border in `primary`. Title slot = brand wordmark. Mobile only (`hidden-md-and-up`). |
| Hamburger / profile / avatar | existing `Header.vue` nav + profile menu (reused); avatar = existing `v-avatar`. |
| Hero card (`.hero`) | `v-card flat rounded="lg"`; `v-card-title` for the title; a `v-chip-group` of `v-chip size="small"` for status/civ/season. **No** `v-img` flag column on mobile. |
| Overflow ⋮ (`.ov-menu`) | `v-menu` + `v-list` / `v-list-item` (owner-gated with `v-if`), exactly the action sets in §4. |
| Status / civ / season chips | `v-chip` — status `color="primary" variant="tonal"`, civ `color="secondary" variant="tonal"`, season `variant="outlined"`. |
| Description card + collapse (`.card` + `toggleCollapse`) | `v-card` with a clickable `v-card-title` row (chevron `v-icon`) toggling a `v-expand-transition` body. Equal top/bottom title padding when collapsed. |
| Build-order step card (`.stepc`) | `v-card variant="tonal"` per step inside the existing section list. The 5-slot grid is a `v-row`/`v-col` or CSS grid (see §3 custom CSS). |
| Resource slot (`.rcell`) | small tonal tile: `IconToolTip` icon + value text; edit value = `v-text-field` (`type="number"`, `density="compact"`, `hide-details`, `variant="plain"`). |
| Villager total badge (`.step-pop`) | read-only `v-chip size="small"` (icon + number). No text label. |
| Timestamp (`.step-time` / `.time-input`) | view: `v-chip`/text; edit: `v-text-field` (`density="compact"`, `hide-details`, ~56 px). |
| Step note (`.desc` / `.desc-edit.wys`) | view: render via the icon-shortcode renderer (as today). edit: the **`useIconRichText` contenteditable host** (§ plan "Critical"). |
| Insert-icon button (`.desc-tool-btn`, focus-revealed) | `v-btn variant="text" size="small"` shown only while the note is focused; `@mousedown.prevent` to preserve caret. |
| Icon picker bottom sheet (`.picker`) | **`v-bottom-sheet`** wrapping the existing **`IconSelector.vue`** (tabs + search). No reimplementation. |
| Age-up row (`.ageup`) | existing age-up marker; remove control = `v-btn icon size="small"` with `mdi-close`. |
| Age-down confirm (`.confirm-dialog`) | `v-dialog` (`max-width≈340`), destructive primary action; copy in §4. |
| Sticky edit action bar (`.actionbar`) | fixed bottom bar (`v-sheet`/`div`) — "Unsaved changes" (`v-chip`/text, `v-show="isDirty"`) + Draft (`v-btn variant="outlined"`) + Publish (`v-btn color="accent"`). Page padded to clear it. |
| Video card (`.yt-card`) | `v-card`; view = `v-img` thumbnail + play `v-icon` + duration; edit = `v-text-field` URL + existing YouTube validation/preview. |
| Confirm/picker scrims | Vuetify overlay (built into `v-dialog` / `v-bottom-sheet`) — do not hand-roll. |

---

## 3. The only custom CSS (everything else is Vuetify + tokens)

Keep custom CSS minimal and mobile-scoped (`@media` / `hidden-md-and-up`):

1. **Slim header hairline** — `border-bottom: 1px solid rgb(var(--v-theme-primary))` on the mobile `v-app-bar`.
2. **Fixed 5-slot grid** — `display:grid; grid-template-columns:repeat(5,1fr); gap:5px;` on the step's resource row, so every resource keeps a fixed position even when empty. Empty slot = reduced-opacity tile.
3. **Resource-slot tints** — each slot tinted by resource (subtle bg), e.g. food/wood/gold/stone/builder. Derive from the resource icon's class tint (below), not new brand colors.
4. **WYSIWYG icon tile** — inline `img.ic` in the contenteditable: `height:26px; border-radius:4px; padding:1px; vertical-align:middle; user-select:none;` + `contenteditable="false"` (atomic). Description line-height ~1.7 so 26 px icons don't crowd text.
5. **Sticky action bar** — `position:fixed; left/right/bottom:0;` bar; add matching `padding-bottom` to the scroll body.
6. **Collapsed-card title centering** — equal top/bottom padding on the Description `v-card-title` when collapsed.

### Icon-class tints (reuse the existing `IconToolTip`/`IconSelector` system — do not invent)
The desktop renders each icon on a radial-gradient tile keyed by **icon class**. The mobile WYSIWYG editor and picker reuse the same classes:

| Class | Gradient (reference) | Used for |
|---|---|---|
| `default` | `radial-gradient(circle at top, #4b6382, #1d2432)` | resources, eco buildings |
| `military` | `radial-gradient(circle at top, #8b5d44, #683a22)` | military units |
| `landmark` | `radial-gradient(circle at top, #232e3e, #0c0f17)` | landmarks |
| `tech` | `radial-gradient(circle at top, #469586, #266d5b)` | upgrades/tech |
| `ability` | `radial-gradient(circle at top, #5c457b, #4d366e)` | abilities |
| `none` | `radial-gradient(circle at top, #646c79, #4f5866)` | ages / misc |

> In production the class comes from the **real per-icon data** in the icon library, not a category guess. The prototype maps category→class as a faithful stand-in; wire to the real class on integration.

---

## 4. Copy & action sets (verbatim)

**Edit hero overflow** (no Delete, no Preview): `Duplicate` · `Copy to overlay tool` · `Download as file` · — · `Discard changes`.

**View hero overflow — non-owner**: `Favorite` · `Like` · `Dislike` · — · `Share` · `Copy to overlay tool` · `Download as file` · `Duplicate to my builds` · — · `Report`.

**View hero overflow — owner**: adds `Edit` and owner-gated `Delete build` (destructive), per existing desktop ownership rules. (Delete lives **only** here — never in the editor.)

**Sticky edit action bar**: indicator `Unsaved changes` (show when dirty) · `Draft` · `Publish`.

**Age-down confirmation** (`v-dialog`):
- Title: `Age down to {previous age}?`
- Body: `This removes the {age} age-up and {N} step(s) after it — everything from this point on. This can't be undone.`
- Actions: `Cancel` (text) · `Age down` (destructive).

**Empty step-note placeholder**: `Describe this step — type :: or tap Insert icon for AOE4 icons` (shown only while empty; disappears on content).

---

## 5. Mobile structure (top → bottom)

**View route**: slim header → lean hero (title + 3 chips + ⋮) → **Description** card (collapsible) → **Build order** card (steps: time · villager total · 5-slot grid · note with inline icons; age-up rows) → **Video** card.

**Edit route**: slim header (shared) → **Build details** card (title, description) → **Classification** card (civ / season / map / strategy — 2-col, generous row gap) → **Build order** card (editable: time input · live villager total · tap-to-type slots · WYSIWYG note + focus-revealed Insert-icon · ✕ remove · Add step / Add age-up · age-down confirm) → **Video** card (URL field) → **sticky action bar** (Unsaved changes · Draft · Publish).

---

## 6. Acceptance gates tied to this design

- Zero horizontal scroll at 390 px; touch targets ≥ 44 px; step text ≥ 13 px (SC-001/002/003).
- WYSIWYG note round-trips losslessly through save→reload; 20/20 caret-correct inserts (SC-004/005, FR-012–015) — **the blocking gate**; see `plan.md` "Critical: WYSIWYG sync & caret."
- Desktop `md-and-up` pixel-unchanged (SC-006).
- Age-up removal removes the age-up + all later steps, only on confirm (SC-007, FR-011).
