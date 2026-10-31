<template>
  <!-- The activator is the caller's: an insert line in the desktop table, a
       divider between mobile cards and an empty section's button all look
       nothing like each other, and each one's styling belongs with the layout
       it sits in. Only the menu is shared. -->
  <!-- Width pinned on the menu, not on the list inside it. v-menu takes its
       min-width from the activator the way a select does, and this activator is
       a full-width insert line — so the list's own min-width never got a say and
       the menu spanned the table. -->
  <!-- Centred under the activator, because the activator is a full-width insert
       line whose only visible part is the pill in the middle of it. Anchored to
       "bottom" alone the menu opens at the far left of the table, nowhere near
       the button that was clicked. -->
  <!-- Wider without hover, where a refused entry carries its reason as a
       second line: at 176px the prepend column leaves the text about 90px, and
       every reason was cut to two words. One width for every menu on the
       device, whether or not this one refuses anything, so the menus do not
       change size from one divider to the next. -->
  <v-menu
    location="bottom center"
    origin="top center"
    :offset="4"
    :min-width="menuWidth"
    :max-width="menuWidth"
  >
    <!-- isActive is passed through so the caller can hold its activator in the
         open state. The insert line only appears on hover, and opening the menu
         moves the pointer onto the menu itself — so without this the line and
         its button vanish the instant they are used. -->
    <template v-slot:activator="{ props: menu, isActive }">
      <slot name="activator" :props="menu" :is-open="isActive"></slot>
    </template>
    <!-- Narrow on purpose (design frame 05): four short labels, no sentences.
         A menu this size reads as a choice of item kind rather than as a page of
         commands. -->
    <v-list density="compact">
      <template v-for="option in options" :key="option.value">
        <!-- Shown disabled with the reason rather than hidden. A menu whose
             entries come and go teaches nothing: an author who cannot age up
             here should learn *why*, not wonder where the entry went. The
             wrapper exists because a disabled v-list-item fires no pointer
             events, so the tooltip would never open on the item itself. -->
        <!-- Without hover the reason is written under the label instead. A
             tooltip there is not merely late but absent: Vuetify ignores the
             mouseenter a tap synthesises, so on a phone the entry was greyed out
             with no way to learn why. Inline only where it has to be — with a
             pointer the menu keeps its four short lines.

             Refused by aria-disabled and by having no action, not by the
             `disabled` prop: that dims the whole item with an opacity no child
             can undo, and took the reason it exists to show down with it — under
             4.5:1 in the light theme. Only the icon and label are dimmed (CSS).
             The tap is stopped so the menu stays open: a reader who taps the
             greyed entry is the one reading why, and closing the menu on them
             would take the reason away mid-sentence. -->
        <v-list-item
          v-if="option.disabled && !canHover"
          aria-disabled="true"
          class="ins-refused"
          :title="option.title"
          :subtitle="option.reason"
          :link="false"
          @click.stop
        >
          <template v-slot:prepend>
            <v-icon :icon="option.icon" size="small"></v-icon>
          </template>
        </v-list-item>
        <!-- Content as a slot rather than :text, and coloured, because that is
             what every other tooltip in the app does. The `text` prop leaves the
             label at its inherited colour, which on this theme is dark type on
             the tooltip's own light surface — legible in neither theme, and the
             only tooltip in the codebase that had the problem. -->
        <v-tooltip v-else-if="option.disabled" location="end">
          <span :style="{ color: $vuetify.theme.current.colors.primary }">{{
            option.reason
          }}</span>
          <template v-slot:activator="{ props: tip }">
            <div v-bind="tip">
              <v-list-item disabled :title="option.title">
                <template v-slot:prepend>
                  <v-icon :icon="option.icon" size="small"></v-icon>
                </template>
              </v-list-item>
            </div>
          </template>
        </v-tooltip>
        <v-list-item v-else :title="option.title" @click="$emit('select', option.value)">
          <template v-slot:prepend>
            <v-icon :icon="option.icon" color="accent" size="small"></v-icon>
          </template>
          <!-- The shortcut, taught where somebody is already inserting by hand.
               Only the entries that have one carry it; an entry with no hint
               leaves the space empty rather than saying "none". -->
          <template v-if="option.hint" v-slot:append>
            <span class="ins-shortcut">{{ option.hint }}</span>
          </template>
        </v-list-item>
      </template>
    </v-list>
  </v-menu>
</template>

<script>
export default {
  name: "StepInsertMenu",
  props: {
    /**
     * What can be inserted here, in the order offered:
     * `{ value, title, icon, disabled?, reason? }`.
     *
     * An entry that is disabled must carry a reason — saying why is the whole
     * point of showing it rather than dropping it.
     */
    options: { type: Array, required: true },
  },
  emits: ["select"],
  setup() {
    // Read once, as YoutubeGuides does: whether a tooltip can be opened here at
    // all. Decides between the reason on hover and the reason written out.
    const canHover = window.matchMedia("(hover: hover)").matches;
    return { canHover, menuWidth: canHover ? 176 : 248 };
  },
};
</script>

<style scoped>
/* A hint, not a second label: it has to be legible when looked for and ignorable
   when not, so it recedes by weight rather than by hiding. Tabular figures keep
   "Alt ↵" and "Alt N" the same width, so the column does not shimmer as the
   pointer moves down the list. */
.ins-shortcut {
  font-size: 10.5px;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.02em;
  opacity: 0.55;
  white-space: nowrap;
}
/* A refused entry on touch: the icon and label at Vuetify's disabled opacity for
   list items (0.6, as the desktop entries render it), the reason left out of it.
   A little above a subtitle's medium emphasis: the light theme's medium is 0.6
   on text already at 0.87, which measured 4.26:1 on the menu at caption size,
   and the reason is the one line here that has to be read. Not high emphasis,
   which is 1 in the dark theme and put the reason above the entry's own label
   and level with the choices that work. 0.75 clears 4.5:1 in both. Wrapped rather
   than clamped to the list's one line, since a cut-off reason says nothing;
   caption size so it reads as a note on the entry, not as a second entry.
   `:link="false"` keeps the item from taking the hover fill and ripple of a
   choice. */
.ins-refused :deep(.v-list-item__prepend),
.ins-refused :deep(.v-list-item-title) {
  opacity: 0.6;
}
.ins-refused :deep(.v-list-item-subtitle) {
  -webkit-line-clamp: unset;
  white-space: normal;
  font-size: 0.75rem;
  line-height: 1.3;
  padding-top: 2px;
  --v-list-item-subtitle-opacity: 0.75;
}
/* Only where there is a keyboard to press them on — which a page cannot ask
   about, so a fine pointer stands in for one. A phone has neither, and "Alt ↵"
   there names a key that does not exist. Not the handheld test the Play button
   uses (usePlayTargetPreference): an iPad with a trackpad keyboard is a
   handheld, and Option + Return works on it. */
@media not all and (any-pointer: fine) {
  .ins-shortcut {
    display: none;
  }
}
</style>
