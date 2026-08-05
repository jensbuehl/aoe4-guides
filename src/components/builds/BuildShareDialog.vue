<template>
  <PickerDialog
    :model-value="modelValue"
    title="Share Build Order"
    title-icon="mdi-share-variant"
    max-width="380"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <!-- pb-5 stands in for the actions row this dialog deliberately omits:
         nothing here is pending, so a Close button would only repeat the
         title-bar X, Esc and the scrim. -->
    <v-card-text class="px-6 pt-2 pb-5">
      <!-- Always white, in both themes: cameras expect dark-on-light and an
           inverted code is a silent failure — it looks fine and never scans. -->
      <div class="qr-surface mx-auto d-flex align-center justify-center">
        <v-progress-circular
          v-if="qrState === 'pending'"
          indeterminate
          size="32"
          color="grey-darken-1"
        ></v-progress-circular>
        <img
          v-else-if="qrState === 'ready'"
          :src="qrDataUrl"
          :alt="`QR code opening ${build.title} in focus mode`"
          class="qr-image"
        />
        <span v-else class="text-caption text-medium-emphasis text-center px-4">
          QR code unavailable
        </span>
      </div>

      <p class="text-caption text-medium-emphasis text-center mt-3 mb-0">
        Scan to open on your phone in focus mode
      </p>

      <v-btn
        v-if="shareIsSupported"
        color="primary"
        variant="flat"
        prepend-icon="mdi-export-variant"
        block
        class="mt-4"
        @click="handleShare"
      >
        Share link
      </v-btn>
    </v-card-text>
  </PickerDialog>
</template>

<script>
import { ref, computed, watch } from "vue";
import { useShare } from "@vueuse/core";
import PickerDialog from "@/components/common/PickerDialog.vue";

// Brand navy on white, fixed in both themes rather than following the theme.
// Two constraints drive this and they are easy to break by eye:
//   - Polarity: cameras expect dark modules on a light field. An inverted code
//     looks deliberate and simply never scans.
//   - Contrast: navy #294790 on white is 8.8:1. The gold accent (#CCAA55) is
//     only 2.2:1 — it would look perfectly on-brand and silently fail to read.
// Anything substituted here needs its contrast checked, not just eyeballed.
const QR_DARK = "#294790";
const QR_LIGHT = "#FFFFFF";

export default {
  name: "BuildShareDialog",
  components: { PickerDialog },
  props: {
    build: { type: Object, required: true },
    modelValue: { type: Boolean, required: true },
  },
  emits: ["update:modelValue"],
  setup(props) {
    // Derived from build.id rather than the route param: BuildDetails fetches in
    // onMounted only, so on an in-app move between two /builds/:id routes the
    // param updates while the rendered build does not. This keeps every link
    // pointing at the build actually on screen.
    const shareUrl = computed(
      () => `${window.location.origin}/builds/${props.build.id}`
    );

    // ?focus=true — the value is mandatory, not decoration. BuildDetails
    // truthiness-tests route.query.focus, and a bare ?focus parses to the empty
    // string, which is falsy: the phone would silently land on the ordinary
    // build page instead of focus mode.
    const focusUrl = computed(() => `${shareUrl.value}?focus=true`);

    const qrState = ref("pending");
    const qrDataUrl = ref(null);
    const qrBuiltFor = ref(null);

    async function generateQr() {
      // Already rendered for this exact build — reopening shouldn't flicker.
      if (qrBuiltFor.value === focusUrl.value) return;

      qrState.value = "pending";
      try {
        // Imported here rather than at the top of the file so the ~20KB
        // encoder stays in its own lazy chunk. Most visitors never open this
        // dialog and must not pay for it on page load.
        const QRCode = (await import("qrcode")).default;
        qrDataUrl.value = await QRCode.toDataURL(focusUrl.value, {
          width: 220,
          // Quiet zone. Without it scanners fail intermittently, in a way
          // that's very hard to attribute after the fact.
          margin: 4,
          color: { dark: QR_DARK, light: QR_LIGHT },
        });
        qrBuiltFor.value = focusUrl.value;
        qrState.value = "ready";
      } catch {
        // Offline, blocked request, transient chunk failure. The dialog stays
        // usable and says so; nothing escapes.
        qrState.value = "failed";
      }
    }

    watch(
      () => props.modelValue,
      (open) => {
        if (open) generateQr();
      },
      { immediate: true }
    );

    const { share, isSupported: shareIsSupported } = useShare();

    const handleShare = async () => {
      try {
        // The plain URL, with no focus flag: this one is going to another
        // person, who hasn't chosen to be dropped into a fullscreen
        // follow-along surface.
        await share({ title: props.build.title, url: shareUrl.value });
      } catch {
        // Dismissing the share sheet rejects with AbortError. That's a normal
        // outcome, not a failure — it must never surface to the player.
      }
    };

    return {
      qrState,
      qrDataUrl,
      shareIsSupported,
      handleShare,
    };
  },
};
</script>

<style scoped>
.qr-surface {
  background: #ffffff;
  /* The dialog surface is near-white in light theme, so the panel needs an
     outline to read as a deliberate card rather than a gap. */
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 12px;
  padding: 12px;
  width: 244px;
  max-width: 100%;
  aspect-ratio: 1;
}

.qr-image {
  display: block;
  width: 100%;
  height: auto;
}
</style>
