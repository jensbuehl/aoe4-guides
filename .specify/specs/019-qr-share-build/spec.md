# Feature Specification: Share a Build — QR Handoff and Native Share

**Feature Branch**: `019-qr-share-build`

**Created**: 2026-07-31

**Status**: Draft

**Input**: User description: "QR code on build details. Problem: You play on PC. You want the build on your phone in focus mode (see #1). Today that means typing a URL or emailing yourself a link. How: A small QR of window.location.href in a share menu on BuildDetails.vue. Pure client-side — qrcode renders to canvas in ~20KB gzipped, lazily imported so it doesn't touch your initial bundle. Why it's better than it sounds: it composes with #1 into an actual workflow — browse on PC, scan, phone stays awake running focus mode next to your monitor. Neither half is worth much alone. Bonus for near-zero extra cost: put the same share menu behind the Web Share API on mobile (navigator.share) so the phone can pass it to Discord, where most build sharing actually happens. Effort: an hour or two."

## Context: Why This Feature Exists

A build order on this site is consumed in two very different postures:

- **Browsing** — comparing builds, reading the description, watching the video. Comfortable on a big screen.
- **Following along mid-match** — one step at a time, hands on mouse and keyboard. Only workable on a second screen, which for almost every player means their phone.

Feature 018 made the second posture survivable by keeping the phone's screen lit throughout a follow-along session. But there is no bridge between the two postures. A player who finds a build on their PC and wants it on their phone has to retype an address by hand or mail themselves a link — friction large enough that most players simply do not do it, which means the follow-along work goes unused.

This feature is that bridge. It is deliberately small and it is deliberately paired: the handoff is only worth building because follow-along mode is waiting on the other side of it, and follow-along mode is only worth having if getting to it takes seconds.

A second, near-free outcome comes with the same entry point: build sharing between players today happens overwhelmingly in chat applications such as Discord, and on a phone the operating system already knows how to put a link there. Exposing the same share affordance to that mechanism costs almost nothing beyond what the handoff already requires.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Move a build from the PC to the phone by scanning (Priority: P1)

A player is at their desk, has found the build order they want to run this game, and wants it on the phone propped against their monitor. They open the share affordance on the build page, a scannable code appears on screen, they point their phone camera at it, tap the notification, and the build opens on the phone already in follow-along mode. They never type a character.

**Why this priority**: This is the entire reason the feature exists, and it is the half that unlocks the value of the already-shipped follow-along work. Everything else in this specification is an inexpensive addition riding on the same entry point.

**Independent Test**: On a desktop browser, open a build's share affordance, scan the displayed code with a phone camera, and confirm the phone lands on the correct build in follow-along mode. Delivers the complete PC-to-phone workflow on its own.

**Acceptance Scenarios**:

1. **Given** a player is viewing a build on a desktop browser, **When** they open the share affordance, **Then** a scannable code representing that specific build is displayed without the page navigating away or reloading.
2. **Given** the code is displayed, **When** the player scans it with a standard phone camera app, **Then** the phone offers to open a link that resolves to that same build.
3. **Given** the player follows the scanned link on the phone, **When** the build page loads, **Then** the build opens directly in follow-along mode without the player having to find and press a further control.
4. **Given** the phone has landed in follow-along mode via a scanned code, **When** the player leaves the phone untouched, **Then** the screen-awake behaviour specified in feature 018 applies exactly as it does when follow-along mode is opened by hand.
5. **Given** a player is viewing build A and closes the share affordance, **When** they move to build B and open the share affordance again, **Then** the code shown represents build B and not build A.
6. **Given** the share affordance is closed, **When** the player returns to reading the build, **Then** the page is in the same state as before they opened it — same scroll position, same expanded or collapsed sections, and no change to the browser's back history.

---

### User Story 2 - Pass a build to a chat application from the phone (Priority: P2)

A player is on their phone, has a build order open, and wants to drop it into their clan's chat channel. They open the same share affordance and hand the link to the phone's own sharing mechanism, which offers every installed application that accepts links. They pick one and the link is posted.

**Why this priority**: P2 because it is a genuine convenience for the place build sharing actually happens, but the site is already usable without it — a determined player can copy the address bar. It rides on the entry point User Story 1 already pays for, which is the only reason it earns a place in this feature at all.

**Independent Test**: On a mobile browser, open a build's share affordance, invoke the device sharing mechanism, and confirm the correct build link reaches a chosen target application.

**Acceptance Scenarios**:

1. **Given** a player is viewing a build on a device whose browser can hand links to other applications, **When** they open the share affordance, **Then** an option to share via the device's own sharing mechanism is offered.
2. **Given** the player chooses that option, **When** the device's share sheet appears, **Then** it carries the build's link and a title identifying the build, so the receiving application shows something more useful than a bare address.
3. **Given** the device's share sheet is open, **When** the player dismisses it without choosing a target, **Then** nothing is shared, no error or warning is shown, and the build page is unchanged.
4. **Given** a browser that cannot hand links to other applications, **When** the player opens the share affordance, **Then** the device-sharing option is not offered and the remaining options still work.
5. **Given** a build is shared to another application, **When** the recipient opens the link, **Then** they land on the build page in normal reading mode — not forced into follow-along mode.

