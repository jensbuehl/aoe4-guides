/**
 * Build search on the device (spec 043, research R4).
 *
 * Pure: no Vue, no `@/` imports, so `npm run check:search` runs it in plain
 * Node. The civ list is passed in rather than imported for the same reason.
 *
 * How a query matches:
 * - Every query word must match the build (AND, any order) — in its title, its
 *   author's name, or its civ (code, full name, aliases).
 * - A Latin word matches a word PREFIX: "cast" finds "castle", "astle" does not.
 * - A word with any non-Latin letter matches a SUBSTRING, because Chinese and
 *   Japanese titles have no spaces to split words on ("手推车" is inside
 *   "法国手推车背鹿").
 * - Only when fewer than `limit` builds match exactly, words of five letters or
 *   more also match title words one edit away ("catsle" → "castle").
 * - Case and accents never matter.
 *
 * How results are ordered: by the worst-matching word's tier, then builds of a
 * civ the query names, then the Trending score the index is already sorted by.
 */

export const RESULT_LIMIT = 20;
export const AUTHOR_LIMIT = 3;
/** Fuzzy matching applies only to query words at least this long. */
const FUZZY_MIN_LENGTH = 5;
/** A civ's full name matches on a prefix only from this length ("eng" → English). */
const CIV_PREFIX_MIN_LENGTH = 3;
/** Words of civ names too common to mean the civ. */
const CIV_STOP_WORDS = new Set(["the", "and"]);

/** Tiers, best first. Exported for the check. */
export const TIER = { TITLE_START: 0, TITLE_WORD: 1, PREFIX: 2, SUBSTRING: 3, FUZZY: 4 };

