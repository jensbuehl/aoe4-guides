<template>
  <v-dialog
    :model-value="modelValue"
    :max-width="maxWidth"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <v-card rounded="lg">
      <v-card-title class="d-flex align-center justify-space-between pt-5 px-6 pb-1">
        <slot name="title">
          <div class="d-flex align-center ga-3">
            <v-icon v-if="titleIcon" color="primary">{{ titleIcon }}</v-icon>
            <span>{{ title }}</span>
          </div>
        </slot>
        <v-btn icon="mdi-close" variant="text" size="small" @click="$emit('update:modelValue', false)" />
      </v-card-title>
      <slot />
      <v-card-actions class="px-6 pb-5">
        <v-spacer />
        <slot name="actions" />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  name: "PickerDialog",
  props: {
    modelValue: { type: Boolean, required: true },
    title: { type: String, default: "" },
    titleIcon: { type: String, default: null },
    maxWidth: { type: [Number, String], default: 540 },
  },
  emits: ["update:modelValue"],
};
</script>
