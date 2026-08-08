# 027 · Build Order Alternatives

Adds "two ways to play from here" to build orders: an author marks a split, describes the condition
for each path, and gives each its own steps; a reader picks one and follows it through the step
list, the economy graph and focus mode.

## Files

- `spec.md` — feature specification (Spec Kit format), with the design frames inlined
- `design-input.md` — what the design decided, why, and what it deliberately did not
- `assets/` — captures of the seven design frames

## Design reference

The *Branch Annotations* canvas — seven frames, captured into `assets/` and inlined in `spec.md`.
The interactive HTML is **not checked in**; the captures are the record. It is a design reference
authored in HTML, not production code: it hand-rolls menus, chips, buttons and tabs that the app
already solves with Vuetify. **Where it and the real components disagree, the real components win**
(Constitution Principle III) — port the decisions, not the CSS.

Current-state designs this one forks live with their own features:
`014-desktop-build-layout/assets/Desktop Build Redesign.html`,
`013-mobile-build-layout/assets/Mobile Build Redesign.html`,
`023-focus-mode-pip/assets/Focus Mode PiP.html`.

## Shape of the change

One new item kind in the build document: an alternatives block, bounded by two markers, containing
two or more paths. Everything else is presentation of that.

Four surfaces are affected: build editor, build detail steps (desktop + mobile), economy graph,
focus mode.

## Deliberately out of scope

- Drag-and-drop reordering of alternatives
- Overlay import of alternatives (export flattens to the active path)
- Civ filtering driven by path descriptions
- Nested alternatives, and alternatives spanning an age-up
