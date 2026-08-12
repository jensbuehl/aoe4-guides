# Implementation Plan: Prerendered SEO Head Tags for Build Pages

**Branch**: `033-prerender-build-seo` | **Date**: 2026-08-11 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `.specify/specs/033-prerender-build-seo/spec.md`

## Summary

Emit one static HTML file per public build at deploy time, carrying that build's own `<title>`,
description, canonical, Open Graph/Twitter tags and `HowTo` structured data — leaving `#app` empty so
nothing a human sees changes. Netlify serves those files in place of the SPA shell; anything not
generated falls through to today's behaviour.

**A deploy reads no database.** The build data is a snapshot committed to the repository, refreshed
monthly (and on demand) by a scheduled GitHub Action. Pushing to `main` therefore costs nothing, needs
no credentials, and reproduces from a checkout alone — see R11 for why the read-per-deploy design and
both of its cheaper-looking alternatives were rejected.

The step list is the substance of it, and a build order is written in icons, so the shared icon-to-text
converter is upgraded alongside: unresolved icons dropped and counted instead of printing `undefined`,
normal spacing, and pluralisation for counted units and buildings. That converter is shared with focus
mode's speech, so this is the one place the running application changes — deliberately, and it fixes a
live defect.

## Technical Context

**Language/Version**: Node 22 (ESM, `.mjs`), matching `engines.node` and the existing `scripts/*.mjs`.

**Primary Dependencies**: `firebase-admin` (new dev dependency at repo root; already used in
`functions/`). Imported **only** by the refresh workflow — never by the generator, and never by the
shipped bundle.

**Storage**: `data/seo-snapshot.ndjson`, ~4 MB, committed. Cloud Firestore is read-only and only by the
scheduled refresh. No new collection, no schema change, no migration.

**Testing**: No formal suite (Constitution). Verification is the project's existing check scripts plus
one new one (`check:plurals`), a `--force --limit` local run read by eye, and a probe deploy.

**Target Platform**: Netlify build container (Linux) for the real runs; Windows/PowerShell for local
development — so no shell-specific syntax in npm scripts.

**Project Type**: Build-time CLI tool inside an existing Vue 3 SPA.

**Performance Goals**: Generator adds < 60 s to a deploy at ~4,000 builds. Icon resolution must not be
the dominant cost (currently ~8 s of pure lookup; target ≈ 0 via an indexed map).

**Constraints**: Must never fail a deploy or CI (exit 0 on every skip and error). Must not run locally
or in CI by default. **A deploy must perform zero database reads** — this is a hard requirement (FR-025),
not a cost target. Reads happen only on refresh: ~4,000, roughly a dozen times a year, ~$0.03/year.

**Scale/Scope**: ~4,000 public builds → ~4,000 generated files plus one sitemap. ~1,100-entry icon
vocabulary, of which 324 are countable for pluralisation.

## Constitution Check

*GATE: passed before Phase 0, re-checked after Phase 1.*

| Principle | Assessment |
|---|---|
| **I. Simplicity First** | **Pass.** Two scripts and a cron; no new service, nothing hosted. Three more elaborate designs were tried and rejected on the way here, each recorded with why: a write-triggered function feeding object storage (R11 preamble), skipping generation on pushes (breaks — Netlify deploys are atomic replacements), and a Netlify build cache holding the HTML (breaks — embedded asset hashes go stale). The surviving design is a text file in git and a scheduled job. New dependency `firebase-admin` is justified under R3 and is imported by the refresh only. |
| **II. Incremental Quality** | **Pass, and improves.** Fixes a live `undefined` defect in speech output, replaces a rebuild-and-scan lookup with an index, and removes a two-hardcoded-origins assumption. The `@/`→relative conversion (R5) is mechanical and behaviour-preserving. |
| **III. Consistent UX & Component Reuse** | **Pass, not applicable to UI.** No component, no template, no style. The reuse obligation is honoured where it does apply: the icon converter is *shared* with text-to-speech rather than duplicated, which is the whole reason FR-013 amends the existing one instead of writing a second. |
| **IV. Cost-Conscious Infrastructure** | **Pass, strengthened on review.** A deploy now reads nothing: ~4,000 reads a dozen times a year, ~$0.03/year, against ~4M reads/month already. Free-tier-first was applied literally — R3 exists because a zero-credential path was tried first and ruled out by measurement, and R11 exists because the owner rejected a per-deploy cost on principle rather than on arithmetic. Both rejections are recorded with what was tried. |
| **V. Secure Defaults** | **Pass, and improved by R11.** The service-account JSON lives in GitHub Secrets only — not in Netlify, not in the repo. One location instead of two. Read-only by intent and scoped to Firestore read. No auth flow, no rule change, no user data: `builds` is already world-readable, so this exposes nothing `curl` could not already fetch. |

