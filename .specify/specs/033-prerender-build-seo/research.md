# Phase 0 Research: Prerendered SEO Head Tags for Build Pages

**Date**: 2026-08-11 · **Branch**: `033-prerender-build-seo`

Every finding below was checked against the running system or the deployed site. Where something is
still unverified it says so explicitly and carries the experiment that would settle it.

---

## R1. Does a static file beat the SPA catch-all on Netlify? — **VERIFIED YES**

**Question**: [public/_redirects](../../../public/_redirects) ends with `/* /index.html 200`, which
matches every path including `/builds/<id>`. If that rule wins, no generated file is ever served and
the whole feature is dead.

**Test**:

```
$ curl -sI https://aoe4guides.com/sitemap.xml   → 200 application/xml
$ curl -sI https://aoe4guides.com/robots.txt    → 200 text/plain
$ curl -sI https://aoe4guides.com/not-a-real-path → 200 text/html   (the SPA shell)
```

**Decision**: Real files are served in preference to the catch-all; only unmatched paths fall through.
This is Netlify's documented precedence (static assets, then redirect rules, in that order) and it is
observably true on this site today.

**Consequence**: FR-024 — "falls through exactly as today" — is satisfied by the existing rule with no
change to `_redirects`.

---

## R2. Does Netlify serve `/builds/<id>` from `builds/<id>.html`? — **VERIFIED YES**

**Answered 2026-08-12** against the deploy preview for PR #131
(`deploy-preview-131--aoe4guides-prod.netlify.app`), built by the production site's own
configuration — same `_redirects`, same publish directory, so the only difference from prod is the
hostname, which none of these checks depend on.

| Check | Result |
|---|---|
| `/builds/__prerender-probe` | **200**, `<title>PRERENDER-PROBE-R2-OK</title>` |
| `/builds` | **200**, site default title — the list page is untouched |
| `/builds/new` | **200**, site default title — the editor route is untouched |
| `/builds/07qM0jShA7USYa8hprgp` | **200**, site default title — an unprerendered build falls through |

**Extensionless resolution works**, and — the part that actually had a chance of failing —
**introducing a `builds/` directory into the publish output did not disturb the `/builds` route**.
Netlify resolved the directory for the one path that has a file in it and fell through to the SPA
catch-all for the three that do not. That is precisely the behaviour FR-001 and FR-024 assume.

No fallback is needed: the generated pages can live at `dist/builds/<id>.html` as designed, and
`public/_redirects` needs no change. The probe was deleted once this was recorded (T004).

**One thing this does *not* prove**, and nothing can until Phase 6 ships: it was answered with a
single file in that directory. Nothing here depends on the count, but ~4,000 files is the first time
that will be true.

> ### ⚠️ R2 was right and still insufficient — see R2c
>
> Extensionless resolution works, exactly as measured. What the probe could not reveal is that Netlify
> **canonicalises request paths to lowercase and 301s to them**, which breaks every mixed-case build id.
>
> The probe was named `__prerender-probe.html` — **all lowercase**. A lowercase path canonicalises to
> itself, so the redirect never fired and the table above is a true result from an unrepresentative
> input. Real build ids are mixed-case `[A-Za-z0-9]{20}`.
>
> **The lesson is about probe fidelity, not about Netlify**: a probe has to share the *characteristics*
> of the thing it stands in for, not merely its shape. This one matched the shape — a file, in that
> directory, fetched extensionlessly — and differed in the single attribute that turned out to matter.

<details>
<summary>Original question, kept because it is why the checks are shaped this way</summary>

**Question**: R1 proves files beat redirects. It does not prove that an *extensionless* request resolves
to a `.html` file. This is Netlify's pretty-URL behaviour and is expected to work, but it cannot be
proven without a deploy.

**Why it can't be tested from here**: the site currently has no `.html` file anywhere except
`index.html`, so there is nothing to probe.

**Experiment (must be task 1, before any generator is written)**: hand-write a single file at
`public/builds/__prerender-probe.html` containing a recognisable `<title>`, deploy, then check:

| Check | Expected |
|---|---|
| `curl https://aoe4guides.com/builds/__prerender-probe` | the probe's title |
| `curl https://aoe4guides.com/builds` | still the SPA shell — the list page must not break |
| `curl https://aoe4guides.com/builds/new` | still the SPA shell — the editor route must not break |
| `curl https://aoe4guides.com/builds/<a-real-id>` | still the SPA shell — unprerendered builds unaffected |

