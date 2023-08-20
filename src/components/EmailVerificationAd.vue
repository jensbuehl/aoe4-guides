<template>
  <v-alert
    rounded="lg"
    outlined
    color="accent"
    class="pa-1"
  >
    <v-card flat rounded="lg">
      <v-card-text
        >For future town center extensions it is required to verify the villagers's email addresses. </v-card-text
      >
      <v-card-text>
        Only with a verified email address you are prepared for upcoming features, e.g. build order notificiations.</v-card-text
      >

      <v-list-item>
        <span>Missing Notifications?</span>
        <v-btn
          size="small"
          color="primary"
          style="background-color: transparent"
          variant="plain"
          class="mb-1"
          to="/account"
        >
          Verify Email
        </v-btn>
      </v-list-item>
    </v-card></v-alert
  >
</template>

<script>
export default {
  name: "EmailVerificationAd",
  setup() {
  },
};
</script>
