# Research: Unlisted Builds, Earned by Sharing

No open questions came out of the spec. Each section below is a decision the code forced, with
what it was checked against.

## R1. Where the allowance rule lives

**Decision**: A new import-free module, `src/composables/builds/unlistedAllowance.js`. It exports the
three constants (`BASE = 10`, `PER_PUBLISHED = 2`, `CAP = 50`), a pure
`unlistedAllowance(publishedCount)`, and `unlistedLimitMessage(allowance)`, which returns the text for
FR-005 or FR-006.

**Rationale**: Today the rule is a `const maxDrafts = 10` inline in `BuildEditor.handleDraft`, with the
same 10 repeated in the snackbar string. The new rule has three numbers, and the message has to quote
them. Keeping all of it in one place means the message can never disagree with the rule. The
constitution's self-review also calls out magic numbers. Because the module has no imports, a Node
harness can test it directly, without the alias loader `CLAUDE.md` describes.

**Alternatives considered**: Inline in `handleDraft` would be the smallest diff, but the numbers would
appear in two places (the rule and the message) and couldn't be tested outside a `.vue` file. Putting
it in `src/config/` would suggest it's per-deployment configuration, which it isn't.

## R2. How the published count is read

**Decision**: `getUserBuildsCount(uid)` with its default argument. Run it in parallel with the
existing `getUserDraftsCount(uid)`, inside the same guard and only when that guard applies.

**Rationale**: `getDefaultConfig()` has every filter empty and `drafts: false`, and
`getFilterQueryParams` turns that into `isDraft == false`. So the default call counts exactly the
author's published builds and ignores whatever filter is active in My Builds, as FR-002 requires.
This is the same query shape My Builds already uses for its count (author + `isDraft` + `orderBy
timeCreated`), so it uses an existing composite index. Both counts go through `getCountFromServer`,
which costs one read per 1,000 matching documents. That's two reads per guarded save, and nothing on
any other path (constitution IV).

**Failure behaviour** (FR-007): `collectionService.getSize` returns `undefined` on error instead of
throwing. The guard treats a published count that isn't a number as 0, so the allowance becomes 10.
The unlisted count fails the same way today: `undefined >= 10` is false, so the save goes through.
That stays as it is. The spec only asks that the new rule never blocks more than the old one did.

## R3. Which saves are checked

**Decision**: Check when `mode === "new"` (as today), **or** when `mode === "edit"` and
`originalBuild.value.isDraft === false`. Never check when the stored build is already unlisted.

**Rationale**: `originalBuild` is refreshed after every successful save (`BuildEditor.vue` lines
485/506/549/757), so it always holds the state that's actually stored, whatever the author has
changed on screen. Today the edit path sets `isDraft = true` with no check, so you can get past the
cap by publishing a build and then saving it as a draft. The spec's assumption closes that.

**Note**: Turning a published build into an unlisted one also lowers the published count by one.
The allowance is computed *before* the change (spec edge case), using the counts as they are right
now. This is deliberate: it keeps the check to one query pair with no "what if" arithmetic.

## R4. Search-engine exclusion

**Decision**: `BuildDetails.vue` keeps a `<meta name="robots" content="noindex">` tag in step with
`build.value?.isDraft`, using a `watch` with `immediate: true`, and removes the tag in
`onUnmounted`. The DOM handling is written inline, the same way `setCanonical` in
`src/router/index.js` handles its `<link>`.

**Rationale**:
- No robots tag exists anywhere in `src`, `index.html` or the prerender script, so there's nothing
  to extend. One page needs this, so no helper or composable yet (constitution I: abstract after two
  uses).
- **Reactive, not set once on mount.** `handlePublish` uses `router.replace` to the same route with
  the same params, and Vue Router reuses the component for that, so `onMounted` doesn't run again.
  Code that only runs on mount would leave `noindex` on a build that has just been published.
- **Removed on unmount.** The tag lives in `document.head`, which is shared by every page. If it
  stayed, the next page the visitor opens would also be marked noindex. Crawlers that render the page
  usually load one URL per session, but a visitor navigating inside the app doesn't.
- Googlebot can't pass App Check, so the build page falls back to `/api/builds/{id}`
  (`project-appcheck-blocks-reads` memory). That route returns unlisted builds too, so `isDraft` is
  present and the tag still gets set.

**Known limitation**: Prerendered HTML only exists for published builds, because
`refresh-snapshot.mjs` filters on `isDraft == false`. If a build is unpublished, its stale
prerendered file keeps its indexable head until the Monday snapshot refresh redeploys. A crawler
that renders the page still sees the client-side `noindex`. This is accepted as best effort, as the
spec says.

**Alternatives considered**: An `X-Robots-Tag` header set at the edge: Netlify can't tell an unlisted
build from a published one without a Firestore read on every request, which constitution IV rules out.
Disallowing the URLs in `robots.txt`: not possible, because unlisted and published builds share one
URL pattern.

## R5. The badge icon

**Decision**: Use `mdi-link-variant` and add it to `src/plugins/mdiIcons.js`. Remove
`mdi-pencil-circle` from the allowlist, since all four of its uses are the badges this feature
replaces.

**Rationale**: FR-011 rules out a pencil (work in progress) and a lock or crossed-out eye (private).
A link is the honest picture: anyone holding the link can open it. `mdi-eye-off-outline` is already in
the allowlist, which makes it tempting, but it's exactly the "private" signal the spec forbids.

**Trap** (from `CLAUDE.md`): an icon missing from the allowlist renders as nothing, with a green build.
The `comm` check in `CLAUDE.md` must print only `mdi-svg` and `mdi-xxx` afterwards. It also has to stay
clean in the other direction: `mdi-pencil-circle` may only be removed once `grep` finds no use of it.

## R6. What keeps the word "draft"

**Decision**: Code identifiers keep `draft`: the `isDraft` field, `getUserDrafts*`, `getDraftsConfig`,
`handleDraft`, and the `drafts` filter flag. Only user-facing text changes.

**Rationale**: The Firestore field `isDraft` is read by the public API, RTS Overlay, the home snapshot
function and the SEO snapshot script, so FR-013 forbids changing it. Renaming the JavaScript around an
unchanged field would only move the mismatch somewhere else. One comment at the guard explains it:
*"draft" in code = "unlisted" to users; the stored field predates the rename.*

Things that are left alone on purpose, because they aren't the build state:
- The editor's local recovery (`useEditorDraft`, "Unsaved changes from …"), as FR-012 requires.
- The filter sheet's `draft` (pending filter changes) and `alternativesDraft.js`.
- `NewsPage.vue`'s `shot: "draft"`, which is a screenshot file name for the recovery feature.
- The `aoe4-guides-api` Swagger text ("drafts never are"). It's developer-facing and lives in another
  repo. Worth renaming the next time that repo is touched, but not part of this change.

## R7. Copy

**Decision**: See [contracts/ui-copy.md](contracts/ui-copy.md). The limit messages keep the existing
villager tone ("Oh, no! …"), so the change reads as the same site.