The last three matter as much as the first. Introducing a `builds/` **directory** into the publish
output is the part with a real chance of side effects: `/builds` is itself a route, and if Netlify
starts resolving it against the new directory instead of falling through, the build list page breaks.

**If the probe fails**: fall back to serving the generated pages from a path that is not also a route,
and add an explicit non-force rewrite mapping `/builds/:id` to it. FR-001 would need re-specifying.
Delete the probe file once the answer is recorded either way.

</details>

---

## R2c. Netlify lowercases request paths — **VERIFIED, and it blocks the feature**

**Found in production on 2026-08-12**, after the first real snapshot generated 4,202 pages. Reverted
within minutes by removing the snapshot; the site was restored to its previous behaviour in 45 seconds.

**What happens.** With a generated file present, Netlify 301s the request to a lowercased path:

```
GET /builds/00I7J47dv26cPbKmXYkO   →  301  →  /builds/00i7j47dv26cpbkmxyko   →  200
```

The redirected page is served correctly and its head is right — correct title, correct canonical
pointing back at the mixed-case URL. **But the id in the address bar is now lowercase**, and Firestore
document ids are case-sensitive:

```
GET /api/builds/00I7J47dv26cPbKmXYkO   →  the build
GET /api/builds/00i7j47dv26cpbkmxyko   →  {"reason":""}
```

So the app boots, asks for a build under an id that does not exist, and renders nothing. Head tags
correct, page empty — the worst possible split, because every automated check passes.

**Causation is provable, not inferred**: a `/builds/<id>` path with **no** generated file behind it
returns 200 with no redirect. The redirect appears only where a file exists.

**Who it hit**: every arrival by HTTP — shared links, search results, pasted links, bookmarks. In-app
navigation is client-side and never issues the request, which is why the site looked healthy to anyone
clicking around, and why this survived a deploy preview, a merge and a production deploy.

**Why nothing caught it earlier**: the R2 probe was named `__prerender-probe.html`, all lowercase, so
it canonicalised to itself. Every local check ran against the filesystem rather than Netlify. Every
page assertion in Phase 6 read the emitted HTML, which was and is correct.

**Fix to try, on a deploy preview and never again straight to production**: Netlify's pretty-URL
canonicalisation, via `netlify.toml`:

```toml
[build.processing.html]
  pretty_urls = false
```

**The check that decides it** — a *mixed-case* id must return 200 directly, with no `Location` header:

```sh
curl -sI https://<preview>/builds/00I7J47dv26cPbKmXYkO | grep -iE '^HTTP|^location'
```

If it cannot be disabled without also losing extensionless resolution, FR-001 needs re-specifying after
all: serve the pages from a path that is not a route and add an explicit non-force rewrite, which is
the fallback R2 named for a failure it did not anticipate.

---

## R2d. App Check blocks Googlebot — the real reason build pages were never indexed

**Found 2026-08-12, after the pages went live.** With correct head tags shipping on all 4,202 pages,
Search Console still reported **Soft 404** and refused to index them.

**This is older than this feature.** It would have been found by one check *before* any code was
written: inspect an existing build URL in Search Console and read the rendered HTML. The feature was
built on the premise that head tags were what was missing. They were missing — and they were not what
was blocking indexing.

### What Google actually renders

Google runs JavaScript. The app boots, tries to read the build, fails, and renders:

```html
<div class="v-card-title">Build Order Not Found</div>
```

An existing build, reported as missing, on a page whose head describes it correctly. Google is right to
call that a soft 404.

### The chain, from Search Console's own console output

```
requestStorageAccess: Permission denied            ← reCAPTCHA iframe
AppCheck: Requests throttled due to 403 error      ← appCheck/throttled, 24h backoff
collectionService.get failed: Missing or insufficient permissions.
```

Google's renderer denies the reCAPTCHA iframe third-party storage access, so no App Check token can be
minted; the token request 403s and the client throttles itself for a day; Firestore then refuses a read
that `firestore.rules` explicitly permits.

**Not a timeout.** The failure appeared at **00:29** — Google waited 29 seconds and was actively
refused. Nothing about prerendering, page weight or load time affects this.

