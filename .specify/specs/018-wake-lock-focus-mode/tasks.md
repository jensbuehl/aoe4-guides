---

description: "Task list for 018-wake-lock-focus-mode"
---

# Tasks: Screen Wake Lock in Focus Mode

**Input**: Design documents from `.specify/specs/018-wake-lock-focus-mode/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [quickstart.md](quickstart.md)

**Tests**: No automated test tasks. The project has no test framework (`package.json` scripts are `dev`, `build`, `preview`, `check:icons`), the constitution requires manual golden-path verification instead, and whether a physical display dims is not observable from a browser context. All verification tasks below are manual and trace to a numbered scenario in [quickstart.md](quickstart.md).

**Organization**: Tasks are grouped by user story for traceability. Read the two constraints below before scheduling anything.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files or different physical devices, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Include exact file paths in descriptions

## ⚠ Two constraints that shape this whole list

**1. Every code change lands in one file.** All five code tasks edit `src/components/builds/FocusMode.vue`. No code task is parallelizable — `[P]` appears only on verification tasks that use a genuinely different device. Do not schedule two code tasks concurrently.

**2. Verification is only meaningful after *all* code tasks are done.** The story-by-story grouping below exists for requirement traceability, not to suggest you can test US1 against a half-edited file. Complete T004, T006, T007, T011, T012 first, then run the verification tasks. See [Recommended Execution Order](#recommended-execution-order).

## Path Conventions

Single Vue SPA at repository root. The only source path used in this feature is `src/components/builds/FocusMode.vue`. Line numbers cited below refer to the file's pre-change state.

---

## Implementation Status (updated 2026-07-31)

**All code is written and the build passes. No device verification has been done.**

| Group | Tasks | Status |
|---|---|---|
| Code changes | T008, T010, T011 | ✅ Applied |
| Indicator (US4) | T016, T017, T018 | ❌ **Dropped** — see below |
| Cleanup after dropping US4 | T020 | ✅ Applied |
| Build + self-review | T021, T022 | ✅ Passed |
| Test surface + baseline | T001, T002 | ⏳ Not done |
| Manual device verification | T003–T007, T009, T012–T015, T018, T019 | ⏳ Not done |
| Sign-off | T023 | ⏳ Blocked on the above |

**14 of 23 tasks remain, and every one of them requires a physical device, a battery-saver toggle, an older-iOS or in-app browser, or an OS screensaver timer.** None can be completed from a terminal. The feature is code-complete but **unverified** — treat it as unmerged until the quickstart sign-off is filled in.

**US4 / FR-013 dropped by product decision (2026-07-31).** The indicator was built, then removed: it explains something the player does not need explained — if the screen stays on, that is the whole message. It also failed to render, because `mdi-sleep-off` was never added to the tree-shake allow-list in `src/plugins/mdiIcons.js`; needing a registry entry plus a tooltip plus two states to say "your screen is on" confirmed it was not worth its weight. T020 was applied instead: `isSupported` and `isActive` are gone from `setup()`. Note `isSupported` was dead before this feature too (returned at line 594, never rendered), so this is a net cleanup. Quickstart scenarios now verify via device behaviour and the console rather than the indicator; Scenario 11 no longer applies.

⚠ **T002 was skipped out of order.** It asked for a pre-change baseline capture on the *unmodified* branch, and the code edits were applied before it ran. To recover it, `git stash` the working tree, capture the baseline on the clean file, then `git stash pop`. Impact is low — the diff is 29 lines and independently reviewable — but "already worked" vs "we broke it" is no longer distinguishable by observation alone for FR-001/002/003, which is exactly what the US1 regression guard was for.

---

## Phase 1: Setup

**Purpose**: Establish a test surface that can actually exercise the feature, and a baseline to attribute regressions against.

- [ ] T001 Establish an HTTPS-reachable test surface for the `018-wake-lock-focus-mode` branch — either a Netlify deploy preview or an HTTPS tunnel to the dev server. **Do not skip.** `navigator.wakeLock` is secure-context-gated, so reaching the Vite dev server from a phone over a LAN IP (`http://192.168.x.x:5173`) makes the API absent entirely and every on-device test yields a convincing false negative ([research.md](research.md) R7). `localhost` on the dev machine is a secure context and is fine for desktop-only scenarios.
- [ ] T002 Capture pre-change baseline on the unmodified branch: open focus mode in Chrome/Edge on desktop, confirm via DevTools console that `navigator.wakeLock` is present, and confirm the console is clean on open and on close. This is what makes "already worked" distinguishable from "we broke it" during later verification.

---

