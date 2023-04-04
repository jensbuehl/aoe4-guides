<template>
  <v-btn @click="addToFavorites" v-show="!isFavorite" block color="red" variant="text" icon="mdi-heart-outline"></v-btn>
  <v-btn @click="removeFromFavorites" v-show="isFavorite" block color="red" variant="text" icon="mdi-heart"></v-btn>
</template>

<script>
import { onMounted, ref } from "vue";

export default {
  name: "Favorites",
  props: ["buildId", "userId"],
  setup(props) {
    console.log(props.buildId)
    console.log(props.userId)

    const isFavorite = ref(false)
    onMounted(async () => {

    });
    const addToFavorites = async () => {
        isFavorite.value = !isFavorite.value
    };
    const removeFromFavorites = async () => {
        isFavorite.value = !isFavorite.value
    };
    return {
      props,
      isFavorite,
      addToFavorites,
      removeFromFavorites
    };
  },
};
</script>
