# Phase 1 — Data Model: Build Order Alternatives

The build document as it is, the one addition, and the rules that keep it honest.

---

## 1. What exists today

A build's `steps` field is an array of **sections**:

```js
{
  type: "age" | "ageUp",   // "age" sections are counted to derive the current age (R-10)
  age: 0 | 1 | 2 | 3 | 4,  // 0 = migrated, "no particular age"
  gameplan: "<html>",      // section note, rich text
  steps: [ /* steps */ ]
}
```

A **step** is a flat bag of strings — no discriminator, no id:

```js
{
  time: "4:10",            // plain text "m:ss", may be absent
  builders: "", food: "12", wood: "6", gold: "", stone: "",
  description: "<html>",   // rich text: img + br only (sanitizeStepDescription)
  gameplan: "<html>",      // read by three consumers, written by none (R-9)
}
```

Everything derived runs over `flattenSections(sections)` — one array, position is identity (R-1).

---

## 2. The addition

One new item kind, living **in `section.steps`** alongside ordinary steps (R-10):

```js
{
  kind: "alternatives",
  paths: [
    {
      title: "Defend",              // plain text, one line, edited on the tab
      steps: [
        { gameplan: "<html>" },     // the condition: the path's FIRST note
        /* … ordinary steps … */
      ]
    },
    // … 1 or more further paths
  ]
}
```

**`kind` is the discriminator, and its absence means "ordinary step".** No existing document has it,
so every build on the site parses identically with no migration and no version field — FR-017 holds
by construction, not by care (R-11).

### Why nesting rather than two marker items

FR-001 describes the block as *"bounded by an opening marker and a closing merge marker"*. That is
the **editor's rendering** of the block, and it stays exactly as designed on screen. In the data the
boundaries are the object, not two siblings in the step array.

| | Nested block (chosen) | Two marker items |
|---|---|---|
| Orphan opening marker | **Unrepresentable** | A real corruption class to detect and repair |
| Steps outliving their block | **Unrepresentable** | Possible after a bad delete |
| "Insert above the merge line" (FR-006) | push into `path.steps` | insert at flat index, recompute membership |
| Delete the block, keep steps (FR-011) | splice `paths[*].steps` into the section | delete two items, hope the middle is intact |
| Flatten (R-1) | recurse one level | scan for markers, track depth |

The design-input's reasoning — *"nothing can dangle or desync"*, *"membership is positional"* —
argues **for** this shape: nesting makes those properties structural instead of enforced. FR-002 (no
rejoin pointer) is satisfied a fortiori: there is nothing to point with.

---

## 2b. The other addition — notes

A **note** is an ordinary step whose content is its `gameplan`:

```js
{ gameplan: "<html>" }    // no time, no resource cells, no description
```

