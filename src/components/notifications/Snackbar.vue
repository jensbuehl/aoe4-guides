<template>
  <v-snackbar
    :timeout="snackbar.timeout"
    :color="snackbar.color"
    location="bottom"
    theme="default"
    v-model="snackbar.visible"
  >
    {{ snackbar.text }}
    <template v-slot:actions>
        <v-btn
          @click="closeSnackbar"
        >
          Close
        </v-btn>
      </template>
  </v-snackbar>
</template>

<script>
//External
import { useStore } from "vuex";
import { computed } from "vue";

export default {
  name: "Snackbar",
  setup() {
    const store = useStore();
    const snackbar = computed(() => store.state.snackbar);

    /**
     * Closes the snackbar by dispatching the "closeSnackbar" action using the store.
     *
     * @return {Promise} A promise that resolves when the snackbar is closed.
     */
    const closeSnackbar = async () => {
      await store.dispatch("closeSnackbar");
    };

    return {
      snackbar,
      closeSnackbar,
    };
  },
};
</script>
