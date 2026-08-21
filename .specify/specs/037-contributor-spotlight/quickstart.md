# Quickstart: Rotating the Contributor Spotlight

**Feature**: `037-contributor-spotlight`

The recurring routine, written for the version of you that has not looked at this for two months.

---

## Change who is in the spotlight

### 1. Find the uid

Open the person's author page and take the `author` query parameter:

```
https://aoe4guides.com/builds?author=zZqq3rZZJZdKPN5TFWBr6jNzJRS2
                                     └──────────── this ────────────┘
```

### 2. Edit one constant

`functions/builds/updateHomeSnapshot.js`, near the top:

```js
const FEATURED_CONTRIBUTOR = "zZqq3rZZJZdKPN5TFWBr6jNzJRS2";
```

Empty string means nobody, and the card disappears.

### 3. Commit

Say **who and why** in the message. This is the only record of the reasoning, and it is the reason
the nomination is a constant rather than a console-edited document.

```
feat(spotlight): feature Valdemar — 34 builds, most-read HRE author of the year
```

### 4. Deploy the function

**The push does not do this.** Netlify deploys the frontend only.

```sh
npm --prefix functions run deploy
```

### 5. Wait, or force it

The card changes at the next scheduled run — `0 */6 * * *`, so within six hours. To see it
immediately, run the function once from the Firebase console, then hard-reload the home page.

### 6. Check it

- Home page shows the new person, both themes, phone and desktop width.
- Their bio, if they have one, reads well at the card's width.
- The channel link, if any, opens their channel.

---

## Before featuring someone, read their bio

**This is the moderation step, and it is the only one.** There is no approval flag and no admin
queue. Curation is what keeps unreviewed text off the home page — see spec Context.

Their bio is on their author page. If it is not something you would put on the front page, either
pick someone else or talk to them first.

Telling the person they have been featured is a courtesy the site does not perform. Nothing shown is
private — the bio is theirs, published by them; the counts are already public — but a message is a
nice thing to send.

---

## While an event is running

The spotlight and the event banner share one slot and never both appear. The event wins.

`EventBanner` removes itself after the end date in `src/config/event.js`, and the spotlight takes the
slot on its own — no edit, no deploy. If you need the spotlight sooner, the honest move is to end the
event announcement, not to move the spotlight somewhere else.

---

## When someone asks to be removed

Set `FEATURED_CONTRIBUTOR = ""`, commit, deploy. Gone at the next run.

If they want their **bio** gone rather than the spotlight, that is theirs to edit on their account
page — you cannot do it for them, and the rules will refuse if you try.

---

## Things that will not work, and why

| Attempt | What happens |
|---|---|
| Editing the uid in `src/config/` | There is no such file. `functions/` is CommonJS and cannot import from `src/` — research R1. |
| Editing `home/home` in the console | Overwritten at the next scheduled run. |
| Featuring someone with no builds | Works, but the card shows zeroes. Nothing stops it; taste does. |
| Featuring a deleted account | The contributor document survives, so name and counts still render — but the bio and channel were cleared on deletion, by design. |
| Expecting the change straight after `git push` | The function is deployed by hand. Step 4. |

---

## Deploy matrix for this feature

| Change | How it reaches production |
|---|---|
| Anything in `src/` | `git push` → Netlify, automatic |
| `functions/**` | `npm --prefix functions run deploy`, **manual** |
| `firestore.rules` | `firebase deploy --only firestore:rules`, **manual** |

---

## Verifying a change to this feature

```sh
npm run build
npm run check:setup          # a ReferenceError in setup() blanks a component behind a green build
```

Icon allowlist — an icon missing from `src/plugins/mdiIcons.js` renders as *nothing*, with no error:

```sh
comm -23 <(grep -rhoE 'mdi-[a-z0-9-]+' src --include=*.vue --include=*.js | sort -u) \
         <(grep -oE '"mdi-[a-z0-9-]+"' src/plugins/mdiIcons.js | tr -d '"' | sort -u)
```

Should print only `mdi-svg` and `mdi-xxx`.

Then in a browser, because none of the above sees a pixel:

- Light and dark, phone and desktop width.
- Event banner live → no spotlight. Event banner expired → spotlight in its place.
- A contributor with no bio, no avatar and no channel → no empty blocks anywhere.
- A very long display name at phone width → no horizontal overflow.

And against the server, because a passing form proves nothing about the rules — from the console or
the emulator, directly:

| Write | Must |
|---|---|
| 181-character bio | be refused |
| 180-character bio | succeed |
| bio of 180 emoji | agree with what the form's counter said — see research R11 |
| `youtube` set to `https://youtube.com/@x` | be refused |
| `youtube` set to `@x` (too short) | be refused |
| `twitch` set to `https://twitch.tv/x` | be refused |
| `twitch` set to `abc` (too short) | be refused |
| `twitch` set to `aoe4togo` | succeed |
| `aoe4world` set to `2942077-VES-Valdy` | be refused |
| `aoe4world` set to `2942077` | succeed |
| another contributor's `bio` | be refused |
| `rank` on your own document | be refused |
