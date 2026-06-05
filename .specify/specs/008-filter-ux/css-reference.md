# CSS Reference — Filter Bar, Heroes & Count

Exact styling for the redesigned filter bar (right column), the locked-context heroes/page
headers, the active-filter chips, the staged/apply states, and the unified count badge. Every
`var(--*)` is resolved for **both themes**. Source of truth: `Filter UX.html` (project root).

> ## ⚠️ READ FIRST — the controls are Vuetify, not the mock's custom boxes
> The prototype hand-rolls its select boxes **only because it's a framework-free HTML mock** — there is
> no Vuetify in the prototype. **Do NOT reproduce the custom `.fl-control` / `.fl-menu` markup.** In the
> app, keep the **existing Vuetify controls** already in `FilterConfig.vue`:
> - **Civilization, Video Creator** → `v-autocomplete` (searchable) — unchanged
> - **Season, Map, Strategy** → `v-select multiple chips` — unchanged
> - **Sort by** → `v-select`
>
> This feature adds *wrappers and states around* those controls (chips row, pending indicator, sticky
> apply bar, count preview, grouping). The CSS below is for **those new bits + layout + theming** — not
> for re-skinning the selects. See §7 for the full Vuetify mapping.

---

## 1. Resolved tokens (mirror the app's Vuetify theme — `reference/design-tokens.md`)

In the app these are Vuetify theme colors; listed here so every value below is unambiguous.

| Role | Dark | Light |
|---|---|---|
| page `background` | `#1D2432` | `#D8DCE0` |
| `surface` (panel, cards, hero) | `#324156` | `#FAFAFA` |
| `primary` | `#e7c05e` gold | `#294790` navy |
| `primary` text-on | `#1D2432` | `#ffffff` |
| `accent` (eyebrow) | `#e7c05e` | `#b9962f` |
| `secondary` (flag bg) | `#294790` | `#294790` |
| text | `#E9EBEE` | `#1f2733` |
| text-muted | `rgba(233,235,238,.58)` | `#5b6573` |
| divider | `rgba(255,255,255,.10)` | `rgba(0,0,0,.10)` |
| **field fill** | `#2c3850` | `#eceef1` |
| **field hover** | `#3b4d68` | `#e3e6ea` |
| chip fill | `#3a4a61` | `#e7eaef` |
| chip pending tint | `rgba(231,192,94,.16)` | `rgba(41,71,144,.12)` |
| panel shadow | `0 10px 30px rgba(0,0,0,.4)` | `0 10px 30px rgba(40,50,70,.18)` |

### Two contrast fixes baked in (keep these relationships)
1. **Field hover** (dark) is `#3b4d68` — deliberately **lighter than the panel surface** (`#324156`) so a
   hovered field lifts off the card instead of merging into it. (Old `#33415a` ≈ surface = the bug.)
   Pair with an inset border: `box-shadow: inset 0 0 0 1px var(--divider)` on hover.
2. **Count badge** uses a translucent fill (`color-mix(in srgb, <text> 9%, transparent)`) so the *same*
   pill reads correctly on the page background (main list) **and** on a surface-colored hero.

---

## 2. Layout

```css
.fl-page { display: flex; gap: 24px; max-width: 1180px; margin: 0 auto; padding: 32px 24px 80px; align-items: flex-start; }
.fl-results { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 12px; }
.fl-panel   { width: 340px; flex-shrink: 0; position: sticky; top: 20px; }  /* the right column */
@media (max-width: 820px) {           /* mobile: panel above the list, not sticky */
  .fl-page { flex-direction: column-reverse; }
  .fl-panel { width: 100%; position: static; }
}
```
In the app this is the existing `v-row` / `v-col cols=12 md=8` (results) + `v-col cols=12 md=4` (panel).
**Sticky** is the one addition — wrap the panel’s `v-card` so it stays in view while scrolling results.

---

