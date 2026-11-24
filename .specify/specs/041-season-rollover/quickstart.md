# Quickstart: verifying Season Rollover

**Deadline**: Season 15 starts on 2026-12-01. If this has not reached production by the evening of
2026-11-30, add Season 15 by hand in the old shape, without `endDate`, and ship that alone. The feature
accepts the entry when it lands (spec FR-007).

## 1. Automated

```sh
npm run check:seasons   # every day 2026-09-01 … 2030-12-31, plus the pinned cases (research R9)
npm run check:setup     # BuildEditor.vue changed
npm run build
```

To confirm the check actually guards something, break it on purpose once and watch it fail. Give the
Season 14 entry `endDate: new Date(2026, 10, 25)`. Season 15 then starts on Nov 26 and runs to Feb 28,
so the check must fail the pinned "2026-12-01 starts Season 15" case. Then retitle Season 14 as
"Season 16": it must report non-consecutive titles. Revert both.

## 2. Browser, today's date

Run `npm run dev`, then:

- **New build** (`/builds/new`): Season shows **Season 14**.
- **Build list filter**: the newest option is Season 14, its tooltip reads "Sep 1 – Nov 30, 2026", and it is
  marked current. Season 13 reads "May 7 – Aug 31, 2026".
- **Import** an RTS Overlay file with no season: the editor shows Season 14.
- **Remix** a Season 12 build: it stays Season 12.

## 3. Browser, a faked date

Shift the clock before the app loads. This is a throwaway Puppeteer in the scratchpad (CLAUDE.md), never
added to the repo:

```js
await page.evaluateOnNewDocument((iso) => {
  const offset = new Date(iso) - Date.now();
  const RealDate = Date;
  globalThis.Date = class extends RealDate {
    constructor(...a) { super(...(a.length ? a : [RealDate.now() + offset])); }
    static now() { return RealDate.now() + offset; }
  };
}, "2026-12-01T09:00:00");
```

| Fake date | Expect |
|---|---|
| 2026-11-30 23:00 | default Season 14; Season 15 not listed |
| 2026-12-01 09:00 | default **Season 15**; listed as Winter 2026, "Dec 1, 2026 – Feb 28, 2027", current; Season 14 not current |
| 2027-03-01 09:00 | default Season 16 (Spring 2027); Season 15 ends Feb 28, 2027 |

Firestore reads are unaffected: filtering by Season 15 returns nothing until builds carry that label. That
is expected and needs no index, since `season in [...]` already exists.

## 4. After 2026-12-01 in production

- Open `/builds/new` on aoe4guides.com: Season 15, with no deploy since this feature shipped (SC-001).
- About a month later, the snapshot refresh shows the share of Season 15-period builds with an older label
  (SC-004). The target is ≤ 9%; Season 14 was 68%. In `data/seo-snapshot.ndjson`, count the builds whose
  `created` (Unix seconds) is on or after 2026-12-01, grouped by `season`.
