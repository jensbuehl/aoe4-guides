# Design Input — 023 Focus mode: floating window

Resolved values from the approved mock (`assets/Focus Mode PiP.html`). Where a number is given,
it is the number — don't re-derive it. Colours are the shipped Vuetify theme tokens; never a hex
literal in the component.

## 1. Tokens used

| Purpose | Token | Dark | Light |
|---|---|---|---|
| Focus-mode background | `background` | `#1D2432` | `#D8DCE0` |
| Step row background | `surface` at 40% over background | `#212A3A` | `#EFF1F3` |
| Dock / header background | `background` | `#1D2432` | `#D8DCE0` |
| Primary action, progress, icons | `primary` / `accent` | `#e7c05e` | `#294790` |
| Body text | on-surface | `#E6EAF1` | `#26303F` |
| Secondary text (preview line, counter) | on-surface @ 60% | `#8593A6` | `#6B7787` |
| Ghost control background | `primary` @ 12% | | |

Type: Inter (site body font). Nothing in focus mode below **11 px**; step content is the largest
text in the box at every tier.

## 2. Focus-mode structure

One root, `grid-template-rows: auto auto 1fr auto`:

```
┌ header ── pop-out · title · 3/42 · close ────────┐  auto
├ bars ──── overall progress / step progress ──────┤  auto (3px each)
├ step ──── content, next-step preview ────────────┤  1fr   (only flexing row)
└ dock ──── resource strip · transport ────────────┘  auto
```

`container-type: size; container-name: focus;` on the root. Nothing inside scrolls; the step row
is `display:flex; align-items:center; justify-content:center; text-align:center`.

### Tiers

| Tier | Applies when | Changes from full |
|---|---|---|
| **full** | default (dialog, phone) | icons 48 px, step type 19 px, play 56 px, other controls 40 px, title 2 lines |
| **compact** | `max-width: 520px` or `max-height: 300px` | icons 38 px, step type 16 px, play 40 px, others 30 px, title 1 line, dock padding 7 px |
| **micro** | `max-width: 340px` or `max-height: 190px` | header row dropped, preview line dropped, dock becomes one row (resources left, transport right), icons 34 px, step type 14 px, play 32 px, others 26 px, resources reduced to time + villagers |

Container queries, not `$vuetify.display` — the PiP window is a separate document.

### Resource strip

`time` (in `primary`) · villagers · then only the resource columns the **current step states**.
An unstated column is absent, not blank. Values keep the existing `villagerAggregator` parsing,
including its defects, so the strip can never disagree with the build order table.

### Next-step preview

`next 0:45` plus **at most one** token:

1. an age-up ahead → `⬆ Feudal` (always wins),
2. else the resource delta the next step introduces → `+1 gold`,
3. else nothing.

Omitted on the last step and in micro. 11.5 px, secondary colour.

### Transport

`prev · audio · PLAY/PAUSE · villager-announcements · next`, centred. Play/pause is filled
`primary` and the largest control; the rest are ghost circles on `primary @ 12%`. When audio is off
the villager-announcements control is hidden, as today. In compact and micro the announcements
control moves into a `v-menu` overflow.

Hit targets: ≥44 px full, ≥26 px compact/micro.

## 3. The floating window

Requested size **400 × 230** → compact tier. Usable range **320 × 150** (micro) to anything larger
(compact until 520/300, then full). The OS window title is the build title, so the in-window title
is redundant below compact.

Lifecycle:

```
click → requestWindow({width:400, height:230})
      → clone <style> and <link rel=stylesheet> into pip.document.head
      → copy documentElement.className + colorScheme
      → remember current parent, appendChild(focusRoot) into pip body
      → bind keyup on pip.document, release wake lock, active = true

pagehide (user closed it, opener navigated, tab closed)
      → appendChild(focusRoot) back to remembered parent
      → unbind pip keyup, re-request wake lock, active = false
```

Reuse `documentPictureInPicture.window` when non-null — the platform permits one window per tab.
`disallowReturnToOpener: false` so the browser's own "back to tab" affordance stays.

Theme changes while open: re-copy the class list and re-clone Vuetify's generated theme stylesheet;
static clones do not follow the theme.

## 4. Play control

Vuetify `v-btn-group`, `density="comfortable"`, inside the existing 36 px section header:

- Body: `color="primary"` `variant="flat"`, `prepend-icon="mdi-play"`, label **Play**, 28 px tall.
- Caret: same group, `mdi-menu-down`, 26 px wide, opens a `v-menu` anchored bottom-end, 268 px wide.

Menu items — icon, title, one line of description:

| Icon | Title | Description |
|---|---|---|
| `mdi-play-circle-outline` | Play here | Full-screen focus mode in this tab. |
| `mdi-picture-in-picture-bottom-right` | Floating window | Stays above the game on one monitor. |
| `mdi-cellphone-link` | Send to phone | QR code, opens focus mode there. |

Floating window is omitted entirely when unsupported. Overlay export is **not** in this menu — it
stays in the build's overflow menu, because it hands off to another application rather than
starting a session here.

xs: the group becomes a full-width `block` button directly beneath the section header.

Copy for the failure snackbar: **"Your browser blocked the floating window. Playing here instead."**

## 5. What is deliberately not changed

- Voice-over text, villager announcement text, autoplay step advance rules.
- The QR/share dialog and the overlay export.
- Swipe left/right gestures in focus mode.
- Keyboard map: `←` previous, `→` next, `space` play/pause.
- The build order table, the timeline card, the editor.
