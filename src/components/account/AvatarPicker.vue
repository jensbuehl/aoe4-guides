<template>
  <PickerDialog
    :model-value="modelValue"
    title="Choose your avatar"
    max-width="480"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <v-tabs v-model="activeTab" color="primary" class="px-4">
      <v-tab value="initials">Initials</v-tab>
      <v-tab value="civ">Civilizations</v-tab>
      <v-tab value="upload">Upload</v-tab>
    </v-tabs>

    <v-card-text class="px-6 pt-4 pb-2" style="min-height: 260px">
      <v-window v-model="activeTab">
        <!-- Initials tab -->
        <v-window-item value="initials">
          <div class="d-flex flex-column align-center ga-4 pt-4">
            <v-avatar size="96" color="accent">
              <span class="text-h5">{{ initials }}</span>
            </v-avatar>
            <p class="text-medium-emphasis text-body-2 text-center">
              Your avatar will show your initials. No image stored.
            </p>
          </div>
        </v-window-item>

        <!-- Civilizations tab -->
        <v-window-item value="civ">
          <v-row dense>
            <v-col
              v-for="civ in availableCivs"
              :key="civ.shortName"
              cols="3"
              sm="2"
            >
              <v-card
                :variant="pending.ref === civ.shortName ? 'tonal' : 'text'"
                :color="pending.ref === civ.shortName ? 'primary' : undefined"
                rounded="lg"
                class="pa-1 cursor-pointer"
                @click="selectCiv(civ)"
              >
                <v-img
                  :src="civ.flagLarge"
                  :alt="civ.title"
                  aspect-ratio="1"
                  cover
                  rounded="lg"
                >
                  <template #error>
                    <v-icon>mdi-shield-outline</v-icon>
                  </template>
                </v-img>
                <p class="text-caption text-center mt-1 text-truncate">{{ civ.title }}</p>
              </v-card>
            </v-col>
          </v-row>
        </v-window-item>

        <!-- Upload tab -->
        <v-window-item value="upload">
          <FileDropZone
            accept="image/*"
            hint="Resized to 256×256 px before upload (~10–30 KB)"
            class="mt-2"
            @files="processFiles"
          >
            <v-avatar v-if="uploadPreview" size="80" rounded="lg">
              <v-img :src="uploadPreview" cover />
            </v-avatar>
            <v-icon v-else size="40" color="medium-emphasis">mdi-image-plus</v-icon>
            <p class="text-body-2 text-medium-emphasis text-center">
              <template v-if="uploadPreview">Image ready — click to change</template>
              <template v-else>Drop an image here or <u>click to browse</u></template>
            </p>
          </FileDropZone>
        </v-window-item>
      </v-window>
    </v-card-text>

    <template #actions>
      <v-btn variant="text" @click="$emit('update:modelValue', false)">Cancel</v-btn>
      <v-btn
        color="primary"
        variant="flat"
        :loading="saving"
        :disabled="saving || !canSave"
        @click="save"
      >
        Save
      </v-btn>
    </template>
  </PickerDialog>
</template>

<script>
import { ref, computed, watch } from "vue";
import { useStore } from "vuex";
import { civs } from "@/composables/filter/civDefaultProvider";
import PickerDialog from "@/components/common/PickerDialog.vue";
import FileDropZone from "@/components/common/FileDropZone.vue";

export default {
  name: "AvatarPicker",
  components: { PickerDialog, FileDropZone },
  props: {
    modelValue: { type: Boolean, required: true },
  },
  emits: ["update:modelValue"],
  setup(props, { emit }) {
    const store = useStore();

    const activeTab = ref("initials");
    const saving = ref(false);
    const uploadPreview = ref(null);
    const uploadBlob = ref(null);

    const pending = ref({ type: "initials", ref: null });

    const initials = computed(() => {
      const name = store.state.user?.displayName ?? "";
      return name.slice(0, 2).toUpperCase() || "?";
    });

    const availableCivs = computed(() =>
      civs.value.filter((c) => c.shortName !== "ANY")
    );

    watch(activeTab, (tab) => {
      if (tab === "initials") pending.value = { type: "initials", ref: null };
      if (tab === "civ") pending.value = { type: "civ", ref: pending.value.type === "civ" ? pending.value.ref : null };
      if (tab === "upload") pending.value = { type: "upload", ref: null };
      if (tab !== "upload") { uploadPreview.value = null; uploadBlob.value = null; }
    });

    watch(() => props.modelValue, (open) => {
      if (!open) return;
      const av = store.state.userAvatar;
      if (!av || av.type === "initials") {
        activeTab.value = "initials";
        pending.value = { type: "initials", ref: null };
      } else if (av.type === "civ") {
        activeTab.value = "civ";
        pending.value = { type: "civ", ref: av.ref };
      } else {
        activeTab.value = "upload";
        uploadPreview.value = av.ref;
        pending.value = { type: "upload", ref: av.ref };
      }
    });

    const canSave = computed(() => {
      if (pending.value.type === "initials") return true;
      if (pending.value.type === "civ") return !!pending.value.ref;
      if (pending.value.type === "upload") return !!uploadBlob.value || !!pending.value.ref;
      return false;
    });

    function selectCiv(civ) {
      pending.value = { type: "civ", ref: civ.shortName };
    }

    function processFile(file) {
      if (!file || !file.type.startsWith("image/")) return;
      resizeImage(file, 256).then((blob) => {
        uploadBlob.value = blob;
        uploadPreview.value = URL.createObjectURL(blob);
        pending.value = { type: "upload", ref: null };
      });
    }

    function processFiles(fileList) {
      processFile(fileList[0]);
    }

    function resizeImage(file, size) {
      return new Promise((resolve) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = canvas.height = size;
          const ctx = canvas.getContext("2d");
          const side = Math.min(img.width, img.height);
          const sx = (img.width - side) / 2;
          const sy = (img.height - side) / 2;
          ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
          canvas.toBlob((blob) => { URL.revokeObjectURL(url); resolve(blob); }, "image/webp", 0.82);
        };
        img.src = url;
      });
    }

    async function save() {
      saving.value = true;
      try {
        if (pending.value.type === "upload" && uploadBlob.value) {
          await store.dispatch("uploadAndSetAvatar", uploadBlob.value);
        } else {
          await store.dispatch("updateAvatar", pending.value);
        }
        emit("update:modelValue", false);
      } catch (err) {
        store.dispatch("showSnackbar", { text: err?.message || "Could not save avatar. Please try again.", type: "error" });
      } finally {
        saving.value = false;
      }
    }

    return {
      activeTab, saving, uploadPreview, uploadBlob, pending, initials,
      availableCivs, canSave, selectCiv, processFiles, save,
    };
  },
};
</script>
