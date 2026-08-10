# AOE4 Guides — Extracted Design Tokens

> Pulled directly from `jensbuehl/aoe4-guides@main` (`src/main.js`, `src/assets/base.css`, `index.html`).
> These are the **real** Vuetify theme values — use them verbatim, don't invent new colors.

## Themes (Vuetify 3)
Default theme is **dark** (`customDarkTheme`). Both themes below are first-class.
Theme is persisted in `localStorage` under key `aoe4-guides-theme`.

### Dark theme — `customDarkTheme`
| Token | Hex | Notes |
|---|---|---|
| `background` | `#1D2432` | app background (boot script uses `#161A25` as the pre-paint bg) |
| `surface` | `#324156` | cards, header, footer |
| `surface-variant` | `#3D516B` | tooltips |
| `primary` | `#e7c05e` | **gold** — primary actions, links, headings accent |
| `primary-darken-1` | `#8D7B4B` | |
| `secondary` | `#294790` | **dark blue** |
| `secondary-darken-1` | `#3D516B` | |
| `accent` / `anchor` / `info` | `#e7c05e` | gold |
| `icon-background` | `#4F5866` | icon tile bg |
| `icon-background-highlight` | `#646C79` | icon tile hover |
| `loading` | `#3D516B` | |

### Light theme — `customLightTheme`
| Token | Hex | Notes |
|---|---|---|
| `background` | `#D8DCE0` | (boot script uses `#E9EBEE`) |
| `surface` | `#FAFAFA` | header + footer |
| `surface-variant` | `#CCAA55` | tooltips |
| `primary` | `#294790` | **dark blue** is primary in light mode |
| `primary-darken-1` | `#3D516B` | |
| `secondary` | `#CCAA55` | muted gold |
| `secondary-darken-1` | `#8D7B4B` | |
| `accent` / `anchor` / `info` | `#CCAA55` | muted gold |
| `icon-background` | `#C5C5C6` | |
| `icon-background-highlight` | `#DEDEDF` | |

**Brand logic:** gold + dark blue swap roles between themes. Dark mode = gold primary on navy; light mode = navy primary with muted gold accent.

## Typography
- **Body font:** `Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, …, sans-serif`
- Roboto (100–900) + Material Icons loaded via Google Fonts in `index.html`
- Icon font: **Material Design Icons** (`@mdi/font`) — Vuetify default `mdi-*`
- Base `font-size: 15px`, `line-height: 1.6`, `text-rendering: optimizeLegibility`, antialiased

## Misc
- `--section-gap: 160px`
- Theme transition: `color 0.5s, background-color 0.5s` (suppressed via `html.no-transition` on boot)
- `box-sizing: border-box`, `position: relative`, `font-weight: normal` reset on all elements

## Component / view map (for forking reference)
**Layout:** `App.vue`, `components/Header.vue` (15.5KB — nav, add-build menu, profile/theme toggle), `components/Footer.vue`
**Home:** `views/Home.vue` (33KB — civ grid, search, welcome/season sidebar, trending)
**Builds list:** `views/builds/{Builds,MyBuilds,MyFavorites,Dashboard}.vue`, `components/builds/BuildListCard.vue`, `components/filter/FilterConfig.vue`
**Build editor:** `views/builds/{BuildNew,BuildEdit,BuildImport}.vue`, `components/builds/BuildOrderEditor.vue`, `BuildOrderSectionEditor.vue` (44KB — the big one), `IconSelector.vue`, `IconAutoCompleteMenu.vue`, `IconToolTip.vue`
**Build detail:** `views/builds/BuildDetails.vue`, `FocusMode.vue`, `components/{Vote,Favorite,Comment,Discussion}.vue`
**Account:** `views/account/{Login,Register,Account,AccountAction,ResetPassword}.vue`
**Icons:** `src/assets/pictures_original_size/**` (~1000 AOE4 icon PNGs, civ-namespaced)
