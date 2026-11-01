<template>
  <!-- Stands in for Vote and Favorite until the reader's favorites document has
       answered. Same height either way: it is what holds the phone's action row
       open, and a row that came and went would move the steps under the reader. -->
  <div class="baf d-flex align-center">
    <template v-if="failed">
      <span class="baf-text">Your votes could not be loaded.</span>
      <v-btn variant="text" color="primary" size="small" :loading="retrying" @click="$emit('retry')">Try again</v-btn>
    </template>
    <!-- The real buttons, disabled, rather than an empty strip: a slow read then
         looks like something on its way. Hidden from assistive tech, since they
         say nothing that the real ones won't a moment later. -->
    <template v-else>
      <v-btn v-for="icon in icons" :key="icon" :icon="icon" variant="text" color="accent" disabled aria-hidden="true"></v-btn>
    </template>
  </div>
</template>

<script>
const icons = ["mdi-thumb-up-outline", "mdi-thumb-down-outline", "mdi-heart-outline"];

export default {
  name: "BuildActionsFallback",
  props: {
    failed: { type: Boolean, default: false },
    retrying: { type: Boolean, default: false },
  },
  emits: ["retry"],
  setup() {
    return { icons };
  },
};
</script>

<style scoped>
.baf {
  min-height: 48px;
  gap: 4px;
}

.baf-text {
  /* The row's left edge is the icon buttons' box; their glyphs, and the header's
     text above, start 8px in. */
  padding-inline-start: 8px;
  font-size: 0.8125rem;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
}
</style>
