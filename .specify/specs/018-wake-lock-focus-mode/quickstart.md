# Quickstart: Manual Verification — Screen Wake Lock in Focus Mode

**Feature**: 018-wake-lock-focus-mode | **Date**: 2026-07-31

The project has no test framework, and whether a physical display dims is not observable from a browser context regardless. Verification is manual, per the constitution's golden-path rule.

---

## ⚠ Read this first: the LAN-testing trap

**Do not verify on a phone by pointing it at the Vite dev server's LAN IP** (`http://192.168.x.x:5173`).

`navigator.wakeLock` is gated by the platform to secure contexts. `localhost` counts as secure, so `npm run dev` works fine on the dev machine — but a LAN IP over plain HTTP does not, and the API is simply **absent** there. The feature will silently take the unsupported path, the screen will dim, and you will conclude it is broken when it was never active.

For any on-device test, use one of:

- a **Netlify deploy preview** for the `018-wake-lock-focus-mode` branch (simplest — HTTPS by default), or
- an **HTTPS tunnel** to the dev server.

**Fast sanity check before you start**: open focus mode and look for the wake-lock indicator in the control row. If no sleep icon appears at all, `isSupported` is false and you are on an insecure origin or an unsupported browser — fix that before running anything below.

---

## Setup

```powershell
npm run dev          # desktop scenarios only
```

Then open any build order and press the focus-mode button in the build-order editor toolbar.

The **indicator** in the control row is the primary in-page signal throughout:

| Indicator | Meaning |
|---|---|
| `mdi-sleep-off` ("Screen is being kept on") | Lock held — `isActive` true |
| `mdi-sleep` ("Screen may dim") | Supported, but not currently held |
| *no icon* | Unsupported or insecure origin |

Keep the browser console open for every scenario. **Any unhandled promise rejection is a failure**, even where the visible behaviour looks correct.

---

## Scenario 1 — Screen stays lit, autoplay running (US1, FR-001, FR-002)

**Device**: phone, over HTTPS. Set the display-sleep timeout to its shortest setting (typically 15 or 30 s).

1. Open a build order in focus mode.
2. Confirm the indicator shows `mdi-sleep-off`.
3. Start autoplay.
4. Put the phone down and **do not touch the screen** for 3× the sleep timeout.

✅ **Pass**: display stays lit and the current step stays readable throughout.
❌ **Fail**: display dims or blanks.

---

## Scenario 2 — Screen stays lit without autoplay (US1, FR-001)

The design call under test: the lock is tied to focus mode being *open*, not to autoplay running.

1. Open focus mode. **Do not** start autoplay.
2. Confirm the indicator shows `mdi-sleep-off`.
3. Advance one step manually (swipe or arrow key), then leave the phone untouched for 3× the sleep timeout.

✅ **Pass**: display stays lit. Indicator still `mdi-sleep-off`.
❌ **Fail**: display dims — the lock is wrongly coupled to autoplay.

---

## Scenario 3 — Desktop screensaver (US1, FR-001)

**Device**: desktop, Chrome or Edge. Set the OS display-blank/screensaver timeout to ~1 minute.

1. Open focus mode and leave the machine untouched past the timeout.

✅ **Pass**: the display does not blank and the screensaver does not start.

---

## Scenario 4 — Alt-tab survival (US2, FR-004) ← the one that catches regressions

This is the scenario that fails if the visibility-change re-acquisition breaks. It is also the one a five-second smoke test will miss.

1. Open focus mode. Confirm `mdi-sleep-off`.
2. Switch to another tab or application. Wait ~5 seconds.
3. Switch back. **Confirm the indicator has returned to `mdi-sleep-off`** without you touching anything.
4. **Repeat steps 2-3 ten times.**
5. After the 10th return, leave the device untouched past the display-sleep timeout.

✅ **Pass**: the indicator returns to `mdi-sleep-off` on every one of the 10 returns, and the screen still stays lit after the last one (SC-002).
❌ **Fail**: the indicator stays `mdi-sleep` after any return — the lock became a one-shot.

While hidden (step 2), the device is *expected* to be free to sleep normally; that is correct behaviour, not a bug.

---

## Scenario 5 — Release on close (US1, FR-003, FR-010, SC-005)

