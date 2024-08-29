<template>
  <v-alert rounded="lg" outlined color="accent" class="pa-1 mt-6 mb-2">
    <v-card flat rounded="lg">
      <v-card-title>Happy Birthday, Schnitz!</v-card-title>
      <v-card-text>
        <p class="mt-2 mb-4">August 30, 2024</p>
        <p class="mb-4">
          Today would have been the birthday of my best friend, Schnitz. Most of you might not have
          known him, but he was a huge part of my life and was the trigger for me to start this
          project. He passed away two years ago.
        </p>

        <p class="mb-4">
          Schnitz and I shared a deep passion for gaming, especially Age of Empires. Common
          memories, and the shared enthusiasm for for those games, inspired me to start AoE4 Guides,
          both as a tribute to him and as a way to keep myself occupied after his loss.
        </p>

        <p class="mb-4">
          In honor of his memory, I've written down a few words that capture some of the moments we
          shared. If you’d like to see what he meant to me, you can listen to it here (unfortunately, it's only available in German):<br>
          <a
            :style="{
              color: $vuetify.theme.current.colors.primary,
            }"
            href="https://www.youtube.com/watch?v=yVKWWyy7a-8"
            target="_blank"
            >Du Warst Da</a
          >
        </p>

        <p class="mb-4">
          Also, I want to thank all of you for helping shape AoE4 Guides and the AoE4 community into
          what it is today. Your support helped me a lot, and I know he would have been proud of
          what we’ve built together.
        </p>

        <p class="mb-4">Thank you for letting me share this with you.</p>

        <p>Sincerely,<br />exe</p>
      </v-card-text>

      <v-row class="mx-2 mb-2" no-gutters>
        <v-col align="center" justify="center"
          ><a href="https://ko-fi.com/jensbuehl"
            ><v-btn
              class="ma-2"
              size="small"
              variant="text"
              color="primary"
              style="background-color: transparent"
            >
              <template v-slot:prepend>
                <v-icon color="red">mdi-heart</v-icon>
              </template>
              Donate
            </v-btn></a
          ><a href="https://discord.gg/Nau9BN5E7J"
            ><v-btn
              class="ma-2"
              size="small"
              variant="text"
              color="primary"
              style="background-color: transparent"
            >
              <template v-slot:prepend>
                <v-icon color="primary">mdi-chat</v-icon>
              </template>
              Discord
            </v-btn></a
          ><v-btn
            size="small"
            class="ma-2"
            prepend-icon="mdi-github"
            variant="text"
            color="primary"
            to="/github"
            >Contribute
          </v-btn></v-col
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
