# Contract: `BuildShareDialog.vue` and the shared URLs

**Feature**: `019-qr-share-build` | **Date**: 2026-07-31

This feature exposes no HTTP API, no Firestore schema, and no CLI. Its two contracts are the **component interface** between `BuildDetails.vue` and the new dialog, and the **URL shapes** the feature emits into the world — the latter being the one that genuinely leaves the application, since scanned and pasted links are consumed by other devices and other people.

---

## 1. URL contract

Two shapes, distinguished by audience. This split is the feature's central design decision.

### 1.1 Focus URL — encoded in the QR only

```text
https://{origin}/builds/{buildId}?focus=true
```

| Rule | Requirement |
|---|---|
| Absolute, including scheme and origin | FR-018 |
| `focus` query parameter present with a **non-empty** value | FR-006 |
| Resolves on a device with no prior site state (no session, no cache) | FR-018 |
| Opens the build directly in focus mode, no further interaction | FR-006, SC-003 |

**The `=true` is part of the contract, not decoration.** The consumer at [BuildDetails.vue:236-238](src/views/builds/BuildDetails.vue#L236-L238) is a truthiness test:

```js
if (route.query) {
  focusMode.value = route.query.focus;   // "" is falsy
}
```

A bare `?focus` parses to the empty string and focus mode does not open. Any non-empty value technically works; `true` is specified so there is one canonical form. **Producer and consumer are coupled here** — a future change to how the flag is read must keep the empty-string case in mind, or this QR silently starts landing people on the ordinary build page.

### 1.2 Share URL — native share sheet

```text
https://{origin}/builds/{buildId}
```

| Rule | Requirement |
|---|---|
| Absolute, including scheme and origin | FR-018 |
| **No** `focus` parameter | FR-017 |
| Opens the build in normal reading mode | FR-017, User Story 2 §5 |
| Grants no access the recipient did not already have | FR-019 |

The omission is deliberate: this URL is destined for another person who has not chosen to play right now, and dropping them into a fullscreen follow-along surface uninvited is the wrong default.

Note that this URL is **identical to the build page's own address**. That equivalence is what made a copy-link option redundant and led to it being cut — the address bar already copies exactly this string.

### 1.3 Invariants across both

- Derived from `build.id` — the build actually rendered — not from the route param (FR-007, research R5.2).
- Contain no tracking parameter, share identifier, or referrer marker.
- Are produced entirely on the device. No third-party request, no shortener, no server round-trip (FR-021).

---

## 2. Component contract

### Props

| Prop | Type | Required | Notes |
|---|---|---|---|
| `build` | `Object` | yes | The loaded build. Only `id` and `title` are read. Never mutated. |
| `modelValue` | `Boolean` | yes | Dialog open state, `v-model` from the parent. |

The component reads two fields and writes none. It does not fetch, does not touch Vuex except to dispatch the existing `showSnackbar`, and does not know about routing.

**Capability detection is deliberately *not* a prop.** The dialog resolves `useShare().isSupported` internally, so the decision about which options render lives in one component. The parent passes what to share, never what the browser can do.

### Events

| Event | Payload | When |
|---|---|---|
| `update:modelValue` | `Boolean` | Dialog opened or closed, so the parent's `v-model` stays in sync. |

No `share`, `copied`, or `error` events. Nothing upstream needs them, and adding them would invite a listener that has to be maintained (Constitution I).

### Guarantees to the parent

| Guarantee | Requirement |
|---|---|
| Never navigates, reloads, or pushes browser history | FR-003 |
| Never throws or emits an unhandled rejection, in any support scenario or on user cancel | FR-014, FR-022, SC-007 |
| Renders at least one usable option in every environment | FR-004 |
| Costs nothing until first opened — `qrcode` is imported on open, not on mount | FR-020, NFR-001 |

### Preconditions from the parent

`BuildDetails.vue` must only make the entry point reachable once `build` is truthy, satisfying FR-002. The existing menu is already inside the `v-if="build"` container at [BuildDetails.vue:11](src/views/builds/BuildDetails.vue#L11), so this holds without new guarding.

---

## 3. Capability degradation contract

The observable rule is **omission, never a disabled control and never an error**.

| Environment | QR | Share… |
|---|---|---|
| Modern mobile, secure origin | shown | shown |
| Desktop Chrome/Edge, secure origin | shown | shown |
| Desktop Firefox / Chrome on Linux (no Web Share) | shown | **absent** |
| `qrcode` chunk fails to load | **"QR code unavailable"** | shown |
| Local dev over plain HTTP | shown | absent |

The last row is the worst realistic case and still satisfies FR-004: the QR needs no browser capability beyond its own generation, so the dialog is never empty. In the desktop-without-Web-Share row the player still has the browser address bar, which holds this exact URL — the reason a copy-link option was judged redundant.

**Cancel is not failure.** `useShare` rejects with `AbortError` when the player dismisses the sheet. That rejection is caught and discarded — no snackbar, no console error, no state change (FR-013).

---

## 4. Accessibility contract

| Rule | Requirement |
|---|---|
| The QR `<img>` carries meaningful `alt` text naming the build | NFR-004 |
| Every option is reachable and activatable by keyboard | NFR-004 |
| The visible caption explains the QR's purpose in text, not by image alone | NFR-004 |

A QR is meaningless to a screen reader, so the `alt` text and caption are the only way that user learns what the element is — this is why `<img>` was chosen over `<canvas>` (research R2).
