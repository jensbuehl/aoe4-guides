# Research: Sign in with Google

**Feature**: 032-google-sign-in | **Date**: 2026-08-11

Ten decisions. Two of them (R-3, R-6) are the ones that decide whether this
feature is a day's work or a week's, and both turn on the same question: *how
does the system know an account is finished?*

---

## R-1 — Popup, not redirect

**Decision**: `signInWithPopup(auth, new GoogleAuthProvider())`. No
`signInWithRedirect` anywhere in the feature.

**Rationale**: `signInWithRedirect` hands the browser off to
`<authDomain>/__/auth/handler` and comes back needing to read state it stored on
that other origin. Browsers that partition or block third-party storage — Safari,
Firefox, Brave by default, and Chrome heading the same way — break that return
trip. Firebase's own answer is to *self-host* the auth handler by reverse-proxying
`/__/auth/**` from `aoe4guides.com` to the Firebase domain, which for a Netlify
site means new redirect rules, a second place where auth configuration lives, and
a class of failure that only shows up in production. Popup needs none of it: the
opener keeps the session, the user never leaves the page they were reading, and
the return path is a `postMessage` on one origin.

**Cost accepted**: popups are blocked or silently unavailable in the in-app
browsers of Discord, Reddit and similar — a real slice of this site's traffic.
That cost is what US4 exists to pay: the email form stays, and the failure is
explained. Buying the in-app browser case with redirect would cost the cookie
case instead, and the cookie case is larger and getting larger.

**Alternatives considered**: redirect with a self-hosted handler (rejected —
infrastructure work and a production-only failure mode, against Principle I);
redirect as an automatic fallback when the popup is blocked (rejected — it
inherits the cookie problem exactly where things are already going wrong, so the
fallback would fail second; a plain message pointing at the form is honest and
works).

---

## R-2 — `signInWithPopup` must be triggered by the user's own click

**Decision**: call `signInWithPopup` **synchronously inside the click handler**.
No `await` of anything before it — no App Check token fetch, no profile read, no
store round-trip.

**Rationale**: browsers only allow a popup while a user gesture is still being
handled. Any `await` before the call ends the gesture and the popup is blocked —
producing exactly the "button does nothing" failure US4 §1 forbids, and producing
it *for everyone*, not just in-app browsers. This is the single most likely way to
implement this feature and have it fail in a way that is hard to explain
afterwards, because it works in the dev tab where popups are permissive.

**Consequence for the design**: the store action cannot do preparatory async work.
Everything that has to happen *before* Google opens must already have happened;
everything else happens after the promise resolves. This is why the display-name
step is placed **after** the popup (R-5) rather than before it.

---

## R-3 — What happens when the address already has an account

**Decision**: handle **both** documented outcomes explicitly, and **verify which
one this project actually produces before writing the branch**.

Firebase's "one account per email address" setting (the default, and what this
project uses — R-9) makes two different things happen depending on the existing
account:

| Existing account | Documented Firebase behaviour | What the user must be told |
|---|---|---|
| Password, email **unverified** | Google is treated as authoritative. The uid survives; the **password provider is removed**. Sign-in succeeds. | "This address now signs in with Google — your old password no longer works." (FR-010) |
| Password, email **verified** | `signInWithPopup` rejects with `auth/account-exists-with-different-credential`. | Back to the log-in form, address filled in, reset path offered. (FR-011) |

**Rationale for verifying first**: the unverified branch is a *silent provider
swap on a live account* — the highest-consequence path in the feature, and the
one nobody would notice going wrong until a user writes in saying their password
stopped working. It is also behaviour the client cannot control, only react to.
The plan therefore puts a fifteen-minute empirical check ahead of the code
(quickstart §0): create two throwaway accounts, one verified and one not, and
sign into each with Google. Whatever the console actually does is what gets
built against.

