<template>
  <v-card>
    <v-row>
      <v-col cols="12">
        <v-text-field
          v-model="searchText"
          label="Search icon..."
        ></v-text-field>
      </v-col>
    </v-row>
    <v-card fluid class="overflow-y-auto" max-height="480">
      <v-row no-gutters align="center">
        <v-col cols="12">
          <v-card flat subtitle="Economic Buildings"></v-card>
        </v-col>
        <v-col cols="3" v-for="icon in filteredIcons" :key="icon.imgSrc">
          <v-hover>
            <template v-slot:default="{ isHovering, props }">
              <v-card
                flat
                class="mx-4"
                align="center"
                v-bind="props"
                :color="isHovering ? 'primary' : undefined"
              >
                <v-img
                  @click="imageSelected"
                  class="ma-1"
                  width="42px"
                  :src="icon.imgSrc"
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
        <v-col cols="3" v-for="icon in filteredIcons" :key="icon.imgSrc">
          <v-hover>
            <template v-slot:default="{ isHovering, props }">
              <v-card
                flat
                class="mx-4"
                align="center"
                v-bind="props"
                :color="isHovering ? 'primary' : undefined"
              >
                <v-img
                  @click="imageSelected"
                  class="ma-1"
                  width="42px"
                  :src="icon.imgSrc"
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
        <v-col cols="3" v-for="icon in filteredIcons" :key="icon.imgSrc">
          <v-hover>
            <template v-slot:default="{ isHovering, props }">
              <v-card
                flat
                class="mx-4"
                align="center"
                v-bind="props"
                :color="isHovering ? 'primary' : undefined"
              >
                <v-img
                  @click="imageSelected"
                  class="ma-1"
                  width="42px"
                  :src="icon.imgSrc"
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
        <v-col cols="3" v-for="icon in filteredIcons" :key="icon.imgSrc">
          <v-hover>
            <template v-slot:default="{ isHovering, props }">
              <v-card
                flat
                class="mx-4"
                align="center"
                v-bind="props"
                :color="isHovering ? 'primary' : undefined"
              >
                <v-img
                  @click="imageSelected"
                  class="ma-1"
                  width="42px"
                  :src="icon.imgSrc"
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
        <v-col cols="3" v-for="icon in filteredIcons" :key="icon.imgSrc">
          <v-hover>
            <template v-slot:default="{ isHovering, props }">
              <v-card
                flat
                class="mx-4"
                align="center"
                v-bind="props"
                :color="isHovering ? 'primary' : undefined"
              >
                <v-img
                  @click="imageSelected"
                  class="ma-1"
                  width="42px"
                  :src="icon.imgSrc"
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
import { ref, computed } from "vue";
import useIconService from "../composables/useIconService.js";

export default {
  name: "StepsEditor",
  props: ["civ"],
  emits: ["iconSelected"],
  setup(props, context) {
    const { getIcons } = useIconService();
    const allIcons = getIcons(props.civ);
    const searchText = ref("");

    console.log(allIcons.filter(item => item.title.includes("Age")))
    const filteredIcons = computed(() => allIcons.filter(item => item.title.includes(searchText.value)));



    const imageSelected = (e) => {
      context.emit("iconSelected", e.target.src);
    };

    return {
      filteredIcons,
      searchText,
      imageSelected,
    };
  },
};
</script>
