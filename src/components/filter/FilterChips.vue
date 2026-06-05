<template>
  <div v-if="activeChips.length" class="fl-chips-row mb-3">
    <v-chip
      v-for="chip in activeChips"
      :key="chip.field + chip.value"
      size="small"
      closable
      :class="['fl-chip', { 'fl-chip--pending': dirtyFields[chip.field] }]"
      @click:close="$emit('remove-chip', { field: chip.field, value: chip.value })"
    >
      {{ chip.label }}
    </v-chip>
  </div>
</template>

<script>
import { computed } from "vue";
import { civs as allCivs } from "@/composables/filter/civDefaultProvider";
import { featuredCreators } from "@/composables/filter/featuredCreatorDefaultProvider";

export default {
  name: "FilterChips",
  emits: ["remove-chip"],
  props: {
    draft:       { type: Object, required: true },
    dirtyFields: { type: Object, required: true },
    applied:     { type: Object, required: true },
    context:     { type: String, default: "default" },
  },
  setup(props) {
    const civs = allCivs.value;
    const creators = featuredCreators;

    const activeChips = computed(() => {
      const chips = [];
      const d = props.draft;
      if (d.civs && props.context !== "civ-locked") {
        const civ = civs.find((c) => c.shortName === d.civs);
        chips.push({ field: "civs", value: d.civs, label: civ?.title ?? d.civs });
      }
      if (d.creator) {
        const creator = creators.find((c) => c.creatorId === d.creator);
        chips.push({
          field: "creator",
          value: d.creator,
          label: creator?.creatorDisplayTitle ?? creator?.creatorTitle ?? d.creator,
        });
      }
      (d.seasons || []).forEach((v) => chips.push({ field: "seasons", value: v, label: v }));
      (d.maps || []).forEach((v) => chips.push({ field: "maps", value: v, label: v }));
      (d.strategies || []).forEach((v) => chips.push({ field: "strategies", value: v, label: v }));
      return chips;
    });

    return { activeChips };
  },
};
</script>

<style scoped>
.fl-chips-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  min-height: 28px;
}

.fl-chip--pending {
  background: rgba(231, 192, 94, 0.16) !important;
  box-shadow: inset 0 0 0 1px rgb(var(--v-theme-primary)) !important;
}

.v-theme--light .fl-chip--pending {
  background: rgba(41, 71, 144, 0.12) !important;
}
</style>
