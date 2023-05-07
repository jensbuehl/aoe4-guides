<template>
  <v-container v-if="!user && authIsReady">
    <v-row>
      <v-col cols="12" md="8"
        ><v-card
          class="d-flex justify-center align-center"
          height="96"
          rounded="lg"
        >
          <v-card-title
            class="justify-center align-center pt-0 text-subtitle-2 text-md-h6"
            style="font-family: 'Segoe UI' !important"
            >Please login to import build orders.</v-card-title
          >
        </v-card></v-col
      >
      <v-col cols="12" md="4"
        ><v-alert
          v-if="!user"
          rounded="lg"
          outlined
          color="primary"
          class="pa-1"
          ><v-card rounded="lg">
            <v-card-title> Ready for Age Up?</v-card-title>

            <v-list lines="two">
              <v-list-item
                title="Create"
                subtitle="Create new Age of Empires 4 build orders and share them with your friends."
              ></v-list-item>
              <v-list-item
                title="Like"
                subtitle="Manage your own favorite AoE 4 build orders and find the good ones with ease."
              ></v-list-item>
              <v-list-item
                title="Comment"
                subtitle="Write build order comments and get in touch with the author and the community."
              ></v-list-item>
              <v-list-item
                title="Sign up"
                subtitle="Registered villagers gather and manage build orders up to 20% faster. ;)"
              ></v-list-item>
            </v-list> </v-card></v-alert
      ></v-col>
    </v-row>
  </v-container>
  <v-container v-if="user">
    <v-alert v-if="error" color="error">
      {{ error }}
    </v-alert>
    <v-card
      class="main"
      rounded="lg"
      @dragover="dragover"
      @dragleave="dragleave"
      @drop="drop"
    >
      <input
        type="file"
        name="file"
        id="fileInput"
        class="hidden-input"
        @change="onChange"
        accept=".json, .bo"
      />
      <v-row>
        <v-col>
          <v-card-text class="file-label">
            <div v-if="isDragging">Release to drop file here.</div>
            <div v-else>
              Drop AoE4_Overlay build order file here or
              <label
                for="fileInput"
                :style="{
                  color: $vuetify.theme.themes.customDarkTheme.colors.primary,
                }"
                style="cursor: pointer"
                ><u>click here</u></label
              >
              to upload.
            </div>
          </v-card-text>
        </v-col>
      </v-row>
    </v-card>
  </v-container>
</template>

<script>
import { ref, computed } from "vue";
import { useStore } from "vuex";
import { useRouter } from "vue-router";
import useCollection from "../../composables/useCollection";
import useOverlayConversion from "../../composables/useOverlayConversion";

export default {
  name: "BuildImport",
  components: {},
  setup() {
    window.scrollTo(0, 0);

    const { error } = useCollection("builds");
    const { convertFromOverlayFormat } = useOverlayConversion();
    const store = useStore();
    const user = computed(() => store.state.user);
    const router = useRouter();
    const isDragging = ref(false);

    const files = ref(null);
    const build = ref(null);

    const newFromTemplate = async () => {
      var template = {
        author: "",
        authorUid: "",
        description: build.value.description,
        title: build.value.title + " - import",
        sortTitle: "", //firestore does not support case-insensitive sorting
        steps: build.value.steps,
        video: build.value.video,
        civ: build.value.civ,
        map: build.value.map,
        season: build.value.season,
        strategy: build.value.strategy,
        views: 0,
        likes: 0,
        upvotes: 0,
        downvotes: 0,
        score: 0,
        timeCreated: null,
        timeUpdated: null,
      };

      store.commit("setTemplate", template);
      router.push({ name: "BuildNew" });
    };

    const importAndCreateFromTemplate = async () => {
      try {
        const importedFileString = await files.value[0].text();
        const importedFileObject = JSON.parse(importedFileString);
        build.value = convertFromOverlayFormat(importedFileObject);
        newFromTemplate();
      } catch (err) {
        error.value = err;
        alert(err);
      }
    }

    const onChange = async (e) => {
        files.value = e.target.files || e.dataTransfer.files;
        importAndCreateFromTemplate();
    };

    const dragover = async (e) => {
      e.preventDefault();
      isDragging.value = true;
    };

    const dragleave = async () => {
      isDragging.value = false;
    };

    const drop = async (e) => {
      e.preventDefault();
      files.value = e.dataTransfer.files;
      importAndCreateFromTemplate();
      isDragging.value = false;
    };

    return {
      build,
      error,
      user,
      files,
      isDragging,
      onChange,
      dragover,
      dragleave,
      drop,
      authIsReady: computed(() => store.state.authIsReady),
      newFromTemplate,
    };
  },
};
</script>
<style scoped>
.main {
  display: flex;
  flex-grow: 1;
  align-items: center;
  height: 30vh;
  justify-content: center;
  text-align: center;
}

.hidden-input {
  opacity: 0;
  overflow: hidden;
  position: absolute;
  width: 1px;
  height: 1px;
}
</style>
