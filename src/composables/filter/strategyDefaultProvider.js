import { ref } from "vue";

// The strategies a build may store, each with the one line that tells a
// beginner what it means (spec 045). Strategy is optional: "" is "the author
// did not say", and is just as valid as any option.
//
// The subtitles are the only place this wording lives — the editor's select,
// the filter's select and the phone filter sheet all read them from here.
//
// MIRRORED in allowedFacets() in firestore.rules, which refuses any other
// value. Rules cannot import, so the titles are transcribed there: change both
// together.
const STRATEGY_OPTIONS = [
  {
    title: "Rush",
    subtitle: "Attack early in Feudal Age; Castle Age comes late or not at all.",
  },
  {
    title: "Boom",
    subtitle: "Grow your economy first (extra Town Centers, more villagers) and fight later.",
  },
  {
    title: "Fast Castle",
    subtitle: "Reach Castle Age as early as you can, with little army before.",
  },
  {
    title: "Fast Imperial",
    subtitle: "Race through Castle Age to reach Imperial Age quickly.",
  },
  {
    title: "Timing Attack",
    subtitle: "Build up to one strong attack at a planned moment, often right after an age-up.",
  },
  {
    title: "Cheese",
    subtitle: "A surprise plan, such as forward towers or buildings, to catch the opponent off guard.",
  },
];

export const STRATEGY_TITLES = STRATEGY_OPTIONS.map((option) => option.title);

export const strategies = ref(STRATEGY_OPTIONS.map((option) => ({ ...option })));

/**
 * How a strategy select draws its options: the explanation as a subtitle,
 * wrapped in full. Shared by the editor and the filter so the two cannot drift.
 *
 * `lines: false`, not "one"/"two"/"three": Vuetify clamps a subtitle through
 * the item's `--{n}-line` class, and a list defaults to one line — so the
 * explanation was cut off with "…", and the menu grew to 620px to fit it on
 * that line. Even "three" cut the longest one in the editor's 226px field.
 * Without a lines class there is no clamp at all, so nothing needs overriding.
 */
export const strategyItemProps = (item) => ({ subtitle: item.subtitle, lines: false });

// The menu exactly as wide as its field, in the editor and the filter card
// alike. Vuetify gives the menu its field's width as `min-width`; a smaller
// `max-width` loses to it in CSS, so 0 pins the width to the field instead of
// to the longest explanation. A fixed number would match one layout and stick
// out past the field in every other.
export const STRATEGY_MENU_PROPS = { maxWidth: 0 };

//Longest first, so a longer name is matched before any shorter one it might
//contain. No current title is inside another; this keeps it true for new ones.
const BY_LENGTH = [...STRATEGY_TITLES].sort((a, b) => b.length - a.length);

/**
 * The allowed strategy any incoming value stands for.
 *
 * Used on every save, on import and by the one-off cleanup, so a stored
 * strategy is always one of STRATEGY_TITLES or "". The hard way, by the owner's
 * choice: a value is kept only when it is an option (in any case) or names
 * exactly one option — "Feudal Rush" is Rush — and is dropped otherwise. A
 * value naming none, or several, says nothing the filter could use.
 *
 * @param {*} value - A strategy from a build, an import or a legacy document.
 * @return {string} One of STRATEGY_TITLES, or "".
 */
export function normaliseStrategy(value) {
  if (typeof value !== "string") return "";
  const folded = value.trim().toLowerCase();
  if (!folded) return "";

  const exact = STRATEGY_TITLES.find((title) => title.toLowerCase() === folded);
  if (exact) return exact;

  const named = BY_LENGTH.filter((title) => folded.includes(title.toLowerCase()));
  return named.length === 1 ? named[0] : "";
}
