/**
 * How many builds a paginated list fetches per page.
 *
 * Ten cards fill a laptop screen and leave half of a tall desktop one blank
 * below the pagination, so a viewport with room for twenty gets twenty. Two
 * sizes and no more: the lists cache their current page and page by cursor,
 * so the size has to stay fixed for the life of the view. It is therefore
 * read once, when the view sets up, and resizing the window afterwards does
 * not change it.
 *
 * The cost is reads, and only for those screens: a page there is twenty
 * document reads instead of ten.
 *
 * 1400px of viewport height is roughly what twenty md+ cards need to not
 * leave the bottom of the screen empty; on a 1080p monitor (about 950px of
 * browser viewport) the list keeps ten.
 */
export const PAGE_SIZE = 10;
export const PAGE_SIZE_TALL = 20;
export const TALL_VIEWPORT = 1400;

export function listPageSize() {
  if (typeof window === "undefined") return PAGE_SIZE;
  return window.innerHeight >= TALL_VIEWPORT ? PAGE_SIZE_TALL : PAGE_SIZE;
}
