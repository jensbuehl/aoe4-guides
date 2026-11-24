<template>
  <!--The header row of every build-page card (Description, Timeline, Build
      Order, Video, …) and of the rails under them. One component rather than
      pasted markup: the rule below is scoped, so a pasted copy of the class in
      another component rendered unstyled, and there were seven pastes.

      Layout lives in the rule, not in d-flex/px-4/ga-2 utility classes, so a
      caller can still hide it responsively (`class="d-none d-md-flex"`): two
      !important display utilities on one element are decided by stylesheet
      order, not by intent. Listeners and classes fall through to the root.-->
  <div class="build-card-section-header">
    <v-icon size="16" color="accent" :icon="icon"></v-icon>
    <span class="section-header-label text-caption text-uppercase font-weight-bold text-truncate">{{
      label
    }}</span>
    <!--Trailing controls: a toggle, a chevron, buttons. They bring their own
        alignment (ml-auto, or a v-spacer before them).-->
    <slot />
  </div>
</template>

<script>
export default {
  name: "SectionHeader",
  props: {
    icon: { type: String, required: true },
    label: { type: String, required: true },
  },
};
</script>

<style scoped>
.build-card-section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 16px;
  letter-spacing: 0.05em;
  height: 36px;
}

/* A long civ or author name in a rail header truncates instead of wrapping
   (spec 046 FR-015). min-width: 0 lets a flex item shrink below its text. */
.section-header-label {
  min-width: 0;
}
</style>
