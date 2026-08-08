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
  <v-menu
    location="bottom center"
    origin="top center"
    :offset="4"
    min-width="176"
    max-width="176"
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
        <v-tooltip v-if="option.disabled" location="end" :text="option.reason">
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
     * An entry that is disabled must carry a reason — the tooltip is the whole
     * point of showing it rather than dropping it.
     */
    options: { type: Array, required: true },
  },
  emits: ["select"],
};
</script>