## 3. Unified count badge (one rule, three placements)

```css
.fl-results-count,   /* main list header */
.fl-hero-count,      /* author hero */
.fl-lane-count {     /* civ page, per-list */
  font-size: 12.5px; font-weight: 700; color: var(--text-muted);
  background: color-mix(in srgb, var(--text) 9%, transparent);
  border-radius: 999px; padding: 3px 11px; white-space: nowrap; flex-shrink: 0;
}
```
**Vuetify:** `v-chip size="small" variant="tonal"` gives the same tonal pill — use it in all three spots
so the count is visually identical everywhere. **Rule: the page-identity element owns the count, shown once.**

---

## 4. Filter panel: header, chips, fields, sticky footer

```css
/* header */
.fl-panel-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
.fl-panel-head > span { display: inline-flex; align-items: center; gap: 8px; font-weight: 700; font-size: 15px; }
.fl-panel-head .mdi { color: var(--primary); font-size: 19px; }
.fl-reset { display: inline-flex; align-items: center; gap: 5px; color: var(--text-muted); font-size: 12.5px; font-weight: 600; }
.fl-reset:hover { color: var(--primary); }

/* active-filter chips (THE key UX add) */
.fl-chips { display: flex; flex-wrap: wrap; gap: 7px; margin-bottom: 16px; }
.fl-chips.empty { color: var(--text-muted); font-size: 12.5px; display: flex; align-items: center; gap: 7px; padding: 8px 2px; }
.fl-chip { display: inline-flex; align-items: center; gap: 6px; background: var(--chip); color: var(--text);
           border-radius: 999px; padding: 5px 10px; font-size: 12.5px; font-weight: 600; }
.fl-chip .mdi:first-child { font-size: 14px; color: var(--text-muted); }
.fl-chip-x { font-size: 14px; opacity: .6; }
.fl-chip:hover .fl-chip-x { opacity: 1; }
.fl-chip.pending { background: var(--chip-pending); box-shadow: inset 0 0 0 1px var(--primary); }  /* staged-but-unapplied */
.fl-chip.pending .mdi:first-child { color: var(--primary); }

/* fields (layout/hover only — the field itself is a Vuetify v-select/v-autocomplete) */
.fl-fields { display: flex; flex-direction: column; gap: 10px; }
.fl-control:hover { background: var(--field-hover); box-shadow: inset 0 0 0 1px var(--divider); }  /* contrast fix */

/* pending dot — append-inner on a changed field */
.fl-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--primary); }

/* sort group: separated from filters by a dashed rule, header matches the panel header */
.fl-sortgroup { margin-top: 6px; padding-top: 14px; border-top: 1px dashed var(--divider); }
.fl-sortgroup-label { display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 700; color: var(--text); margin-bottom: 10px; }
.fl-sortgroup-label .mdi { color: var(--primary); font-size: 19px; }

/* sticky footer: apply + count preview, always present (no layout shift) */
.fl-footer { margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--divider); display: flex; flex-direction: column; gap: 8px; }
.fl-apply { display: flex; align-items: center; justify-content: center; gap: 8px; height: 46px; border-radius: 9px;
            font-weight: 700; font-size: 14.5px; background: var(--field); color: var(--text-muted); }
.fl-apply.active { background: var(--primary); color: var(--primary-contrast); }  /* enabled when dirty */
.fl-count { text-align: center; font-size: 13px; color: var(--text-muted); font-weight: 600; min-height: 18px; }
.fl-count .preview { color: var(--primary); display: inline-flex; align-items: center; gap: 5px; }
```

**State model (the heart of it):** keep a `draft` config separate from the `applied` config.
- Editing a field/chip mutates **draft** only — **no Firestore read**.
- Apply button is **enabled only when `draft ≠ applied`**, labelled **"Apply N changes"** (N = number of
  changed facets); disabled state reads **"Filters applied"** — always present, so the panel never reflows.
