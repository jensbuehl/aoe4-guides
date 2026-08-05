# Quickstart — Manual Verification: Step Time Resolution

**Feature**: `022-step-time-resolution` | **Spec**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md)

No formal suite (constitution: manual golden-path testing). This is the pass to run before merging,
in order. Steps 1 and 2 must happen **before** any behaviour change lands.

---

## 0. Prerequisites

```powershell
# dev credentials — the Admin SDK ignores .firebaserc aliases, so the key IS the target
$env:GOOGLE_APPLICATION_CREDENTIALS = "C:\path\to\dev-sa.json"
```

Scratchpad for golden files (not committed):
`C:\Users\jensb\AppData\Local\Temp\claude\...\scratchpad\`

---

## 1. Golden file on `main` — BEFORE any change (R-9, gates SC-005)

"Every build that autoplays today announces every step at the same second" cannot be checked by
looking at a screen. Capture the baseline first or it is gone.

```powershell
git switch main
node scratchpad/probe.mjs --dump > scratchpad/golden-main.json
```

Covers the nine SC-003 fixtures. Keep it — step 8 diffs against it.

---

## 2. Backfill dry run on `main` — the population baseline (R-7, R-1)

```powershell
npx esbuild scripts/backfill-age-timings.mjs --bundle --platform=node --external:firebase-admin --alias:@=./src --outfile=scripts/.build/backfill.cjs
node scripts/.build/backfill.cjs > scratchpad/backfill-main.txt
```

Dry run is the default — **it writes nothing**. Record:

| Metric | `main` | after | Notes |
|---|---|---|---|
| builds processed | | | expect ~4k |
| builds with no derivable timings | | | should **drop** — D3 alone recovers some |
| builds gaining an age only via extrapolation | n/a | | new counter |
| builds running past the 8-step / 120 s horizon | n/a | | drives A-11's trade-off |

The last two rows are the evidence A-9 asked for and the basis for keeping or moving FR-009's
constants. **Fill this table in before deciding they are right.**

---

## 3. The four Evidence shapes (SC-001, US1)

```powershell
node scratchpad/probe.mjs
```

| # | Assert |
|---|---|
| D1 | `[1]` is finite, not `NaN`; inside `600–660` |
| D2 | `[3]` is **not** `480`; every entry inside `120–240` and non-decreasing |
| D3 | returns non-`null`; the note is `unresolved`; its neighbours resolve |
| D4 | `[1]` inside `120–240`, not running backwards |

Plus, over all fixtures: no `NaN`, no `Infinity`, no negative, and every non-`stated` run
non-decreasing (G-2 … G-6).

---

## 4. `"alid"` is gone (SC-002)

The bug that motivated the feature. On `main`, a build with a same-count span shows a step time of
**`alid`** in Focus mode.

1. Open the D1 fixture in Focus mode on `main` — confirm you can see it. *(Confirming the bug exists
   before fixing it is the point; skip this and step 8 proves nothing.)*
2. On the branch, reopen — the time reads `~10:30` or similar, matching `m:ss` with an optional `~`.
3. Sweep the fixture set: no rendered time fails `/^~?\d?\d:\d\d$/`.

---

## 5. Focus mode's gate and marking (US4, SC-005a, SC-005b)

| Fixture | Autoplay on `main` | Required after | Marking |
|---|---|---|---|
| fully stamped | yes | **yes**, same seconds | no `~` on stated steps |
| legacy flat + note | **no** (D3) | **yes** | `~` on interpolated steps |
| stamped-then-blank | **no** | **yes** | `~` on the extrapolated tail |
| runs past horizon | no | **no** — still refused | n/a |
| no timestamps at all | no | **no** | n/a |

Also check the "fully stamped" build's interpolated middle steps **do** now show `~` (US4.6). That is
the one deliberate change to a build that already autoplayed — expected, not a regression.

---

## 6. The three tiers on screen (US3, FR-019 … FR-023)

Detail page, `md` and wider:

- [ ] stated age → `3:40`, no marker, full emphasis
- [ ] interpolated age → `~3:40`, de-emphasised, footnote **"~ estimated from villager count"**
- [ ] extrapolated age → `~8:30`, **same** marker and emphasis, footnote **"~ projected past the last stated time"**
- [ ] a build spanning both derived tiers → footnote names the **weaker** (FR-021)
- [ ] economy plot: solid up to the last anchor, **dashed** after it, no visible break at the join
- [ ] both themes; nothing has moved a pixel (FR-023)

Home lanes and list cards (`AgeChips`, `BuildListCard`) — these read `derived`, which is unchanged by
design (R-2):

- [ ] chips and rows render exactly as on `main`. **Any** visual diff here means `derived` was
      replaced instead of kept, and is a bug.

---

## 7. Backfill for real (R-1 — without this the fixes are invisible)

`useAgeTimings` prefers the stored field over deriving, so every existing build keeps showing the old
wrong number until this runs.

```powershell
node scripts/.build/backfill.cjs            # dry run — diff against scratchpad/backfill-main.txt
node scripts/.build/backfill.cjs --apply    # ~4k writes, one time
```

- [ ] dry run first, on **dev**, and eyeball the printed first-20 diff
- [ ] the printed project id is the one you meant — the credentials are the only thing selecting it
- [ ] apply on dev; spot-check three builds on the detail page and the home lane
- [ ] `updateHomeSnapshot` runs hourly and copies the field through — home lanes correct themselves
      within an hour, no second backfill
- [ ] repeat on prod only after dev looks right

~4k writes against a 20k/day free-tier allowance (Principle IV).

---

## 8. Golden diff (SC-005)

```powershell
node scratchpad/probe.mjs --dump > scratchpad/golden-branch.json
code --diff scratchpad/golden-main.json scratchpad/golden-branch.json
```

Every difference must be explainable as one of:

- a D1–D4 defect corrected, or
- a step that was `unresolved` on `main` and is now `extrapolated`, or
- a build whose gate flipped `null` → resolved (D3 or Q1).

**Anything else — a correct time that moved — is a regression.** This is the check that separates
fixing a wrong number from breaking a right one.

---

## 9. Performance (NFR-004)

- [ ] 30-step build: resolution under 5 ms (`performance.now()` around the call)
- [ ] detail page shows no new jank on load; the plot still mounts only on first expand

---

## Recorded results

**Implementation pass, 2026-08-05.** Baseline captured at `8c5ee4b` (the branch tip, **not** `main`)
— the rich-text sanitizer fix had already landed there, and diffing against `main` would have mixed
that improvement into this feature's numbers.

### Golden diff (step 8) — the SC-005 guard

| Metric | Result |
|---|---|
| Fixtures | 9 |
| Gate flips | **3**, all intended |
| Step-time changes | 16 |
| Previously-correct times that **moved** | **2** — both in the D2 fixture, both the defect being fixed |
| Unexplained regressions | **0** |

Gate flips:

| Fixture | Before | After | Cause |
|---|---|---|---|
| `D3-legacy-flat-with-note` | no autoplay | autoplay | D3 fix — notes exempt |
| `stamped-then-blank` | no autoplay | autoplay | Q1 — extrapolated admitted |
| `age-ups-only` | no autoplay | autoplay | **wider anchor rule** (see below) |

The two moved times are `D2 [2] 210 → 150` and `D2 [3] 480 → 210`. The `480` was the four-minute
overshoot past a span ending at `240`; `210` was downstream of the same poisoned delta. Both are
corrections, not regressions.

### Evidence shapes (step 3)

| # | Before | After |
|---|---|---|
| D1 | `[1] = NaN`, build reported **valid** | `[1] = 630`, interpolated, inside the span |
| D2 | `[3] = 480` — 4 min past a span ending at 240 | `[3] = 210`, all inside `[120, 240]`, non-decreasing |
| D3 | `getTimings() → null` for the whole build | resolves; note `unresolved`, neighbours fine |
| D4 | `[1] = 180` from a negative divisor | `[1] = 180` via even spacing — right for the right reason |

All guarantees G-1 … G-7 hold, including seven hostile inputs (`null`, `undefined`, non-array,
null-steps, unparseable times, negative cells) — all of which **threw** on the baseline.

### Deviation found during implementation

**FR-004 was widened**: an anchor is any step whose timestamp parses, with no villager count
required. Requiring one denied every time to the `age-ups-only` shape — a build stamped only at its
age-ups, which the spec itself calls common. That fixture now resolves fully and gains autoplay.
Recorded as correction 4 in [plan.md](plan.md#spec-corrections--applied-2026-08-05).

### Performance (step 9)

`resolveStepTimes()` on a 30-step build: **0.0255 ms/call** (1000 iterations, warmed). Budget 5 ms —
passes by ~200×. `npm run build` succeeds.

### Scope (T041)

Six files changed. `villagerAggregator.js`, `AgeChips.vue`, `BuildListCard.vue` all **0 diff lines**
— SC-007 and SC-009 hold.

### Horizon tuned from a live build, not from the dry run

The drafted 8-step / flat-120-second horizon was **wrong**, and a real build found it before any
sampling did. Build `dp327Qkncfk5mkj6BUSd`, 10 steps stamped to 18:00 with one unstamped step after
it, reported:

```
[autoplay] off — 1 of 10 steps unresolved. Last stated time 18:00. Blocking step indices: [9]
```

One step, one position past the last stamp, exceeding a 120 s cap **on its own advance** — and that
single unresolved step cost the whole build its autoplay.

**Root cause**: a step is not a unit of time. Dark Age steps land ~20 s apart; a single Imperial step
can be four minutes. The flat cap was calibrated for the opening and refused the endgame.

**Fix** (FR-009, FR-009a):

| | Before | After |
|---|---|---|
| Step bound | 8 | 8 (unchanged) |
| Duration bound | flat 120 s | `max(120 s, 25% of the build's measured span)` |
| First projected step | subject to the bound | **always placed** |

Verified: the late-game shape now resolves step [9] at 19:30 and gains autoplay, while
`runs-past-horizon` is **unchanged** — still stopping at [7], still refused. The runaway guard
survived the loosening. Added as a permanent fixture, `late-game-imperial`; the set is now ten.

Golden diff re-run after the change: **identical** — same 3 gate flips, same 2 moved times, both D2.

### Later refinements, all from live feedback rather than the fixture set

| Change | Why | Spec |
|---|---|---|
| First step is **always 0:00**, outranking even a stated time | A build order describes a game from its opening; the first step needs no measuring | FR-010 |
| A build whose only anchor is that forced 0:00 is **not** extrapolated | Projecting a whole build off one synthetic point is invention, not estimation | FR-010a |
| Focus mode marks the **displayed clock**, not `step.time` | `step.time` is never rendered — only re-parsed. The original marker decorated a value nobody sees | FR-015a |
| Build order table shows resolved times in the empty time cell | Where the resolver becomes visible at all; previously it surfaced only as three crests and a plot | FR-024 |
| …but **never in the editor** | The cell is an input; offering an author a time they did not write invites saving it, poisoning future anchors | FR-024a |
| Villager clock distrusted above **30 s/villager**, in interpolation **and** extrapolation | A rate that slow is an author skipping ahead, not glacial production | FR-007a, FR-008a |
| Fallback splits by signal: a step that **adds villagers** uses the nominal 20 s rate; only a step that adds **nobody** uses step cadence | A step that adds a villager took as long as that villager took to make — charging it a five-minute cadence is the same implausibility the rule rejects | FR-008a |

Fixture set is now **twelve**, with `late-game-imperial` and `unreliable-villager-clock` both taken
from real shapes rather than designed. Final golden diff: **5 gate flips, all intended; 2 moved
times, both D2 corrections; 0 unexplained regressions.**

### Still outstanding

- **Backfill distribution**: not measured (T003, T035–T038 — credentials). Now low priority: the
  backfill only affects list-card and home-lane chips (R-1 correction), not the detail view.
- **Visual verification**: not done (T019, T029, T033 — needs a browser).
- The `HORIZON_SPAN_SHARE` of 25% is tuned against **one** real build plus the fixture set. A dry-run
  distribution would still be worth having before calling it settled.
