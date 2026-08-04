<template>
  <!--
    Compact age timings for space-constrained surfaces: the list card at xs/sm,
    where these replace the season and map chips, and the details timeline at xs,
    where they stand in for the track. Only ages the build actually reaches get a
    chip — unlike the desktop rail, there is no room here for placeholder rows.
  -->
  <v-chip
    v-for="row in rows"
    :key="row.age"
    class="mr-1 mt-1"
    label
    :size="size"
    :variant="row.timing.derived ? 'outlined' : undefined"
  >
    <img :src="row.crest" alt="" width="13" height="13" class="mr-1 agechip-crest" />
    <span aria-hidden="true"
      >{{ row.timing.derived ? "~" : "" }}{{ formatAgeTime(row.timing.seconds) }}</span
    >
    <span class="agechip-sr">{{ row.label }}</span>
  </v-chip>
</template>

<script>
//External
import { computed } from "vue";

//Composables
import {
  AGE_DISPLAY,
  formatAgeTime,
  ageTimingLabel,
} from "@/composables/builds/useAgeTimings.js";

export default {
  name: "AgeChips",
  props: {
    /** Derived age timings: [{ age, seconds, derived }] */
    timings: { type: Array, default: () => [] },
    size: { type: String, default: "x-small" },
  },
  setup(props) {
    const rows = computed(() =>
      AGE_DISPLAY.map((display) => {
        const timing = props.timings.find((item) => item.age === display.age) ?? null;
        return timing ? { ...display, timing, label: ageTimingLabel(display, timing) } : null;
      }).filter(Boolean)
    );

    return { rows, formatAgeTime };
  },
};
</script>

<style scoped>
.agechip-crest {
  object-fit: contain;
  flex-shrink: 0;
}

/* Keeps the spoken label out of the layout without hiding it from readers */
.agechip-sr {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
