<template>
  <v-alert rounded="lg" outlined color="accent" class="pa-1 mt-6 mb-2">
    <v-card flat rounded="lg">
      <v-img color="surface-variant" src="/Season11-banner.webp"></v-img>
      <v-card-title> Season 11 | WOLOLO </v-card-title>
      <v-card-text>
        <p>
          🚀 Season 11 of Age of Empires IV is here! We've rolled out performance improvements to
          ensure your experience is smoother and faster than ever. Let’s celebrate with a big, booming WOLOLO!
        </p>

        <p class="mt-4">
          📊 Thanks to your support, the last season was the most traffic-heavy to date!
        </p>

        <p class="mt-4">
          💖 Want to help keep the momentum going? Consider supporting us on Ko-fi to help cover costs.
        </p>

        <div class="video-container mt-4">
          <iframe class="video" :src="'https://www.youtube.com/embed/YHIqfYOY5LU'"></iframe>
        </div>
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