const COMBINING_MARK = /\p{M}/gu;
const WORD_CHAR = /[\p{L}\p{N}]/u;
const LATIN_WORD = /^[a-z0-9'’-]+$/;

/**
 * Lowercase, accents removed: "Éco" → "eco".
 *
 * @param {string} text
 * @return {string}
 */
export function normalise(text) {
  return String(text ?? "")
    .normalize("NFKD")
    .replace(COMBINING_MARK, "")
    .toLowerCase();
}

/**
 * Normalises a title one character at a time, remembering where each output
 * character came from, so a match in the normalised text can be highlighted in
 * the original. ("ﬁ" becomes two characters; both point back at it.)
 *
 * @param {string} title
 * @return {{text: string, origin: number[]}}
 */
function normaliseWithOrigin(title) {
  let text = "";
  const origin = [];
  let offset = 0;
  for (const char of String(title ?? "")) {
    const n = normalise(char);
    for (let i = 0; i < n.length; i++) origin.push(offset);
    text += n;
    offset += char.length;
  }
  origin.push(offset);
  return { text, origin };
}

/**
 * Splits normalised text into words with their positions.
 *
 * @param {string} text
 * @return {Array<{w: string, start: number}>}
 */
function words(text) {
  const out = [];
  let start = -1;
  for (let i = 0; i <= text.length; i++) {
    const isWordChar = i < text.length && WORD_CHAR.test(text[i]);
    if (isWordChar && start < 0) start = i;
    if (!isWordChar && start >= 0) {
      out.push({ w: text.slice(start, i), start });
      start = -1;
    }
  }
  return out;
}

/**
 * Prepares a downloaded index for searching. Done once per page session.
 *
 * @param {{v: number, generated: string, authors: Array, builds: Array}} raw
 * @param {Array<{shortName: string, title: string, slug?: string, aliases?: string[]}>} civList
 * @return {Object} prepared index
 */
export function prepare(raw, civList) {
  const civs = new Map();
  for (const civ of civList ?? []) {
    // "Any Civilization" is a filter value, not a civ: it contributes no words,
    // so "english" never returns a build for any civ (spec US2 #4).
    if (civ.shortName === "ANY") continue;
    // Short words of a civ's name ("of", "the", the "d" of d'Arc, the "s" of
    // Xi's) would make "the" return every Order of the Dragon build. Codes and
    // aliases are kept whole: they are chosen on purpose.
    const titleWords = words(normalise(civ.title))
      .map((word) => word.w)
      .filter((w) => w.length >= CIV_PREFIX_MIN_LENGTH && !CIV_STOP_WORDS.has(w));
    const nameWords = [
      normalise(civ.shortName),
      ...titleWords,
      ...(civ.aliases ?? []).flatMap((alias) => words(normalise(alias)).map((word) => word.w)),
    ];
    civs.set(civ.shortName, {
      code: civ.shortName,
      title: civ.title,
      slug: civ.slug ?? null,
      codeN: normalise(civ.shortName),
      titleWords,
      aliases: (civ.aliases ?? []).map(normalise),
      words: nameWords,
      count: 0,
    });
  }

  const authors = raw.authors.map(([uid, name]) => ({
    uid,
    name,
    words: words(normalise(name)).map((word) => word.w),
    nameN: normalise(name),
    count: 0,
  }));

  const entries = raw.builds.map((row) => {
    // Positions as in functions/builds/searchIndex.js.
    const [id, title, authorIndex, civ, season, score, feudalSeconds, feudalEstimated, castleSeconds, castleEstimated] = row;
    const author = authors[authorIndex] ?? { name: "", words: [], nameN: "" };
    author.count++;
    const civInfo = civs.get(civ) ?? null;
    if (civInfo) civInfo.count++;
    const { text, origin } = normaliseWithOrigin(title);
    const titleWords = words(text);
    const otherWords = [...author.words, ...(civInfo ? civInfo.words : [])];
    return {
      id,
      title,
      titleN: text,
      origin,
      titleWords,
      otherWords,
      hay: [text, author.nameN, civInfo ? normalise(`${civInfo.code} ${civInfo.title}`) : ""].join(" "),
      authorIndex,
      civ,
      season,
      score,
      feudalSeconds: feudalSeconds ?? null,
      feudalEstimated: feudalEstimated === 1,
      castleSeconds: castleSeconds ?? null,
      castleEstimated: castleEstimated === 1,
    };
  });

  return { generatedAt: new Date(raw.generated), authors, civs, entries };
}

/**
 * Damerau–Levenshtein distance of at most one, with early exits.
 *
 * @param {string} a
 * @param {string} b
 * @return {boolean}
 */
export function withinOneEdit(a, b) {
  if (a === b) return true;
  const la = a.length;
  const lb = b.length;
  if (Math.abs(la - lb) > 1) return false;
  let i = 0;
  while (i < la && i < lb && a[i] === b[i]) i++;
  if (la === lb) {
    // One substitution, or one swap of neighbours ("catsle" ↔ "castle").
    if (a.slice(i + 1) === b.slice(i + 1)) return true;
    return a[i] === b[i + 1] && a[i + 1] === b[i] && a.slice(i + 2) === b.slice(i + 2);
  }
  // One insertion or deletion.
  return la > lb ? a.slice(i + 1) === b.slice(i) : a.slice(i) === b.slice(i + 1);
}

/**
 * Best match of one query word in one build.
 *
 * @return {{tier: number, range: [number, number]|null}|null} range is in the
 *   normalised title, when the word matched there.
 */
function matchWord(entry, q, latin, fuzzy) {
  if (latin) {
    let best = null;
    for (const { w, start } of entry.titleWords) {
      if (w === q) return { tier: TIER.TITLE_WORD, range: [start, start + w.length] };
      if (!best && w.startsWith(q)) best = { tier: TIER.PREFIX, range: [start, start + q.length] };
    }
    if (best) return best;
    if (entry.otherWords.some((w) => w.startsWith(q))) return { tier: TIER.PREFIX, range: null };
    if (fuzzy && q.length >= FUZZY_MIN_LENGTH) {
      for (const { w, start } of entry.titleWords) {
        if (withinOneEdit(w, q)) return { tier: TIER.FUZZY, range: [start, start + w.length] };
      }
    }
    return null;
  }
  const at = entry.titleN.indexOf(q);
  if (at >= 0) return { tier: TIER.SUBSTRING, range: [at, at + q.length] };
  return entry.hay.includes(q) ? { tier: TIER.SUBSTRING, range: null } : null;
}

/** Ranges in the normalised title → ranges in the original, merged and sorted. */
function toOriginalRanges(entry, ranges) {
  const mapped = ranges
    .filter(Boolean)
    .map(([s, e]) => [entry.origin[s], entry.origin[e]])
    .sort((a, b) => a[0] - b[0]);
  const merged = [];
  for (const range of mapped) {
    const last = merged[merged.length - 1];
    if (last && range[0] <= last[1]) last[1] = Math.max(last[1], range[1]);
    else merged.push(range);
  }
  return merged;
}

/** The civ a query names, if any: exact code or alias first, then a name prefix. */
function findCiv(prepared, queryWords) {
  let prefixHit = null;
  for (const q of queryWords) {
    for (const civ of prepared.civs.values()) {
      if (civ.codeN === q || civ.aliases.includes(q)) return civ;
      if (!prefixHit && q.length >= CIV_PREFIX_MIN_LENGTH && civ.titleWords.some((w) => w.startsWith(q))) {
        prefixHit = civ;
      }
    }
  }
  return prefixHit;
}

/**
 * Searches a prepared index.
 *
 * @param {Object} prepared - From prepare().
 * @param {string} query
 * @param {{hiddenIds?: Set<string>, limit?: number}} [options] - hiddenIds are
 *   builds this device's author has unlisted or deleted since the index was
 *   generated; they are never returned.
 * @return {{civ: Object|null, authors: Array, builds: Array, total: number}}
 */
export function search(prepared, query, { hiddenIds = new Set(), limit = RESULT_LIMIT } = {}) {
  const empty = { civ: null, authors: [], builds: [], total: 0 };
  const full = normalise(query).trim().replace(/\s+/g, " ");
  if (full.length < 2) return empty;
  const queryWords = full.split(" ").filter(Boolean);
  const latin = queryWords.map((q) => LATIN_WORD.test(q));

  const civ = findCiv(prepared, queryWords);

  const run = (fuzzy) => {
    const hits = [];
    for (const entry of prepared.entries) {
      if (hiddenIds.has(entry.id)) continue;
      let tier = 0;
      const ranges = [];
      let matched = true;
      for (let i = 0; i < queryWords.length; i++) {
        const m = matchWord(entry, queryWords[i], latin[i], fuzzy);
        if (!m) {
          matched = false;
          break;
        }
        tier = Math.max(tier, m.tier);
        ranges.push(m.range);
      }
      if (!matched) continue;
      if (entry.titleN.startsWith(full)) tier = TIER.TITLE_START;
      hits.push({ entry, tier, ranges });
    }
    return hits;
  };

  let hits = run(false);
  if (hits.length < limit && queryWords.some((q, i) => latin[i] && q.length >= FUZZY_MIN_LENGTH)) {
    hits = run(true);
  }

  // The index arrives sorted by score; sort is stable, so equal keys keep it.
  hits.sort((a, b) => {
    if (a.tier !== b.tier) return a.tier - b.tier;
    if (civ) {
      const ac = a.entry.civ === civ.code ? 0 : 1;
      const bc = b.entry.civ === civ.code ? 0 : 1;
      if (ac !== bc) return ac - bc;
    }
    return b.entry.score - a.entry.score;
  });

  const builds = hits.slice(0, limit).map(({ entry, tier, ranges }) => ({
    entry,
    tier,
    ranges: toOriginalRanges(entry, ranges),
  }));

  // An author is offered when the query names them: a query word starts one of
  // the words of their name, and either every word does or they have a build
  // among the matches. "kestrel" offers Kestrel; "rus kestrel fc" does too, as
  // long as Kestrel has a matching build; "fast" offers nobody called Fastidious
  // unless they wrote a fast build.
  const matchedAuthors = new Set(hits.map((hit) => hit.entry.authorIndex));
  const authors = prepared.authors
    .map((author, index) => ({ ...author, index }))
    .filter((author) => {
      const named = queryWords.map((q, i) =>
        latin[i] ? author.words.some((w) => w.startsWith(q)) : author.nameN.includes(q)
      );
      if (!named.some(Boolean)) return false;
      return named.every(Boolean) || matchedAuthors.has(author.index);
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, AUTHOR_LIMIT)
    .map(({ uid, name, count, index }) => ({ uid, name, count, index }));

  return {
    civ: civ ? { code: civ.code, title: civ.title, slug: civ.slug, count: civ.count } : null,
    authors,
    builds,
    total: hits.length,
  };
}
