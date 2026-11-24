# Quickstart: verifying 046

Run `npm run dev` (or a worktree build, which needs the gitignored `.env`).

## 1. Static checks

```sh
npm run build
npm run check:setup        # a ReferenceError in setup() blanks the component behind a green build
comm -23 <(grep -rhoE 'mdi-[a-z0-9-]+' src --include=*.vue --include=*.js | sort -u) \
         <(grep -oE '"mdi-[a-z0-9-]+"' src/plugins/mdiIcons.js | tr -d '"' | sort -u)
# expect only mdi-svg and mdi-xxx
```

## 2. Queries and indexes (DevTools → Network/Console)

- Open a long build and stay at the top. **No** `builds` list request appears (C1).
- Scroll to the end. Two list queries run. The console shows no `FAILED_PRECONDITION` or "requires an index" (research R2). A missing index would otherwise hide the rails silently.
- Read ceiling (SC-004): in the Firestore `Listen`/`runQuery` responses, the two queries return at most 4 and 7 documents. Equivalently, log `result.length` in `load()` once and remove the log.
- Click a rail card. The new build renders with **no** extra single-document read, served from the cache (C13).

## 3. Selection

Use builds you can find on prod:

| Case | Expect |
|---|---|
| Popular English build by a prolific author | Both rails, 3 cards each, no id twice across rails, current build absent |
| Author with exactly one public build | Civ rail only |
| Build with civ `ANY` | "More builds for any civilization", View all → the dashboard filtered to `ANY` (`civPageRoute`) |
| Unlisted build (open it by link) | Rails still show. No unlisted build in either rail |
| Author rail "View all" | `/builds` filtered to that author, by popularity. Its list = the rail's builds plus the current build and any the civ rail took, in score order |

## 4. App Check fallback

Block `content-firebaseappcheck.googleapis.com` in DevTools and reload. The civ rail still fills (public API). The author rail disappears without an error.

## 5. Visual (ux-gate skill)

At 360 and 393 (Android UA), and 960 and 1280, in light and dark:
- Skeleton → loaded: a full rail causes zero shift. A short or empty rail moves nothing above itself. Compare each element's top before and after.
- A long author name truncates on one line, in the header **and** in "View all by …".
- Refactor (before the feature): every existing section header (Description, Timeline, Build Order, Video, Comments, and the editor's two) and Home's "View all" are pixel-identical before and after the extraction.
- "View all" is full width below md and natural width from md up.
- The header matches the Video card's header (icon size, caption style, colour).
