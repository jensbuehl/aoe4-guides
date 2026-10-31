<template>
  <div class="fl-footer">
    <v-btn
      v-if="isDirty"
      ref="applyBtn"
      block
      color="primary"
      variant="flat"
      class="mb-2"
      @click="$emit('apply')"
    >
      <template v-if="previewLoading">Counting…</template>
      <template v-else-if="previewCount !== null">
        Show {{ previewCount }} {{ previewCount === 1 ? "result" : "results" }}
      </template>
      <template v-else-if="appliedCount !== null">
        Show {{ appliedCount }} {{ appliedCount === 1 ? "result" : "results" }}
      </template>
      <template v-else>Apply filters</template>
    </v-btn>
    <div class="fl-count-line">
      <span v-if="appliedCount !== null">
        {{ appliedCount }} {{ appliedCount === 1 ? "build" : "builds" }}
      </span>
    </div>
  </div>
</template>

<script>
export default {
  name: "FilterApplyBar",
  emits: ["apply"],
  props: {
    isDirty:        { type: Boolean, default: false },
    appliedCount:   { type: Number,  default: null },
    previewCount:   { type: Number,  default: null },
    previewLoading: { type: Boolean, default: false },
  },
  methods: {
    // Focuses "Show N results" if it is showing; reports whether it was.
    focus() {
      const el = this.$refs.applyBtn?.$el;
      el?.focus();
      return !!el;
    },
  },
};
</script>

<style scoped>
.fl-footer {
  padding: 12px 16px 16px;
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.fl-count-line {
  font-size: 11px;
  text-align: center;
  color: rgba(var(--v-theme-on-surface), 0.45);
  min-height: 16px;
}
</style>
