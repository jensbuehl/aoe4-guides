// Community funding: what a year of running this site costs, how much of it the
// community has covered, and who covered it.
//
// ─────────────────────────────────────────────────────────────────────────────
// NO PER-PERSON AMOUNT MAY EVER BE STORED IN THIS FILE.
//
// This module is bundled and delivered to every visitor's browser, so anything
// written here is public whether or not a template renders it. "We never
// display it" draws the line at the wrong place — the bundle is the boundary.
// The per-person breakdown lives on the Ko-fi dashboard, which already holds
// it. This file records WHO, and one total. Never HOW MUCH, per person, ever,
// including in a comment.
//
// The same rule is why an anonymous supporter has no name here at all rather
// than a name marked hidden.
// ─────────────────────────────────────────────────────────────────────────────
//
// The monthly routine is in
// .specify/specs/036-community-funding-transparency/quickstart.md — it is two
// edits in one commit, and it can be done from github.com without a checkout.

/**
 * The year being counted, what it costs, and what has come in towards it.
 *
 * `year` is rolled over BY HAND. It is deliberately not derived from the clock:
 * an automatic rollover would empty the goal at midnight on 1 January, erasing
 * a year of visible progress with nobody having decided to, and looking for all
 * the world like a bug.
 *
 * `coveredEur` is the one figure here that is not derived from anything, which
 * makes it the one that can be wrong. UPDATE IT IN THE SAME EDIT AS
 * `SUPPORTERS` BELOW — its agreement with that list is a convention, not
 * something the code can enforce. Never "I'll update the number later".
 */
export const FUNDING = {
  year: 2026,
  //The infrastructure only: hosting, domain and storage. Deliberately NOT the
  //development tooling, which roughly doubles the real figure — that is stated
  //as where any surplus goes instead.
  //
  //Two reasons. A server bill is unarguable, and a goal is not the place to
  //open a debate about AI spend at the exact moment you are asking for money.
  //And a smaller target is reachable: reaching it is the entire emotional
  //payoff of this design, and €10 reads very differently against €100 than
  //against €180.
  //
  //Whatever this figure contains, the card must name all of it. It currently
  //reads "hosting, domain and storage" — if the composition changes, that
  //sentence changes with it. A specific list that quietly omits an item is
  //worse than a vague one, because the specificity is what earns the trust.
  costPerYearEur: 100,
  //TODO: set from the Ko-fi payout total received during `year`.
  coveredEur: 10,
};

/**
 * Everyone who has contributed during `FUNDING.year`. One entry per person,
 * however often they gave.
 *
 * Shape: { name?: string, anonymous?: true }
 *
 * - `name`      as it appears on the Ko-fi dashboard. Present ONLY where that
 *               contribution was public there — a private tipper gave money,
 *               not permission to be listed.
 * - `anonymous` marks an entry that deliberately has no name, so the supporter
 *               count stays right without revealing who they are.
 *
 * No site account is referenced, and none can be: nothing maps a Ko-fi identity
 * to a site user. Supporters are recognised by name on the About page, which
 * needs no such mapping and no conversation with anyone.
 */
export const SUPPORTERS = [ 
  { name: "Björn" },
  { name: "Elmstrukk" },
];

/**
 * Contributed in an earlier year. Names alone — there is nothing to count here,
 * only to thank.
 *
 * This list grows at each rollover and never shrinks. It is what stops the wall
 * from appearing to lose people every January.
 */
export const EARLIER_SUPPORTERS = [
  //TODO BEFORE DEPLOYING — these names go on a public page:
  //  1. Check each one's public/private flag on the Ko-fi dashboard and replace
  //     any private contribution with { anonymous: true }. Someone who tipped
  //     privately gave money, not permission to be listed.
  //  2. Move anyone who contributed during FUNDING.year into SUPPORTERS, and
  //     set FUNDING.coveredEur to the net total received from that group.
  //  3. Check whether "louis" is the "Louis" already credited in the code
  //     contributors list on About — the same person under two spellings reads
  //     as carelessness.
  { name: "Yukgaejang" },
  { name: "louis" },
  { name: "CrackedyHere" },
  { name: "hy" },
  { name: "znmto" },
  { name: "Strateg" },
  { name: "Andy" },
  { name: "2WayPettingZoo" },
  { name: "acr" },
  { name: "Clemens" },
  { name: "Snoober" },
  { name: "Respectthejeff" },
  { name: "Gothic_Brother" },
  { name: "Beale" },
  { name: "Anonymous" },
];

/**
 * Where the support action points.
 *
 * One link, because Ko-fi now presents the whole choice on one page: €2, €5 or
 * €10, each as a one-off or monthly. Splitting that into two buttons here would
 * only pre-empt a decision the destination already asks better.
 *
 * A plain outbound link, deliberately. Ko-fi's floating action button and
 * overlay widget are not used and must not be added: that is a context-free
 * donation button on every page — the exact thing this feature removes three of
 * — and it cannot opt out of the pages that matter, so it would float over
 * build orders and over focus mode. It also fails closed behind an ad blocker,
 * where a link does not.
 */
export const KOFI_URL = "https://ko-fi.com/jensbuehl";

/** The amounts Ko-fi offers, stated so the ask is concrete before the click. */
export const KOFI_TIERS = "€2, €5 or €10 — one-off or monthly";