## Phase 2: Foundational (Blocking Prerequisites)

**No foundational tasks.** This phase is intentionally empty rather than padded.

The feature adds no shared scaffolding: no new file, no new dependency, no new state, no schema, no route, no service. It consumes `isSupported` and `isActive` that the existing `@vueuse/core` composable already returns, and every edit is local to one component. There is no work that must land before story work can begin.

**Checkpoint**: Setup complete — story implementation can begin.

---

## Phase 3: User Story 1 - Screen stays lit for the whole follow-along session (Priority: P1) 🎯 MVP

**Goal**: The display stays lit for the entire time focus mode is open, whether the player is using autoplay or advancing steps by hand, and returns to normal sleep behaviour on close.

**Independent Test**: Open focus mode on a phone with a short display-sleep timeout, do not touch the screen, and confirm the display stays lit past the timeout.

**⚠ No code tasks.** FR-001, FR-002, and FR-003 are already satisfied by commit `b9b1897` — the lock is acquired on mount regardless of autoplay state and released in `onBeforeUnmount` ([research.md](research.md) R2, R8). This phase is a **regression guard**: it proves the shipped behaviour still holds after the other stories' edits. That is why the MVP here costs verification effort but no implementation effort.

### Verification for User Story 1

- [ ] T003 [US1] Verify quickstart Scenario 1 (phone, HTTPS, autoplay running, untouched for 3× the display-sleep timeout — screen stays lit)
- [ ] T004 [US1] Verify quickstart Scenario 2 (phone, HTTPS, autoplay **not** running, manual step advance only — screen still stays lit; proves the lock is tied to focus mode being open, not to autoplay)
- [ ] T005 [P] [US1] Verify quickstart Scenario 3 on a **desktop** machine with a ~1-minute screensaver timeout (display does not blank) — runs on different hardware, so parallel with the phone scenarios
- [ ] T006 [US1] Verify quickstart Scenario 5 (release on close): confirm normal sleep behaviour resumes after closing via the ✕ button, after browser back, and after navigating away via a link — all three paths
- [ ] T007 [US1] Verify quickstart Scenario 10 (30+ minute session with real alt-tabbing — screen lit for the whole session, not just an initial window)

**Checkpoint**: User Story 1 verified independently. This is the MVP — the feature's core value is demonstrably intact.

---

## Phase 4: User Story 2 - Wake lock survives switching away and back (Priority: P1)

**Goal**: The lock is re-established automatically every time the player returns to the focus-mode tab, without limit.

**Independent Test**: Open focus mode, alt-tab away and back repeatedly, then leave the device untouched past its sleep timeout and confirm the screen stays lit.

**Note**: The re-acquisition mechanism itself already works — the composable's `whenever(visible && requestedType)` watcher re-arms on every cycle ([research.md](research.md) R2). The one code change here closes a *different* visibility defect: the path taken when focus mode opens while the tab is already hidden.

### Implementation for User Story 2

- [X] T008 [US2] In `src/components/builds/FocusMode.vue` (line 371), change `await request();` to `await request("screen");`. With no argument, the composable's hidden-document branch stores `requestedType = undefined`, and its re-acquire watcher guards on that value being truthy — so the lock would never be acquired for a session that starts hidden. Passing the type explicitly removes the dead path and stops correct behaviour from resting on a Web IDL default ([research.md](research.md) R3).

### Verification for User Story 2

- [ ] T009 [US2] Verify quickstart Scenario 4 — **the regression-catcher, do not skip.** Alt-tab away and back **ten times**, confirming the indicator returns to `mdi-sleep-off` on every single return, then confirm the screen still stays lit past the sleep timeout after the 10th cycle (SC-002). A five-second smoke test will not catch a one-shot lock; this will.

**Checkpoint**: User Stories 1 and 2 both verified. The feature now survives the single most common thing an AoE4 player does.

---

## Phase 5: User Story 3 - Silent, harmless degradation where wake lock is unavailable (Priority: P2)

**Goal**: Where the lock is unsupported or refused, focus mode behaves exactly as it did before this feature — no error, no warning, no prompt, no unhandled rejection.

**Independent Test**: Open focus mode with battery-saver enabled (or on an unsupported browser) and confirm every other focus-mode capability works with a clean console.

**This phase contains the feature's only real defect fixes.** Refusal is not theoretical: `NotAllowedError` is reachable on battery-saver, which is exactly the state of a phone propped up next to a monitor ([research.md](research.md) R4).

### Implementation for User Story 3

