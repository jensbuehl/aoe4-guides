<template>
  <div
    class="drop-zone rounded-lg d-flex flex-column align-center justify-center ga-3 pa-6"
    :class="{ 'drop-zone--active': isDragging }"
    role="button"
    tabindex="0"
    @click="input.click()"
    @keydown.enter="input.click()"
    @dragover.prevent="isDragging = true"
    @dragleave.prevent="isDragging = false"
    @drop.prevent="onDrop"
  >
    <slot>
      <v-icon size="40" :color="isDragging ? 'primary' : 'medium-emphasis'">
        {{ isDragging ? 'mdi-tray-arrow-down' : icon }}
      </v-icon>
      <!-- eslint-disable-next-line vue/no-v-html -->
      <p class="text-body-2 text-medium-emphasis text-center" v-html="label" />
    </slot>
    <p v-if="hint" class="text-caption text-medium-emphasis text-center">{{ hint }}</p>
    <input
      ref="input"
      type="file"
      :accept="accept"
      :multiple="multiple"
      class="d-none"
      @change="onChange"
    />
  </div>
</template>

<script>
import { ref } from "vue";

export default {
  name: "FileDropZone",
  props: {
    accept: { type: String, default: "*" },
    label: { type: String, default: "Drop a file here or <u>click to browse</u>" },
    hint: { type: String, default: "" },
    icon: { type: String, default: "mdi-cloud-upload-outline" },
    multiple: { type: Boolean, default: false },
  },
  emits: ["files"],
  setup(props, { emit }) {
    const isDragging = ref(false);
    const input = ref(null);

    function onDrop(e) {
      isDragging.value = false;
      if (e.dataTransfer.files.length) emit("files", e.dataTransfer.files);
    }

    function onChange(e) {
      if (e.target.files.length) emit("files", e.target.files);
    }

    return { isDragging, input, onDrop, onChange };
  },
};
</script>

<style scoped>
.drop-zone {
  border: 2px dashed rgba(var(--v-border-color), var(--v-border-opacity));
  min-height: 160px;
  cursor: pointer;
  transition: border-color 0.15s, background-color 0.15s;
}
.drop-zone:hover,
.drop-zone--active {
  border-color: rgb(var(--v-theme-primary));
  background-color: rgba(var(--v-theme-primary), 0.06);
}
</style>
