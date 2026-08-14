<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan
at `.specify/specs/036-community-funding-transparency/plan.md`.
<!-- SPECKIT END -->

## Working rules

### Harvest after every push

A push is a checkpoint, not just a save. After each one, spend a moment asking
what the work just taught — then write it where it will be read again:

| What you learned | Where it goes |
|---|---|
| A fact about *this* codebase that surprised you, or a trap that cost time | A `project` memory, or a comment at the place that surprised you |
| A correction from the user, or a working practice that would have saved a round trip | A `feedback` memory |
| Something the spec, plan or tasks now describe wrongly | Reconcile the document — a spec that contradicts the code is worse than none |
| A rule that should bind future work regardless of who does it | This file, or the constitution if it is a principle |
| Scope that turned out already built, obsolete, or newly necessary | tasks.md, with the reasoning kept |

Two habits make this worth doing rather than ceremonial:

- **Record the cause, not the symptom — with the conditions it holds under.**
  "The rail broke at insert dividers" ages badly. "In the mobile card list,
  per-element rails cannot span siblings, because each card carries its own
  margins and borders — so a lane belongs on a wrapper" is still true next year.
  Drop the first clause and the note becomes a rule that gets misapplied: the
  desktop table needs the *opposite* construction, per-row pseudo-elements that
  deliberately overhang their neighbours, because rows abut and a wrapper cannot
  span a run of `<tr>`s at all. A cause without its conditions is a symptom
  wearing better clothes.
- **Write it once.** If a rule lives here, it does not also belong in memory —
  duplicated guidance drifts apart and then contradicts itself.

Prefer updating an existing note over adding a new one, and delete notes that
turn out to be wrong.

### Verification

`npm run build` compiles templates; it cannot catch a `ReferenceError` in
`setup()`, which throws at render and blanks the component behind a green build.
Run `npm run check:setup` after touching any `.vue` file, and say plainly what
has *not* been verified — rendering, layout and interaction need a browser.

**Every new `mdi-*` icon must be added to `src/plugins/mdiIcons.js`.** Icons are
tree-shaken from `@mdi/js` through an explicit allowlist, so an icon that is not
in it renders as *nothing* — no error, no fallback glyph, a green build, and
only a `console.warn` in dev. The file's own header carries the regeneration
command, but the file is not one you open unless you already know it exists,
which is the whole trap. After adding an icon anywhere in `src`, run:

```sh
comm -23 <(grep -rhoE 'mdi-[a-z0-9-]+' src --include=*.vue --include=*.js | sort -u) \
         <(grep -oE '"mdi-[a-z0-9-]+"' src/plugins/mdiIcons.js | tr -d '"' | sort -u)
```

It should print only `mdi-svg` and `mdi-xxx`, which come from comments.

**Anything in `src/` is public, whether or not a template renders it.** The app
is a Vite SPA, so every module under `src/` — `src/config/` especially — is
bundled and served to every visitor. Minification strips comments and mangles
names; it does not make values private. "We never display it" draws the line at
the template, and the line is the bundle.

The rule bit twice inside one feature. `src/config/supporters.js` correctly
stores *no name* for a supporter who asked not to be listed, rather than a name
flagged hidden — and then very nearly stored a per-person `eur` amount that
nothing would ever have rendered, which would have published exactly what the
first decision protected. Same file, one field apart.

So: if a value should not be public, it does not go in `src/` at all — keep it
at the source that already holds it (the payment dashboard, Firestore behind a
rule, an env var used only at build time). And when a page shows an aggregate
next to a list of names, check the arithmetic: a total plus a count plus the
names stops being an aggregate at small n, which is why `useFunding.js`
withholds the supporter count below three. Verify against the built artefact,
not the source — `grep` the emitted `dist/assets/*.js`.

Run `npm run check:steps` after touching anything that reads a build. A
section's `steps` holds ordinary steps, notes **and** alternatives blocks whose
own steps live one level down, so iterating it directly reads a block as a step
and misses everything inside. Seven of those shipped before the check existed.
Go through `flattenSections`/`sectionOffsets` to read the build as one path, or
`forEachStep` to visit every step in the document — sanitising, validating and
counting all have to reach the paths nobody chose, because those are saved too.

**A `scripts/*.mjs` file that imports from `src/` runs locally and in CI, and
dies on Netlify.** Netlify pins **Node 22.1.0**; automatic module-syntax
detection did not land until **22.7.0**. Below that, a `src/*.js` file — in a
package with no `"type": "module"` — is plain CommonJS, so its named exports do
not exist and the import throws `SyntaxError` during module instantiation.
Locally (22.22) and in CI (`node-version: 22.x`, which resolves to the latest)
the same line is fine, and `engines.node: "22.x"` permits all three. So the
error appears only in the deploy log, on the one path nobody runs before
pushing.

Two consequences, and the second is the one that bites twice:

- Check any script that runs *on a deploy* with
  `node --no-experimental-detect-module scripts/thing.mjs`, which reproduces
  22.1.0's resolution. `refresh-snapshot.mjs` and `check-plurals.mjs` are exempt
  — they run on GitHub Actions, never on Netlify — but `prerender.mjs` is not,
  which is why it imports **nothing but `node:` builtins** and takes what it
  needs from the snapshot instead.
- **A `try/catch` around `main()` does not make a script deploy-safe.** A static
  import throws before any of the file's own code runs, so the handler never
  executes and the deploy fails with exit 2. If a script promises never to break
  a build, that promise is kept by what it imports, not by how it handles
  errors.

Logic that lives in a `.vue` file can still be tested without one: import
`@vue/reactivity` and drive the real refs, computeds and watches. Such a
harness has to sit **inside the project** — Node resolves packages from the
importing file, so one written to the scratchpad cannot find `@vue/reactivity`.
Write it to the repo root, run it, delete it.

Anything importing `@/…` needs that alias resolved, since Node knows nothing of
Vite's config. Drop a loader beside the harness and delete both afterwards:

```js
// alias-loader.mjs
import { pathToFileURL } from "node:url";
export function resolve(specifier, context, next) {
  if (specifier.startsWith("@/")) {
    return next(pathToFileURL(process.cwd() + "/src/" + specifier.slice(2)).href, context);
  }
  return next(specifier, context);
}
```

`node --no-warnings --experimental-loader ./alias-loader.mjs harness.mjs`