**No violations. Complexity Tracking section omitted.**

Re-check after Phase 1: unchanged. The design added no service, no dependency beyond `firebase-admin`,
and no persistent state.

## Project Structure

### Documentation (this feature)

```text
.specify/specs/033-prerender-build-seo/
├── plan.md              # This file
├── research.md          # Phase 0 — R1–R10, with what was measured
├── data-model.md        # Phase 1 — entities and the field subset read
├── quickstart.md        # Phase 1 — how to run and verify it
├── contracts/
│   ├── prerender-cli.md #   the generator's arguments, exit codes and log contract
│   ├── generated-page.md#   the head block and sitemap shape it emits
│   └── snapshot-refresh.md# the committed snapshot's format and the scheduled job that writes it
├── checklists/
│   └── requirements.md  # from /speckit-specify
└── tasks.md             # /speckit-tasks — NOT created here
```

### Source Code (repository root)

```text
data/
└── seo-snapshot.ndjson       # NEW — committed build data, ~4 MB, one build per line, sorted by id

.github/workflows/
├── refresh-seo-snapshot.yml  # NEW — monthly cron + workflow_dispatch; the ONLY thing reading Firestore
└── ci.yml                    # MODIFIED — add check:plurals

scripts/
├── prerender.mjs             # NEW — the generator; reads the snapshot, never the database
├── refresh-snapshot.mjs      # NEW — reads Firestore, writes the snapshot; run only by the workflow
├── check-plurals.mjs         # NEW — fails when an irregular-plural entry is orphaned
├── check-icons.mjs           # existing, unchanged (pattern to follow)
└── check-steps.mjs           # existing, unchanged

src/composables/builds/
├── icons/
│   ├── iconText.js           # NEW — shared markup→text; the converter both sides use
│   ├── plurals.js            # NEW — irregular plurals, outside the icon-JSON sync
│   ├── iconService.js        # MODIFIED — indexed lookup; null on miss; relative imports
│   ├── general.js            # MODIFIED — relative import
│   └── resources.js          # MODIFIED — relative import
├── textToSpeechHelper.js     # MODIFIED — consumes iconText.js; keeps speech-only bits
├── useAgeTimings.js          # MODIFIED — relative imports only (forEachStep unchanged)
└── timingsHelper.js          # MODIFIED — relative import

src/router/index.js           # MODIFIED — FR-030, do not clobber a prerendered title (lowest priority)
package.json                  # MODIFIED — postbuild, prerender, check:plurals; firebase-admin devDep
public/builds/                # TEMPORARY — probe file for R2, deleted once answered
```

**Structure Decision**: one new top-level directory, `data/`, holding the committed snapshot. Everything
else joins existing homes — the scripts join `scripts/` beside the check scripts they are modelled on,
and the shared converter joins the icon module it belongs to so browser and script import the same file.
That sharing is the point, and is what keeps page text and spoken text from diverging.

**The split that matters**: `refresh-snapshot.mjs` is the only file that imports `firebase-admin` and
the only one that needs a credential. `prerender.mjs` reads a file off disk and could run on a machine
with no network. Keeping those two concerns in separate scripts is what makes FR-025 and FR-029
structural rather than a matter of discipline.

