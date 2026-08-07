# Contract: `getAgeSegments(ages, scaleSeconds)`

**Module**: `src/composables/builds/useAgeTimings.js`
**Consumers**: `AgeTimeline.vue` only (research R-2)
**Status**: existing export, extended — signature unchanged

---

## Signature

```js
/**
 * @param  {Array}  ages          Result of getAgeTimings(), ascending by age.
 * @param  {number} scaleSeconds  Full width of the track in seconds.
 * @return {Array<Run>}           Runs in time order. Empty when nothing is drawable.
 */
export function getAgeSegments(ages, scaleSeconds)
```

The signature does **not** change. Callers pass what they already pass.

---

## Return

```ts
type Run = { key: `age-seg-${number}` | `age-band-${number}`; width: number }
```

- Ordered by time, ascending, covering `[0, scaleSeconds]` with no gap and no overlap.
- `width` is a percentage, clamped to `[0, 100]`, as today.
- **Every run has exactly two fields.** Age runs are byte-identical to today's output; a band differs
  only in its `key` prefix. Nothing about provenance reaches the track — see *Non-goals*.

### Guarantees

| | |
|---|---|
| **G-1** | Widths sum to 100 (modulo float) |
| **G-2** | `[]` when `!ages?.length` or `!scaleSeconds` — unchanged |
| **G-3** | When no band is admissible, the returned array `deepEquals` today's output |
| **G-4** | Never throws. `getAgeTimings()` already swallows; this adds no new failure mode |
| **G-5** | Pure. No I/O, no `Date.now()`, no module state |
| **G-6** | `Object.keys(run)` is `["key", "width"]` for every run, band or age |

---

## Band admission

Emitted for `ages[i]` only when all hold — see [data-model.md §4](../data-model.md#4-band-admission-rules):

```
age.clickUp != null
age.clickUp.seconds <  age.seconds      // strict — zero-duration click-ups exist
age.clickUp.seconds >= previous         // never eats the preceding age
```

Band key index is `i + 2` — the index of the age run it leads into.

---

## Consumer contract — `AgeTimeline.vue`

**The template does not change.** The existing binding already carries a band correctly, because a
band is just another run whose `key` happens to name a different class:

```html
<span
  v-for="segment in segments"
  :key="segment.key"
  :class="['age-seg', segment.key]"
  :style="{ width: segment.width + '%' }"
></span>
```

No `v-if`, no branch, no second loop, no modifier class.

### Required CSS

Written against the custom properties established by the Phase 0 refactor, so a band has no colour
literal of its own (FR-005). Channel triplets rather than hexes, which is what lets a band take an
alpha with no `color-mix` and therefore no fallback (research R-8):

```css
.age-track {
  --age-1: 61, 81, 107;    --age-2: 109, 127, 166;
  --age-3: 185, 154, 78;   --age-4: 231, 192, 94;
}
.v-theme--customLightTheme .age-track {
  --age-1: 169, 178, 194;  --age-2: 109, 127, 166;
  --age-3: 41, 71, 144;    --age-4: 204, 170, 85;
}

.age-seg-1 { background: rgb(var(--age-1)); }   /* …2, 3, 4 */

/* Each band points at the ramp step it leads into; there is no .age-band-1,
   because nothing leads into the Dark Age */
.age-band-2 { --band: var(--age-2); }           /* …3, 4 */

/* Striped, always — how an age-up in progress reads in the game */
.age-band-2, .age-band-3, .age-band-4 {
  background: repeating-linear-gradient(
    45deg,
    rgba(var(--band), 0.25) 0 4px,
    rgba(var(--band), 0.65) 4px 8px
  );
}
```

Both themes are carried by the properties. **No per-theme band rule is needed** — which is how FR-006
is met without four more declarations.

---

## Non-goals

This function does not, and must not grow to:

- **Report provenance.** It reports geometry, full stop. Whether a moment was stated or worked out
  is the crest's business — `~` on its face, and both moments named in its tooltip. A second signal
  on the track would say the same thing in a language the reader would have to be taught.
- **Repair data.** No clamping a click-up into range, no inferring one from a duration, no
  substituting a default. A band that fails admission is absent, never approximated (spec A-1).
- **Serve anything but the desktop track.** `AgeChips` has no time axis (spec A-5). If a second
  consumer ever appears, that is the moment to split `key` into `{ key, kind, step }` — not before
  (research R-3).
- **Know about `scaleSeconds`' derivation.** It receives a scale; `AgeTimeline` owns fitting it.
