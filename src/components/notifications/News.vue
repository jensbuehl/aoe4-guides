<template>
  <v-alert rounded="lg" outlined color="accent" class="pa-1 mt-6 mb-2">
    <v-card flat rounded="lg">
      <v-card-title>Top Contributors!</v-card-title>
      <v-card-text>
        <p class="mb-2">
          We’re now giving props to the awesome <strong>authors</strong> creating
          top-notch content on our site instead of just pointing to YouTube creators.
        </p>

        <p class="mb-2">
          <strong>Comments</strong> are back and visibile in the build orders again.
        </p>

        <p class="mb-4">Cheers,<br />exe</p>

        <p class="mb-2">
          P.S. Keep in mind that '<strong>::</strong>' is the <strong>shortcut</strong> to get your builds done
          quicker!
        </p>
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
