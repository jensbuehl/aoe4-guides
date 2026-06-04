# CSS Reference — Civilization Picker

Exact, copy-pasteable styling for the dense civ grid + tooltip + search. Every `var(--*)` is
resolved to a concrete value for **both themes** below, so an implementer never has to guess.
The mock these come from is `Home Redesign.html` (project root) / `../_home-wireframe/home-wireframe.html`.

> **Vuetify-first note:** AOE4 Guides is a Vuetify app. The values below are the *visual contract*.
> Prefer expressing them with Vuetify props/utilities where one exists (noted inline); drop to scoped
> CSS only for the bits Vuetify can't express (the hover-reveal overlay, the flag mask). This honors
> Constitution III (Vuetify before custom).

---

## 1. Resolved design tokens

These mirror the app's real Vuetify theme (`reference/design-tokens.md` → `src/main.js`).
Use the existing theme tokens in code; the hex values are here only so the CSS below is unambiguous.

| Token | Dark (`customDarkTheme`) | Light (`customLightTheme`) | Used for |
|---|---|---|---|
| `--bg` | `#1D2432` | `#D8DCE0` | page background |
| `--surface` | `#324156` | `#FAFAFA` | search field, list rows |
| `--primary` | `#e7c05e` (gold) | `#294790` (navy) | **civ name text**, headings, focus ring |
| `--accent` | `#e7c05e` | `#b9962f` | NEW badge background |
| `--text` | `#E9EBEE` | `#1f2733` | input text |
| `--text-muted` | `rgba(233,235,238,.6)` | `#5b6573` | placeholder, search icon, tagline |
| `--divider` | `rgba(255,255,255,.1)` | `rgba(0,0,0,.09)` | search border, hairlines |
| `--shadow` | `0 8px 28px rgba(0,0,0,.35)` | `0 8px 28px rgba(40,50,70,.16)` | tile elevation |
| `--hero-fade` (RGB triplet) | `20,26,37` | `250,250,250` | hover-overlay gradient base |
| `--hero-shadow` | `0 2px 8px rgba(0,0,0,.5)` | `none` | name legibility shadow |

**Name-color rule (approved):** the civ name uses `var(--primary)` so it is **gold on dark, navy on
light** — never hard-code `#e7c05e`. The hover overlay uses `var(--hero-fade)` so it darkens on dark
and lightens on light, keeping the name readable in both.

---

## 2. Component markup (reference)

```html
<!-- section header: title + search on one row -->
<div class="aoe-civsec-head">
  <h2><i class="mdi mdi-flag-variant"></i> Choose your civilization</h2>
  <div class="aoe-search">
    <i class="mdi mdi-magnify"></i>
    <input type="search" placeholder="Find a civilization…" aria-label="Search civilizations" />
    <!-- clear button only when query non-empty -->
    <button class="aoe-search-clear" aria-label="Clear search"><i class="mdi mdi-close"></i></button>
  </div>
</div>

<!-- empty state (only when no match) -->
<div class="aoe-empty">No civilizations match “xyz”.</div>

<!-- dense grid -->
<div class="aoe-civgrid">
  <!-- one per civ; button is the link, aria-label carries the name (always in a11y tree) -->
  <button class="aoe-civtile" title="Ayyubids" aria-label="Ayyubids">
    <img src="/assets/flags/ayy.webp" alt="Ayyubids" />
    <span class="aoe-civtile-hover"><span class="aoe-civtile-name">Ayyubids</span></span>
    <span class="aoe-civtile-new">NEW</span>   <!-- only on recent-build civs -->
  </button>
  <!-- … -->
</div>
```

---

## 3. Full CSS (drop-in, resolved)

> Uses the theme custom properties from §1. If you are not exposing those exact `--*` names in CSS,
> substitute the resolved hex per theme. Pixel values are authoritative; map to Vuetify spacing where
> practical (`gap:12px` ≈ `ga-3`).