No `kind`, no new field, no discriminator — `gameplan` **is** the discriminator, and it is a field the
document format has always had. Three consumers already read it correctly
([R-9](./research.md#r-9--note-in-fr-007s-menu-has-no-writer-today)); this feature supplies the writer
that never existed.

| | Section note (today) | Step note (new) |
|---|---|---|
| Where | `section.gameplan`, one per section | `step.gameplan`, at any position |
| How created | Automatic empty row at the end of every section in the editor | Inserted from the add menu, where the author put it |
| Count | One | Any number |
| Existing documents | Keep rendering, stay editable, **not migrated** (FR-020) | — |

**Invariant N-1 — a note is never an empty step.** `saysNothing` returns false for anything with
visible `gameplan` content, so a note is never filtered out of focus mode or the economy pass.

**Invariant N-2 — a note states no economy.** It has no resource cells, so `getEcoSeries` contributes
no point for it, and focus mode's `resourceSource` shows the preceding step's position instead. Both
behaviours already exist and need no change.

**Invariant N-3 — a note needs no time.** `isNoteAt` exempts it from the resolution gate, so inserting
a note can never turn autoplay off for a build. This is the one that would have been expensive to
discover late.

Both note kinds coexist permanently. The section note is not deprecated and not migrated — it is
simply no longer created automatically.

---

## 3. Selection — view state, never build data

The active path is **not** in the document (spec, Key Entities). Three independent holders:

| Holder | Scope | Lifetime | Persistence |
|---|---|---|---|
| Reading view (`BuildDetails`) | one build page | the visit | **none** — a choice is about the game in front of you, not the last one |
| Focus mode | one session | the run | none — starts from `main`/first each run |
| Economy graph | — | — | **none: reads the reading view's** (FR-014) |

**Invariant S-1 — one selection per surface pair.** The graph and the steps table share one holder in
both directions (FR-014). This is what keeps `stepIndex` sound across the provide/inject highlight
channel (R-6), since that index is selection-relative.

**Invariant S-2 — a switch clears the highlight.** `useStepHighlight.clear()` on both holders,
because an index taken under the old selection points at a different step under the new one (R-6).

Shape:

```js
{ [blockId]: pathIndex }   // blockId = section index + item index; no id is stored in the document
```

Block identity is positional, like everything else here. A stored selection whose block no longer
exists (the author edited the build) resolves to the default and is discarded — never an error.

---

## 4. Admission rules

Read as **refusals, not repairs** — the house pattern (026's `getAgeSegments`). A block that fails
one is rendered as if the offending part were absent; nothing is silently rewritten in the author's
document.

| # | Rule | On failure |
|---|---|---|
| A-1 | `kind === "alternatives"` and `paths` is a non-empty array | Treat the item as an ordinary step (it has no step fields, so it renders blank and empty — see A-6) |
| A-2 | Every path has a `steps` array (possibly empty) | Path is selectable and contributes no steps (spec edge case: a legitimate "do nothing different" path) |
| A-3 | At most one path carries `main: true` | First one wins; the rest read as unflagged |
| A-4 | A path's `steps` contain **no** `kind: "alternatives"` (FR-004: no nesting) | Inner block ignored by the flattener; the editor prevents creating one (FR-007, disabled with reason) |
| A-5 | A path's `steps` contain no age-up (FR-003) | Structurally impossible: age-ups are section boundaries and a block lives inside one section (R-10) |
| A-6 | `paths.length >= 2` | **Renders as a plain conditional detour** — the spec's stated behaviour for a single path, not an error |

A-5 is the one worth noticing: it is not enforced anywhere because it **cannot be violated**.

---

## 5. Flattening — the one behaviour change

```
flattenSections(sections, selection?) → Step[]
```

For each section, for each item in `section.steps`:

- no `kind` → push the step (today's behaviour, byte for byte);
- `kind === "alternatives"` → push the **active path's** steps, in order;
- anything else → skip.

Active path = `selection[blockId]` if valid, else the path with `main`, else `paths[0]`. Called with
no `selection`, the function is **deterministic and total**: it returns the default path everywhere,
which is what the overlay export (FR-018) and any future server-side reader want.

**Invariant F-1.** The return value is an array of ordinary steps. No caller downstream can observe
that a block existed. This is what makes `resolveStepTimes`, `redundantMask`, `getEcoSeries` and
`getTimings` correct with no change (R-1).

**Invariant F-2.** For a build with no blocks, output is identical to today's for every selection —
the regression guard for FR-017, and cheap to verify by diffing against the current implementation.

**Invariant F-3.** Every step in the output belongs to one linear play-through, so the output cannot
rewind. This is what returns the economy chart to builds that lose it today (R-3).

### What the flattener refuses to do

It does not re-time anything (FR-006 — each path owns its timings, and steps after the block keep the
times their author wrote), does not merge paths, and does not decide what a block *means*. It reports
one ordered list of steps and nothing else.

---

## 6. Where a section offset now points

`sectionOffsets(sections)` currently sums `section.steps.length`. Under a selection, a block
contributes its **active path's step count**, not 1 and not the total. It therefore takes the same
`selection` argument, and the two functions must be called with the same one — they are two halves of
one traversal (R-1).

**Invariant O-1.** `sectionOffsets(s, sel)[i] + (local index) === flat index` for every step rendered
by section *i* under selection `sel`. Violating this desynchronises the resolver from the table, which
is the failure `sectionOffsets` was extracted to prevent.

---

## 6b. Security rules — reviewed, unchanged (T055)

Principle V requires the review to happen and be stated, so: **`firestore.rules` needs no change**,
and here is why rather than merely that.

The rule that governs a build has two halves. The owner's half allows a write when
`request.auth.uid` matches `authorUid`. The public half allows an update whose
`diff(resource.data).affectedKeys()` `hasOnly(['views', 'likes', 'upvotes', 'downvotes',
'comments'])`.

| What changed | Why the rules do not care |
|---|---|
| No new top-level field | `affectedKeys()` reads **top-level keys only**. A block lives inside `steps`, so every edit to one still surfaces as `steps` changing — already denied to the public half, already allowed to the owner's |
| No new collection or document | Nothing to match on |
| No new writer | Only an author edits a build, exactly as before. Path *selection* is view state and is never written (§3) |
| No field left the document | The public allowlist is unaffected either way |

Two platform constraints, checked rather than assumed:

- **Firestore forbids an array directly inside an array.** Ours never is: `steps[]` → block *map* →
  `paths[]` → path *map* → `steps[]`. Arrays hold maps and maps hold arrays, which is legal; only
  `[[…]]` is not. This is a real constraint the nested shape had to satisfy, not a formality.
- **Nesting depth** reaches about five of the twenty allowed.

The one thing that *is* worth watching is document size: a block stores every path's steps, so a
build with several long alternatives grows against the 1 MiB document limit. Nothing near it today —
recorded so a future feature that multiplies paths knows where the ceiling is.

Unrelated to rules but adjacent, and the reason this was worth a careful look: Firestore rejects
`undefined` at any depth and stores class instances by their own rules. Both bit during
implementation — see `saveable()` in `buildService.js` and `toDateSafe()` in `useTimeSince.js`.

---

## 7. Entities, named

- **AlternativesBlock** — `{ kind, paths }`. Lives in one section's `steps`. Cannot nest, cannot span
  an age-up, has no id.
- **Path** — `{ title, description, main?, steps }`. Owns its steps and their timings. Title is what
  the legend, the focus-mode bar and the desktop pick row show; description carries the knowledge and
  is never truncated into a row (spec).
- **Selection** — view state, `{ [blockId]: pathIndex }`. Persisted per build in the reading view,
  per session in focus mode, never in Firestore, never in the document.
