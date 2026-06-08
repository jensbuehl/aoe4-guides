<template>
  <PickerDialog
    :model-value="modelValue"
    title="Import Build Order"
    title-icon="mdi-tray-arrow-down"
    max-width="540"
    @update:model-value="onClose"
  >
    <v-tabs v-model="activeTab" color="primary" class="px-4">
      <v-tab value="file">Upload file</v-tab>
      <v-tab value="clipboard">From clipboard</v-tab>
    </v-tabs>

    <v-card-text class="px-6 pt-4 pb-2" style="min-height: 200px">
      <v-window v-model="activeTab">

        <!-- Upload file tab -->
        <v-window-item value="file">
          <!-- Selected file chip -->
          <div
            v-if="fileChip"
            class="d-flex align-center ga-2 mb-3 pa-3 rounded-lg"
            style="border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity))"
          >
            <v-icon color="medium-emphasis">mdi-file-document-outline</v-icon>
            <span class="text-body-2 flex-grow-1 text-truncate">{{ fileChip.name }}</span>
            <span class="text-caption text-medium-emphasis">{{ fmtSize(fileChip.size) }}</span>
            <v-btn icon="mdi-close" size="x-small" variant="text" @click="clearFile" />
          </div>

          <!-- Drop zone -->
          <FileDropZone
            v-if="!fileChip"
            accept=".json,.bo"
            label="Drop your build order here or <u>click to browse</u>"
            hint="Accepts .json and .bo exports from the overlay tool"
            @files="onFilesDropped"
          />

          <!-- Preview / error -->
          <div v-if="fileParsed && fileParsed.ok" class="import-preview mt-3">
            <BuildPreviewCard :build="fileParsed.build" />
          </div>
          <v-alert
            v-else-if="fileParsed && !fileParsed.ok"
            type="error"
            variant="tonal"
            class="mt-3"
            role="alert"
          >
            <strong>Couldn't read that as a build order.</strong>
            {{ fileParsed.reason }}
            Export again from the AoE4 Overlay tool or age4builder, then retry.
          </v-alert>
        </v-window-item>

        <!-- From clipboard tab -->
        <v-window-item value="clipboard">
          <v-btn
            color="primary"
            variant="tonal"
            prepend-icon="mdi-content-paste"
            block
            class="mb-3"
            @click="pasteFromClipboard"
          >
            Paste from clipboard
          </v-btn>
          <p v-if="clipboardHint" class="text-caption text-medium-emphasis mb-2">{{ clipboardHint }}</p>
          <v-textarea
            v-model="clipboardText"
            variant="outlined"
            label="Or paste JSON here"
            rows="4"
            style="font-family: monospace"
            hide-details
          />

          <!-- Preview / error -->
          <div v-if="clipboardParsed && clipboardParsed.ok" class="import-preview mt-3">
            <BuildPreviewCard :build="clipboardParsed.build" />
          </div>
          <v-alert
            v-else-if="clipboardText && clipboardParsed && !clipboardParsed.ok"
            type="error"
            variant="tonal"
            class="mt-3"
            role="alert"
          >
            <strong>Couldn't read that as a build order.</strong>
            {{ clipboardParsed.reason }}
            Export again from the AoE4 Overlay tool or age4builder, then retry.
          </v-alert>
        </v-window-item>

      </v-window>
    </v-card-text>

    <template #actions>
      <v-btn variant="text" @click="onClose">Cancel</v-btn>
      <v-btn
        color="primary"
        variant="flat"
        :disabled="!canImport"
        @click="doImport"
      >
        Import build
      </v-btn>
    </template>
  </PickerDialog>
</template>

<script>
import { ref, computed, watch } from "vue";
import { useStore } from "vuex";
import { useRouter } from "vue-router";
import { civs } from "@/composables/filter/civDefaultProvider";
import useImportOverlayFormat from "@/composables/converter/useImportOverlayFormat";
import PickerDialog from "@/components/common/PickerDialog.vue";
import FileDropZone from "@/components/common/FileDropZone.vue";
import BuildPreviewCard from "@/components/builds/BuildPreviewCard.vue";

