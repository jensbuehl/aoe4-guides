<template>
  <v-alert rounded="lg" outlined color="accent" class="pa-1">
    <v-card flat rounded="lg">
      <v-card-title>Sounds of Victory</v-card-title>
      <v-card-text>
        There's a new YouTube channel showcasing community-created songs inspired by Age of
        Empires IV. <br /><br />

        If you're interested in hearing unique takes on the game's themes, check it out.
        <br /><br />

        More content may come in the future, so stay tuned. Good luck, have fun!<br /><br />

        -exe

        <div align="center">
          <iframe
            width="100%"
            height="200px"
            src="https://www.youtube.com/embed/9u3eYzxSyE0"
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
