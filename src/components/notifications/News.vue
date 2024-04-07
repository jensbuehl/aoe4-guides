<template>
  <v-alert rounded="lg" outlined color="accent" class="pa-1">
    <v-card flat rounded="lg">
      <v-card-title>Improve Faster!</v-card-title>
      <v-card-text>
        We're excited to unveil a new update, powered by the rich data from <b>AoE4 World</b>! Thanks to the AoE4 World team for providing us with the detailed insights that make this enhancement possible.<br><br>
        <b>Enhanced Tooltips:</b>
        Get detailed descriptions and costs for units and buildings directly in tooltips, making
        your strategizing more informed and efficient.<br><br>
        
        <b>Direct aoe4world Exploration:</b>
        Curious about a unit or building? Click on their images to dive into aoe4world for comprehensive
        stats and insights.<br><br>
                
        <b>Autocomplete</b>: For those who haven't explored it yet, the "autocomplete"
        continues to streamline your build order crafting process. Just try typing '::' and see
        what happens!<br><br>

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
    </v-card>
    <!--v-card flat rounded="lg">
      <v-card-title>Autocomplete & Notes!</v-card-title>
      <v-card-text>
        We're thrilled to introduce a new feature for all villagers: The ability to add notes to
        each build order section. <br /><br />
        This addition allows you to annotate your strategies with tips, reminders, or alternative
        tactics, ensuring that your game plan is as detailed and adaptable as possible.<br /><br />

        And for those who haven't explored it yet, the "autocomplete" feature continues to
        streamline your build order crafting process.

        <v-img class="ma-8" src="/autocomplete.gif"></v-img>
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
    </v-card--></v-alert
  >
</template>

<script>
export default {
  name: "News",
  setup() {},
};
</script>
