# Feature Specification: Sign in with Google

**Feature Branch**: `032-google-sign-in`

**Created**: 2026-08-11

**Status**: Draft

**Input**: User description: "Spec it for me. I think having Google auth builds trust."

> **Scope guard:** this feature adds **one more way to get into an account** — a
> "Continue with Google" choice beside the form that already exists. Email and
> password stay, unchanged, as a first-class way in; nothing about this feature
> removes a path anyone uses today. It creates no second kind of user: an account
> reached through Google is the same account, with the same builds, favourites,
> likes and contributor page, as one reached with a password. What it does change
> is the **shape of the front door** — and one consequence downstream, because a
> Google account arrives with its email address already proven.

> **Why now:** the site's real gate is not the login screen, it is the email
> verification that follows it. A new author today must register, leave the site,
> find a mail, click a link, and come back before they may publish or import a
> single build. That detour sits between a visitor's enthusiasm and their first
> contribution, and it is where new contributors are lost. A Google account is
> already a proven address, so for those users the detour disappears entirely.
> Trust is the second argument and the one that prompted this: a stranger asked
> to invent a password for a hobby site weighs that differently from a stranger
> offered a sign-in they already recognise.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Join and publish in one sitting (Priority: P1) 🎯 MVP

A player finds a build order on the site, wants to publish their own variation,
and hits the sign-up prompt. Instead of inventing a password and then waiting on
an email, they choose **Continue with Google**, pick their account in the window
that opens, and land back on the page they were on — signed in, and immediately
allowed to write and publish. They never leave the site.

**Why this priority**: This is the whole feature. It is also the only slice that
delivers value on its own — every other story protects it rather than extends it.

**Independent Test**: With no session, open the sign-up prompt, choose Continue
with Google, complete the Google window, and publish a build in the same session
without opening an email client.

**Acceptance Scenarios**:

1. **Given** the sign-in prompt is open, **When** it renders, **Then** a
   **Continue with Google** choice is offered in both the log-in and the
   create-account states, visually separated from the email and password fields
   so it reads as an alternative rather than an extra step.
2. **Given** a visitor chooses Continue with Google, **When** they complete the
   Google window, **Then** they are signed in, the prompt closes, and any page
   they were being redirected to is opened — the same landing behaviour a
   password log-in has today.
3. **Given** a first-time Google user, **When** the sign-in completes, **Then**
   the system treats their address as **already confirmed** and never asks them
   to verify it, and never sends them a verification mail.
4. **Given** a first-time Google user, **When** the sign-in completes, **Then**
   they may immediately do everything a confirmed account may do — create,
   publish and import build orders — with no waiting state in between.
5. **Given** a **first-time** Google user, **When** Google has confirmed who they
   are, **Then** they are asked once to choose the display name their builds will
   carry — the same deliberate choice the create-account form asks for today. The
   field starts **empty**: the name Google supplied is never offered as a default,
   because it is a real name and the field feeds every build the user publishes.
6. **Given** the display name step, **When** a **returning** Google user signs
   in, **Then** it is not shown; it belongs to account creation, not to signing in.
7. **Given** a first-time Google user, **When** their account comes into being,
   **Then** it is set up exactly as a registered account is: it has the chosen
   display name, a contributor entry, and a favourites record, so nothing later
   in the site finds a half-made account.
8. **Given** a returning Google user, **When** they choose Continue with Google
   again, **Then** they are returned to the **same** account — same builds, same
   favourites, same likes, same contributor page.
9. **Given** a signed-in Google user, **When** they close the tab and come back,
   **Then** they are still signed in, exactly as a password user would be.

---

### User Story 2 - The account I already have is the account I get back (Priority: P1)

An author registered two years ago with an email address and a password — an
address that happens to be a Google address. Today they see the new button and
press it, because it is easier. They must arrive in **their own account**, with
their builds and their reputation, and they must be told plainly which way they
now sign in. What must never happen is a second, empty account under the same
address, or an unexplained error that leaves them locked out of their work.

