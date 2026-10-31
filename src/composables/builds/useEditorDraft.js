import { toDateSafe } from "@/composables/useTimeSince";

/**
 * Unsaved editor work, kept on this device so a killed tab does not lose it.
 *
 * A phone OS discards a background tab without asking, and `onBeforeRouteLeave`
 * never runs for that — the page is simply gone. So while the editor holds
 * unsaved work, a copy of it sits in localStorage and is offered back the next
 * time the same build is opened.
 *
 * The key carries the signed-in user and the build: `new` for a build that has
 * never been saved, its id otherwise. The user is part of it because a device
 * is sometimes shared — one person's half-written build must not be offered to
 * whoever signs in next. Nothing here is ever sent anywhere.
 *
 * Every storage access is guarded. Private windows, blocked site data and a full
 * quota all throw, and none of them may stop the author from editing; the only
 * thing lost then is the safety net.
 */
const KEY_PREFIX = "aoe4-guides-editor-draft";

//Long enough that a run of keystrokes is one write, short enough that a tab
//killed right after a change still has it. The visibility and unload handlers
//in the editor flush early for the case that matters most.
const WRITE_DELAY_MS = 800;

/**
 * What the author edits, and so what a draft holds and a restore writes back.
 *
 * Deliberately not the whole document. Counters, timestamps and authorship are
 * the server's; a draft from yesterday that carried them would roll back today's
 * views and votes the moment it was restored and published. `steps` is the
 * sections array as the editor emits it — alternatives blocks with their paths,
 * and notes, are entries inside it, so storing the tree whole keeps every path,
 * including the ones the author did not have open.
 */
const DRAFT_FIELDS = [
  "title",
  "description",
  "video",
  "creatorId",
  "creatorName",
  "civ",
  "map",
  "season",
  "strategy",
  "remixOf",
  "steps",
];

/**
 * The storage key for one user's draft of one build.
 *
 * @param {string|undefined} uid - The signed-in user.
 * @param {string|null} buildId - The build's id, or null for an unsaved build.
 * @return {string|null} The key, or null when there is no user to own it.
 */
export function draftKey(uid, buildId) {
  return uid ? `${KEY_PREFIX}:${uid}:${buildId ?? "new"}` : null;
}

function contentOf(build) {
  const content = {};
  for (const field of DRAFT_FIELDS) {
    if (build?.[field] !== undefined) content[field] = build[field];
  }
  return content;
}

//A comparison of content, so two things that are not content are left out.
//`_id` is the v-for key a section editor stamps on each entry when it mounts.
//Key order is the other: sealing an alternatives block rebuilds it as
//{kind, paths} while the stored block reads {paths, kind}, so merely tapping
//into a step would otherwise offer the unchanged build back to its author.
function serialise(content) {
  return JSON.stringify(content, (key, value) => {
    if (key === "_id") return undefined;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      return Object.fromEntries(Object.keys(value).sort().map((k) => [k, value[k]]));
    }
    return value;
  });
}

//FNV-1a. Only ever compared with itself, so it needs to be stable, not strong.
function hash(text) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16);
}

/**
 * A fingerprint of what the author can edit in a build.
 *
 * Stored with a draft as the version it was started from. Content rather than
 * `timeUpdated`, because the build cache keeps the timestamp the build was
 * *read* with — a save writes its stamp onto a copy — so an author who
 * publishes and edits again without reloading carries a stale stamp, and a
 * stamp comparison would accuse their own save of being someone else's.
 *
 * @param {Object} build - A build.
 * @return {string} The fingerprint.
 */
export function contentHash(build) {
  return hash(serialise(contentOf(build)));
}

function read(key) {
  if (!key) return null;
  try {
    const draft = JSON.parse(localStorage.getItem(key));
    return draft?.content && typeof draft.savedAt === "number" ? draft : null;
  } catch {
    return null;
  }
}

function remove(key) {
  if (!key) return;
  try {
    localStorage.removeItem(key);
  } catch {
    // Unwritable storage held nothing to remove.
  }
}

