<template>
  <span
    :style="{
      color: $vuetify.theme.current.colors.primary,
    }"
    ><span v-if="!icon.description"
      >{{ icon.title }}{{ getFormattedShorthand(icon.shorthand) }}</span
    ><v-card-title v-if="icon.description" class="ma-0 pa-0"
      >{{ icon.title }}{{ getFormattedShorthand(icon.shorthand) }}</v-card-title
    >
    <v-card-text
      class="ma-0 pa-0"
      v-if="icon.description"
      style="white-space: pre-wrap; max-width: 350px; min-width: 350px"
    >
      {{ icon.description }}
      <v-row no-gutters class="mt-4" v-if="icon.costs">
        <v-col cols="3" v-if="icon.costs.food">
          <v-row no-gutters class="mr-4" align="center" justify="start">
            {{ icon.costs.food }}
            <v-img class="titleIconXs" src="/assets/resources/food.webp"></v-img>
          </v-row>
        </v-col>
        <v-col cols="3" v-if="icon.costs.wood">
          <v-row no-gutters class="mr-4" align="center" justify="start">
            {{ icon.costs.wood }}
            <v-img class="titleIconXs" src="/assets/resources/wood.webp"></v-img>
          </v-row>
        </v-col>
        <v-col cols="3" v-if="icon.costs.stone">
          <v-row no-gutters class="mr-4" align="center" justify="start">
            {{ icon.costs.stone }}
            <v-img class="titleIconXs" src="/assets/resources/stone.webp"></v-img>
          </v-row>
        </v-col>
        <v-col cols="3" v-if="icon.costs.gold">
          <v-row no-gutters class="mr-4" align="center" justify="start">
            {{ icon.costs.gold }}
            <v-img class="titleIconXs" src="/assets/resources/gold.webp"></v-img>
          </v-row>
        </v-col>
        <v-col cols="3" v-if="icon.costs.oliveoil">
          <v-row no-gutters class="mr-4" align="center" justify="start">
            {{ icon.costs.oliveoil }}
            <v-img class="titleIconXs" src="/assets/resources/oliveoil.webp"></v-img>
          </v-row>
        </v-col>
        <v-col cols="3" v-if="icon.costs.time">
          <v-row no-gutters class="mr-4" align="center" justify="start">
            {{ icon.costs.time }}s
            <v-img class="titleIconXs" src="/assets/resources/time.webp"></v-img>
          </v-row>
        </v-col>
      </v-row>
    </v-card-text>
  </span>
</template>

<script>
//External

//Component

//Composables

export default {
  name: "IconToolTip",
  props: ["icon"],
  setup(props, context) {
    function getFormattedShorthand(shorthand) {
      if (!shorthand) return "";
      
      if (Array.isArray(shorthand)) {
        const withColon = shorthand.map((x) => "::" + x);
        const joined = withColon.join(", ");
        return " [" + joined+"]";
      } else {
        return " [::" + shorthand+"]";
      }
    }
    return {
      getFormattedShorthand,
    };
  },
};
</script>
<style>
:deep(.titleIconXs) {
  vertical-align: middle;
  width: auto;
  height: 30px;
}
</style>
