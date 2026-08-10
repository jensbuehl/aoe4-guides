<template>
  <div :class="['alt-bar', stacked && 'alt-bar--stacked']" role="tablist">
    <!--One box per tab, holding either the name or the field that edits it. Same
        container either way, so switching to rename cannot change the tab's
        width — and the controls keep their place whether or not the tab is the
        open one, so activating a tab does not resize it either.-->
    <div
      v-for="(path, pathIndex) in paths"
      :key="'p' + pathIndex"
      :class="['alt-tab', pathIndex === active && 'alt-tab--active']"
      role="tab"
      :tabindex="renaming && pathIndex === active ? -1 : 0"
      :aria-selected="pathIndex === active"
      @click="$emit('select', pathIndex)"
      @keydown.enter.prevent="$emit('select', pathIndex)"
      @keydown.space.prevent="$emit('select', pathIndex)"
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
      <!--The condition, where a reader is deciding. It is the path's first note,
          so it also stands as the first row once the path is chosen — this is
          the same text, brought forward to the moment of the choice.

          Stacked, it is written out on a second line instead of hovered for:
          there is no hover on a phone, and a tooltip is the one place the thing
          a reader needs in order to choose could not be reached.-->
      <span
        v-if="stacked && conditionOf(path)"
        class="alt-tab-cond"
        v-html="conditionOf(path)"
      ></span>
      <v-tooltip
        v-if="!stacked && conditionOf(path)"
        activator="parent"
        location="top"
        max-width="360"
      >
        <span
          :style="{ color: $vuetify.theme.current.colors.primary }"
          v-html="conditionOf(path)"
        ></span>
      </v-tooltip>
      <!--Reachable, not merely clickable. These are the only way to rename or
          remove a path, so a keyboard that could select a tab but not act on it
          would leave a reader able to read the feature and an author unable to
          use it. `stop` on the key handlers as well as the clicks: without it
          the tab behind them takes the same Enter and re-selects itself.-->
      <span v-if="!readonly" class="alt-tab-actions">
        <v-icon
          size="13"
          role="button"
          :tabindex="pathIndex === active ? 0 : -1"
          aria-label="Rename this path"
          @click.stop="$emit('rename', pathIndex)"
          @keydown.enter.stop.prevent="$emit('rename', pathIndex)"
          @keydown.space.stop.prevent="$emit('rename', pathIndex)"
          >mdi-pencil</v-icon
        >
        <v-icon
          size="13"
          role="button"
          :tabindex="pathIndex === active ? 0 : -1"
          aria-label="Remove this path"
          @click.stop="$emit('remove', pathIndex)"
          @keydown.enter.stop.prevent="$emit('remove', pathIndex)"
          @keydown.space.stop.prevent="$emit('remove', pathIndex)"
          >mdi-close</v-icon
        >
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

import { pathCondition } from "@/composables/builds/alternativesDraft.js";

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
    // Full-width rows rather than a row of pills, for a reader choosing with a
    // thumb. Carries the condition on a second line, since touch has no hover.
    stacked: { type: Boolean, default: false },
    // True while this block's active path is being renamed.
    renaming: { type: Boolean, default: false },
  },
  emits: ["select", "add", "rename", "remove", "title", "done"],
  setup(props) {
    const titleField = ref(null);

    /**
     * The condition a reader is deciding on: the path's first note. Shown in a
     * tooltip normally, written out when stacked.
     *
     * @param {Object} path - One path of the block.
     * @return {string|null} The condition's rich text, or null when unwritten.
     */
    const conditionOf = (path) => pathCondition(path);

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

    return { titleField, conditionOf };
  },
};
</script>

<style scoped>
/* These live here, with the markup they style. They were left behind in
   BuildOrderSectionEditor when the tabs became a component, and `scoped` does
   not reach into a child — so every tab rendered as bare text. */
.alt-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
/* One tab, one box. It holds the name or the field that edits it, and the two
   controls always occupy their place — hidden, not absent, until the tab is
   pointed at or open. Both of those are why nothing here changes width when a
   tab is activated or renamed. */
