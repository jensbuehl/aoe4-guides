# Contract: what players see (044)

Everything is read from fields on the build document. Nothing here adds a read.

## Build page: "Remixed N times" (US2)

- **Where:** in `BuildMetaLines`, as a line after the existing "Remix of …"
  credit line, so both directions of lineage sit together.
- **Shown when** `build.remixes?.count > 0`. Hidden otherwise, with no empty
  state.
- **Text:** "Remixed 1 time" or "Remixed N times". It is a button opening a
  `v-menu` that lists `remixes.items`. Each item links to `BuildDetails` and
  reads "<title> by <author>".
- **When `count > items.length`:** a last row reads "and N more" and is not a
  link (there is no remix list page in this spec).
- **Touch:** the menu opens on tap, and nothing is hover-only (principle 3).
  On a phone the list must not overflow 360 px; titles are truncated to one
  line, with the full title in the `title` attribute.
- **Icon:** `mdi-source-fork`, which must be added to `src/plugins/mdiIcons.js`.

## Build page, hidden copy (US4)

- **For everyone:** `<link rel="canonical">` points at
  `https://aoe4guides.com/builds/{duplicateOf.id}`. It is set after the build
  loads, the same way `setNoIndex` works, and removed again on leaving the page.
- **For the author only** (`user.uid === build.authorUid`): a `v-alert`
  (type `info`, variant `tonal`, inside the content column) reads "Hidden from
  lists: its steps are identical to <title> by <author>. Change the steps to
  list it again." The title links to the listed build.

## Build list card in My Builds (FR-010)

- `BuildListCard` shows a chip "Duplicate" beside the existing "Unlisted"
  chip, when `build.duplicateOf`. Its fill and size match that chip, but it
  does not use the error colour. The explanation lives on the build page
  (above), one tap away, because a card is not the place for a sentence.
- Public lists never contain such a card.

## Unchanged

- The credit line "Remix of … by …" (`BuildMetaLines`). Backfilled copies show
  it with no change to the UI.
- My Favorites. A favourited copy stays visible there.
