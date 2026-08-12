//Composables
import iconService from "./iconService.js";
import { IRREGULAR_PLURALS } from "./plurals.js";
import { withWebpPaths } from "../legacyImagePaths.js";

/**
 * Turns a step description into the sentence a player would say out loud.
 *
 * A build order is written in icons, so this is not a formatting detail — it is
 * the entire content for anyone who does not see the images: focus mode's
 * voice-over, and any crawler reading a prerendered page. Both call this, on
 * purpose. Two converters would drift, and the spoken build and the indexed
 * build would stop being the same build.
 *
 * Speech-only additions ("You should have 6 on food", the `!` pause markers)
 * stay on the speech side. They are instructions to a synthesiser, not text.
 */

//Matches a whole <img …> element. Non-greedy so two adjacent images are two
//matches; [\w\W] rather than . so an attribute containing a newline still ends
//the element where it actually ends.
const IMG_ELEMENT = /<img[\w\W]*?>/g;
const IMG_SRC = /src\s*=\s*"([^"]*)"/;

//Every spelling of a line break the editor has produced.
const LINE_BREAK = /<br\s*\/?>/i;

//A count immediately before the icon, and nothing else between them. This is
//what keeps "6 on <sheep>" as "Sheep" — the token before the icon is "on", not
//a number — while "6 <spearman>" becomes "6 Spearmen". Also accepts the "6x"
//and "6 x" forms authors use.
const TRAILING_COUNT = /(\d+)\s*x?\s*$/;

//Punctuation that already ends a sentence, so a line break after it needs to
//add nothing.
const ENDS_A_SENTENCE = /[.!?:,;]$/;

//One service for the whole vocabulary, civ-unfiltered. A description can name
//an icon from any civilisation — imports and remixes do it routinely — and
//filtering here would drop those instead of resolving them.
let vocabulary = null;
function resolveIcon(src) {
  vocabulary ??= iconService();
  return vocabulary.getIconFromImgPath(src);
}

/**
 * Whether a count in front of this icon should inflect its name.
 *
 * Units and buildings are counted; resources are mass nouns ("5 Gold", never
 * "5 Golds"), and technologies and abilities are researched rather than
 * accumulated. Landmarks are excluded despite being buildings because each one
 * is unique — nobody writes "2 House of Wisdom".
 *
 * @param {Object} icon - An icon record from the vocabulary.
 * @return {boolean}
 */
function isCountable(icon) {
  return (icon.type === "unit" || icon.type === "building") && icon.class !== "landmark";
}

/**
 * @param {string} title - An icon title, as it appears in the vocabulary.
 * @return {string} Its plural.
 */
export function pluralise(title) {
  //Exceptions first: the rules below are good enough to be confidently wrong.
  if (Object.hasOwn(IRREGULAR_PLURALS, title)) return IRREGULAR_PLURALS[title];

  //Ordered, first match wins. -man before the y rule so "Spearman Levy" is not
  //caught by the wrong one, and the sibilant rule before the bare +s so
  //"Dervish" does not become "Dervishs".
  if (/man$/.test(title)) return title.replace(/man$/, "men");
  if (/[^aeiou]y$/i.test(title)) return title.replace(/y$/i, "ies");
  if (/(s|x|z|ch|sh)$/i.test(title)) return title + "es";
  return title + "s";
}

/**
 * The word an icon contributes, inflected if the text before it counts it.
 *
 * @param {Object} icon - The resolved icon.
 * @param {string} textSoFar - Everything already converted on this line.
 * @return {string}
 */
function nameFor(icon, textSoFar) {
  const title = icon.title ?? "";
  if (!title) return "";

  //"1 Spearman", not "1 Spearmen". A count of one is still a count, so it has
  //to be matched before it can be excluded — the alternative is a rule that
  //reads "pluralise when counted" and is wrong once in every build.
  const count = textSoFar.match(TRAILING_COUNT)?.[1];
  const counted = count !== undefined && Number(count) !== 1;

  return counted && isCountable(icon) ? pluralise(title) : title;
}

/**
 * Decodes the arrows and entities authors type into the words they mean.
 *
 * Order is load-bearing: the entity-encoded arrows are decoded before their
 * bare equivalents, and both spellings of a lone right angle bracket are
 * consumed last, once no arrow can still be holding one.
 *
 * "&gt;" is the one addition, and it was a real gap: ">" was handled and its
 * encoded form was not, so a line the author began with "> Take 5 vils"
 * reached the reader as "&gt; Take 5 vils". The editor encodes on save, which
 * makes the encoded spelling the common one rather than the exotic one.
 *
 * @param {string} text
 * @return {string}
 */
