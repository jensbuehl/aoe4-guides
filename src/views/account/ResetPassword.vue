<template></template>

<script>
import { useStore } from "vuex";
import { useRouter } from "vue-router";

export default {
  name: "ResetPassword",
  setup() {
    const store = useStore();
    const router = useRouter();
    store.dispatch("openAuthDialog", { mode: "reset" });
    router.replace("/");
  },
};
</script>
