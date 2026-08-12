# Feature Specification: Prerendered SEO Head Tags for Build Pages

**Feature Branch**: `033-prerender-build-seo`

**Created**: 2026-08-11

**Status**: Draft

**Input**: User description: "Build-time prerendering of per-build SEO metadata (Phase A: head only). ~4000 build pages all return the same generic title, description and OG tags because one index.html is served for every route. AI crawlers and social unfurlers do not run JavaScript, so they see 4000 identical pages. Emit one HTML file per build at deploy time carrying real head tags, leaving the body untouched."

> **Scope guard:** this feature writes **`<head>` tags only**. `#app` stays empty, exactly as it is today, so there is no hydration, no swap and no flicker — a human visitor sees a byte-identical page to the one they see now. No component, no route, no store and no Firestore rule changes. The deliverable is a build-time script, the files it emits, and one shared text converter.
>
> **One exception, deliberate.** A build order is written in icons, not prose — `6 on 🐑 with 1 🔨🏠` is a typical step, and stripping the icons leaves nothing worth reading. Turning icons into words is therefore not a detail of this feature, it *is* the feature for anything that reads the steps. The converter that does it already exists, is shared with focus mode's text-to-speech, and **improving it changes what focus mode says out loud.** That is a user-visible change to the running application, it is intended, and it fixes a live defect (see US4). Everything else in the scope guard holds.

> **Why head-only:** putting visible content into `#app` is the obvious next step and is deliberately deferred. Vue's `mount()` clears the container and re-renders, so prerendered body markup is *replaced*, not hydrated — which means a visible repaint and a layout shift whose size depends on how closely a hand-written generator tracks `BuildDetails`. That generator would then have to be kept in sync with components forever. Head tags carry the social unfurl, the search snippet and — via JSON-LD — the full step list, which is most of the value at none of that cost.

> **Why a deploy costs nothing:** an earlier draft had the generator read the database on every deploy — ~4,000 reads, a few cents a month. That was rejected, and not on the arithmetic. Deploys fire on every push to `main`, so it would put a recurring database bill on the act of shipping an ordinary feature, in a project paid for out of pocket. Knowing that every push costs *something* is itself the cost. So the build data is **committed to the repository** and refreshed on a schedule: a deploy reads a file, performs zero database reads, needs no credentials, and works offline from a checkout. Reads happen a dozen or so times a year instead of hundreds — under ten cents annually.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A shared build link says what it is (Priority: P1) 🎯 MVP

A content creator finishes a build order and pastes the link into their clan's Discord. Today the preview card reads *"Age of Empires IV Build Orders — Create and share build orders for Age of Empires IV"*, identical to the card for every other build ever shared, and identical to the homepage. Nobody can tell from the card whether it is the Abbasid feudal rush they were promised. After this feature the card carries the build's own title, its own summary, and names the civilisation and author.

**Why this priority**: Sharing a link is the single most common way a build reaches a new player, and the moment it happens most is right after publishing. It is also the only part of this feature whose payoff is immediate and visible — unfurlers re-fetch on every paste, so the improvement lands the day it deploys rather than whenever a crawler next visits.

**Independent Test**: Deploy, then paste a build URL into Discord, Slack and a Twitter/X card validator → each preview shows that build's title and description, not the site defaults.

**Acceptance Scenarios**:

1. **Given** a public build order, **When** its URL is requested with JavaScript disabled, **Then** the returned HTML contains an `og:title` holding that build's title and an `og:description` holding that build's summary.
2. **Given** two different public builds, **When** both URLs are fetched, **Then** their `og:title` values differ — no two public build pages share a title.
3. **Given** a build page, **When** it is unfurled, **Then** `og:type` is `article` rather than `website`, and `og:url` is that build's canonical URL.
4. **Given** a build whose author has set no description, **When** its page is fetched, **Then** a description is still present, composed from what the build does record (civilisation, strategy, author).
5. **Given** a build whose title contains quotes, angle brackets or emoji, **When** its page is fetched, **Then** the markup is well-formed and the title renders as the author typed it.

