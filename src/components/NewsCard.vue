<template>
  <v-alert rounded="lg" outlined color="accent" class="pa-1">
    <v-card flat rounded="lg">
      <v-card-title>The Sultans Ascend</v-card-title>
      <v-card-text
        >Be prepared for the Sultans Ascend Expansion. <br />
        All new civilizations are now supported, including:</v-card-text>

      <v-row class="ma-2" no-gutters>
        <v-col align="start" justify="start"
          ><v-btn
            size="small"
            color="primary"
            style="background-color: transparent"
            variant="plain"
            :to="{
              name: 'Builds',
              query: { civ: 'AYY' },
            }"
          >
            Ayyubids </v-btn
          ><br />
          <v-btn
            size="small"
            color="primary"
            style="background-color: transparent"
            variant="plain"
            :to="{
              name: 'Builds',
              query: { civ: 'BYZ' },
            }"
          >
            Byzantines </v-btn
          ><br />
          <v-btn
            size="small"
            color="primary"
            style="background-color: transparent"
            variant="plain"
            :to="{
              name: 'Builds',
              query: { civ: 'JAP' },
            }"
          >
            Japanese
          </v-btn></v-col
        >
        <v-col
          ><v-btn
            size="small"
            color="primary"
            style="background-color: transparent"
            variant="plain"
            :to="{
              name: 'Builds',
              query: { civ: 'JDA' },
            }"
          >
            Jeanne d'Arc </v-btn
          ><br />
          <v-btn
            size="small"
            color="primary"
            style="background-color: transparent"
            variant="plain"
            :to="{
              name: 'Builds',
              query: { civ: 'DRA' },
            }"
          >
            Order of the Dragon </v-btn
          ><br />
          <v-btn
            size="small"
            color="primary"
            style="background-color: transparent"
            variant="plain"
            :to="{
              name: 'Builds',
              query: { civ: 'ZXL' },
            }"
          >
            Zhu Xi's Legacy
          </v-btn></v-col
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
