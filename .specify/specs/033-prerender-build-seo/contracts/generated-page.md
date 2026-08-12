# Contract: the generated page

What `dist/builds/<id>.html` contains, and what it must not.

---

## Derivation

Start from **`dist/index.html`** — the built shell, after `vite build`. Never the repo-root
[index.html](../../../index.html): it references `/src/main.js`, which does not exist in production, so
pages built from it would load nothing.

The only edit is an injection immediately before `</head>`. Everything else — the theme bootstrap
script, the font link, the favicons, the hashed module script, `<div id="app"></div>` — is carried
through byte-for-byte.

**Assert before emitting**: the template contains a `</head>` and at least one hashed
`<script type="module" src="/assets/…">`. If not, emit nothing and log loudly (`prerender-cli.md`,
case 3).

---

## Tags removed from the inherited head

The shell's site-wide tags would otherwise sit alongside the per-build ones and contradict them. Remove:

- `<title>`
- `<meta name="description">`
- `og:type`, `og:url`, `og:title`, `og:description`
- `twitter:url`, `twitter:title`, `twitter:description`

**Keep** `og:site_name`, `og:image*`, `twitter:card`, `twitter:image*`, `twitter:domain` — the image is
site-wide by design in Phase A (per-build images are a spec exclusion), and the rest are page-independent.

There is no canonical tag in the shell to remove. It was left out on purpose, and the reasoning is
written into [index.html](../../../index.html) — one file serves every route, so a static canonical
would declare every build a duplicate of the homepage.

**That comment is removed from the generated copy**, which the contract did not anticipate. It reads
"No `<link rel="canonical">` here on purpose", and three lines below it these files now carry exactly
that tag. True of the shell, false of every generated page, and it would ship contradicting itself in
~4,000 files. The reasoning stays correct where it belongs — in the shell.

---

## Injected block

```html
<title>{title} | AOE4 GUIDES</title>
<meta name="description" content="{description}">
<link rel="canonical" href="https://aoe4guides.com/builds/{id}">

<meta property="og:type" content="article">
<meta property="og:url" content="https://aoe4guides.com/builds/{id}">
<meta property="og:title" content="{title} | AOE4 GUIDES">
<meta property="og:description" content="{description}">

<meta property="twitter:url" content="https://aoe4guides.com/builds/{id}">
<meta name="twitter:title" content="{title} | AOE4 GUIDES">
<meta name="twitter:description" content="{description}">

<script type="application/ld+json">{ …HowTo… }</script>
```

`og:type` is `article`, not the shell's `website`.

### Field rules

| Placeholder | Rule |
|---|---|
| `{title}` | `build.title`, trimmed. Blank → composed from civilisation. Attribute-escaped. |
| `{description}` | Markup stripped, whitespace collapsed, truncated on a word boundary (~160 chars). Blank → composed from civ + strategy + author. Attribute-escaped. |
| `{id}` | Validated safe. The canonical is produced by the **same rule the router uses** ([router/index.js:64](../../../src/router/index.js#L64)) — no trailing slash, no query string. |

---

## Structured data

```json
{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "{title}",
  "description": "{description}",
  "author":   { "@type": "Person", "name": "{author}" },
  "about":    { "@type": "Thing",  "name": "Age of Empires IV — {civ}" },
  "dateModified": "{timeCreated, ISO-8601}",
  "step": [
    { "@type": "HowToStep", "position": 1, "text": "6 on Sheep with 1 Build House" }
  ]
}
```

- Steps come from `forEachStep` in **document order**, including every path of every alternatives
  block — not `flattenSections`, which resolves to one reading (R8, FR-012).
- Steps converting to empty text are omitted. A build with no usable steps omits `step` entirely
  rather than emitting `[]`.
- `dateModified` derives from `timeCreated`; builds record no modification time (data-model §5).
- **Escaping**: `JSON.stringify`, then `<` → **`<`** — *not* the HTML entity `&lt;`, which is what
  this contract originally said and which is wrong. The content of a
  `<script type="application/ld+json">` block is parsed as **JSON, not HTML**, so entities in it are
  never decoded: `&lt;` would survive into the parsed data as those four literal characters and quietly
  corrupt every title containing a `<`. `<` is JSON's own escape — it parses back to `<` while
  leaving no `<` in the byte stream for the HTML parser to mistake for `</script>`. Same goal, and it
  actually achieves it (FR-011).

---

## Body

Unchanged from the shell:

```html
<body>
  <div id="app"></div>
  <script type="module" src="/assets/index-{hash}.js"></script>
</body>
```

**Nothing is added inside `#app`.** Vue's `mount()` clears its container, so any content placed there
would be replaced rather than hydrated — a visible repaint and a layout shift, from a generator that
would then have to track `BuildDetails` forever. That is Phase B, and it is out of scope.

Consequence worth stating plainly: a crawler that does not run JavaScript sees a **complete head and an
empty body**. The steps reach it through the structured-data block, which is the whole reason that block
carries the full step list rather than a summary.

---

## Sitemap

`dist/sitemap.xml`, overwriting the copy of [public/sitemap.xml](../../../public/sitemap.xml).

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://aoe4guides.com/</loc><priority>1.0</priority></url>
  <!-- … the existing static routes … -->
  <url>
    <loc>https://aoe4guides.com/builds/{id}</loc>
    <lastmod>2026-08-11</lastmod>
  </url>
</urlset>
```

- The namespace URI is `http://…` and is compared literally. The warning in the existing file is
  correct and must survive: writing `https://` puts the document in an unknown namespace and search
  engines reject it. It is an identifier, not a link.
- Single file below 45,000 URLs; above that, split and emit an index (FR-017).
- Nothing disallowed by [robots.txt](../../../public/robots.txt) may appear.
- On skip, this file is never touched and the static 5-URL version ships (FR-016).

---

## Round-trip guarantees

Verifiable without a browser, with `curl`:

| Property | Check |
|---|---|
| Every public build has a distinct title | Fetch N pages, compare `<title>` — no duplicates from the shell |
| Canonical agrees with the router | Load the page, let the app boot, compare the tag before and after — byte-identical (FR-007) |
| No page is missing its shell | Every generated file contains the hashed module script |
| No user text escapes its context | A build whose title contains `"`, `<`, `</script>` and emoji still yields well-formed markup and parseable structured data |