export default {
  name: "BuildImportDialog",
  components: { PickerDialog, FileDropZone, BuildPreviewCard },
  props: {
    modelValue: { type: Boolean, required: true },
  },
  emits: ["update:modelValue"],
  setup(props, { emit }) {
    const store = useStore();
    const router = useRouter();
    const { convert } = useImportOverlayFormat();

    const activeTab = ref("file");

    // File tab state
    const fileChip = ref(null);
    const fileParsed = ref(null);
    const fileRaw = ref(null);

    // Clipboard tab state
    const clipboardText = ref("");
    const clipboardParsed = ref(null);
    const clipboardHint = ref("");

    // Reset all staged input when dialog closes
    watch(() => props.modelValue, (open) => {
      if (!open) {
        activeTab.value = "file";
        fileChip.value = null;
        fileParsed.value = null;
        fileRaw.value = null;
        clipboardText.value = "";
        clipboardParsed.value = null;
        clipboardHint.value = "";
      }
    });

    // Live-parse clipboard textarea
    watch(clipboardText, (text) => {
      clipboardParsed.value = text ? parseBuild(text) : null;
      if (clipboardParsed.value?.ok) clipboardHint.value = "";
    });

    function parseBuild(text) {
      let obj;
      try { obj = JSON.parse(text); } catch {
        return { ok: false, reason: "That isn't valid JSON." };
      }
      if (typeof obj !== "object" || Array.isArray(obj) || obj === null) {
        return { ok: false, reason: "Expected a build-order object, not an array or primitive." };
      }
      if (!obj.name || !Array.isArray(obj.build_order)) {
        return { ok: false, reason: "Missing a build name or step list." };
      }
      const civ = civs.value.find((c) => c.title === obj.civilization);
      return {
        ok: true,
        raw: obj,
        build: {
          title: obj.name,
          author: obj.author || "",
          civFlag: civ?.flagSmall ?? civs.value.find((c) => c.shortName === "ANY")?.flagSmall ?? "",
          civName: civ?.title ?? obj.civilization ?? "",
          steps: obj.build_order.length,
          strategy: obj.strategy || null,
          season: obj.season || null,
          hasVideo: !!obj.video,
        },
      };
    }

    function fmtSize(bytes) {
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }

    async function onFilesDropped(fileList) {
      const file = fileList[0];
      if (!file) return;
      fileChip.value = { name: file.name, size: file.size };
      try {
        const text = await file.text();
        fileParsed.value = parseBuild(text);
        fileRaw.value = fileParsed.value?.ok ? fileParsed.value.raw : null;
      } catch {
        fileParsed.value = { ok: false, reason: "Could not read the file." };
        fileRaw.value = null;
      }
    }

    function clearFile() {
      fileChip.value = null;
      fileParsed.value = null;
      fileRaw.value = null;
    }

    async function pasteFromClipboard() {
      try {
        const text = await navigator.clipboard.readText();
        if (!text) {
          clipboardHint.value = "Clipboard was empty — paste your build JSON into the box below.";
          return;
        }
        clipboardText.value = text;
        clipboardHint.value = "";
      } catch {
        clipboardHint.value = "Clipboard access was blocked — paste your build JSON into the box below.";
      }
    }

    const activeParsed = computed(() =>
      activeTab.value === "file" ? fileParsed.value : clipboardParsed.value
    );

    const canImport = computed(() => activeParsed.value?.ok === true);

    function onClose() {
      emit("update:modelValue", false);
    }

    function doImport() {
      if (!canImport.value) return;

      const user = store.state.user;
      if (!user) {
        store.dispatch("openAuthDialog", { mode: "login" });
        return;
      }
      if (!user.emailVerified) {
        store.dispatch("showSnackbar", {
          text: "Please verify your email address to use this feature.",
          type: "warning",
        });
        return;
      }

      const raw = activeTab.value === "file" ? fileRaw.value : activeParsed.value.raw;
      const template = convert(raw);
      store.commit("setTemplate", template);
      store.dispatch("showSnackbar", {
        text: "Build order imported successfully",
        type: "success",
      });
      router.push({ name: "BuildNew" });
      onClose();
    }

    return {
      activeTab,
      fileChip, fileParsed,
      clipboardText, clipboardParsed, clipboardHint,
      canImport,
      fmtSize, onFilesDropped, clearFile, pasteFromClipboard, onClose, doImport,
    };
  },
};
</script>

<style scoped>
.import-preview {
  border-radius: 13px;
  padding: 15px 16px;
  background: rgba(var(--v-theme-success), 0.09);
  border: 1px solid rgba(var(--v-theme-success), 0.34);
}
</style>
