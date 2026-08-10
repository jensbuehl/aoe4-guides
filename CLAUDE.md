<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan
at `.specify/specs/027-build-alternatives/plan.md`.
<!-- SPECKIT END -->

## Working rules

### Harvest after every push

A push is a checkpoint, not just a save. After each one, spend a moment asking
what the work just taught — then write it where it will be read again:

| What you learned | Where it goes |
|---|---|
| A fact about *this* codebase that surprised you, or a trap that cost time | A `project` memory, or a comment at the place that surprised you |
| A correction from the user, or a working practice that would have saved a round trip | A `feedback` memory |
| Something the spec, plan or tasks now describe wrongly | Reconcile the document — a spec that contradicts the code is worse than none |
| A rule that should bind future work regardless of who does it | This file, or the constitution if it is a principle |
| Scope that turned out already built, obsolete, or newly necessary | tasks.md, with the reasoning kept |

Two habits make this worth doing rather than ceremonial:

- **Record the cause, not the symptom.** "The rail broke at insert dividers"
  ages badly; "per-element rails cannot span siblings, so a lane belongs on a
  wrapper" is still true next year.
- **Write it once.** If a rule lives here, it does not also belong in memory —
  duplicated guidance drifts apart and then contradicts itself.

Prefer updating an existing note over adding a new one, and delete notes that
turn out to be wrong.

### Verification

`npm run build` compiles templates; it cannot catch a `ReferenceError` in
`setup()`, which throws at render and blanks the component behind a green build.
Run `npm run check:setup` after touching any `.vue` file, and say plainly what
has *not* been verified — rendering, layout and interaction need a browser.

Logic that lives in a `.vue` file can still be tested without one: import
`@vue/reactivity` and drive the real refs, computeds and watches. Such a
harness has to sit **inside the project** — Node resolves packages from the
importing file, so one written to the scratchpad cannot find `@vue/reactivity`
or use the `@/` alias. Write it to the repo root, run it, delete it.