---

### Rejected scope: a "copy link" option

An earlier draft carried a third story — a copy-to-clipboard option as the "universal floor" so the share affordance was never a dead end. It was cut during planning, because the justification does not hold:

- **The build page's address already *is* the share link.** The share URL is the page's own address, so on desktop the browser's address bar is the copy button.
- **Native share sheets already offer "Copy".** On mobile — the only place the device-sharing path exists — copying is one of the targets the operating system provides for free.
- **The dialog cannot be empty without it.** The scannable code requires no browser capability at all, so FR-004 holds in every environment regardless.

The residual gap is a desktop browser without device sharing, where a player must use the address bar. That is judged an acceptable cost against carrying a permanently redundant option (Constitution I).

---

### Edge Cases

- **Build still loading, or not found**: the share affordance is not reachable until there is a build to share. A player who arrives at a non-existent build sees the existing not-found treatment with no share option.
- **Draft builds**: a draft is shareable, but the recipient may not be able to view it. Scanning a draft's code on a signed-out phone results in whatever the site already does for unauthorised access to a draft — this feature does not change access control and must not present a draft's link as though it will work for anyone.
- **Player never opens the share affordance**, which is the overwhelming majority of page views: nothing about producing the scannable code may be paid for by these players.
- **The code renderer fails to become available** (offline after initial load, blocked request, transient failure): the share affordance still opens, the other options still work, and the player is told the code is unavailable rather than being left staring at an empty box.
- **Dark and light presentation**: the code must remain scannable in both. A code rendered dark-on-dark, or without sufficient surrounding margin, is a silent failure — it looks fine and simply never scans.
- **Small phone screens**: on a narrow viewport the code must not overflow or push the other options out of reach. Scanning a code shown on the same phone is not a real use case; the code's job on mobile is to be scannable by a *second* device.
- **Camera at an angle or in poor light**: the code needs enough physical size and contrast on screen to be read from normal desk distance, not only from a few centimetres away.
- **Rapid open and close**: opening and closing the share affordance repeatedly must not leave stale content on screen, accumulate work, or degrade.
- **A build whose address is unusually long**: the code must remain scannable rather than becoming too dense to read.
- **Sharing mechanism refuses or errors** (permission denied, unsupported target, not a gesture-driven context): the failure is not surfaced as an error and the build page continues to work normally.

## Requirements *(mandatory)*

### Functional Requirements

#### Entry point

- **FR-001**: The build detail page MUST offer a way to share the build being viewed, reachable from the page's existing action controls on both the mobile and desktop layouts.
- **FR-002**: The share affordance MUST only be reachable once a build has successfully loaded, and MUST NOT be present on the build-not-found state.
- **FR-003**: Opening and closing the share affordance MUST NOT navigate, reload, alter the browser's back history, or disturb the state of the page beneath it.
- **FR-004**: The share affordance MUST present at least one working option in every supported environment, and MUST NOT present an option that cannot work in the current environment.

#### Scannable code

- **FR-005**: The share affordance MUST display a scannable code that encodes a link to the build currently being viewed.
- **FR-006**: The code MUST encode a link that opens the build **directly in follow-along mode**, so that a player who scans it arrives ready to follow the build rather than at a page they must then act on.
- **FR-007**: The code MUST always represent the build currently on screen, including after the player has moved between builds without a full page reload.
- **FR-008**: The code MUST be rendered with sufficient contrast and surrounding margin to be scanned by a standard phone camera from normal desk viewing distance, in both light and dark presentation.
- **FR-009**: The code MUST fit within the smallest supported viewport without overflowing or displacing the other share options.
- **FR-010**: If the capability to render the code cannot be obtained, the share affordance MUST remain usable, MUST still offer its other options, and MUST tell the player the code is unavailable rather than displaying an empty or broken area.

#### Handing the link to the device

- **FR-011**: Where the device can hand a link to other applications, the share affordance MUST offer that as an option, and MUST supply both the build's link and a title identifying the build.
- **FR-012**: Where the device cannot hand a link to other applications, that option MUST NOT be offered.
- **FR-013**: A player dismissing or cancelling the device's sharing mechanism MUST NOT produce an error, a warning, or any change to the build page.
- **FR-014**: A failure of the device's sharing mechanism MUST NOT surface to the player as an error and MUST NOT escape as an unhandled failure.

#### Which link is shared

> **FR-015 and FR-016 are retired.** They specified a copy-to-clipboard option that was cut during planning (see *Rejected scope* above). The numbers are left unused rather than reassigned, so that references to FR-017 and later in the plan, contracts, and tasks stay stable.

