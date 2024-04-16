<template>
  <v-alert rounded="lg" outlined color="accent" class="pa-1">
    <v-card flat rounded="lg">
      <v-card-title>Autoplay and Voice Over!</v-card-title>
      <v-card-text>
        Hey, strategy enthusiasts! <br /><br />

        I've just rolled out the following updates:<br /><br />

        <b>1. Autoplay in Focus Mode:</b>
        Just set your build order timestamps, and let autoplay smoothly guide you through your
        strategy without lifting a finger. Perfect for keeping the flow while you strategize! (Note:
        Timestamps need to be available in your build order; some minor gaps will be filled based on
        heuristics.)
        <br /><br />
        <b>2. Voice Over for Focus Mode:</b> Dive deeper with the new text-to-speech feature for
        each build step. Don't want to break your concentration with sound? No worries, you can
        toggle this feature off anytime. (Note: Best experienced on Microsoft Edge or Google Chrome
        for optimal voice over.) <br /><br />

        Check out these features now and take your Age of Empires 4 learning expericence to the next
        level! Thanks for your support and happy scouting!
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
      </v-row></v-card
    >
  </v-alert>
</template>

<script>
export default {
  name: "News",
  setup() {},
};
</script>
