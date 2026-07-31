# Phase 1 Data Model: Share a Build — QR Handoff and Native Share

**Feature**: `019-qr-share-build` | **Date**: 2026-07-31

## Persisted entities: none

This feature adds **no** Firestore collection, document, field, index, or security rule, and stores nothing in `localStorage`, `sessionStorage`, or cookies. The spec's Key Entities section was omitted for exactly this reason, and FR-021 forbids it explicitly.

Everything below is transient component state that exists only while the share dialog is mounted, documented here because the QR's load lifecycle is the one part of the feature with real states worth naming.

---

## Derived values

Both URLs are computed from data already on the page. Neither is fetched, cached, or stored.

| Value | Derivation | Requirement |
|---|---|---|
| `shareUrl` | `` `${window.location.origin}/builds/${build.id}` `` — note this is also the page's own address | FR-017, FR-018 |
| `focusUrl` | `` `${shareUrl}?focus=true` `` | FR-006, FR-018 |
| `shareTitle` | `build.title` | FR-011 |

**Source is `build.id`, not `props.id`.** On an in-app navigation between two `/builds/:id` routes Vue reuses the component and `props.id` updates while the fetched build does not (the fetch lives in `onMounted` only). Deriving from `build.id` keeps the QR aligned with the build the player can actually see, which is what FR-007 asks for. See research R5.2.

**`?focus=true`, never a bare `?focus`.** The receiving code truthiness-tests `route.query.focus`, and an empty string is falsy. Research R5.1.

---

## QR generation state

A three-state machine, entered on first dialog open and never before (FR-020).

```text
        dialog opened (first time only)
                 │
                 ▼
           ┌───────────┐
           │  pending  │──── import + toDataURL rejects ───► ┌──────────┐
           └───────────┘                                     │  failed  │
                 │                                            └──────────┘
         data URL resolved                                  "QR code unavailable";
                 │                                     Share + Copy stay usable (FR-010)
                 ▼
           ┌───────────┐
           │   ready   │  <img :src="qrDataUrl">
           └───────────┘
```

| Field | Type | Meaning |
|---|---|---|
| `qrState` | `'pending' \| 'ready' \| 'failed'` | Drives which of the three branches renders |
| `qrDataUrl` | `string \| null` | The `data:image/png;base64,…` payload; only meaningful in `ready` |

**Once resolved, it stays resolved.** Reopening the dialog for the *same* build must not regenerate — the dynamic import is already cached by the browser and the data URL is still valid. Regenerating would add a needless pending flicker.

**A different build invalidates it.** If the dialog is opened for build B after build A, `qrDataUrl` must be regenerated rather than showing A's code (FR-007). Keying the dialog on the build id, or watching it, both satisfy this; the simplest is to let the dialog be recreated per build.

---

## Capability flags

One flag, read-only, deciding whether the share option renders at all. Not stored.

| Flag | Source | Governs |
|---|---|---|
| `shareIsSupported` | `useShare().isSupported` from `@vueuse/core` | FR-011 / FR-012 |

Resolved **inside** the dialog rather than passed in as a prop, so the component owns its own capability decisions and the parent passes only what to share.

The dialog can never be empty (FR-004) regardless of this flag: the QR requires no browser capability beyond its own generation, which is precisely why the copy-link option was cut — it was justified as a fallback for a situation that cannot arise.

---

## What is deliberately absent

- **No share history.** Nothing records that a share happened — no Firestore write, no analytics event, no local log. Spec scope boundary.
- **No short links or share ids.** URLs are the site's own plain addresses; no redirect service, no minted identifier.
- **No clipboard state.** The copy-link option was cut during planning; the share URL is the page's own address, so the address bar already serves that need.
- **No cached QR images.** Generation is cheap and local; caching across builds would cost more complexity than it saves.
- **No access-control state.** A shared link is a pointer. Whether the recipient may view a draft is decided entirely by existing rules on the receiving end (FR-019, Constitution V).
