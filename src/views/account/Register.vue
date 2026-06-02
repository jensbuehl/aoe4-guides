<template></template>

<script>
import { useStore } from "vuex";
import { useRouter } from "vue-router";

export default {
  name: "Register",
  setup() {
    const store = useStore();
    const router = useRouter();
    store.dispatch("openAuthDialog", { mode: "register" });
    router.replace("/");
  },
};
</script>
