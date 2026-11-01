# Plan: Mobile UX Pass

**Branch**: `038-mobile-ux` | **Date**: 2026-10-30 | **Input**: mobile UX assessment of 30.10.2026
(phone emulation at 393×851, logged out against production, signed in against `aoe4-guides-dev`,
plus a code audit), and the owner's corrections to it.

## What this is for

Two people use this site on a phone, and they want different things from it.

- **The reader** is holding a phone next to a running game. They pick a civ, open a build, and press
  Play. Every tap they spend outside Focus mode is a tap not spent playing, and every accidental exit
  costs them their place mid-match.
- **The author** is writing or fixing a build away from a desk. They type numbers, pick icons and
  insert steps on a 360–430px screen with a virtual keyboard covering half of it, and the OS may
  kill the tab whenever they switch to the game or Discord to check something.

The assessment found that the site serves the reader well and the author poorly. This pass keeps
what works for the reader, closes the one hole in reader navigation, and makes authoring on a phone
something a person would choose to do rather than put up with.

## UX principles for every task

These are the bar each quality gate measures against. They are written so a reviewer can say yes
or no, not "sort of".

1. **Never strand the user.** Every hidden or dismissed control can be brought back by a gesture
   or tap the user can discover. A state that hides navigation is scoped to the page that set it.
2. **Back means back.** Android/browser Back undoes the last thing the user *opened* (a dialog, Focus
   mode) before it leaves the page.
3. **Touch is not a smaller mouse.** No information a user needs in order to act lives only in a
   hover tooltip. Primary tap targets are ≥ 44×44 CSS px *hit area*. The drawn element may be
   smaller, and density is preserved by overhanging the hit area rather than by adding layout.
4. **The right keyboard, at the right time.** A field gets the keyboard it needs (`inputmode`,
   `autocomplete`, `enterkeyhint`), and nothing raises the keyboard unasked on a touch device.
   Editable text on coarse pointers is ≥ 16px, so iOS does not zoom.
5. **Work is never silently lost.** An edit survives the tab being killed, and a crash path shows an
   honest state, not a blank page.
6. **Phones get phone actions.** Offer only what works on the device. A phone is not offered a
   floating window or "send to phone".
7. **Desktop does not regress.** Every change is checked at 1280px too. The mobile improvement must
   not cost the desktop user a feature, a tap, or layout stability.
8. **Borrow, don't invent.** Reuse the app's existing component, rule or pattern where one exists
   (CLAUDE.md, memory: *Borrow existing patterns*, *Prefer Vuetify components*).

## Owner decisions that shape the plan

