<template>
  <!--Fullscreen is the phone's sheet: square corners, since rounded ones would
      show the scrim at the screen's own corners, no width cap, and scrollable so
      the content can keep a part of itself in place while the rest scrolls.
      There the ✕ is the main way out, so it takes the default 48px size.

      A closed sheet fades out over the whole page for a moment, and in that
      moment it still takes taps. Let through, the second tap of a double tap
      on a tile became a ghost click on whatever lay under it — an insert
      divider's menu, a time field. So the fading sheet keeps catching taps,
      but a press on it does nothing and moves no focus: the caret the editor
      has just put back stays where it is, and a tap meant for the text is
      simply repeated.-->
  <v-dialog
    :model-value="modelValue"
    :max-width="fullscreen ? undefined : maxWidth"
    :fullscreen="fullscreen"
    :scrollable="fullscreen"
    :aria-labelledby="$slots.title ? undefined : titleId"
    @update:model-value="$emit('update:modelValue', $event)"
    @pointerdown="holdFocusWhileClosing"
  >
    <v-card :rounded="fullscreen ? 0 : 'lg'">
      <v-card-title class="d-flex align-center justify-space-between pt-5 px-6 pb-1">
        <slot name="title">
          <div class="d-flex align-center ga-3">
            <v-icon v-if="titleIcon" color="primary">{{ titleIcon }}</v-icon>
            <span :id="titleId">{{ title }}</span>
          </div>
        </slot>
        <v-btn
          icon="mdi-close"
          variant="text"
          :size="fullscreen ? 'default' : 'small'"
          aria-label="Close"
          @click="$emit('update:modelValue', false)"
        />
      </v-card-title>
      <slot />
      <!-- Guarded: v-card-actions carries a 52px min-height, so an unfilled
           slot reads as dead space under the content rather than as nothing.
           Dismiss-only dialogs rely on the close icon above and pass no
           actions; they need their own bottom padding on the content. -->
      <v-card-actions v-if="$slots.actions" class="px-6 pb-5">
        <v-spacer />
        <slot name="actions" />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { onBeforeUnmount, useId } from "vue";

export default {
  name: "PickerDialog",
  props: {
    modelValue: { type: Boolean, required: true },
    title: { type: String, default: "" },
    titleIcon: { type: String, default: null },
    maxWidth: { type: [Number, String], default: 540 },
    fullscreen: { type: Boolean, default: false },
  },
  emits: ["update:modelValue"],
  setup(props) {
    //Fullscreen only, and only once closed: a press on the fading sheet does
    //nothing at all. Caught at pointerdown, because the rest of a touch tap is
    //hit-tested again later: the mousedown and click that follow arrived 20ms
    //on, when the sheet was gone, and landed on the time field under the tile —
    //it took focus off the restored caret. preventDefault here drops the
    //mousedown (and the focus change it carries); the click still comes, so the
    //document swallows the next one, wherever it lands, within the tap.
    const swallow = (event) => {
      event.preventDefault();
      event.stopPropagation();
      stopSwallowing();
    };
    let swallowTimer = null;
    const stopSwallowing = () => {
      document.removeEventListener("mousedown", swallow, true);
      document.removeEventListener("click", swallow, true);
      document.removeEventListener("pointercancel", stopSwallowing, true);
      document.removeEventListener("pointerdown", stopSwallowing, true);
      clearTimeout(swallowTimer);
    };
    const holdFocusWhileClosing = (event) => {
      if (!props.fullscreen || props.modelValue) return;
      event.preventDefault();
      stopSwallowing();
      document.addEventListener("mousedown", swallow, true);
      document.addEventListener("click", swallow, true);
      //A flick on the fading sheet ends in pointercancel and never clicks, and
      //any later press is a new gesture: neither may lose the author a tap. A
      //second press on the sheet itself re-arms after this disarms it.
      document.addEventListener("pointercancel", stopSwallowing, true);
      document.addEventListener("pointerdown", stopSwallowing, true);
      //A tap's click follows within a few hundred ms; a press held longer
      //than that is not a tap, and must not cost the author their next one.
      swallowTimer = setTimeout(stopSwallowing, 600);
    };
    onBeforeUnmount(stopSwallowing);

    //Names the dialog after its title, for a screen reader announcing it.
    const titleId = useId();

    return { titleId, holdFocusWhileClosing };
  },
};
</script>

