---
name: aoe4-civ-release
description: Bring a new Age of Empires IV civilization (DLC) into AoE4 Guides end to end — civ registration in both repos, every icon in both sizes into the right icon JSON, flags, plurals, credits — using the Admin Icon Gap Sync logic headless against AOE4World data, then audit it. Use when a DLC or patch adds civs or many items, when AOE4World publishes new data, or when asked to "prepare the new civs", "sync the icons", or check that a civ is complete.
---

# New civ release

The icon lists (`src/composables/builds/icons/json/*.json`, ~1,000 entries) are
filled from [AOE4World's data](https://github.com/aoe4world/data). The Admin
page's **Icon Gap Scanner** does it in a browser; `scripts/gap-sync.mjs` runs the
*same functions* — extracted from `src/views/Admin.vue` at runtime — from the
shell, so a fix in the tool is a fix here and the other way round.

## 0. Before the data exists

Register the civ everywhere, with placeholders. These places are not checked
against each other — grep the previous civ's code across both repos and
compare hit counts:

| Where | What |
|---|---|
| `src/composables/filter/civDefaultProvider.js` | title, code, tagLine, flags (alphabetical) — also feeds the SEO snapshot |
| `src/composables/builds/icons/civs.js` | code |
| `src/composables/converter/use{Export,Import}OverlayFormat.js` | RTS Overlay names |
| `src/composables/builds/icons/general.js` | flag as a build-step icon, with the civ description |
| `src/views/Admin.vue` `CIV_SLUG_MAP`, `CIV_FOLDER_SLUG` | AOE4World's own code (`vik`, `gol`, `tug`) → ours, and the folder slug (`vikings`) |
| `functions/builds/updateRecentCivBuilds.js` | code — **deploys separately** (`firebase deploy --only functions:updateRecentCivBuilds`); JIN was missing here for five months |
| `aoe4-guides-api` `src/types/civilization.ts` | tsoa enum — without it `?civ=XXX` is a 400; deploy with `gcloud run deploy aoe4-guides-api --source . --region europe-west3` |

AOE4World's codes and official taglines (`classes`) and descriptions are in
`civilizations/civs-index.json` and `civilizations/<slug>.json` once published.

## 1. Get the data

`data.aoe4world.com` is GitHub Pages for the data repo's `main` and serves
nothing else. Before merge, CascadeFury / the AOE4World team publish a feature
branch (Raiders of the North: `feature/patch-vikings-scots`). Read it raw:

```sh
D=<scratchpad>/data; R=https://raw.githubusercontent.com/aoe4world/data/<branch>
mkdir -p $D/opt $D/all $D/civ
for t in units buildings technologies abilities; do
  curl -s --compressed -f $R/$t/all-optimized.json -o $D/opt/$t.json
  curl -s --compressed -f $R/$t/all.json -o $D/all/$t.json
done
```

A feature branch usually carries **patches for other civs** too. Apply only the
new civs' gaps (`--civs`) and leave the rest to a regular sync.

## 2. Dry run, review, apply

```sh
K=.claude/skills/aoe4-civ-release/scripts
node $K/gap-sync.mjs . $D --civs=VIK,SCO --branch=<branch>     # writes $D/report.json
```

Review `report.json` before applying — this is where the judgement is:

- **unconfirmed**: a displayClass the rules do not know. Add it to
  `suggestCategory` in Admin.vue (keeps the tool learning) rather than overriding.
- **newItems by category**: read the technologies. AOE4World files eco techs
  under civ-specific classes ("Longhouse Upgrades", "Lowland Technology"), so
  read descriptions — gathering, food, gold, wood → `techEco`. Pass those as
  `--overrides=<file>` `{ "<name>": "techEco" }`.
- **variants**: a title with several artworks (Villager ×8). AOE4World's icon
  for the civ tells you which — compare it pixel-wise with the local options.
- **extensions**: civ-named ship entries (Galley/Dhow/Junk share a baseId and
  artwork) must land on the entry *named* like the source item.

```sh
npm i --prefix <scratch>/img sharp            # throwaway, never a repo dependency
node $K/gap-sync.mjs . $D --civs=VIK,SCO --branch=<branch> --apply \
     --sharp=<scratch>/img --overrides=<file>
```

The writer keeps the original text of every unchanged entry and field, so the
diff shows only real changes — expect removals to be civ-array lines only:
`git diff -U0 src/composables/builds/icons/json | grep '^-'`.

## 3. Audit — until it prints nothing

```sh
node $K/audit.mjs . $D --civs=VIK:vik,SCO:sco
```

Checks every entry of the civs for: both image sizes on disk, description, id
known to AOE4World, explorer link, age, costs, class, that AOE4World really
lists the civ — and that **every** AOE4World item of the civ has an entry
(coverage, by type). A clean pass prints only `audited N entries`.

Then drive the real `iconService` for the civ (a harness at the repo root, see
CLAUDE.md) and look at the pages with a throwaway Puppeteer: CivPicker on
desktop and 390px, About credits.

## Conventions (measured, not guessed)

- **Icons exist twice**: the untouched AOE4World original
  `src/assets/pictures_original_size/<folder>/<id>.png` (usually 96×96) and the
  served `public/assets/pictures/<folder>/<id>.webp` — 48×48, **lanczos3, WebP
  q85**. Non-square sources (Mustering Hall Influence 120×104) are fitted on
  transparent, never stretched.
- **Folders**: items of ≤3 civs go to `<type>_<civslug>` (`unit_vikings`,
  `landmark_scots`), shared ones to the generic folders.
- **Entry shape**: `title, age, imgSrc, civ, class, costs, id, type,
  exploreUrl, description`. `id` carries the age suffix (`berserker-1`) except
  abilities; the image file does not. `class` follows the file: unit* →
  military (unitEco default), buildingEco/Religious default, buildingMilitary
  military for production and default for walls/towers, landmarks landmark,
  tech* tech, abilities none.
- **Landmarks** carry the age they are built in ("Age II Landmark" = 1).
- **Shared entries' costs are never touched** when adding a civ — they are one
  civ's numbers; costs belong to the AOE4World Sync.
- **Flags**: `public/assets/flags/<code>-large.webp` 455×256 and `-small.webp`
  44×24 from the Fandom wiki's waving render (`<Civ>_AoE4.png`, 1920×1080); the
  48×48 `pictures/civilization_flag/<code>.webp` is the **centre section** of
  the large flag. Fandom's CDN answers scripts with 403 — ask the user to save
  the file from a browser; don't work around the bot check. AOE4World's
  explorer has the same render at only 104×56.
- **Plurals**: `check:plurals` only catches stale keys. Add new titles that are
  already plural or invariant to `icons/plurals.js` (Highland Cattle, Bondi,
  Völur, Skåne Crossbowmen); `-man → -men` is automatic.
- **Credits**: thank AOE4World and whoever prepared the data on About.vue.

## Traps the tool had (fixed — keep them fixed)

- AOE4World reuses an id across types (`danevirke` building + technology,
  `worker-elephant`). Gap bookkeeping uses a type-qualified id; written
  entries keep `sourceId`.
- Local matching stays within a type, **except abilities**, which share name
  and icon with their technology, landmark or unit (Arrow Volley, King's
  College) and must not become duplicates.
- Re-run `scripts/replay.mjs . $D JIN` after touching the sync; its header
  holds the baseline.
