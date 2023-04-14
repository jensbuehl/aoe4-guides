<template>
  <v-card>
    <v-row>
      <v-col cols="12">
        <v-text-field label="Search icon..."></v-text-field>
      </v-col>
    </v-row>
    <v-card fluid class="overflow-y-auto" max-height="480">
      <v-row no-gutters align="center">
        <v-col cols="12">
          <v-card flat subtitle="Economic Buildings"></v-card>
        </v-col>
        <v-col cols="3" v-for="icon in icons" :key="icon.imageSrc">
          <v-hover>
            <template v-slot:default="{ isHovering, props }">
              <v-card
                class="mx-4"
                align="center"
                v-bind="props"
                :color="isHovering ? 'primary' : undefined"
              >
                <v-img
                  @click="imageSelected"
                  class="ma-1"
                  width="42px"
                  :src="icon.imageSrc"
                ></v-img>
              </v-card>
            </template>
          </v-hover>
        </v-col>
      </v-row>
      <v-row no-gutters align="center">
        <v-col cols="12">
          <v-card flat subtitle="Military Buildings"></v-card>
        </v-col>
        <v-col cols="3" v-for="icon in icons" :key="icon.imageSrc">
          <v-hover>
            <template v-slot:default="{ isHovering, props }">
              <v-card
                class="mx-4"
                align="center"
                v-bind="props"
                :color="isHovering ? 'primary' : undefined"
              >
                <v-img
                  @click="imageSelected"
                  class="ma-1"
                  width="42px"
                  :src="icon.imageSrc"
                ></v-img>
              </v-card>
            </template>
          </v-hover>
        </v-col>
      </v-row>
      <v-row no-gutters align="center">
        <v-col cols="12">
          <v-card flat subtitle="Economic & Religious Units"></v-card>
        </v-col>
        <v-col cols="3" v-for="icon in icons" :key="icon.imageSrc">
          <v-hover>
            <template v-slot:default="{ isHovering, props }">
              <v-card
                class="mx-4"
                align="center"
                v-bind="props"
                :color="isHovering ? 'primary' : undefined"
              >
                <v-img
                  @click="imageSelected"
                  class="ma-1"
                  width="42px"
                  :src="icon.imageSrc"
                ></v-img>
              </v-card>
            </template>
          </v-hover>
        </v-col>
      </v-row>
      <v-row no-gutters align="center">
        <v-col cols="12">
          <v-card flat subtitle="Military Units"></v-card>
        </v-col>
        <v-col cols="3" v-for="icon in icons" :key="icon.imageSrc">
          <v-hover>
            <template v-slot:default="{ isHovering, props }">
              <v-card
                class="mx-4"
                align="center"
                v-bind="props"
                :color="isHovering ? 'primary' : undefined"
              >
                <v-img
                  @click="imageSelected"
                  class="ma-1"
                  width="42px"
                  :src="icon.imageSrc"
                ></v-img>
              </v-card>
            </template>
          </v-hover>
        </v-col>
      </v-row>
      <v-row no-gutters align="center">
        <v-col cols="12">
          <v-card flat subtitle="Technologies & General"></v-card>
        </v-col>
        <v-col cols="3" v-for="icon in icons" :key="icon.imageSrc">
          <v-hover>
            <template v-slot:default="{ isHovering, props }">
              <v-card
                class="mx-4"
                align="center"
                v-bind="props"
                :color="isHovering ? 'primary' : undefined"
              >
                <v-img
                  @click="imageSelected"
                  class="ma-1"
                  width="42px"
                  :src="icon.imageSrc"
                ></v-img>
              </v-card>
            </template>
          </v-hover>
        </v-col>
      </v-row>
    </v-card>
  </v-card>
</template>

<script>
import { ref } from "vue";

export default {
  name: "StepsEditor",
  props: ["civ"],
  emits: ["iconSelected"],
  setup(props, context) {
    //TODO: Get icon set for civ
    const icons = ref([
      {
        imageSrc: "/assets/resources/time.png",
        text: "Villager",
      },
      {
        imageSrc: "/assets/resources/time.png",
        text: "Knight",
      },
      {
        imageSrc: "/assets/resources/time.png",
        text: "Horseman",
      },
      {
        imageSrc: "/assets/resources/time.png",
        text: "House",
      },
      {
        imageSrc: "/assets/resources/time.png",
        text: "Council Hall",
      },
      {
        imageSrc: "/assets/resources/time.png",
        text: "Council Hall",
      },
      {
        imageSrc: "/assets/resources/time.png",
        text: "Council Hall",
      },
    ]);

    const imageSelected = (e) => {
      context.emit("iconSelected", e.target.src);
    };

    return {
      icons,
      imageSelected,
    };
  },
};
</script>
