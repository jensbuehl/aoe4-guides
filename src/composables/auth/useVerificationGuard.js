import { useStore } from "vuex";

const VERIFY_MSG = "Please verify your email address to use this feature.";

export function useVerificationGuard() {
  const store = useStore();

  function assertVerified() {
    if (!store.state.user?.emailVerified) {
      store.dispatch("showSnackbar", { text: VERIFY_MSG, type: "warning" });
      return false;
    }
    return true;
  }

  return { assertVerified };
}