function convertSpecialCharacters(text) {
  text = text.replaceAll("&lt;-", " See to the left. ");
  text = text.replaceAll("-&gt;", " ,then ");
  text = text.replaceAll("&amp;", " and ");
  text = text.replaceAll("<-", " See to the left. ");
  text = text.replaceAll("->", " See to the right. ");
  text = text.replaceAll("&gt;", " on ");
  text = text.replaceAll(">", " on ");

  //Whatever is left of the entities a rich-text field can carry. Not arrows and
  //not meaningful — just characters that must not reach a reader spelled out.
  text = text.replaceAll("&nbsp;", " ");
  text = text.replaceAll("&quot;", '"');
  text = text.replaceAll("&#39;", "'");
  text = text.replaceAll("&apos;", "'");
  text = text.replaceAll("&lt;", "");

  return text;
}

/**
 * @param {string} imgElement - A whole <img …> element.
 * @return {string} Its src, or "" when it has none.
 */
function srcOf(imgElement) {
  return imgElement.match(IMG_SRC)?.[1] ?? "";
}

/**
 * One line of a description — everything between two <br>s.
 *
 * @param {string} line - Markup for a single line.
 * @param {Object} options - As convertDescriptionToText.
 * @return {string} Plain text, whitespace normalised.
 */
function convertLine(line, options) {
  //A leading ">" is a bullet, not the arrow. The rule in
  //convertSpecialCharacters reads "6 > gold" as "6 on gold", which is right in
  //the middle of a line and nonsense at the start of one — authors bullet their
  //notes this way, and it came out as "on At this point you are wide open".
  line = line.replace(/^\s*(?:&gt;|>)\s*/, "");

  let text = "";
  let cursor = 0;

  for (const match of line.matchAll(IMG_ELEMENT)) {
    text += line.slice(cursor, match.index);
    cursor = match.index + match[0].length;

    const src = srcOf(match[0]);
    const icon = resolveIcon(src);
    if (!icon) {
      options.onUnresolvedIcon?.(src);
      continue;
    }

    //Padded, then collapsed below. An icon can sit flush against a word
    //("3<spearman>") or already have spaces around it, and adding one either
    //way was the source of the doubled spacing this replaces.
    text += ` ${nameFor(icon, text)} `;
  }

  text += line.slice(cursor);
  text = convertSpecialCharacters(text);

  return text.replace(/\s+/g, " ").replace(/\s+([.,!?;:])/g, "$1").trim();
}

/**
 * Joins converted lines into prose, deciding the punctuation between them.
 *
 * A line break is not a full stop. Turning every one into ". " is what made
 * "click up... NOW:" out of a line that ended in a full stop followed by a
 * blank line — the author wrote one sentence end and the reader got three. So
 * the stop is added only where the previous line does not already carry one,
 * which also leaves an author's real ellipsis alone; collapsing runs of dots
 * afterwards could not have told the two apart.
 *
 * @param {Array<string>} lines - Non-empty converted lines.
 * @return {string}
 */
function joinLines(lines) {
  let text = "";

  for (const line of lines) {
    if (!text) {
      text = line;
      continue;
    }
    text += ENDS_A_SENTENCE.test(text) ? " " : ". ";
    text += line;
  }

  return text;
}

/**
 * Converts one step description to plain text.
 *
 * @param {string} description - Step markup: text, <img> and <br /> only.
 * @param {Object} [options]
 * @param {Function} [options.onUnresolvedIcon] - Called with the src of every
 *   image that matches no icon. These are dropped from the output, so this
 *   callback is the only evidence they existed — see below.
 * @return {string} Plain text, whitespace normalised, no markup.
 *
 * Unresolved images are dropped, not printed. The previous behaviour was to
 * emit their `.title`, which on a miss was `undefined` — the literal word,
 * which focus mode then read aloud. Dropping is right, but it trades a loud
 * defect for a silent one: a vocabulary drift now deletes content instead of
 * announcing itself. That is what onUnresolvedIcon exists to make visible, and
 * why the generator reports the count on every run even when it is zero.
 *
 * The .png → .webp rewrite runs here rather than being left to callers. It is a
 * read concern (see legacyImagePaths.js) and this is a read path: builds
 * written before the WebP switch still store .png, and without it every icon in
 * such a build resolves to nothing and is silently dropped. The views convert
 * their own copy before rendering, so they would not notice; a script reading
 * Firestore directly has no such copy, and is exactly the caller that would
 * lose the content.
 */
export function convertDescriptionToText(description, options = {}) {
  const source = withWebpPaths(String(description ?? ""));
  if (!source) return "";

  const lines = source
    .split(LINE_BREAK)
    .map((line) => convertLine(line, options))
    .filter(Boolean);

  return joinLines(lines);
}
