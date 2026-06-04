# CSS Reference — Build Lane Tabs

Exact, copy-pasteable styling for the tabbed build lanes (Trending / All-Time Classics / New) with a
contextual **View all**. Every `var(--*)` is resolved for **both themes**. Source of truth:
`Home Redesign.html` (project root) / `../_home-wireframe/home-wireframe.html`.

> **Scope:** this is the **tab bar + lane container** only. The **build card** (`BuildListCard`) is NOT
> part of this feature — reuse it as-is inside the lane. Card styling is intentionally out of scope.

> **Vuetify-first:** AOE4 Guides is Vuetify. Prefer `v-tabs` + `v-window` for the tab bar / panel
> swap; the values below are the visual contract to match (and the fallback if you hand-roll). This
> honors Constitution III.

---

## 1. Resolved tokens (used by the tabs)

| Token | Dark | Light | Used for |
|---|---|---|---|
| `--primary` | `#e7c05e` (gold) | `#294790` (navy) | active tab label + underline, hover on "View all" |
| `--text` | `#E9EBEE` | `#1f2733` | tab label on hover |
| `--text-muted` | `rgba(233,235,238,.6)` | `#5b6573` | inactive tab label, "View all" |
| `--divider` | `rgba(255,255,255,.1)` | `rgba(0,0,0,.09)` | tab-bar bottom hairline |

---

## 2. Markup (reference)

```html
<!-- tab bar: lanes left, contextual "View all" pushed right -->
<div class="aoe-tabs" role="tablist" aria-label="Build lists">
  <button class="aoe-tab active" role="tab" aria-selected="true"  id="tab-trending">
    <i class="mdi mdi-trending-up"></i> Trending
  </button>
  <button class="aoe-tab"        role="tab" aria-selected="false" id="tab-classics">
    <i class="mdi mdi-star"></i> All-Time Classics
  </button>
  <button class="aoe-tab"        role="tab" aria-selected="false" id="tab-new">
    <i class="mdi mdi-clock-edit-outline"></i> New
  </button>

  <!-- contextual: links to the full Builds list pre-sorted for the active lane -->
  <a class="aoe-tab-all" href="/builds?orderBy=score">View all <i class="mdi mdi-chevron-right"></i></a>
</div>

<!-- one lane visible at a time; reuse the EXISTING build card -->
<div class="aoe-buildlist" role="tabpanel" aria-labelledby="tab-trending">
  <!-- <BuildListCard> × N — unchanged by this feature -->
</div>
```

**View all → orderBy mapping (same as today's section arrows):**

| Active lane | `orderBy` query | mdi icon |
|---|---|---|
| Trending | `score` | `mdi-trending-up` |
| All-Time Classics | `scoreAllTime` | `mdi-star` |
| New | `timeCreated` | `mdi-clock-edit-outline` |

---

## 3. Full CSS (drop-in, resolved)

```css
/* ---- tab bar ---- */
.aoe-tabs {
  display: flex; align-items: center; gap: 4px;
  border-bottom: 1px solid var(--divider);
  margin-bottom: 14px;
}

/* ---- a tab ---- */
.aoe-tab {
  display: flex; align-items: center; gap: 7px;
  padding: 12px 16px;
  color: var(--text-muted);
  font-weight: 600; font-size: 14px;
  border-bottom: 2.5px solid transparent;
  margin-bottom: -1px;                 /* overlap the bar's hairline */
  transition: color .15s;
}
.aoe-tab .mdi { font-size: 17px; }
.aoe-tab:hover { color: var(--text); }
.aoe-tab.active {                       /* selected lane */
  color: var(--primary);
  border-bottom-color: var(--primary);
}
.aoe-tab:focus-visible {                /* a11y: keyboard focus */
  outline: 2px solid var(--primary); outline-offset: -2px; border-radius: 4px;
}

/* ---- contextual "View all" ---- */
.aoe-tab-all {
  margin-left: auto;                    /* push to the right edge */
  color: var(--text-muted);
  font-size: 13px; font-weight: 600;
  display: flex; align-items: center;
  text-decoration: none;
}
.aoe-tab-all:hover { color: var(--primary); }
```

The animated underline here is a simple `border-bottom-color` swap on `.active`. If you want a sliding
indicator, `v-tabs` provides one natively (`v-tabs-slider`) — see §5.

---

## 4. Behavior contract

1. **One lane visible at a time.** Selecting a tab swaps the visible list **in place** — no page
   navigation, no refetch (all three lanes come from the already-loaded home snapshot).
2. **Default = Trending.**
3. **View all is contextual.** It always targets the active lane's sort on the existing **Builds**
   route (table in §2) — identical to the behavior of today's per-section arrows. It's a real link
   (navigates), unlike the tabs (which swap in place).
4. **No duplicate fetch.** Switching tabs only changes which in-memory slice renders.
5. **(If hero feature 007 is present)** the featured build is the active lane's #1 and is excluded
   from the list below — but the hero is a separate feature; tabs must work with or without it.

---

## 5. Vuetify mapping (recommended)

| Piece | Vuetify-native | Notes |
|---|---|---|
| Tab bar | `v-tabs` `density="comfortable"` `color="primary"` `slider-color="primary"` | native sliding underline + roving-tabindex a11y |
| A tab | `v-tab :value="key"` with `prepend-icon` | `v-tab` is already a `role="tab"` button |
| "View all" | `v-spacer` + `v-btn variant="text" size="small" :to="..."` inside the `v-tabs` slot, OR a plain link aligned right | `:to` carries the `orderBy` query |
| Lane panel | `v-window` / `v-window-item` keyed to the same values | swaps in place; keep all panels mounted to avoid refetch fl/jank, or render the active slice |
| Build card | **existing `BuildListCard`** | unchanged — out of scope |

**Accessibility (must-hold):**
- Use the `tablist`/`tab`/`tabpanel` roles with `aria-selected` and `aria-controls`/`aria-labelledby`
  (or let `v-tabs`+`v-window` wire it). Arrow-key roving focus between tabs (native in `v-tabs`).
- Visible focus ring on tabs (see CSS).
- "View all" is a link (announced as such), distinct from the tabs.
- Respect `prefers-reduced-motion` for the underline slide / panel transition.

---

## 6. Why tabs (vs. today's 3 stacked lists)

| | Today | This feature |
|---|---|---|
| Structure | 3 lists stacked vertically | 3 tabs, one list visible |
| Repetition | same build often appears in 2–3 lists → reads as filler | one list at a time → no visible dupes |
| Height | very tall (3× the rows) | ~⅓ — one lane's worth |
| Discovery | all visible but buried | all one click away, top of section |
