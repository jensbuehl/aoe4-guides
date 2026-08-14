# Contract: Supporter Configuration and Funding Composable

**Feature**: `036-community-funding-transparency` | **Date**: 2026-08-13

Two interfaces, and they have different audiences. The first is edited by a human once a
month and is the one that must stay obvious years from now. The second is consumed by
components and is the one that must stay cheap.

---

## 1. `src/config/supporters.js` — the maintainer-facing interface

This file *is* the monthly routine. It is edited by hand, committed, and deployed. Its
readability matters more than its elegance.

### Shape

```js
// The year being counted and what the site costs to run for it.
// `year` is rolled over by hand — never derived from the clock, or the goal
// empties itself at midnight on 1 January and looks like a defect.
export const FUNDING = {
  year: 2026,
  costPerYearEur: 240,  // placeholder until confirmed
  coveredEur: 0,        // net total received towards `year`
                        // UPDATE THIS IN THE SAME EDIT AS THE LIST BELOW.
                        // It is the only figure not derived, and its agreement
                        // with SUPPORTERS is a convention, not a guarantee.
};

// Everyone who has contributed during FUNDING.year. WHO, never HOW MUCH.
//
// No per-person amount is stored here, and none may ever be added: this file is
// delivered to every visitor's browser, so anything written in it is public
// whether or not a template renders it. The breakdown lives on the Ko-fi
// dashboard, which already holds it.
//
// Anyone who tipped privately or asked not to be named gets `anonymous: true`
// and no name — they still occupy an entry so the count stays right.
// `uid` only where someone volunteered their username themselves.
export const SUPPORTERS = [
  { name: "Example Person", uid: "abc123..." },
  { name: "Coffee Buyer" },
  { anonymous: true },
];

// Contributed in earlier years. Names only — nothing to count, only to thank.
// Grows at each rollover and never shrinks.
export const EARLIER_SUPPORTERS = [
  { name: "Someone From 2025" },
];
```

### Rules

| Rule | Why |
|---|---|
| **No per-person amount may be stored here, ever** | This file is delivered to every visitor. Not rendering a value does not hide it — the bundle is the privacy boundary, not the template (FR-001d). |
| `FUNDING.coveredEur` is updated in the same edit as `SUPPORTERS` | It is the one figure that cannot be derived, so its agreement with the names is a convention. Splitting the two edits is what would let them drift. |
| A name appears only if that contribution was public at the provider | Ko-fi marks each contribution public or private. Publishing a private tipper's name gives away something they did not offer. |
| `year` is edited by hand, never derived from the clock | An automatic rollover empties the goal at midnight and erases a year of visible progress with nobody deciding to (FR-013c). |
| Omit `name` for anonymity — do not add a flag | The file ships to the browser; a suppressed name is still readable in the bundle. |
| `uid` is optional and supporter-supplied | Nobody may be chased for it (FR-019a). Its absence costs only the badge. |
| Order is presentation order | The wall renders in file order. Newest-last keeps diffs small. |
| No import from this file into `scripts/prerender.mjs` | That script may import nothing but `node:` builtins — see `CLAUDE.md` and research R5. |

### Compatibility

Adding a field to an entry must not break consumers. Removing `SUPPORTERS` entirely must
leave the funding line rendering an honest empty state, not an error.

---

## 2. `useFunding()` / `useSupporters()` — the component-facing interface

Synchronous, no I/O, safe to call during `setup()`. This is the contract that keeps the
footer free: **no consumer of this interface may perform a network request.**

### Funding status

```js
const { year, costEur, coveredEur, shortfallEur, supporterCount, isCovered, state } = useFunding();
```

| Member | Type | Contract |
|---|---|---|
| `year` | number | The calendar year being counted. Must be rendered in every state, so a fresh January reads as a new year rather than as lost data. |
| `costEur` | number | The stated approximate cost for that year. |
| `coveredEur` | number | `FUNDING.coveredEur`, passed through. Never negative. |
| `shortfallEur` | number | `max(0, costEur − coveredEur)`. Never negative — a covered year reports `0`, not a negative gap. |
| `supporterCount` | number | Count of current-year entries, including anonymous ones. Derived, so it cannot disagree with the wall. |
| `isCovered` | boolean | `coveredEur >= costEur`. |
| `state` | `"empty"` \| `"partial"` \| `"covered"` | The three display states. Consumers switch on this rather than re-deriving thresholds, so the empty and over-covered readings cannot drift apart between the footer, About and the account page. |

### Supporter recognition

```js
const { isSupporter, supporters, earlierSupporters } = useSupporters();
```

| Member | Type | Contract |
|---|---|---|
| `isSupporter(uid)` | `(string \| null \| undefined) => boolean` | `false` for null/undefined/unknown. Must never throw on a missing uid — it is called with whatever a build document happens to carry. |
| `supporters` | array | Named current-year entries, in file order. Anonymous entries excluded. |
| `earlierSupporters` | array | Names from previous years, in file order. |

### Placement contract

`FundingStatus.vue` takes a `variant` prop and nothing else — it reads its own data.

| Variant | Used by | Shape |
|---|---|---|
| `"compact"` | `Footer.vue` | One line plus the support action, sized not to push the footer into horizontal overflow at phone width |
| `"card"` | `Home.vue` (both sidebar positions), `About.vue`, `Account.vue` | A Vuetify card matching the surrounding sidebar stack |

**Suppression rule** (FR-007): `Footer.vue` renders nothing when the current route is one
that carries its own funding block — today home, About and account. The list lives in
`Footer.vue` beside a comment saying it must grow whenever a page gains its own block. A
reactive registry was rejected for mount-order flicker; see research R10.

**Consequence**: exactly one funding status per page, everywhere, with no page uncovered.

### Guarantees

- **No network.** Enforced by construction: the data is a bundled module.
- **No `async`.** A footer that flickers a loading state on every page load would be
  worse than the button it replaces.
- **Stable across a session.** The data cannot change without a deploy.

---

## 3. `FocusMode` → parent, on session end

An extension to the existing `closeDialog` emit
(`src/components/builds/FocusMode.vue:1464`).

```js
context.emit("closeDialog", { stepsAdvanced: <number> });
```

| Rule | Why |
|---|---|
| The payload is a fact about the session, not a decision | `FocusMode` must not know the ask exists. The parent decides whether it earns a line. |
| Existing handler must keep working if the payload is ignored | `BuildDetails.vue:10` currently does `focusDialog = false`; that must remain valid. |
| The ask renders in the parent, never in `FocusMode` | FR-029 — the detached PiP window is not the parent, so it cannot appear there. Structure, not a condition. |

---

## 4. Ko-fi

**No integration.** The support action is an ordinary outbound link (FR-011, FR-012). No
webhook, no API call, and specifically **no floating action button or overlay widget**
(FR-011a) — that is a context-free ask on every page, floating over build orders and focus
mode, which is what this feature exists to replace rather than reintroduce. Monthly and
annual are configured on Ko-fi's side and referenced only as URLs.

The support page wording asks supporters to include their site username if they would
like a badge — that prompt is the entire opt-in mechanism (FR-019a), and it lives on
Ko-fi, not in this codebase.