## Implementation Sequence

Ordered by dependency, not by size. Task 1 gates everything.

**1 — Settle R2 before writing anything.** Hand-write `public/builds/__prerender-probe.html`, deploy,
and check all four URLs in the R2 table: the probe resolves extensionless, and `/builds`, `/builds/new`
and an unprerendered build page all still serve the SPA shell. Introducing a `builds/` directory into
the publish output is the part with a real chance of side effects. Record the answer and delete the
probe. **If it fails, stop and re-spec** — FR-001 and FR-024 depend on it.

**2 — Make the module chain Node-importable.** Convert the 19 `@/` specifiers listed in R5 to relative
paths. Mechanical, no behaviour change. `npm run build` and `npm run check:setup` must both still pass.

**3 — The converter, with speech as the first consumer.** Extract `iconText.js`; index the icon lookup
into a Map; return `null` on a miss so callers can drop and count rather than stringify `undefined`;
strip any origin; fix spacing; add `plurals.js` and the pluralisation rules; add
`scripts/check-plurals.mjs` and wire it into CI. Repoint `textToSpeechHelper.js` at the shared module,
keeping its speech-only additions on its own side. This is where FR-013a–g land, and it is independently
valuable: it fixes the spoken `undefined` whether or not the rest ships.

**4 — The snapshot producer.** `scripts/refresh-snapshot.mjs` plus the scheduled workflow. Read
Firestore with `firebase-admin`, emit NDJSON sorted by id, commit only when the content changed. Set up
the service account in **GitHub Secrets** (owner-only, prod project `aoe4-guides` — *not* the dev
project the local `.env` points at) and confirm GitHub's failure notifications are actually on, since
FR-028 rests on them. Run it once by hand via `workflow_dispatch` to produce the first snapshot.

Deliberately before the generator: the generator reads this file, so having a real one to develop
against beats inventing a fixture that then disagrees with reality.

**5 — The generator.** Gating first (FR-018/019/020) so the safe path exists before anything can run;
then read the snapshot, build the head block, emit into a temp directory, rename into place, write the
sitemap, report. Exercise it with `--force --limit=20` and **read the output** — SC-009a is a judgement
about whether a player would recognise the sentence, not a regex.

**6 — Wire it up.** `postbuild`, the `prerender` script, and the monthly schedule. Note there is
nothing to configure in Netlify: no environment variable, no build hook, no secret. A deploy is an
ordinary `npm run build` against a checkout.

**7 — FR-030, or drop it.** The title flash is cosmetic and the end state is already correct. Lowest
priority; drop it rather than let it grow.

## Risks

| Risk | Mitigation |
|---|---|
| R2 fails and extensionless resolution does not work | Task 1 is a probe deploy costing one file. Nothing else is built until it answers. |
| A `builds/` directory shadows the `/builds` list route | Explicitly checked in task 1, not assumed. |
| Service account points at `aoe4-guides-dev` | Called out in R4; the refresh logs the project id it read from, and the snapshot records it, so a wrong project shows up in the workflow log and in the committed diff rather than silently in the output. |
| The scheduled refresh fails silently and pages generate from stale data forever | FR-028. GitHub notifies on workflow failure by default — **confirm** it, do not assume it (R12 item 3). The snapshot also carries its own generation date, so staleness is visible in the file. |
| The 4 MB snapshot bloats git history over years | NDJSON sorted by id, so an unchanged build produces no diff (FR-027, R11). A reformat that breaks line stability would quietly undo this — worth a comment in the file's own header. |
| Icon-JSON regeneration orphans a plural exception | `check:plurals` fails CI (FR-013e). |
| Unresolved icons silently delete content once `undefined` stops appearing | The count is reported every run and SC-009b makes a silent increase a failure. |
| Deploy time grows with ~4,000 files | Measured on the first full deploy, not predicted. If it hurts, generating only the top N by score is a dial to turn. |
