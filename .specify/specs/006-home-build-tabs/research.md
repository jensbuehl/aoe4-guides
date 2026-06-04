# Research: Home Build Lane Tabs

**Date**: 2026-06-04 | **Feature**: 006-home-build-tabs

## Decision Log

### 1. Tab implementation: `v-tabs` + `v-window` vs. custom tab component

**Decision**: Vuetify `v-tabs` + `v-window`

**Rationale**: Vuetify's tab primitives provide `tablist`/`tab`/`tabpanel` ARIA roles, `aria-selected`, `aria-controls`/`aria-labelledby` panel association, roving arrow-key focus, and the primary-color underline indicator — all out of the box. FR-006 requires the full tab interaction model; building it manually would violate Constitution I (simplicity) and III (Vuetify first).

**Alternatives considered**: Custom div-based tabs with manual ARIA — rejected; significantly more code, more a11y risk, Constitution violation. `v-btn-toggle` — rejected; not a tab pattern, no panel association.

---

### 2. Active tab state: `ref` vs. sessionStorage vs. URL

**Decision**: `ref('trending')` — resets to Trending on every Home visit

**Rationale**: Clarified (Option A). Simple reactive ref is zero overhead, keeps the component stateless, and the default (Trending) is always the most relevant starting point. sessionStorage and URL state add coupling for marginal UX gain on a home-page pattern.

**Alternatives considered**: sessionStorage (persists within tab) — rejected by clarification. URL query (shareable, back-button aware) — rejected as out of scope.

---

### 3. View all placement: inside `v-tabs` vs. separate row

**Decision**: Flex wrapper row — `v-tabs` (flex: 1) + `v-btn` right-aligned

**Rationale**: Vuetify's `v-tabs` component doesn't natively support slotting arbitrary content at the right end of the tab bar without hacking its internal DOM. A simple `d-flex align-center` row containing both the `v-tabs` component and the `v-btn` is cleaner and more maintainable.

**Alternatives considered**: Appending button as a tab item (slot) — rejected; creates a11y confusion (a link inside a tablist). Floating position absolute — rejected; breaks responsive flow.

---

### 4. Lane configuration: static constant vs. repeated template blocks

**Decision**: Static `lanes` array constant `[{ value, label, icon, orderBy }]`

**Rationale**: Three nearly-identical blocks would be duplicated markup. A lanes array allows `v-for` rendering of tabs and a `computed` lookup for `viewAllRoute` — consistent with Constitution II (no duplication).

**Alternatives considered**: Three hardcoded `v-tab`/`v-window-item` blocks — rejected; duplicate code, harder to maintain if lane labels change.

---

### 5. Reduced motion handling for `v-window` transitions

**Decision**: Pass `transition="false"` and `reverse-transition="false"` to `v-window` when `prefers-reduced-motion: reduce` is active; detect via CSS custom property or `window.matchMedia`

**Rationale**: `v-window` accepts string transition names or `false` to disable. Checking `window.matchMedia('(prefers-reduced-motion: reduce)').matches` in setup() gives a reactive-compatible boolean. FR-008 requires this; Vuetify doesn't disable its own window transitions automatically.

**Alternatives considered**: CSS `@media (prefers-reduced-motion)` override on `.v-window__container` — rejected; harder to scope and test than a prop-level disable.
