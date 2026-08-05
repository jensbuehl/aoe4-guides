# Data Model — 023 Focus mode: floating window

All state here is **client-side and ephemeral**, except one persisted enum. No Firestore entity, no
schema change, no Cloud Function (NFR-002, Principle IV).

---

## 1. PlayTarget *(persisted)*

The user's last-used play target. The only durable state this feature adds.

| Field | Type | Values | Notes |
|---|---|---|---|
| value | enum | `here` \| `floating` \| `phone` | Written on every successful play action |

**Storage**: `localStorage`, key `aoe4-guides-play-target`, via
`src/composables/usePlayTargetPreference.js` — same shape as
[`useThemePreference.js`](../../../src/composables/useThemePreference.js).

**Validation rules**:

- The getter MUST return `null` for any value not in the enum, exactly as `getSavedTheme()` returns
  `null` for anything that is not `light`/`dark`. Corrupt or hand-edited values degrade silently.
- `null` resolves to **`here`** (FR-020).
- **`floating` resolves to `here` when the platform lacks Document PiP** (FR-021). This is the
  cross-device case: the preference is per-browser, but a user with two browsers, or one who
  downgrades, must never get a button that does nothing.

**Lifecycle**: written after the target runs, not when the menu item is clicked — a target that fails
and falls back (FR-007) must not be persisted as the new default, or a one-off failure would become
sticky.

---

## 2. DensityTier *(derived, never stored)*

| Tier | Condition | Source |
|---|---|---|
| `full` | default | — |
| `compact` | `max-width: 520px` **or** `max-height: 300px` | container query |
| `micro` | `max-width: 340px` **or** `max-height: 190px` | container query |

**Derivation**: CSS container queries on the focus-mode root (`container-type: size`), **not**
`$vuetify.display` (FR-009). The PiP window is a separate document whose viewport describes the
wrong box; the container describes the right one in every context — dialog, phone and PiP alike.

Not user-selectable, not persisted, and never exposed to JS. Tiers exist only as CSS state, which is
why the same component works in three places without a mode flag.

---

## 3. FocusSession *(in-memory, single instance)*

The live state that must survive the DOM move in both directions. It already exists in
[`FocusMode.vue`](../../../src/components/builds/FocusMode.vue); this feature must not fork it.

| Field | Type | Survives move? | Notes |
|---|---|---|---|
| `currentStepIndex` | number | **Yes** | |
| `totalElapsedTime` | Date | **Yes** | Meaning changes under FR-016 — see §4 |
| `autoplay` | boolean | **Yes** | |
| `audio` | boolean | **Yes** | |
| `announceVillagers` | boolean | **Yes** | |
| `timer` | interval handle | **No — reissued** | The handle is per-window; the *elapsed time it represents* survives |
| speech queue | browser-owned | **Yes** | Must not re-speak the current step on move (US1 scenario 2) |

**Invariant**: exactly one FocusSession exists per build page. The move relocates the DOM that
renders it; it does not touch the component instance that owns it. Any design that re-mounts
`FocusMode.vue` inside the PiP window violates this and was rejected in the handoff.

**State transitions**:

```
page ──pop-out──▶ floating          (FR-002: node moved, session untouched)
floating ──close / pagehide──▶ page (FR-004: node returned to remembered parent)
floating ──opener unmounts──▶ ended (FR-004a: window closed, session torn down)
```

Only the *location* of the DOM and the *source* of the tick change. Nothing in the table above is
recomputed by a transition.

---

## 4. Clock *(in-memory)*

Introduced by FR-016 and FR-024. Replaces today's tick-counting.

| Field | Type | Notes |
|---|---|---|
| `anchorElapsed` | number (s) | Session-relative elapsed time at the moment of anchoring |
| `anchorWallClock` | number (ms) | `Date.now()` at the moment of anchoring |
| `source` | enum | `opener` \| `pip` — which document schedules the tick (FR-024) |

**Derivation**:

```
elapsed = anchorElapsed + (Date.now() − anchorWallClock) / 1000
```

**Re-anchor on** — this list is the requirement, not an illustration:

- session start,
- manual previous/next (today's `setElapsedTimeToCurrentStepStartTime()` at
  [`FocusMode.vue:498`](../../../src/components/builds/FocusMode.vue#L498) resets elapsed to the
  step's start time — a naive wall-clock diff would break this),
- resume from pause.

**Validation rules**:

- `source` changes with `active`, and changing it MUST NOT re-anchor (FR-025). The anchor is what
  makes the swap invisible; touching it would make elapsed time jump.
- A tick that arrives late produces a late render, never a wrong time. This is the property SC-001
  measures.
- Step advance compares derived `elapsed` against the next step's stated time, so a single late tick
  may advance more than one step. That is correct behaviour, not a bug — the build is where it says
  it is.

---

## 5. PiPWindow *(in-memory, at most one)*

| Field | Type | Notes |
|---|---|---|
| `window` | `Window` \| `null` | `documentPictureInPicture.window`; the platform allows one per tab (FR-006) |
| `returnParent` | `Element` | The exact parent the focus-mode root came from, remembered before the move (FR-004) |
| `active` | boolean | Drives the pop-out / return control (FR-013) and the wake lock (FR-015) |

**Validation rules**:

- `returnParent` MUST be captured **before** `appendChild`, not inferred afterwards.
- Requesting while `window` is non-null MUST reuse and focus it rather than requesting a second
  (FR-006).
- On failure, `active` stays false and the caller falls back to the dialog (FR-007) — no partial
  state.

---

## Entity relationships

```
BuildDetails.vue
   └── owns ── FocusSession ──── renders into ──▶ focus-mode root (DOM)
                    │                                   │
                    │ reads/writes                      │ moved by
                    ▼                                   ▼
                  Clock ◀── source set by ───────── PiPWindow
                                                        │
PlayTarget (localStorage) ── chooses ──────────────────▶ how the session starts
```

`PlayTarget` is the only thing that outlives the page. Everything else dies with the build view — by
design, per NC-2.