```css
/* ---- section header ---- */
.aoe-civsec-head {
  display: flex; align-items: center; justify-content: space-between;
  gap: 18px; margin-bottom: 16px; flex-wrap: wrap;       /* wraps search below title on narrow */
}
.aoe-civsec-head h2 {
  font-size: 18px; font-weight: 700;
  display: flex; align-items: center; gap: 9px;
}
.aoe-civsec-head h2 .mdi { color: var(--primary); font-size: 21px; }

/* ---- search (pill) ---- */
.aoe-search {
  display: flex; align-items: center; gap: 9px;
  background: var(--surface);
  border: 1px solid var(--divider);
  border-radius: 999px;
  padding: 0 16px; height: 42px; width: 320px; max-width: 100%;
  transition: border-color .15s;
}
.aoe-search:focus-within { border-color: var(--primary); }   /* a11y: visible focus on the group */
.aoe-search .mdi { color: var(--text-muted); font-size: 19px; }
.aoe-search input {
  flex: 1; border: none; background: none; outline: none;
  color: var(--text); font-size: 14px;
}
.aoe-search input::placeholder { color: var(--text-muted); }
.aoe-search-clear { color: var(--text-muted); display: flex; }

/* ---- dense grid ---- */
.aoe-civgrid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);   /* 5 cols desktop; see breakpoints */
  gap: 12px;
}

/* ---- tile ---- */
.aoe-civtile {
  position: relative;
  aspect-ratio: 16 / 10;                   /* uniform tiles regardless of flag size */
  border-radius: 12px; overflow: hidden;
  box-shadow: var(--shadow);
  transition: transform .12s, box-shadow .15s;
}
.aoe-civtile:hover { transform: translateY(-3px); box-shadow: 0 12px 30px rgba(0,0,0,.4); }
.aoe-civtile:focus-visible {                /* a11y: keyboard focus ring */
  outline: 3px solid var(--primary); outline-offset: 2px;
}
.aoe-civtile img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }

/* ---- name overlay: hidden until hover OR keyboard focus ---- */
.aoe-civtile-hover {
  position: absolute; inset: 0;
  display: flex; align-items: flex-end; padding: 8px 10px;
  opacity: 0; transition: opacity .15s;
  background: linear-gradient(to top,
    rgba(var(--hero-fade), .92) 5%,
    rgba(var(--hero-fade), .25) 55%,
    transparent 80%);
}
.aoe-civtile:hover  .aoe-civtile-hover,
.aoe-civtile:focus-visible .aoe-civtile-hover { opacity: 1; }
.aoe-civtile-name {
  color: var(--primary);                   /* gold dark / navy light */
  font-weight: 700; font-size: 12.5px; line-height: 1.2;
  text-shadow: var(--hero-shadow);
}

/* ---- NEW badge ---- */
.aoe-civtile-new {
  position: absolute; top: 7px; right: 7px;
  background: var(--accent); color: #1D2432;
  font-size: 9px; font-weight: 800; letter-spacing: .5px;
  padding: 2px 6px; border-radius: 5px;
}

/* ---- empty state ---- */
.aoe-empty {
  padding: 30px; text-align: center;
  color: var(--text-muted); background: var(--surface); border-radius: 12px;
}

/* ---- responsive ---- */
@media (max-width: 1080px) { .aoe-civgrid { grid-template-columns: repeat(4, 1fr); } }
@media (max-width: 720px)  { .aoe-civgrid { grid-template-columns: repeat(3, 1fr); } }
/* optional: repeat(2,1fr) under ~440px */
```

---

## 4. Density comparison (why this is "dense")

| | Old (current site) | New (this feature) |
|---|---|---|
| Layout | 2-col list, flag + name + tagline per row, ~64px tall | 5-col flag-tile grid, 16:10 tiles |
| 27 civs height (desktop) | ~14 rows ≈ very tall | ~6 rows ≈ ~⅓ the height |
| Name | always visible | tooltip + hover/focus reveal (kept in a11y tree) |
| Tagline | always visible | dropped from tile (still searchable) |

---

## 5. Accessibility requirements (must-hold)

The visual hides the civ name until hover — so the **non-visual** name path must be rock-solid:

1. **Accessible name always present.** Each tile is a real control with `aria-label="<Civ>"` (and
   `title` for a mouse tooltip). The `<img>` also has a meaningful `alt`. Screen-reader and keyboard
   users get the name without hovering. *Never* ship a tile whose only name is the hover text.
2. **Keyboard reveal.** `:focus-visible` both shows the focus ring **and** opacity-reveals the name
   overlay (see CSS) so sighted keyboard users see the label too.
3. **Search is labelled.** `aria-label="Search civilizations"` on the input; the clear button has
   `aria-label="Clear search"`. Use `type="search"`.
4. **Hit target.** Tiles are well above 44×44px; the search clear button must keep a ≥44px tap area
   on touch (pad the button, not just the icon).
5. **Contrast.** Name text is `var(--primary)` over the dark/light gradient base — the gradient
   (`.92` alpha at the bottom) guarantees ≥4.5:1 for the name in both themes. Keep the gradient if you
   change the name color.
6. **Touch has no hover.** Don't rely on hover to convey identity on touch — the always-present
   `aria-label`/`title` and the search field cover touch users. (Optional enhancement: show names
   persistently under ~720px.)
7. **NEW badge.** It's decorative-ish; ensure the civ's recency is also conveyed in text if it matters
   (e.g. include "(new)" in the `aria-label`, or leave the visible badge as a non-essential cue).
8. **Reduced motion.** The `transform`/`opacity` transitions are subtle; wrap hover lift in
   `@media (prefers-reduced-motion: no-preference)` if you want to be strict.

---

## 6. Vuetify mapping cheatsheet

| Piece | Vuetify-native | Custom CSS needed? |
|---|---|---|
| Search pill | `v-text-field` `variant="solo"` `rounded` `density="comfortable"` `prepend-inner-icon="mdi-magnify"` `clearable` | No — clearable gives the ✕ + a11y label |
| Grid | `v-row`/`v-col` or a CSS grid wrapper | CSS grid is simpler for fixed 5/4/3 cols |
| Tile | `v-card` (gives elevation/rounded/hover) wrapping `v-img` | Yes for the hover-reveal overlay + focus ring |
| Flag image | `v-img` `cover` `aspect-ratio="1.6"` | — |
| NEW badge | `v-chip size="x-small" color="accent"` or `v-badge` | minor positioning CSS |
| Empty state | `v-sheet`/`v-alert` muted | — |
| Tooltip | native `title` (lightest) or `v-tooltip` | native preferred for 27 tiles (perf) |

`v-text-field clearable` already provides an accessible clear button — prefer it over the hand-rolled
`.aoe-search-clear`.