/**
 * Decides whether a stored draft is worth offering against the build as loaded.
 *
 * Nothing is offered when the draft says nothing new: it matches what was
 * loaded, or it was started from an older version and saved before the stored
 * build was (published since, on this device or another — that version wins
 * and the draft is dropped). When the stored
 * build has changed since the draft was started, the offer says so, because
 * restoring would replace that change once published.
 *
 * @param {Object|null} draft - From read().
 * @param {Object} loaded - The build as opened, before any edit.
 * @return {{ savedAt: number, title: string, conflict: boolean, content: Object }|null}
 */
function assess(draft, loaded) {
  if (!draft) return null;

  const loadedHash = contentHash(loaded);
  if (hash(serialise(draft.content)) === loadedHash) return null;

  //Started from the version that is stored now, so nothing has been saved
  //over it and it is offered whatever the clocks say. `savedAt` is this
  //device's clock and `timeUpdated` the saving device's; one running behind
  //would otherwise delete a draft that is plainly the newest work there is.
  const onCurrentVersion = Boolean(draft.baseHash) && draft.baseHash === loadedHash;

  //Only a draft started from an older version is judged by time: saved
  //before the stored build, it lost to that save and is dropped.
  const storedAt = toDateSafe(loaded?.timeUpdated)?.getTime() ?? 0;
  if (!onCurrentVersion && draft.savedAt <= storedAt) return null;

  return {
    savedAt: draft.savedAt,
    title: draft.content.title ?? "",
    //A build that was never stored has no other version to collide with: a new
    //build's starting point is a blank form or whatever was just imported.
    conflict: Boolean(storedAt && draft.baseHash) && !onCurrentVersion,
    content: draft.content,
  };
}

/**
 * The editor's draft for one build.
 *
 * `key` is read whenever it is needed rather than fixed at creation, so the
 * owner is whoever is signed in at the time of the write.
 *
 * @param {Object} options
 * @param {() => string|null} options.key - The storage key, from draftKey().
 * @param {() => Object} options.build - The working build.
 * @param {() => boolean} options.unsaved - Whether there is work to protect.
 * @return {Object} The draft's operations.
 */
export default function useEditorDraft({ key, build, unsaved }) {
  let timer = null;
  let baseHash = null;

  /**
   * Reads the stored draft and says whether to offer it.
   *
   * Call this before the first write: the stored draft and the work about to be
   * protected share one key, so the first save replaces what is being asked
   * about. The editor keeps the answer in memory, which is why an offer that
   * is still on screen can be restored after the author has edited on.
   *
   * @param {Object} loaded - The build as opened, before any edit.
   * @return {Object|null} The offer, or null when there is nothing to offer.
   */
  const check = (loaded) => {
    baseHash = contentHash(loaded);
    const draft = read(key());
    const offer = assess(draft, loaded);
    if (draft && !offer) remove(key());
    return offer;
  };

  /** Writes the working build now. */
  const save = () => {
    clearTimeout(timer);
    timer = null;
    const k = key();
    if (!k || !build() || !unsaved()) return;
    try {
      localStorage.setItem(
        k,
        JSON.stringify({ savedAt: Date.now(), baseHash, content: contentOf(build()) })
      );
    } catch {
      // Full or blocked: editing carries on, only the safety net is missing.
    }
  };

  /** Writes the working build once edits pause. */
  const schedule = () => {
    clearTimeout(timer);
    timer = setTimeout(save, WRITE_DELAY_MS);
  };

  /**
   * Writes a scheduled save straight away.
   *
   * For the moments a page may not get another chance to run: hidden, or
   * unloading. A frozen tab runs no timers, so the debounce would otherwise
   * hold the last edits back exactly when they need to be on disk.
   */
  const flush = () => {
    if (timer) save();
  };

  /** Forgets the draft — the work was published, saved, or thrown away. */
  const clear = () => {
    clearTimeout(timer);
    timer = null;
    remove(key());
  };

  return { check, save, schedule, flush, clear };
}
