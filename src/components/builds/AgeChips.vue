<template>
  <!--
    Compact age timings for space-constrained surfaces: the list card at xs/sm,
    where these replace the season and map chips, and the details timeline at xs,
    where they stand in for the track. Only ages the build actually reaches get a
    chip — unlike the desktop rail, there is no room here for placeholder rows.

    Every chip wears the same quiet neutral fill; only the text says whether the
    time was measured or worked out — accent against muted, the pair the build
    order already uses for its timestamps.

    This used to be outline-versus-fill, which did two unhelpful things at once:
    it read as "different" rather than as "less certain", and it set a stark
    filled chip beside outlined ones, which on a list card competed with the
    build title above it.
  -->
  <v-chip
    v-for="row in rows"
    :key="row.age"
    class="mr-1 mt-1 agechip"
    label
    variant="tonal"
    :size="size"
  >
    <img
      :src="row.crest"
      alt=""
      width="13"
      height="13"
      :class="['mr-1', 'agechip-crest', { 'agechip-crest--derived': row.timing.derived }]"
    />
    <span
      aria-hidden="true"
      :class="row.timing.derived ? 'agechip-time--derived' : 'agechip-time'"
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
/* Vuetify's tonal fill is --v-activated-opacity (0.12), which is loud for three
   chips sitting under a build title. Dialled to the app's quiet fill by
   overriding that variable on the chip rather than by reaching into
   .v-chip__underlay — the knob is Vuetify's own, so nothing here depends on an
   internal class name surviving an upgrade. */
.agechip {
  --v-activated-opacity: var(--derived-fill-opacity);
}

.agechip-crest {
  object-fit: contain;
  flex-shrink: 0;
}

/* Accent against muted, matching .ts-text / .ts-text--derived in the build
   order. Carried on the text rather than on the chip's fill: three chips sit
   under a build title on the list card, and a filled one there competes with
   the title for the eye. */
.agechip-time {
  color: rgb(var(--v-theme-accent));
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.agechip-time--derived {
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}

.agechip-crest--derived {
  opacity: 0.55;
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
