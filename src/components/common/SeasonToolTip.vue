<template>
  <!-- Built like IconToolTip, so a season reads the same as an icon on hover:
       title in the primary colour, details below. -->
  <span v-if="season" :style="{ color: $vuetify.theme.current.colors.primary }">
    <v-card-title class="ma-0 pa-0">{{ season.title }}</v-card-title>
    <v-card-text class="ma-0 pa-0" style="max-width: 300px">
      <div v-if="season.tagline" class="font-weight-bold">{{ season.tagline }}</div>
      <div>{{ dateRange }}<span v-if="current"> · current season</span></div>
      <div v-if="season.expansion">Expansion: {{ season.expansion }}</div>
    </v-card-text>
  </span>
</template>

<script>
import { computed } from "vue";
import {
  getSeasonByTitle,
  seasonEndDate,
  isSeasonCurrent,
} from "@/composables/filter/seasonDefaultProvider";

const md = (d) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
const mdy = (d) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

/**
 * Season metadata for a tooltip: tagline, dates and the expansion released
 * during it. Takes the season title a build stores ("Season 13").
 */
export default {
  name: "SeasonToolTip",
  props: { title: { type: String, required: true } },
  setup(props) {
    const season = computed(() => getSeasonByTitle(props.title));
    const dateRange = computed(() => {
      const s = season.value;
      if (!s) return "";
      const end = seasonEndDate(s);
      if (!end) return `Since ${mdy(s.startDate)}`;
      // "May 7 – Aug 31, 2026", the year once when both ends share it
      return s.startDate.getFullYear() === end.getFullYear()
        ? `${md(s.startDate)} – ${mdy(end)}`
        : `${mdy(s.startDate)} – ${mdy(end)}`;
    });
    const current = computed(() => !!season.value && isSeasonCurrent(season.value));
    return { season, dateRange, current };
  },
};
</script>
