# Contract: Search UI (Layout A)

## Entry points

| Breakpoint | Element in `Header.vue` | Behaviour |
|---|---|---|
| lg and up | `Header.vue`: pill with a faint fill, magnifier, "Search builds…", "Ctrl K" / "⌘K" hint (`aria-keyshortcuts`) | opens dialog |
| md | `Header.vue`: icon button `mdi-magnify`; "Add Build ▾" shows as "+ ▾" (same menu) to make room | opens dialog |
| below md, phone (Android/iOS UA) | bottom navigation item "Search" (between All Builds and Favorites; 5 items signed in, sharing the width) | opens full-screen dialog |
| below md, other | hamburger menu item "Search", first in the list | opens full-screen dialog |
| any | Ctrl/⌘+K (advertised), or `/` with or without Shift (German layout: Shift+7), when the focus is not in an input, textarea, select or contenteditable; Ctrl+Shift+K is left to the browser | opens dialog |

Measured 2026-11-24 (ux-gate): the header does not wrap at 320, 360, 393, 960, 1279, 1280 or 1920,
signed in or out; the bottom navigation's five items span 360px exactly, 72px each. At 320 two labels
break onto two lines ("All / Builds", "My / Builds"); 320 is below the widths this project gates.

## Dialog

| | Desktop (mdAndUp) | Phone (smAndDown) |
|---|---|---|
| Container | `v-dialog`, `max-width=640`, aligned to the top through `content-class` (Vuetify's default positioning centres it and ignores `location`) | `v-dialog fullscreen` |
| Field | `v-text-field`, autofocus, clearable, placeholder "Search builds, authors, civs" | same, in a top bar with ✕ |
| Close | Esc, click outside, ✕ | ✕, system **back** |
| History | via the shared `useOverlayHistory` composable (also used by the editor's icon sheet): pushes one entry on open; closing by any means removes it; back pops it | same |

## States

| State | Shown |
|---|---|
| Opened, index loading, empty query | field focused; skeleton list rows |
| Loading, query typed | skeleton; the query is applied when the index arrives, without retyping (US4 #4) |
| Empty query, index loaded | hint line "Try a title, an author or a civ, e.g. *rus fast castle*", then **Trending** (top 8 of the index, which is sorted by the Trending score); keyboard navigation reaches them |
| 1 character | nothing (no civ code or alias is one character) |
| Results | groups in order **Civilization** (≤1), **Author** (≤3), **Builds · N** (≤20, N = total) |
| More than 20 builds | footer: "Showing 20 of N. Add a word or a civ to narrow it." |
| No results | "No builds found for *query*", plus a link to All Builds |
| Load failed | "Search can't load right now", plus a link to All Builds |

## Result rows

| Type | Leading | Title | Subtitle | Opens |
|---|---|---|---|---|
| Civilization | `CivFlag` | civ title | "Civ page · N builds" | `/civ/<slug>` |
| Author | `UserAvatar` (initials fallback; no extra reads) | display name | "N builds" | `/builds?author=<uid>` |
| Build (plain row markup, not `v-list-item`; see research R7) | `CivFlag` | title, matched parts highlighted | author · season chip · Feudal and Castle times via the existing `AgeChips` component (`[{ age: 2 | 3, seconds, derived }]`; side by side on desktop, stacked below 600px), so the crest, "~" for estimated and the spoken label match the build cards; nothing when the build has neither | `/builds/<id>` |

Highlighting uses the theme's `primary` colour on the matched span. No `v-html` with user text:
spans are built from the string positions.

## Keyboard

| Key | Effect |
|---|---|
| ↓ / ↑ | move active row across groups, wraps |
| Enter | open active row (first row if none active) |
| Esc | close |
| Tab | leaves the field to the list normally (no trap override beyond Vuetify's) |

The field carries `role="combobox"`, `aria-expanded`, `aria-controls` pointing at the list, and
`aria-activedescendant`. Rows are `role="option"`.

## Navigation

Opening a result closes the dialog, then routes with `router.push`. The dialog's own history entry
is removed first, so Back from the build returns to the page search was opened on, not to an open
dialog.
