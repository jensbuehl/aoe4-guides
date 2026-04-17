<template>
  <v-alert rounded="lg" outlined color="accent" class="pa-1 mt-6 mb-2">
    <v-card flat rounded="lg">
      <v-img color="surface-variant" src="/Season11-banner.webp"></v-img>
      <v-card-title>Yue Fei’s Legacy Pre-Order</v-card-title>
      <v-card-text>

        <div class="mt-4">
          <strong>Pre-Order Yue Fei’s Legacy</strong><br>
          Yue Fei’s Legacy is available for pre-order now on Steam, Microsoft Store, and Xbox, and receive a 15% discount!<br>
          Coming May 7th!<br><br>
          <div class="text-center">
            <v-btn
              href="https://store.steampowered.com/app/3746540/Age_of_Empires_IV_Yue_Feis_Legacy/"
              target="_blank"
              class="ma-2"
              size="small"
              variant="outlined"
              color="primary"
              style="background-color: transparent"
            >
              <template v-slot:prepend>
                <v-icon color="primary">mdi-steam</v-icon>
              </template>
              Steam
            </v-btn>
            <v-btn
              href="https://www.xbox.com/de-DE/games/store/age-of-empires-iv-yue-fei-s-legacy/9n56pn5w9900?ocid=storeforweb"
              target="_blank"
              class="ma-2"
              size="small"
              variant="outlined"
              color="primary"
              style="background-color: transparent"
            >
              <template v-slot:prepend>
                <v-icon color="primary">mdi-microsoft</v-icon>
              </template>
              Microsoft Store
            </v-btn>
            <v-btn
              href="https://www.xbox.com/en-US/games/store/age-of-empires-iv-yue-feis-legacy/9pcrnw20sw1p"
              target="_blank"
              class="ma-2"
              size="small"
              variant="outlined"
              color="primary"
              style="background-color: transparent"
            >
              <template v-slot:prepend>
                <v-icon color="primary">mdi-microsoft-xbox</v-icon>
              </template>
              Xbox
            </v-btn>
          </div><br>
          We are working on supporting the new civilization.
        </div>

        
        
        <div class="video-container mt-4">
          <iframe
          class="video"
          :src="'https://www.youtube.com/embed/7CW5mLD1T9g'"
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