1. Open focus mode, confirm `mdi-sleep-off`.
2. Close focus mode with the ✕ button.
3. Leave the device untouched past its display-sleep timeout, still on the build detail page.

✅ **Pass**: the display sleeps normally — the lock did not leak past focus mode.

Repeat with **browser back** and with **navigating away via a link** instead of the ✕ button. All three must release.

---

## Scenario 6 — Rapid open/close (edge case, I2)

1. Open and close focus mode 10 times in quick succession.
2. After the final close, leave the device untouched past the sleep timeout.

✅ **Pass**: display sleeps normally; no console errors; no accumulated locks.

---

## Scenario 7 — Refused request degrades silently (US3, FR-006, FR-009, SC-003)

Trigger a refusal by enabling **battery-saver / low-power mode** on a phone (the realistic cause on the devices this feature targets), then:

1. Open focus mode.
2. Verify **every** other capability behaves exactly as before: step navigation via swipe and arrow keys, autoplay start/pause, the step timer counting, voice-over speaking, villager-announcement toggle, the resource row.
3. Check the console.

✅ **Pass**: focus mode is fully functional; **no error, warning, prompt, or permission dialog is shown to the player**; no unhandled promise rejection in the console. Indicator shows `mdi-sleep` (accurate) or is hidden — never `mdi-sleep-off`.
❌ **Fail**: any visible error, or an unhandled rejection in the console (SC-004).

---

## Scenario 8 — Unsupported browser degrades silently (US3, FR-005, SC-003)

**Device**: an iOS version below 16.4, an in-app browser (e.g. opening the link from a chat app), or a desktop browser without wake-lock support.

1. Open focus mode and exercise the same capability list as Scenario 7.

✅ **Pass**: everything works as it did before this feature; the indicator is absent; nothing is logged as an unhandled failure.

---

## Scenario 9 — Voice-over failure does not disable the wake lock (FR-008)

Verifies the ordering fix. Simplest reproduction: a browser or device profile where speech synthesis is unavailable or has no voices installed.

1. Open focus mode where voice-over cannot initialise.
2. Check the indicator.

✅ **Pass**: indicator shows `mdi-sleep-off` — the screen is still held awake even though voice-over failed.
❌ **Fail**: indicator shows `mdi-sleep` or is missing on a supporting browser — acquisition is still sitting behind the voice-over `await`.

If a device with broken speech synthesis is not available, this can be forced by temporarily making `initTextToSpeech()` reject in a local build. **Revert before committing.**

---

## Scenario 10 — Long session (edge case, SC-001)

1. Open focus mode on a phone over HTTPS and follow a long build order for **30+ minutes**, alt-tabbing to the game as you normally would.

✅ **Pass**: the screen is lit for the whole session, not just an initial window. The indicator is `mdi-sleep-off` every time you look at it.

---

## Scenario 11 — Indicator correctness (US4, FR-013, SC-006)

1. Open focus mode on a supporting HTTPS origin → indicator present, `mdi-sleep-off`.
2. Open focus mode in an unsupported environment (Scenario 8) → indicator absent.
3. In both cases, confirm the indicator does not obscure the current step text, the resource row, or any existing control, at both mobile (xs) and desktop widths.
4. Hover/long-press the indicator → tooltip text matches the state.

✅ **Pass**: the two environments are visually distinguishable within 5 seconds without opening developer tools, and nothing is overlapped.

---

## Sign-off checklist

- [ ] S1 Screen stays lit with autoplay (phone, HTTPS)
- [ ] S2 Screen stays lit without autoplay
- [ ] S3 Desktop screensaver suppressed
- [ ] S4 Survives 10 alt-tab cycles ← **do not skip**
- [ ] S5 Releases on close, back, and navigate-away
- [ ] S6 Rapid open/close leaves nothing held
- [ ] S7 Refused request: silent, fully functional
- [ ] S8 Unsupported browser: silent, fully functional
- [ ] S9 Voice-over failure does not block the lock
- [ ] S10 30-minute session stays lit
- [ ] S11 Indicator accurate and unobtrusive at xs and desktop
- [ ] **Zero unhandled promise rejections observed in any scenario** (SC-004)