---

### User Story 2 - A search result names the build (Priority: P1)

A player searches for *"aoe4 abbasid feudal rush build order"*. Today every AoE4 Guides result Google holds is titled *"Age of Empires IV Build Orders | AOE4 GUIDES"*, because that is what the served HTML says, and the per-route title is only written after JavaScript has run. After this feature each build page carries its own title and description in the HTML itself.

**Why this priority**: This is the long-tail traffic the site exists to catch, and it is the same one-line change to the same generated file as Story 1. Shipping Story 1 without it would be leaving the larger half of the value unclaimed for no extra work.

**Independent Test**: Fetch 20 build URLs with `curl` (no JavaScript) → each returns a distinct `<title>` and `<meta name="description">` derived from that build.

**Acceptance Scenarios**:

1. **Given** a public build order, **When** its URL is fetched without JavaScript, **Then** `<title>` contains the build's title and the site name.
2. **Given** a build page, **When** it is fetched, **Then** it carries exactly one `<link rel="canonical">`, pointing at that build's URL in the same form the running application would write.
3. **Given** the application then loads on that page, **When** the router runs, **Then** the canonical it writes is byte-identical to the prerendered one — the two must never disagree about the same page.
4. **Given** a build description containing markup, **When** it is used as a meta description, **Then** the meta description is plain text with markup stripped, and is truncated to a length search engines will display.
5. **Given** a page for a build that is a draft, **When** its URL is requested, **Then** no prerendered file exists for it and the request falls through to today's behaviour.

---

### User Story 3 - The generator can never break a deploy, a build or CI (Priority: P1)

The maintainer runs `npm run build` locally twenty times a day and has no Firestore service account on their machine. CI runs the same command on every push, also without credentials. Neither should so much as slow down, and a Firestore outage during a Netlify deploy must not turn a working site into a failed deploy.

**Why this priority**: This is a hard constraint, not a nicety. Wiring the generator into `build` unconditionally would red-fail CI on the first push. It is P1 because it gates whether the feature can be merged at all, and it is genuinely independently testable.

**Independent Test**: Run `npm run build` with no credentials and no `NETLIFY` variable → Vite output is unchanged, the script logs a skip, exit code is 0, and `dist/builds/` does not exist.

**Acceptance Scenarios**:

1. **Given** a local machine with no `NETLIFY` environment variable, **When** `npm run build` runs, **Then** the generator skips, logs why, and exits 0 without contacting Firestore.
2. **Given** CI running `npm run build`, **When** the generator is reached, **Then** it skips for the same reason and the workflow stays green.
3. **Given** a Netlify deploy with credentials absent or malformed, **When** the generator runs, **Then** it logs the reason, emits no files, and exits 0 — the deploy publishes a site identical to today's.
4. **Given** a Netlify deploy where Firestore errors partway through, **When** the failure occurs, **Then** the generator does not leave a half-written `dist/builds/` behind and does not fail the deploy.
5. **Given** the maintainer wants to test the generator locally, **When** they run the dedicated script with a limit, **Then** it runs against a small number of builds rather than reading the whole collection.
6. **Given** any run that does emit files, **When** it finishes, **Then** it logs how many pages it wrote, how long it took, and how many builds it skipped and why.

---

### User Story 4 - The steps read as English (Priority: P1)

A player asks an AI assistant how to open as Abbasid. The assistant's crawler fetched the build page, does not execute JavaScript, and found an empty `<div>`. Giving it the steps is only useful if the steps say something: a build order is written in icons, so `6 on 🐑 with 1 🔨🏠` has to arrive as *"6 on Sheep with 1 Build House"* and not as a row of image tags, a row of blanks, or a row of the word "undefined".

**Why this priority**: raised from P2. The icons **are** the build order — a step stripped of them is an empty sentence, so every other consumer of the step list depends entirely on this. It also fixes a defect that is live today: an image whose path is not in the icon vocabulary makes the converter emit the literal string *"undefined"*, which focus mode currently reads aloud.

