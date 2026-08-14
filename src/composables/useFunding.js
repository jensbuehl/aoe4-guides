import { FUNDING, SUPPORTERS, EARLIER_SUPPORTERS, KOFI_URL, KOFI_TIERS } from "@/config/supporters";

/**
 * Community funding status and supporter recognition.
 *
 * Both composables here are synchronous and read nothing but bundled config.
 * That is a hard requirement rather than an implementation detail: the funding
 * status renders in the footer, which is on every page of the site, and the
 * badge is looked up once per rendered build card. A Firestore read in either
 * position would cost millions of reads a month — so a feature whose whole
 * purpose is to cover the running costs would begin by increasing them.
 *
 * Nothing here may become async, fetch, or touch the store.
 */

/**
 * How many current-year supporters it takes before the total stops being
 * attributable to any one of them, and so before the count and the year
 * grouping can safely be shown. See `showSupporterCount` and `groupByYear`.
 */
const DISCLOSURE_THRESHOLD = 3;

const EMPTY = "empty";
const PARTIAL = "partial";
const COVERED = "covered";

/**
 * The named entries, alphabetically. An entry without a name is an anonymous
 * supporter, who is counted but not listed — see the file header in
 * `@/config/supporters`.
 *
 * Sorting here rather than in the config file means new supporters can simply
 * be appended when they arrive, which keeps the diffs one line long, while the
 * page still reads as a list rather than as a join order.
 *
 * `localeCompare` rather than the default sort: plain `.sort()` compares code
 * points, which puts every capitalised name above every lowercase one — "acr"
 * and "louis" would land after "Yukgaejang" — and files "Björn" away from the
 * other B's. `sensitivity: "base"` folds both case and accents; `numeric` keeps
 * a leading digit sane.
 *
 * Copied before sorting: the source arrays are module-level constants, and
 * sorting in place would reorder them for every other reader.
 *
 * @param {Array<{name?: string}>} entries
 * @return {Array<{name: string}>}
 */
function named(entries) {
  return entries
    .filter((entry) => typeof entry?.name === "string" && entry.name.trim() !== "")
    .slice()
    .sort((a, b) =>
      a.name.localeCompare(b.name, "en", { sensitivity: "base", numeric: true })
    );
}

/**
 * The funding status for the stated year.
 *
 * `supporterCount` is derived from the list, so the number of people can never
 * disagree with the names on the wall. `coveredEur` is not derived — deriving it
 * would require a per-person amount, and this config reaches every visitor's
 * browser, so those amounts would be public the moment they were written down.
 * It is therefore hand-set, and kept honest by being edited in the same commit
 * as the list rather than on a cadence of its own.
 */
export function useFunding() {
  const costEur = Number(FUNDING.costPerYearEur) || 0;
  //Clamped rather than trusted: a negative total would produce a shortfall
  //larger than the cost and a bar reading past its own start.
  const coveredEur = Math.max(0, Number(FUNDING.coveredEur) || 0);
  const supporterCount = SUPPORTERS.length;

  const isCovered = costEur > 0 && coveredEur >= costEur;

  //Small-cell disclosure. Publishing the total, the count AND the names makes
  //the aggregate stop being one: with two supporters listed, each can subtract
  //their own contribution and know the other's exactly, and with one, the total
  //*is* that person's donation. It matters most for anyone who contributed
  //privately — they are in the total but not on the wall, so the arithmetic
  //would expose what they gave despite their having asked not to be named.
  //
  //Dropping the count is what breaks the subtraction, and it costs nothing to
  //read: "€10 of €180 covered" is a complete sentence without it. Above the
  //threshold the sum stops being attributable and the count becomes worth
  //having again, as social proof rather than as a hint.
  const showSupporterCount = supporterCount >= DISCLOSURE_THRESHOLD;

  //Three readings, decided here rather than in each template, so the empty and
  //over-covered wordings cannot drift apart between the footer, the home card,
  //About and the account page.
  let state = PARTIAL;
  if (supporterCount === 0 && coveredEur === 0) state = EMPTY;
  else if (isCovered) state = COVERED;

  return {
    year: FUNDING.year,
    costEur,
    coveredEur,
    //Never negative: a covered year reports no gap, not a negative one.
    shortfallEur: Math.max(0, costEur - coveredEur),
    supporterCount,
    showSupporterCount,
    isCovered,
    state,
    //A whole number is honest enough for a figure already stated as "about",
    //and it keeps the footer line short on a phone.
    percentCovered: costEur > 0 ? Math.min(100, Math.round((coveredEur / costEur) * 100)) : 0,
    kofiUrl: KOFI_URL,
    kofiTiers: KOFI_TIERS,
  };
}

/**
 * The names for the supporters wall, in two groups: this year's and everyone
 * who contributed before it.
 *
 * There is deliberately no per-user lookup here. A badge beside an author's
 * name would need to know which site account a Ko-fi supporter is, and nothing
 * provides that mapping — Ko-fi display names do not correspond to site
 * usernames, there is no API to ask, and obtaining it would mean starting a
 * conversation with every new supporter. So supporters are recognised by name
 * on one page, and nowhere else.
 */
export function useSupporters() {
  //The wall is grouped by year only once this year's group is big enough to
  //hide an individual in. Below that it is one undifferentiated list of
  //everyone who has ever chipped in.
  //
  //This is the same small-cell problem `showSupporterCount` guards against, and
  //suppressing the count alone would have been theatre: the count IS the length
  //of the visible list, so naming this year's two supporters beside a €10 total
  //hands back exactly the subtraction that was just hidden.
  //
  //Merging keeps the thank-you — which matters most for the first few people —
  //while making it impossible to tell which names account for the current
  //total.
  const groupByYear = SUPPORTERS.length >= DISCLOSURE_THRESHOLD;

  return {
    groupByYear,
    supporters: groupByYear ? named(SUPPORTERS) : [],
    earlierSupporters: groupByYear
      ? named(EARLIER_SUPPORTERS)
      : named([...SUPPORTERS, ...EARLIER_SUPPORTERS]),
  };
}
