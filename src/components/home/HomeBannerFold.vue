<template>
  <!-- The fold every card above the civ picker shares — HomeBanner's
       announcements, the contributor spotlight, and the News card on phones.
       The caller draws the full card in the default slot; this decides whether
       it is shown or traded for the one-line strip, and owns both toggles, so
       the cards cannot fold differently: folded, they stack as one row style. -->
  <div :id="regionId">
    <!-- The one-line form: the title, which expands it, and whatever links the
         caller puts in #strip. See the `compact` prop. -->
    <div v-if="strip || disclosure" class="home-banner-fold__strip">
      <v-btn
        ref="toggleBtn"
        class="home-banner-fold__toggle text-none"
        variant="text"
        height="44"
        :aria-expanded="String(disclosure && expanded)"
        :aria-controls="regionId"
        @click="toggle"
      >
        <!-- A caller with a face to show puts it here instead (the spotlight's
             avatar); the icon is the eyebrow's. One box size for both, so every
             strip's title starts at the same x. -->
        <span class="home-banner-fold__strip-icon">
          <slot name="strip-icon">
            <v-icon size="18">{{ icon }}</v-icon>
          </slot>
        </span>
        <span class="home-banner-fold__strip-title">{{ title }}</span>
      </v-btn>
      <slot name="strip" />
      <!-- The chevron sits exactly where "Show less" will be once the card is
           open — same size, same corner — so it does not jump between the two
           states or between strips with and without links. A duplicate of the
           title's action for pointers only: the title button is the one
           control that is announced and focused. -->
      <v-btn
        class="home-banner-fold__chevron"
        :icon="disclosure && expanded ? 'mdi-chevron-up' : 'mdi-chevron-down'"
        variant="text"
        size="44"
        tabindex="-1"
        aria-hidden="true"
        @click="toggle"
      />
    </div>

    <template v-if="disclosure ? expanded : !strip">
      <slot />

      <!-- On every foldable card on a phone, first visit included: a card that
           can fold says so from the start, not only once it has been folded. -->
      <v-btn
        v-if="collapsible"
        ref="collapseBtn"
        class="home-banner-fold__collapse"
        icon="mdi-chevron-up"
        variant="text"
        size="44"
        aria-label="Show less"
        aria-expanded="true"
        :aria-controls="regionId"
        @click="collapse"
      />
    </template>
  </div>
</template>

<script>
import { computed, nextTick, ref, useId } from "vue";
import { useDisplay } from "vuetify";

export default {
  name: "HomeBannerFold",
  props: {
    icon: { type: String, required: true },
    title: { type: String, required: true },
    // Let this card fold to the one-line strip; `expanded` says which form it
    // is in. *Which form to start in* is the caller's to know — open until the
    // reader has seen what it shows. *Where* the strip is worth having is
    // decided here:
    // below md the card is the whole column and stacks to 420px+ of a phone's
    // first screen, pushing the civ picker past the fold. From md up it sits
    // beside the sidebar at about a third of the fold and the picker is in view
    // anyway, so folding it there would take something away from a desktop
    // reader and give nothing back.
    compact: { type: Boolean, default: false },
    // Whether a compact card is open, held by the caller (v-model).
    // It cannot live here: this component remounts with Home on every Back,
    // and a card that refolds on remount moves everything under it, so the
    // router's saved scroll position lands the reader hundreds of pixels off.
    // The caller keeps it for the page load, beside its "seen" decision.
    expanded: { type: Boolean, default: false },
    // The strip is the card's header in both states, and `expanded` shows
    // the default slot beneath it — for a card whose open form is just the same
    // title over some content (News). Swapping the strip for a separately
    // styled title there changed the title's size, weight and colour on every
    // tap. A card that opens into a designed layout of its own (the spotlight,
    // the banners) keeps the swap. Ignores `compact` and the breakpoint: the
    // caller decides where it is used, and the caller sets `expanded`.
    disclosure: { type: Boolean, default: false },
  },
  emits: ["update:expanded"],
  setup(props, { emit }) {
    // Synchronous on the client — Vuetify measures the window when the display
    // is created — so the first frame already has the right form and nothing
    // collapses after paint.
    const { smAndDown } = useDisplay();
    const folds = computed(() => props.compact && smAndDown.value);

    // Both toggles name the region as what they change: the strip and the full
    // card swap under v-if, so neither exists for the other to point at.
    const regionId = useId();
    const toggleBtn = ref(null);
    const collapseBtn = ref(null);

    // The control that was tapped is replaced by the other one, so focus is
    // handed across rather than dropped to <body>.
    const expand = async () => {
      emit("update:expanded", true);
      await nextTick();
      collapseBtn.value?.$el.focus();
    };
    const collapse = async () => {
      emit("update:expanded", false);
      await nextTick();
      toggleBtn.value?.$el.focus();
    };

    // A disclosure keeps the one button in place, so there is no focus to
    // hand across.
    const toggle = () =>
      props.disclosure ? emit("update:expanded", !props.expanded) : expand();

    const strip = computed(() => folds.value && !props.expanded);
    const collapsible = computed(() => !props.disclosure && folds.value && props.expanded);

    return {
      regionId,
      strip,
      collapsible,
      toggle,
      collapse,
      toggleBtn,
      collapseBtn,
    };
  },
};
</script>

<style scoped>
/* One row, every control a 44px target. The toggle takes whatever the
   caller's links leave and truncates the title rather than wrapping it: a
   second line here would be a second height, and the point of the strip is
   that it is always the same small one. The wash behind it is the caller's,
   so each card's strip keeps that card's colours. */
.home-banner-fold__strip {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 4px;
}

.home-banner-fold__toggle {
  flex: 1 1 0;
  min-width: 0;
  justify-content: start;
  padding: 0 8px;
  /* The title's colour for the whole control, so the chevron (and the ripple)
     read as part of the title rather than as a separate button. */
  color: var(--hero-title);
  /* Vuetify's middle track is `auto`, which will not shrink below the title. */
  grid-template-columns: max-content minmax(0, 1fr) max-content;
}

.home-banner-fold__toggle :deep(.v-btn__content) {
  min-width: 0;
  justify-content: start;
  gap: 8px;
}

.home-banner-fold__strip-icon {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  color: var(--hero-eyebrow);
}

/* In the strip's flow at its right end, which with the strip's 4px padding is
   the same 4px inset as the absolutely placed collapse button below. */
.home-banner-fold__chevron {
  flex: none;
  color: var(--hero-title);
}

.home-banner-fold__strip-title {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--hero-title);
  font-size: 15px;
  font-weight: 800;
  letter-spacing: normal;
}

/* Over the card's top-right corner (the v-card is the positioned ancestor),
   which no layout below md puts text in: the stacked layouts centre the media
   or avatar there, the middle one the eyebrow's short line. */
.home-banner-fold__collapse {
  position: absolute;
  top: 4px;
  right: 4px;
  color: var(--hero-title); /* the strip's chevron colour, as its counterpart */
}
</style>
