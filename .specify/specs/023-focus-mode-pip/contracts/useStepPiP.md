# Contract — `useStepPiP.js`

This project exposes no public API, so the contract that matters is the **internal composable
interface** between `FocusMode.vue` and the PiP lifecycle. Written as a contract because it is the
one seam in this feature where a wrong assumption is expensive.

**Path**: `src/composables/builds/useStepPiP.js`

---

## Signature

```js
export function useStepPiP(options) → {
  supported: boolean,          // static, not a ref — capability cannot change at runtime
  active:    Ref<boolean>,
  open:      () => Promise<void>,
  close:     () => void,
}
```

### `options`

| Option | Type | Required | Meaning |
|---|---|---|---|
| `rootRef` | `Ref<HTMLElement>` | yes | The focus-mode root to move. Must be the element carrying `container-type: size` |
| `onEnter` | `() => void` | no | After the move succeeds. Used to release the wake lock (FR-015) and swap the tick to `pip` (FR-024) |
| `onLeave` | `() => void` | no | After the node is returned. Re-request the wake lock, swap the tick back to `opener` |

`onEnter`/`onLeave` are callbacks rather than the composable owning the wake lock and the timer
directly: those belong to the session, and the composable's job is the window, not the session.

---

## Guarantees

| ID | Guarantee |
|---|---|
| C-1 | `supported` is `'documentPictureInPicture' in window`. No UA sniffing (NFR-006) |
| C-2 | Nothing touches the DOM until `open()` is called (FR-001) |
| C-3 | `open()` **moves** `rootRef.value`; it never clones it and never mounts a second instance (FR-002) |
| C-4 | The parent is captured **before** the move and the node is returned to that exact parent (FR-004) |
| C-5 | `open()` is idempotent while a window is open — it reuses and focuses the existing one (FR-006) |
| C-6 | A rejected request leaves `active === false` and rejects with the underlying reason. No partial state (FR-007) |
| C-7 | The node is returned on `pagehide` **and** on owner unmount; on unmount the window is also closed (FR-004, FR-004a) |
| C-8 | The opener's own `keyup` listener is never unbound (FR-005) |

**C-3 and C-4 together are the feature.** Everything else is recoverable; getting these wrong
restarts the user's session, which is the one outcome the whole design exists to prevent.

---

## Sequence

```
open()
  ├─ if documentPictureInPicture.window → focus() and return            [C-5]
  ├─ requestWindow({ width: 400, height: 230 })                         [R-6]
  │    └─ on reject → active stays false, rethrow                       [C-6]
  ├─ carryStyles(pipWindow)                                             [R-5]
  ├─ copy documentElement.className + colorScheme
  ├─ returnParent = rootRef.value.parentElement                         [C-4]
  ├─ pipWindow.document.body.appendChild(rootRef.value)                 [C-3]
  ├─ useEventListener(pipWindow.document, 'keyup', handler)             [C-8]
  ├─ pipWindow.addEventListener('pagehide', returnNode)
  ├─ active = true ; onEnter()
  └─ watch theme → carryStyles again                                    [R-5]

returnNode()                                        (pagehide, or close(), or unmount)
  ├─ returnParent.appendChild(rootRef.value)                            [C-4]
  ├─ dispose the pip keyup listener
  ├─ active = false ; onLeave()
  └─ if triggered by unmount → pipWindow.close()                        [C-7]
```

---

## Caller contract — `FocusMode.vue`

The component must:

1. Expose the root element as a ref, and **not** re-render it conditionally while `active` — a
   `v-if` on an ancestor would destroy the moved node and end the session.
2. Render the pop-out control when `supported && !active`, the return control when `active` (FR-013).
3. Provide `onEnter`/`onLeave` that handle the wake lock and the tick source. Neither is the
   composable's business.

## Caller contract — `BuildDetails.vue`

Must call `close()` — or unmount cleanly, which does the same via C-7 — when the route leaves the
build page. **The platform will not do this** for a client-side route change; see
[research.md](../research.md) R-4.

---

## Failure modes

| Failure | Handling | Requirement |
|---|---|---|
| `requestWindow` rejects (no user gesture, permissions policy, PiP disabled) | Snackbar: *"Your browser blocked the floating window. Playing here instead."* then open the dialog | FR-007 |
| Cross-origin stylesheet throws on `cssRules` | Clone a `<link>` for that sheet, continue | R-5 |
| Theme changes while open | Re-copy sheets and class list | spec edge case |
| Owner unmounts while open | Close window, return node, tear down timer/speech/wake lock | FR-004a |
| A `v-menu` inside focus mode teleports to the opener's body | **Unverified — probe early.** If it happens, attach the menu to the focus-mode root | plan.md Risks |

The last row is not in the spec. It is the most likely source of unplanned work in Phase 3.
