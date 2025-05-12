<template>
  <v-alert rounded="lg" outlined color="accent" class="pa-1 mt-6 mb-2">
    <v-card flat rounded="lg">
      <v-img color="surface-variant" src="/BotC-banner.webp"></v-img>
      <v-card-title> Battle of the Creatives</v-card-title>
      <v-card-text>
        Battle of the Creatives (BotC) - Age of Empires IV Tournament
        <br><br>

        <p>📅 When: 31.05. - 01.06.2025</p>
        <p>🌍 Language: Deutsch</p>
        <p>🎙️ Host & Cast: <a href="https://twitch.tv/ix_lash" target="_blank">Lash</a></p>
        <p>📺 Presented by: <a href="https://twitch.tv/aoe4togo" target="_blank">AOE IV TO GO</a></p>
        
        <p class="font-weight-bold ma-4" align="center"
      justify="center">
          Core, Avely, Striker, Lash, Crackedy, Ezra, Gullyd3ck3l
        </p>
        
        <p class="mt-4">Don't miss this epic clash of creative strategists! Join live and support your favorite players!</p>
      </v-card-text>

      <v-row class="mx-2 mb-2" no-gutters>
        <v-col align="center" justify="center"
          ><a href="https://ko-fi.com/jensbuehl"
            ><v-btn
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
            </v-btn></a
          ><a href="https://discord.gg/Nau9BN5E7J"
            ><v-btn
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
            </v-btn></a
          ><v-btn
            size="small"
            class="ma-2"
            prepend-icon="mdi-github"
            variant="text"
            color="primary"
            to="/github"
            >Contribute
          </v-btn></v-col
        >
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
