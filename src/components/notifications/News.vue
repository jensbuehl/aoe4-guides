<template>
  <v-alert rounded="lg" outlined color="accent" class="pa-1 mt-6 mb-2">
    <v-card flat rounded="lg">
      <v-card-title>Top Contributors!</v-card-title>
      <v-card-text>
        <p class="mb-4">
          I've got some cool updates for <strong>aoe4guides.com</strong> that you’ll love! 🎉
        </p>

        <p class="mb-2">
          <strong>Top Contributors:</strong> We’re now giving props to the awesome authors creating
          top-notch content on our site instead of just pointing to YouTube creators.
        </p>

        <p class="mb-4">
          <strong>YouTube Guides:</strong> Speaking of YouTube, I’ve made it easier to find the
          latest and greatest video guides, so you don’t miss a
          thing.
        </p>

        <p class="mb-4">Cheers,<br />exe</p>

        <p class="mb-2">
          P.S. Keep in mind that '<strong>::</strong>' is the shortcut to get your builds done
          quicker!
        </p>
        <v-img src="/autocomplete.gif"></v-img>
      </v-card-text>

      <v-row class="ma-2" no-gutters>
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