**Independent Test**: Run the converter over a sample of real published builds and read the output as prose → each step is a sentence a player would recognise, with no markup, no `undefined`, and no doubled spacing.

**Acceptance Scenarios**:

1. **Given** a public build order, **When** its page is fetched, **Then** it contains one structured-data block describing the build as a set of ordered steps.
2. **Given** a step description containing game-asset icons, **When** it is converted, **Then** each icon becomes the name a player would use for it, spaced so the result reads as a normal sentence with no doubled or leading spaces.
3. **Given** an image whose path is **not** in the icon vocabulary, **When** it is converted, **Then** it is dropped silently and the run records that it was, rather than emitting the word "undefined" or the raw path.
4. **Given** a count immediately preceding a countable icon — a unit or an ordinary building — **When** it is converted, **Then** the name is pluralised: `2 🗡️` becomes "2 Spearmen", not "2 Spearman".
5. **Given** a count preceding a resource, a landmark or a technology, **When** it is converted, **Then** the name is **not** pluralised — "5 Gold", never "5 Golds"; landmarks are unique and are never counted.
6. **Given** an icon name whose plural is irregular, **When** it is converted, **Then** the correct plural is used. Regular English rules cover most of the vocabulary; the irregular remainder is recorded explicitly rather than guessed at.
7. **Given** the icon vocabulary changes, **When** a recorded irregular plural no longer matches any icon, **Then** a check fails loudly rather than the exception silently ceasing to apply.
8. **Given** a build containing an alternatives block, **When** its steps are extracted, **Then** the steps inside **every** path are present — not only the path a reader would see by default.
9. **Given** a build containing section notes and step notes, **When** its steps are extracted, **Then** notes are not mistaken for steps and no content inside a block is dropped.
10. **Given** any user-authored text, **When** it is embedded in structured data, **Then** it cannot terminate or escape the surrounding block.
11. **Given** focus mode reads a step aloud, **When** the converter changes, **Then** speech improves in step with page text and never regresses — the speech-only additions (spoken pause markers, villager announcements) stay out of page text.
12. **Given** the converter runs across every public build during a deploy, **When** the run completes, **Then** the time it spends resolving icons is a small fraction of the deploy, not a multi-minute stall.

---

### User Story 5 - Every public build is discoverable (Priority: P2)

The sitemap today lists five URLs. Roughly four thousand build pages are reachable only if a crawler happens to follow a link to them. After this feature the sitemap lists every public build.

**Why this priority**: A sitemap without per-page titles would be pointless — it would simply invite crawlers to index 4,000 identical pages — so this has to follow Stories 1 and 2, not lead them. Once they exist, it is the cheapest way to get the pages looked at.

**Independent Test**: Fetch the sitemap after a deploy → it validates, and its URL count equals the number of public builds plus the existing static routes.

**Acceptance Scenarios**:

1. **Given** a successful generator run, **When** the sitemap is fetched, **Then** it lists every public build page plus the static routes listed today.
2. **Given** a skipped or failed generator run, **When** the sitemap is fetched, **Then** the existing five-URL sitemap is served unchanged — a failure must not produce an empty or truncated sitemap.
3. **Given** the sitemap, **When** it is validated, **Then** no URL in it is disallowed by `robots.txt`, and no draft or per-user page appears.
4. **Given** the number of public builds grows past the per-file limit search engines accept, **When** the sitemap is generated, **Then** it is split and indexed rather than silently truncated.

---

### Edge Cases

