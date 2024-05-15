<template>
  <v-alert rounded="lg" outlined color="accent" class="pa-1">
    <v-card flat rounded="lg">
      <v-card-title>1000 Build Orders Strong!!</v-card-title>
      <v-card-text>
        We've just hit a major milestone at aoe4guides.com: Over 1000 community-crafted build orders! It's been quite the year, with our fair share of traffic spikes and loads of new features rolling out thanks to your feedback and contributions.<br /><br />
        
        A huge thank you to all of you for making this site a treasure trove of strategies for fellow fans of Age of Empires IV like myself. Your insights and dedication have shaped aoe4guides.com into a fantastic resource that keeps getting better.<br /><br />

        Thanks for your support and happy scouting!<br>

        -exe
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
  </v-alert>
</template>

<script>
export default {
  name: "News",
  setup() {},
};
</script>
