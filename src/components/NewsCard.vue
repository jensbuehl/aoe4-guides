<template>
  <v-alert rounded="lg" outlined color="accent" class="pa-1">
    <v-card flat rounded="lg">
      <v-card-title>Contract Signed?</v-card-title>
      <v-card-text
        >Byzantines update is now live: The contracts and mercenaries are finally supported. Credits to Valdemar for reporting!<br /><br />
        <v-row no-gutters>
          <v-col align="center" justify="center"
            ><v-img
              class="icon-tech-selector"
              src="/assets/pictures/technology_byzantines/eastern-mercenary-contract-1.png"
            ></v-img
          ></v-col>
          <v-col align="center" justify="center"
            ><v-img
            class="icon-tech-selector"
              src="/assets/pictures/technology_byzantines/silk-road-mercenary-contract-1.png"
            ></v-img
          ></v-col>
          <v-col align="center" justify="center"
            ><v-img
            class="icon-tech-selector"
              src="/assets/pictures/technology_byzantines/western-mercenary-contract-1.png"
            ></v-img
          ></v-col>
          <v-col align="center" justify="center"
            ><v-img
            class="icon-tech-selector"
              src="/assets/pictures/technology_byzantines/veteran-mercenaries-3.png"
            ></v-img
          ></v-col>
          <v-col align="center" justify="center"
            ><v-img
            class="icon-tech-selector"
              src="/assets/pictures/technology_byzantines/elite-mercenaries-4.png"
            ></v-img
          ></v-col>
        </v-row><br /><br />
        Please consider supporting the projec to cover the
        operational costs! <br /><br />
        The funding goal for 2024 is live for olive oil and coffee! Happy
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
