<template>
  <v-card-text style="white-space: pre-line">
    <v-row>
      <v-col cols="10">{{ comment }}</v-col>
      <v-row justify="end">
        <v-col cols="auto" class="fill-height mr-1">
          <v-btn color="primary" variant="text" block icon="mdi-delete"></v-btn>
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
import { ref, onMounted, getCurrentInstance } from "vue";
import useTimeSince from "../composables/useTimeSince";

export default {
  name: "SingleComment",
  props: ["comment"],
  setup(props) {
    const instance = getCurrentInstance();

    const comment = props.comment.text;
    const timeCreated = props.comment.timeCreated;
    const author = props.comment.authorName;
    const { timeSince, isNew } = useTimeSince();

    onMounted(async () => {
      console.log(instance.proxy.$vuetify.theme.themes.dark.colors);
    });

    return {
      comment,
      timeCreated,
      author,
      timeSince,
      isNew,
    };
  },
};
</script>
