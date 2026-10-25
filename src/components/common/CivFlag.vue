<template>
  <!-- Decorative: the civ name always sits next to it, so no alt text -->
  <img v-if="src" :src="src" alt="" class="civ-flag" width="24" height="14" />
</template>

<script>
import { computed } from "vue";
import { getCivById } from "@/composables/filter/civDefaultProvider";

/**
 * The small flag of a civilization, sized to sit in front of its name in a
 * list or select. Takes the civ's short name (e.g. "VIK").
 */
export default {
  name: "CivFlag",
  props: { civ: { type: String, required: true } },
  setup(props) {
    const src = computed(() => getCivById(props.civ)?.flagSmall ?? null);
    return { src };
  },
};
</script>

<style scoped>
.civ-flag {
  object-fit: cover;
  border-radius: 2px;
  flex-shrink: 0;
  vertical-align: middle;
}
</style>
