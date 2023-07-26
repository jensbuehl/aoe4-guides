<template>
  <div height="100px">
    <v-footer padless class="text-center d-flex flex-column text-grey">
      <v-row justify="center" class="my-4 text-center">
        <v-col cols="12">
          <v-btn
            class="mx-1"
            variant="plain"
            color="primary"
            onclick="location.href='https://ko-fi.com/jensbuehl'"
          >
            <template v-slot:prepend>
              <v-icon color="red">mdi-heart</v-icon>
            </template>
            Support me
          </v-btn>
          <v-btn
            class="mx-1"
            prepend-icon="mdi-github"
            variant="plain"
            color="primary"
            onclick="location.href='https://github.com/jensbuehl/aoe4-guides'"
            >Contribute
          </v-btn>
          <v-btn class="mx-1" variant="plain" color="primary" to="/privacy"
            >Privacy Policy
          </v-btn>
          <v-btn class="mx-1" variant="plain" color="primary" to="/about"
            >About
          </v-btn>
        </v-col>
        <v-col cols="12" md="8"
          >Age of Empires IV&copy; Microsoft Corporation. AoE4Guides.com was
          created under Microsoft's "<a
            :style="{
              color: $vuetify.theme.current.colors.primary,
            }"
            href="https://www.xbox.com/en-US/developers/rules"
            >Game Content Usage Rules</a
          >" using assets from
          <a
            :style="{
              color: $vuetify.theme.current.colors.primary,
            }"
            href="https://www.ageofempires.com/games/age-of-empires-iv/"
            >Age of Empires IV</a
          >, and it is not endorsed by or affiliated with Microsoft.</v-col
        >
      </v-row>
    </v-footer>
  </div>
</template>

<script>
export default {
  name: "Footer",
};
</script>
