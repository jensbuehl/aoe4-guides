<template>
  <v-dialog v-model="dialog" width="auto">
    <v-card rounded="lg" class="text-center primary">
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
  <v-card-text style="white-space: pre-line">
    <v-row>
      <v-col cols="10">{{ comment }}</v-col>
      <v-row justify="end">
        <v-col cols="auto" class="fill-height mr-1">
          <v-btn
            v-if="authorId == user?.uid"
            color="primary"
            variant="text"
            block
            icon="mdi-delete"
            @click="dialog = true"
          ></v-btn>
        </v-col>
      </v-row>
      <v-row justify="end">
        <v-col cols="auto">
          <v-item-group v-if="timeCreated && author" class="mb-4">
            <v-chip
              class="mr-2"
              v-if="isNew(timeCreated.toDate())"
              label
              color="primary"
              size="small"
              ><v-icon start icon="mdi-alert-decagram"></v-icon>NEW</v-chip
            >
            <v-chip class="mr-2" label size="small"
              ><v-icon start icon="mdi-account-edit"></v-icon
              >{{ author }}</v-chip
            >
            <v-chip label size="small" class="mr-2"
              ><v-icon start icon="mdi-clock-edit-outline"></v-icon
              >{{ timeSince(timeCreated.toDate()) }}</v-chip
            ></v-item-group
          >
        </v-col>
      </v-row>
      <v-divider></v-divider> </v-row
  ></v-card-text>
</template>

<script>
import { ref, computed } from "vue";
import { useStore } from "vuex";
import useTimeSince from "../composables/useTimeSince";
import useCollection from "../composables/useCollection";

export default {
  name: "SingleComment",
  props: ["comment"],
  emits: ["commentRemoved"],
  setup(props, context) {
    const store = useStore();
    const user = computed(() => store.state.user);
    const { del } = useCollection("comments");

    const id = props.comment.id;
    const comment = props.comment.text;
    const timeCreated = props.comment.timeCreated;
    const author = props.comment.author;
    const authorId = props.comment.authorId;
    const dialog = ref(false);
    const { timeSince, isNew } = useTimeSince();

    const handleDelete = async () => {
      dialog.value = false;
      await del(id);
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