> **Decided:** where the address is already confirmed, this feature sends the
> owner back to the password form rather than walking them through joining the
> two sign-in methods. That is the honest, simple answer (Constitution I) and it
> risks nothing. The friendlier version — a deliberate **Connect your Google
> account** control on the settings page, pressed by someone who is already
> signed in and therefore already proven — is a follow-up feature, where it costs
> a fraction of what it costs here.

**Why this priority**: Equal to Story 1 because this is not a nice-to-have — it
is the failure mode that turns a trust feature into a trust problem. A large part
of the existing user base signed up with Gmail addresses, and every one of them
is a candidate for pressing this button on day one. Shipping Story 1 without
Story 2 puts existing authors' work behind a confusing error.

**Independent Test**: Two runs, one per branch. With an **unconfirmed** existing
account, choose Continue with Google on its address and confirm the session holds
that account's builds and favourites, and that the change of sign-in method was
stated. With a **confirmed** one, do the same and confirm the person lands back on
the log-in form, address filled in, told why, with the reset path in reach — and
that no second account was created in either run.

**Acceptance Scenarios**:

1. **Given** an existing account whose address was **never confirmed**, **When**
   the owner signs in with Google using that address, **Then** they arrive in
   that same account with all of its content, and are told clearly that this
   address now signs in through Google and that their old password no longer
   applies.
2. **Given** an existing account whose address **was confirmed**, **When** the
   owner signs in with Google using that address, **Then** they are not left with
   a bare error: the prompt returns to log-in with their address already filled
   in, and says plainly that this address signs in with a password. Their work is
   one password away, not lost.
3. **Given** that same owner, **When** they are sent back to the password form,
   **Then** the forgotten-password path is offered alongside it, because someone
   who reached for Google is exactly the person who no longer remembers the
   password.
4. **Given** any collision between an existing account and a Google sign-in,
   **When** it is resolved, **Then** exactly **one** account exists for that
   address afterwards, holding all of the original builds, favourites and likes —
   no second, empty account is ever created for an address that already had one.
5. **Given** a user is already signed in, **When** a Google sign-in is attempted
   in the same browser, **Then** the outcome is unambiguous — they are not
   silently swapped into a different account without being told.

---

### User Story 3 - The account page tells the truth about how I sign in (Priority: P2)

A Google user opens their account settings. Today that page offers to change a
password — a password they never set and cannot use. It should instead say how
they sign in, and offer only the controls that mean something for them.

**Why this priority**: Not required for a first sign-in to work, but the page is
actively misleading the moment Story 1 ships, and a control that fails when
pressed is worse than no control. It is P2 only because it affects users after
they have already been won.

**Independent Test**: Sign in with Google, open account settings, and confirm the
page names Google as the sign-in method, offers no password change, and that
every control still shown works when pressed.

**Acceptance Scenarios**:

1. **Given** an account that signs in through Google only, **When** the account
   page is opened, **Then** it states that this account signs in with Google and
   does not offer to set or change a password.
2. **Given** an account that signs in with a password, **When** the account page
   is opened, **Then** it behaves exactly as it does today — nothing about this
   feature changes that page for existing password users.
3. **Given** an account that signs in through Google, **When** the owner deletes
   their account, **Then** deletion completes: the account is removed and their
   likes are withdrawn from the builds they had favourited, as for any account.
3a. **Given** any account is deleted, **When** the owner is asked to confirm,
   **Then** the confirmation says truthfully what will happen — the account goes,
   the **build orders stay published**. Keeping them is deliberate (see the
   assumption below); promising otherwise is the bug.
4. **Given** deletion requires the owner to prove who they are again, **When**
   they are asked, **Then** they are asked in the way that matches how they sign
   in, and told why — never shown a raw failure.
