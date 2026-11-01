<template>
  <div class="civ-picker">
    <!-- header: matches sidebar card title style -->
    <div class="civ-picker-head">
      <div class="v-card-title pa-0 d-flex align-center">
        <v-icon size="small" class="mr-2" color="primary">mdi-flag-variant</v-icon>
        Pick Your Civilization
      </div>
      <!-- "Search" alone: the heading beside it already says what is searched,
           and the longer label was cut to "Search civi…" at phone width -->
      <v-text-field
        v-model="civFilter"
        label="Search"
        prepend-inner-icon="mdi-magnify"
        clearable
        variant="outlined"
        rounded="pill"
        density="compact"
        hide-details
        class="civ-search"
        color="primary"
      />
    </div>

    <!-- empty state when search matches nothing -->
    <v-alert
      v-if="filteredCivs.length === 0"
      type="info"
      color="primary"
      border="start"
      elevation="0"
      icon="mdi-information"
    >
      No civilizations match "{{ civFilter }}".
    </v-alert>

    <!-- A–Z list of rows, the name always beside its flag rather than on it.
         Names were unreadable over busy flags, and hover-only on desktop, which
         asked a reader to know every flag before they could pick a civ.
         The flag fades into the card exactly as it does in BuildListCard, so
         the civ list and the build lanes under it read as one design.
         Civs are static, so the list always renders immediately. -->
    <div v-else class="civ-grid">
      <v-card
        v-for="civ in filteredCivs"
        :key="civ.shortName"
        class="civ-row"
        flat
        rounded="lg"
        :to="civPageRoute(civ.shortName)"
      >
        <!-- decorative: the name sits right next to it -->
        <v-img
          class="civ-row__flag"
          :src="civ.flagLarge"
          :lazy-src="civ.flagSmall"
          :gradient="'to right, transparent 40%, ' + $vuetify.theme.current.colors.surface"
          cover
          alt=""
        />
        <span class="civ-row__name">{{ civ.title }}</span>
        <v-chip
          v-if="isNew(toDateSafe(recentCivBuilds.find((r) => r.civ === civ.shortName)?.timeCreated))"
          size="x-small"
          color="accent"
          variant="flat"
          class="civ-row__new"
        >
          NEW
        </v-chip>
      </v-card>
    </div>
  </div>
</template>

<script>
import { ref, computed } from "vue";
import useTimeSince, { toDateSafe } from "@/composables/useTimeSince";
import { civPageRoute } from "@/composables/filter/civDefaultProvider";

export default {
  name: "CivPicker",
  props: {
    civs: { type: Array, required: true },
    recentCivBuilds: { type: Array, required: true },
  },
  setup(props) {
    const { isNew } = useTimeSince();
    const civFilter = ref("");

    const filteredCivs = computed(() => {
      if (!civFilter.value) return props.civs;
      const q = civFilter.value.toLowerCase();
      return props.civs.filter(
        (civ) =>
          civ.title.toLowerCase().includes(q) ||
          civ.shortName.toLowerCase().includes(q) ||
          (civ.tagLine && civ.tagLine.toLowerCase().includes(q))
      );
    });

    return {
      toDateSafe, civFilter, filteredCivs, isNew, civPageRoute };
  },
};
</script>

<style scoped>
.civ-picker {
  margin-bottom: 8px;
}

/* header — flush with Season 13 card border; title uses Vuetify's .v-card-title class directly */
.civ-picker-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px 18px;
  flex-wrap: wrap;
  padding: 0 0 12px;
}

/* the min-width makes the field wrap under the heading on narrow phones,
   rather than shrinking beside it until its label reads "S…" */
.civ-search {
  max-width: 320px;
  min-width: 112px;
  flex: 1;
}

/* grid — two columns at 360px, and as many as fit from there:
   3 at md, 4 at lg, 5 at xl in the home page's 8/12 column */
.civ-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 6px;
}

@media (min-width: 600px) {
  .civ-grid { gap: 8px; }
}

/* row — 44px is the touch-target floor; two lines of name fit inside it */
.civ-row {
  display: flex;
  align-items: center;
  min-height: 44px;
  overflow: hidden;
  text-decoration: none;
}

@media (min-width: 600px) {
  .civ-row { min-height: 52px; }
}

.civ-row:focus-visible {
  outline: 3px solid rgb(var(--v-theme-primary));
  outline-offset: 2px;
}

/* flag — a fixed width, so every name starts at the same x and the column
   reads as a list; it stretches to the row's height through the flex */
.civ-row__flag {
  flex: 0 0 56px;
  align-self: stretch;
}

@media (min-width: 600px) {
  .civ-row__flag { flex-basis: 72px; }
}

/* name — the build cards' title colour and weight; at most two lines, which
   every civ needs at 360px, and an ellipsis rather than a third */
.civ-row__name {
  flex: 1;
  min-width: 0;
  padding: 4px 8px 4px 6px;
  color: rgb(var(--v-theme-primary));
  font-weight: 700;
  font-size: 13px;
  line-height: 1.2;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

@media (min-width: 600px) {
  .civ-row__name { font-size: 14px; }
}

/* NEW badge — sits on the flag, where it costs the name no width */
.civ-row__new {
  position: absolute;
  top: 4px;
  left: 4px;
  z-index: 1;
  pointer-events: none;
}
</style>
