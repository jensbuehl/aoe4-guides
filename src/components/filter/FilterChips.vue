<template>
  <div v-if="activeChips.length" ref="row" class="fl-chips-row mb-3">
    <!-- The whole chip removes its value, not just the small ✕, which stays as
         the cue for what a tap does. Removal only edits the draft, so a stray
         tap costs nothing until "Show N results" is pressed.
         The ✕ is an append icon rather than `closable`: Vuetify always renders
         a closable chip's ✕ as its own <button aria-label="Close">, which would
         be a second tab stop and a button inside this one. As an icon it is
         aria-hidden, the same $delete glyph at the same size and spacing. -->
    <v-chip
      v-for="(chip, index) in activeChips"
      :key="chip.field + chip.value"
      size="small"
      append-icon="$delete"
      role="button"
      :aria-label="`Remove filter: ${chip.label}`"
      :class="['fl-chip', { 'fl-chip--pending': dirtyFields[chip.field] }]"
      @click="remove(chip, index, $event)"
    >
      {{ chip.label }}
    </v-chip>
  </div>
</template>

<script>
import { computed, nextTick, ref } from "vue";
import { civs as allCivs } from "@/composables/filter/civDefaultProvider";
import { featuredCreators } from "@/composables/filter/featuredCreatorDefaultProvider";

export default {
  name: "FilterChips",
  emits: ["remove-chip", "emptied"],
  props: {
    draft:       { type: Object, required: true },
    dirtyFields: { type: Object, required: true },
    applied:     { type: Object, required: true },
    context:     { type: String, default: "default" },
  },
  setup(props, { emit }) {
    const civs = allCivs.value;
    const row = ref(null);
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

    // A removed chip takes keyboard focus with it, which would drop to <body>.
    // So focus moves to the chip that slid into its place (or the new last
    // one), and with none left the parent is told, since what comes next —
    // "Show N results" — is not ours. Pointer removals are left alone: moving
    // focus there would only paint a focus ring nobody asked for.
    const remove = (chip, index, event) => {
      emit("remove-chip", { field: chip.field, value: chip.value });
      if (!(event instanceof KeyboardEvent)) return;
      nextTick(() => {
        const chips = row.value?.querySelectorAll(".v-chip") ?? [];
        const next = chips[Math.min(index, chips.length - 1)];
        if (next) next.focus();
        else emit("emptied");
      });
    };

    return { activeChips, row, remove };
  },
};
</script>

<style scoped>
/* Row gap 18px: each chip's hit area overhangs 9px above and below (see
   .fl-chip::before), so wrapped rows need twice that to keep their overhangs
   from overlapping and a tap between rows from landing on the wrong chip. */
.fl-chips-row {
  display: flex;
  flex-wrap: wrap;
  gap: 18px 6px;
  align-items: center;
  min-height: 28px;
}

/* The chip is drawn 26px tall; its hit area is 44. v-chip clips its children
   (overflow: hidden), which would clip the overhang too — nothing else needs
   it, since the overlay and ripple carry their own radius and clipping, so the
   label alone keeps the clip in case a long name outgrows the row. */
.fl-chip {
  overflow: visible;
}

.fl-chip::before {
  content: "";
  position: absolute;
  inset: -9px 0;
}

.fl-chip :deep(.v-chip__content) {
  min-width: 0;
  overflow: hidden;
}

.fl-chip--pending {
  background: rgba(231, 192, 94, 0.16) !important;
  box-shadow: inset 0 0 0 1px rgb(var(--v-theme-primary)) !important;
}

.v-theme--light .fl-chip--pending {
  background: rgba(41, 71, 144, 0.12) !important;
}
</style>
