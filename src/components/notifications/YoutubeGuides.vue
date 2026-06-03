<template>
  <v-card flat rounded="lg" class="mb-4">
    <v-card-title class="px-4 py-2 pb-2">
      <v-icon icon="mdi-youtube" size="small" class="mr-2 mb-1" color="primary"></v-icon>
      Video Guides
    </v-card-title>
    <v-card-text class="pa-4 pt-0">
      <v-carousel v-if="videosIds" color="accent" show-arrows="hover" hide-delimiters cycle height="190">
        <v-carousel-item v-for="videoId in videosIds">
          <div style="border-radius: 8px; overflow: hidden; height: 190px">
            <iframe
              width="100%"
              height="190px"
              :src="'https://www.youtube.com/embed/' + videoId"
              frameborder="0"
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
import { ref, onMounted } from "vue";

export default {
  name: "YoutubeGuides",
  setup() {
    const videosIds = ref(null);

    onMounted(async () => {
      videosIds.value = await getRecentYoutubeVideos();
    });

    return { videosIds };
  },
};
</script>
