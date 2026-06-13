# Design Input — Desktop Build View & Editor (`014-desktop-build-layout`)

> The visual + interaction reference for the desktop refresh. Pairs with `spec.md` (what & why) and `tasks.md` (the build order).
> **Interactive source of truth:** `assets/Desktop Build Redesign.html` (working copy at project root, where `assets/res/*` + `assets/flags/*` resolve). The Tweaks panel toggles **Mode** (view / edit), **Theme** (dark / light), and **Layout** (classic / sidebar). Recreate with **Vuetify components** — the mock's hand-rolled header/menu/dialog are **not** to be pasted; this doc maps each mock element to its Vuetify equivalent.
> **Source files** (archived alongside the HTML): `desktop-final-data.jsx` (tokens, sample data, `::token::`↔HTML round-trip), `desktop-final-parts.jsx` (header, hero, cards, dialogs, picker), `desktop-final-steps.jsx` (the build-order table: rows, lane, inline editing), `desktop-final-app.jsx` (state + handlers + Tweaks wiring).

---

## 1. Resolved theme tokens (use verbatim — both themes)

From `reference/design-tokens.md` (real Vuetify theme values). **Never hardcode hex; bind theme tokens.** Gold + navy swap roles between themes.

### Dark theme — `customDarkTheme` (default)
| Role | Token | Hex |
|---|---|---|
| App background | `background` | `#1D2432` |
| Cards / header / footer | `surface` | `#324156` |
| Tooltip / raised surface | `surface-variant` | `#3D516B` |
| **Primary (gold)** — actions, links, accents, delta, age lane | `primary` | `#e7c05e` |
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

> **Brand logic:** dark = gold primary on navy; light = navy primary with muted-gold accent. In the prototype the accent is exposed as `--acc` (gold in dark, navy in light); the **age-transition lane stays gold in both themes** (`--aug`, a brand constant) because it reads as an AOE4 age icon, not a UI accent. The **delta accent uses `--acc`** (the theme accent) per FR-014.

### Typography
- Body font **Inter**, base **15 px / 1.6**. Title **24 px / 800**, `text-wrap: balance`.
- Icons: **Material Design Icons** (`mdi-*`) for UI glyphs; AOE4 resource/unit icons are the existing image tiles.
- **Desktop legibility:** step text **14 px**; nothing relies on sub-12 px text.

---

## 2. Mock → Vuetify mapping

The prototype is hand-rolled HTML/CSS/React. Build it with these Vuetify components — do **not** reproduce the mock's raw markup. Desktop only (`md-and-up`).

