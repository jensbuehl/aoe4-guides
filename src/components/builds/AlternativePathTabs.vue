<template>
  <div class="alt-bar">
    <!--One box per tab, holding either the name or the field that edits it. Same
        container either way, so switching to rename cannot change the tab's
        width — and the controls keep their place whether or not the tab is the
        open one, so activating a tab does not resize it either.-->
    <div
      v-for="(path, pathIndex) in paths"
      :key="'p' + pathIndex"
      :class="['alt-tab', pathIndex === active && 'alt-tab--active']"
      @click="$emit('select', pathIndex)"
    >
      <input
        v-if="renaming && pathIndex === active"
        ref="titleField"
        type="text"
        class="alt-tab-field"
        :size="Math.max(10, (path.title || '').length + 1)"
        :value="path.title"
        @input="$emit('title', $event.target.value)"
        @keyup.enter="$emit('done')"
        @keyup.esc="$emit('done')"
        @blur="$emit('done')"
        @click.stop
      />
      <span v-else class="alt-tab-label">{{ path.title }}</span>
      <span v-if="!readonly" class="alt-tab-actions">
        <v-icon size="13" @click.stop="$emit('rename')">mdi-pencil</v-icon>
        <v-icon size="13" @click.stop="$emit('remove')">mdi-close</v-icon>
      </span>
    </div>
    <v-btn
      v-if="!readonly"
      size="small"
      variant="text"
      prepend-icon="mdi-plus"
      class="alt-add"
      @click="$emit('add')"
      >Add alternative</v-btn
    >
  </div>
</template>

<script>
import { ref, watch, nextTick } from "vue";

/**
 * The paths of one alternatives block, as tabs.
 *
 * A component rather than markup repeated per layout: the desktop table and the
 * mobile card flow show the same control, and the reader's pick will be the same
 * control again with the editing affordances off. Two copies of it would have
 * drifted the first time one was adjusted.
 *
 * It owns the focus of its rename field — the parent says *whether* a name is
 * being edited and this decides what that means on screen, which saves threading
 * a template ref back out through an emit.
 */
export default {
  name: "AlternativePathTabs",
  props: {
    paths: { type: Array, required: true },
    active: { type: Number, default: 0 },
    readonly: { type: Boolean, default: false },
    // True while this block's active path is being renamed.
    renaming: { type: Boolean, default: false },
  },
  emits: ["select", "add", "rename", "remove", "title", "done"],
  setup(props) {
    const titleField = ref(null);

    watch(
      () => props.renaming,
      async (on) => {
        if (!on) return;
        await nextTick();
        //v-for gives an array of refs even for the single field it matches
        const field = Array.isArray(titleField.value) ? titleField.value[0] : titleField.value;
        field?.focus();
        field?.select?.();
      }
    );

    return { titleField };
  },
};
</script>
