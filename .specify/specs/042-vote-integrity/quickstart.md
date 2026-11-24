# Quickstart: Vote Integrity (042)

## 1. The check — run it now, again in ≥ 7 days, and after deploy

Read-only; ~9.5k document reads per run. Needs a production service-account key.

```powershell
cd C:\Users\jensb\code\aoe4-guides
$env:GOOGLE_APPLICATION_CREDENTIALS = "C:\path\to\prod-sa.json"
node scripts/check-vote-gaps.mjs                 # takes a snapshot, compares with the latest earlier one
Remove-Item Env:GOOGLE_APPLICATION_CREDENTIALS
```

- The first line printed is the project; it must say `aoe4-guides`.
- Snapshots land in `scripts/.scratch/vote-gaps/` (gitignored). Never move them into `src/` or `public/`.
- Output sections: **growing gaps** (the finding — count rose faster than list holders since the
  previous snapshot), **drift** (gap shrank or went negative), **non-finite counts**, **list lengths**.
- Run 1 is the baseline. Run 2, at least 7 days later and *before the rules deploy*, answers "has
  anyone done this already?" Run 3, some days after the rules deploy, must show no growing gap (SC-003).

## 2. Rules tests (needs Java — see the project memory on the portable JRE)

```bash
npm run test:rules
```

Case-first, per CLAUDE.md: for each refused case in `contracts/firestore-rules.md`, run it against a
copy of the deployed rules first and see it fail:

```bash
git show main:firestore.rules > /tmp/deployed.rules   # or the scratchpad
RULES_FILE=/tmp/deployed.rules npm run test:rules     # X1–X13, X15 must FAIL here
npm run test:rules                                    # and pass here
```

## 3. Local checks after touching the app

```bash
npm run build
npm run check:setup        # .vue setup() ReferenceErrors a green build cannot catch
npm run check:steps        # only if anything that reads a build changed
```

Icon check (CLAUDE.md): `mdi-thumb-down*` will no longer be used; nothing new is added.

The in-memory list logic (`applyListConfig`) gets a throwaway harness at the repo root driven with the
alias loader from CLAUDE.md: same filters and sorts as a real list, compared against a Firestore query
on the dev project for a handful of configs. Delete harness and loader afterwards.

## 4. Deploy order

1. **Baseline check** (§1, run 1).
2. **App**: batched writes, My Favorites by id, no 30 cap, no thumbs-down. The new writes are accepted
   by the *current* rules, so this can ship first. Netlify deploys on push to `main`.
3. **Comparison check** (§1, run 2), ≥ 7 days after step 1. Decide on any growing builds before going on.
4. **Rules**: `firebase deploy --only firestore:rules --project aoe4-guides`.
5. **Functions** (weights + baseline re-take): from `functions/`, `npm run deploy`. Then, in Cloud
   Scheduler, force-run `updateBuildAllTimeScore`, then `updateHomeSnapshot`. `updateBuildTrend` runs
   at 23:30 UTC; its first run logs `rebased` for every build and adds nothing to any trend.
6. **Post-deploy check** (§1, run 3) a few days later.

## 5. Verifying in the browser (what the build cannot show)

- Like and unlike a build on a phone-width and a desktop-width window: the count moves by one, the
  heart and the count stay in step in both layouts, reload shows the same state.
- Go offline (DevTools) and tap the heart: it does not stick, a message says why.
- As an unverified account: liking asks for verification; removing an old like works.
- My Favorites with > 30 favourites (dev project): all pages reachable; filter by two seasons and two
  maps; every sort option orders as the Builds list does.
- No thumbs-down anywhere.
