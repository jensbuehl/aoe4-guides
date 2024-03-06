<template>
  <v-alert rounded="lg" outlined color="accent" class="pa-1">
    <v-card flat rounded="lg">
      <v-card-title>Villager Registration Required</v-card-title>
      <v-card-text
        >Would you like to craft your own build orders?<br />
      </v-card-text>

      <v-row class="ma-2" no-gutters justify="center">
        <v-btn
              color="primary"
              style="background-color: transparent"
              variant="text"
              to="/register"
            >
              Register now!
            </v-btn>
      </v-row>
    </v-card></v-alert
  >
</template>

<script>
export default {
  name: "RegisterAdShort",
  setup() {},
};
</script>
