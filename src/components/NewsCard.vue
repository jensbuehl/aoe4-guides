<template>
  <v-alert rounded="lg" outlined color="accent" class="pa-1">
    <v-card flat rounded="lg">
      <v-card-title>Housed!</v-card-title>
      <v-card-text
        >With the recent big expansion the web site traffic has exploded like an
        Ozutsu.<br /><br />
        If you are a happy villager, please consider donating some olive oil or
        coffee. Thank you! - exe</v-card-text
      >

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
