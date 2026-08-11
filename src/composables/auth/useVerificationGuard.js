import { useStore } from "vuex";

const VERIFY_MSG = "Please verify your email address to use this feature.";
const NAME_MSG = "Please choose a display name first.";

export function useVerificationGuard() {
  const store = useStore();

  function assertVerified() {
    // An account authenticated through Google but never named must not publish:
    // it would appear as a nameless author. The dialog is already asking, so
    // point at it rather than explaining twice (spec 032, FR-007b).
    if (store.state.profileIncomplete) {
      store.dispatch("showSnackbar", { text: NAME_MSG, type: "warning" });
      store.commit("setAuthDialog", { visible: true, mode: "complete-profile" });
      return false;
    }
    if (!store.state.user?.emailVerified) {
      store.dispatch("showSnackbar", { text: VERIFY_MSG, type: "warning" });
      return false;
    }
    return true;
  }

  return { assertVerified };
}
