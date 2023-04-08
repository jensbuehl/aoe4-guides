<template>
  <v-card v-if="comments" v-for="comment in comments" :key="comment.id">
    <v-card-title class="mb-4">Comments</v-card-title>
    <SingleComment :comment="comment"></SingleComment>
    <SingleComment :comment="comment"></SingleComment>
    <SingleComment :comment="comment"></SingleComment>
    <SingleComment :comment="comment"></SingleComment>
    <SingleComment :comment="comment"></SingleComment>
    <SingleComment :comment="comment"></SingleComment>
    <SingleComment :comment="comment"></SingleComment>
    <SingleComment :comment="comment"></SingleComment>
    <v-row align="center">
      <v-col class="mt-4">
        <v-textarea label="Your new comment" rows="2" auto-grow clearable>
        </v-textarea>
      </v-col>
      <v-col cols="auto">
        <v-row justify="end" align="center" class="fill-height my-2 mr-2">
          <v-btn color="primary" variant="text" block icon="mdi-send"></v-btn>
        </v-row>
      </v-col>
    </v-row>
  </v-card>
</template>

<script>
import SingleComment from "./SingleComment.vue";
import useCollection from "../composables/useCollection";
import queryService from "../composables/queryService";
import { ref, onMounted } from "vue";

export default {
  name: "Discussion",
  components: { SingleComment },
  props: ["buildId"],
  setup(props) {
    const { getAll, getQuery } = useCollection("comments");
    const comments = ref(null);

    onMounted(async () => {
      const query = getQuery(queryService.whereEqual("id", props.buildId));
      console.log(props.buildId);
      const res = await getAll(query);
      comments.value = res;
      console.log(res);
    });

    return {
      comments,
    };
  },
};
</script>
