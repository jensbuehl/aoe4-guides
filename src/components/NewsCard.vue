<template>
  <v-alert rounded="lg" outlined color="accent" class="pa-1">
    <v-card flat rounded="lg">
      <v-card-title>New Year, new patch!</v-card-title>
      <v-card-text
        >The new Japanese technologies are now available. <br /><br />
        <v-row no-gutters>
          <v-col align="center" justify="center"
            ><v-img
              class="icon-tech-selector"
              src="/assets/pictures/technology_japanese/shinto_rituals.png"
            ></v-img
          ></v-col>
          <v-col align="center" justify="center"
            ><v-img
            class="icon-tech-selector"
              src="/assets/pictures/technology_japanese/gion_festival.png"
            ></v-img
          ></v-col>
          <v-col align="center" justify="center"
            ><v-img
            class="icon-tech-selector"
              src="/assets/pictures/technology_japanese/bunrei.png"
            ></v-img
          ></v-col>
          <v-col align="center" justify="center"
            ><v-img
            class="icon-tech-selector"
              src="/assets/pictures/technology_japanese/zen.png"
            ></v-img
          ></v-col>
          <v-col align="center" justify="center"
            ><v-img
            class="icon-tech-selector"
              src="/assets/pictures/technology_japanese/nehan.png"
            ></v-img
          ></v-col>
          <v-col align="center" justify="center"
            ><v-img
            class="icon-tech-selector"
              src="/assets/pictures/technology_japanese/five_ministries.png"
            ></v-img
          ></v-col>
        </v-row><br /><br />
        If you are a happy villager, please consider supporting to cover the
        operational costs! <br /><br />
        A funding goal for 2024 is now live for olive oil and coffee! Happy
        scouting!<br /><br />
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
  name: "NewsCard",
  setup() {},
};
</script>
