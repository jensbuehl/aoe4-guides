<template>
  <v-row no-gutters
    ><v-col class="ml-2 mt-4 mb-4" cols="auto"
      ><v-icon icon="mdi-youtube" size="small" class="mx-2 mb-1"></v-icon
      ><span class="text-h6">Youtube Guides</span>
    </v-col></v-row
  >
  <v-card flat rounded="lg">
    <v-carousel color="accent" show-arrows="hover" hide-delimiter-background cycle height="190">
      <v-carousel-item v-for="video in videos"
        ><div align="center">
          <iframe
            width="100%"
            height="190px"
            src="https://www.youtube.com/embed/{{video.id.videoId}}"
            frameborder="0"
            allowfullscreen
          ></iframe></div
      ></v-carousel-item>
    </v-carousel>
  </v-card>
</template>

<script>
import youtubeService from "@/composables/builds/youtubeService";

export default {
  name: "YoutubeGuides",
  setup() {
    const { search } = youtubeService();
    var videos = search("aoe4 build order guide", 5);
    return { videos };
  },
};
</script>
