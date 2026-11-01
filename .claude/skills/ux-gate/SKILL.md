---
name: ux-gate
description: Verify and self-review a visual or layout change in AoE4 Guides before the owner sees it — drive the real app with a throwaway Puppeteer rig at 360/393 (Android touch) and 960/1280, light and dark, measure edges, fills, radii, gaps and overflow, then check the result against the app's visual conventions. Use after any change to a .vue template or style, when asked to assess UX or "is this aligned / intentional?", to compare before/after against production, or to gate a task the way spec 038 did.
---

# UX gate

The owner reviews UI by eye, from screenshots, and finds mismatches fast: a
fill that matches nothing, a 4px corner beside 8px cards, a ▾ standing inside
the edge, a count shown twice. Each one found by them is a round trip. This
skill exists so they are found here first.

The bar is the eight principles in
[038's plan](../../../.specify/specs/038-mobile-ux/plan.md) ("UX principles for
every task") — they are not specific to that spec — and its gate rubric:
score task success, discoverability, touch ergonomics, consistency, desktop
regression 1–5; pass needs every acceptance criterion and nothing below 4.

## 1. The rig

```sh
# scratchpad, once per session
npm init -y >/dev/null && npm i puppeteer@23
cp <repo>/.claude/skills/ux-gate/scripts/rig.mjs .
# repo, in the background
npx vite --port 5173 --strictPort
```

`rig.mjs` has to sit next to its `node_modules` — Node resolves packages from
the importing file. Import `launch`, `open`, `measure`, `ink`, `visible` into
a short probe, or run `node rig.mjs builds ".selector"` for a report of one
selector at every width in both themes. Read the file's comments; the traps
below are encoded there:

- **Phones need a phone user agent.** The bottom navigation, Play → Focus and
  the hidden hamburger key off Vuetify's `platform` (android/ios), not the
  width (`isHandheld` in `usePlayTargetPreference.js`). A 393px viewport with
  a desktop UA renders a narrow desktop layout no phone ever shows. `open()`
  sets an Android UA at ≤599px.
- **Pick the visible instance.** Pages render some components twice (phone
  toolbar and sidebar card, mobile stack and sidebar), one hidden by a display
  class. Use `checkVisibility()`; `offsetParent` is null for every
  `position: fixed` element and reports the bottom nav as hidden.
- **Git Bash rewrites `/path` arguments** into Windows paths. Pass `builds`,
  not `/builds`.
- **Theme** is the localStorage key `aoe4-guides-theme` (`light`/`dark`), set
  before the first paint with `evaluateOnNewDocument`.
- **HMR:** a run straight after an edit can catch a reload mid-flight. Rerun
  once before believing a failure.
- **Blurry flags below the fold** are `lazy-src` placeholders, not a bug.
- **Before/after:** run the same probe against `https://aoe4guides.com/…`.
- **Signed-in pages** (My Builds, My Favorites, the editor) need the dev-only
  account `ux-test-mobile@example.com` on `aoe4-guides-dev`. Its password is
  not in the repo — ask the owner, and say plainly when those pages went
  unverified.
- **Home never reaches `networkidle` reliably** while the News card holds a
  YouTube embed: its ad traffic keeps the network busy, so `open()` can time
  out or a run can hang with the app perfectly fine. On Home, abort requests
  matching `youtube|ytimg|doubleclick|googlevideo|googlesyndication`, load with
  `domcontentloaded`, and wait. The trailer then draws as a grey box.
- **Screenshots for publishing** need real content, and dev only holds test
  builds. Fetch public builds from the API host in `buildService.js`, intercept
  the page's `buildService.js`, and swap `getBuilds`, `getBuildsCount` and
  `getBuild` for that data. Stub `incrementViews` too, or a read writes.

## 2. Measure, don't eyeball

| Question | How |
|---|---|
| Is it on the edge? | Compare drawn boxes (`measure`). For an icon, measure the **glyph** with `ink` — mdi glyphs carry side bearings (▾ has ~7px each side) |
| Same object family? | `bg` and `radius` of the new element against the neighbouring card |
| Tops level across columns? | `top` of both columns' first drawn boxes |
| Even rhythm? | Gaps between stacked items: Vuetify fields with details sit 22px apart; card padding is 16 |
| Overflow? | `pageOverflow` false at 360 |
| Text cut? | `clipped` on the text element itself; rows of equal height (`new Set` of heights) |

Screenshot at `deviceScaleFactor: 2`, clip to the region, and **look at every
screenshot before reporting** — numbers miss what a glance catches. Report
measurements in a small table, and list what was not verified (real devices,
iOS Safari, keyboard, signed-in states).

## 3. Self-review before showing it

Each of these was caught by the owner at least once:

- **Fill and corners come from the neighbours.** Anything drawn beside cards
  uses `color="surface"` and `rounded="lg"` (8px). `v-btn` defaults to 4px,
  and `tonal`/`text` derive a fill from the text colour that matches no
  surface in either theme.
- **A borderless control at an edge leaves invisible padding** — the ▾ of a
  text button stood 17px inside the list. Give the control a drawn box so the
  box aligns. Pulling it out with a negative margin was rejected: its hover
  fill and its anchored menu then cross the edge.
- **Align drawn edges**, both columns' tops and the list's left/right edges.
  A row taller than its button centres the button below the column top.
- **Say it once.** A fact shown twice within one glance (a count in the list
  header and under the sidebar button) is noise.
- **No label an icon already carries** ("Sort:" was removed).
- **No separator above a lone action.** A rule belongs between blocks.
- **Labels fit at 360.** A field squeezed beside a heading truncates its label
  ("S…"); give it a `min-width` so it wraps below instead.
- **Names never on busy imagery, information never hover-only** (principle 3).
- **Both themes.** Tokens that are equal in one theme differ in the other —
  see the `loading` note in CLAUDE.md.
- **Every new `mdi-*` icon is in `src/plugins/mdiIcons.js`** (CLAUDE.md).

Then run `npm run check:setup` (and `check:steps` if a build is read), and
present the result with the measurements, not just the screenshots.
