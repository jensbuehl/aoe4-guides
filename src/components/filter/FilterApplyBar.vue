<template>
  <div class="fl-footer">
    <v-btn
      v-if="isDirty"
      ref="applyBtn"
      block
      color="primary"
      variant="flat"
      :class="{ 'mb-2': showCount || blockedReason }"
      :disabled="!!blockedReason"
      @click="$emit('apply')"
    >
      <!-- No count while blocked: a preview from before the draft grew too
           large would be a number for a different selection. -->
      <template v-if="blockedReason">Apply filters</template>
      <template v-else-if="previewLoading">Counting…</template>
      <template v-else-if="previewCount !== null">
        Show {{ previewCount }} {{ previewCount === 1 ? "result" : "results" }}
      </template>
      <template v-else-if="appliedCount !== null">
        Show {{ appliedCount }} {{ appliedCount === 1 ? "result" : "results" }}
      </template>
      <template v-else>Apply filters</template>
    </v-btn>
    <p v-if="isDirty && blockedReason" class="fl-blocked-line" role="status">{{ blockedReason }}</p>
    <div v-if="showCount" class="fl-count-line">
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
    // Off where a list header already states the count beside this card.
    showCount:      { type: Boolean, default: true },
    // Set when the draft cannot be applied (spec 045 FR-017): the button is
    // disabled and this line says why.
    blockedReason:  { type: String,  default: "" },
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
/* One more row in the field stack, not a footer of its own: the last
   field's details area above gives the same gap the fields have between
   them, so neither a rule nor top padding is needed. */
.fl-footer {
  padding: 0 16px 16px;
}

/* Same size and alignment as the count line, in the theme's error tone. */
.fl-blocked-line {
  margin: 0;
  font-size: 11px;
  text-align: center;
  color: rgb(var(--v-theme-error));
}

.fl-count-line {
  font-size: 11px;
  text-align: center;
  color: rgba(var(--v-theme-on-surface), 0.45);
  min-height: 16px;
}
</style>
