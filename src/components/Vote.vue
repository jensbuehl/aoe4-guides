<template>
  <v-tooltip location="top">
    <span
      :style="{
        color: $vuetify.theme.current.colors.primary,
      }"
      >I like! This is a good one!</span
    >
    <template v-slot:activator="{ props }">
      <v-btn
        @click="handleAddVoteUp"
        v-bind="props"
        v-show="!upVote"
        color="accent"
        variant="text"
        icon="mdi-thumb-up-outline"
      ></v-btn>
    </template>
  </v-tooltip>
  <v-tooltip location="top">
    <span
      :style="{
        color: $vuetify.theme.current.colors.primary,
      }"
      >Remove your like</span
    >
    <template v-slot:activator="{ props }">
      <v-btn
        @click="handleRemoveVoteUp"
        v-show="upVote"
        v-bind="props"
        color="accent"
        variant="text"
        icon="mdi-thumb-up"
      ></v-btn>
    </template>
  </v-tooltip>
  <v-tooltip location="top">
    <span
      :style="{
        color: $vuetify.theme.current.colors.primary,
      }"
      >Downvote! Villagers need to improve this build!</span
    >
    <template v-slot:activator="{ props }">
      <v-btn
        @click="handleAddVoteDown"
        v-bind="props"
        v-show="!downVote"
        color="accent"
        variant="text"
        icon="mdi-thumb-down-outline"
      ></v-btn>
    </template>
  </v-tooltip>
  <v-tooltip location="top">
    <span
      :style="{
        color: $vuetify.theme.current.colors.primary,
      }"
      >I changed my mind. This build is pretty neat!</span
    >
    <template v-slot:activator="{ props }">
      <v-btn
        @click="handleRemoveVoteDown"
        v-show="downVote"
        v-bind="props"
        color="accent"
        variant="text"
        icon="mdi-thumb-down"
      ></v-btn>
    </template>
  </v-tooltip>
</template>

<script>
import { onMounted, ref } from "vue";
import useCollection from "../composables/useCollection";

export default {
  name: "Favorites",
  props: ["buildId", "userId"],
  emits: ["voteUpAdded", "voteUpRemoved"],
  setup(props, context) {
    const { incrementUps, decrementUps, incrementDowns, decrementDowns } =
      useCollection("builds");
    const {
      get,
      arrayUnionUps,
      arrayRemoveUps,
      arrayUnionDowns,
      arrayRemoveDowns,
    } = useCollection("favorites");

    const upVote = ref(false);
    const downVote = ref(false);

    onMounted(async () => {
      const user = await get(props.userId);
      if (user.upvotes?.includes(props.buildId)) {
        upVote.value = user.upvotes?.includes(props.buildId);
      }

      if (user.downvotes?.includes(props.buildId)) {
        downVote.value = user.downvotes?.includes(props.buildId);
      }
    });
    const handleAddVoteUp = async () => {
      incrementUps(props.buildId);
      arrayUnionUps(props.userId, ...[props.buildId]);
      upVote.value = !upVote.value;
      context.emit("voteUpAdded");

      removeDownVote();
    };
    const handleRemoveVoteUp = async () => {
      removeUpVote();
    };
    const handleAddVoteDown = async () => {
      incrementDowns(props.buildId);
      arrayUnionDowns(props.userId, ...[props.buildId]);
      downVote.value = !downVote.value;

      removeUpVote();
    };

    const handleRemoveVoteDown = async () => {
      removeDownVote();
    };

    const removeUpVote = () => {
      if (upVote.value) {
        decrementUps(props.buildId);
        arrayRemoveUps(props.userId, ...[props.buildId]);
        upVote.value = !upVote.value;
        context.emit("voteUpRemoved");
      }
    };

    const removeDownVote = () => {
      if (downVote.value) {
        decrementDowns(props.buildId);
        arrayRemoveDowns(props.userId, ...[props.buildId]);
        downVote.value = !downVote.value;
      }
    };

    return {
      props,
      downVote,
      upVote,
      handleAddVoteUp,
      handleRemoveVoteUp,
      handleAddVoteDown,
      handleRemoveVoteDown,
    };
  },
};
</script>