**Regardless of the outcome**, the code must catch
`auth/account-exists-with-different-credential` and route it to FR-011, because
that error is reachable however the setting is configured.

### Observed — Run 1, unverified account, dev project, 2026-08-11

Console settings at the time: provider enabled, authorised domains set, account
linking on "link accounts that use the same email".

| Question | Observed |
|---|---|
| Succeeded or threw? | **Succeeded.** No error, straight into a session |
| Password afterwards? | **Rejected.** "Incorrect email or password" |
| Display-name prompt? | **Appeared** — which the design did not predict |
| One account or two? | **One.** The single row's provider changed from email to Google in place |

The first three match the prediction, and the fourth settles the question that
mattered most: **the uid survives**. Firebase converts the existing record rather
than creating a second one, so builds, favourites and the contributor entry stay
attached to their owner. The unverified branch is a convenience, not data loss,
and US2 §1 is satisfied by Firebase's own behaviour.

So FR-010's message is genuinely needed — the swap is silent and the password
dies with it — and FR-011a's refusal to implement linking costs nothing here,
because Firebase does this particular join itself.

**The display-name prompt was our bug, not Firebase's.** `users/{uid}` did hold a
`displayName` throughout; the completeness test never read it, because the Vuex
profile cache still held the `null` from before the onCreate trigger ran and
sign-out had not cleared it. Cause and fix are written up under R-6. Nothing
about the swap itself is implicated.

### Observed — Run 2, verified account, dev project, 2026-08-11

| Question | Observed |
|---|---|
| Succeeded or threw? | **Succeeded.** No error at all |
| Password afterwards? | **Still works** |
| `providerData` | **Both** — the account page reads "Google, or email and password" |
| Display-name prompt? | Correctly absent — `users/{uid}.displayName` was present |
| Display name | **Overwritten with the Google profile name** on the auth record |

### What the two runs mean together

Firebase **always links** a Google sign-in onto a matching address, because
Google's email is provider-verified. It never throws
`auth/account-exists-with-different-credential` under this configuration. The uid
survives in both cases. The only thing that varies is the password:

| Existing account | Result |
|---|---|
| Email **unverified** | Google linked, **password provider removed**. One provider afterwards |
| Email **verified** | Google linked, **password kept**. Two providers afterwards |

**This overturns the plan's prediction and two requirements.** FR-011's
"send them back to the log-in form" describes a path that cannot be reached for
Google, and US2 §2 and §3 describe an error the user will never see. The catch in
T019 stays as a defensive net — the error is still theoretically reachable if the
console setting changes — but it is not the verified-collision behaviour.

The consolation is that the behaviour Firebase chose is the one the owner was
told this feature would *not* build: it joins the two sign-in methods itself,
safely, for free. FR-011a's refusal to implement linking costs nothing.

### The display-name overwrite — the real defect Run 2 found

Linking overwrites the auth record's `displayName` with the Google profile name.
Firestore is untouched, so `users/{uid}` and `contributors/{uid}` keep the name
the user chose, and the account goes split-brained: the header and account page
read the auth record (real name), published builds read the contributor entry
(chosen name), and the **next** build published would be stamped with the real
name, because `BuildEditor` copies `user.displayName` into `build.author` at
creation.

This is the same privacy leak the removed pre-fill caused (FR-007d), arriving
through a door nobody was watching — and unlike the pre-fill, no user action
invites it.

**Fix**: `users/{uid}.displayName` is already the authoritative record of what the
user chose, so `checkProfileComplete` compares it against the auth record and
pushes the chosen name back when they differ. One callable round trip, only on
the sign-in where the overwrite happened.

### What this leaves for T020

There is now a usable tell for the unverified swap — the account has a Firestore
`displayName` (so it pre-existed) but **no password provider** — except that an
ordinary returning Google user looks identical. Distinguishing them still needs a
marker recording that we have seen a Google sign-in on this account before. That
remains the open decision, and it is the one schema addition this feature would
make.

