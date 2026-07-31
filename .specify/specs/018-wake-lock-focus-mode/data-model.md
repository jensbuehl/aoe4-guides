# Data Model: Screen Wake Lock in Focus Mode

**Feature**: 018-wake-lock-focus-mode | **Date**: 2026-07-31

## Persisted entities

**None.** This feature reads and writes no Firestore document, no `localStorage` key, and no user preference. Nothing survives the focus-mode session. There is no schema change and therefore no Firestore security-rule review needed (Constitution V).

What follows is the transient in-memory state model — the only "data" the feature has.

## Transient state

All state is owned by the `@vueuse/core` `useWakeLock` composable, instantiated once per `FocusMode` mount and destroyed with it. This feature adds **no new refs**; it consumes what the composable already returns.

| Name | Type | Owner | Meaning | Consumed by |
|---|---|---|---|---|
| `sentinel` | `WakeLockSentinel \| null` | composable | The live platform lock handle. Non-null means a lock was granted and not yet released. | composable only — not surfaced |
| `isSupported` | `boolean` (computed) | composable | Whether `"wakeLock"` exists on `navigator`. False on browsers without the API **and** on insecure origins, since the platform gates the property to secure contexts. | template — gates indicator visibility |
| `isActive` | `boolean` (computed) | composable | `!!sentinel && documentVisibility === "visible"` — i.e. *currently holding*, not *ever requested*. | template — drives indicator glyph and tooltip |
| `requestedType` | `"screen" \| false` | composable | Re-acquire bookkeeping. Set from the sentinel's `type` when the browser auto-releases; cleared once re-acquired. Its truthiness gates the re-acquire watcher — which is why passing `"screen"` explicitly matters (see [research.md](research.md) R3). | composable only |
| `documentVisibility` | `"visible" \| "hidden"` | composable | Live document visibility. | composable only |

### Relationship to existing FocusMode state

None. The wake lock is deliberately independent of `timer`, `autoplay`, `audio`, `announceVillagers`, and `currentStepIndex`. It is acquired because focus mode is *open*, not because autoplay is *running* — a player swiping through steps manually needs the screen lit just as much. No requirement couples the two, and none should be introduced.

## State transitions

States are derived, not stored — there is no explicit state variable, only the combination of `isSupported`, `sentinel`, and `documentVisibility`.

```text
                          focus mode opens
                                 │
                                 ▼
                    ┌─────────────────────────┐
              ┌─────┤  request("screen")      │
              │     └─────────────────────────┘
              │                  │
   isSupported = false    isSupported = true
   (no API, or            │
    insecure origin)      ├── granted ──────────► HELD
              │           │                       (sentinel set,
              ▼           │                        isActive = true,
        UNSUPPORTED       │                        indicator hidden→
        (indicator        │                        mdi-sleep-off)
         hidden,          │
         normal sleep)    └── rejected ─────────► REFUSED
                                                  (NotAllowedError caught
                                                   and swallowed; sentinel
                                                   stays null; isActive =
                                                   false; indicator shows
                                                   mdi-sleep)
```

From **HELD**:

| Trigger | Transition | Notes |
|---|---|---|
| Tab hidden (alt-tab, app switch, screen off) | HELD → **SUSPENDED** | Browser auto-releases and fires `release` on the sentinel. `requestedType` is set to `"screen"`. `isActive` → false. Device may sleep normally. |
| Focus mode closed / component unmounted | HELD → **RELEASED** | `release().catch(() => {})` in `onBeforeUnmount`. Mandatory — the composable registers no scope-dispose cleanup, so skipping it leaks the lock past the component. |
| Battery saver engaged mid-session | HELD → **SUSPENDED**/released by platform | Same `release` event path. Re-acquire will be attempted on next visibility change and may be refused; that refusal is caught. |
| Player locks device manually | no state change | The platform lock always wins. The feature never contests a deliberate lock. |

From **SUSPENDED**:

| Trigger | Transition | Notes |
|---|---|---|
| Tab becomes visible again | SUSPENDED → **HELD** (or → REFUSED) | The composable's `whenever(visible && requestedType)` watcher calls `forceRequest("screen")`. Re-arms every cycle, so this survives unlimited hide/show rounds (FR-004). |
| Focus mode closed while still hidden | SUSPENDED → **RELEASED** | `release()` clears `requestedType` and nulls the sentinel, so no lock is re-acquired afterwards. |

From **UNSUPPORTED** and **REFUSED**: terminal for the session. No retry loop, no polling, no user prompt. The player gets today's behaviour and is never told (FR-009).

**RELEASED** is terminal for the component instance. A new focus-mode session mounts a fresh composable instance and starts from the top.

## Invariants

- **I1**: No sentinel is held while focus mode is closed. Guaranteed by `onBeforeUnmount` → `release()`, plus the Vuetify dialog unmounting its content on close (FR-003, FR-010).
- **I2**: At most one sentinel exists per `FocusMode` instance. `forceRequest` releases any existing sentinel before requesting a new one, so repeated visibility cycles cannot accumulate locks.
- **I3**: No transition surfaces an error to the player. Every path into REFUSED is wrapped at the call site (FR-006, FR-007, FR-009).
- **I4**: The indicator never claims the screen is held unless `isActive` is true. It renders from `isActive` directly rather than from "we called `request()`" (FR-013).
- **I5**: No transition depends on autoplay, audio, or step state — and none of those depend on the wake lock (FR-001, FR-008).