5. **Given** an account that signs in through Google, **When** the confirmation
   state is shown anywhere on the page, **Then** it reads as confirmed, because
   it is.

---

### User Story 4 - When the Google window cannot open (Priority: P2)

A player follows a link from a Discord message or the Reddit app. These open the
site inside their own in-app browser, where a sign-in window may be blocked or
refuse to appear. The person must not be stranded: the email and password form is
still right there, and they must be told what happened rather than watching a
button do nothing.

**Why this priority**: A large share of this site's traffic arrives from exactly
those apps, so this is not a rare edge. It is P2 rather than P1 only because the
fallback path — the existing form — is already built; what is missing is telling
the user to use it.

**Independent Test**: Force the Google window to fail to open, or dismiss it, and
confirm the person is left signed out with a plain explanation and a working form.

**Acceptance Scenarios**:

1. **Given** the Google window is blocked from opening, **When** the user chooses
   Continue with Google, **Then** they are told in plain language that the
   sign-in window could not open and that they can use email and password
   instead; the form remains filled in and usable.
2. **Given** the user closes the Google window themselves, **When** it closes,
   **Then** nothing is treated as an error — no alarming message, no lost form
   state, and they may try again or use the form.
3. **Given** the network fails midway through a Google sign-in, **When** it
   fails, **Then** the person stays signed out with an explanation, and the site
   is left in a consistent state — no half-made account.
4. **Given** any Google sign-in failure, **When** it is reported, **Then** the
   message is written for a player, not a developer — no raw error codes.

---

### Edge Cases

- **A Google account with no display name at all.** The step that asks for one
  then has nothing to pre-fill, and must still end with a usable name rather than
  an empty field the user can walk past.
- **Someone abandons the display name step.** They are authenticated by Google but
  the account is not yet complete: they close the tab, or hit the back button, or
  their connection drops. This is the price of asking, and it must not leave a
  nameless author in the Top Contributors list or on a published build.
- **Someone answers the display name step, twice, on two devices at once.** The
  last answer wins, but only one contributor entry may exist.
- **An address that is confirmed, whose owner has forgotten the password.** They
  reached for Google precisely because they no longer remember it; being sent back
  to a form without the reset path visible is a dead end.
- **The same person, two front doors.** Signing in with Google on one device and
  with a password on another must land in one account, not two.
- **An unconfirmed password account overtaken by Google.** The owner keeps their
  work but silently loses the password they may have stored in a manager — they
  must be told, or their next password attempt is a mystery failure.
- **Deletion and re-entry.** A deleted Google account that signs in again is a new
  account, and must be set up as completely as any other first-time account.
- **The Google profile picture.** The site already has its own avatar system
  (civilisation flags and uploads). Adopting a Google photo silently would both
  surprise the user and bypass that system.
- **The address behind a Google account changes.** Records that stored the address
  at sign-up may drift out of step with the account.
- **Confirmation reminders.** Prompts and banners that nag unconfirmed users must
  never appear for a Google user, who has nothing to confirm.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The sign-in prompt MUST offer signing in with Google in both its
  log-in and create-account states, presented as an alternative to the form
  rather than a step within it.
- **FR-002**: Email-and-password sign-in and registration MUST remain fully
  available and unchanged for everyone; Google MUST NOT become the only way in.
- **FR-003**: A successful Google sign-in MUST leave the user in the same state a
  successful password sign-in leaves them: signed in, prompt closed, redirected
  to wherever they were headed.
- **FR-004**: An account created through Google MUST be treated as having a
  confirmed email address, and MUST never be sent a confirmation mail or shown a
  confirmation prompt, banner or warning.
- **FR-005**: An account created through Google MUST be able to create, publish
  and import build orders from its first moment, with no intermediate waiting
  state.
- **FR-006**: A first-time Google sign-in MUST complete the same account set-up a
  registration completes today — display name recorded everywhere a display name
  is read, contributor entry created, favourites record created — before the user
  is treated as fully signed in.
