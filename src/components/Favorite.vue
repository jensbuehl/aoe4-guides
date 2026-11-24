<template>
  <v-tooltip location="top">
    <span
      :style="{
        color: $vuetify.theme.current.colors.primary,
      }"
      >{{ isFavorite ? "Remove from Favorites" : "Add to Favorites" }}</span
    >
    <template v-slot:activator="{ props: tooltipProps }">
      <v-btn
        @click="toggle"
        v-bind="tooltipProps"
        :loading="pending"
        :aria-pressed="isFavorite"
        :aria-label="isFavorite ? 'Remove from Favorites' : 'Add to Favorites'"
        color="accent"
        variant="text"
        :icon="isFavorite ? 'mdi-heart' : 'mdi-heart-outline'"
      ></v-btn>
    </template>
  </v-tooltip>
</template>

<script>
//External
import { computed, ref } from "vue";
import { useStore } from "vuex";

//Composables
import { setReaction } from "@/composables/data/reactionService";
import { useVerificationGuard } from "@/composables/auth/useVerificationGuard";
import { reactionErrorMessage } from "@/composables/data/reactionMessages";

export default {
  name: "Favorites",
  // modelValue: the reader's lists document ({ id, favorites, upvotes, ... }),
  // shared with the other mounted copy of this button and with Vote.
  // count: the build's current `likes`, which decides whether taking a like
  // back steps the count (see setReaction).
  props: ["buildId", "modelValue", "count"],
  emits: ["favoriteRemoved", "favoriteAdded"],
  setup(props, context) {
    const store = useStore();
    const { assertVerified } = useVerificationGuard();

    // Read from the shared lists, not a ref set once on mount: BuildDetails
    // mounts this button twice (phone and desktop rows, one hidden by CSS), and
    // a private copy of the state left the other one stale after a like — which
    // under the spec 042 rules would send a write they refuse.
    const isFavorite = computed(() => props.modelValue?.favorites?.includes(props.buildId) ?? false);
    const pending = ref(false);

    // The heart changes only once the write is acknowledged: the button shows
    // it is sending at once (`loading`), and never shows a like that was not
    // recorded (spec 042, FR-016). A tap while sending does nothing (FR-017).
    const toggle = async () => {
      if (pending.value) return;
      const on = !isFavorite.value;
      // Adding needs a verified address (the rules check it too); taking back
      // never does, so nobody is stuck with an old like.
      if (on && !assertVerified()) return;

      pending.value = true;
      try {
        await setReaction({
          uid: props.modelValue.id,
          buildId: props.buildId,
          list: "favorites",
          on,
          currentCount: props.count,
        });
        const list = props.modelValue.favorites;
        if (on) list.push(props.buildId);
        else list.splice(0, list.length, ...list.filter((id) => id !== props.buildId));

        //reset cache
        store.commit("setMyFavoritesList", null);
        context.emit(on ? "favoriteAdded" : "favoriteRemoved");
      } catch (err) {
        console.error("Favorite: like not recorded:", err?.code, err?.message);
        store.dispatch("showSnackbar", { text: reactionErrorMessage(err), type: "error" });
      } finally {
        pending.value = false;
      }
    };

    return {
      isFavorite,
      pending,
      toggle,
    };
  },
};
</script>
