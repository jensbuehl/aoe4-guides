<template>
  <v-alert
    rounded="lg"
    outlined
    color="accent"
    class="mt-4 pa-1"
  >
    <v-card flat rounded="lg">
      <v-card-title>Create</v-card-title>
      <v-card-text
        >Create new Age of Empires 4 build orders and share them with your
        friends.</v-card-text
      >

      <v-card-title>Like</v-card-title>
      <v-card-text
        >Manage your own favorite AoE 4 build orders and find the good ones with
        ease.</v-card-text
      >

      <v-card-title>Comment</v-card-title>
      <v-card-text
        >Write build order comments and get in touch with the author and the
        community.</v-card-text
      >

      <v-card-title>Sign up</v-card-title>
      <v-card-text
        >Registered villagers gather and manage build orders up to 20% faster.
        ;)</v-card-text
      >
      <v-list-item>
        <span>New Villager?</span>
        <v-btn
          size="small"
          color="primary"
          style="background-color: transparent"
          variant="plain"
          to="/register"
        >
          Register now!
        </v-btn>
      </v-list-item>
    </v-card></v-alert
  >
</template>

<script>
export default {
  name: "RegisterAd",
  setup() {
  },
};
</script>
