<template>
  <v-container>
    <div class="d-flex justify-center">
      <v-card class="pa-5" rounded="lg" width="1024px" fluid>
        <h1>About AoE4 Guides</h1>

        <p>
          AoE4 Guides is a fan-made for-fun project and not affiliated with
          Relic or Microsoft.
        </p><br>

        <h2>Who made AoE4 Guides?</h2>
        <p>
          AoE4 World is made by Jens Bühl. It's a purely for fun project made
            out of love for the game. The goal is to be the most useful place
            for AoE4 guides and build orders.
        </p><br>

        <h2>How can I support AoE4 Guides?</h2>
        <p>
          The easiest way is spreading your enthusiasm for the site. 
            The second way is to donate so we can pay the server and other operational costs. 
            If you are a developer with some skill in Vue, Javascript, or Firebase you can contribute to the development of AoE4 Guides.
        </p><br>

      </v-card>
    </div>
  </v-container>
</template>

<script>
export default {
  name: "About",
  setup() {
    window.scrollTo(0,0);
  },
};
</script>
