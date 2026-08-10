import { hasVisibleContent } from "@/composables/builds/stepVisibility";

/**
 * Moves a section's own note into its steps, where notes have lived since 027.
 *
 * `section.gameplan` is the note from before notes had a position: one per
 * section, drawn at the foot of it. A note *item* is `{ gameplan }` inside
 * `steps` — the shape addNote() inserts — so appending is position-preserving:
 * the foot of the section is exactly where the old renderer drew it. The
 * section editor assigns the `_id` on mount; it is a client-side v-for key and
 * is never persisted, so seeding one here would only invent a second source.
 *
 * **Call this from the editor only.** Focus mode reads section notes itself and
 * folds them into the preceding step, carrying real history — the empty-note
 * guard, the separator that only appears between two things, the steps[-1]
 * crash. Converting on read for every reader would flip that for every build at
 * once. Called where a build is opened for editing, each build crosses over
 * when its own author next saves it, and the viewer keeps reading what is
 * actually stored until then.
 *
 * @param {Array} sections - The build's sections. Mutated in place.
 * @return {void}
 */
export function migrateSectionNotes(sections) {
  for (const section of sections ?? []) {
    if (!section?.gameplan) continue;

    //An author who typed a note and deleted it leaves "<br>" behind, which is
    //truthy and says nothing. That must not become a note item — an empty note
    //row is a blank card the reader counts — but the field is still cleared, so
    //"no saved build has a visible section note" becomes true of every build
    //the editor has touched, not only of the ones that had something to move.
    if (hasVisibleContent(section.gameplan)) {
      section.steps = [...(section.steps ?? []), { gameplan: section.gameplan }];
    }

    //The half that matters. Leave it set and the note renders twice: once as
    //the new item, once from the section-note renderer that is still there.
    section.gameplan = "";
  }
}
