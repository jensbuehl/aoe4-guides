<template>
  <v-dialog v-model="dialog" width="auto">
    <v-card rounded="lg" class="text-center" flat>
      <v-card-title>Delete Comment</v-card-title>
      <v-card-text>
        Do you really want to delete this comment?<br />
        The action cannot be undone.
      </v-card-text>
      <v-card-actions>
        <v-btn color="error" block @click="handleDelete">Delete</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
  <v-divider></v-divider>
  <v-card-text style="white-space: pre-line">
    <v-row class="mt-2"no-gutters align="center">
      <v-col cols="auto">
        <v-avatar class="mr-4" color="accent">{{ author.slice(0, 2).toUpperCase() }}</v-avatar>
      </v-col>
      <v-col cols="*">{{ comment }}</v-col>
      <v-col cols="auto">
        <v-btn
          v-if="authorId == user?.uid"
          color="accent"
          variant="text"
          block
          icon="mdi-delete"
          @click="dialog = true"
        ></v-btn> </v-col></v-row
    ><v-row no-gutters justify="end">
      <v-col cols="auto">
        <v-item-group v-if="timeCreated && author">
          <v-chip class="mr-2" v-if="isNew(timeCreated.toDate())" label color="accent" size="small"
            ><v-icon start icon="mdi-alert-decagram"></v-icon>NEW</v-chip
          >
          <v-chip class="mr-2" label size="small"
            ><v-icon start icon="mdi-account-edit"></v-icon>{{ author }}</v-chip
          >
          <v-chip label size="small"
            ><v-icon start icon="mdi-clock-edit-outline"></v-icon
            >{{ timeSince(timeCreated.toDate()) }}</v-chip
          ></v-item-group
        >
      </v-col>
    </v-row>
  </v-card-text>
</template>

<script>
//External
import { ref, computed } from "vue";
import { useStore } from "vuex";

//Composables
import useTimeSince from "@/composables/useTimeSince";
import { deleteComment } from "@/composables/data/commentService";
import { decrementComments } from "@/composables/data/buildService";

export default {
  name: "SingleComment",
  props: ["comment"],
  emits: ["commentRemoved"],
  setup(props, context) {
    const store = useStore();
    const user = computed(() => store.state.user);
    const id = props.comment.id;
    const comment = props.comment.text;
    const timeCreated = props.comment.timeCreated;
    const author = props.comment.author;
    const authorId = props.comment.authorId;
    const dialog = ref(false);
    const { timeSince, isNew } = useTimeSince();

    const handleDelete = async () => {
      dialog.value = false;
      await deleteComment(id);
      await decrementComments();
      context.emit("commentRemoved");
    };

    return {
      comment,
      timeCreated,
      author,
      authorId,
      dialog,
      timeSince,
      isNew,
      handleDelete,
      user,
    };
  },
};
</script>
