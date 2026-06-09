# CSS & Vuetify Reference — Build Editor & Shared Build Header

Exact values for `BuildHeader.vue`, `BuildEditor.vue`, and the `BuildDetails.vue` header refactor. Everything is grounded in the app's real theme tokens (`reference/design-tokens.md`). **Chrome is Vuetify** — §6 maps each mock element to its Vuetify component. Only §3–§5 (hero flag fade, sticky footer, YouTube preview/error) are genuinely custom CSS.

The prototype (`BuildEdit Design.html`) hand-rolls the header, footer, selects, and menu **only because it is a framework-free HTML mock**. Do **not** reproduce those hand-rolled widgets — use Vuetify per §6.

---

## 1. Resolved theme tokens

Use Vuetify theme colors (`rgb(var(--v-theme-*))`), never hard-coded hex. Resolved values for reference:

| Role | Dark (`customDarkTheme`) | Light (`customLightTheme`) |
|---|---|---|
| `background` | `#1D2432` | `#D8DCE0` |
| `surface` (cards, header, footer) | `#324156` | `#FAFAFA` |
| `primary` (CTA / accents) | `#e7c05e` gold | `#294790` navy |
| `on-primary` (CTA text) | `#1D2432` | `#FFFFFF` |
| `accent` (icons, chips) | `#e7c05e` | `#294790` |
| field/sunken (inputs) | `#2c3a4e`–`#3a4a61` | `#ECEEF1`–`#F2F3F5` |
| divider | `rgba(255,255,255,.12)` | `rgba(0,0,0,.10)` |
| success (valid video tint) | `#6fce9f` | `#2e7d52` |
| error (invalid / danger) | `#ff8a8a` | `#c62828` |
| text-muted | `rgba(233,235,238,.58)` | `#5b6573` |

Body font **Inter**; icons **MDI** (`mdi-*`). Cards `rounded="lg"` (Vuetify ≈ 8–12px).

## 2. Hero metrics (BuildHeader)