- **Bottom nav (#1).** Hiding it on swipe-up is deliberate, to give more canvas, and swipe-down
  restores it. The defect is narrower: the hidden state **leaks** to other pages, where no swipe
  handler exists to bring it back.
- **Play / ⋮ menu (#6).** RTS Overlay is a website and stays in the ⋮ menu as is. On phones, Focus
  mode is the only reasonable Play target, so Play goes straight there.
- **Tooltip-only information (#10).** This is acceptable as a category. Make the information easy
  and discoverable enough, without turning every hint into permanent text.

## Tasks

The ratings are from the assessment (5 = change first). The acceptance criteria are what the UX
gate checks. "Phone" means 360×740 and 393×851 with touch, unless noted otherwise.

### T1 · Bottom nav is scoped to the page that hid it (rating 5)
**Problem.** One swipe-up on a build hides the bottom nav for the rest of the session. The hamburger
is suppressed on Android/iOS, so on every other page the user has no navigation at all.
**Intended behaviour.** Swipe-up on a build hides the nav, as now, and swipe-down restores it, as
now. Any route change shows the nav again.
**Acceptance.**
- On a build, swipe up: the nav hides. Swipe down: it returns.
- Swipe up on a build, then go Home via the logo, Back, or a link: the nav is visible on arrival.
- Ordinary scrolling on other pages behaves exactly as before.

### T2 · Back closes Focus mode instead of leaving the build (rating 4)
**Problem.** Opening Focus mode adds no history entry, so Back, the most likely accidental press
mid-game, leaves the build entirely, or the site for someone who arrived from Discord or Google.
**Intended behaviour.** Opening Focus mode pushes a history entry (`?focus=true`, the form `BuildDetails`
already reads). Back closes Focus mode and lands on the build at the same scroll position. ✕ does
the same as Back. A deep link with `?focus=true` still opens Focus mode, and closing it from there
removes the query without leaving the site.
**Acceptance.**
- build → Play → Back: you are on the build, still on the build URL, at the same scroll position.
- ✕ then Back: you go to the page before the build, not into Focus mode again.
- A direct load of `/builds/<id>?focus=true` followed by ✕ leaves you on `/builds/<id>`.
- The floating-window entry on desktop is unaffected.

### T3 · An icon picker that works on a phone (rating 4)
**Problem.** The search field autofocuses, so the keyboard covers the 538px grid. Icons are
unnamed except in hover tooltips, and six villager portraits are indistinguishable.
**Intended behaviour.** On phones the picker opens as a full-height sheet or fullscreen dialog,
using the app's own dialog pattern (e.g. `PickerDialog`), with:
- no autofocus on touch devices
- a visible short name under each icon
- a grid that fills the width
- a tap that inserts the icon where the caret was and closes the picker.

Desktop keeps today's menu, unchanged.
**Acceptance.**
- On a phone, opening the picker raises no keyboard.
- Every icon has a readable name.
- The grid has no horizontal scroll at 360px.
- The chosen icon lands at the caret position in the step text.
- The picker closes with ✕ and with Back.
- Desktop at 1280 is visually unchanged.

### T4 · Insert-step target you can hit (rating 4)
**Problem.** The divider between steps is the only way to insert mid-build on a phone. It
measures 329×16 at 35% opacity, and its own comment says 44px.
**Intended behaviour.** A ≥ 44px tall hit area that overhangs neighbouring margins, so the layout
does not grow, and a drawn affordance visible enough to be found (circle ≥ 24px, opacity ≥ .6).
**Acceptance.**
- `elementFromPoint` at ±20px around the divider's centre line returns the insert control.
- The distance between step cards changes by ≤ 8px.
- Tapping opens the insert menu.

### T5 · Editor drafts survive a killed tab (rating 4)
**Problem.** The only guard is `onBeforeRouteLeave`. A phone OS killing the background tab loses
all unsaved work.
**Intended behaviour.**
- While the editor is dirty, the working build is saved to `localStorage` (debounced, keyed by
  build id, or `new` for an unsaved build).
- On opening the editor with a draft newer than the stored build, a non-blocking banner offers
  **Restore** or **Discard**, showing when the draft was saved.
- Saving or publishing clears the draft.
- `beforeunload` warns while the editor is dirty.
- Drafts are per-device only, and that is stated nowhere because it is the obvious expectation.

**Acceptance.**
- Edit, reload: the banner appears. Restore brings back the edits, including steps inside
  alternatives blocks (use `forEachStep`/`flattenSections`; run `check:steps`).
- Discard removes the draft.
- Save, reload: no banner.
- A draft for one build never appears on another build.

### T6 · Play on a phone goes straight to Focus mode (rating 3, owner-adjusted)
**Problem.** Play's chooser offers "Floating window" and "Send to phone" on a phone. Mobile
Chrome has no Document Picture-in-Picture, and the user is holding the phone.
**Intended behaviour.** On phones, Play is a single full-width button that opens Focus mode, with
no split dropdown and no floating-window entry in the Focus mode header. Desktop keeps the chooser.
RTS Overlay stays in ⋮.
**Acceptance.**
- Phone: one tap on Play opens Focus mode, and no PiP control is visible there.
- Desktop: the chooser is unchanged.
- A touch tablet ≥ 960px keeps the chooser only if its targets actually work there.

### T7 · Sign-in forms that password managers understand (rating 3)
**Problem.** Email has `autocomplete="off"`, and the password field is `new-password` even when
logging in, so managers offer to generate a password instead of filling the saved one.
**Intended behaviour.**

| Field | Attributes |
|---|---|
| Login email | `autocomplete="username"`, `type="email"`, `inputmode="email"` |
| Login password | `autocomplete="current-password"` |
| Sign-up display name | `autocomplete="nickname"` |
| Sign-up email | `autocomplete="email"` (or `username`) |
| Sign-up password | `autocomplete="new-password"` |
| Reset password | `autocomplete="new-password"` |

`enterkeyhint` is set where it helps.
**Acceptance.** Attributes are correct in every mode and remain correct after switching
login ↔ sign-up inside the dialog.

### T8 · The right keyboard in the step editor (rating 3)
**Problem.** Resource and time cells are `contenteditable` with no `inputmode`, at 12.5–14px.
That brings up the full text keyboard, and iOS zooms the page on focus.
**Intended behaviour.**
- Resource cells: a digit keyboard, `enterkeyhint="next"`. *(Shipped as `inputmode="tel"`, not `numeric`: 5.8% of resource values in sampled public builds contain "+" — "4+1" — which numeric pads cannot type. Time shipped as `decimal`, whose separator key types "1.30".)*
- Time: a keyboard that can type the time format. Investigate whether digits-only entry can be
  formatted (e.g. `130` → `1:30`) using the existing time parsing. If not, keep the text keyboard.
- All editable text is ≥ 16px on coarse pointers, and the card layout does not overflow at 360px.

**Acceptance.**
- Attributes are present.
- Computed font size is ≥ 16px under `(pointer: coarse)`.
- No horizontal scroll at 360px.
- A desktop computed font size is unchanged.

### T9 · Favorites never renders blank (rating 3)
**Problem.** If the user's favorites document does not exist (a sign-up whose setup has not
finished, or an old account), `MyFavorites` throws, and the page shows only the filter box.
**Intended behaviour.** A missing document is treated as "no favorites". The page shows the same
empty state as zero favorites, with an invitation to heart a build. If that state does not exist
yet, add one in the app's existing empty-state style.
**Acceptance.**
- Test account with no favorites document: an empty state, no page error.
- With favorites: the list works as before.

### T10 · Hover-only hints become discoverable (rating 3, owner: "easy and discoverable enough")
**Problem.** Some information needed in order to act lives only in tooltips, which never open on
Android Chrome and stick on iOS. Examples: why an insert option is disabled, and what each Play
target does on desktop/tablet.
**Intended behaviour.** Where a hint explains a disabled action or a choice, it is shown inline,
as a list-item subtitle or helper text, at least on touch. Decorative or redundant tooltips stay
as they are. The scope is found by audit, not guessed. List what was changed and what was
deliberately left.
**Acceptance.**
- On a phone, every disabled option in the insert menu says why.
- No new hover-only information is introduced.

### T11 · The release banner stops owning the fold (rating 2)
**Problem.** The release banner fills the whole first screen on a phone. Returning visitors see
no builds and no civs without scrolling.
**Intended behaviour.**
- The first visit after a release shows the full banner.
- Later visits show a compact one-line strip, still linking the new civs, that expands on tap.
- The choice is read synchronously before first paint, so there is no layout shift (CLAUDE.md:
  *A reserved height must be measured, not derived*).

**Acceptance.**
- With the "seen" flag: the civ heading is above the fold at 393×851.
- Without the flag: the banner is as today.
- With storage blocked: the banner shows full, and nothing throws.
- No measurable layout shift on load.

### T12 · Filters that read well on a phone (rating 2)
**Problem.** Five stacked selects. Each open list covers the fields below. Whether filters are
active is not obvious while the panel is collapsed. *(The last point is to be verified by the
implementer before acting on it.)*
**Intended behaviour.** This is the smallest change that makes the state legible:
- the collapsed panel header says what is active (e.g. "Filters · 2"), or the chips show it
- the apply/reset controls stay reachable
- open lists are sized so they do not hide the control just tapped.

Do not rebuild filtering. Escalate if a bottom sheet seems necessary.
**Acceptance.**
- With two filters set, a collapsed panel makes that visible without expanding it.
- No regression on the civ page, `/builds` or desktop.

### T18 · Filters as a toolbar and bottom sheet (owner escalation of T12, 01.11.2026)
**Problem.** T12 made the collapsed panel legible, but the panel itself stayed the problem: opened,
its five selects and the sort pushed every result off screen, sort hid behind "Filters" and needed
an Apply, and each change cost expand → select → pick → scroll → apply.
**Intended behaviour (phones only; desktop sidebar unchanged).**
- A sticky toolbar first in the list column: Filters button with a count badge, the result count,
  and a Sort menu that applies at once. Applied filters show as one horizontally scrolling chip row;
  a chip tap removes that value and applies.
- The toolbar leaves and returns with the handheld app bar (`appBarHidden` in `Header.vue`).
- Filters open a bottom sheet holding the draft: Civ/Creator/Season as selects, Map and Strategy as
  chip groups, footer "Clear all" (filters only, never the sort) and "Show N results". Closing any
  other way drops the draft.
- After any apply, a reader scrolled into the list is returned to where the results begin.

**Acceptance.**
- Toolbar ≤ 57px without chips; sticky under the bar; parked off screen while the bar is hidden.
- No horizontal overflow at 360px; desktop renders the sidebar card exactly as before.

### T13 · Import is reachable on a phone (rating 2)
**Problem.** Import exists only in the desktop menu. The phone has no entry point.
**Intended behaviour.** Keep the FAB a one-tap Create, since it is the primary action. Add Import
where the intent to add a build already lands: the new-build editor's header or empty state, and
My Builds.
**Acceptance.** From a phone, Import can be reached in ≤ 2 taps from any page with the FAB, and the
FAB still creates a build in one tap.

### T14 · Small fixes (rating 1)
- Empty Map/Strategy fields in the editor show a clear ✕ when nothing is selected. Show it only
  when there is a value.
- The sign-up dialog subtitle is truncated ("…build or…"). Let it wrap.
- Build list card meta row is clipped ("t…"). Fix it **without changing the card's reserved height**
  (`BuildListCard`, CLAUDE.md). Prefer dropping the lowest-value item at xs over clipping a
  random one.
- `setBuilds` throws `e is not iterable` when a fetch path returns a non-array. Guard it, and find
  which path returns what.

**Acceptance.** Each item is visibly fixed at 360/393, and the card height is identical before and
after at every breakpoint.

### Deliberately not in this pass
- Out of the assessment's table: tapping an icon inside step text while editing opens AoE4World;
  the landscape-phone desktop table hides row actions behind hover; the `::` shortcut hint shown
  where it does not work; service worker / offline; per-theme manifest colours (a manifest cannot
  vary by colour scheme). Candidates for a follow-up.
- No visual redesign. The aesthetic and the reader flows that tested well stay as they are.

## Orchestration

Every task runs as **implement → UX gate → (fix → re-gate) → done**, each by its own agent.

**Implementer.**
- Reads this plan, CLAUDE.md and the relevant code.
- Implements the intended behaviour.
- Runs `npm run build`, `npm run check:setup`, the `mdi-*` allowlist check, and
  `npm run check:steps` when it touched anything that reads a build.
- Self-verifies with Puppeteer.
- Never commits.

**UX gate.**
- A separate agent with no stake in the implementation.
- Reviews the diff and drives the real app at 360×740 and 393×851 (touch), plus 1280×800, in dark
  *and* light, and landscape where the task touches it.
- Scores the task 1–5 on: task success, discoverability, touch ergonomics, consistency with the
  app, and desktop regression. It cites screenshots for each score.
- **Passes** only when every acceptance criterion holds and no dimension scores below 4.
- **Fails** with concrete findings. The implementer then gets one fix round. A second failure is
  escalated to the orchestrator.

**Waves.** Tasks touching the same files are serialized. Within a wave, tasks own disjoint files and
run in parallel against one shared dev server (`localhost:5173`, `aoe4-guides-dev`, HMR).

| Wave | Tasks | Main files |
|---|---|---|
| 1 | T1, T3, T7, T9, T11 | `Header`/`BuildDetails` swipe · `IconSelector` + its use in the section editor · `AuthDialog` · `MyFavorites` · home banner |
| 2 | T2, T4, T12, T13 | `BuildDetails`/`FocusMode` · section editor CSS · filter components · `App`/`MyBuilds`/import entry |
| 3 | T5, T6, T8 | `BuildEditor` · `BuildOrderEditor` Play · section editor fields |
| 4 | T10, T14 | `StepInsertMenu` & tooltips · small fixes |

**Test rig.** Throwaway Puppeteer in the session scratchpad, not in the repo. The signed-in states
use the dev-only test account `ux-test-mobile@example.com` (email-verified). Every concurrent run
uses its own Chrome profile directory.

## Review package for the owner

- The uncommitted working tree on `038-mobile-ux`.
- [tasks.md](tasks.md) with each task's gate score, rounds, and what was deliberately left.
- Before/after screenshots per task, in the session scratchpad.
- An explicit list of what was not verified on a real device, especially iOS Safari behaviour,
  which Chromium emulation cannot show.
