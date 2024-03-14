<template>
  <v-alert rounded="lg" outlined color="accent" class="pa-1">
    <v-card flat rounded="lg">
      <v-card-title>Season 7 has arrived</v-card-title>
      <v-card-text
        >The hoster has been changed in order to cut the operational costs. The funding goal has been updated accordingly.<br /><br />
        
        Let the games begin and figure out the next OP build order. May the extra sheep be with you!<br /><br />
        Thank you and happy scouting!
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
