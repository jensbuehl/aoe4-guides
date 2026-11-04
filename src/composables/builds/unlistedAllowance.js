/**
 * How many unlisted builds an author may hold, and what to tell them at the limit.
 *
 * Sharing builds with the community is what the site is for, so the cap on
 * unlisted builds exists to keep it from turning into free private storage. It
 * is a nudge, not a safeguard — an unlisted build costs next to nothing — and it
 * is enforced in the editor only.
 *
 * A flat cap treated the site's most generous authors exactly like someone who
 * has never published anything, so the room is earned by publishing: a base,
 * one more slot per two published builds, and a ceiling.
 *
 * "Unlisted" is the user-facing name for what the code and the stored field
 * still call a draft (`isDraft`). The field predates the rename and is read by
 * the public API, RTS Overlay and both snapshots, so it keeps its name. An
 * unlisted build is NOT private: anyone with its link can open it; it is only
 * left out of lists, search and the sitemap.
 *
 * No imports, on purpose: a Node harness can test this file as it stands.
 */

export const UNLISTED_BASE = 10;
export const UNLISTED_PER_PUBLISHED = 2;
export const UNLISTED_CAP = 50;

/**
 * @param {number|undefined} publishedCount the author's published builds. Anything
 *   that is not a finite number ≥ 0 counts as 0, so a failed count can never
 *   allow less room than the base — nor more.
 * @return {number} between UNLISTED_BASE and UNLISTED_CAP
 */
export function unlistedAllowance(publishedCount) {
  const published =
    typeof publishedCount === "number" && Number.isFinite(publishedCount) && publishedCount > 0
      ? publishedCount
      : 0;
  return Math.min(UNLISTED_CAP, UNLISTED_BASE + Math.floor(published / UNLISTED_PER_PUBLISHED));
}

/**
 * The snackbar text for a refused save. At the ceiling, publishing more would
 * not help, so that message must not suggest it.
 *
 * @param {number} allowance what unlistedAllowance returned
 * @return {string}
 */
export function unlistedLimitMessage(allowance) {
  if (allowance >= UNLISTED_CAP) {
    return `Oh, no! ${UNLISTED_CAP} unlisted builds is the most your villagers can keep. Publish or delete one to make room.`;
  }
  return `Oh, no! Your villagers can keep ${allowance} unlisted builds. Every ${UNLISTED_PER_PUBLISHED} builds you publish make room for 1 more, up to ${UNLISTED_CAP}.`;
}
