<template>
  <v-container v-if="!user && authIsReady">
    <v-row>
      <v-col cols="12" md="8" align="center"
        ><v-card
          flat
          class="d-flex justify-center align-center mb-n2"
          height="96"
          rounded="lg"
        >
          <div>
            <span>Would you like to import build orders?</span>
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
        </v-card></v-col
      >
      <v-col cols="12" md="4">
        <RegisterAd v-if="!user && authIsReady"></RegisterAd>
      </v-col>
    </v-row>
  </v-container>
  <v-container v-if="user">
    <v-alert v-if="error" color="error">
      {{ error }}
    </v-alert>
    <v-card
      flat
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
                  color: $vuetify.theme.current.colors.primary,
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
import RegisterAd from "../../components/RegisterAd.vue";
import { ref, computed } from "vue";
import { useStore } from "vuex";
import { useRouter } from "vue-router";
import useCollection from "../../composables/useCollection";
import useOverlayConversion from "../../composables/useOverlayConversion";

export default {
  name: "BuildImport",
  components: { RegisterAd },
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
        matchup: build.value.matchup,
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
    };

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
