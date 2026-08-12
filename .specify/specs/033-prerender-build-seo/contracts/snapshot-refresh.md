# Contract: the snapshot and its refresh

The only part of this feature that reads the database. It runs on a schedule in GitHub Actions, never
on a deploy.

---

## `data/seo-snapshot.ndjson`

Committed to the repository. **~4.7 MB across ~4,000 builds** — measured at 1,243 bytes per build over
230 real published builds run through the actual record builder.

R11's earlier figure of ~1,042 bytes (~4.0 MB) was measured before section notes were included and
before the converter resolved legacy `.png` icons; both add text. 19% larger, and it changes nothing
about the design — the format's whole point is that size per refresh is irrelevant next to whether an
unchanged build produces a diff.

### Format

**One JSON object per line, sorted by build id, no pretty-printing.**

This is a load-bearing format decision, not a style one. A refresh rewrites the file twelve times a
year; if it were a single pretty-printed JSON array, every refresh would be a whole-file diff and the
repository would accumulate ~48 MB of history a year. Line-per-record sorted by a stable key means an
unchanged build produces no diff at all, and git stores only the lines that moved (FR-027).

**Anything that reformats this file destroys that property.** A header comment in the generator should
say so, because "let me just prettify this" is a natural and quiet way to undo it.

### Header line

The first line is a metadata record, distinguishable by having no `id`:

```json
{"_meta":{"project":"aoe4-guides","generated":"2026-08-01T03:00:00Z","builds":4012,"version":1,"civs":{"ABB":"Abbasid Dynasty","…":"…"}}}
```

`civs` is a civ-code-to-display-name map, carried here so the generator can resolve a name without
importing anything from `src/` — a deploy-safety constraint, not tidiness (see `prerender-cli.md`).
Once in the header rather than on every record: 24 entries instead of 4,000 copies, and a civ rename
touches one line rather than the whole file. A generator reading a snapshot written before this field
existed falls back to the raw code, which still produces a page.

`project` and `generated` exist so a deploy can log which database the data came from and how old it
is — the two failures worth catching at a glance (see `prerender-cli.md`). `version` allows the record
shape to change without the generator guessing.

### Build record

```json
{"id":"eWVe0...","title":"...","description":"...","civ":"HOL","strategy":null,"map":"","season":"Season 13","author":"murtuk","created":1781537416,"steps":["6 on Sheep with 1 Build House","..."]}
```

| Field | Notes |
|---|---|
| `id` | Firestore document id. Sort key. |
| `title` | Raw, as authored. Fallbacks applied at generation, not here. |
| `description` | Markup stripped, whitespace collapsed. Not truncated — truncation is a presentation choice and belongs to the generator. |
| `civ`, `strategy`, `map`, `season`, `author` | As stored. |
| `created` | Unix seconds, from `timeCreated`. |
| `steps` | **Already converted to text.** Ordered, every path of every alternatives block, empty entries dropped — **plus section notes**, see below. |

**Section notes are included, which this contract originally did not ask for.** `forEachStep` iterates
`section.steps` and so never sees `section.gameplan`, the pre-migration home of a section's note.
Measured over 230 real published builds: **39% still store it there**, because the migration is lazy and
only runs when an author next saves. Following `forEachStep` alone would have dropped section-level
guidance from two builds in five — in the one artifact whose stated purpose is that the steps are the
substance. `FocusMode` folds these in for the same reason. Emitted before the section's own steps, since
a gameplan introduces its section rather than commenting on any one step in it. The branch stops firing
by itself once the Firestore backfill runs; it does not need removing.

**Do not rewrite `.png` paths in this script.** `convertDescriptionToText` does it (research R6b).
Builds written before the WebP switch still store `.png`, and this script is the one caller with no
view to have converted its copy first — but the fix belongs in the converter, and duplicating it here
is how the original later gets deleted as redundant.

**Steps are converted here, not at generation time.** The converter reads the icon vocabulary, which
lives in `src/` and changes with the application; doing it once at refresh keeps the generator to
string assembly and keeps the snapshot readable in a diff — a reviewer can see what a build's steps
actually say. The trade: an improvement to the converter does not reach the pages until the next
refresh. Acceptable, and `workflow_dispatch` makes it a button press.

### Excluded

Drafts (never written). `views`, `likes`, `upvotes`, `downvotes`, `comments`, `score` — fast-changing
fields would make every refresh a full-file diff, defeating the format, and they are already excluded
from the pages by FR-014.

---

## `scripts/refresh-snapshot.mjs`

```sh
node scripts/refresh-snapshot.mjs [--limit=N] [--out=path]
```

| Environment | Purpose |
|---|---|
| `FIREBASE_SERVICE_ACCOUNT` | Service-account JSON for **`aoe4-guides`**. Fed from the GitHub Secret **`SEO_READER`** — the secret names the identity, the variable names the credential format, and the workflow maps one to the other. |

| Exit | Meaning |
|---|---|
| 0 | Snapshot written |
| 1 | **Failure.** Unlike the generator, this script *does* fail loudly — a refresh that quietly does nothing is exactly FR-028's failure mode. |

The opposite exit-code policy to `prerender.mjs` is deliberate. The generator must never break a
deploy, because absent pages degrade gracefully. The refresh must break its workflow, because a silent
failure leaves pages generating from stale data indefinitely with nothing to indicate it.

Output is written to a temporary file and renamed, so an interrupted run cannot leave a truncated
snapshot to be committed.

---

## `.github/workflows/refresh-seo-snapshot.yml`

```yaml
on:
  schedule:    [{ cron: "0 3 1 * *" }]   # 03:00 on the 1st, monthly
  workflow_dispatch:                      # and on demand, for patch days
permissions:
  contents: write
```

Steps: checkout → setup Node 22 → `npm ci` → `node scripts/refresh-snapshot.mjs` → commit
`data/seo-snapshot.ndjson` **only if it changed** → push.

### Notes

- **Commit only on change.** An unchanged month must produce no commit and therefore no deploy.
- **The push triggers Netlify**, which regenerates the pages. That is the entire delivery mechanism —
  there is no build hook and no Netlify-side scheduling.
- A push made with `GITHUB_TOKEN` does not trigger other workflows, so this cannot loop. It *does*
  trigger Netlify, which is what is wanted.
- Commit message follows Conventional Commits per the constitution: `chore(seo): refresh build snapshot`.
- **Failure must notify.** GitHub emails the repository owner on scheduled-workflow failure by default.
  FR-028 depends on this; confirm it is on rather than assuming it (R12 item 3).
- Scheduled workflows are disabled automatically after 60 days of repository inactivity. On a hobby
  project with quiet spells this is a real possibility — the snapshot's `generated` date in the deploy
  log is the backstop that makes it visible.

---

## Cost

| | Per refresh | Per year (12 refreshes) |
|---|---|---|
| Firestore reads | ~4,000 | ~48,000 ≈ **$0.03** |
| GitHub Actions minutes | ~1 | ~12, well inside the free allowance |
| Netlify build minutes | 1 deploy | 12, only when data changed |

**Per push to `main`: zero.** That is the requirement this design exists to satisfy (FR-025).