| Mock element (in `Desktop Build Redesign.html`) | Build with |
|---|---|
| Site header (`.sitebar`) | existing `Header.vue` (`v-app-bar`) — unchanged; shown here only for context. |
| Hero card (`.hero`) | `v-card flat rounded="lg"`. |
| **Civ lockup** (`.hero-civ`: `.hero-flag` + `.hero-civ-name`) | a flex row: existing civ flag (`v-img`, ~46×34, `rounded`) + civ name (`text-h6`, `font-weight-bold`). **This is the lead element**, distinct from the chips. |
| Metadata chips (`.chips`) | `v-chip-group` of `v-chip size="small"` — status `color="primary" variant="tonal"`, season/map/strategy `variant="outlined"` / tonal. **No** civ chip (civ is the lockup). |
| Hero actions (`.hero-actions`) | view: vote (`v-btn-toggle`/custom), favorite (`v-btn icon`), overflow (`v-menu`). edit: **Publish** (`v-btn color="accent"`) + overflow (`v-menu`). |
| Hero overflow (`.overflow-menu`) | `v-menu` + `v-list`; edit items `Save as draft`, `Discard changes` (destructive); view items `Share`, `Export`, owner-gated `Edit`/`Delete` (§4). |
| Editable title (`.hero-title.editable`) | `v-text-field`/contenteditable host styled to match the `text-h5/h6` display; accent on focus, no permanent underline. |
| Description card + collapse (`.card` + `DescCard`) | `v-card` with a clickable `v-card-title` (chevron) toggling a `v-expand-transition` body. |
| Edit details/classification (`.meta-row`) | two stacked `v-card`s (single column): Build details (description `v-textarea`) + Classification (civ/season/map/strategy `v-select` in a 2-col `v-row`). |
| Build-order card (`.card` + `BuildOrderCard`) | `v-card`; header row = title + **Focus mode** trigger (existing, unchanged). |
| Legend row (`.bo-legend`) | sticky header row of resource icons (`IconToolTip`), aligned to the columns; time icon left-aligned to match the timestamp column. |
| Step row (`.bo-row`) | a CSS-grid row (see §3.1). View cells are text/tiles; edit cells are `v-text-field`(`density="compact"`,`hide-details`,`variant="plain"`). |
| Resource cell (`.rc`) | view: tinted value tile; edit: numeric `v-text-field`. Empty = faint dash, no tile (§3.4). |
| Villager total (`.bo-pop`) | read-only number (icon in the legend); never an input. |
| Timestamp (`.bo-time` / `.time-input`) | view: gold text; edit: small `v-text-field` (~56 px). **Same vertical position in both** (§3.2). |
| Step note (`.bo-note` / `.wys`) | view: the icon-shortcode renderer (as today). edit: the **`useIconRichText` contenteditable host** (the `011` "Critical" composable — reuse it). |
| Insert-icon corner button (`.wys-fab`) | small **corner `v-btn icon size="small"`** absolutely positioned bottom-right of the note; revealed on `:focus-within` only; `@mousedown.prevent` to preserve caret (§3.7 — no-CLS). |
| Icon picker (`IconPicker`) | the existing **`IconSelector.vue`** in a `v-dialog` (desktop) — **do not reimplement**; the prototype's picker is a stand-in. |
| Hover insert line (`.ins`) | a thin hover-activated row between steps (and after the last step) that calls "insert step at index" — gold line + pill (§3.6). **Replaces** any "Add step" button. |
| Add age-up (`.append-btn.ghost`) | a single `v-btn variant="text"` below the list; seeds two empty steps + focuses the new timestamp (§ tasks T-08). |
| Age-up marker (`.age-marker`) | gold `v-card`/row: roman-numeral or age icon + "Age up to {age} Age"; remove ✕ (`v-btn icon`). |
| Age lane (`.lane`) | the "while aging" steps with a gold **inset** left edge (`box-shadow: inset 3px 0 0`) — **no indentation** (§3.5). |
| Age reached plate (`.age-plate`) | gold `v-card`/row: age icon + "{age} Age reached". |
| Age-down confirm (`.confirm-dialog`) | `v-dialog` (`max-width≈380`), destructive primary; copy in §4. |
| Delta accent (`.rc.d-up`) | a 2 px **`primary` top-border** on increased cells (§3.3, FR-014). |

---

## 3. The only custom CSS (everything else is Vuetify + tokens)

Keep custom CSS minimal and desktop-scoped (`md-and-up`). The numbers below are the **resolved, verified** values from the prototype — they encode the view/edit alignment contract, so use them verbatim.

### 3.1 Fixed column grid
```css
.bo      { --cols: 64px 44px repeat(5, 52px) minmax(0,1fr); }       /* view */
.bo.edit { --cols: 70px 44px repeat(5, 52px) minmax(0,1fr) 30px; }  /* edit adds a ✕ column */
.bo-row, .bo-legend { display: grid; grid-template-columns: var(--cols); gap: 8px; }
```
Columns: **time · villagers · Builder · Food · Wood · Gold · Stone · description** (+ ✕ in edit). Every resource keeps a fixed column even when empty.