- [X] T010 [US3] In `src/components/builds/FocusMode.vue`, hoist the wake-lock acquisition from line 371 to **above** `await initTextToSpeech();` (line 364) and wrap it in `try { await request("screen"); } catch { /* wake lock refused — degrade silently */ }`. Two defects, one edit: (a) unguarded, a rejection in an `async onMounted` callback escapes as an unhandled promise rejection (FR-006, FR-009); (b) sitting after the voice-over `await`, a speech-synthesis failure aborts the hook before the lock is ever requested, letting an unrelated capability silently disable screen-awake (FR-008). Ordering satisfies FR-008 in both directions with no extra try/catch around the TTS call. Depends on T008 — same statement.
- [X] T011 [US3] In `src/components/builds/FocusMode.vue` (line 377), change `release();` to `release().catch(() => {});`. `onBeforeUnmount` is synchronous so the promise cannot be awaited; a rejection would escape unhandled (FR-007). **Do not remove the `release()` call** — `useWakeLock` registers no scope-dispose cleanup, so the sentinel outlives the component without it, which is what upholds FR-003 and FR-010 ([research.md](research.md) R2).

### Verification for User Story 3

- [ ] T012 [US3] Verify quickstart Scenario 7 (battery-saver / low-power mode on a phone): focus mode fully functional — swipe, arrow keys, autoplay, timer, voice-over, villager toggle, resource row — with no visible error and no unhandled rejection in the console
- [ ] T013 [P] [US3] Verify quickstart Scenario 8 on an **unsupported browser** (iOS below 16.4, or an in-app browser opened from a chat app): same capability sweep, indicator absent, nothing logged as an unhandled failure — different device, so parallel with T012
- [ ] T014 [US3] Verify quickstart Scenario 9 (voice-over failure does not disable the wake lock): on a profile where speech synthesis is unavailable, confirm the indicator still shows `mdi-sleep-off`. If no such device is available, force it by temporarily making `initTextToSpeech()` reject in a local build — **revert before committing.**
- [ ] T015 [US3] Confirm zero unhandled promise rejections in the browser console across every scenario run so far, on both a supporting and a refusing environment (SC-004). This is the single acceptance signal for the two fixes in T010 and T011.

**Checkpoint**: All three primary stories verified. The feature is complete and shippable without User Story 4.

---

## Phase 6: User Story 4 - The player can tell whether their screen is being held awake (Priority: P3)

**Goal**: A visible, non-intrusive signal of whether the lock is currently held — distinguishable within 5 seconds without opening developer tools.

**Independent Test**: Open focus mode in a supporting environment and in an unsupported one, and confirm the two are visually distinguishable.

**Scheduling note**: P3 by user value, but this is the **test instrument** for every scenario above — the quickstart's fast sanity check and Scenarios 4, 9, and 11 all read the indicator. Implementing T016–T017 early makes all other verification far easier. If you defer this phase instead, verification falls back to inspecting wake-lock state in the DevTools console, and T020 becomes mandatory.

### Implementation for User Story 4

- [X] T016 [US4] In `src/components/builds/FocusMode.vue`, add `isActive` to the object returned from `setup()` (alongside the existing `isSupported` at line 594). It is already destructured at line 319 but never returned.
- [X] T017 [US4] In `src/components/builds/FocusMode.vue`, insert the indicator into the control row after the villager-announcement tooltip block (after line 258, before the Next-step tooltip): a `v-tooltip location="top"` whose activator is a `v-icon` with `v-if="isSupported"`, `color="accent"`, `class="ma-2"`, and `:icon="isActive ? 'mdi-sleep-off' : 'mdi-sleep'"`, with tooltip text switching between "Screen is being kept on" and "Screen may dim". Use `v-icon` not `v-btn` — the indicator is non-interactive by design, since there is no manual off switch and a button would imply an action that does not exist. Gate on `isSupported` so it is hidden entirely where unavailable, matching the `v-if`-gated pattern of every other control in this row (Constitution III). Markup shape is in [plan.md](plan.md) §3. Depends on T016.

### Verification for User Story 4

- [ ] T018 [US4] Verify quickstart Scenario 11: indicator present and `mdi-sleep-off` on a supporting HTTPS origin, absent on an unsupported one, tooltip text matches state, and it does not overlap the step text, the resource row, or any existing control — checked at both xs (mobile) and desktop widths

