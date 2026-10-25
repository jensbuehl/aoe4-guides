<template>
  <!-- A season in a select's list, with its metadata on hover. Replacing the
       item slot drops the checkbox Vuetify draws for `multiple` selects, so it
       is drawn here again when `selected` is passed. -->
  <v-list-item v-bind="itemProps">
    <template v-if="selected !== null" #prepend>
      <v-checkbox-btn :model-value="selected" :ripple="false" tabindex="-1" />
    </template>
    <v-tooltip activator="parent" location="end" open-delay="300">
      <SeasonToolTip :title="title" />
    </v-tooltip>
  </v-list-item>
</template>

<script>
import SeasonToolTip from "@/components/common/SeasonToolTip.vue";

export default {
  name: "SeasonListItem",
  components: { SeasonToolTip },
  props: {
    // The slot's `props`, passed through unchanged.
    itemProps: { type: Object, required: true },
    title: { type: String, required: true },
    // true/false in a multiple select; null (default) in a single one.
    selected: { type: Boolean, default: null },
  },
};
</script>
