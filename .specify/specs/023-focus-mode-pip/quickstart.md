# Quickstart — 023 Focus mode: floating window

How to run this feature, verify it, and check the Success Criteria by hand. There is no automated
suite; the constitution asks for manual golden-path verification, and SC-001…SC-007 are written to
be that script.

---

## Run

```bash
npm install      # if not already
npm run dev
```

Open a build with resolvable step times — the floating window is offered on every build, but
autoplay and the drift criteria need a build whose steps have parseable timings. A legacy flat build
with no timings shows only prev/next, by design (spec edge cases).

**Browser**: Chrome or Edge for the floating window. Firefox and Safari are the control group for
SC-004 — the menu should show two items and no console warning.

**Important**: the player must run the game **windowed or borderless fullscreen**. Exclusive
fullscreen covers every always-on-top window, including this one — an OS behaviour, not something
the feature can work around. Worth saying out loud to anyone testing it.

---

## T005 spike — do this first

Before Phase 3 is designed in detail, settle the one open question from
[research.md](./research.md) R-1.

```js
// In the opener console, with a PiP window open:
const pip = documentPictureInPicture.window;
let n = 0, t0 = Date.now();
pip.setInterval(() => {
  console.log(++n, ((Date.now() - t0) / 1000).toFixed(1) + 's');
}, 1000);
```

Now focus another application and leave the opener tab hidden for **more than five minutes**, since
Chrome's intensive throttling only engages after that. Come back and read the log.

- **Ticks stayed ~1/s** → the PiP window is not throttled. FR-024 alone is enough; layer 3 is never
  built.
- **Ticks dropped to ~1/min** → build the Web Worker fallback (research.md R-3, layer 3).

Either way the feature ships, because FR-016 keeps the *times* correct regardless. This spike decides
how *late* an update can be, not whether it is right.

---

## Verify — Success Criteria

### SC-001 — no drift over 10 steps *(needs the Phase 0 fix landed)*

Start autoplay in the floating window, click into another application, wait through ten steps with a
stopwatch. Compare each transition against the build's stated times. **Tolerance: 1 s.**

This is the criterion the whole clock design exists for. If it fails, check FR-016 before FR-024 —
a wrong anchor produces drift that no tick rate can fix.

### SC-002 — state survives the move, both ways

On a 42-step build: start autoplay, let it reach a middle step, pop out. Then close the window.

Check at **both** transitions: step index, elapsed time, autoplay running, audio setting. Nothing
restarts, and the current step is **not** re-spoken (US1 scenario 2).

### SC-003 — operable small

Resize the floating window to **320×150**, **400×230** and **600×340**.

At each: no scrollbar, no clipped control, no text below 11 px, every hit target ≥ 26 px. At 320×150
the header row and the preview line are gone and the dock is one row with only time and villagers.

### SC-004 — nothing regresses without the API

In Firefox and Safari: the split button works, the menu has exactly two items, focus mode behaves as
it does today, and **no console warning mentions picture-in-picture**.

### SC-005 — header unchanged

The Build Order section header is still **36 px** and the card still lines up with Description and
Timeline. Compare against `main` side by side — this is easy to break by a pixel and hard to notice.

### SC-006 — phone has no voids

At 390×844: no empty resource columns, and the step row fills the space between header and dock.
Steps that state no wood/gold/stone show **no** column for them, not a blank one.

### SC-007 — Play is findable

The play control is the only filled button in the Build Order card.

---

## Things that are easy to get wrong

| Symptom | Likely cause |
|---|---|
| Session restarts on pop-out | The node was cloned or re-mounted instead of moved (contract C-3) |
| Elapsed time jumps when popping out | The tick swap re-anchored the clock — FR-025 says it must not |
| Manual prev/next stops working after the FR-016 fix | Forgot to re-anchor on manual step change (data-model §4) |
| Window survives navigating to another build | Relying on the platform to close it — it only closes on a *document* navigation, and this is an SPA (research.md R-4) |
| PiP window is unstyled or wrong-themed | Stylesheet copy skipped, or a theme change after the copy (R-5) |
| Overflow menu opens in the wrong window | `v-menu` teleported to the opener's body — attach it to the focus-mode root (contracts, failure modes) |
| Wake lock still held while floating | FR-015 — release on move, re-request on return |

---

## Commit sequence

Per plan.md. Each is its own commit; Phase 1 must show **no behaviour change**.

```
main    fix: derive elapsed time from a wall clock instead of counting ticks
  023   refactor: restructure focus mode as a fixed-row grid
  023   feat: density tiers for focus mode
  023   feat: document picture-in-picture target for focus mode
  023   feat: promote play to a split button with targets
```
