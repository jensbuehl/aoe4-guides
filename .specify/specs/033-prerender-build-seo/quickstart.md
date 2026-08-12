# Quickstart: prerendered build pages

How to run this, and how to tell whether it worked. Windows/PowerShell locally, Linux on Netlify.

---

## Nothing changes for everyday work

```sh
npm run build      # Vite only. The generator skips in milliseconds and logs why.
npm run dev        # untouched
```

The generator runs only on a Netlify deploy, or when you force it. CI runs `npm run build` without
credentials and stays green — that is a hard requirement, not a convenience (FR-018, US3).

---

## Running it locally

**No credentials needed.** The build data is committed at `data/seo-snapshot.ndjson`, so the generator
works from a checkout with no network:

```powershell
npm run build
npm run prerender -- --limit=20
```

`npm run prerender` already passes `--force`. Start with `--limit=20` — you do not need 4,000 pages to
see whether the output is right. Add `--dry-run` to see what would be written without replacing
`dist/builds/`.

## Refreshing the data

This is the only step that touches Firestore, and it normally runs itself — monthly, in GitHub Actions.
Trigger it by hand after a patch or season change:

**Actions → Refresh SEO snapshot → Run workflow.**

It commits `data/seo-snapshot.ndjson` only if the data changed, and that commit deploys the new pages.
Nothing else is needed; there is no Netlify build hook and no Netlify secret.

To run the refresh locally you would need a service-account JSON for **`aoe4-guides`** (prod — note your
local `.env` points at `aoe4-guides-dev`). You should rarely need to:

```powershell
$env:FIREBASE_SERVICE_ACCOUNT = (Get-Content -Raw path\to\service-account.json)
node scripts/refresh-snapshot.mjs --limit=50
```

**Never commit the service account.** It belongs in GitHub Secrets and nowhere else — not in `.env`,
not in the repo, not in a scratch file inside the working tree (Constitution V, FR-029).

---

## Verifying it

### 1. Read the step text. Actually read it.

This is the one check that cannot be automated. SC-009a asks whether a player would recognise the
sentence:

```powershell
Select-String -Path dist\builds\*.html -Pattern '"text":' | Select-Object -First 40
```

Looking for:

- **No `undefined`.** That string reaching output is the live defect this feature fixes (FR-013a).
- **No doubled spaces**, no space before a full stop (FR-013b).
- **Plurals right** where a count precedes a unit or building: "2 Spearmen", not "2 Spearman".
- **Plurals absent** where they should be: "5 Gold", never "5 Golds"; "6 on Sheep" stays singular
  because the token before the icon is "on", not a number.
- **No raw `<img` or `src=`** anywhere in the text.

### 2. Check the head

```sh
curl -s https://aoe4guides.com/builds/<id> | grep -E "<title>|og:title|canonical"
```

Before this feature, every build returned `Age of Empires IV Build Orders | AOE4 GUIDES`. After, each
returns its own.

### 3. Check the unfurl

Paste a build URL into Discord, and into a Twitter/X card validator. Both re-fetch on every paste, so
this is the fastest feedback available — it does not wait on any crawler.

### 4. Check nothing else broke

```sh
curl -sI https://aoe4guides.com/builds        # still the SPA shell
curl -sI https://aoe4guides.com/builds/new    # still the SPA shell
```

Both must still work. A `builds/` directory in the publish output is the part of this design most
likely to have side effects, which is why it is settled by probe before anything is built.

### 5. Run the checks

```sh
npm run check:icons
npm run check:steps
npm run check:plurals   # new
npm run check:setup     # after touching any .vue file
```

`check:plurals` fails when an irregular-plural entry no longer matches any icon — i.e. when an upstream
icon rename would otherwise have silently reverted that name to the regular rule.

---

## Reading the log

Success:

```
prerender: snapshot aoe4-guides @ 2026-08-01 (11 days old) · 4012 builds
prerender:   4010 pages written · 2 skipped · 9.1s
prerender:   unresolved icons: 0
```

Three things to watch:

- **project** — if this says `aoe4-guides-dev`, the refresh ran against the wrong database and every
  page is wrong. Stop.
- **age** — if the snapshot is months old, the scheduled refresh has stopped running. GitHub disables
  scheduled workflows after 60 days of repository inactivity, so on a quiet project this is a real
  possibility rather than a theoretical one. This line is the backstop.
- **unresolved icons** — should be 0, or a known list. Unresolved icons are dropped silently from step
  text, so this counter is the only thing between vocabulary drift and quiet content loss (SC-009b). A
  number that grows between deploys is a defect.

Skips are normal and always exit 0:

```
prerender: skipped — not a Netlify build (pass --force to run anyway)
prerender: skipped — data/seo-snapshot.ndjson not found
```

---

## What you will *not* see

Nothing about the site looks different to a human. `#app` stays empty in the generated files, exactly as
it is today, so the page paints when the JavaScript arrives and not before. Phase A is entirely for
crawlers, unfurlers and search engines.

The one user-visible change is in **focus mode**: it no longer says "undefined" when a step contains an
icon that is not in the vocabulary, and counted units are now spoken as plurals. Worth listening to once
after the converter changes land.
