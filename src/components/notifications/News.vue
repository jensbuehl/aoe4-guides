<template>
  <v-alert rounded="lg" outlined color="accent" class="pa-1 mt-6 mb-2">
    <v-card flat rounded="lg">
      <v-card-title>Civilization Overviews!</v-card-title>
      <v-card-text>
        <p class="mb-4">
          I am excited to introduce a new feature that gives you a quick
          <strong>overview</strong> of the most relevant build orders for your main civ. No more
          endless searching - just <strong>pick your civilization</strong>.
        </p>

        <p class="mb-4">/3,<br />exe</p>

        <p>
          P.S. '<strong>::</strong>' is <strong>the shortcut</strong> to get your
          builds done quicker!
        </p>
      </v-card-text>

      <v-row class="mx-2" no-gutters>
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
              Support me
            </v-btn></a
          ></v-col
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
