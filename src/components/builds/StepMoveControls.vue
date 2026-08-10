<template>
  <!--Always drawn, disabled at the ends of the build rather than removed. A
      control that vanishes on some cards makes the action row a different width
      on each one, and "not from here" is an answer where an absent button is
      silence.-->
  <v-btn
    size="x-small"
    variant="text"
    icon
    class="step-move-btn-xs"
    :disabled="!up"
    :aria-label="`Move this ${kind} up`"
    @click="$emit('move', -1)"
  ><v-icon>mdi-arrow-up</v-icon></v-btn>
  <v-btn
    size="x-small"
    variant="text"
    icon
    class="step-move-btn-xs"
    :disabled="!down"
    :aria-label="`Move this ${kind} down`"
    @click="$emit('move', 1)"
  ><v-icon>mdi-arrow-down</v-icon></v-btn>
</template>

<script>
/**
 * The phone's pair of move buttons, for one card.
 *
 * Its own component because a step card and a note card carry an identical pair
 * and there is no third variant coming — this is the duplication the project's
 * first principle says to wait for and then remove, not to anticipate.
 *
 * Deliberately knows nothing about reordering. It is told whether each direction
 * is available and says which one was pressed; where the entry then goes, and
 * whether that crosses a section or a merge line, belongs to the section editor
 * and the coordinator behind it.
 *
 * The desktop grip stayed inline rather than joining it here: that control also
 * carries a template ref the section editor needs in order to return focus to a
 * moved row, and forwarding a ref through a wrapper costs more machinery than
 * the twelve lines it would save.
 */
export default {
  name: "StepMoveControls",
  props: {
    /** Whether moving up would do anything. */
    up: { type: Boolean, default: false },
    /** Whether moving down would do anything. */
    down: { type: Boolean, default: false },
    /** What the entry is, so the buttons can name what they move. */
    kind: { type: String, default: "step" },
  },
  emits: ["move"],
};
</script>

<style scoped>
/* No size of its own, deliberately. `size="x-small"` + `icon` is what the icon
   picker and the ✕ beside it use, and that resolves to a 32px circle — 20px of
   button height plus Vuetify's 12px at default density. Pinning a width here
   made these two 26px, so their hover circle was visibly smaller than every
   other control on the card. The row is nominally 28px and all three overflow
   it equally; matching the neighbours matters more than fitting the number.

   No colour, and 0.6 opacity, because that is what `.step-remove-xs` does.
   These are card controls — what happens *to* the card — so they belong to the
   ✕'s family, not the picker's. The picker is accent-coloured because it puts
   something *into* the card, which is a different kind of act. */
.step-move-btn-xs {
  opacity: 0.6;
  flex-shrink: 0;
}
.step-move-btn-xs:disabled {
  opacity: 0.22;
}
</style>
