# Quickstart: verifying Unlisted Builds

## 1. The rule, in Node (no browser)

The module has no imports, so a harness in the scratchpad can import it by absolute path. It needs
no alias loader and doesn't have to live in the repo.

```js
// <scratchpad>/allowance.mjs
import { unlistedAllowance as a, unlistedLimitMessage as m, UNLISTED_CAP } from "file:///C:/Users/jensb/code/aoe4-guides/src/composables/builds/unlistedAllowance.js";
const cases = [[0,10],[1,10],[2,11],[30,25],[31,25],[79,49],[80,50],[500,50],[undefined,10],[null,10],[NaN,10],[-4,10],["12",10]];
for (const [i, want] of cases) if (a(i) !== want) throw new Error(`${i} → ${a(i)}, want ${want}`);
if (/publish.*more|unlock/i.test(m(UNLISTED_CAP))) throw new Error("cap message suggests unlocking");
if (!m(25).includes("25")) throw new Error("message omits allowance");
console.log("ok");
```

The `.js` file sits in a package without `"type": "module"`. Local Node (22.22) detects its ESM syntax
on its own. This harness never runs on Netlify, so the 22.1.0 caveat in `CLAUDE.md` doesn't apply.

## 2. Static checks

```sh
npm run build
npm run check:setup
# icons: must print only mdi-svg and mdi-xxx
comm -23 <(grep -rhoE 'mdi-[a-z0-9-]+' src --include=*.vue --include=*.js | sort -u) \
         <(grep -oE '"mdi-[a-z0-9-]+"' src/plugins/mdiIcons.js | tr -d '"' | sort -u)
grep -rn "mdi-pencil-circle" src     # nothing, once it's removed from the allowlist
grep -rniE ">[^<]*draft|'[^']*draft[^']*'|\`[^\`]*draft" src --include=*.vue | grep -viE "unsaved|restore"
```

The last grep should find no user-facing "draft" for the build state (SC-003).

## 3. Allowance, against `aoe4-guides-dev`

With an account on the dev project:

1. **0 published, 10 unlisted** → New build → *Save as unlisted* → refused. The message names 10 and
   the 1-per-2 rule.
2. Publish 2 builds → the same action succeeds (allowance 11).
3. Open a **published** build in the editor → *Save as unlisted* while at the allowance → refused
   (research R3). Open an **unlisted** build → *Save as unlisted* → always succeeds.
4. Turn off the network in DevTools before step 1's save: the save fails the way any offline save
   fails today. The allowance check doesn't throw an error of its own.

## 4. Search-engine signal

1. Open an unlisted build → `document.querySelector('meta[name=robots]')?.content` is `"noindex"`.
2. From its menu, *Publish* → the same query returns `undefined` with no reload (same-route reuse,
   research R4).
3. Open an unlisted build, then navigate to Home → no robots meta (removed on unmount).

## 5. Visual (ux-gate)

The badge renders with its icon (not blank) and doesn't wrap the card's meta line at 360 and 393 on
an Android user agent, in light and dark. Check the build page header badge at 960 too.
