import { featuredCreators } from "@/composables/filter/featuredCreatorDefaultProvider";

/**
 * The public profile a contributor maintains about themselves: a short
 * introduction and a set of outbound links.
 *
 * Everything here is synchronous and pure. It reads no store, makes no request
 * and touches no component — the same functions run in the account form before
 * a write, in the spotlight card on the home page, and in the author page
 * header, and all three have to agree. A second implementation anywhere would
 * be free to disagree with this one.
 */

/**
 * Longest introduction that may be stored.
 *
 * This number also appears in `firestore.rules`, transcribed rather than
 * imported — rules are not JavaScript and cannot read this file. If it changes
 * here it must change there in the same commit, or the form will promise a
 * length the server refuses.
 */
export const BIO_MAX_LENGTH = 180;

/**
 * The link kinds, in the order they are offered and rendered.
 *
 * A table rather than three near-identical functions: the third one is where
 * copies start drifting, and the one thing that must never drift is the
 * pattern, since it is the whole reason a stored value cannot express a host.
 *
 * Each entry:
 *  - `pattern`      what may be STORED. Anchored, and transcribed verbatim into
 *                   firestore.rules. `matches()` there is RE2 and is not
 *                   implicitly anchored, so without `^…$` a value like
 *                   `https://evil.example/@x` satisfies the handle branch.
 *  - `hosts`        addresses a paste may legitimately arrive from.
 *  - `fromPath`     pulls the identifier out of that address, or null. Never
 *                   guesses: a wrong guess publishes someone else's channel as
 *                   this person's own.
 *  - `url`          composes the outbound address at render time. The URL is
 *                   never stored, which is what makes the destination
 *                   impossible for a contributor to control.
 */
const LINKS = {
  youtube: {
    label: "YouTube",
    icon: "mdi-youtube",
    placeholder: "@yourhandle",
    hint: "Paste your channel address, or type your @handle.",
    pattern: /^(UC[A-Za-z0-9_-]{22}|@[A-Za-z0-9._-]{3,30})$/,
    hosts: ["youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com"],
    // `/@handle` and `/channel/{id}`. Anything longer is a video, a playlist or
    // a legacy `/c/` alias that cannot be resolved without asking YouTube.
    fromPath: (segments) => {
      if (segments.length === 1 && segments[0].startsWith("@")) return segments[0];
      if (segments.length === 2 && segments[0] === "channel") return segments[1];
      return null;
    },
    url: (value) =>
      value.startsWith("@")
        ? `https://www.youtube.com/${value}`
        : `https://www.youtube.com/channel/${value}`,
  },

  twitch: {
    label: "Twitch",
    icon: "mdi-twitch",
    placeholder: "yourchannel",
    hint: "Paste your Twitch address, or type your channel name.",
    // Twitch logins: 4–25 characters, letters, digits and underscore.
    pattern: /^[A-Za-z0-9_]{4,25}$/,
    hosts: ["twitch.tv", "www.twitch.tv", "m.twitch.tv"],
    // Exactly one segment. `/videos/123` and `/directory/...` would otherwise
    // yield "videos" and "directory", which pass the pattern and link nowhere
    // useful.
    fromPath: (segments) => (segments.length === 1 ? segments[0] : null),
    url: (value) => `https://www.twitch.tv/${value}`,
  },

  aoe4world: {
    label: "AoE4World",
    // Same icon About.vue already uses for aoe4world, so the site says one
    // thing about that destination. It is why the rank chip uses mdi-star.
    icon: "mdi-trophy",
    placeholder: "2942077",
    hint: "Paste your AoE4World profile address.",
    // The numeric id only. Profile URLs carry a decorative name slug
    // ("2942077-VES-Valdy") that changes when the player renames; the id does
    // not, and aoe4world serves the profile from the bare id — which is the
    // form About.vue already links with.
    pattern: /^[0-9]{1,20}$/,
    hosts: ["aoe4world.com", "www.aoe4world.com"],
    fromPath: (segments) => {
      if (segments.length < 2 || segments[0] !== "players") return null;
      return segments[1].split("-")[0] || null;
    },
    url: (value) => `https://aoe4world.com/players/${value}`,
  },
};

/** The link kinds, in render order. */
export const PROFILE_LINK_KINDS = Object.keys(LINKS);

/** Channel ids the site already knows as featured creators, for the verified marker. */
const KNOWN_CHANNEL_IDS = new Set(
  featuredCreators.map((creator) => creator.creatorId).filter(Boolean)
);

