# Quickstart & Verification: Share a Build — QR Handoff and Native Share

**Feature**: `019-qr-share-build` | **Date**: 2026-07-31

## Setup

```bash
npm install qrcode
npm run dev
```

Then open any build, e.g. `http://localhost:3000/builds/<some-id>`.

> **Local dev runs over plain HTTP**, so Web Share is unavailable and the dialog will show the QR alone. That is the specified degradation path (FR-004), not a bug — but it does mean **the Share option cannot be verified locally.** Use a deploy preview or `--host` with HTTPS for that.

---

## The one check that matters most

Everything else can be verified from a desk chair. This one cannot, and it is the check the whole feature exists for:

> **Open a build on the desktop → Share → scan the QR with a real phone → confirm the phone lands in focus mode on the right build, and that the screen then stays lit.**

If this passes, the feature works. If it is skipped, nothing else proves anything.

The failure mode to watch for: the phone opens the build page in **normal reading mode** instead of focus mode. That means the URL was built with a bare `?focus` instead of `?focus=true` — an empty string is falsy at the receiving end. See research R5.1.

---

## Verification checklist

### A. QR handoff — User Story 1 (P1)

- [ ] **A1** Overflow menu (⋮) on the build page shows a **Share** item, on both mobile and desktop layouts. *(FR-001)*
- [ ] **A2** Selecting it opens the dialog; the QR appears without the page navigating or reloading. *(FR-003, FR-005)*
- [ ] **A3** **Scan with a real phone camera from ~50 cm.** Phone offers the link; opening it lands on the same build **in focus mode**, with no extra tap. *(FR-006, SC-003)*
- [ ] **A4** Leave the phone untouched past its display-sleep timeout — the screen stays lit (feature 018 still applies through this entry path). *(User Story 1 §4)*
- [ ] **A5** Repeat A3 in **dark theme**. Still scans first time. *(FR-008, SC-002)*
- [ ] **A6** Close the dialog: scroll position, expanded/collapsed description, and browser Back all unchanged. *(FR-003, User Story 1 §6)*
- [ ] **A7** Open build A's dialog, close it, navigate to build B in-app, open again — the QR is **B's**. *(FR-007)*

### B. Native share — User Story 2 (P2)

*Requires a mobile device on HTTPS.*

- [ ] **B1** On mobile, the dialog offers a **Share…** option. *(FR-011)*
- [ ] **B2** Choosing it opens the OS share sheet carrying the build link **and** a title identifying the build. *(FR-011)*
- [ ] **B3** Send to a chat app; the recipient's link opens the build in **normal reading mode**, not focus mode. *(FR-017, User Story 2 §5)*
- [ ] **B4** **Dismiss the share sheet without picking a target** — no error, no warning, no snackbar, page unchanged. *(FR-013)* ← easiest thing to get wrong; `AbortError` must be swallowed, not logged.
- [ ] **B5** Desktop Firefox: the Share… option is **absent**, not present-but-broken. *(FR-012)*

> **C is intentionally absent.** A copy-link option was specified and cut during planning — the share URL is the build page's own address, so the browser address bar already provides it, and native share sheets include "Copy" as a target. Section letters are left as-is so D/E/F references elsewhere stay stable.

### D. Degradation and failure — never a broken page

- [ ] **D1** Block the `qrcode` chunk in DevTools (Network → block request URL), then open the dialog: a plain "QR code unavailable" message appears, and Share still works. *(FR-010)*
- [ ] **D2** Console is clean of unhandled rejections across all of the above, including the cancel in B4. *(SC-007, FR-022)*
- [ ] **D3** Over plain HTTP the dialog still shows the QR — never empty. *(FR-004)*
- [ ] **D4** Open a build that does not exist: not-found state, **no Share entry**. *(FR-002)*
- [ ] **D5** Open and close the dialog ~10 times rapidly: no stale QR, no visible degradation. *(Edge case)*

### E. Cost and load — the lazy-import promise

- [ ] **E1** DevTools → Network, hard-reload a build page, **do not** open the dialog. No `qrcode` chunk is requested. *(FR-020, NFR-001)* ← the entire justification for the lazy import; verify it rather than assuming it.
- [ ] **E2** Open the dialog — *now* the chunk is fetched, and only once. *(FR-020)*
- [ ] **E3** `npm run build` shows `qrcode` in its **own** chunk, not merged into the build-details chunk or a vendor chunk. *(FR-020)*
- [ ] **E4** No Firestore reads, writes, or third-party requests are triggered by opening the dialog or by any share. *(FR-021, SC-008)*

### F. Accessibility

- [ ] **F1** The QR image has `alt` text naming the build. *(NFR-004)*
- [ ] **F2** The dialog and every option are reachable and activatable by keyboard alone. *(NFR-004)*
- [ ] **F3** The "Scan to open on your phone" caption is present — the QR's purpose is conveyed in text, not by the image alone. *(NFR-004)*

---

## Before merging

Constitution II asks whether the code is simpler and clearer than before. Specifically for this change:

- [ ] No composable was extracted for a single consumer *(Constitution I — extract on the second use, not the first)*
- [ ] `vite.config.mjs` is untouched — the dynamic import chunks itself *(research R1)*
- [ ] No `v-html` anywhere; the QR is a data URL bound to `src` *(Constitution V)*
- [ ] `BuildDetails.vue` gained only a menu item and a dialog mount — no share logic leaked into the page *(Constitution III)*
- [ ] Commit messages use Conventional Commits *(Development Workflow)*