**Explicitly not done**: `linkWithCredential`. The owner decided the verified
collision sends the user back to the password form, with the deliberate
**Connect your Google account** control in settings as a named follow-up. That
keeps a security-sensitive linking flow out of a feature whose main job is a
button — Principle I, and Principle V, since account linking is the part of this
territory where mistakes join two people's data rather than one person's.

---

## R-4 — `fetchSignInMethodsForEmail` is not the way to detect the collision

**Decision**: detect the collision from the **thrown error**, not by asking in
advance.

**Rationale**: two reasons, and the second is the binding one. Firebase has been
deliberately closing down `fetchSignInMethodsForEmail` because it is an account
enumeration oracle — anyone can type an address and learn whether it is
registered — and with Email Enumeration Protection enabled it stops returning
useful answers at all. Beyond that, asking in advance means an `await` before the
popup, which R-2 forbids outright.

**Consequence**: the error path is not an edge case bolted on afterwards; it *is*
the collision detection. `useAuthErrors.js` grows the two new codes, and the
dialog reads them.

**Alternatives considered**: a callable Cloud Function that looks the address up
with the Admin SDK (rejected — same enumeration oracle, now with our name on it,
and it still costs an await before the popup).

---

## R-5 — The display name step is a third state of the existing dialog

**Decision**: `AuthDialog` gains a fourth mode — `"complete-profile"` — beside
`login`, `register` and `reset`. One field, pre-filled from Google's name, the
same `displayNameRules` the register form already uses.

**Rationale**: the dialog is already the single auth surface in the app —
`/login` and `/register` are three-line shims that open it and redirect to `/`
([Login.vue](../../../src/views/account/Login.vue)). A second dialog component
would duplicate its title/subtitle/error/submit scaffolding for one text field,
against Principle III. A route would need a guard of its own and would break the
"never leave the page you were reading" promise that R-1 just bought.

**One thing must change about the dialog**: it is currently
`:persistent="false"`, so a click on the backdrop closes it. In this mode that
would strand an authenticated user with an unfinished account. The mode must
make the dialog persistent and hide the close button — the only mode that does.

**This does not fully solve abandonment.** A persistent dialog stops a stray
click; it does not stop a closed tab, a dead battery or a lost connection. That
is R-6's job.

---

## R-6 — "Is this account finished?" is answered by a read that already happens

**Decision**: an account is **incomplete** when it has a Google sign-in method and
its `users/{uid}` document has no `displayName`. Check it on every sign-in, in
the `onAuthStateChanged` handler, and open the `complete-profile` mode when it is
true.

**Rationale**: this is the finding the design turns on, and it took discarding two
plausible alternatives to reach.

- *`getAdditionalUserInfo(result).isNewUser`* is only available on the sign-in
  result. Come back tomorrow after abandoning the step and it reads `false`,
  while the account is still unfinished. It answers "did this session create the
  account", which is not the question.
- *An empty `auth.currentUser.displayName`* looks like the durable signal but
  never fires: Firebase copies the Google profile name onto the auth record at
  creation, so it is populated from the first millisecond. Testing it would mean
  the step never appears at all.

What is left is our own record. `users/{uid}.displayName` is written **only** by
the `updateUserDisplayName` callable — the auth `onCreate` trigger writes just
`email` and `id` ([createUser.js](../../../functions/users/createUser.js)). So
its presence means exactly "this person chose a name through our flow", which is
precisely the question.

**And it is free.** `onAuthStateChanged` already dispatches `loadUserAvatar`,
which already reads `users/{uid}` through `getCachedUserProfile`
([store/index.js:376](../../../src/store/index.js)). The completeness test reads a
second field off a document already in hand — no additional Firestore read, on a
project that pays for 4M reads a month (Principle IV).

