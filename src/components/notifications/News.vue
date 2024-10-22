<template>
  <v-alert rounded="lg" outlined color="accent" class="pa-1 mt-6 mb-2">
    <v-card flat rounded="lg">
      <v-card-title>Season 9 Update</v-card-title>
      <v-card-text>
        <p class="mb-4">Hey AoE4 fans!</p>

        <p class="mb-4">
          Season 9 has dropped, and we've got some exciting updates. New technologies and units have
          entered the battlefield, shaking up strategies and adding depth to your gameplay. Get
          ready to experiment with fresh tactics and master these new additions! <br /><br />
          
          Stay tuned for updated guides, strategies, and tips to climb the ladder in Season 9!
        </p>

        <br />
        <v-row no-gutters>
          <v-col class="mb-2" align="center" justify="center"
            ><v-img
              class="icon-military-selector"
              src="/assets/pictures/unit_malians/freeborn-mansa.png"
            ></v-img
          ></v-col>
          <v-col class="mb-2" align="center" justify="center"
            ><v-img
              class="icon-military-selector"
              src="/assets/pictures/unit_malians/javelin-thrower-mansa.png"
            ></v-img
          ></v-col>
          <v-col class="mb-2" align="center" justify="center"
            ><v-img
              class="icon-military-selector"
              src="/assets/pictures/unit_malians/musofadi-mansa.png"
            ></v-img
          ></v-col>
          <v-col class="mb-2" align="center" justify="center"
            ><v-img
              class="icon-military-selector"
              src="/assets/pictures/unit_rus/horse-archer-3.png"
            ></v-img
          ></v-col>
        </v-row>
        <br />

        <p class="mb-4">/3,<br />exe</p>

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
