# Contract: `getTimings(steps)` — the strict wrapper

**Module**: `src/composables/builds/timingsHelper.js` | **Status**: existing export, reimplemented

Focus mode's autoplay gate. Binary on purpose: a build either plays through or it does not — there is
no half-auto mode to degrade into.

---

## Signature

```js
getTimings(steps) → Array<{ startTime: number }> | null
```

Index-aligned with `steps` when non-`null`.

**`startTime` is the only field.** Verified against all three call sites (R-4) — the old
`villagers` / `villagerOffsetNextStep` / `villagerOffsetNextValidStep` / `type` fields were
scaffolding for the previous algorithm and are deleted with it.

---

## The gate

```
non-null  ⟺  every entry that is an actual STEP resolved as stated | interpolated | extrapolated
```

- **Notes are exempt** (FR-011). A `gameplan` entry is not a step, was never going to carry a time,
  and requiring one was simply a defect — D3, which silently disabled autoplay on every legacy flat
  build containing a note.
- **Extrapolated counts** (FR-014, Q1). A build stamped partway and blank after is now playable.
- **A single `unresolved` step fails the build.** Under FR-009 that means the build runs past its
  horizon, and playback genuinely cannot continue past a step it has no time for.

For a note-exempt entry, `startTime` carries the surrounding derived value so the array stays
index-aligned and `FocusMode`'s `forEach` needs no special case.

---

## Compatibility

| Guarantee | Why |
|---|---|
| Every build that autoplays on `main` still autoplays | SC-005 |
| …announcing every step at the **same second** | SC-005 — verified by golden-file diff (R-9), not by eye |
| The return stays truthy/`null`, so `autoplaySupported = getTimings(steps) ? true : false` is untouched | FR-015 |

The gate **widens** in exactly two directions, both intended:

1. legacy flat builds containing a note (D3), and
2. builds whose tail is extrapolated (Q1).

It never narrows. A build losing autoplay is a regression.

---

## The obligation that comes with widening

`getTimings()` returning non-`null` no longer implies every time was authored. `FocusMode` must
therefore mark what it did not read from the author (FR-015a) — and the wrapper deliberately does not
help it do so.

The marking happens where Focus mode already flattens times into strings
([FocusMode.vue:350-352](../../../src/components/builds/FocusMode.vue#L350-L352)) — the same line that
produces D1's `"alid"` today. Since that loop writes over **all** steps including authored ones, it
needs per-step provenance, which this contract does not carry.

So `FocusMode` calls both: `getTimings()` for the gate, `resolveStepTimes()` for the provenance
(R-5). Two passes over ~30 entries. Widening this contract to `[{ startTime, provenance }]` was
rejected — it would make the strict return carry a field one of three callers wants, blurring the
boundary that makes "strict" meaningful.

---

## Non-goals

- No partial result. Anything less than fully resolved is `null`.
- No provenance. That is `resolveStepTimes`'s job.
- No memoization. `FocusMode` calls it once in `onMounted`.
