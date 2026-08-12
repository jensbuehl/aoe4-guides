# Phase 1 Data Model: Prerendered SEO Head Tags for Build Pages

**Date**: 2026-08-11 · **Branch**: `033-prerender-build-seo`

No collection is created, no document is written, no field is added. This feature only *reads*. What
follows is the subset it reads and the shapes it derives.

**Two stages, and which one touches what matters:**

```
scheduled refresh   Firestore ──read──▶ data/seo-snapshot.ndjson ──commit──▶ repo
   (monthly)                                                                   │
deploy (every push)                        dist/builds/*.html ◀──generate──────┘
```

The deploy stage reads a file and nothing else. Firestore appears only in the refresh (R11, FR-025).

---

## 1. Build (read from `builds`, Firestore — **refresh only**)

Query: `where("isDraft", "==", false)` — one query per *refresh*, ~4,000 documents, roughly a dozen
times a year. Never on a deploy.

### Fields read

| Field | Used for | Notes |
|---|---|---|
| `id` (doc id) | URL, output filename, canonical | Validated as a safe filename before use |
| `title` | `<title>`, `og:title`, `HowTo.name` | Falls back when empty (§4) |
| `description` | meta description, `HowTo.description` | Contains markup; stripped and truncated |
| `civ` | description fallback, `HowTo.about` | Civ code (`ABB`, `HOL`, …) |
| `strategy` | description fallback | Nullable |
| `map` | description fallback | Often `""` |
| `season` | description fallback | e.g. `"Season 13"` |
| `author` | `HowTo.author` | Display name string |
| `steps` | `HowTo.step[]` | Sections, not steps — see §2 |
| `timeCreated` | `dateModified`, sitemap `lastmod` | Firestore timestamp |
| `isDraft` | Filter only | Never emitted |

### Fields deliberately NOT read

`views`, `likes`, `upvotes`, `downvotes`, `comments`, `score`, `scoreAllTime` — these change constantly
(the rules permit unauthenticated increments on exactly this set), so a prerendered copy would be
visibly stale. FR-014.

`authorUid`, `creatorId`, `creatorName`, `video`, `remixOf` — not needed for head tags.

---

## 2. Step document (`build.steps`)

**The name lies: `steps` is an array of *sections*, and a section's own `steps` array is an array of
*items*, not of steps.** An item is one of:

```
item without .kind          → an ordinary step, or a note
item with .kind === "alt"   → an alternatives block, whose real steps live in .paths[].steps[]
```

Iterating a section's `steps` directly therefore reads a block as if it were a step and silently
discards everything inside it. Seven shipped bugs of exactly this shape are why
`npm run check:steps` exists.

**Traversal**: `forEachStep(sections, visit)` from
[useAgeTimings.js:187](../../../src/composables/builds/useAgeTimings.js#L187), which visits every step
on every path in document order. **Not** `flattenSections`, which resolves each block to a single path —
that answers "what is being read", and this feature needs the whole document (R8, FR-012).

### Step fields used

| Field | Used for |
|---|---|
| `description` | The step text, after icon conversion. Contains `<img>` and `<br />` only. |
| `time` | Not emitted in Phase A. Reserved. |
| `food` / `wood` / `gold` / `stone` / `builders` / `villagers` | Not emitted. These are the speech side's "you should have…" additions and do not belong in page text (FR-013, US4 §11). |

---

## 3. Icon vocabulary (static, in-repo)

~1,095 entries across `src/composables/builds/icons/`. Read-only here.

| Field | Used for |
|---|---|
| `imgSrc` | The lookup key. Indexed into a Map once (FR-013f). |
| `title` | The word emitted for the icon. |
| `type` | `unit` \| `building` \| `technology` \| `ability` \| *absent*. Decides countability. |
| `class` | `landmark` excludes an entry from pluralisation — landmarks are unique. |

**Countable set** = `type ∈ {unit, building}` **and** `class ≠ landmark` → 324 entries (257 units,
67 buildings). Everything else is never pluralised: resources are mass nouns ("5 Gold"), technologies
and abilities are not counted, landmarks are unique.

### Derived: irregular plurals (`icons/plurals.js`, new)

A map from icon `title` to its plural, holding only what the regular rules get wrong (~15–20 entries:
invariants like *Barracks*, *Streltsy*, *Runestones*; head-noun compounds like *Nest of Bees*). Lives
outside the icon JSON because that JSON carries `syncSkip` and is regenerated from upstream — a field
added there is at risk of being discarded (R7). `check:plurals` fails when a key no longer matches any
icon title.

---

## 4. Derived: page metadata (per build, in memory)

| Derived value | Rule |
|---|---|
| `title` | `build.title` if non-blank, else a composed title naming the civilisation |
| `description` | `build.description` with markup stripped, whitespace collapsed, truncated on a word boundary; if blank, composed from civ + strategy + author |
| `canonical` | `https://aoe4guides.com/builds/<id>` — produced by the *same* rule the router uses ([router/index.js:64](../../../src/router/index.js#L64)), no trailing slash, no query (FR-007) |
| `stepText[]` | Ordered converted step text, empty entries dropped |
| `unresolvedIcons` | Count of images resolving to no icon — reported, never emitted (FR-013a) |

### Validation rules

- Build id must match a safe-filename pattern; anything else is skipped and counted. The generator must
  not be able to write outside its output directory whatever an id contains.
- A build whose every step converts to empty contributes no step list rather than an empty one.
- All user text is escaped at the point of emission — HTML-attribute escaping for meta content,
  `JSON.stringify` plus `<` → `<` for structured data, so a title containing `</script>` cannot
  terminate the block (FR-011).

---

## 5. Derived: sitemap entry

| Field | Source |
|---|---|
| `loc` | The canonical URL |
| `lastmod` | `timeCreated`, ISO-8601 date |

`timeCreated`, not a modification time — builds record no modification timestamp, so an edited build
looks older than it is. Accepted: `lastmod` is a hint, not an instruction.

Static routes (`/`, `/builds`, `/builds/new`, `/about`, `/privacy`) carry through from
[public/sitemap.xml](../../../public/sitemap.xml). Nothing disallowed by
[robots.txt](../../../public/robots.txt) may appear (FR-017).

---

## 6. Snapshot (`data/seo-snapshot.ndjson`, committed)

The boundary between the two stages. Full shape in
[contracts/snapshot-refresh.md](./contracts/snapshot-refresh.md); what matters to the model:

- **One JSON object per line, sorted by `id`.** Format chosen so an unchanged build produces no diff,
  keeping a monthly refresh cheap in git history (FR-027). Reformatting it destroys that property.
- **A leading `_meta` line** carrying `project` and `generated`, so a deploy can log which database the
  data came from and how stale it is.
- **Step text is already converted** — icon-to-text runs at refresh, not at generation. The converter
  depends on the icon vocabulary in `src/`, so doing it once keeps the generator to string assembly and
  makes the snapshot readable in a diff. Trade-off: a converter improvement reaches pages only at the
  next refresh.
- Fast-changing fields are excluded, which is what keeps a refresh from being a full-file diff.

## 7. What is written

Nothing, to any database. Output is files only:

```
data/seo-snapshot.ndjson   refresh stage only, committed
dist/builds/<id>.html      one per public build
dist/sitemap.xml           overwrites the 5-URL static copy — on skip, that copy survives (FR-016)
```

Both stages write to a temporary path and rename into place, so an interrupted run cannot publish a
partial set of pages or commit a truncated snapshot (FR-021).
