<template>
  <v-alert rounded="lg" outlined color="accent" class="pa-1">
    <v-card flat rounded="lg">
      <v-card-title>Build Faster!</v-card-title>
      <v-card-text>
        Attention Age of Empires fans! Say hello to "Autocomplete". 
        
        <br /><br />The feature was designed to streamline your
        strategy crafting and guide creation and making guide and build order creation quicker and
        more efficient. Did you try it out, yet?
        <v-img class="pa-4 ma-4" src="/autocomplete.gif"></v-img>
        Thanks for your support and happy scouting!
      </v-card-text>

      <v-row class="ma-2" no-gutters>
        <v-col align="center" justify="center"
          ><a href="https://ko-fi.com/jensbuehl"
            ><v-btn
              class="ma-2"
              size="small"
              variant="plain"
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
    </v-card></v-alert
  >
</template>

<script>
export default {
  name: "News",
  setup() {},
};
</script>
