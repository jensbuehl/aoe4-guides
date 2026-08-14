# Quickstart: Keeping the Funding Status Current

**Feature**: `036-community-funding-transparency` | **Date**: 2026-08-13

This is the whole operational cost of the feature. It is triggered by someone contributing
— not by a calendar — and takes minutes (SC-006).

---

## When someone contributes

1. Open the Ko-fi dashboard and find the contribution.
2. Open `src/config/supporters.js` and make **both** edits, together:

   ```js
   export const FUNDING = {
     year: 2026,
     costPerYearEur: 240,
     coveredEur: 89.60,   // ← was 85.40, add the net amount that landed
   };

   export const SUPPORTERS = [
     // ...
     { name: "Their Ko-fi name" },   // ← add them
   ];
   ```

   If they are already listed for this year, only the total changes — one person, one
   entry, however often they give.
3. Commit and push. Netlify deploys.

**The two edits are one action.** The supporter count comes from the list, so it can never
disagree with the names on the wall — but `coveredEur` is typed by hand and nothing
enforces that you typed it. Doing both in the same edit, prompted by the same event, is
what keeps them together. Never "I'll update the number later."

**No amount is recorded against any person.** Not even privately — this file ships to every
visitor's browser, so a per-person figure would be public the moment it was written down,
whether or not the page displayed it. The breakdown stays on Ko-fi, which already has it.
The repository holds one total and a list of names.

### You do not need a checkout for this

`src/config/supporters.js` is a short list. Edit it directly on github.com — from a phone
if you like — commit, and Netlify deploys. This is the convenience an admin screen would
have bought, without the per-page-view Firestore read that made an admin screen the wrong
answer (research R1).

### Falling behind is safe

The supporter count is derived from the list, so the number of people shown can never
disagree with the names on the wall. The total is typed, so it can be behind — but since
you change it in the same edit as the names, it goes stale only in the sense that both do,
together, until your next update. Batch a few contributions if it suits you; the risk is
lateness, not inconsistency.

**A one-off tip and a monthly membership are recorded identically.** The goal is a year, so
what matters is what arrived during it. There is no plan field, no rate to apply, and no
question about what a coffee is "worth" — it is worth what it was.

### Before publishing anyone's name

Ko-fi records each contribution as public or private. **Only publish names from public
contributions.** Someone who tipped privately gave you money, not permission to list them —
record them without a name:

```js
{ anonymous: true },
```

Their contribution still counts in the total and they still count towards the supporter
number; they simply do not appear on the wall. Do not write their name in a comment either
— the reason for leaving it out is that this file reaches the browser, and a name written
anywhere in it is readable by anyone who looks.

The same applies to anyone who asks not to be named.

### If someone volunteered their site username

Add their uid, which you can read from their account page or from one of their build
orders:

```js
{ name: "Their Ko-fi name", uid: "abc123..." },
```

They now get a badge next to their name across the site.

**Never chase anyone for this.** There is no way to map a Ko-fi identity to a site account,
and turning every new supporter into a conversation you have to start is exactly the cost
this design exists to avoid. If they mention it, link it. If they do not, they appear on
the wall like everyone else and nothing is missing.

---

## Seed data — the seventeen who have already contributed

Everyone who has bought a coffee to date. Two decisions before this goes in:

1. **Check each name's public/private flag on the Ko-fi dashboard** and drop the `name`
   for any private contribution.
2. **Split them by year.** Anyone who contributed during the current `FUNDING.year` goes in
   `SUPPORTERS`; everyone else goes in `EARLIER_SUPPORTERS`. Both are names alone. Then set
   `coveredEur` to the net total received from the `SUPPORTERS` group during this year —
   one figure, worked out once on the Ko-fi dashboard and never broken down in the file.

```
Elmstrukk        Björn          Yukgaejang     louis
CrackedyHere     hy             Somebody       znmto
Strateg          Andy           2WayPettingZoo acr
Clemens          Snoober        Respectthejeff Gothic_Brother
Beale
```

Two notes. `louis` may or may not be the "Louis" already credited in the code contributors
list on About — worth checking, since listing the same person twice under two spellings
reads as carelessness. And when someone already in `EARLIER_SUPPORTERS` contributes again,
move them into `SUPPORTERS` rather than listing them in both.

---

## Once a year

Roll over deliberately, when you are ready — not on 1 January because the date changed:

```js
export const FUNDING = {
  year: 2027,
  costPerYearEur: 240,
  coveredEur: 0,        // reset with the year
};
```

Then move everyone from `SUPPORTERS` into `EARLIER_SUPPORTERS`, and empty `SUPPORTERS`.
Update `costPerYearEur` if the hosting bill has moved. All of it is one edit.

The rollover is manual on purpose. An automatic one would empty the goal at midnight and
erase a year of visible progress with nobody having decided to — which looks like a bug and
feels like one.

---

## What you will never have to do

| Not this | Because |
|---|---|
| Update a supporter count | Derived from the list. |
| Record what any individual gave | Never stored — the breakdown lives on Ko-fi. |
| Recalculate anything on a schedule | The only edit is triggered by someone contributing. |
| Work out what a one-off tip is "worth" against a monthly target | The target is a year. It is worth what it was. |
| Ask a supporter who they are on the site | Opt-in only; the badge is the only thing lost. |
| Handle a webhook, a cancellation event or a failed charge | No payment integration exists. Ko-fi has no cancellation webhook anyway — see the spec's Assumptions. |
| Touch a Firestore rule or an admin screen | The list changes by commit; there is no client write path to guard. |

---

## Verification after changing the file

```sh
npm run check:setup      # required after touching any .vue file
npm run build
```

`npm run build` compiles templates but cannot catch a `ReferenceError` in `setup()`, which
throws at render and blanks the component behind a green build — hence `check:setup`.

Neither checks rendering. After a deploy, look at the footer on a phone-width window and
confirm the line names the year and reads correctly in whichever state you are in (empty,
partial, covered), and that it has not pushed the footer into horizontal overflow.
