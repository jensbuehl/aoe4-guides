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
    <v-row class="my-2"no-gutters align="center">
      <v-col cols="auto">
        <UserAvatar
          class="mr-4"
          :src="avatarSrc"
          :name="author"
        />
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
          <v-chip class="mr-2" v-if="isNew(toDateSafe(timeCreated))" label color="accent" size="small"
            ><v-icon start icon="mdi-alert-decagram"></v-icon>NEW</v-chip
          >
          <v-chip class="mr-2" label size="small"
            ><v-icon start icon="mdi-account-edit"></v-icon>{{ author }}</v-chip
          >
          <v-chip label size="small"
            ><v-icon start icon="mdi-clock-edit-outline"></v-icon
            >{{ timeSince(toDateSafe(timeCreated)) }}</v-chip
          ></v-item-group
        >
      </v-col>
    </v-row>
  </v-card-text>
</template>

<script>
//External
import { ref, computed, onMounted } from "vue";
import { useStore } from "vuex";

//Composables
import useTimeSince, { toDateSafe } from "@/composables/useTimeSince";
import { useAvatar } from "@/composables/auth/useAvatar";
import { deleteComment } from "@/composables/data/commentService";
import { decrementComments } from "@/composables/data/buildService";

//Components
import UserAvatar from "@/components/common/UserAvatar.vue";

export default {
  name: "Comment",
  components: { UserAvatar },
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

    // The comment document carries the author's name, so the avatar never has
    // to wait on a fetch to have something to show: initials paint immediately
    // and a picture, if there is one, fades in over them. Holding the circle
    // empty until the profile settled was what left it blank.
    const cachedProfile = ref(null);
    onMounted(async () => {
      if (!authorId) return;
      // users/{uid} is readable by its owner only, so every comment written by
      // someone else is denied here — hence the catch. Initials are already on
      // screen either way.
      cachedProfile.value = await store
        .dispatch("getCachedUserProfile", authorId)
        .catch(() => null);
    });
    const authorAvatar = computed(() => cachedProfile.value?.avatar ?? null);
    const { src: avatarSrc } = useAvatar(authorAvatar);

    const handleDelete = async () => {
      dialog.value = false;
      await deleteComment(id);
      await decrementComments(props.comment.buildId);
      context.emit("commentRemoved");
    };

    return {
      toDateSafe,
      comment,
      timeCreated,
      author,
      authorId,
      dialog,
      timeSince,
      isNew,
      handleDelete,
      user,
      avatarSrc,
    };
  },
};
</script>
