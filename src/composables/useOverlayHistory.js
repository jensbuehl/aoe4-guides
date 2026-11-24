import { onBeforeUnmount, watch } from "vue";
import { useRouter } from "vue-router";

/**
 * Makes the system Back button close an overlay instead of leaving the page.
 * Used by the build editor's phone icon sheet and by build search (spec 043).
 *
 * It cannot be Vuetify's closeOnBack. That cancels the navigation from a global
 * beforeEach, and the router runs a view's own leave guard before any global
 * one, so on a build with unsaved changes, which is every build being edited,
 * Back asked "leave anyway?", and yes left the editor with the sheet still open
 * over it.
 *
 * So the overlay pushes its own entry, for the same URL, through the router's
 * history object rather than through router.push. Back then pops to the same
 * route: the router still resolves it, but nothing is left, so no leave guard
 * runs. Pushed this way the entry underneath keeps the scroll position from the
 * moment before the overlay opened, which is what the router restores on that
 * pop. That is why `open()` pushes synchronously, before the ref changes:
 * read any later and it would be the 0 that Vuetify's scroll lock reports while
 * the overlay is up, and the page would land at the top.
 *
 * Closing any other way (✕, Esc, a pick, a click outside) steps back over the
 * entry with the router's listeners off, so no entry is left behind and closing
 * never becomes a navigation at all.
 *
 * Works outside a router (none today) by doing nothing to history.
 *
 * To navigate away from the overlay (search opening a result), use
 * `closeThen(() => router.push(…))`. The step back is asynchronous: a push made
 * straight after closing would be undone when the back lands, leaving the
 * reader on the page they started from.
 *
 * @param {import("vue").Ref<boolean>} openRef - The overlay's v-model.
 * @param {string} stateKey - Marks the pushed entry, e.g. "iconSheet".
 * @return {{open: () => void, closeThen: (fn: () => void) => void}} Call
 *   `open()` instead of setting the ref to true.
 */
export function useOverlayHistory(openRef, stateKey) {
  const routerHistory = useRouter()?.options.history;
  let entry = false;
  let afterBack = [];

  const onPopstate = () => {
    window.removeEventListener("popstate", onPopstate);
    entry = false;
    openRef.value = false;
    const callbacks = afterBack;
    afterBack = [];
    callbacks.forEach((fn) => fn());
  };

  const closeThen = (fn) => {
    if (!entry) {
      openRef.value = false;
      fn();
      return;
    }
    afterBack.push(fn);
    openRef.value = false;
  };

  const open = () => {
    if (routerHistory && !entry) {
      routerHistory.push(routerHistory.location, { [stateKey]: true });
      entry = true;
      window.addEventListener("popstate", onPopstate);
    }
    openRef.value = true;
  };

  // Registered before any watcher the caller adds on the same ref, so the step
  // back happens first, as it did when this lived in the icon sheet.
  watch(openRef, (isOpen) => {
    if (!isOpen && entry) routerHistory.go(-1, false);
  });

  onBeforeUnmount(() => window.removeEventListener("popstate", onPopstate));

  return { open, closeThen };
}
