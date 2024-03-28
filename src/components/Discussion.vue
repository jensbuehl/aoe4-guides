<template>
  <v-card rounded="lg" flat>
    <v-card-title class="mb-4">Comments</v-card-title>
    <v-row no-gutters align="center" class="ma-4">
      <v-col v-if="!user" align="center" class="pa-2 ma-2">
        <div>
          <span>Would you like to leave messages for other villagers?</span>
          <v-btn
            class="pb-1"
            color="primary"
            style="background-color: transparent"
            variant="plain"
            to="/register"
          >
            Register now!
          </v-btn>
        </div>
      </v-col>
      <v-col v-if="user">
        <v-textarea
          label="Write a comment"
          v-model="newComment.text"
          :value="newComment.text"
          rows="2"
          auto-grow
          clearable
        >
        </v-textarea>
      </v-col>
      <v-col v-if="user" cols="auto">
        <v-tooltip location="top">
          <span
            :style="{
              color: $vuetify.theme.current.colors.primary,
            }"
            >Post Comment</span
          >
          <template v-slot:activator="{ props }">
            <v-btn
              v-bind="props"
              color="accent"
              variant="text"
              class="ml-4 mb-5"
              icon="mdi-send"
              @click="post"
            ></v-btn>
          </template>
        </v-tooltip>
      </v-col>
    </v-row>
    <div v-for="comment in comments" :key="comment.id">
      <Comment @commentRemoved="init" :comment="comment"></Comment>
    </div>
  </v-card>
</template>

<script>
//External
import { useStore } from "vuex";
import { ref, onMounted, computed } from "vue";

//Components
import Comment from "@/components/Comment.vue";

//Composables
import { addComment, getComments } from "@/composables/data/commentService";
import { incrementComments } from "@/composables/data/buildService";

export default {
  name: "Discussion",
  components: { Comment },
  props: ["buildId"],
  setup(props) {
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
      comments.value = await getComments(props.buildId);
      console.log("comments", comments.value);
    };

    const post = async () => {
      await addComment(newComment.value);
      await incrementComments(props.buildId);
      newComment.value.text = null;

      init();
    };

    return {
      comments,
      user,
      post,
      init,
      newComment,
    };
  },
};
</script>