**The cache this rides on outlives the session, and that bit us.** Riding the
existing profile read is right, but `getCachedUserProfile` returns
`state.cache.userProfiles[uid]` whenever the key is *present* — and signing out
did not clear it. Registering with a password reads `users/{uid}` before the
`createUser` onCreate trigger has written it, so `null` gets cached; the callable
then writes the display name straight to Firestore, which the cache never sees.
Signing back in with Google in the same page session read that stale `null` and
asked an already-named user to name themselves again. Observed live, 2026-08-11.

The mirror case is the dangerous one: a stale *populated* profile would skip the
prompt and leave a nameless author, which FR-007b exists to forbid. So the fix
belongs at sign-out — a per-user cache must not outlive its user — rather than in
the completeness test, which keeps the zero-extra-read property intact.

**The provider clause is not optional.** Long-standing password accounts predate
the `createUser` function and may have no `users/{uid}` document at all — the
comment at [userService.js:10](../../../src/composables/data/userService.js) says
so in as many words. Testing `displayName` alone would ambush those users with a
name prompt they never asked for. Gating on
`providerData.some(p => p.providerId === "google.com")` excludes every one of
them, because no Google account exists on this site before this feature ships.

---

## R-7 — Account setup becomes one resumable function, called by both paths

**Decision**: extract `completeAccountSetup({ uid, displayName })` — the two
callables plus `createUserFavorites` — and call it from the Google path *and*
from the existing password `signup`. Make it safe to call twice.

**Rationale**: the current `signup` is a `.then()` chain
([store/index.js:237-265](../../../src/store/index.js)) with no retry and no
error surface for its middle: if `updateUserDisplayName` fails, the account
exists, the user is signed in, and nothing ever tries again. That was survivable
while the chain ran once at registration behind a verification wait. R-6 turns it
into something that runs whenever the account is found unfinished, which means it
must be idempotent — and once it is idempotent, the fragile path gets the same
repair for free.

All three operations already tolerate repetition: both callables use
`set(..., { merge: true })`, and `createUserFavorites` writes `{ favorites: [] }`
at a known doc id. The one thing to fix is that re-running it must not wipe a
favourites list that already exists — check before writing, or write with merge.

**Scope note**: this is a genuine extraction of a pattern that now appears twice,
not speculative abstraction (Principle I). It lands as its own commit before the
Google path is wired up, so the refactor is separable from the feature
(Principle II).

---

## R-8 — The Google mark is an asset, not an icon

**Decision**: `public/assets/google-g.svg`, rendered with `v-img` inside the
`v-btn`. **Not** `mdi-google`.

**Rationale**: Google's brand terms for sign-in buttons require their official
four-colour "G"; MDI's `mdi-google` is a monochrome approximation and is not the
sanctioned mark. The project already serves fixed images from `public/assets/`
and already renders them through `v-img` — civilisation flags do exactly this in
[AvatarPicker.vue:42](../../../src/components/account/AvatarPicker.vue). Reusing
that pattern beats inventing an inline-SVG one (Principle III).

**Trap avoided by this choice**: because no `mdi-*` name is introduced, the
`src/plugins/mdiIcons.js` allowlist needs no change. If anyone later reaches for
`mdi-google` anyway, it renders as *nothing* — green build, no error — until it
is added there. The `comm` check in `CLAUDE.md` catches it; run it regardless.

---

## R-9 — Firebase console work, and what it gates

**Decision**: three console changes, all done before any code is useful, all
recorded here because none of them live in the repository.

1. **Enable the Google provider** in Authentication → Sign-in method, with a
   support email set.
2. **Confirm the account-linking setting** is "One account per email address"
   (the default). This is what R-3 verifies empirically.
3. **Authorised domains** must include `aoe4guides.com`, the Netlify deploy-preview
   domain if previews are used for testing, and `localhost`.

