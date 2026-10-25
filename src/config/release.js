// The current expansion announcement — the same arrangement as event.js: what
// is specific to *this* release lives here, how an announcement looks lives in
// ReleaseBanner.vue and HomeBanner.vue. Rotating to the next DLC is this file.
//
// Home asks isReleaseLive() to decide the top slot: a running tournament comes
// first, then this, then the contributor spotlight.

export const RELEASE = {
  title: "Raiders of the North",

  lead:
    "Two new civilizations, the Vikings and the Scots, an expanded Crucible with co-op, " +
    "mutators and four new missions, and two new biomes.",

  // Short codes from civDefaultProvider; the flags and taglines come from there.
  civs: [
    { code: "VIK", page: "https://www.ageofempires.com/games/age-of-empires-iv/civilizations/vikings/" },
    { code: "SCO", page: "https://www.ageofempires.com/games/age-of-empires-iv/civilizations/scots/" },
  ],

  // ───────────────────────────────────────────────────────────────────────────
  // ONE FACT IN TWO FORMS, as in event.js: `dateLabel` is what a reader sees,
  // `releases` is what flips the wording from pre-order to available. Change
  // one, change both. 10:00 PT is when Age IV releases usually go live; a few
  // hours off either way only means the wording flips early or late.
  // ───────────────────────────────────────────────────────────────────────────
  dateLabel: "Out Oct 29, 2026",
  releases: new Date("2026-10-29T17:00:00Z"),
  // Four weeks of "available now", then the spotlight takes the slot back with
  // nothing to edit. Move this one date to end it early or run it longer.
  ends: new Date("2026-11-26T00:00:00Z"),

  links: {
    steam: "https://store.steampowered.com/app/4336170/Age_of_Empires_IV_Raiders_of_the_North/",
    xbox: "https://www.xbox.com/en-us/games/store/age-of-empires-iv-raiders-of-the-north/9mzxplnlct5f",
    trailer: "https://www.youtube.com/watch?v=7NPJPZX896Y",
    reddit: "https://www.reddit.com/r/aoe4/comments/1wtkyht/megathread_preorder_raiders_of_the_north/",
  },
};

/**
 * Whether the expansion is out, for the banner's pre-order/available wording.
 *
 * @param {Date} [now] - Injectable for testing; defaults to the current clock.
 * @return {boolean}
 */
export function isReleased(now = new Date()) {
  return now >= RELEASE.releases;
}

/**
 * Whether the expansion banner is still shown. False hands the top slot to
 * the contributor spotlight — move `RELEASE.ends` to change when.
 *
 * @param {Date} [now] - Injectable for testing; defaults to the current clock.
 * @return {boolean}
 */
export function isReleaseLive(now = new Date()) {
  return now < RELEASE.ends;
}
