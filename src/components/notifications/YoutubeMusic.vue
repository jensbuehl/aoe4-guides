<template>
  <v-row no-gutters
    ><v-col class="ml-2 mt-4 mb-4" cols="auto"
      ><v-icon icon="mdi-music" size="small" class="mx-2 mb-1"></v-icon
      ><span class="text-h6">Age of Empires Radio</span>
    </v-col></v-row
  >
  <v-card flat rounded="lg">
    <v-carousel color="accent" show-arrows="hover" hide-delimiters height="190">
      <v-carousel-item v-for="song in songsShortList"
        ><div align="center">
          <iframe
            width="100%"
            height="190px"
            :src="song.url"
            frameborder="0"
            allowfullscreen
          ></iframe></div
      ></v-carousel-item>
    </v-carousel>
  </v-card>
</template>

<script>
import { songs, shuffleArray } from "@/composables/data/youtubeMusicProvider";

export default {
  name: "YoutubeMusic",
  setup() {
    shuffleArray(songs);  
    const songsShortList = songs.slice(0, 5);  
    return { songsShortList };
  },
};
</script>