**Rationale for calling it out**: the popup opens against `authDomain`
(`VITE_FIREBASE_AUTH_DOMAIN`), and an unauthorised origin fails with
`auth/unauthorized-domain` — a message that reads like a code bug and is not one.
Deploy previews get a fresh subdomain per PR, so a preview will fail this check
unless the wildcard is added; testing on `localhost` will not.

**App Check is unaffected.** The reCAPTCHA v3 provider in
[firebase/index.js:62](../../../src/firebase/index.js) attests Firestore and
Functions calls; it does not gate `signInWithPopup`. No change needed.

---

## R-10 — Re-authentication on delete, and a bug found underneath it

**Decision**: catch `auth/requires-recent-login` in `deleteAccount`. For a Google
account, re-prove with `reauthenticateWithPopup` and retry once. For a password
account, show a plain message asking them to sign out and back in — a full
in-place password re-auth dialog is out of scope and named as a follow-up.

**Rationale**: FR-015. Today the raw error reaches the snackbar as
`Could not delete account: auth/requires-recent-login`, which today's users
already see; Google users would hit it more often, since a popup session can be
old. The Google branch is cheap because the popup machinery is already being
built for sign-in.

**The bug found underneath.** `deleteAccount`
([store/index.js:322-345](../../../src/store/index.js)) deletes the auth user
**first**, then reads the user's favourites and decrements likes on each build:

```js
await deleteUser(auth.currentUser);   // request.auth becomes null
const favorites = await getUserFavorites(uid);   // rules: request.auth.uid == userId
```

After that first line `request.auth` is null, and both
`favorites/{userId}` and `builds/{build}` require an authenticated uid to read or
write ([firestore.rules:36-38](../../../firestore.rules)). The reads may still be
served from the offline cache, but the decrements cannot land. Likes almost
certainly survive their deleted owner today — and the `onDelete` Cloud Function
carries a matching `// TODO: Remove corresponding "favorites" document and adjust
upvotes, downvotes, likes` ([deleteUser.js:19](../../../functions/users/deleteUser.js)),
so nothing else is covering it either.

**Scoped in, minimally**: read the favourites and issue the decrements *before*
`deleteUser`, since we are editing this function for re-auth anyway. That is a
reordering, not a redesign. Doing the clean-up properly — server-side in the
`onDelete` trigger, where it belongs and where it cannot be abandoned halfway —
stays the TODO it already is, now with a note pointing here.

**And a second thing the same look turned up.** Nothing deletes the departing
user's **builds**, and nothing deletes their `contributors/{uid}` document.
`deleteBuild` exists ([buildService.js:500](../../../src/composables/data/buildService.js))
but is only ever called for a single build from the UI. Meanwhile the
confirmation dialog says *"Permanently delete your account and all your build
orders."*

**Decision (owner, 2026-08-11): keep the builds.** The community still uses them,
and anything sensitive gets removed by hand. So the code is already doing the
right thing and the *copy* is the defect — it promises a deletion that does not
happen and that nobody wants to happen. Fixing the sentence is scoped in (T034);
deleting builds is explicitly **not**.

**Left open, deliberately.** A kept build still carries its author's display name
and a live `contributors/{uid}` document behind the author page, so a deleted
account keeps a public presence. That may be exactly right for attribution and
exactly wrong for someone who asked to be erased. It is a data-retention question,
not an auth question, and it does not get answered by a rider on this feature.

---

## Verification approach

No test framework, per the project's workflow. What stands in for it:

- `npm run check:setup` after every `.vue` edit — a `ReferenceError` in `setup()`
  builds green and blanks the component at render.
- `npm run build` for template compilation.
- The `comm` icon check from `CLAUDE.md`, even though R-8 expects it to be a
  no-op — it costs nothing and the failure it catches is invisible.
- [quickstart.md](./quickstart.md) walked by hand, including the console
  pre-flight (§0) and at least one **real in-app browser** for US4. A desktop
  popup blocker is not a substitute; the in-app case fails differently.
- `check:steps` is not relevant — this feature never reads a build.
