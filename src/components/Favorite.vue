<template>
  <v-tooltip location="top">
    <span
      :style="{
        color: $vuetify.theme.current.colors.primary,
      }"
      >Add to Favorites</span
    >
    <template v-slot:activator="{ props }">
      <v-btn
        @click="addToFavorites"
        v-bind="props"
        v-show="!isFavorite"
        color="accent"
        variant="text"
        icon="mdi-heart-outline"
      ></v-btn>
    </template>
  </v-tooltip>

  <v-tooltip location="top">
    <span
      :style="{
        color: $vuetify.theme.current.colors.primary,
      }"
      >Remove from Favorites</span
    >
    <template v-slot:activator="{ props }">
      <v-btn
        @click="removeFromFavorites"
        v-show="isFavorite"
        v-bind="props"
        color="accent"
        variant="text"
        icon="mdi-heart"
      ></v-btn>
    </template>
  </v-tooltip>
</template>

<script>
//External
import { onMounted, ref } from "vue";
import { useStore } from "vuex";

//Components

//Composables
import { addFavorite, removeFavorite } from "@/composables/data/favoriteService";
import { incrementLikes, decrementLikes } from "@/composables/data/buildService";

export default {
  name: "Favorites",
  props: ["buildId", "modelValue"],
  emits: ["favoriteRemoved", "favoriteAdded"],
  setup(props, context) {
    const userId = ref(props.modelValue?.uid);
    const store = useStore();

    const isFavorite = ref(false);
    onMounted(async () => {
      const user = props.modelValue;
      userId.value = user?.id;
      isFavorite.value = user.favorites.includes(props.buildId);
    });
    const addToFavorites = async () => {
      incrementLikes(props.buildId);
      addFavorite(userId.value, props.buildId);
      isFavorite.value = !isFavorite.value;

      //reset cache
      store.commit("setMyFavoritesList", null);

      context.emit("favoriteAdded"); //Only used for live preview
    };
    const removeFromFavorites = async () => {
      decrementLikes(props.buildId);
      removeFavorite(userId.value, props.buildId);
      isFavorite.value = !isFavorite.value;

      //reset cache
      store.commit("setMyFavoritesList", null);

      context.emit("favoriteRemoved"); //Only used for live preview
    };
    return {
      props,
      isFavorite,
      addToFavorites,
      removeFromFavorites,
    };
  },
};
</script>