### 3.2 View/edit alignment contract (the parity gate — SC-002)
The whole row is `align-items: start`; each leading cell is then nudged so its visual center lands on the note's **first line** (≈25 px from row top). **View and edit use the same offsets:**
```css
.bo-row            { align-items: start; padding: 7px 10px; }
.bo-time, .time-input,
.bo-pop, .rc, input.rc { align-self: start; margin-top: 3px; height: 30px; box-sizing: border-box; }
.bo-time, .bo-pop  { display:flex; align-items:center; }          /* center text in the 30px box */
input.rc           { display:block; line-height:28px; padding:0; } /* center text in the input */
.time-input        { font-size:13.5px; font-weight:700; }          /* match view .bo-time, not the old 12.5px */
.bo-note           { align-self: start; line-height: 1.55; }       /* icons set the 1st-line height */
.wys               { line-height: 1.55; padding: 3px 40px 3px 10px; margin-top: -4px; } /* box, but 1st line aligns */
```
> The edit fields previously drifted (smaller font, `line-height:2.1`, wrong vertical offset). The values above bring time / villagers / resources / note-first-line to the **same 25 px center** in both modes. Verify with the SC-002 measurement.

### 3.3 Delta accent (increase only, gold)
```css
.rc.d-up { border-top: 2px solid var(--acc); }   /* value increased vs previous step */
```
No accent on unchanged/decreased cells; no accent on the first step. (Earlier iterations tried green + a decrease border — both were dropped: gold keeps the single-accent design-system grammar; increase-only keeps the signal calm.)

### 3.4 Quiet empty cells
```css
.rc.empty { background: transparent; border-color: transparent; color: rgba(127,127,127,.28); font-weight: 500; }
```
A faint **dash** (no tile, no border) so the column stays learnable while filled numbers dominate.

### 3.5 Age-transition lane (no indentation)
```css
.lane-group { display:flex; flex-direction:column; gap:3px; margin:8px 0; }
.age-marker, .age-plate { border-radius:8px; padding:7px 10px;       /* match step-row vertical padding */
  background: linear-gradient(90deg, var(--aug-soft-a), var(--aug-soft-b)); border:1px solid var(--aug-border); }
.lane { box-shadow: inset 3px 0 0 var(--aug);                        /* inset edge — does NOT shift columns */
  background: linear-gradient(90deg, var(--aug-soft-b), transparent 40%); }
```
> Critical: the lane edge is an **inset box-shadow**, never `border-left`/`padding-left` — a border/padding indents the inner rows and breaks column alignment (the user explicitly rejected indentation). Marker = "Age up to {age} Age" (roman numeral, **no** age icon); plate = "{age} Age reached" (**with** age icon). Both full-radius gold cards.

### 3.6 Hover insert line (replaces "Add step")
```css
.ins { height:14px; margin:-7px 0; position:relative; cursor:pointer; z-index:2; }
.ins .ln { left:8px; right:8px; top:50%; height:2px; background:var(--acc); opacity:0; }
.ins .pl { /* centered gold "+ Step" pill */ opacity:0; }
.ins:hover .ln, .ins:hover .pl { opacity:1; }
```
Rendered **between every pair of rows and after the last row** (trailing `.ins`) so a step can be inserted anywhere, including the end, with no button.

### 3.7 Insert-icon corner button (no-CLS — required)
```css
.wys-wrap { position: relative; }
.wys      { padding-right: 40px; }            /* reserve the corner so text never runs under the button */
.wys-fab  { position:absolute; right:5px; bottom:5px; width:26px; height:26px;
            opacity:0; pointer-events:none; transition:opacity .14s; }
.wys-wrap:focus-within .wys-fab { opacity:1; pointer-events:auto; }   /* focus only, pure opacity, zero reflow */
```
Same no-CLS contract as `011` §3.7: focusing a step yields **0 px** height delta.

### 3.8 Separator hygiene
```css
.bo > .bo-row:last-child, .bo > .bo-noterow:last-child { border-bottom: none; }  /* last row: no separator */
.bo-noterow:has(+ .lane-group) { border-bottom: none; }                          /* note above age-up: no double line */
```

### Icon-class tints (UNCHANGED — do not modify; FR-009)
The radial-gradient tile per **icon class** is preserved exactly. Reproduced for reference only:

| Class | Gradient | Used for |
|---|---|---|
| `default` | `radial-gradient(circle at top, #4b6382, #1d2432)` | resources, eco buildings |
| `military` | `radial-gradient(circle at top, #8b5d44, #683a22)` | military units |
| `landmark` | `radial-gradient(circle at top, #232e3e, #0c0f17)` | landmarks |
| `tech` | `radial-gradient(circle at top, #469586, #266d5b)` | upgrades/tech |
| `ability` | `radial-gradient(circle at top, #5c457b, #4d366e)` | abilities |
| `none` | `radial-gradient(circle at top, #646c79, #4f5866)` | ages / misc |

> Only the icon **size** may be tuned for desktop: in-note tiles **36 px**, legend tiles **28 px** (the prototype's chosen sizes). The class→gradient mapping itself is frozen and comes from the real per-icon data in production.

---

## 4. Copy & action sets (verbatim)

**Edit hero — primary action:** `Publish` (in the header, `color="accent"`).

**Edit hero overflow** (⋮, no Delete, no Preview): `Save as draft` · `Discard changes` (destructive).

**View hero overflow — non-owner:** `Share` · `Export` · (engagement actions per existing desktop rules).

**View hero overflow — owner:** adds `Edit` and owner-gated `Delete build` (destructive), per existing desktop ownership rules. (Delete lives **only** here — never in the editor.)

**Build-order card header:** title `Build order` · **`Focus mode`** trigger (existing, unchanged) on the right. **No** age-jump shortcuts.

**Add-step:** *(no button)* — gold hover insert line between rows and after the last row.

**Add age-up:** `Add age-up` button → seeds one empty aging-up step + one empty reached-section step, focus → new timestamp.

**Age-down confirmation** (`v-dialog`):
- Title: `Age down to {previous age} Age?`
- Body: `This removes the {age} age-up and {N} step(s) after it — everything from this point on. This can't be undone.`
- Actions: `Cancel` (text) · `Age down` (destructive).

**Empty step-note placeholder**: `Describe this step — type :: or use the icon button`.

---

## 5. Desktop structure (top → bottom)

**View route**: site header → **hero** (civ lockup + title + status/season/map/strategy chips + vote/favorite/⋮) → **Description** card (collapsible) → **Build order** card (legend; steps: time · villager total · 5 fixed columns · note with inline icons · gold delta accents; age-up marker → gold lane → reached plate) → **Video** card.

**Edit route**: site header → **hero** (same lockup/title/chips; **Publish** + ⋮ `Save as draft`/`Discard`) → **Build details** card (description) → **Classification** card (civ/season/map/strategy) → **Build order** card (editable: time input · live villager total · tap-to-type cells · WYSIWYG note + corner Insert-icon · hover insert line incl. after last row · ✕ remove · **Add age-up** seeds two steps + focuses time · age-down confirm) → **Video** card (URL field).

> **Parity rule:** view and edit are the **same layout**; the build order never re-arranges between modes. Only the edit affordances (inputs, ✕, insert line, corner Insert-icon) differ. (NC-2: an optional `lg`-and-up sticky side-rail for Description/Video sits behind the same components — Tweaks → Layout → sidebar.)

---

## 6. Acceptance gates tied to this design

- View/edit parity: identical row heights, column positions, and first-line center (±1 px) — SC-002, FR-022, §3.2.
- WYSIWYG note round-trips losslessly (incl. multi-line) through save→reload; 20/20 caret-correct inserts; **0 px** focus reflow — SC-003/004, FR-015–019, §3.7.
- Delta accent only on increases, never on the first step — SC-005, FR-014, §3.3.
- Add age-up seeds two empty steps + focuses the new timestamp — SC-006, FR-021.
- Hover insert reachable after the last row; no "Add step" button — SC-007, FR-020, §3.6.
- Icon-class tile color coding unchanged; Focus mode unchanged — SC-008, FR-009/023.
- Age lane uses an inset edge (no column-breaking indentation) — FR-013, §3.5.
