# CSS Reference — Featured "Hero" Build

Exact, copy-pasteable styling for the featured hero. Every `var(--*)` is resolved for **both themes**,
because the **theme-aware fade is the whole point** of this component and must not be approximated.
Source of truth: `Home Redesign.html` (project root) / `../_home-wireframe/home-wireframe.html`.

> **Match this exactly.** The hero's legibility depends on the gradient direction, stops, and the
> per-theme fade color + title/text/shadow values below. Don't substitute a generic dark overlay —
> in light theme it must fade to **white** with **navy** text.

> **Vuetify-first:** wrap in a `v-card`; the flag is a `v-img`. The diagonal scrim, the text overlay,
> and the per-theme fade are the genuinely custom bits (justified — Vuetify can't express them).

---

## 1. Resolved tokens (hero-specific)

The hero introduces four theme variables on top of the base palette. **These exact values:**

| Variable | Dark | Light | Meaning |
|---|---|---|---|
| `--hero-fade` (RGB triplet, no `rgb()`) | `20,26,37` | `250,250,250` | base color the flag fades into — **near-black on dark, near-white on light** |
| `--hero-title` | `#fff` | `#294790` (navy) | hero title color |
| `--hero-text` | `rgba(255,255,255,.86)` | `#41506b` | description color |
| `--hero-meta` | `rgba(255,255,255,.82)` | `#5b6573` | meta-row text |
| `--hero-shadow` | `0 2px 8px rgba(0,0,0,.5)` | `none` | title legibility shadow (only needed on dark) |

Plus base tokens used as-is:

| Token | Dark | Light | Used for |
|---|---|---|---|
| `--accent` | `#e7c05e` (gold) | `#b9962f` (muted gold) | the eyebrow ("#1 Trending · Ottomans") |
| `--shadow` | `0 8px 28px rgba(0,0,0,.35)` | `0 8px 28px rgba(40,50,70,.16)` | card elevation |

**Define them in each theme block** (mirrors the app's Vuetify theme; in CSS-var terms):

```css
.theme-dark  { --hero-fade: 20,26,37;   --hero-title:#fff;     --hero-text:rgba(255,255,255,.86); --hero-meta:rgba(255,255,255,.82); --hero-shadow:0 2px 8px rgba(0,0,0,.5); }
.theme-light { --hero-fade: 250,250,250; --hero-title:#294790; --hero-text:#41506b;               --hero-meta:#5b6573;               --hero-shadow:none; }
```

---

## 2. Markup (reference)

```html
<!-- whole hero is one link/button to the build's detail -->
<button class="aoe-featured" type="button"><!-- or <router-link> to BuildDetails -->
  <img class="aoe-featured-bg" src="/assets/flags/ott.webp" alt="" aria-hidden="true" />
  <span class="aoe-featured-scrim"></span>
  <div class="aoe-featured-content">
    <!-- eyebrow label changes per lane (see §4); icon should match the lane -->
    <span class="aoe-featured-eyebrow"><i class="mdi mdi-trending-up"></i> #1 Trending · Ottomans</span>
    <h2 class="aoe-featured-title">Pax Otomana — Fast Imperial Rush</h2>
    <p class="aoe-featured-opening">Beeline the Vizier Point and rush a 1100-resource Imperial age…</p>
    <div class="aoe-featured-row">
      <span class="aoe-badge aoe-badge--strat"><i class="mdi mdi-strategy"></i>Fast Imperial</span>
      <span class="aoe-featured-meta"><i class="mdi mdi-account-edit"></i>BeastyqtSC2</span>
      <span class="aoe-featured-meta"><i class="mdi mdi-clock-edit-outline"></i>6 mo</span>
      <span class="aoe-featured-meta"><i class="mdi mdi-eye"></i>14.2k views</span>
    </div>
  </div>
</button>
```

The flag `<img>` is decorative (`alt=""`/`aria-hidden`) — the title text carries the accessible name.

---

## 3. Full CSS (drop-in, resolved)

```css
/* ---- hero shell ---- */
.aoe-featured {
  position: relative; display: block; width: 100%;
  border-radius: 16px; overflow: hidden;
  min-height: 230px;
  box-shadow: var(--shadow);
  text-align: left;                  /* it's a <button> */
  cursor: pointer;
}

/* flag, full-bleed behind everything */
.aoe-featured-bg {
  position: absolute; inset: 0;
  width: 100%; height: 100%; object-fit: cover;
}

/* the theme-aware diagonal fade — flag stays visible on the right */
.aoe-featured-scrim {
  position: absolute; inset: 0;
  background: linear-gradient(105deg,
    rgba(var(--hero-fade), .96) 30%,   /* solid fade color over the text */
    rgba(var(--hero-fade), .58) 62%,
    rgba(var(--hero-fade), .14) 100%); /* flag shows through on the right */
}

/* text column */
.aoe-featured-content { position: relative; padding: 26px 30px; max-width: 640px; }

.aoe-featured-eyebrow {
  display: inline-flex; align-items: center; gap: 6px;
  color: var(--accent);              /* gold */
  font-weight: 700; font-size: 12.5px; letter-spacing: .4px;
}
.aoe-featured-eyebrow .mdi { font-size: 16px; }

.aoe-featured-title {
  color: var(--hero-title);          /* #fff dark / navy light */
  font-size: 27px; font-weight: 800; line-height: 1.15;
  margin: 10px 0 8px;
  text-shadow: var(--hero-shadow);   /* shadow on dark, none on light */
}

.aoe-featured-opening {
  color: var(--hero-text);
  font-size: 14px; line-height: 1.5; margin-bottom: 16px;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}

.aoe-featured-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.aoe-featured-meta {
  color: var(--hero-meta);
  font-size: 12.5px; font-weight: 500;
  display: inline-flex; align-items: center; gap: 5px;
}
.aoe-featured-meta .mdi { font-size: 14px; }

/* strategy badge — fixed franchise navy, reads on any flag and both themes */
.aoe-badge {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 11.5px; font-weight: 600; padding: 4px 10px; border-radius: 7px; white-space: nowrap;
}
.aoe-badge .mdi { font-size: 13px; }
.aoe-badge--strat { background: #294790; color: #fff; }

/* focus ring for keyboard users */
.aoe-featured:focus-visible { outline: 3px solid var(--accent); outline-offset: 3px; }

/* responsive */
@media (max-width: 720px) { .aoe-featured-title { font-size: 22px; } }
```

---

## 4. Per-lane hero (composes with feature 006 tabs)

The hero shows the **active lane's #1 build** and swaps when the tab changes. The eyebrow label
changes accordingly:

| Active lane | Eyebrow text | Suggested icon | Hero build |
|---|---|---|---|
| Trending | `#1 Trending · <Civ>` | `mdi-trending-up` | top by `score` |
| All-Time Classics | `#1 All-Time Classic · <Civ>` | `mdi-star` | top by `scoreAllTime` |
| New | `Latest Build · <Civ>` | `mdi-clock-edit-outline` | most recent |

> **Prototype note (be faithful, but):** the mock currently hard-codes the `mdi-trending-up` icon in
> the eyebrow for all three lanes. The **label text** already varies per lane (above). Recommended:
> also switch the icon to match the lane (column 3). If you want a 1:1 copy of the prototype, keep
> `mdi-trending-up` throughout — but the varying icon is the intended polish.

**Exclusion rule:** the hero's build MUST NOT also appear as the first item of the lane list below it
(de-dupe by id). If the active lane has zero builds, hide the hero.

---

## 5. Behavior & accessibility

1. **Whole hero is one click target** → navigates to that build's detail (existing `BuildDetails`
   route). Use a `<router-link>` or a `v-card :to>`; if a `<button>`, wire the same navigation.
2. **Flag is decorative** (`alt=""`, `aria-hidden`); the `<h2>` title is the accessible name.
3. **Title contrast** is guaranteed by the `.96`-alpha fade at the text side in both themes
   (white-on-near-black / navy-on-near-white). If you tweak the gradient, re-check ≥4.5:1.
4. **Focus ring** via `:focus-visible` (gold, offset).
5. **Description** clamps to 2 lines (`-webkit-line-clamp`); keep the clamp so tall descriptions don't
   blow out the hero height.
6. **Reduced motion**: if you animate the tab→hero swap, gate it behind
   `@media (prefers-reduced-motion: no-preference)`; the base (static) hero must render without it.

---

## 6. Vuetify mapping

| Piece | Vuetify-native | Custom CSS? |
|---|---|---|
| Shell | `v-card rounded="lg"` `:to="buildPath"` (elevation, ripple, focus) | minor: `min-height`, `overflow:hidden` |
| Flag | `v-img cover` absolutely filling the card | — |
| Scrim | — | **yes** — the `linear-gradient(105deg, rgba(var(--hero-fade)…))` (theme-aware) |
| Title / text / meta | `v-card-title` / `v-card-text` or plain elements | color via the `--hero-*` vars |
| Strategy badge | `v-chip size="small" color="#294790"` (or `secondary`) | — |
| Eyebrow | plain inline span + `v-icon size="x-small"` | color `var(--accent)` |

The scrim + the `--hero-*` theme variables are the parts to copy **verbatim** — everything else is
ordinary Vuetify.
