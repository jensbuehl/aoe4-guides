/**
 * The page's one <link rel="canonical"> in document.head.
 *
 * The router points it at every route it shows (src/router/index.js); a view
 * may re-point it once it knows better — a build that is an exact duplicate of
 * another names that build as the canonical page (spec 044). Kept apart from
 * the router so a view can use it without importing the router, which imports
 * the views.
 */
export const SITE_ORIGIN = "https://aoe4guides.com";

/**
 * Points the canonical tag at a path on this site, creating the tag if needed.
 *
 * @param {string} path - e.g. "/builds/abc"; "" or "/" for the home page.
 */
export function setCanonicalPath(path) {
  let link = document.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "canonical");
    document.head.appendChild(link);
  }
  link.setAttribute("href", `${SITE_ORIGIN}/${String(path ?? "").replace(/^\/+/, "")}`);
}

/** Removes the canonical tag: for pages that must never claim to be canonical. */
export function removeCanonical() {
  document.querySelector('link[rel="canonical"]')?.remove();
}