- **A build is deleted or unpublished between deploys.** Its prerendered file survives until the next deploy, so a crawler receives a real page for something that is gone. The application handles this correctly on load (fetch returns nothing, `BuildNotFound` renders), so the failure is cosmetic and self-correcting. Accepted, not engineered against.
- **A build has no steps at all.** The page must still be generated with title, description and canonical; the structured data omits the step list rather than asserting an empty one.
- **A step is nothing but icons**, with no words at all — common, and legitimate. It converts to a list of names, which is what the author wrote.
- **A step's every image fails to resolve.** Dropping them (FR-013a) leaves an empty step. An empty step must be omitted from the step list rather than emitted blank, and must count toward the unresolved-icon report.
- **An icon name is already plural** — "Barracks", "Streltsy", "Nest of Bees". Pluralising it again is wrong; these belong in the recorded exception set, mapping to themselves where invariant.
- **A count precedes a named unique unit** — "1 Lord of Lancaster". Unique units are never pluralised regardless of the count in front of them.
- **A build's title is empty or whitespace.** Falls back to a generated title naming the civilisation, rather than emitting an empty `<title>`.
- **Two builds share a title.** Permitted and common. Titles need not be unique; canonical URLs must be.
- **A build id containing characters that are unsafe in a filename or URL.** Ids come from Firestore and are alphanumeric, but the generator must refuse to write outside its output directory regardless of what an id contains.
- **The generator runs twice in one deploy.** Output must be identical — the run is idempotent, and the output directory is rebuilt from scratch rather than merged into.
- **A build page that a static file exists for is requested with a query string** (e.g. `?focus=true`). The static file is served and the application reads the query as it does today; the canonical omits the query, as the router already does.
- **`dist/index.html` is missing or has an unexpected shape** because Vite's output changed. The generator must fail loudly *in its own logs* and emit nothing, rather than writing thousands of pages that cannot boot the application.
- **The first full deploy uploads ~4,000 new files.** Deploy duration is expected to grow; the size of that growth is unknown until measured.

## Requirements *(mandatory)*

### Functional Requirements

**Generation**

- **FR-001**: The system MUST emit one HTML document per public build order, at a path that the host serves for that build's existing URL, without changing the URL.
- **FR-002**: Each generated document MUST be derived from the **built** application shell, so that it loads the same application assets as every other page. Deriving it from the pre-build source shell is a defect: the source shell references development entry points that do not exist in production.
- **FR-003**: Generated documents MUST leave the application's mount container empty. No visible content is added in this feature.
- **FR-004**: The generator MUST rebuild its output directory from scratch on every run, so builds that have been deleted or made private lose their pages.
- **FR-005**: The generator MUST exclude drafts and any build that is not publicly readable.

**Head content**

- **FR-006**: Each document MUST carry a page title, a meta description, a canonical URL, Open Graph tags and Twitter Card tags describing **that build**.
- **FR-007**: The canonical URL MUST be produced in exactly the form the running application produces for the same page, so the two can never disagree.
- **FR-008**: Meta descriptions MUST be plain text — markup stripped — and truncated to a length search engines display without cutting mid-word.
- **FR-009**: Where a build lacks a usable description or title, the system MUST compose a fallback from the fields it does have rather than emitting an empty tag.
- **FR-010**: Each document MUST carry structured data describing the build as an ordered list of steps, including a last-modified date.
- **FR-011**: All user-authored text placed into markup or structured data MUST be escaped such that it cannot break out of the attribute, element or data block containing it.

**Reading the build**

- **FR-012**: Step extraction MUST visit **every** step in the document, including steps inside every path of an alternatives block, and MUST NOT treat a note or an alternatives block as a step. It MUST use the project's existing document-traversal helper rather than iterating a section's item list directly.
**Icon-to-text conversion**

> The existing conversion, written for text-to-speech, is the starting point and MUST be shared rather
> than reimplemented — a second converter would drift, and page text and spoken text describing the same
> step must not diverge. The requirements below amend it. Speech-specific behaviour (spoken pause
> markers, villager announcements) stays on the speech side and MUST NOT reach page text.

