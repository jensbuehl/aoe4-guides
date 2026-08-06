//External
import { ref, watch, toValue, onScopeDispose } from "vue";
import { useTheme } from "vuetify";

/**
 * Whether this browser can open a Document Picture-in-Picture window.
 *
 * Capability, never user agent. Support arriving in another browser then needs
 * no code change here.
 *
 * @return {boolean}
 */
export function isDocumentPiPSupported() {
  return typeof window !== "undefined" && "documentPictureInPicture" in window;
}

const REQUESTED_WIDTH = 400;
const REQUESTED_HEIGHT = 230;

/**
 * The floating-window half of Focus mode: open a Document Picture-in-Picture
 * window and **move** the live focus-mode element into it.
 *
 * Moving rather than mounting a second copy is the whole design. A player pops
 * out mid-build; the timer, the step index, the autoplay state and the pending
 * utterance are all owned by one component instance, and re-mounting Focus mode
 * inside the new window would fork every one of them — the session would restart
 * at 0:00 while the game kept going. So the node is relocated and the component
 * never learns that anything happened, beyond the two callbacks below.
 *
 * What this owns: the window, the stylesheet copy, the moved node and the
 * keyboard binding. What it deliberately does not own: the wake lock and the
 * session tick. Those belong to the session, so they are handed back through
 * onEnter/onLeave rather than reached into from here.
 *
 * @param {Object} options
 * @param {import("vue").Ref<HTMLElement>} options.rootRef - The focus-mode root
 *   to move. Must be the element carrying `container-type: size`, because the
 *   density tiers are chosen from its box and nothing else.
 * @param {Function} [options.onKeyup] - Bound to the floating window's document
 *   while it is open. The opener's own binding is never touched.
 * @param {Function} [options.onEnter] - Called with the window after the move.
 * @param {Function} [options.onLeave] - Called after the node is home again.
 * @return {{supported: boolean, active: import("vue").Ref<boolean>, open: Function, close: Function}}
 */
