<template>
  <v-alert rounded="lg" outlined color="accent" class="pa-1">
    <v-card flat rounded="lg">
      <v-card-title>Season 7 has arrived</v-card-title>
      <v-card-text
        >We've switched up our hosting service to keep our operating costs down, and we've adjusted our funding targets to reflect this change.<br /><br />
        
        Good news for your guides: you can now label your builds with “Season 7” for easy identification. Plus, locating your drafts on the “My Builds” page is now smoother than ever.<br /><br />
        
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