/**
 * Presentation details for one link kind — label, icon, and the form copy.
 *
 * @param {string} kind
 * @return {{label: string, icon: string, placeholder: string, hint: string}|null}
 */
export function linkMeta(kind) {
  const def = LINKS[kind];
  if (!def) return null;
  const { label, icon, placeholder, hint } = def;
  return { label, icon, placeholder, hint };
}

/**
 * Reduce an introduction to the single line that will actually be stored.
 *
 * Newlines and runs of spaces collapse to one space. This is done once, here,
 * at the point of writing — rather than defended against in each consumer's CSS
 * — because a bio is one or two sentences by design and multi-line was never
 * wanted. It also makes "whitespace only" and "contains newlines" the same
 * case, resolved before either reaches a template.
 *
 * @param {string|null|undefined} text
 * @return {string|null} The normalised line, or null when there is nothing left.
 */
export function normaliseBio(text) {
  if (typeof text !== "string") return null;
  const collapsed = text.replace(/\s+/g, " ").trim();
  return collapsed === "" ? null : collapsed;
}

/**
 * How much of the allowance an introduction consumes.
 *
 * Counted in UTF-8 bytes, which is the largest of the plausible measures — a
 * single emoji is 1 code point, 2 UTF-16 units and 4 bytes. The form and the
 * Firestore rule count with different engines, and only one direction of
 * disagreement is survivable: a counter stricter than the rule stops the user
 * early, while a counter looser than the rule lets them fill the field to
 * "180/180" and then refuses the write with `permission-denied` and nothing to
 * act on. Counting bytes cannot be the looser of the two under any reading of
 * `size()`.
 *
 * For plain ASCII — which is almost every bio — all three measures agree, so
 * this costs nothing in the common case.
 *
 * @param {string|null|undefined} text
 * @return {number}
 */
export function bioLength(text) {
  if (typeof text !== "string" || text === "") return 0;
  return new TextEncoder().encode(text).length;
}

/**
 * Whether a value is storable as a link of this kind.
 *
 * @param {string} kind
 * @param {string|null|undefined} value
 * @return {boolean}
 */
export function isValidLink(kind, value) {
  const def = LINKS[kind];
  return !!def && typeof value === "string" && def.pattern.test(value);
}

/**
 * The address to send a visitor to, built from the stored value.
 *
 * The URL is never stored, only composed — which is what makes it impossible
 * for a contributor to point this link anywhere but the intended site. The
 * `null` is not defensive padding: it is what keeps that true if a rule is ever
 * loosened by mistake. An unrecognised value produces no link at all rather
 * than a link somewhere unexpected.
 *
 * @param {string} kind
 * @param {string|null|undefined} value
 * @return {string|null}
 */
export function linkUrl(kind, value) {
  return isValidLink(kind, value) ? LINKS[kind].url(value) : null;
}

/**
 * Pull a storable identifier out of whatever the contributor pasted.
 *
 * People have a URL in their clipboard, not an id, so refusing anything but the
 * bare identifier would be a form nobody can fill in. This is a convenience at
 * the point of entry, not a relaxation of what gets stored: the return value is
 * still only an identifier, and the address is composed again at render time.
 *
 * @param {string} kind
 * @param {string|null|undefined} input
 * @return {string|null}
 */
export function extractLink(kind, input) {
  const def = LINKS[kind];
  if (!def || typeof input !== "string") return null;

  const trimmed = input.trim();
  if (trimmed === "") return null;

  // Already in storable form.
  if (def.pattern.test(trimmed)) return trimmed;

  let url;
  try {
    url = new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`);
  } catch {
    return null;
  }

  if (!def.hosts.includes(url.hostname.toLowerCase())) return null;

  const segments = url.pathname.split("/").filter(Boolean);
  const candidate = def.fromPath(segments);
  return candidate && def.pattern.test(candidate) ? candidate : null;
}

/**
 * Whether this YouTube channel is one the site already lists as a featured
 * creator.
 *
 * Ids only. The featured-creator list stores channel ids, so a contributor who
 * gave their handle will not match even if it is the same channel. That false
 * negative is cosmetic — it withholds a marker, it never grants one wrongly.
 *
 * @param {string|null|undefined} value
 * @return {boolean}
 */
export function isRecognisedChannel(value) {
  return isValidLink("youtube", value) && KNOWN_CHANNEL_IDS.has(value);
}