- **FR-017**: The link handed to the device's sharing mechanism MUST open the build in **normal reading mode**, because that link is destined for other people rather than for the sender's own second screen.
- **FR-018**: Every link produced by this feature MUST be a fully-qualified address that resolves correctly when opened on a different device with no prior site state.
- **FR-019**: This feature MUST NOT alter which builds a person is permitted to view. A shared link grants no access the recipient did not already have.

#### Cost and isolation

- **FR-020**: Players who never open the share affordance MUST NOT pay any loading cost for the ability to render the scannable code.
- **FR-021**: The feature MUST NOT introduce any server-side component, stored data, schema change, third-party network request, or per-use cost. Every link and code MUST be produced on the device.
- **FR-022**: No failure originating in this feature may prevent the build page, the build order itself, or follow-along mode from loading or operating.

### Non-Functional Requirements

- **NFR-001**: The build page's initial load MUST be unchanged for players who do not open the share affordance.
- **NFR-002**: The code MUST appear quickly enough after the share affordance is opened that the player is not left waiting on an empty area; if it cannot be shown immediately, the wait MUST be visibly acknowledged.
- **NFR-003**: The feature MUST NOT require the player to sign in, grant a permission, or make a choice before it becomes usable.
- **NFR-004**: The share affordance MUST be operable by keyboard, and the scannable code MUST carry a text alternative for assistive technology, since a code is meaningless to a screen reader.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A player at a desktop can get the build they are reading open and running in follow-along mode on their phone in under 15 seconds, without typing any part of an address by hand — down from the roughly 30–60 seconds of retyping an address or mailing oneself a link.
- **SC-002**: The displayed code is scanned successfully on the first attempt by a standard phone camera held at normal desk distance (approximately 40–60 cm), in both light and dark presentation, in at least 9 of 10 trials.
- **SC-003**: Scanning the code lands the player in follow-along mode on the correct build 100% of the time, with no intermediate steps beyond opening the scanned link.
- **SC-004**: A player on a phone can deliver a build link into a chat application in 3 interactions or fewer, starting from the build page.
- **SC-005**: A working share option is available in 100% of supported environments, including browsers without device sharing — the share affordance is never empty, because the scannable code depends on no browser capability.
- **SC-006**: Players who never open the share affordance see no measurable change in build-page load time.
- **SC-007**: Zero unhandled errors originate from this feature across environments with full support, partial support, and no support, including when the player cancels a share.
- **SC-008**: The feature adds no recurring cost: zero additional reads, writes, or third-party requests per share.

## Assumptions

### Decisions taken where the description left room

- **The scannable code targets follow-along mode; the copied and device-shared links do not.** This split is the central design decision of the feature and follows from who each link is for. A code shown on your own monitor exists to be scanned by your own phone standing next to it — the only reason to do that is to follow the build while playing, so sending it anywhere other than follow-along mode wastes the handoff. A link sent to a chat channel is for another person who has not chosen to play right now and would find themselves dropped into a full-screen follow-along surface without asking. The site already supports opening a build directly in follow-along mode via its address, so no new mechanism is needed for either half.
- **The share affordance lives with the build page's existing actions.** The build detail page already collects its per-build actions (edit, duplicate, export, download, open in overlay tool, delete) into one control present on both the mobile and desktop layouts. Sharing belongs there rather than as a competing new control.
- **The feature offers two options, not three.** A copy-link option was considered and cut; the reasoning is recorded under *Rejected scope* in the scenarios section.

### Scope boundaries

- **Build detail pages only.** Build lists, the dashboard, the editor, and profile pages are out of scope. Sharing a *list* of builds is a different feature with different questions.
- **Sharing a link, not content.** The feature shares an address. Exporting the build as an image, a file, or formatted text is out of scope — the page already has separate export and download actions.
- **No short links, no tracking, no analytics.** Links are the site's own plain addresses. No redirect service is introduced, no share event is recorded, and no per-share identifier is minted.
- **No changes to access control.** Drafts and any other restricted builds remain exactly as restricted as they are today. A shared link is a pointer, not a grant.
- **No history of what was shared.** Nothing is stored on the device or the server about shares.

### Environment and dependency assumptions

- **The site is served over a secure origin in production**, so device sharing is available where the browser supports it at all. Local development over a non-secure origin is expected to fall into the reduced-options path, which is a supported state rather than a bug.
- **Players scanning a code use a phone with a standard camera app** that recognises codes without a dedicated scanner application, which is true of current iOS and Android defaults.
- **The recipient's device can open the link.** The feature is responsible for producing a correct, fully-qualified address; it is not responsible for the state of the recipient's browser or network.
- **Feature 018 is in place.** The value of the scannable code depends on follow-along mode keeping the phone's screen lit once it arrives. This feature does not re-specify that behaviour and does not modify it.
- **Verification of physical scanning is manual.** Whether a code on a real monitor is readable by a real camera cannot be asserted from an automated test. Automated coverage is limited to which options are offered in which environments, which link each option produces, and the silent-degradation guarantees; the physical scan is confirmed by manual device testing.
