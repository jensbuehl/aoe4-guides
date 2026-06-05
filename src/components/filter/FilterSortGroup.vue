<template>
  <div class="fl-sortgroup">
    <v-divider class="mb-3" />
    <div class="fl-sortgroup-label mb-4">
      <v-icon color="primary">mdi-sort</v-icon>
      <span class="fl-header-label">Sort</span>
      <span v-if="dirty" class="fl-dot ml-1" />
    </div>
    <v-autocomplete
      class="hidden-xs"
      :model-value="modelValue"
      @update:model-value="$emit('update:modelValue', $event)"
      prepend-inner-icon="mdi-sort"
      density="compact"
      label="Order by"
      item-value="id"
      item-title="title"
      :items="sortOptions"
    ></v-autocomplete>
    <v-select
      class="hidden-sm-and-up"
      :model-value="modelValue"
      @update:model-value="$emit('update:modelValue', $event)"
      prepend-inner-icon="mdi-sort"
      density="compact"
      label="Order by"
      item-value="id"
      item-title="title"
      :items="sortOptions"
    ></v-select>
  </div>
</template>

<script>
export default {
  name: "FilterSortGroup",
  emits: ["update:modelValue"],
  props: {
    modelValue:  { type: String, default: null },
    dirty:       { type: Boolean, default: false },
    sortOptions: { type: Array, default: () => [] },
  },
};
</script>

<style scoped>
.fl-sortgroup-label {
  display: flex;
  align-items: center;
  gap: 6px;
}

.fl-header-label {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.fl-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: rgb(var(--v-theme-primary));
  flex-shrink: 0;
}
</style>