- `v-card flat rounded="lg"`. One responsive `v-row no-gutters` — **no** `hidden-sm-and-down` / `hidden-md-and-up` twin blocks (that duplication is exactly what this feature removes).
- Flag column: `v-col cols="3" md="4" lg="3"` holding a `v-img cover` of `civ.flagLarge` (`:lazy-src` `flagSmall`), with `:gradient="'to right, transparent, ' + $vuetify.theme.current.colors.surface"`. No-civ fallback: `/assets/flags/any-large.webp` + `any-small.webp`.
- Title: `v-card-title` (mock ≈ 22px/700; let Vuetify's default title size stand).
- Chips: a `v-chip size="small" label` group — draft (`mdi-pencil-circle` `color="error"`), NEW (`mdi-alert-decagram` `color="accent"`, via `isNew`), civ (`mdi-earth`), season (`mdi-trophy`), strategy (`mdi-sword-cross`/`mdi-strategy`), plus author/views/votes/dates on the view route. Render each only when its field is present (`v-if`).
- `#actions` slot: pinned top-right (`v-col cols="auto"` in the row, or absolutely within the card). Holds the consumer's overflow (+ Vote/Favorite on the view route).

## 3. Hero flag fade — CUSTOM (already in the app)

The `:gradient` prop on `v-img` does the fade — no extra CSS needed. If a scoped rule is wanted for the column:

```css
.build-header__flag {           /* optional */
  min-height: 132px;            /* keeps the hero from collapsing on short titles */
}
```

## 4. Sticky footer (BuildEditor) — CUSTOM

```css
.build-editor-footer {
  position: fixed; left: 0; right: 0; bottom: 0; z-index: 6;
  background: rgb(var(--v-theme-surface));
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
.build-editor-footer-inner {
  max-width: 1280px;            /* match the page v-container width */
  margin: 0 auto;
  padding: 8px 16px;
  display: flex; align-items: center; gap: 8px; justify-content: flex-end;
}
.build-editor-status {          /* "Unsaved changes" */
  margin-right: auto;
  color: rgb(var(--v-theme-error));
  font-size: .8125rem;
}
```
- Add `padding-bottom: 76px` to the editor's root `v-container` so content clears the fixed bar.
- Buttons: Discard `v-btn variant="text"`; Save as draft `v-btn variant="outlined" color="accent"`; Publish build `v-btn color="accent"`.
- "Unsaved changes": `v-show="isDirty"`, optional leading `mdi-circle-medium`.

## 5. YouTube preview / error (BuildEditor) — CUSTOM

```css
.yt-preview {                   /* valid */
  display: flex; gap: 12px; align-items: center;
  border-radius: 12px; padding: 10px 12px;
  background: rgba(var(--v-theme-success), .09);
  border: 1px solid rgba(var(--v-theme-success), .34);
}
.yt-preview__thumb {            /* v-img inside */
  width: 120px; aspect-ratio: 16/9; border-radius: 6px; flex: 0 0 auto;
}
.yt-error {
  display: flex; gap: 11px; align-items: flex-start;
  border-radius: 11px; padding: 12px 15px;
  background: rgba(var(--v-theme-error), .13);
  border: 1px solid rgba(var(--v-theme-error), .38);
}
```
- Valid: `mdi-check-circle` eyebrow + "Valid YouTube link" `v-chip color="success" size="x-small"`; thumbnail `https://img.youtube.com/vi/${id}/mqdefault.jpg` (`@error` hides the `v-img`).
- Invalid: `role="alert"`, `mdi-alert-circle-outline` (`error`) + "Invalid URL" `v-chip color="error" size="x-small"` + muted hint "Paste a YouTube watch, youtu.be, embed, or shorts link."
- `v-alert type="success|error" variant="tonal"` are acceptable Vuetify substitutes for both.

## 6. Mock → Vuetify component mapping

| Mock element (BuildEdit Design.html) | Vuetify implementation |
|---|---|
| App bar | existing `Header.vue` (`v-app-bar`) — **unchanged**, shown in mock for context only |
| Hero card (flag + title + chips) | **`BuildHeader.vue`**: `v-card rounded="lg"` + `v-img` flag + `v-card-title` + `v-chip` group |
| Hero top-right ⋮ | `v-menu` + `v-btn icon="mdi-dots-vertical" variant="text" color="accent"` in the `#actions` slot |
| Overflow items | `v-list` + `v-list-item` (+ `v-tooltip` as today); `v-divider` before Delete |
| "Build details" card | `v-card rounded="lg"` + `v-text-field` (Title) + `v-textarea auto-grow` (Description) + `v-text-field` (Video) |
| "Classification" card | `v-card rounded="lg"` + `v-row` of 4× `v-col cols=12 sm=6 md=3` → `v-select` (each `prepend-icon`) |
| Select chevron / styling | native `v-select` (do **not** hand-roll the chevron) |
| YouTube valid preview | custom §5 (thumbnail = `v-img`; badge = `v-chip color="success"`) |
| YouTube error | custom §5 or `v-alert type="error" variant="tonal"` |
| Sticky footer | custom §4 (`<div>` bar) + `v-btn`s |
| "Unsaved changes" | inline text/`v-chip`, `v-show="isDirty"` |
| Build order area | existing **`BuildOrderEditor.vue`** — unchanged |
| Civ flag image | existing civ provider `flagLarge`/`flagSmall` (`civDefaultProvider.js`) |

## 7. The only custom CSS (everything else is Vuetify)

1. `.build-editor-footer` / `-inner` (§4) — sticky save bar.
2. `.yt-preview` / `.yt-error` (§5) — video field feedback (or `v-alert`).
3. (optional) `.build-header__flag` min-height (§3) — the `:gradient` already handles the fade.

All use theme CSS vars (`--v-theme-*`) so light/dark are automatic. No hard-coded hex in components.

## 8. Light/dark checklist

- Hero flag gradient fades into `surface` cleanly in both themes (the `:gradient` uses the live theme `surface`).
- Sticky footer `surface` bg sits above content with a legible top border; CTA gold-on-navy (dark) / navy-on-white (light), both ≥ AA.
- Valid-video success tint + invalid-video error tint readable on `surface` in both themes.
- Chips: `accent` fill legible; draft chip uses `error`.
- Single overflow menu list items + danger Delete contrast AA in both.
