# Quickstart: verifying map types and strategy guidance

## 1. Normalisers (no browser)

Use a throwaway harness at the repo root with the alias loader from `CLAUDE.md`, and delete both
afterwards. Check:

| call | expected |
|---|---|
| `normaliseMap("Open")`, `("Closed")`, `("")`, `(null)`, `("null")`, `("Arabia")` | `Land` |
| `normaliseMap("water")`, `(" Hybrid ")` | `Water`, `Hybrid` |
| `normaliseStrategy("fast castle")` | `Fast Castle` |
| `normaliseStrategy("Abbey of Kings Fast Castle → White Tower Knight Pressure")` | `Fast Castle` |
| `normaliseStrategy("Ultra Fast Imperial (no Daimyo)")`, `("Feudal Rush")` | `Fast Imperial`, `Rush` |
| `normaliseStrategy("Pro Scouts → Varangian Flood Timing")`, `("Aggression")`, `("null")`, `(null)` | `""` |
| a value naming two options, e.g. `"Rush into Fast Castle"` | `""` |

## 2. Rules (emulator; needs Java, see the project memory note)

```sh
git show main:firestore.rules > "$SCRATCH/rules-deployed.rules"   # T002, before editing
RULES_FILE="$SCRATCH/rules-deployed.rules" npm run test:rules   # F1–F8 must FAIL here
npm run test:rules                                        # everything passes
```

## 3. Cleanup (dev first, then prod)

```powershell
npx esbuild scripts/backfill-map-strategy.mjs --bundle --platform=node --external:firebase-admin --alias:@=./src --outfile=scripts/.build/map-strategy.cjs
$env:GOOGLE_APPLICATION_CREDENTIALS = "C:\path\to\sa.json"
node scripts/.build/map-strategy.cjs           # dry run: review the old → new table
node scripts/.build/map-strategy.cjs --apply
node scripts/.build/map-strategy.cjs           # must report 0 changes (SC-001)
```

## 4. Browser (`ux-gate` rig: 393 Android, 1280; light and dark)

1. **Editor, new build**: map is Land, with no clear button. The strategy options each show their
   explanation, and strategy can be cleared.
2. **Filter**: map offers Land / Water / Hybrid. Strategy shows the same explanations.
   - At 1280, as subtitles in the select.
   - At 393, in the bottom sheet: "What do these mean?" under the Strategy chips, collapsed by
     default, toggles the six lines.
   - The sheet still fits the screen when expanded.
3. **Land filter**: the count is about the total minus Water and Hybrid (SC-002).
4. **Cards and details**: no map on a Land build; Water and Hybrid are shown.
5. **Import** an overlay file with `map: "Arabia"`, `strategy: "Aggression"`. The editor shows Land
   and no strategy, and the save succeeds.
6. **Publish** a build with no strategy. There is no prompt (SC-005).
7. **Combination guard** (SC-006): select 3 seasons, 2 maps and all 6 strategies.
   - Apply is disabled with the one-line reason, in both the card and the sheet.
   - No count preview is requested and no Firestore error appears in the console.
   - Removing one strategy (30) re-enables Apply.

## 5. Gates

- `npm run build`
- `npm run check:setup` (`.vue` files are touched)
- `npm run check:steps` (buildService)
- `npm run test:rules` before deploying `firestore.rules`
