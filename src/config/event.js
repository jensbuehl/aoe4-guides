// The current tournament announcement.
//
// Everything specific to *this* event lives here; everything true of *any*
// event banner — the eyebrow wording, the button labels, the layout — stays in
// EventBanner.vue. That line is the whole reason this file exists in the shape
// it does, so rotating to the next tournament is one file, and the component
// does not have to be read to find a value that went stale.
//
// It also has a second consumer, which is what forced the extraction in the
// first place: the banner hides itself with `v-if`, and a component hidden that
// way never mounts, so it cannot tell Home it is absent. Home asks isEventLive()
// directly to decide whether the contributor spotlight takes the slot.

export const EVENT = {
  title: "Deutschsprachige Meisterschaft",

  // Rendered as: "{before} <strong>{host}</strong>{after}". Split so the host
  // keeps its emphasis without markup living in a config string — an event with
  // no host sets `host` to null and puts the whole sentence in `before`.
  lead: {
    before: "The German-language AoE4 championship, hosted by",
    host: "AoE IV to Go",
    after:
      ". Open to players from Germany, Austria and Switzerland: 128 slots, 1v1, " +
      "cast live in German.",
  },

  // A self-contained logo with its own navy shield, so it reads on either theme
  // surface unchanged. Width and height are the file's intrinsic dimensions,
  // which reserve the space before it loads; the rendered size is CSS.
  badge: {
    src: "/assets/events/dm-2026.webp",
    width: 440,
    height: 621,
    alt: "Deutschsprachige Meisterschaft tournament badge",
  },

  // ───────────────────────────────────────────────────────────────────────────
  // THE NEXT THREE ARE ONE FACT IN TWO FORMS. Change the schedule and all three
  // change together — `dateLabel` is what a reader sees, `starts` and `ends` are
  // what the code acts on, and nothing checks that they agree. They were in
  // different files once; that is exactly how a banner ends up advertising one
  // date while disappearing on another.
  //
  // Both boundaries are compared in the browser's own zone. The event runs
  // 14:00 CEST, so a viewer west of Europe flips to "playing now" a few hours
  // late and a viewer east of it a few hours early — neither is worth carrying
  // a timezone library for.
  // ───────────────────────────────────────────────────────────────────────────
  dateLabel: "Oct 10–11 & 17–18, 2026 · 14:00 CEST",
  starts: new Date("2026-10-10T12:00:00Z"),
  // The day after the final day of play, so the banner carries the
  // announcement through the last match and then retires itself. The
  // contributor spotlight takes the slot back on that date with nothing to
  // edit — see isEventLive() below.
  //
  // This was once pulled back to 2026-08-19 to hand the slot to the spotlight
  // early, then restored on 2026-09-20 to re-run the announcement. Moving this
  // one date is the whole mechanism in either direction; there is no second
  // switch.
  ends: new Date("2026-10-19T00:00:00Z"),

  region: "DE · AT · CH",

  // Crowdfunded on Matcherino and only grows, hence the "+" — raise the figure
  // when it is worth re-advertising; it can never be too low with the plus on it.
  prizePool: "$800+",

  links: {
    signup:
      "https://www.start.gg/tournament/deutschsprachige-meisterschaft-dm-von-aoe-iv-to-go/details",
    liquipedia: "https://liquipedia.net/ageofempires/Deutschsprachige_Meisterschaft",
    matcherino: "https://matcherino.com/tournaments/201880/general",
    twitch: "https://www.twitch.tv/aoe4togo",
  },
};

/**
 * Whether the tournament has begun, for the banner's "playing now" wording.
 *
 * @param {Date} [now] - Injectable for testing; defaults to the current clock.
 * @return {boolean}
 */
export function hasEventStarted(now = new Date()) {
  return now >= EVENT.starts;
}

/**
 * Whether the event banner is still being shown.
 *
 * This is the predicate that decides who owns the top slot on the home page:
 * the banner renders while this is true, and the contributor spotlight takes
 * the position when it turns false. Nothing has to be edited for the handover —
 * the announcement expires on its own date and the spotlight moves up.
 *
 * To end the announcement early, move `EVENT.ends` into the past. That is the
 * whole mechanism; there is no second switch.
 *
 * @param {Date} [now] - Injectable for testing; defaults to the current clock.
 * @return {boolean}
 */
export function isEventLive(now = new Date()) {
  return now < EVENT.ends;
}
