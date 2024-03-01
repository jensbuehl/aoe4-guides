<template>
  <div height="100px">
    <v-footer padless class="text-center d-flex flex-column">
      <v-row
        v-if="!(platform.android || platform.ios)"
        justify="center"
        class="mt-2 mb-4 text-center"
        ><v-col cols="12">
          <a href="https://ko-fi.com/jensbuehl"
            ><v-btn class="mx-1" variant="text" color="primary">
              <template v-slot:prepend>
                <v-icon color="red">mdi-heart</v-icon>
              </template>
              Support me
            </v-btn></a
          >

          <a href="https://github.com/jensbuehl/aoe4-guides"
            ><v-btn
              class="mx-1"
              prepend-icon="mdi-github"
              variant="text"
              color="primary"
            >
              <template v-slot:prepend>
                <v-icon color="accent">mdi-github</v-icon>
              </template>
              Contribute
            </v-btn></a
          >

          <a href="https://aoe4guides.com/api/api-docs"
            ><v-btn
              class="mx-1"
              prepend-icon="mdi-api"
              variant="text"
              color="primary"
            >
              <template v-slot:prepend>
                <v-icon color="accent">mdi-api</v-icon>
              </template>
              Interface
            </v-btn></a
          >
          <v-btn class="mx-1" variant="text" color="primary" to="/privacy"
            >Privacy Policy
          </v-btn>
          <v-btn class="mx-1" variant="text" color="primary" to="/about"
            >About
          </v-btn>
        </v-col>
        <v-col cols="12" md="8"
          >Age of Empires IV&copy; Microsoft Corporation. AoE4Guides.com was
          created under Microsoft's
          <a
            :style="{
              color: $vuetify.theme.current.colors.primary,
            }"
            style="text-decoration: none"
            href="https://www.xbox.com/en-US/developers/rules"
            >Game Content Usage Rules</a
          >
          using assets from
          <a
            :style="{
              color: $vuetify.theme.current.colors.primary,
            }"
            style="text-decoration: none"
            href="https://www.ageofempires.com/games/age-of-empires-iv/"
            >Age of Empires IV</a
          >, and it is not endorsed by or affiliated with Microsoft.</v-col
        ></v-row
      >
      <v-row v-else justify="center" class="mt-2 mb-16 text-center">
        <v-col cols="12">
          <a href="https://ko-fi.com/jensbuehl"
            ><v-btn class="mx-1" variant="text" color="primary">
              <template v-slot:prepend>
                <v-icon color="red">mdi-heart</v-icon>
              </template>
              Support me
            </v-btn></a
          >

          <a href="https://github.com/jensbuehl/aoe4-guides"
            ><v-btn
              class="mx-1"
              prepend-icon="mdi-github"
              variant="text"
              color="primary"
            >
              <template v-slot:prepend>
                <v-icon color="accent">mdi-github</v-icon>
              </template>
              Contribute
            </v-btn></a
          >

          <a href="https://aoe4guides.com/api/api-docs"
            ><v-btn
              class="mx-1"
              prepend-icon="mdi-api"
              variant="text"
              color="primary"
            >
              <template v-slot:prepend>
                <v-icon color="accent">mdi-api</v-icon>
              </template>
              Interface
            </v-btn></a
          >
          <v-btn class="mx-1" variant="text" color="primary" to="/privacy"
            >Privacy Policy
          </v-btn>
          <v-btn class="mx-1" variant="text" color="primary" to="/about"
            >About
          </v-btn>
        </v-col>
        <v-col cols="12" md="8"
          >Age of Empires IV&copy; Microsoft Corporation. AoE4Guides.com was
          created under Microsoft's
          <a
            :style="{
              color: $vuetify.theme.current.colors.primary,
            }"
            style="text-decoration: none"
            href="https://www.xbox.com/en-US/developers/rules"
            >Game Content Usage Rules</a
          >
          using assets from
          <a
            :style="{
              color: $vuetify.theme.current.colors.primary,
            }"
            style="text-decoration: none"
            href="https://www.ageofempires.com/games/age-of-empires-iv/"
            >Age of Empires IV</a
          >, and it is not endorsed by or affiliated with Microsoft.</v-col
        >
      </v-row>
    </v-footer>
  </div>
</template>

<script>
import { useDisplay } from "vuetify";

export default {
  name: "Footer",
  setup() {
    const { platform } = useDisplay();

    return {
      platform,
    };
  },
};
</script>