**No allowlist exists.** Firebase App Check has no bypass for verified crawlers; the issue is
[open and closed-without-resolution](https://github.com/firebase/firebase-js-sdk/issues/8886). Google
publishes verifiable crawler IP ranges, but there is nowhere to apply them: the token exchange happens
between the browser and Firebase's backend, with no point that this project controls.

### Why nothing caught it

`collectionService.get()` caught the error and returned `undefined` — the same value it returns for a
document that does not exist. A permission failure and a missing build were indistinguishable to every
caller, and the UI said "not found" for both. The **write** path already drew this distinction
(`toUserMessage`, `writeWithTokenRetry`, which name App Check and ad blockers explicitly). Reads never
did.

### Fixed in PR #133

`getBuild` falls back to the site's own API, which runs on Cloud Run with a service account, so the
Admin SDK bypasses both rules and App Check. Strictly a fallback: one call site, inside the `catch`, so
a successful read never reaches it and a genuinely missing build still resolves without one.

Verified on a deploy preview against **both** observed failure codes — `permission-denied` (the
Googlebot case) and `unavailable` (a blocked transport) — each returning the build with a creation date
matching the snapshot's own `dateModified`.

### The part that is not about SEO

Any environment where reCAPTCHA cannot run cannot read a build. Observed live: after a few blocked
loads, reCAPTCHA kept failing in that browser session **even once the block was removed**. That state is
easier to reach and stickier than assumed, so the fallback is a robustness fix that happens to also
unblock indexing — not the other way round.

Still failing for such a client, and deliberately out of scope: comments (`getAll`) and the view/like
counters (`incrementNumber`). The build is the content; those are not.

---

## R3. Can the generator read Firestore without a service account? — **VERIFIED NO**

**Question**: [firestore.rules:10-11](../../../firestore.rules#L10-L11) grants `allow read` on
`builds` with no auth condition. If unauthenticated reads work, the feature needs no secret at all —
which would be strictly better under Constitution V (Secure Defaults) and much less setup.

**Test** — Firestore v1 REST, public web API key, both projects:

```
POST .../projects/aoe4-guides-dev/databases/(default)/documents:runQuery?key=<dev web key>
  → 403 PERMISSION_DENIED "Missing or insufficient permissions."

POST .../projects/aoe4-guides/databases/(default)/documents:runQuery?key=<prod web key>
  → 403 PERMISSION_DENIED "Missing or insufficient permissions."
```

(The prod key was read out of the deployed bundle — a Firebase web API key is public by design and is
not a secret. The first attempt at this test ran with an empty key and its 403 was meaningless; the
result above is from the retry with the real key.)

**Decision**: use `firebase-admin` with a service account. Both projects refuse the keyed REST path
despite the permissive rule, which is consistent with App Check being enforced — the project ships
`@firebase/app-check`, and a bare REST call carries no App Check token. Chasing the exact cause is not
worth it: the admin SDK bypasses both rules and App Check, is already a dependency of
[functions/package.json](../../../functions/package.json), and is the pattern every existing backend
task here uses.

**Alternatives rejected**:

- *Public REST via the site's own API* (`/api/builds`) — capped at 10 results with no pagination
  ([BuildsController.ts:20](../../../../aoe4-guides-api/src/controllers/BuildsController.ts#L20)).
  Extending it is a change to a second deployed service for no benefit.
- *Firebase client SDK in Node, unauthenticated* — same App Check exposure as the REST attempt, plus it
  holds a connection open and needs explicit termination for the process to exit.

**Consequence**: one new Netlify environment variable holding a service-account JSON. Never committed
(Constitution V). FR-019's "skip when credentials are absent" is what keeps local and CI runs clean.

---

## R4. Which project, and how many reads does this actually cost?

**Finding**: the local [.env](../../../.env) points at **`aoe4-guides-dev`**, not prod. Whatever
credential is added to Netlify must be for **`aoe4-guides`**, and the two must not be confused — a
generator pointed at dev would emit pages for builds that do not exist in production.

Note also the existing typo in the variable name: `VITE_FIREBASE_PROEJCT_ID`. It is wrong everywhere
consistently, including in Netlify's environment, so it works. **Do not fix it in this feature** —
renaming it breaks the deploy until Netlify is updated in lockstep, for zero user benefit.

**Read cost — superseded by R11, kept for the reasoning that led there.** One query,
`where("isDraft","==",false)`, ~4,000 documents. The constitution records that Netlify **auto-deploys
from `main`**, so deploys track pushes, not the ~10/month of manual releases assumed while writing the
spec:

| Deploys/month | Reads/month | Cost/month |
|---|---|---|
| 10 | 40,000 | ~$0.02 |
| 40 | 160,000 | ~$0.10 |

Cheap in absolute terms — and rejected anyway. **R11 records why**: the objection to a per-deploy cost
was not the size of the number but its existence on every push, which is a legitimate constraint in a
project paid for out of pocket. Reads now happen only on refresh, ~48,000/year, ~$0.03/year.

What survives from this section is the **project-id warning below**, which applies to the refresh
workflow exactly as it applied to the deploy.

---

## R5. Reading a build's steps from plain Node

**Finding**: the traversal helpers required by FR-012 live in
[useAgeTimings.js:187](../../../src/composables/builds/useAgeTimings.js#L187), and the icon vocabulary
in [iconService.js](../../../src/composables/builds/icons/iconService.js). Both use Vite's `@/` alias,
which Node does not resolve. The full import chain the script needs is small and bounded:

| File | `@/` imports to convert |
|---|---|
| `src/composables/builds/useAgeTimings.js` | 2 |
| `src/composables/builds/timingsHelper.js` | 1 |
| `src/composables/builds/icons/iconService.js` | 14 |
| `src/composables/builds/icons/general.js` | 1 |
| `src/composables/builds/icons/resources.js` | 1 |
| `villagerAggregator.js`, `icons/civs.js` | 0 — already leaves |

**Decision**: convert those 19 import specifiers from `@/…` to relative paths. Vite resolves relative
imports identically, so this is a no-behaviour-change edit, and it makes the chain natively importable
by Node with no flags.

**Alternatives rejected**:

- *A loader hook* (`--experimental-loader`), as CLAUDE.md documents for throwaway harnesses. That trick
  is fine for a file you delete ten minutes later; shipping it puts a deprecated experimental flag on
  the deploy path forever.
- *Bundling the script with Vite before running it* — a build step to run a build step.

`useAgeTimings.js` also imports `vue` for `computed`/`unref`. That resolves in Node normally; `vue` is a
production dependency.

---

## R6. What the icon converter does today — measured

Run against real published build data (throwaway harness, since deleted):

```
in   6 on <img sheep> with 1 <img repair><img house><br /><img rally>to<img gold> until 3
out  "6 on  Sheep  with 1  Build  House .  Rally to Gold  until 3"
```

Four findings, all reproduced:

1. **`undefined` reaches output.** `getIconFromImgPath`
   ([iconService.js:100](../../../src/composables/builds/icons/iconService.js#L100)) returns its *input
   string* when nothing matches, so `.title` is `undefined` and the caller emits `" undefined "`.
   Focus mode speaks this aloud today. → FR-013a.
2. **Doubled spacing** from `" " + title + " "` meeting the author's own spaces. → FR-013b.
3. **Lookup is a rebuild-and-scan** of a ~1,100-entry array per image: 0.021 ms each, ≈8 s across a full
   site's steps. → FR-013f (index once into a Map).
4. **Origin stripping is two hardcoded hosts** (`aoe4guides.com`, `localhost:5173`). Anything else fails
   to resolve. → FR-013g (strip any origin).

**Finding that changed the design**: icon *pairs* need no special handling. The hammer icon is titled
"Build", so `🔨🏠` already converts to "Build House". The vocabulary carries the semantics. Recorded as
an explicit exclusion in the spec so nobody builds a compound-detector.

### R6b. The `.png` legacy paths — found during Phase 3, and it changes who owns the rewrite

Icons moved from PNG to WebP and the stored documents were never backfilled, so every build written
before the switch still points at `/assets/pictures/…/x.png`. Measured over 229 real published builds:
**4,894 icons across 473 distinct srcs resolve to nothing** without the rewrite.

The reason this was not visible from R6's own harness, and would not have been visible from the running
app either: `FocusMode.vue` and `BuildOrderEditor.vue` both call `convertStepImagePaths` on their own
copy of the build before rendering. The rewrite happens *above* the converter, in each view.

That is exactly the arrangement `refresh-snapshot.mjs` breaks. It reads Firestore directly, has no view
to convert its copy, and would have written a snapshot with those icons silently absent — no
`undefined`, no error, just shorter steps. So the rewrite now lives **inside `iconText.js`**, which
matches what `legacyImagePaths.js`'s own header already asserts: it is a read concern that has to run
everywhere a build is rendered, and the converter is a read path.

**Consequence for Phase 4**: `refresh-snapshot.mjs` must *not* call `withWebpPaths` itself. It is
idempotent so a second call would be harmless, but a second owner is how the first one later gets
deleted as redundant.

---

## R7. Pluralisation — bounded, and keyed on data already present

**Finding**: of 1,095 icons, 324 are countable (257 units, 67 non-landmark buildings). Landmarks are
excluded because they are unique — nobody writes "2 House of Wisdom" — and the `class: "landmark"`
field already distinguishes them, as `type` distinguishes unit/building/technology/ability.

Regular rules cover most of the vocabulary. The irregular remainder falls into a few families:

| Family | Examples | Handling |
|---|---|---|
| `-man → -men` | Spearman, Crossbowman, Horseman, Longbowman, Man-at-Arms | one rule |
| consonant + `y → -ies` | Emissary, Janissary, Monastery, University, Granary | one rule |
| sibilant → `-es` | Dervish, Cattle Ranch, Wooden Fortress | one rule |
| invariant / already plural | Barracks, Streltsy, Runestones, Wynguard Footmen, Ranged Specialists | explicit list |
| head-noun compounds | Nest of Bees → Nests of Bees | explicit list |
| unique units | Lord of Lancaster, Jeanne d'Arc – Knight | never pluralised |

**Decision**: three ordered rules plus an explicit exception map of roughly 15–20 entries.

**Where the exceptions live**: a new `src/composables/builds/icons/plurals.js`, **not** a `plural` field
in the icon JSON. The JSON carries a `syncSkip` key, which means it is regenerated from an upstream
source; a field added there is at risk of being discarded by the next sync. A separate module is
outside the sync's reach. FR-013e's check (`scripts/check-plurals.mjs`) closes the remaining gap: if an
upstream rename orphans an exception key, CI fails instead of the exception silently lapsing.

**Trigger rule**: pluralise only when a count *immediately* precedes the icon — `/(\d+)\s*x?\s*$/` on
the text before it. This is why `6 on <sheep>` correctly stays "Sheep": the preceding token is "on".

---

## R8. Which traversal — `forEachStep` or `flattenSections`?

**Decision**: `forEachStep`, in document order.

`flattenSections` resolves each alternatives block down to **one** path — it answers "what is being
read". FR-012 requires every path, because a crawler should see the whole document, so the reading-order
helper is the wrong one here. This is the distinction the helper's own documentation draws, and the
trap `npm run check:steps` exists to catch.

**Cost accepted**: steps from parallel paths appear consecutively in the emitted list, which reads
slightly oddly as a linear procedure. Completeness wins for a machine reader. Revisit only if a
structured-data validator objects.

---

## R9. Template, output shape and escaping

- **Template**: `dist/index.html`, read after `vite build`. Never the repo-root
  [index.html](../../../index.html), which references `/src/main.js` — a path that does not exist in
  production. The generator must assert the template's shape (a `</head>` to inject before, a hashed
  module script present) and abort emitting anything if it does not match, rather than write thousands
  of pages that cannot boot.
- **Vite empties `dist/` on every build**, so a `postbuild` generator gets a clean directory for free.
  A standalone `npm run prerender` run does not, so the script must clear its own output directory
  itself (FR-004).
- **Atomicity (FR-021)**: write into a temporary directory and rename into place only after every page
  is written, so a mid-run failure cannot publish a partial set.
- **Escaping (FR-011)**: HTML-attribute escaping for meta content; for JSON-LD, `JSON.stringify` plus
  replacing `<` with `<` so a title containing `</script>` cannot terminate the block.
- **Sitemap**: 4,000 URLs is far inside the 50,000-URL / 50 MB limit, so a single file. Guard at 45,000
  and split with an index above it (FR-017). Writing `dist/sitemap.xml` overwrites the copy of
  [public/sitemap.xml](../../../public/sitemap.xml); when the generator skips, that 5-URL file survives
  untouched, which is exactly FR-016 with no extra logic.

---

## R11. Where the build data lives — **REVISED after review**

**This supersedes the read-per-deploy assumption in R3 and R4.** R3's finding stands (a service account
is required to read Firestore); what changed is *where* that read happens.

**The objection**: the original design read Firestore on every deploy. Netlify auto-deploys from `main`,
so that put a database cost on every push. The absolute number is trivial — $0.02–0.10/month — but the
owner's objection was not arithmetic: *knowing* that shipping an ordinary feature costs money is itself
a cost, in a project funded out of pocket. That is a legitimate constraint and it is theirs to set.

**Considered and rejected — skip generation on push, run only on the scheduled build.** This is what
was actually asked for, and it does not work. **Netlify deploys are atomic full-site replacements**; a
build that skips generation publishes a site with no `dist/builds/` at all, so every prerendered page
disappears until the next scheduled build. Pages would exist for a few days a month, and search engines
would watch them appear and vanish repeatedly — worse than never having shipped them.

**Considered and rejected — Netlify build cache holding the generated HTML.** Each page embeds the
hashed entry script (`/assets/index-<hash>.js`). A later push produces a new hash and deletes the old
chunk, so every restored page would load a script that 404s: perfect head tags, blank page for every
human visitor, green deploy. Caching the *data* instead would work, but the cache is evictable, so it
needs a Firestore fallback — which reinstates the very cost it was meant to remove.

**Decision: commit the snapshot to the repository.** A scheduled GitHub Action reads Firestore, writes
`data/seo-snapshot.ndjson`, and commits it. The Netlify build reads that file.

| | Read-per-deploy | Committed snapshot |
|---|---|---|
| Firestore reads per push | ~4,000 | **0** |
| Reads per year | ~1.9M | ~48,000 |
| Cost per year | ~$1.15 | **~$0.03** |
| Service account in Netlify | required | **none** |
| Local `prerender` run | needs credentials | works offline |
| Deploy reproducible from a checkout | no | **yes** |

The secret moves to GitHub Secrets and exists in exactly one place, which is a Constitution V
improvement rather than a compromise. `workflow_dispatch` gives an on-demand refresh for patch days.

**Size — measured, not estimated**: sampled the 10 most recent builds through the public API and
measured a realistic record (id, title, stripped description, civ, strategy, season, author, timestamp,
converted step text): **~1,042 bytes per build → ~4.0 MB across 4,000 builds.**

**Format: NDJSON, one build per line, sorted by id.** This is what makes a monthly refresh cheap in git:
a full rewrite of a 4 MB file twelve times a year would be ~48 MB of history, but sorted line-per-record
text means an unchanged build produces no diff, and git stores only the lines that moved. FR-027 exists
to keep this property from being lost to a reformat.

**Consequences to carry forward**:

- FR-019's skip condition is no longer "credentials absent" but "snapshot absent or unreadable".
- The generator never imports `firebase-admin`; only the refresh workflow does.
- A silently failing refresh would leave pages generating from stale data forever, hence FR-028.
  GitHub notifies on workflow failure by default; that is the mechanism, and it must be confirmed to be
  on rather than assumed.
- The Action needs `permissions: contents: write` to push. A push made with `GITHUB_TOKEN` does not
  trigger other Actions, which prevents a loop; it *does* trigger Netlify, which is what regenerates
  the pages.

---

## R12. Open items carried into tasks

| # | Item | Resolution |
|---|---|---|
| 1 | R2 pretty-URL behaviour | Probe deploy, task 1. Blocks everything else. |
| 2 | Service-account provisioning in **GitHub Secrets** (not Netlify — R11) | Manual setup step, owner-only. |
| 3 | Confirm GitHub notifies on workflow failure | **Confirmed 2026-08-12** by the owner. FR-028's mechanism is real, so no explicit failure-notification step is needed in the workflow. The snapshot's `generated` date in the deploy log remains the backstop for the case notifications cannot cover: a scheduled workflow *disabled* after 60 days of repository inactivity never fails, so it never notifies. |
| 4 | First-deploy duration with ~4,000 extra files | Measure; no prediction offered. The owner has stated upload time is not a concern. |
| 5 | `og:image` stays the site-wide image | Per-civ images deferred (spec exclusion). |
