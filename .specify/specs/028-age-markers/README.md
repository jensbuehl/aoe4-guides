# 028 · Age Markers

The desktop build list draws "Advance to X Age" and "X Age reached" as identical gold bars. They are
not the same kind of thing: the advance is an **action** the player takes, the arrival is a
**boundary** the build crosses. This feature makes the advance a plain list row, makes the arrival
the only boxed bar in the list — now carrying the arrival time — and runs a single rail down the rows
between them so the age-up reads as a phase.

**Desktop only. The mobile step list is explicitly unchanged.**

## Files

- `spec.md` — feature specification (Spec Kit format)
- `design-input.md` — what the design decided, why, and the three variants it rejected
- `design-handoff/` — the design-side handoff as delivered: `README.md`, the two HTML canvases, the
  extracted theme tokens, and the icon assets the canvases reference
- `checklists/requirements.md` — spec quality gate

## Design reference

`design-handoff/Age Markers B.html` — six frames: anatomy, alternatives in a section, the three
nesting variants, and the rules. `design-handoff/Age Markers.html` — the current-state analysis and
the three options considered. Unlike `027`, no frame captures were produced, so the HTML itself is
the record.

Both are **design references authored in HTML, not production code**. They hand-roll the table, rows
and chips the app already solves with Vuetify. **Where they and the real components disagree, the
real components win** (Constitution Principle III) — port the decisions, not the CSS. Fidelity is
medium: hierarchy, colour roles, row rhythm and the rail logic are decided; pixel values are
indicative.

`design-handoff/assets/` duplicates icons that already ship in the app; the canvases reference them
by relative path, which is the only reason they are here. `design-handoff/Branch Annotations.html` is
`027`'s canvas, shipped with this handoff so the interaction between the two features can be read in
one place — it is not this feature's design.

## Related

- `027-build-alternatives` — User Story 3 depends on it. This spec **reverses** that handoff's
  "rails nest" line, for desktop only; see `design-input.md`.
- `026-age-up-band`, `020-age-up-timeline-strip` — the transition's *span* is drawn there, which is
  why the advance row does not restate it.
