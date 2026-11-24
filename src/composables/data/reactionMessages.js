/**
 * What to tell a player whose like or upvote did not go through (spec 042,
 * FR-016). Shared by Favorite and Vote, which show it in the snackbar.
 *
 * @param {any} err - What setReaction threw.
 * @return {string}
 */
export function reactionErrorMessage(err) {
  if (err?.code === "offline") return "You're offline — try again when you're back.";
  return "That didn't go through. Please reload the page and try again.";
}
