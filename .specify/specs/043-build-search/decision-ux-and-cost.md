# Decision: Build Search — UX and index freshness

**For**: spec 043-build-search · **Date**: 2026-11-24 · **Status**: all decided 2026-11-24: Layout A,
D1 daily rebuild, Firebase Storage
**Visual version with mockups**: the "Build Search Decision" artifact.

## 1. What is fixed regardless of the choice

- One compact index of **listed builds only**: id, title, author, author id, civ, season, score.
  Measured against the 9 Nov snapshot (4,348 builds): **371 KB raw · 156 KB gzip · 130 KB brotli**.
- Downloaded only when search opens; every keystroke answered on the device.
- **The nightly Trending job (`updateBuildTrend`, 23:30 UTC) already reads every build** with a
  narrow `select()` including `title` and `isDraft`. Adding `author`, `authorUid`, `civ` and
  `season` produces the index at **zero additional read operations**.

## 2. UX: decided, Layout A

Header search on every page: a labelled pill from md up and a magnifier icon below. It opens an
overlay on desktop and a full-screen sheet on phones, with back closing the sheet. Results are
grouped as civ, author, builds. "/" and Ctrl+K open it.
B (field on All Builds) and C (A plus "See all" into B) are out of scope; C stays a possible
follow-up. Effort: medium.

## 3. Keeping unlisted builds out (spec 039)

| | D1 · Daily index in the Trending job | D2 · Daily snapshot + daily deploy | L · Weekly index + live check |
|---|---|---|---|
| Unlisting reaches everyone | ≤ 24 h | ≤ 24 h + deploy | At once for shown results |
| New builds findable | ≤ 24 h | ≤ 24 h | **up to 7 days** |
| Extra read ops | 0 | ~130k/month (full documents) | ~20 per search |
| Works where App Check fails | Yes | Yes | No: needs an /api fallback |

All three add an on-device hide list for the author's own unlist and delete actions.
**Recommendation: D1.**

## 4. Firebase Storage vs Netlify: measured 2026-11-24

The real choice is where the daily index is **served** from. D1 writes it from a Cloud Function, so
it naturally lands in Firebase Storage. D2 serves it from Netlify, which means producing it in
GitHub Actions and redeploying the site every day.

### What the accounts show

**Netlify** (`netlify api`, account `jens-buehl`):
- Plan **Starter (legacy)**, not credit-based: 300 build minutes and 100 GB bandwidth a month,
  `block_builds_when_usage_exceeded: true`.
- Build minutes are **shared by all four sites on the account**. Last period (23 Oct – 23 Nov),
  **215 of 300** were used:

  | Site | Deploys | Build time |
  |---|---|---|
  | versflow | 96 | 145 min |
  | aoe4guides-prod | 29 | 17 min |
  | exeofdoubt | 15 | 12 min |
  | notes2bring | 1 | 0.4 min |
  | **total** | 141 | 175 min exact · 235 if each is rounded up · **215 billed** |

- **An aoe4guides deploy takes 21–44 s (median 32 s) and bills about 0.6–1 minute.**
  The weekly snapshot refresh is already 4–5 of the 29 monthly deploys.
- Deploy count swings: 59 aoe4guides deploys in August, 5 in September, 24 in October.

**Firebase Storage** (`gcloud`, Firebase App Check API):
- Default bucket `aoe4-guides.firebasestorage.app` is in **US-EAST1**, one of the regions covered
  by Firebase Storage's no-cost allowance: **5 GB stored, 100 GB downloaded a month**. The only
  other tenant is avatars, at under 200 KB each.
- App Check enforcement on Storage: **UNENFORCED** (Firestore: ENFORCED). Blocked clients can
  therefore read the file, which satisfies FR-015 with no /api fallback.
- CORS already allows `GET` from `*`.

### Side by side

| | **Firebase Storage** (D1) | **Netlify static** (D2) |
|---|---|---|
| € per month at 1,000 opens/day | **€0.00** (4.7 GB of the 100 GB allowance) | €0.18 GCP (the Actions snapshot reads whole documents daily) + €0 Netlify |
| Point where it starts costing | ~21,000 opens/day, the 100 GB allowance | Build minutes, not bandwidth (next row) |
| Build minutes | none | **+30 deploys ≈ +18–30 min/month** on a shared pool already at 215/300 (72%), reaching 78–82% |
| What happens at the limit | Nothing; €0.11/GiB beyond 100 GB | **Builds are blocked on all four sites until the period resets**: no index refresh, which breaks 039's promise, and no hotfix deploys. A busy versflow month can cause it. |
| Commits to `main` | none | **A daily snapshot commit.** The weekly one already causes rejected pushes (memory: main gains weekly CI commits); daily makes a stale local `main` the normal state. |
| Freshness | Written at ~23:31 UTC, readable at once | Commit, then build (~1 min), then CDN; typically ~2–5 min after the Actions run |
| Failure mode | Function fails → yesterday's file stays (FR-010 for free) | Actions or build fails → yesterday's deploy stays, but a blocked build also blocks unrelated fixes |
| Latency from Europe | No CDN in front by default: ~100–150 ms more round trip to us-east1, ~0.3–0.6 s for 156 KB on 4G. Within SC-003's 1.5 s. A public object with `Cache-Control: public` gets Google's edge cache. | Netlify edge in Europe, brotli: faster |
| Index format vs app code | Decoupled: the file carries a format version, and the reader must accept old and new for one day | Atomic: index and reading code ship in one deploy |
| Side effect | none | Prerendered SEO pages refresh daily instead of weekly. That would also shorten 039's accepted stale-page window. |
| New moving parts | One `file.save()` in an existing job, plus one rule `allow read` on `search/` | A daily cron, a `seo-snapshot` commit, a Netlify build per day, and an index generator that must stay Node-22.1-safe on Netlify (CLAUDE.md) |

### Recommendation: Firebase Storage

1. **It is free at any volume we can foresee**, and the bucket's region qualifies for the
   allowance.
2. **Netlify's cost is not money but risk to a shared quota.** Adding 30 deploys pushes an
   account already at 72% to 78–82%, and the limit is shared with versflow, whose 96 deploys a
   month dominate it. When the limit is hit, every site stops deploying, including the fix you
   would need for whatever caused it. Netlify bills about 30 s of aoe4guides build as a whole
   minute or close to it, so daily deploys are the least efficient use of that pool.
3. **No daily commits to `main`.**
4. App Check is not enforced on Storage, so the "works where attestation fails" requirement is met
   without an /api fallback.

Netlify's real advantages are edge latency, atomic deploys and daily-fresh SEO pages. The latency
fits within the success criteria. The format version handles decoupling. Daily SEO freshness is
worth its own decision, but it should not depend on search.

**Revisit if**: opens approach ~15,000/day; the Netlify plan changes to one with plenty of build
minutes or no shared sites; or daily SEO refresh is wanted anyway, in which case the index could
ride along at no extra deploy cost.

## 5. Decisions requested

1. ~~UX~~: **A, decided 2026-11-24.**
2. ~~Freshness~~: **D1, decided 2026-11-24.**
3. ~~Delivery~~: **Firebase Storage, decided 2026-11-24.**
