# Quickstart: Fair Trending

How to verify each part, and how to run the switch. In delivery order (FR-023).

## 0. Prerequisites

- A Java runtime for the Firestore emulator (none on this machine as of 2026-11-07):
  `winget install EclipseAdoptium.Temurin.21.JDK`, then a new terminal. Without installing anything,
  a portable JRE works too: unzip
  `https://api.adoptium.net/v3/binary/latest/21/ga/windows/x64/jre/hotspot/normal/eclipse` somewhere
  outside the repo and put its `bin` first on `PATH` for the one command. In Git Bash that `PATH`
  entry must be in `/c/...` form; a `C:/...` entry is not found, and the emulator reports
  "Could not spawn `java -version`".
- `npm run test:rules` can point at another rules file with `RULES_FILE=path`, e.g. the deployed
  version, to see a new case fail against the hole it covers.
- `npm install` (adds `@firebase/rules-unit-testing`).

## 1. Rules (Story 1)

```sh
npm run test:rules
```

Runs every case in [contracts/firestore-rules.md](contracts/firestore-rules.md) against the emulator
under the throwaway project id `demo-aoe4-guides`. Expect all green. **Run it before every rules
deploy**, then:

```sh
npx firebase deploy --only firestore:rules --project dev    # aoe4-guides-dev first
npx firebase deploy --only firestore:rules --project prod
```

Manual fallback without Java, on `aoe4-guides-dev`: open a build page signed out and run in the
console `updateDoc(doc(db, "builds", id), { views: 1000000 })` (via the app's `db`) → expect
`permission-denied`; then like/unlike, vote, comment, edit and save, publish, delete — all succeed.

**Ship the client part (step 2) in the same release as the rules.** An editor save that still
sends counters is refused by the new rules the moment the build has gained a view.

## 2. Client (Stories 1 and 2)

```sh
npm run build && npm run check:setup && npm run check:steps
```

In a browser against dev (`npm run dev`):

1. Open a build, note its views, reload 20× → +1 (SC-002). Navigate to the list and back → still +1.
2. DevTools → Application → Local Storage → `aoe4guides.viewed` holds the id. Set its value to a
   timestamp 25 h ago, reload → +1.
3. Sign in as the author, open the build → +0, and the contributor's view total → +0.
4. Open the build in the editor; in another browser view it once; save the edit → the view survives.
5. Block site data for the origin, reload → the page renders; one view per page load.

## 3. Trending job — shadow week (Story 3)

Deploy with `TRENDING_SOURCE = "legacy"` in `functions/builds/trend.js`:

```sh
cd functions && npm run deploy
```

Force-run `updateBuildTrend` once from Cloud Scheduler (console → Cloud Scheduler →
`firebase-schedule-updateBuildTrend-…` → Force run) to seed. Expect in its log: every build seeded,
`trend` 0 everywhere, `score` untouched.

Daily for ≥ 7 days, read the job's `updateBuildTrend: comparison` log entry: top 8 by `trend` beside
the top 8 by `score` (SC-005).

## 4. The switch

1. Set `TRENDING_SOURCE = "recency"`, `cd functions && npm run deploy`.
2. Force-run `updateBuildTrend` → writes `score = ln(1 + trend)`.
3. Force-run `updateHomeSnapshot` → the home lane shows the new order now, not at the next 6 h tick.
4. Check: home Trending lane, build list sorted by Trending, one civ dashboard, and
   `GET <api>/builds?orderBy=score` all show the same order as the comparison log. (The API has
   no `limit` parameter; it always returns 10, and an unknown parameter fails with `ValidateError`.)

**Back out**: `"legacy"`, deploy, force-run `updateBuildScore`, then `updateHomeSnapshot`.

## 5. Afterwards

Once the new order has run for a few weeks without a reason to back out: delete `updateBuildScore`
(remove its export; `firebase deploy` asks to delete the function) and the `TRENDING_SOURCE` switch.
