# Contract: `scripts/prerender.mjs`

The generator's external surface. It has no HTTP interface — its contract is arguments, environment,
exit codes, files written and what it logs.

---

## Invocation

```sh
node scripts/prerender.mjs [--force] [--limit=N] [--dry-run]
```

Wired as:

```json
"scripts": {
  "build":         "vite build",
  "postbuild":     "node scripts/prerender.mjs",
  "prerender":     "node scripts/prerender.mjs --force",
  "check:plurals": "node scripts/check-plurals.mjs"
}
```

`postbuild` runs automatically after `build`. It must be a plain `node` invocation with no shell
syntax — the same script runs on Windows locally and Linux on Netlify.

### Arguments

| Argument | Effect |
|---|---|
| `--force` | Run even when the deploy environment is not detected. For local testing. |
| `--limit=N` | Read at most N builds. Exists so the generator can be exercised without a full-collection read. |
| `--dry-run` | Do everything except rename the output into place. Reports what it *would* write. |

### Environment

| Variable | Required | Purpose |
|---|---|---|
| `NETLIFY` | To run without `--force` | Set by Netlify. Its presence is what distinguishes a deploy from a local or CI build. |

**That is the entire environment.** No credential, no database, no network. The generator reads
`data/seo-snapshot.ndjson` off disk, so a deploy performs zero database reads and reproduces from a
checkout alone (FR-025, FR-029). `firebase-admin` is imported by `refresh-snapshot.mjs` and by nothing
else.

**It also imports nothing but `node:` builtins — not `src/`, not a dependency.** This is what makes
"never fails a deploy" true rather than aspirational, and it was learned the hard way: one named import
from a `src/` module turned a green build into `Build failed`, exit code 2, on Netlify only. Netlify
pins Node 22.1.0 and module-syntax detection landed in 22.7.0, so a `src/*.js` file is CommonJS there
and its named exports do not exist; locally and in CI the same line resolves. The exit-0 guarantee below
could not save it, because a static import throws during module instantiation — before the `try/catch`
around `main()` exists to run. Anything the generator needs from the application arrives through the
snapshot's `_meta` instead. Verify with `node --no-experimental-detect-module scripts/prerender.mjs`.

### Input

| Path | Purpose |
|---|---|
| `data/seo-snapshot.ndjson` | The build data. Committed. Produced by the scheduled refresh. |
| `dist/index.html` | The template, after `vite build`. |

---

## Decision order

Evaluated top to bottom; the first match wins and the rest are not reached.

| # | Condition | Outcome | Exit |
|---|---|---|---|
| 1 | Not `NETLIFY` and not `--force` | Skip, log why | **0** |
| 2 | `data/seo-snapshot.ndjson` missing or unreadable | Skip, log why | **0** |
| 3 | `dist/index.html` missing or shape unrecognised | Skip, log **loudly** — this is a defect, not a condition | **0** |
| 4 | A snapshot line fails to parse | Skip that build, count it, carry on | **0** |
| 5 | Failure partway through generation | Discard the temporary directory, log the error | **0** |
| 6 | Success | Write output, log the summary | **0** |

Case 4 is per-line rather than fatal on purpose: one malformed record should cost one page, not four
thousand.

**The exit code is always 0.** This is the contract's central promise: the generator cannot fail a
deploy or a CI run. Absent output degrades to today's behaviour (FR-020, FR-024).

Case 3 is a skip with a *loud* log rather than a silent one. Emitting thousands of pages built from a
template that cannot boot the application would be far worse than emitting none, and a changed Vite
output shape is a code defect that must be noticed in the deploy log.

---

## Files written

| Path | When |
|---|---|
| `dist/builds/<id>.html` | One per public build, on success only |
| `dist/sitemap.xml` | On success only — overwrites the static 5-URL copy |

**Nothing is written outside `dist/`.** Build ids are validated against a safe-filename pattern before
being used as a path; a failing id is skipped and counted.

**Atomicity**: pages are written into a temporary directory and renamed into place as the last step.
A run that dies halfway leaves the previous state intact (FR-021).

**Idempotence**: two runs over the same data produce byte-identical output. The output directory is
cleared at the start of a run — `vite build` empties `dist/` anyway, but a standalone `npm run
prerender` does not, so the script cannot rely on that.

---

## Log contract

Every run emits exactly one summary line or block, whether it ran or skipped. This is the only
observability there is (FR-023).

**Skip:**

```
prerender: skipped — not a Netlify build (pass --force to run anyway)
prerender: skipped — data/seo-snapshot.ndjson not found
```

**Success:**

```
prerender: snapshot aoe4-guides @ 2026-08-01 (11 days old) · 4012 builds
prerender:   4010 pages written · 2 skipped (1 unsafe id, 1 unparseable) · 9.1s
prerender:   unresolved icons: 7 across 5 builds  (sheep_old.webp x4, ...)
prerender:   sitemap: 4015 urls, 1 file
```

The snapshot's **project id and age are logged** deliberately. The project id catches a refresh that
ran against `aoe4-guides-dev`, which would otherwise produce a plausible-looking set of pages for builds
that do not exist in production (R4). The age catches a refresh workflow that has quietly stopped
running — the failure FR-028 exists to prevent, surfaced in the one log a deploy always produces.

The **unresolved-icon count is logged every run**, including when zero. Once unresolved icons are
dropped instead of printed as `undefined` (FR-013a), this counter is the only thing standing between a
vocabulary drift and silent content loss. SC-009b makes a silent increase a failure.

---

## Contract: `scripts/check-plurals.mjs`

```sh
node scripts/check-plurals.mjs
```

| Exit | Meaning |
|---|---|
| 0 | Every entry in `plurals.js` matches an icon title in the vocabulary |
| 1 | At least one entry is orphaned — printed, one per line |

Runs in CI beside `check:icons`. It exists because the icon JSON is regenerated from upstream: a
renamed icon would otherwise orphan its exception and silently revert that name to the regular rule,
which is exactly the kind of quiet regression the project's other check scripts exist to prevent
(FR-013e).
