<template></template>

<script>
import { useStore } from "vuex";
import { useRoute, useRouter } from "vue-router";

export default {
  name: "Login",
  setup() {
    const store = useStore();
    const route = useRoute();
    const router = useRouter();
    const redirect = route.query.redirect || null;
    store.dispatch("openAuthDialog", { mode: "login", redirect });
    router.replace("/");
  },
};
</script>
