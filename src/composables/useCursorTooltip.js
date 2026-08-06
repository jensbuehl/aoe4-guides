import { markRaw, onBeforeUnmount, reactive, ref, shallowRef } from "vue";

/**
 * A hover tooltip that opens where the pointer is instead of over the middle of
 * its activator.
 *
 * Vuetify anchors a tooltip to the activator's box, which is right for an icon
 * button and wrong for anything wide. A build card's title is a block that
 * fills the card, so `location="top"` puts the tooltip above the centre of the
 * card while the pointer sits somewhere along the title — far enough away that
 * it no longer reads as belonging to what is being hovered.
 *
 * Vuetify's own `target="cursor"` does not solve this: useActivator only
 * records the pointer in its click handler, so a hover-opened overlay falls
 * straight back to the activator box. What it does support is a point target —
 * `:target="[x, y]"` — which is what this hands it.
 *
 * That means owning the open and close, and with them the delay. The pointer is
 * kept in a plain variable rather than a ref on purpose: mousemove fires with
 * every frame of movement, and a reactive write per event would re-render the
 * whole card that often. Only opening and closing touch reactive state, and the
 * position is taken at the moment the tooltip opens, so it appears under the
 * pointer where it actually is rather than where it entered — and then stays
 * put instead of trailing along behind it.
 *
 * @param {number} openDelay - Milliseconds of hover before opening. Matches the
 *   app-wide VTooltip default set in main.js, since this replaces it.
 * @returns A reactive handle: bind `isOpen` with v-model and `target` on the
 *   <v-tooltip> (with `:open-on-hover="false"`), and `on` with v-on on the
 *   activator element.
 */
export function useCursorTooltip(openDelay = 500) {
  const isOpen = ref(false);
  const target = shallowRef();
  let pointer = null;
  let timer = null;

  //A tap synthesises mouseenter, so without this the tooltip would flash on
  //touch on the way to opening the build. Same guard Vuetify uses internally.
  const isTouch = (event) => Boolean(event.sourceCapabilities?.firesTouchEvents);

  function track(event) {
    if (isTouch(event)) return;
    pointer = [event.clientX, event.clientY];
  }

  function open(event) {
    if (isTouch(event)) return;
    track(event);
    clearTimeout(timer);
    timer = setTimeout(() => {
      target.value = pointer;
      isOpen.value = true;
    }, openDelay);
  }

  function close() {
    clearTimeout(timer);
    timer = null;
    isOpen.value = false;
  }

  //A card can be unmounted while hovered — the list re-sorts, or the click that
  //opens the build navigates away — and a pending timer would otherwise fire
  //into a component that is gone.
  onBeforeUnmount(close);

  return reactive({
    isOpen,
    target,
    on: markRaw({ mouseenter: open, mousemove: track, mouseleave: close }),
  });
}
