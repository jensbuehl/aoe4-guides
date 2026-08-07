# Phase 0 Research: Age-Up Band

**Feature**: `026-age-up-band` | **Date**: 2026-08-07

Ten findings. Four of them changed the design; two removed work from the spec.

**Revised 2026-08-07 during implementation.** R-8 changed form (channel triplets rather than
`color-mix`) and R-9 was superseded outright when US2 was withdrawn and every band became striped.
Both are kept with their original reasoning rather than deleted, since each records a road not taken.

---

## R-1 — The band is a flex child, not an overlay

**Decision**: Bands are additional children of the existing `.age-track` flex row, emitted by
`getAgeSegments()` in time order, sized in percent exactly like the age segments.

**Rationale**: FR-007 requires the track to account for every second exactly once, with the age
segments *yielding* the band's width rather than the track growing. As a flex row over one ordered
run list, that is a property of the construction — the runs are cut from `[0, scaleSeconds]` and
therefore sum to 100% by definition. There is no arithmetic to get wrong and no second code path
that could disagree with the first.

`.age-track` at [AgeTimeline.vue:398-405](../../../src/components/builds/AgeTimeline.vue#L398-L405)
is already `display: flex` with `overflow: hidden`, and `.age-seg` carries only `height: 100%`. A
band needs no new layout mechanism at all.

**Alternatives considered**:

- *Absolutely-positioned overlay bands*, drawn on top of unchanged segments. Rejected: it makes
  FR-007 an assertion rather than a property — the segments would still be computed from age
  boundaries alone, so the band would cover an age rather than be cut out of it, and any rounding
  disagreement between the two would show as a seam.
- *An SVG track*, matching `EcoLines.vue`. Rejected as a rewrite of a working 12px bar (Principle I).

---

## R-2 — `getAgeSegments()` has exactly one caller

**Finding**: `getAgeSegments` is imported once, at
[AgeTimeline.vue:287](../../../src/components/builds/AgeTimeline.vue#L287). Nothing else in the app
reads it — the list card rail, the age chips and the home lanes all read `getAgeTimings()` directly.

**Consequence**: the return shape can be extended without a migration. This is why the feature is
two files and not six.

---

## R-3 — The returned `key` is doing two jobs

**Finding**: `key` is both the Vue list key *and* the CSS ramp class —
`:class="['age-seg', segment.key]"` at
[AgeTimeline.vue:33](../../../src/components/builds/AgeTimeline.vue#L33), against
`.age-seg-1 … .age-seg-4` at
[AgeTimeline.vue:441-467](../../../src/components/builds/AgeTimeline.vue#L441-L467).

**Decision**: Keep the conflation rather than break it. Age runs keep `key: 'age-seg-N'` **byte for
byte**; bands get `key: 'age-band-N'`. The template's class binding does not change at all.

*(As first written this finding also gave bands an `estimated` boolean and the template a
conditional modifier class. Both went when US2 was withdrawn — every run is now exactly
`{ key, width }`, which is a stronger version of the same conclusion.)*

**Rationale**: NFR-003 requires a build with no age-ups to produce byte-identical segments.
Splitting `key` into `{ key, kind, step }` would be tidier in the abstract but would make that
requirement something to verify rather than something guaranteed by the diff. The conflation is
also what makes a band's ramp step *automatic* — see R-4.

---

## R-4 — Which ramp step a band takes, worked out

**Finding**: the ramp index is **positional, not the age number**. Segment `N` is the *Nth age of
this build's life*: `age-seg-1` covers Dark up to the first arrival, and the trailing
`age-seg-{ages.length+1}` covers the last age reached to the end of the track.

So the band leading into `ages[i]` must take the colour of the run that *follows* it, which is
`age-seg-${i + 2}` — therefore the band's key is `age-band-${i + 2}`.

Checked against a three-age build: `i = 0` is Feudal, band key `age-band-2`, and the Feudal segment
that follows it is `age-seg-2`. Correct.

**Consequence**: FR-004 ("the colour of the age it leads into") needs no age→colour lookup. The
band and the segment it precedes share an index, so they cannot drift.

---

## R-5 — Zero-duration click-ups exist in the data

**Finding**: [useAgeTimings.js:270](../../../src/composables/builds/useAgeTimings.js#L270) admits a
click-up with `clickUp.seconds <= reached.seconds` — note `<=`. A build that stamps the age-up
section and the age section with the same timestamp therefore produces a real `clickUp` object with
`duration: 0`.

**Decision**: filter it **in `getAgeSegments`, not in `getAgeTimings`**. FR-015 says no band unless
the click-up is strictly before the arrival; FR-012 says the tooltip must keep naming both moments
and the duration. Those are only compatible if the filter lives at the drawing layer.

**Why this matters**: the obvious implementation — `if (age.clickUp) emitBand()` — is wrong, and
wrong in a way that produces a zero-width flex child rather than a visible bug.

---

## R-6 — One edge case in the spec cannot occur

**Spec edge case**: *"A transition running past the end of the scale, where the build's last age-up
never arrives."*

**Finding**: it is unreachable. `getAgeTimings()` only emits a boundary when an `age` section with
steps exists and its arrival resolves ([useAgeTimings.js:183-195](../../../src/composables/builds/useAgeTimings.js#L183-L195),
[:252-255](../../../src/composables/builds/useAgeTimings.js#L252-L255)) — an age-up that never
arrives produces no entry, so there is nothing to hang a band on. And where an arrival *does* exist,
`scaleSeconds` is derived from `lastMoment`, which already takes the max over all age arrivals
([AgeTimeline.vue:255-267](../../../src/components/builds/AgeTimeline.vue#L255-L267)), so the scale
always reaches it.

**Consequence**: no clamping code for the right-hand end. One less branch than the spec implies.

---

## R-7 — Height and crest positions are structurally safe

**Finding**: crests are absolutely positioned from `percent(age.seconds)` inside `.age-ticks`
([AgeTimeline.vue:71](../../../src/components/builds/AgeTimeline.vue#L71)), which is a sibling of
`.age-track`, not a child. `.age-track` is a fixed `height: 12px`.

**Consequence**: FR-019 and FR-020 (unchanged height, unchanged crest positions) hold because of
how the card is built, not because the implementation is careful. They cannot regress unless
someone changes the track's height on purpose.

---

## R-8 — Channel triplets, not `color-mix` *(revised during implementation)*

**Original finding**: `color-mix` is settled precedent here, already shipped at
[BuildOrderEditor.vue:642-648](../../../src/components/builds/BuildOrderEditor.vue#L642-L648), with
the house pattern documented in the comment above it: **declare an `rgba` fallback first, then the
`color-mix` line**, so browsers without support get the flat value.

**Original decision**: lift the four ramp hexes into custom properties `--age-1 … --age-4` on
`.age-track` (per theme), then derive the band fill from them with `color-mix`.

**Revised decision**: the same custom properties, but holding **RGB channel triplets** instead of
hexes, so a band takes its alpha with plain `rgba()` and no `color-mix` is needed:

```css
.age-track  { --age-2: 109, 127, 166; }
.age-seg-2  { background: rgb(var(--age-2)); }
.age-band-2 { --band: var(--age-2); }   /* then rgba(var(--band), …) */
```

**Why it changed**: `color-mix(in srgb, X 45%, transparent)` and `rgba(X, 0.45)` render identically,
but the channel form needs **no fallback declaration at all** — and the fallback was the weak part
of the original decision. An `rgba` fallback must hardcode one theme's hex, so a browser without
`color-mix` would have shown dark-theme Castle on a light surface. The channel form is universally
supported, correct in both themes with no duplication, and is **the form this very file already
uses** for the track's own background,
[`rgba(var(--v-theme-on-surface), 0.08)`](../../../src/components/builds/AgeTimeline.vue#L404) —
Vuetify's own token convention.

Either way FR-005 — "extend the existing ramp rather than introduce a second one" — becomes
*checkable*: there is one place each colour is written, and a band provably cannot be a fifth step
because it has no literal of its own.

**Secondary benefit**: the light theme currently overrides three of four ramp steps with a comment
explaining why Imperial is stated literally
([AgeTimeline.vue:454-467](../../../src/components/builds/AgeTimeline.vue#L454-L467)). As custom
properties this becomes one block of four declarations per theme, and the band inherits both themes
for free — satisfying FR-006 with no per-theme band rules at all.

**Constitution note**: this is a behaviour-neutral refactor and therefore its own commit
(Principle II), landing before anything is drawn.

---

## R-9 — One striped treatment for every band *(superseded during implementation)*

**Superseded.** This finding solved a problem that no longer exists: FR-010 required a hatched band
to match a solid one *exactly* in width, colour **and lightness**, which is unsatisfiable because any
texture is a lightness modulation. The answer was to modulate symmetrically about the solid value so
the mean matched by construction.

**US2 was then withdrawn** (spec, clarification revised 2026-08-07). There is no solid variant, so
there is nothing to match. **Every band is striped**, because that is how an age-up in progress reads
in the game, and provenance is carried by the `~` on the crest and in its tooltip instead.

**What survives — the stripe itself:**

```css
.age-band-2 { --band: var(--age-2); }

.age-band-2, .age-band-3, .age-band-4 {
  background: repeating-linear-gradient(
    45deg,
    rgba(var(--band), 0.25) 0 4px,
    rgba(var(--band), 0.65) 4px 8px
  );
}
```

Both stops are the colour of the age the band leads into, so a band stays unmistakably part of the
ramp and never becomes a fifth step of it (FR-005). The alpha pair no longer needs to average to any
particular value, so it is chosen for stripe contrast rather than to hit a mean.

**Stripe geometry — revised twice, after seeing it render.**

*First attempt*: `repeating-linear-gradient` at a 4px period, i.e. 2px stripes. Drew visibly uneven
stripes. A 2px diagonal edge covers about three pixels horizontally on one row and two on the next,
so the stripes alternate in apparent weight.

*Second attempt, wrong*: tile one 8px square with `background-size` — the Bootstrap
`.progress-bar-striped` recipe. **This made it worse**, for two reasons worth recording:

1. That recipe uses `transparent` for the gaps, and `transparent` is transparent *black*. Every
   antialiased edge blends toward black, leaving grey fringes; a fine diagonal pattern is almost all
   edge, so the fringes dominated and the band desaturated from gold to grey.
2. A tiled background starts at the element's own left edge, which sits at a fractional pixel because
   every run is a percentage width. The tiling introduced the seams it was meant to remove.

*What works*: a continuous `repeating-linear-gradient` again, but with **4px stripes** and **both
stops the band's own colour at different alpha** — never `transparent`. 4px is thick enough that the
one-pixel rasterisation wobble stops being visible, and same-hue stops mean there is no black to
blend toward.

FR-011 still requires the stripe to read at the width of a short age-up, and 4px stripes are coarser
than the 2px they replace — so this trade is real and is checked at quickstart item 17. **If it
fails, the move is 90° vertical stripes, which sit exactly on the pixel grid and cannot alias at
all** — not a finer diagonal, which is where the problem started.

---

## R-10 — Two touching bands, and whether they need a separator

**Case**: FR-017. The age run between two bands has zero width when a build clicks up again at the
instant it arrives, putting `age-band-N` directly against `age-band-N+1`.

**Finding**: the two bands are different ramp steps and therefore different hues — lightened Feudal
`#6d7fa6` against lightened Castle `#b99a4e` is a hue change, not a lightness change, and survives
the lightening. The riskier-looking adjacency, band against the segment it leads into, is the one
FR-004 already forces to be distinguishable, and lightness does that.

**Decision**: rely on hue. **No unconditional separator.** A 1px hairline on every band would be
taken out of the band's own width, which fights FR-008 — on a 6px band it is a sixth of the drawing.

**Verified at**: quickstart item 8, which is the specific check that would justify reversing this.
If it fails, the separator goes on the *left edge of a band that directly follows another band*
only, not on every band.

---

## Summary of what changed

| # | Finding | Effect on the plan |
|---|---|---|
| R-3 | `key` is also the CSS class | Extend the shape instead of redesigning it; NFR-003 met by the diff |
| R-4 | Ramp index is positional | Band colour needs no lookup — `age-band-${i+2}` |
| R-5 | Zero-duration click-ups are real | Filter at the drawing layer, not in `getAgeTimings` |
| R-6 | "Runs past the end of the scale" is unreachable | One branch deleted from the plan |
| R-8 | Channel triplets beat `color-mix` here | Ramp becomes custom properties; FR-005 becomes checkable, with no fallback to get wrong |
| R-9 | *Superseded* — US2 withdrawn | One striped treatment for every band; no solid variant to match |
| R-10 | Adjacent bands differ in hue | No separator, with a named check that would overturn it |
