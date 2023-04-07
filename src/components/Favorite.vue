<template>
  <v-btn
    @click="addToFavorites"
    v-show="!isFavorite"
    block
    color="primary"
    variant="text"
    icon="mdi-heart-outline"
  ></v-btn>
  <v-btn
    @click="removeFromFavorites"
    v-show="isFavorite"
    block
    color="primary"
    variant="text"
    icon="mdi-heart"
  ></v-btn>
</template>

<script>
import { onMounted, ref } from "vue";
import useCollection from "../composables/useCollection";

export default {
  name: "Favorites",
  props: ["buildId", "userId"],
  emits: ["favoriteRemoved", "favoriteAdded"],
  setup(props, context) {
    const { incrementLikes, decrementLikes } = useCollection("builds");
    const { get, add, arrayUnionLikes, arrayRemoveLikes } =
      useCollection("users");

    const isFavorite = ref(false);
    onMounted(async () => {
      const user = await get(props.userId);
      if (!user) {
        //todo: Do this on registration!
        await add({ builds: [], favorites: [] }, props.userId);
      }
      isFavorite.value = user.favorites.includes(props.buildId);
    });
    const addToFavorites = async () => {
      incrementLikes(props.buildId);
      arrayUnionLikes(props.userId, ...[props.buildId]);
      isFavorite.value = !isFavorite.value;
      context.emit("favoriteAdded"); //Only used for live preview        
    };
    const removeFromFavorites = async () => {
      decrementLikes(props.buildId);
      arrayRemoveLikes(props.userId, ...[props.buildId]);
      isFavorite.value = !isFavorite.value;
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