export function useStepPiP(options = {}) {
  const supported = isDocumentPiPSupported();
  const active = ref(false);
  const theme = useTheme();

  //Not refs: nothing renders from these, and a reactive Window reference would
  //have Vue walk a cross-document object graph for no benefit.
  let pipWindow = null;
  let returnParent = null;
  let returnNextSibling = null;
  let disposeKeyup = null;
  let disposePageHide = null;

  /**
   * Copies the opener's styling into the floating window.
   *
   * Manual, rule by rule, because the `copyStyleSheets` option this would
   * otherwise use was removed from the specification before it shipped. Reading
   * `cssRules` on a cross-origin sheet throws, so those are re-linked by href
   * instead and the browser fetches them again.
   *
   * The copy is a snapshot. Vuetify writes its palette into a generated
   * stylesheet, so a theme switch after this runs leaves the window on the old
   * colours until it runs again — which is what the watcher below is for.
   *
   * @param {Window} pip - The floating window.
   */
  function carryStyles(pip) {
    if (!pip || pip.closed) return;

    const head = pip.document.head;
    //Second and later runs are theme changes: drop what we wrote last time
    //rather than stacking another full copy of the site's CSS on top of it.
    head.querySelectorAll("[data-fm-carried]").forEach((node) => node.remove());

    for (const sheet of Array.from(document.styleSheets)) {
      try {
        const cssText = Array.from(sheet.cssRules)
          .map((rule) => rule.cssText)
          .join("");
        const style = pip.document.createElement("style");
        style.setAttribute("data-fm-carried", "");
        style.textContent = cssText;
        head.appendChild(style);
      } catch {
        //Cross-origin: the rules are unreadable, but the URL is not.
        if (!sheet.href) continue;
        const link = pip.document.createElement("link");
        link.setAttribute("data-fm-carried", "");
        link.rel = "stylesheet";
        link.href = sheet.href;
        head.appendChild(link);
      }
    }

    //Last, and with !important, because it has to beat everything above it.
    //
    //The site's own CSS assumes it is describing a page in a tab: base.css asks
    //the body for `min-height: 100vh` and Vuetify gives the document a scroll
    //container. Copied verbatim into a 400x230 window those produce a body
    //slightly taller than the window and a scrollbar down the side of a layout
    //that is specified never to scroll. This ran *before* the copy at first,
    //which meant every one of those rules simply landed on top of it.
    const base = pip.document.createElement("style");
    base.setAttribute("data-fm-carried", "");
    base.textContent =
      "html,body{margin:0!important;padding:0!important;width:100%!important;" +
      "height:100%!important;min-height:0!important;max-height:100%!important;" +
      "overflow:hidden!important;}" +
      "body{background:rgb(var(--v-theme-background));}";
    head.appendChild(base);

    carryThemeClasses(pip);
  }

  /**
   * Carries the theme over as well as the palette.
   *
   * Vuetify's custom properties are scoped to a `v-theme--*` class, and in the
   * opener that class sits on an ancestor of Focus mode that is not coming with
   * it. Collected from wherever it happens to be rather than assumed, so this
   * survives Vuetify moving it.
   *
   * @param {Window} pip - The floating window.
   */
  function carryThemeClasses(pip) {
    const classes = new Set(Array.from(document.documentElement.classList));

    for (const carrier of [
      document.documentElement,
      document.body,
      document.querySelector(".v-application"),
    ]) {
      for (const name of carrier?.classList ?? []) {
        if (name.startsWith("v-theme--")) classes.add(name);
      }
    }

    pip.document.documentElement.className = Array.from(classes).join(" ");
    pip.document.documentElement.style.colorScheme =
      getComputedStyle(document.documentElement).colorScheme || "";
  }

  /**
   * Puts the focus-mode element back exactly where it was.
   *
   * Back to the remembered parent and the remembered sibling, not merely
   * appended: Focus mode is not always the last child of what holds it, and a
   * node that comes home to the wrong position is a layout bug that only appears
   * after someone has used the feature.
   */
  function returnNode() {
    const root = toValue(options.rootRef);

    if (root && returnParent) {
      if (returnNextSibling && returnNextSibling.parentNode === returnParent) {
        returnParent.insertBefore(root, returnNextSibling);
      } else {
        returnParent.appendChild(root);
      }
    }

    disposeKeyup?.();
    disposePageHide?.();
    disposeKeyup = null;
    disposePageHide = null;
    returnParent = null;
    returnNextSibling = null;
    pipWindow = null;

    const wasActive = active.value;
    active.value = false;
    if (wasActive) options.onLeave?.();
  }

  /**
   * Opens the floating window and moves Focus mode into it.
   *
   * @return {Promise<void>} Rejects with the browser's own reason when the
   *   request is refused, having changed nothing.
   */
  async function open() {
    if (!supported) {
      throw new Error("This browser has no Document Picture-in-Picture support.");
    }

    //The platform allows one window per tab, so a second request is not a
    //second window — it is an error. Treat the existing one as the answer.
    const existing = window.documentPictureInPicture.window;
    if (existing && !existing.closed) {
      existing.focus();
      return;
    }

    const root = toValue(options.rootRef);
    if (!root) throw new Error("Focus mode is not mounted.");

    //Nothing above this line touched the DOM, and nothing below it runs if the
    //request is refused — so a rejection leaves no half-moved session behind.
    const pip = await window.documentPictureInPicture.requestWindow({
      width: REQUESTED_WIDTH,
      height: REQUESTED_HEIGHT,
    });

    pipWindow = pip;
    carryStyles(pip);

    //Captured before the move. Afterwards the node's parent is the floating
    //window's body, and where it came from is unknowable.
    returnParent = root.parentElement;
    returnNextSibling = root.nextSibling;
    pip.document.body.appendChild(root);

    if (options.onKeyup) {
      //A second listener, not a moved one: keyboard events fire in whichever
      //document has focus, and the player will move between the two all session.
      //Unbinding the opener's would break the keys on the page it came from.
      const handler = (event) => options.onKeyup(event);
      pip.document.addEventListener("keyup", handler);
      disposeKeyup = () => pip.document.removeEventListener("keyup", handler);
    }

    const onPageHide = () => returnNode();
    pip.addEventListener("pagehide", onPageHide);
    disposePageHide = () => pip.removeEventListener("pagehide", onPageHide);

    active.value = true;
    options.onEnter?.(pip);
  }

  /**
   * Closes the floating window and brings Focus mode home.
   *
   * The node moves first, while both documents are still alive. Closing the
   * window with the element still inside it destroys the element.
   */
  function close() {
    const pip = pipWindow;
    returnNode();
    if (pip && !pip.closed) pip.close();
  }

  //A snapshot does not follow the theme, so re-take it. Cheap, and only ever
  //while a window is actually open.
  watch(
    () => theme.global.name.value,
    () => {
      if (active.value && pipWindow && !pipWindow.closed) carryStyles(pipWindow);
    }
  );

  //Navigating away from the build page is what this is for. The platform closes
  //a floating window only when its opener loads a *new document*, and a route
  //change in this app never does — so without this the window would outlive the
  //build it belongs to, still ticking, with its element's parent destroyed.
  onScopeDispose(() => {
    if (active.value) close();
  });

  return { supported, active, open, close };
}
