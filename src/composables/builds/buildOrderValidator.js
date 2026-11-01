import sanitizeHtml from "sanitize-html";

/**
 * Validates a build by checking the title, civilization, and video.
 *
 * @param {Object} build - The build object to be validated.
 * @param {string} build.title - The title of the build.
 * @param {string} build.civ - The civilization of the build.
 * @param {string} build.video - The video of the build.
 * @return {string|null} - An error message if the build is invalid, or null if the build is valid.
 */
export function validateBuild(build) {
  //check title
  if (!build.title) {
    return "Title is required. Please set a build order title.";
  }

  if (!build.civ || !(build.civ != "ANY")) {
    return "Civilization is required. Please set a build order civilization.";
  }

  //check video
  return validateVideo(build.video);
}

/**
 * Validates a video link to ensure it is a valid YouTube video link.
 *
 * @param {string} video - The video link to be validated
 * @return {string|null} Error message if the video link is invalid, otherwise null
 */
export function validateVideo(video) {
  if (video) {
    var regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|\?v=)([^#\&\?]*).*/;
    var match = video.match(regExp);
    if (!match || match[2].length != 11) {
      return "Invalid youtube video link. Please update build order video.";
    }
  }
  return null;
}

/**
 * Plain text made safe to insert as HTML. The caller inserts the result with
 * `insertHTML`, so pasted text such as "<img onerror=…>" must arrive as text.
 *
 * @param {string} text
 * @return {string}
 */
function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Pastes from age4builder are refused outright: nothing is inserted.
 *
 * @param {string} dirty - The pasted `text/html`, possibly empty.
 * @return {boolean}
 */
function isRefusedSource(dirty) {
  return !!dirty && !!dirty.match("age4builder");
}

/**
 * The path of one of the app's own icons, or null for anything else.
 *
 * Only icons belong in a step: an `<img>` is rendered for every reader of the
 * build, so a remote `src` would have them all request a stranger's server.
 * Absolute URLs have to survive when they are ours, because copying a step from
 * a build page puts `https://aoe4guides.com/assets/…` on the clipboard; storing
 * the path keeps a pasted icon working on every host the app runs on. The page's
 * own origin stands in for localhost and the dev project.
 *
 * @param {string} src - The pasted `src`.
 * @return {string|null}
 */
function ownIconPath(src) {
  let url;
  try {
    url = new URL(src, "https://aoe4guides.com");
  } catch {
    return null;
  }
  const ours = url.origin === "https://aoe4guides.com" || url.origin === globalThis.location?.origin;
  return ours && url.pathname.startsWith("/assets/") ? url.pathname : null;
}

/**
 * Sanitizes a paste into a field that holds one value: a step's time or a
 * resource. Unlike a description these have no line breaks and no icons, and a
 * `<br>` would be stripped on save with the values either side of it fused
 * ("1:30⏎2:00" stored as "1:302:00"), so the clipboard's plain text is used and
 * its line breaks become spaces.
 *
 * @param {string} dirty - The pasted `text/html`, possibly empty.
 * @param {string} [plain] - The pasted `text/plain`.
 * @return {string} The value, safe to insert as HTML.
 */
export function sanitizeCellValue(dirty, plain = "") {
  if (isRefusedSource(dirty)) return "";
  return escapeHtml(plain.replace(/\s*\r?\n\s*/g, " ").trim());
}

/**
 * Sanitizes a step description by removing unwanted tags, classes, attributes, and styles.
 *
 * Pure: it returns the HTML to insert, and leaves the event to the caller, which
 * stops and prevents the paste either way. It was extracted from the editor's
 * paste handler with two references to that handler's event `e` left behind,
 * so every plain-text paste threw "e is not defined" before preventDefault
 * ran; the browser's own paste then went through and hid the error. The plain
 * text is a parameter now for that reason.
 *
 * @param {string} dirty - The pasted `text/html`, possibly empty.
 * @param {string} [plain] - The pasted `text/plain`, used when there is no HTML.
 * @return {string} The sanitized step description.
 */
export function sanitizeStepDescription(dirty, plain = "") {
  var clean = "";

  if (isRefusedSource(dirty)) {
    return clean;
  }

  if (dirty) {
    clean = sanitizeHtml(dirty, {
      allowedTags: ["img", "br"], //no longer use sanitizeHtml.defaults.allowedTags, since it contains e.g. tables
      allowedClasses: {
        img: [
          "icon",
          "icon-none",
          "icon-military",
          "icon-tech",
          "icon-default",
          "icon-landmark",
          "icon-ability",
        ],
      },
      allowedAttributes: {
        img: ["style", "class", "src", "title"],
      },
      allowedStyles: {
        "*": {
          "vertical-align": [/^middle$/],
        },
      },
      transformTags: {
        img: (tagName, attribs) => ({
          tagName,
          attribs: { ...attribs, src: ownIconPath(attribs.src ?? "") ?? "" },
        }),
      },
      exclusiveFilter: (frame) => frame.tag === "img" && !frame.attribs.src,
    });
  } else {
    //Fallback to plain text otherwise
    clean = escapeHtml(plain || "");
  }

  return clean.trim().replace(/\r?\n/gm, "<br>");
}
