<template>
  <!-- A season in a select's list, with its metadata on hover, or its dates
       written under it where there is no hover. Replacing the item slot drops
       the checkbox Vuetify draws for `multiple` selects, so it is drawn here
       again when `selected` is passed. -->
  <v-list-item v-bind="itemProps" :subtitle="dates">
    <template v-if="selected !== null" #prepend>
      <v-checkbox-btn :model-value="selected" :ripple="false" tabindex="-1" />
    </template>
    <v-tooltip v-if="!dates" activator="parent" location="end" open-delay="300">
      <SeasonToolTip :title="title" />
    </v-tooltip>
  </v-list-item>
</template>

<script>
import { computed } from "vue";
import SeasonToolTip from "@/components/common/SeasonToolTip.vue";
import { getSeasonByTitle, seasonDateRange } from "@/composables/filter/seasonDefaultProvider";

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
  setup(props) {
    const canHover = window.matchMedia("(hover: hover)").matches;
    const dates = computed(() => {
      if (canHover) return undefined;
      const season = getSeasonByTitle(props.title);
      return season ? seasonDateRange(season) : undefined;
    });
    return { dates };
  },
};
</script>
