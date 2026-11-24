<template>
  <!--The exit after a short list of builds: Home's lanes, and the rails under a
      build (spec 046). It sits after the list, not above it: it is the answer
      to "I have seen these", so offering it before the first card asks the
      reader to decide something they cannot decide yet.

      Full width only below md: a thumb needs the whole row as a target, a
      pointer does not, and a block button on desktop hovers a slab far wider
      than the thing that looks clickable. `rounded="lg"` matches BuildListCard,
      so the hovered surface on mobile has the shape of the cards above it
      rather than the button default.

      The label truncates rather than wraps, for "View all by <a long name>".
      min-width: 0 lets it shrink inside the button's flex content.-->
  <div class="d-flex justify-center mt-1">
    <v-btn
      variant="text"
      color="primary"
      :block="smAndDown"
      rounded="lg"
      height="38"
      :to="to"
      append-icon="mdi-chevron-right"
      class="view-all-button"
    >
      <span class="text-truncate" style="min-width: 0">{{ label }}</span>
    </v-btn>
  </div>
</template>

<script>
import { useDisplay } from "vuetify";

export default {
  name: "ViewAllButton",
  props: {
    to: { type: [String, Object], required: true },
    label: { type: String, default: "View all" },
  },
  setup() {
    const { smAndDown } = useDisplay();
    return { smAndDown };
  },
};
</script>

<style scoped>
/* A natural-width button grows with its label; bound it so a long label
   truncates instead of overflowing the column. */
.view-all-button {
  max-width: 100%;
}
.view-all-button :deep(.v-btn__content) {
  min-width: 0;
}
</style>
