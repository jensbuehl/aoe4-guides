<template>
  <v-alert rounded="lg" outlined color="accent" class="pa-1 mt-6 mb-2">
    <v-card flat rounded="lg">
      <v-card-title>Season 8 Update!</v-card-title>
      <v-card-text>
        <p class="mb-4">
          The new <strong>season 8</strong> technologies and units are now available:
          <br /><br />
          <v-row no-gutters>
            <v-col align="center" justify="center"
              ><v-img
                class="icon-military-selector"
                src="/assets/pictures/unit_mongols/khans-hunter.png"
              ></v-img
            ></v-col>
            <v-col align="center" justify="center"
              ><v-img
                class="icon-tech-selector"
                src="/assets/pictures/technology_abbasid/public-library.png"
              ></v-img
            ></v-col>
            <v-col align="center" justify="center"
              ><v-img
                class="icon-tech-selector"
                src="/assets/pictures/technology_delhi/mahouts.png"
              ></v-img
            ></v-col>
            <v-col align="center" justify="center"
              ><v-img
                class="icon-tech-selector"
                src="/assets/pictures/technology_delhi/paiks.png"
              ></v-img
            ></v-col> </v-row
          >
        </p>
        <p class="mb-4">
          Plus, we’re now giving props to the awesome <strong>authors and contributors</strong> creating top-notch content
          on our site instead of just pointing to YouTube creators.
        </p>

        <p class="mb-4">Cheers,<br />exe</p>

        <p class="mb-2">
          P.S. Keep in mind that '<strong>::</strong>' is the <strong>shortcut</strong> to get your
          builds done quicker!
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
