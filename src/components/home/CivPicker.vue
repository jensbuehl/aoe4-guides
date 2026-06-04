<template>
  <div class="civ-picker">
    <!-- header: matches sidebar card title style -->
    <div class="civ-picker-head">
      <div class="v-card-title pa-0 d-flex align-center">
        <v-icon size="small" class="mr-2" color="primary">mdi-flag-variant</v-icon>
        Pick Your Civilization
      </div>
      <v-text-field
        v-model="civFilter"
        label="Search civilizations"
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

    <!-- tile grid — civs are static so always rendered immediately -->
    <div v-else class="civ-grid">
      <v-card
        v-for="civ in filteredCivs"
        :key="civ.shortName"
        class="civ-tile"
        flat
        :to="{ name: 'Dashboard', query: { civ: civ.shortName } }"
        :aria-label="civ.title"
      >
        <v-img
          class="civ-tile__img"
          :src="civ.flagLarge"
          :lazy-src="civ.flagSmall"
          cover
          :alt="civ.title"
        >
          <template #placeholder>
            <v-skeleton-loader type="image" height="100%" width="100%" />
          </template>
        </v-img>
        <span class="civ-tile__overlay">
          <span class="civ-tile__name">{{ civ.title }}</span>
        </span>
        <v-chip
          v-if="isNew(recentCivBuilds.find((r) => r.civ === civ.shortName)?.timeCreated.toDate())"
          size="x-small"
          color="accent"
          class="civ-tile__new"
        >
          <v-icon start size="x-small">mdi-alert-decagram</v-icon>NEW
        </v-chip>
      </v-card>
    </div>
  </div>
</template>

<script>
import { ref, computed } from "vue";
import useTimeSince from "@/composables/useTimeSince";

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

    return { civFilter, filteredCivs, isNew };
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
  gap: 18px;
  flex-wrap: wrap;
  padding: 0 0 12px;
}

.civ-search {
  max-width: 320px;
  flex: 1;
}

/* grid */
.civ-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
}

@media (max-width: 1080px) {
  .civ-grid { grid-template-columns: repeat(4, 1fr); }
}

@media (max-width: 720px) {
  .civ-grid { grid-template-columns: repeat(3, 1fr); }
}

/* tile */
.civ-tile {
  position: relative;
  aspect-ratio: 16 / 10;
  border-radius: 12px !important;
  overflow: hidden;
  display: block;
  text-decoration: none;
}

/* flag image fills tile absolutely — prevents v-img's own sizing from conflicting */
.civ-tile__img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

/* focus ring */
.civ-tile:focus-visible {
  outline: 3px solid rgb(var(--v-theme-primary));
  outline-offset: 2px;
}

/* name overlay
   visibility:hidden is the primary guard — discrete property, never animates on initial render,
   so the name never flickers visible when tiles first appear. */
.civ-tile__overlay {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: flex;
  align-items: flex-end;
  padding: 8px 10px;
  visibility: hidden;
  opacity: 0;
  background: linear-gradient(
    to top,
    rgba(var(--v-theme-background), 0.92) 5%,
    rgba(var(--v-theme-background), 0.25) 55%,
    transparent 80%
  );
  pointer-events: none;
  /* hide: fade out then snap visibility hidden after fade completes */
  transition: opacity 0.15s, visibility 0s 0.15s;
}

@media (prefers-reduced-motion: reduce) {
  .civ-tile__overlay { transition: none; }
}

/* reveal: show visibility instantly, then fade opacity in */
.civ-tile:hover .civ-tile__overlay,
.civ-tile:focus-visible .civ-tile__overlay {
  visibility: visible;
  opacity: 1;
  transition: opacity 0.15s, visibility 0s;
}

@media (prefers-reduced-motion: reduce) {
  .civ-tile:hover .civ-tile__overlay,
  .civ-tile:focus-visible .civ-tile__overlay {
    transition: none;
  }
}

/* always visible on touch/small screens */
@media (max-width: 720px) {
  .civ-tile__overlay {
    visibility: visible;
    opacity: 1;
    transition: none;
  }
}

.civ-tile__name {
  color: rgb(var(--v-theme-primary));
  font-weight: 700;
  font-size: 12.5px;
  line-height: 1.2;
}

/* NEW badge */
.civ-tile__new {
  position: absolute;
  top: 7px;
  right: 7px;
  z-index: 2;
}
</style>
