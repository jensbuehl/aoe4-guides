<template>
  <v-alert rounded="lg" outlined color="accent" class="pa-1 mt-6 mb-2">
    <v-card flat rounded="lg">
      <v-img color="surface-variant" height="200" src="/dlc-banner.webp" cover></v-img>
      <v-card-title>DLC Update | Now Live!</v-card-title>
      <v-card-text>
        <p class="mb-2">
          Aoe4Guides just got a major update! All units, buildings, and techs from the new DLC
          <strong>Knights of Cross and Rose</strong> are now added.
        </p>
        <p class="mb-2">
          If you stumble across anything missing or broken - yeah, it happens - just let me know.
        </p>
        <p class="mb-2">
          If this update saved you some time or clicks, consider throwing a coin my way. It helps
          keep the site running.
        </p>
        <p class="mb-2">Thanks for keeping the site alive. You're awesome.</p>
        <p class="mb-2">/3,<br />exe</p>
        <p>
          P.S. '<strong>::</strong>' is <strong>the shortcut</strong> to get your builds done
          quicker!
        </p>
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
  setup() {},
};
</script>
