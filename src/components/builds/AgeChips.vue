<template>
  <!--
    Compact age timings for space-constrained surfaces: the list card at xs/sm,
    where these replace the season and map chips, and the details timeline at xs,
    where they stand in for the track. Only ages the build actually reaches get a
    chip — unlike the desktop rail, there is no room here for placeholder rows.

    A measured time carries the accent tint and reads in full-strength text; a
    worked-out one drops to a quiet neutral fill and muted text. Same pair the
    build order's timestamp pills use directly below these on a phone.

    The accent is the background, never the text. At #CCAA55 on this surface
    gold type lands near 1.85:1, well under the 4.5:1 AA floor — as a tint
    behind full-strength text it says the same thing and stays readable.

    This used to be outline-versus-fill, which did two unhelpful things at once:
    it read as "different" rather than as "less certain", and it set a stark
    filled chip beside outlined ones, which on a list card competed with the
    build title above it.
  -->
  <v-chip
    v-for="row in rows"
    :key="row.age"
    class="mr-1 mt-1"
    :class="{ 'agechip--derived': row.timing.derived }"
    label
    variant="tonal"
    :size="size"
    :color="row.timing.derived ? undefined : 'accent'"
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
/* A worked-out time gets the app's quiet neutral fill instead of Vuetify's
   tonal default. Dialled by overriding the variable the underlay already reads
   rather than by reaching into .v-chip__underlay, so nothing here depends on an
   internal class name surviving an upgrade.

   A measured time keeps the full 0.12, matching the accent-tinted timestamp
   pill in the build order below. */
.agechip--derived {
  --v-activated-opacity: var(--derived-fill-opacity);
}

.agechip-crest {
  object-fit: contain;
  flex-shrink: 0;
}

/* Primary rather than accent, and rather than plain on-surface.

   Accent is gold in both themes, so on the light surface it lands near 1.85:1
   against a 4.5:1 AA floor. On-surface passes easily but reads as hard black on
   a card, competing with the build title. Primary is the only one of the three
   that changes with the theme — navy on light (~8:1), gold on dark (~5.8:1) —
   so it is both readable and quiet in each. Overrides the colour Vuetify sets
   from the chip's accent colour prop. */
.agechip-time {
  color: rgb(var(--v-theme-primary));
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