- **FR-013**: Step text MUST render each game-asset icon as the name a player would use for it.
- **FR-013a**: An image whose path resolves to no known icon MUST be dropped, and the occurrence counted and reported at the end of the run. It MUST NOT reach output as the word "undefined", as a raw path, or as an empty gap in a sentence. *(This is a live defect: the current lookup returns the path itself when it matches nothing, so reading `.title` off it yields `undefined` — which focus mode speaks aloud today.)*
- **FR-013b**: Conversion MUST produce normal sentence spacing — no doubled spaces, no leading or trailing space, no space before punctuation.
- **FR-013c**: Where a count immediately precedes a **countable** icon, the icon's name MUST be pluralised. Countable means units and ordinary buildings. Resources, technologies, abilities and landmarks MUST NOT be pluralised: resources are mass nouns and landmarks are unique.
- **FR-013d**: Pluralisation MUST apply regular English rules, which cover most of the vocabulary. Names whose plural those rules get wrong MUST be recorded explicitly rather than guessed at. The recorded set MUST live where a regeneration of the icon vocabulary from its upstream source cannot silently discard it.
- **FR-013e**: A check MUST fail when a recorded irregular plural no longer matches any icon name, so that renaming an icon upstream cannot silently disable its exception. This joins the project's existing checks.
- **FR-013f**: Icon lookup MUST be indexed rather than scanned. *(Measured: the current lookup rebuilds and linearly scans a ~1,100-entry list per image, costing ~0.02 ms each — about 8 seconds across a full site's steps, for work that should be instant.)*
- **FR-013g**: Path normalisation MUST NOT depend on a fixed list of origins. *(The current conversion strips two hardcoded hosts, so an icon saved from any other origin fails to resolve — and by FR-013a would then be dropped, silently losing content.)*
- **FR-014**: Only slow-changing fields MUST be prerendered — title, description, civilisation, strategy, map, season, author and steps. View counts, votes and comment counts MUST NOT be, because they change constantly and would be visibly wrong.

**Sitemap**

- **FR-015**: A successful run MUST produce a sitemap covering every public build page plus the static routes listed today.
- **FR-016**: A skipped or failed run MUST leave the existing static sitemap in place, unmodified.
- **FR-017**: The sitemap MUST NOT list any URL disallowed by `robots.txt`, and MUST be split with an index if it would exceed the per-file limits search engines accept.

**Safety and control**

- **FR-018**: The generator MUST NOT run by default. It MUST run only when the deploy environment identifies itself, or when explicitly forced.
- **FR-019**: The generator MUST skip when the build data it reads is absent or unreadable, without failing.
- **FR-020**: The generator MUST exit successfully on every skip and on every failure. It MUST NOT be capable of failing a deploy or a continuous-integration run.
- **FR-021**: A failure partway through MUST NOT leave partial output that would be published.
- **FR-022**: The generator MUST accept a limit so it can be exercised locally against a small number of builds.
- **FR-023**: Every run MUST log its outcome: whether it ran or skipped and why, how many pages it wrote, how many builds it excluded, and how long it took.
- **FR-024**: When the host has no generated file for a requested build page, the request MUST fall through to the application shell exactly as it does today.

**Where the build data comes from**

> **A deploy MUST NOT read the database.** Deploys happen on every push to `main`, and a per-deploy
> database cost — however small in absolute terms — is a recurring toll on shipping ordinary features.
> Making it zero, rather than cheap, is the requirement.

- **FR-025**: Page generation MUST read from a snapshot committed to the repository, not from the database. A deploy MUST therefore perform zero database reads, require no database credentials, and be reproducible offline from a checkout alone.
- **FR-026**: The snapshot MUST be refreshed on a schedule, and MUST also be refreshable on demand so a patch or season change can be picked up without waiting.
- **FR-027**: A refresh MUST write only when the data has actually changed, and MUST be stored so that an unchanged build contributes nothing to the size of the change. Refreshing monthly must not accumulate a full copy of the data each time.
- **FR-028**: A refresh that fails MUST be visible to the maintainer. A silently stale snapshot is the failure mode this requirement exists to prevent — pages would keep generating from old data indefinitely with nothing to indicate it.
- **FR-029**: Database credentials MUST exist only where the refresh runs, never in the deploy environment and never in the repository.

**Application changes**

- ~~**FR-030**: The running application MUST NOT overwrite a correct prerendered page title with the generic route title during startup.~~ **DROPPED (T061).** Kept struck through rather than deleted, because the reason it was dropped is worth more than the requirement was.

  The proposed implementation — skip the `afterEach` title reset when a prerendered title is present — would have **introduced a bug**. `BuildDetails.vue:467` does not *set* the title, it *prepends* to whatever is already there:

  ```js
  document.title = build.value.title + " - " + document.title;
  ```

  So on a prerendered page the sequence is: `<title>Beasty 2TC | AOE4 GUIDES</title>` ships → `afterEach` overwrites with the generic route title → `BuildDetails` prepends the build's name, giving `Beasty 2TC - Age of Empires IV Build Orders | AOE4 GUIDES`. Suppress the middle step, as FR-030 asked, and the last one prepends onto the prerendered title instead: **`Beasty 2TC - Beasty 2TC | AOE4 GUIDES`**. The requirement was written against an assumption about that line that does not hold.

  Dropped rather than fixed because the end state, while not identical to the prerendered title, does name the build — and the thing SC-004 actually governs, the canonical, *is* byte-identical, because the generator uses the router's own rule.

  **Follow-up worth considering separately**: making `BuildDetails` set an absolute title (`title | AOE4 GUIDES`) rather than prepending would make the booted and prerendered titles match exactly, and would shorten a needlessly long tab title on every build page. Not done here — the scope guard permits exactly one change to the running application (the icon converter), and this would be a second.

  **Amended the same day, after seeing what Google renders.** Search Console's rendered HTML showed
  `<title>Age of Empires IV Build Orders | AOE4 GUIDES</title>` — the generic route title, on a page
  whose `og:title` was correct. So "the end state is already correct" was **false**, and dropping this
  on that basis was wrong. The cause: `BuildDetails` never reached its own title line, because the read
  failed first (R2d).

  With PR #133 the read succeeds, so the end state now reads `French 3:38 … - Age of Empires IV Build
  Orders | AOE4 GUIDES` — it names the build, which is what matters, but it is long and differs from the
  prerendered `<title>`. That returns this to genuinely cosmetic, and it stays dropped.

  What survives is the finding, not the requirement: **the reason the title looked wrong was never the
  router.** Anyone reopening this should fix the prepend, not suppress the reset — and should check what
  Google renders rather than reasoning about what the code ought to produce.

### Key Entities

- **Public build order**: A build that is not a draft. Contributes a title, description, civilisation, strategy, map, season, author and an ordered step document. Identified by the id already used in its URL.
- **Step document**: A build's sections, each holding an ordered mix of steps, notes and alternatives blocks. An alternatives block holds several paths, each with its own steps. **A section's item list is not a list of steps** — reading it as one silently discards everything inside a block.
- **Icon vocabulary**: Roughly 1,100 game assets, each carrying a display name and a kind — unit, building, technology, ability, resource, landmark. The kind is what decides whether a name can be counted and therefore pluralised. Partly synchronised from an upstream source, so anything this feature adds to it must survive a regeneration.
- **Generated page**: One HTML document per public build. Head describes the build; body is the untouched application shell.
- **Sitemap**: The list of publicly indexable URLs. Replaced wholesale on a successful run, left alone otherwise.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of public build pages return a title and description unique to that build when fetched without JavaScript. Today the figure is 0%.
- **SC-002**: A build link pasted into Discord, Slack or a card validator shows that build's title and summary, verified across at least three unfurlers.
- **SC-003**: The sitemap lists every public build page — approximately 4,000 URLs against today's 5 — and validates against the sitemap schema.
- **SC-004**: A human visitor's experience is unchanged: same rendered page, same first paint, no new layout shift. Verified by comparing a build page before and after on the same device.
- **SC-005**: A local production build with no credentials completes in the same time as today, to within one second, and produces no generated pages.
- **SC-006**: Continuous integration remains green with no configuration change beyond what this feature adds.
- **SC-007**: No deploy can be failed by this feature. Verified by forcing a credential failure and a data failure and observing both deploys publish successfully.
- **SC-008**: A deploy performs **zero** database reads. Verified by deploying with no database credentials present anywhere in the deploy environment and observing a complete, correct set of pages. Reads occur only on a scheduled or manually triggered refresh — roughly one per public build, a dozen or so times a year, for a total running cost under $0.10 **per year**.
- **SC-009**: Structured data on a sample of build pages — including at least one build containing an alternatives block — parses cleanly and contains every step the application shows for that build, plus the steps on paths a reader would not see by default.
- **SC-009a**: Across a sample of at least 50 real published builds, converted step text contains zero occurrences of "undefined", zero raw image markup and zero doubled spaces, and every counted unit or building reads with the correct plural. Sampled by reading the output, not only by pattern-matching it — the test is whether a player would recognise the sentence.
- **SC-009b**: The count of images that resolve to no known icon is reported by every run and is zero, or is a known list. A number that grows silently between deploys is the failure this reporting exists to prevent.
- **SC-010**: Within 90 days of deploy, search-console impressions for build pages and the count of indexed build pages both increase from their pre-deploy baseline. *(Directional, not a gate — indexing latency is outside the project's control.)*

## Assumptions

**Load-bearing, must be verified before implementation**

- The host serves a file at `builds/<id>.html` in response to a request for `/builds/<id>`, and a real file takes precedence over the existing catch-all rewrite to the application shell. **The entire design rests on this.** If it does not hold, the output path or the redirect configuration must change, and that is a planning-stage decision. This is the first thing to test, with a single hand-written file, before any generator is written.

**Environment and data**

- A database service account can be provided to the **refresh** environment as a secret. Adding it is part of this feature's setup. It is deliberately *not* provided to the deploy environment (FR-029).
- The snapshot is roughly 4 MB across ~4,000 builds (measured at ~1 KB per build, sampled from real published builds). Committing it is acceptable at that size, provided FR-027 holds and an unchanged build contributes nothing to a refresh's diff.
- A build published between refreshes has no prerendered page until the next one, and behaves exactly as it does today in the meantime. This was accepted deliberately: recency is not important for search, and the schedule is refreshable on demand for the cases where it is.
- Build documents record a creation time but no modification time, so last-modified dates derive from creation time. This makes an edited build look older than it is — acceptable, since these dates are hints rather than instructions.
- The step-document traversal helper already used by export and validation is correct and is the only sanctioned way to read a build as a document.
- Build ids are safe to use as filenames. The generator validates this rather than trusting it.

**Scope decisions**

- Every public build gets a page, with no quality or length threshold. Some pages will be thin. The alternative — curating by score or description length — was rejected as premature: the long tail is exactly where search value lives, and a threshold can be added later if search console shows thin-content problems.
- All build pages share the existing site-wide preview image. Per-build or per-civilisation images are a separate, later change.
- The structured-data vocabulary describes a build as an ordered procedure. This is understood by search engines and AI crawlers even where it no longer produces a decorated search result.
- Descriptions are truncated for meta tags but stored in full in structured data.

**Deliberately excluded from this feature**

- Visible prerendered content inside the mount container (Phase B), and with it any hydration or flicker question.
- On-demand rendering at the edge for builds created since the last deploy. A freshly published build keeps today's behaviour until the next deploy, which is no worse than today.
- Per-build preview images.
- Any database trigger, cloud function, or hosted intermediate storage in the refresh path. FR-025 requires a snapshot, but it is a file in the repository refreshed by a scheduled job — not a service. An earlier design used a write-triggered function feeding object storage, compacted nightly; it was rejected as three moving parts to maintain forever where a committed file and a cron do the same work visibly.
- `llms.txt` and any other crawler-directed manifest.
- Any change to how the application fetches, renders or caches a build at runtime. **The shared text converter is the one exception** — see the scope guard.
- Rewriting the icon vocabulary, adding names to it, or changing how icons are authored. This feature reads that vocabulary and adds irregular plurals to it; it does not curate it.
- Interpreting icon *pairs* as compound verbs. The vocabulary already handles the common case — the hammer icon is named "Build", so `🔨🏠` converts to "Build House" without special handling — and inferring meaning from adjacency beyond that is guesswork this feature does not need.