- **FR-007**: A first-time Google sign-in MUST ask the new user to choose their
  display name before the account is treated as complete, and MUST hold that name
  to the same rules the create-account form applies today.
- **FR-007d**: The display name field MUST NOT be pre-filled with the name Google
  supplied, and that name MUST NOT reach the account, the contributor entry, or
  any published build unless the user types it themselves. A pre-filled real name
  is one unnoticed keystroke away from being published, which is the privacy
  surprise this whole step exists to prevent.
- **FR-007a**: The display name step MUST NOT be shown to a returning Google user.
- **FR-007b**: If a first-time user abandons the display name step, the site MUST
  NOT be left showing a nameless author anywhere public: either the account is
  not completed, or the person is asked again the next time they sign in, before
  they can publish.
- **FR-007c**: Every account, however created, MUST have a non-empty display name
  wherever a contributor is shown.
- **FR-008**: The system MUST NOT create a second account for an email address
  that already has one; after any Google sign-in, exactly one account MUST exist
  per address.
- **FR-009**: When a Google sign-in resolves into an existing account, that
  account's builds, favourites, likes, contributor entry and display name MUST be
  preserved intact.
- **FR-010**: ~~When signing in with Google causes an existing password to stop
  working, the owner MUST be told so in plain language at that moment.~~
  **Not implemented — decided 2026-08-11.** Live testing showed a swapped account
  is indistinguishable from an ordinary returning Google user (same account, one
  Google sign-in method, a name already chosen), so the message would need a
  stored marker — this feature's only schema addition. It would fire once, for
  existing owners with an unconfirmed address who choose Google, and the password
  reset path restores access whether or not they were told. The requirement stands
  as written and is knowingly unmet; the cost was judged larger than the courtesy.
- **FR-011**: When a Google sign-in cannot proceed because the address already has
  a confirmed password sign-in, the system MUST return the user to the log-in form
  with their address filled in, state plainly that this address signs in with a
  password, and offer the forgotten-password path — never an error alone.
- **FR-011a**: Joining a Google sign-in to an existing password account is **out
  of scope** for this feature; no flow in it may attach a second sign-in method
  to an account whose address is already confirmed.
- **FR-012**: The account settings page MUST NOT offer to change a password for an
  account that has no password sign-in.
- **FR-013**: The account settings page MUST state which sign-in method the
  account uses.
- **FR-014**: Deleting an account MUST work for Google accounts, performing the
  same clean-up (removing the account and withdrawing its likes) as it does today.
- **FR-015**: Where an action requires the owner to prove their identity again,
  the system MUST ask in the way that matches their sign-in method and explain
  why, rather than surfacing a failure.
- **FR-016**: Every failure of a Google sign-in — blocked window, cancelled by the
  user, network loss, refusal by the provider — MUST leave the user signed out,
  with the form usable, and MUST be explained in language written for a player.
- **FR-017**: A user cancelling the Google window MUST NOT be shown an error.
- **FR-018**: A failed Google sign-in MUST NOT leave behind a partially created
  account, a nameless contributor entry, or an orphaned favourites record.
- **FR-019**: The site MUST NOT adopt a Google profile picture as the user's
  avatar; avatars continue to be chosen through the existing avatar system, and a
  new Google user starts with the same default any new user gets.
- **FR-020**: Existing accounts and existing sessions MUST be unaffected by this
  change until their owner chooses to use Google; no migration is imposed on
  anyone.

### Key Entities *(include if data involved)*

- **Account**: one person's identity on the site. Holds the email address, a
  display name, a confirmation state, and — new with this feature — **one or more
  sign-in methods**. The account is the anchor for builds, favourites, likes and
  the contributor entry; none of those relationships change.
