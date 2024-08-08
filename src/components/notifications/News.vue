<template>
  <v-alert rounded="lg" outlined color="accent" class="pa-1">
    <v-card flat rounded="lg">
      <v-card-title>Sounds of Victory</v-card-title>
      <v-card-text>
        Featured Age of Empires IV Song: <br /><br />
        "Mein Scout Hat Fernweh" (My scout has wanderlust)
        <br /><br />

        More to come in the future. Good luck, have fun!<br /><br />

        -exe aka Gold3Dad

        <div align="center">
          <iframe
            width="100%"
            height="200px"
            src="https://www.youtube.com/embed/p7Z9e64gXCU"
            frameborder="0"
            class="my-5"
            allowfullscreen
          ></iframe>
        </div>
      </v-card-text>

      <v-row class="ma-2" no-gutters>
        <v-col align="center" justify="center"
          ><a href="https://www.youtube.com/channel/UC5hqMmEWvSyFgsvQb29clMw/videos"
            ><v-btn class="ma-2"
              size="small"
              variant="plain"
              color="primary"
              style="background-color: transparent">
              <template v-slot:prepend>
                <v-icon color="red">mdi-youtube</v-icon>
              </template>
              Check it out
            </v-btn></a
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
