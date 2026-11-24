# Contract: the client's like and upvote write (042)

One function, `setReaction({ uid, buildId, list, on, currentCount })`, in
`src/composables/data/reactionService.js`. It is the only code that changes a like or an upvote.

## The write

```js
// list: "favorites" (likes) | "upvotes"
const counter = list === "favorites" ? "likes" : "upvotes";
const step = on ? 1 : (currentCount > 0 ? -1 : 0);

await writeWithTokenRetry(() => {
  const batch = writeBatch(db);                       // a batch commits once: build it per attempt
  if (step) batch.update(doc(db, "builds", buildId), { [counter]: increment(step) });
  batch.set(
    doc(db, "favorites", uid),
    { [list]: on ? arrayUnion(buildId) : arrayRemove(buildId), lastChange: { list, buildId } },
    { merge: true }
  );
  return batch.commit();
});
```

- **Throws** on refusal or failure. Callers revert their optimistic state and show a snackbar.
- Before writing: if `navigator.onLine === false`, throw an "offline" error without writing (a queued
  offline write would sit unacknowledged while the button shows it as done).
- `writeBatch` is added to the exports of `src/firebase/index.js`; `writeWithTokenRetry` is exported
  from `collectionService.js`.

## Callers

| Component | Before | After |
|---|---|---|
| `Favorite.vue` | `incrementLikes` + `addFavorite` (two writes, errors swallowed); 30-cap read | one `setReaction`; no cap; state from `modelValue.favorites`; `pending` guard; emits `favoriteAdded`/`favoriteRemoved` |
| `Vote.vue` | up and down, four helpers | thumbs-up only, one `setReaction`; state from `modelValue.upvotes`; `pending` guard |
| `BuildDetails.vue` | adjusts `build.upvotes` on vote events | also adjusts `build.likes`; passes `:count` to both |

On success the component updates the shared `modelValue` list (both mounted copies read it), so the
mobile and desktop buttons agree.

## Removed

`incrementLikes`, `decrementLikes`, `incrementUpvotes`, `decrementUpvotes`, `incrementDownvotes`,
`decrementDownvotes` (`buildService.js`); `addFavorite`, `removeFavorite`, `addUpvote`,
`removeUpvote`, `addDownvote`, `removeDownvote` (`favoriteService.js`). `getUserFavorites` and
`createUserFavorites` stay.
