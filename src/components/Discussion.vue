<template>
  <v-card>
    <v-card-title class="mb-4">Comments</v-card-title>
    <div v-for="comment in comments" :key="comment.id">
      <SingleComment @commentRemoved="init" :comment="comment"></SingleComment>
    </div>
    <v-row align="center">
      <v-col class="mt-4">
        <v-textarea
          label="Write a comment"
          v-model="newComment.text"
          :value="newComment.text"
          rows="1"
          auto-grow
          clearable
        >
        </v-textarea>
      </v-col>
      <v-col cols="auto">
        <v-row justify="end" align="center" class="fill-height my-2 mr-2">
          <v-tooltip location="top">
            <span
              :style="{
                color: $vuetify.theme.themes.customDarkTheme.colors.primary,
              }"
              >Post Comment</span
            >
            <template v-slot:activator="{ props }">
              <v-btn
                v-bind="props"
                color="primary"
                variant="text"
                block
                icon="mdi-send"
                @click="post"
              ></v-btn>
            </template>
          </v-tooltip>
        </v-row>
      </v-col>
    </v-row>
  </v-card>
</template>

<script>
import SingleComment from "./SingleComment.vue";
import useCollection from "../composables/useCollection";
import { useStore } from "vuex";
import queryService from "../composables/queryService";
import { ref, onMounted, computed } from "vue";

export default {
  name: "Discussion",
  components: { SingleComment },
  props: ["buildId"],
  setup(props) {
    const { add, getAll, getQuery } = useCollection("comments");
    const store = useStore();
    const user = computed(() => store.state.user);
    const comments = ref(null);
    const newComment = ref({
      text: "",
      buildId: props.buildId,
      authorId: user.value?.uid,
      author: user.value?.displayName,
    });

    onMounted(async () => {
      init();
    });

    const init = async () => {
      var queryParams = queryService.whereEqual("buildId", props.buildId);
      queryParams = queryParams.concat(
        queryService.orderByWith({ orderBy: "timeCreated" }, "asc")
      );
      const query = getQuery(queryParams);
      const res = await getAll(query);
      comments.value = res;
    };

    const post = async () => {
      console.log(newComment.value);
      //Add new comment
      await add(newComment.value);
      newComment.value.text = null;

      //Update comments list
      init();
    };

    return {
      comments,
      post,
      init,
      newComment,
    };
  },
};
</script>
