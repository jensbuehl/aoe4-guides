<template>
  <v-alert rounded="lg" outlined color="accent" class="pa-1 mt-6 mb-2">
    <v-card flat rounded="lg">
      <v-img color="surface-variant" src="/Season11-banner.webp"></v-img>
      <v-card-title> Season 11 Update </v-card-title>
      <v-card-text>
        <p>🚀 Season 11 of Age of Empires IV starting in July!</p>
        <p class="mt-4">⚙️ We've rolled out performance improvements to ensure your experience is smoother and faster than ever.</p>
        <p class="mt-4">📊 Thanks to your support, the last season was the most traffic-heavy to date!</p>
        
        <p class="font-weight-bold ma-4" align="center" justify="center">
          Help us keep up with the growing demand!
        </p>

        <p class="mt-4">
          Consider supporting the project on Ko-fi to help cover increased server and maintenance costs.
        </p>
      </v-card-text>

      <v-row class="mx-2 mb-2" no-gutters>
        <v-col align="center" justify="center">
          <a href="https://ko-fi.com/jensbuehl" target="_blank">
            <v-btn class="ma-2" size="small" variant="text" color="primary" style="background-color: transparent">
              <template v-slot:prepend>
                <v-icon color="red">mdi-heart</v-icon>
              </template>
              Donate
            </v-btn>
          </a>
          <a href="https://discord.gg/Nau9BN5E7J" target="_blank">
            <v-btn class="ma-2" size="small" variant="text" color="primary" style="background-color: transparent">
              <template v-slot:prepend>
                <v-icon color="primary">mdi-chat</v-icon>
              </template>
              Discord
            </v-btn>
          </a>
          <v-btn size="small" class="ma-2" prepend-icon="mdi-github" variant="text" color="primary" to="/github">
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
  setup() {
    
  },
};
</script>
