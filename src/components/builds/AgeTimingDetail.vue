<template>
  <!-- One age's figures, in the desktop crest's tooltip and in the Timeline's
       Details on a device without hover: the only place the two pops can be
       compared, so both are named beside the moment each belongs to. -->
  <div class="agett">
    <div class="agett-title font-weight-bold">{{ name }}</div>
    <template v-if="age.clickUp">
      <span>Clicked up</span>
      <b
        >{{ age.clickUp.derived ? "~" : "" }}{{ formatAgeTime(age.clickUp.seconds)
        }}<span v-if="age.clickUpVillagers" class="agett-pop"> · {{ age.clickUpVillagers }} vils</span></b
      >
    </template>
    <span>Reached</span>
    <b
      >{{ age.derived ? "~" : "" }}{{ formatAgeTime(age.seconds)
      }}<span v-if="age.villagers" class="agett-pop"> · {{ age.villagers }} vils</span></b
    >
    <template v-if="age.clickUp">
      <span>Age-up took</span>
      <b>{{ formatAgeTime(age.clickUp.duration) }}</b>
    </template>
    <div v-if="age.derived || age.clickUp?.derived" class="agett-note text-caption">{{ footnote }}</div>
  </div>
</template>

<script>
import { formatAgeTime } from "@/composables/builds/useAgeTimings.js";

export default {
  name: "AgeTimingDetail",
  props: {
    // One getAgeTimings() entry.
    age: { type: Object, required: true },
    name: { type: String, default: "" },
    footnote: { type: String, default: "" },
  },
  setup() {
    return { formatAgeTime };
  },
};
</script>

<style scoped>
/* Label left, time right — a two-column grid so the times line up under each
   other rather than trailing whatever the label's width happens to be */
.agett {
  display: grid;
  grid-template-columns: auto auto;
  column-gap: 18px;
  row-gap: 1px;
  align-items: baseline;
}

.agett-title,
.agett-note {
  grid-column: 1 / -1;
}

.agett b {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.agett-note {
  opacity: 0.7;
  margin-top: 2px;
}

/* Rides on the time it belongs to rather than claiming a row of its own: the
   pair is one fact — "at this moment, this many" — and splitting it across two
   rows is how the crest below came to state a time and a count from two
   different instants. Set back so the times still read as the column. */
.agett-pop {
  font-weight: 400;
  opacity: 0.72;
}
</style>
