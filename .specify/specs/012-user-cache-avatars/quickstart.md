# Quickstart & Test Guide: User Profile Cache with Comment Avatars

## Prerequisites

- Access to the dev Firebase project (`aoe4-guides-dev`)
- Two test accounts: one with an avatar set, one without
- A build order in dev with at least one comment from each account

## Test Steps

### Step 1 — Verify Dedup (US1, SC-001)

1. Open the browser DevTools → Network tab, filter to **Firestore** or **google.com** requests
2. Open a build order page in dev that has ≥2 comments from the same author
3. Count the Firestore `GET` requests to `users/{uid}` — should be **1** regardless of how
   many comments that author has posted
4. **Pass**: Exactly 1 read per distinct author uid (not 1 per comment)

### Step 2 — Verify Session Cache (US1, SC-002)

1. After step 1, navigate away to the home page
2. Navigate back to the same build order
3. Monitor Firestore reads again — **0 additional reads** for previously fetched uids
4. **Pass**: No new reads on second visit within the same session

### Step 3 — Avatar Shown for User With Avatar (US2, SC-003)

1. Log in as a user who has an avatar set (civ or uploaded image)
2. Post a comment on a build order
3. View the comment — the avatar slot should show the **actual avatar image** (not initials)
4. **Pass**: Image renders without a visible loading flash; falls back to initials only if
   the image URL fails to load

### Step 4 — Initials Fallback (US2, SC-004)

1. Log in as a user with **no avatar** set
2. Post a comment on the same build order
3. View the comment — the avatar slot should show **2-character initials** from the display name
4. **Pass**: Initials are shown; no broken image icon visible

### Step 5 — Deleted User Handling

1. View a comment from a uid that has no corresponding user document (simulate by entering a
   non-existent uid in the URL or using a test comment with a fake authorId)
2. **Pass**: Comment renders normally with initials fallback; no error or infinite spinner

### Step 6 — Vue DevTools Cache Inspection

1. Open Vue DevTools → Vuex tab
2. Inspect `state.cache.userProfiles`
3. **Pass**: After loading a comments page, the map contains one entry per distinct author uid.
   Entries are either a profile object or `null` — never `undefined`.

## Success Criteria Checklist

- [ ] SC-001: N comments from M authors → exactly M Firestore reads on load
- [ ] SC-002: Second visit → 0 additional user profile reads
- [ ] SC-003: Comments from users with avatars show avatar images without flash
- [ ] SC-004: Comments from users without avatars show initials (no broken images)