.alt-tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  padding: 0 10px;
  /* 6px, matching the resource pills and the rename field rather than the 4px a
     v-btn defaults to — which is why this is a div and not a button. */
  border-radius: 6px;
  background: rgba(var(--v-theme-alternative), 0.16);
  color: rgb(var(--v-theme-on-surface));
  font-size: 0.875rem;
  /* One weight for every tab, in every state. The active tab is already
     unmistakable by its filled background, so weight had nothing left to say —
     and having it say something meant the text changed thickness when a tab was
     activated, and again when its name was being typed, since the rename field
     inherits the tab's type. */
  font-weight: 600;
  line-height: 1;
  cursor: pointer;
  user-select: none;
  transition: background 0.12s;
}
/* No hover fill. The background says which tab is open; making it also say
   "the pointer is here" gave one channel two meanings, and an inactive tab lit
   up as though it had been selected. Hovering reveals the controls — that is the
   whole of the feedback. */
/* The keyboard needs to see where it is. Hover was deliberately given no fill —
   the background says which tab is open and nothing else — so focus gets an
   outline instead of borrowing that channel. */
.alt-tab:focus-visible,
.alt-tab-actions .v-icon:focus-visible {
  outline: 2px solid rgb(var(--v-theme-alternative));
  outline-offset: 2px;
}
/* Revealed by focus exactly as by hover, and by the same pair of properties —
   `opacity: 0` alone still leaves a control focusable, so a keyboard would
   otherwise land on something nobody can see. Only the open tab's, matching
   the hover rule above: the others are not reachable at all. */
.alt-tab--active:focus-within .alt-tab-actions {
  opacity: 0.85;
  pointer-events: auto;
}
.alt-tab--active {
  background: rgb(var(--v-theme-alternative));
  color: rgb(var(--v-theme-background));
}
.alt-tab-label {
  white-space: nowrap;
}
/* Deliberately the tab's own type rather than an input's: while you are renaming
   you are still looking at the tab, and a field that switches to form typography
   mid-edit reads as a different control appearing. */
.alt-tab-field {
  font: inherit;
  color: inherit;
  background: transparent;
  border: none;
  outline: none;
  padding: 0;
  width: auto;
  min-width: 60px;
  /* Grows with what is typed. `size` is the fallback for browsers without it. */
  field-sizing: content;
}
.alt-tab-field::placeholder {
  color: rgba(var(--v-theme-on-surface), 0.4);
  font-weight: 400;
}
/* Space reserved in every state, so a tab is the same width open or closed —
   but not clickable while invisible. `opacity: 0` still takes pointer events, so
   the hidden pencil on an inactive tab swallowed the click that should have
   selected that tab, and fired rename on the open one instead. */
.alt-tab-actions {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.12s;
}
/* Both conditions, not either: renaming and removing act on the path you are
   editing, so they belong to the open tab — and they appear when you reach for
   them rather than sitting there. The space stays reserved in every state, so
   nothing moves when they fade in. */
.alt-tab--active:hover .alt-tab-actions {
  opacity: 0.85;
  pointer-events: auto;
}
/* On a touch screen there is no hover to reveal them with, and a control you
   cannot discover is a control that does not exist. Shown on the open tab
   always — the space was already reserved, so nothing moves. */
@media (hover: none) {
  .alt-tab--active .alt-tab-actions {
    opacity: 0.85;
    pointer-events: auto;
  }
}
.alt-tab-actions .v-icon:hover {
  opacity: 1;
}
/* Not a tab — an action. It only borrows the corner radius so the row's shapes
   agree. */
.alt-add {
  text-transform: none;
  letter-spacing: 0;
  border-radius: 6px;
}

/* A reader choosing with a thumb, not a pointer over a row of pills. Same tabs,
   same colours, same component — laid down the page at a size a thumb can hit,
   with the thing being decided written out rather than hovered for. */
.alt-bar--stacked {
  flex-direction: column;
  align-items: stretch;
  gap: 8px;
  width: 100%;
}
.alt-bar--stacked .alt-tab {
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 2px;
  height: auto;
  min-height: 44px;
  padding: 8px 12px;
  line-height: 1.3;
}
.alt-bar--stacked .alt-tab-label {
  white-space: normal;
}
.alt-tab-cond {
  font-size: 0.75rem;
  font-weight: 400;
  opacity: 0.85;
}
</style>
