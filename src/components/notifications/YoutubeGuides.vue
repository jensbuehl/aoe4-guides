<template>
  <v-card flat rounded="lg" class="mb-4">
    <v-card-title class="px-4 py-2 pb-2">
      <v-icon icon="mdi-youtube" size="small" class="mr-2 mb-1" color="primary"></v-icon>
      Video Guides
    </v-card-title>
    <v-card-text class="pa-4 pt-0">
      <v-carousel
        v-if="videosIds"
        v-model="currentIndex"
        color="accent"
        show-arrows="hover"
        hide-delimiters
        :cycle="isCycling"
        height="190"
        @mouseenter="onPointerEnter"
        @mouseleave="isHovered = false"
      >
        <v-carousel-item v-for="(videoId, index) in videosIds" :key="videoId">
          <div style="border-radius: 8px; overflow: hidden; height: 190px">
            <iframe
              :ref="(el) => registerPlayer(videoId, el)"
              width="100%"
              height="190px"
              :src="buildEmbedSrc(videoId)"
              :title="`Video guide ${index + 1} of ${videosIds.length}`"
              frameborder="0"
              allow="accelerometer; encrypted-media; picture-in-picture; web-share"
              allowfullscreen
            ></iframe>
          </div>
        </v-carousel-item>
      </v-carousel>
    </v-card-text>
  </v-card>
</template>

<script>
import { getRecentYoutubeVideos } from "@/composables/data/homeService";
import { buildEmbedSrc, useYoutubePlayers } from "@/composables/useYoutubePlayers";
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";

export default {
  name: "YoutubeGuides",
  setup() {
    const videosIds = ref(null);
    const currentIndex = ref(0);
    const isHovered = ref(false);
    const { registerPlayer, pause, isPlaying } = useYoutubePlayers();

    // Touch browsers fire mouseenter on tap and never leave, which would stop
    // the rotation for good. Only a real pointer may hold it.
    const canHover = window.matchMedia("(hover: hover)").matches;
    const onPointerEnter = () => {
      if (canHover) isHovered.value = true;
    };

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const prefersReducedMotion = ref(reducedMotion.matches);
    const onMotionPreferenceChange = (event) => {
      prefersReducedMotion.value = event.matches;
    };
    reducedMotion.addEventListener("change", onMotionPreferenceChange);
    onBeforeUnmount(() => {
      reducedMotion.removeEventListener("change", onMotionPreferenceChange);
    });

    // Rotate only while nobody is watching or pointing at the carousel.
    const isCycling = computed(
      () => !isPlaying.value && !isHovered.value && !prefersReducedMotion.value
    );

    // Whatever slid away stops playing, so audio never trails the visible video.
    watch(currentIndex, (_, previousIndex) => {
      const previousId = videosIds.value?.[previousIndex];
      if (previousId) pause(previousId);
    });

    onMounted(async () => {
      videosIds.value = await getRecentYoutubeVideos();
    });

    return {
      videosIds,
      currentIndex,
      isHovered,
      isCycling,
      onPointerEnter,
      registerPlayer,
      buildEmbedSrc,
    };
  },
};
</script>