- **Pending** chips/dots = facets where `draft ≠ applied`.
- On Apply → commit draft → applied, run the query, render results.

---

## 5. Count preview (uses EXISTING infra — no new reads-model)

`Builds.vue` already calls **`getBuildsCount(filterConfig)`** (a count aggregation, not a doc fetch) on
apply. For the live preview, call that same function with the **draft** config (debounced ~300ms) and
show "≈ N results if applied". This honors apply-on-demand: **it never fetches documents**, only a count.

```css
/* preview copy is built as ONE string in JS — `${n} ${n===1?'result':'results'} if applied` —
   never split across JSX/template text nodes, or you get "result s". */
```
If the team prefers zero extra reads, the Tweak `countPreview:"off"` path just shows the applied count
("N shown") — no preview. (Aggregation billing ≈ 1 read per 1000 matched index entries; no doc reads.)

---

## 6. Locked-context heroes / page headers

**Replaces** the tiny 70px contributor `v-card` currently rendered *inside the filter column* (and
duplicated for mobile/desktop). New: a proper **page header in the main column**.

```css
.fl-hero { display: flex; align-items: center; gap: 16px; background: var(--surface); border-radius: 12px; overflow: hidden; margin-bottom: 8px; }
.fl-hero-eyebrow { display: inline-flex; align-items: center; gap: 6px; color: var(--accent); font-weight: 700; font-size: 11.5px; letter-spacing: .3px; margin-bottom: 3px; }
.fl-hero-name { font-size: 22px; font-weight: 800; color: var(--text); }
.fl-hero-sub { color: var(--text-muted); font-size: 14px; margin-top: 3px; }
/* author */
.fl-hero--author { padding: 16px 18px; }
.fl-hero-av { width: 54px; height: 54px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
              font-weight: 800; font-size: 18px; color: var(--primary-contrast); background: var(--accent); }  /* image or initials */
.fl-hero-count { align-self: flex-end; }  /* the count badge from §3 */
/* civ */
.fl-hero--civ { padding: 0; }
.fl-hero-flag { width: 188px; height: 92px; flex-shrink: 0; object-fit: cover; }  /* real civ banner */
```
- **Author header:** avatar (`v-avatar color="accent"`, image or 2-letter initials) + "Build author"
  eyebrow + display name + count badge. Built from the existing `contributor` object already loaded in
  `Builds.vue` (`displayName`, `icon`, `viewCount`, `boCount`).
- **Civ header:** civ banner + name + tagline. Count lives **per-list** on the civ page (see §3 / civ note).

---

## 7. Vuetify mapping (the authoritative "build it with these" table)

| UI piece | Vuetify component | Custom CSS? |
|---|---|---|
| Civ / Creator field | **existing `v-autocomplete`** | none — keep as-is |
| Season / Map / Strategy | **existing `v-select multiple chips`** | none — keep as-is |
| Sort field | `v-select` | none |
| Panel container | `v-card rounded="lg" flat` + sticky wrapper | sticky positioning only |
| Active-filter chips | `v-chip closable size="small"` (row above fields) | pending tint/border (§4) |
| Pending indicator | `append-inner` slot dot, or `v-badge dot` on the field | `.fl-dot` (§4) |
| Sort separation | `v-divider` + a `text-subtitle-1`/700 label | dashed divider (§4) |
| Sticky footer | `v-card-actions` pinned bottom | `.fl-footer` layout |
| Apply button | `v-btn block color="primary" :disabled="!dirty"` | none |
| Count preview / count badge | `v-chip size="small" variant="tonal"` + text | none |
| Author/Civ header | `v-card` + `v-avatar` / `v-img` | hero layout (§6) |
| No results | existing `NoFilterResults` component | none |

**Only genuinely-custom CSS:** the pending tint/dot, the sticky behavior, the dashed sort separator, and
the hero layout. Everything else is stock Vuetify + theme tokens.
