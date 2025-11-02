<template>
  <v-alert rounded="lg" outlined color="accent" class="pa-1 mt-6 mb-2">
    <v-card flat rounded="lg">
      <v-img color="surface-variant" src="/Season11-banner.webp"></v-img>
      <v-card-title>Dynasties of the East — Now Live!</v-card-title>
      <v-card-text>
        <p>
          🚀 The "Dynasties of the East" DLC update is live now and you can start using the four new
          civilizations today: Golden Horde, Macedonian Dynasty, Sengoku Daimyo, and Tughlaq
          Dynasty.
        </p>

        <p class="mt-4">
          More exciting information about the DLC and how to get it here:</p>

        <v-row class="mx-2" no-gutters>
          <v-col align="center" justify="center">
            <a href="https://www.youtube.com/watch?v=f9lffIAztko" target="_blank">
              <v-btn
                class="ma-2"
                size="small"
                variant="text"
                color="primary"
                style="background-color: transparent"
              >
                <template v-slot:prepend>
                  <v-icon color="primary">mdi-play-circle</v-icon>
                </template>
                Trailer
              </v-btn>
            </a>
            <a href="https://www.ageofempires.com/games/age-of-empires-iv/dynasties-of-the-east/" target="_blank">
              <v-btn
                class="ma-2"
                size="small"
                variant="text"
                color="primary"
                style="background-color: transparent"
              >
                <template v-slot:prepend>
                  <v-icon color="primary">mdi-web</v-icon>
                </template>
                Website
              </v-btn>
            </a>
          </v-col>
        </v-row>
        
        <div class="video-container mt-4">
          <iframe
          class="video"
          :src="'https://www.youtube.com/embed/NFT1552oa1c'"
          allowfullscreen
          ></iframe>
        </div>
        <p class="mt-4">
          📊 Thanks to your support, the last season was the most traffic-heavy to date!
        </p>

        <p class="mt-4">
          💖 If you'd like to support ongoing development and hosting costs, consider donating on
          Ko-fi.
        </p>
      </v-card-text>

      <v-row class="mx-2 mb-2" no-gutters>
        <v-col align="center" justify="center">
          <a href="https://ko-fi.com/jensbuehl" target="_blank">
            <v-btn
              class="ma-2"
              size="small"
              variant="text"
              color="primary"
              style="background-color: transparent"
            >
              <template v-slot:prepend>
                <v-icon color="red">mdi-heart</v-icon>
              </template>
              Donate
            </v-btn>
          </a>
          <a href="https://discord.gg/Nau9BN5E7J" target="_blank">
            <v-btn
              class="ma-2"
              size="small"
              variant="text"
              color="primary"
              style="background-color: transparent"
            >
              <template v-slot:prepend>
                <v-icon color="primary">mdi-chat</v-icon>
              </template>
              Discord
            </v-btn>
          </a>
          <v-btn
            size="small"
            class="ma-2"
            prepend-icon="mdi-github"
            variant="text"
            color="primary"
            to="/github"
          >
            Contribute
          </v-btn>
        </v-col>
      </v-row>
    </v-card>
  </v-alert>
</template>

<script>
export default {
  name: "News",
  setup() {},
};
</script>

<style>
.video-container {
  position: relative;
  width: 100%;
  padding-bottom: 56.25%;
}
.video {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: 0;
}
</style>
