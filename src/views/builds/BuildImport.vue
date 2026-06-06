<template>
   <v-container>
      <v-card
         v-if="!paste"
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
//External
import { ref, onMounted } from "vue";
import { useStore } from "vuex";
import { useRouter } from "vue-router";

//Composables
import useImportOverlayFormat from "@/composables/converter/useImportOverlayFormat";

export default {
   name: "BuildImport",
   props: ["paste"],
   setup(props) {
      const { convert } = useImportOverlayFormat();
      const store = useStore();
      const router = useRouter();
      const isDragging = ref(false);

      const files = ref(null);
      const build = ref(null);

      onMounted(async () => {
         //Trigger import from clipboard if paste is set
         if (props.paste) {
            importFromClipboard();
         }
      });

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
            comments: 0,
            scoreAllTime: 0,
            isDraft: false,
            timeCreated: null,
            timeUpdated: null,
         };

         store.commit("setTemplate", template);

         store.dispatch("showSnackbar", {
            text: "Build order imported successfully",
            type: "success",
         });
         router.push({ name: "BuildNew" });
      };

      const importFromClipboard = async () => {
         try {
            navigator.clipboard
               .readText()
               .then((text) => {
                  const importedFileString = text;
                  const importedFileObject = JSON.parse(importedFileString);
                  build.value = convert(importedFileObject);
                  newFromTemplate();
               })
               .catch((err) => {
                  console.error(err);
                  store.dispatch("showSnackbar", {
                     text: "Could not import from clipboard. Please make sure that the clipboard contains a valid build order.",
                     type: "error",
                  });
               });
         } catch (err) {
            console.error(err);
            store.dispatch("showSnackbar", {
               text: "Could not import from clipboard. Please make sure that the clipboard contains a valid build order.",
               type: "error",
            });
         }
      };

      const importFromFile = async () => {
         try {
            const importedFileString = await files.value[0].text();
            const importedFileObject = JSON.parse(importedFileString);
            build.value = convert(importedFileObject);
            newFromTemplate();
         } catch (err) {
            console.error(err);
            store.dispatch("showSnackbar", {
               text: "Could not import from file. Please make sure that the file contains a valid build order.",
               type: "error",
            });
         }
      };

      const onChange = async (e) => {
         files.value = e.target.files || e.dataTransfer.files;
         importFromFile();
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
         importFromFile();
         isDragging.value = false;
      };

      return {
         build,
         files,
         isDragging,
         onChange,
         dragover,
         dragleave,
         drop,
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