**Checkpoint**: All four user stories verified.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [ ] T019 Verify quickstart Scenario 6 (open and close focus mode 10 times rapidly): display sleeps normally after the final close, no console errors, no accumulated locks (invariant I2)
- [X] ~~T020~~ **N/A** — Phase 6 was completed, so `isSupported` and `isActive` are both consumed by the indicator. FR-012 is satisfied by use rather than deletion. Original task text: **Only if Phase 6 was skipped** — remove the now-unused `isSupported` from the `setup()` return (line 594) and `isActive` from the destructure (line 319) in `src/components/builds/FocusMode.vue`. FR-012 forbids leaving unused state behind; the indicator closes it by *using* those refs, so dropping the indicator means deleting them instead. Not applicable if T016–T017 were completed.
- [X] T021 Self-review the diff against the constitution before merge: no unused code, no magic strings, no duplicated UI pattern, no new dependency. Confirm `package.json` is unchanged and the diff touches exactly one source file. — **Result**: `src/components/builds/FocusMode.vue` only, +29/−4; `package.json` unchanged; `isSupported`/`isActive` now both consumed; indicator reuses the existing `v-tooltip` + `accent` + `ma-2` pattern; no new dependency.
- [X] T022 Run `npm run build` and confirm it succeeds with no new warnings — **Result**: 682 modules transformed, built in 10.90 s, no warnings.
- [ ] T023 Complete the sign-off checklist at the foot of [quickstart.md](quickstart.md) — all 11 scenarios plus the zero-unhandled-rejections line

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: T001 blocks all on-device verification. T002 is independent but only meaningful before any code change.
- **Foundational (Phase 2)**: empty — blocks nothing.
- **User Story phases (3-6)**: no story depends on another story's *code*. US1 has no code at all.
- **Polish (Phase 7)**: after all desired story phases.

### Code task dependencies

All five code tasks edit the same file and must be applied sequentially:

```text
T008 (pass "screen")  ──►  T010 (hoist + guard)     [same statement]
T011 (guard release)                                 [independent statement]
T016 (return isActive) ──►  T017 (indicator markup)  [markup reads the returned ref]
```

`T011` and the `T016 → T017` chain are logically independent of `T008 → T010`, but they share a file, so apply them one at a time rather than concurrently.

### Verification task dependencies

**Every verification task (T003–T007, T009, T012–T015, T018, T019) depends on all applied code tasks being complete.** Testing against a partially-edited file tells you nothing.

### Parallel Opportunities

Deliberately limited, and honestly so:

- **No code tasks run in parallel** — single file.
- T005 (desktop screensaver) runs in parallel with the phone scenarios in Phase 3.
- T013 (unsupported browser) runs in parallel with T012 (battery-saver) if two devices are available.
- T007 (30-minute session) and T019 (rapid open/close) are long/short respectively and can be interleaved on separate devices.

The template's "parallel team strategy" does not apply: this is a ~15-line change to one component.

### Recommended Execution Order

This is the order to actually work in, as opposed to the story grouping above:

1. **T001, T002** — test surface and baseline
2. **T016, T017** — indicator first, so you have a test instrument for everything else (even though US4 is P3)
3. **T008, T010, T011** — the three defect fixes
4. **T022** — build passes before you start burning device time
5. **T003–T007, T009, T012–T015, T018, T019** — full verification sweep
6. **T021, T023** — self-review and sign-off

---

## Implementation Strategy

### MVP scope

**User Story 1 alone is not a useful stopping point here** — it requires no code, so "shipping the MVP" would mean shipping nothing. The real minimum useful increment is **US2 + US3** (T008, T010, T011): the three defect fixes that make the already-shipped behaviour correct and silent. That is four lines of change.

### Incremental delivery

1. T008 + T010 + T011 → verify US1, US2, US3 → this is a complete, shippable feature
2. T016 + T017 → verify US4 → adds observability
3. Phase 7 → merge

Splitting into two commits is reasonable and matches the constitution's atomic-commit guidance: one `fix:` commit for the defect fixes, one `feat:` commit for the indicator.

### Suggested commit messages

- `fix(focus-mode): guard wake lock acquire/release and decouple from voice-over init`
- `feat(focus-mode): show whether the screen is being kept awake`

---

## Notes

- All line numbers refer to the pre-change state of `src/components/builds/FocusMode.vue`; they shift as tasks are applied. Anchor on the surrounding code, not the number.
- Do not create `src/composables/useWakeLock.js`. The already-installed `@vueuse/core` handles re-acquisition and feature detection correctly, and wake lock has exactly one consumer — see [research.md](research.md) R1 for the full rationale and [plan.md](plan.md) Constitution Check gate I.
- `release()` in `onBeforeUnmount` is load-bearing, not defensive. The composable registers no scope-dispose cleanup.
- Commit after each logical group; stop at any checkpoint to validate independently.
