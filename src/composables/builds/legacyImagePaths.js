/**
 * Rewrites the `.png` icon paths that pre-webp builds still carry.
 *
 * Icons were served as PNG until the switch to WebP. The stored documents were
 * never backfilled, so every build written before that switch still points at
 * `/assets/pictures/…/x.png` — a file that no longer exists. The conversion is
 * therefore a **read** concern: it has to run everywhere a build is rendered,
 * and it is not a migration. A converted build only stops carrying `.png` once
 * its own author saves it.
 *
 * Rich text lives under two differently-named keys. A step keeps its content in
 * `description`; a note keeps its in `gameplan` — and a note is an ordinary
 * entry in `section.steps`, so a loop over `description` alone walks straight
 * past it. That is what broke remixes: the section note used to live in
 * `section.gameplan`, which was converted, and migrateSectionNotes() moves it
 * into a note *item*, which was not. Opening a build in the editor — remixing
 * is one way to do that — turned every icon inside its notes into a broken
 * image, while the steps around them were fine.
 *
 * So: convert by *field*, over every entry, rather than by the shape a caller
 * happens to expect.
 */

/**
 * One rich-text field.
 *
 * @param {*} html - A description or note, or anything else.
 * @return {*} The converted string, or the input untouched when it is not one.
 */
export function withWebpPaths(html) {
  return typeof html === "string" ? html.replace(/\.png\b/gi, ".webp") : html;
}

/**
 * Converts a flat list of entries in place: steps, notes and blocks alike.
 *
 * Accepts both shapes an entry list comes in — the document's nested
 * alternatives block and the editor's flat marker form — because both carry
 * their paths under `paths`. Every path is converted, not only the active one:
 * the others are saved with the build and are one tab click from the reader.
 *
 * @param {Array} entries - A section's `steps`, or a flattened step list.
 * @return {Array} The same array.
 */
export function convertStepImagePaths(entries) {
  for (const entry of entries ?? []) {
    if (!entry) continue;

    //A block holds no text of its own; its steps sit one level down.
    if (entry.paths) {
      for (const path of entry.paths) convertStepImagePaths(path?.steps);
      continue;
    }

    if (entry.description != null) entry.description = withWebpPaths(entry.description);
    if (entry.gameplan != null) entry.gameplan = withWebpPaths(entry.gameplan);
  }
  return entries;
}

/**
 * Converts a whole build in place.
 *
 * Including `section.gameplan`, the section note from before notes had a
 * position: builds that have not been through the editor still store it there.
 *
 * Mutates, so hand it a copy unless the caller owns the array — the store's
 * cached build is read by views that never asked for a conversion.
 *
 * @param {Array} sections - The build's sections.
 * @return {Array} The same array.
 */
export function convertSectionImagePaths(sections) {
  for (const section of sections ?? []) {
    if (!section) continue;
    if (section.gameplan != null) section.gameplan = withWebpPaths(section.gameplan);
    convertStepImagePaths(section.steps);
  }
  return sections;
}