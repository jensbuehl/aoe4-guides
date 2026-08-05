# 023 — Focus mode: floating window (Document Picture-in-Picture)

Handoff package for putting focus mode in a real always-on-top OS window, and for the two
changes that make it usable when it gets there.

Three things ship together:

1. **A floating-window target** for focus mode, via the Document Picture-in-Picture API. The
   existing focus-mode DOM node is *moved* into the PiP window and back — one component
   instance, so the timer, autoplay, step index and voice-over never restart.
2. **A prominent play control** — the 12 px text link in the Build Order header becomes a filled
   split button whose menu carries the play targets.
3. **A focus-mode layout that survives small boxes** — three fixed rows with density tiers driven
   by a container query, so the same component works full-screen, on a phone, and at 320×150.

| File | What it is |
|---|---|
| `spec.md` | Feature spec — scope, user stories, functional requirements, success criteria |
| `design-input.md` | Resolved values — geometry, tiers, tokens, copy, the PiP lifecycle |
| `tasks.md` | Ordered, checkable implementation tasks |
| `assets/Focus Mode PiP.html` | The approved mock — entry point, mobile layout, both PiP tiers, live API test |

## Why this shape, in one paragraph

The site already solves "read the build while playing" twice: a full-screen focus dialog (loses to
the game on a single monitor) and a JSON export to a third-party overlay tool (an install, a second
app, a copy of the data that goes stale). Document PiP gets the same result with neither: the
browser gives us an always-on-top window containing live DOM, so the current step floats above a
windowed-fullscreen game with no install. Chrome and Edge support it; Firefox and Safari keep
exactly today's behaviour, so nothing is removed and nothing is gated behind a browser check the
user has to understand. The layout work is not optional next to it — today's focus mode centres one
line of content in a tall empty card and prints a resource strip with blank columns, which is
tolerable at 1080p and unreadable at 400×230.

## Rejected, with reasons

- **A second, PiP-only component.** Duplicates the timer, the speech queue and the step maths; the
  two would drift within a release.
- **Re-mounting focus mode inside the PiP window.** Simpler to write, but the session restarts:
  autoplay stops, elapsed time resets, speech is cut. Moving the node keeps the instance.
- **`$vuetify.display` breakpoints for the tiers.** The PiP window is its own document with its own
  viewport; breakpoints there describe the wrong box. Container queries on the focus-mode root
  describe the right one, in every context.
- **`window.open` + `alwaysOnTop`.** Not a thing on the web; a popup drops behind the game.
- **Replacing the overlay export.** It stays, untouched, in the build's overflow menu.