- **Sign-in method**: a way of proving ownership of an account — a password, or
  Google. An account may have one or both. This is the only genuinely new concept
  the feature introduces, and it exists so that "how you get in" can differ
  without "who you are" differing.
- **Contributor entry**: the public face of an account — display name and icon —
  read by author pages, build listings and the Top Contributors list. It must
  exist and be named for every account regardless of sign-in method.
- **Favourites record**: the per-account list of liked builds. Created at account
  creation today; must equally be created for accounts born through Google.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A brand-new visitor can go from signed-out to having published a
  build order **without leaving the site or opening an email client**, in under
  two minutes.
- **SC-002**: 100% of accounts created through Google are able to publish on
  their first session — none are held in a waiting-for-confirmation state.
- **SC-003**: 100% of accounts created through Google appear with a display name
  in every public place a contributor is shown; zero nameless authors.
- **SC-004**: Zero duplicate accounts are created for an address that already had
  one, and 100% of existing owners who press Continue with Google either land in
  their own account or are told, on that same screen, exactly how to reach it.
- **SC-005**: Zero users lose access to their work as a result of this change.
- **SC-006**: On every failure path, the user still has a working way to sign in
  and a message explaining what happened; no path ends in a raw error code or a
  button that appears to do nothing.
- **SC-007**: The share of newly created accounts that publish at least one build
  within seven days rises measurably against the pre-launch baseline — this is
  the number that says the verification detour was the obstacle.
- **SC-008**: Support and feedback messages about "I never got the confirmation
  email" fall, since the population that can hit that problem shrinks.
- **SC-009**: Of the people who complete the Google window as a first-time user,
  at least 90% also complete the display name step — if that number is low, the
  step is asking badly and the decision to ask should be revisited.

## Assumptions

- **Google is the only provider added.** No Facebook, Discord, Steam, Twitch or
  Apple sign-in is in scope, however plausible some of those are for this
  audience. Adding one provider proves the shape; a second is a later decision.
- **One account per email address.** The site continues to treat an email address
  as identifying one person. This is what makes collisions resolvable at all, and
  it is the existing behaviour.
- **The sign-in prompt is the only surface.** The `/login` and `/register`
  addresses are already thin redirects into that one prompt, so there is exactly
  one place to add the choice and no second design to keep in step.
- **Confirmation stays as the gate for password accounts.** This feature does not
  loosen the existing rule for anyone; it adds a population that satisfies it on
  arrival.
- **A sign-in window, not a page redirect.** Sign-in happens in a window the user
  returns from, keeping them on the site. This is also what keeps the flow working
  in browsers that restrict cross-site cookies — at the cost of the in-app browser
  case that Story 4 exists to cover.
- **Joining two sign-in methods is out of scope, deliberately.** The only case
  where an account ends up reachable both ways is the *unconfirmed* address in
  Story 2 §1, and that is the provider's own doing rather than something this
  feature builds. A **Connect your Google account** control on the settings page —
  pressed by someone already signed in, and therefore far cheaper to build safely
  — is the named follow-up feature this spec defers to.
- **Unlinking is out of scope.** Nobody can remove a sign-in method in this
  feature; the only ways out remain deleting the account or contacting the owner.
- **Deleting an account does not delete its build orders, on purpose.** The
  community still uses them, so they stay published; anything sensitive is removed
  by hand. Nothing in the code deletes them today either, so this decision changes
  no behaviour — it changes what the confirmation dialog is allowed to claim, which
  currently promises the opposite. Whether a deleted author's *name* should keep
  appearing on those builds is a real question this feature does not answer.
- **Avatars are untouched.** The existing avatar system — default, civilisation
  flag, or upload — is what a Google user gets and changes.
- **Comment notification preferences and unsubscribe handling** work off the
  account's address and are unaffected by how that account signs in.
- **No formal test suite is expected**, per the project's workflow; the golden
  paths in each story are to be walked manually before merging, including at least
  one real in-app browser for Story 4.
