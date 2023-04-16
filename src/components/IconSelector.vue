<template>
  <v-card>
    <v-row>
      <v-col cols="12">
        <v-text-field
          v-model="searchText"
          label="Search..."
          clearable
        ></v-text-field>
      </v-col>
    </v-row>
    <v-card fluid class="overflow-y-auto pb-2" max-height="600">
      <v-row v-show="filteredEcoBuildings.length" no-gutters align="center">
        <v-col cols="12">
          <v-card flat subtitle="Economic & Religious Buildings"></v-card>
        </v-col>
        <v-col
          class="mt-n2 mb-2"
          cols="3"
          v-for="icon in filteredEcoBuildings"
          :key="icon.imgSrc"
        >
          <v-hover>
            <template v-slot:default="{ isHovering, props }">
              <v-card
                flat
                width="50"
                height="50"
                class="mx-4 my-1"
                v-bind="props"
                :color="isHovering ? 'primary' : undefined"
              >
                <v-container>
                  <v-row align="center" justify="center">
                    <v-img
                      @click="imageSelected"
                      style="height: auto; width: 42px"
                      :src="icon.imgSrc"
                    ></v-img>
                  </v-row>
                </v-container>
              </v-card>
            </template>
          </v-hover>
        </v-col>
      </v-row>
      <v-row
        v-show="filteredMilitaryBuildings.length"
        no-gutters
        align="center"
      >
        <v-col cols="12">
          <v-card flat subtitle="Military Buildings"></v-card>
        </v-col>
        <v-col
          class="mt-n2 mb-2"
          cols="3"
          v-for="icon in filteredMilitaryBuildings"
          :key="icon.imgSrc"
        >
          <v-hover>
            <template v-slot:default="{ isHovering, props }">
              <v-card
                flat
                width="50"
                height="50"
                class="mx-4 my-1"
                v-bind="props"
                :color="isHovering ? 'primary' : undefined"
              >
                <v-container>
                  <v-row align="center" justify="center">
                    <v-img
                      @click="imageSelected"
                      style="height: auto; width: 42px"
                      :src="icon.imgSrc"
                    ></v-img>
                  </v-row>
                </v-container>
              </v-card>
            </template>
          </v-hover>
        </v-col>
      </v-row>
      <v-row v-show="filteredEcoUnits.length" no-gutters align="center">
        <v-col cols="12">
          <v-card flat subtitle="Economic & Religious Units"></v-card>
        </v-col>
        <v-col
          class="mt-n2 mb-2"
          cols="3"
          v-for="icon in filteredEcoUnits"
          :key="icon.imgSrc"
        >
          <v-hover>
            <template v-slot:default="{ isHovering, props }">
              <v-card
                flat
                width="50"
                height="50"
                class="mx-4 my-1"
                v-bind="props"
                :color="isHovering ? 'primary' : undefined"
              >
                <v-container>
                  <v-row align="center" justify="center">
                    <v-img
                      @click="imageSelected"
                      style="height: auto; width: 42px"
                      :src="icon.imgSrc"
                    ></v-img>
                  </v-row>
                </v-container>
              </v-card>
            </template>
          </v-hover>
        </v-col>
      </v-row>
      <v-row v-show="filteredMilitaryUnits.length" no-gutters align="center">
        <v-col cols="12">
          <v-card flat subtitle="Military Units"></v-card>
        </v-col>
        <v-col
          class="mt-n2 mb-2"
          cols="3"
          v-for="icon in filteredMilitaryUnits"
          :key="icon.imgSrc"
        >
          <v-hover>
            <template v-slot:default="{ isHovering, props }">
              <v-card
                flat
                width="50"
                height="50"
                class="mx-4 my-1"
                v-bind="props"
                :color="isHovering ? 'primary' : undefined"
              >
                <v-container>
                  <v-row align="center" justify="center">
                    <v-img
                      @click="imageSelected"
                      style="height: auto; width: 42px"
                      :src="icon.imgSrc"
                    ></v-img>
                  </v-row>
                </v-container>
              </v-card>
            </template>
          </v-hover>
        </v-col>
      </v-row>
      <v-row v-show="filteredEcoTechnologies.length" no-gutters align="center">
        <v-col cols="12">
          <v-card flat subtitle="Economic Technologies"></v-card>
        </v-col>
        <v-col
          class="mt-n2 mb-2"
          cols="3"
          v-for="icon in filteredEcoTechnologies"
          :key="icon.imgSrc"
        >
          <v-hover>
            <template v-slot:default="{ isHovering, props }">
              <v-card
                flat
                width="50"
                height="50"
                class="mx-4 my-1"
                v-bind="props"
                :color="isHovering ? 'primary' : undefined"
              >
                <v-container>
                  <v-row align="center" justify="center">
                    <v-img
                      @click="imageSelected"
                      style="height: auto; width: 42px"
                      :src="icon.imgSrc"
                    ></v-img>
                  </v-row>
                </v-container>
              </v-card>
            </template>
          </v-hover>
        </v-col>
      </v-row>
      <v-row
        v-show="filteredMilitaryTechnologies.length"
        no-gutters
        align="center"
      >
        <v-col cols="12">
          <v-card flat subtitle="Military Technologies"></v-card>
        </v-col>
        <v-col
          class="mt-n2 mb-2"
          cols="3"
          v-for="icon in filteredMilitaryTechnologies"
          :key="icon.imgSrc"
        >
          <v-hover>
            <template v-slot:default="{ isHovering, props }">
              <v-card
                flat
                width="50"
                height="50"
                class="mx-4 my-1"
                v-bind="props"
                :color="isHovering ? 'primary' : undefined"
              >
                <v-container>
                  <v-row align="center" justify="center">
                    <v-img
                      @click="imageSelected"
                      style="height: auto; width: 42px"
                      :src="icon.imgSrc"
                    ></v-img>
                  </v-row>
                </v-container>
              </v-card>
            </template>
          </v-hover>
        </v-col>
      </v-row>
      <v-row v-show="filteredGeneral.length" no-gutters align="center">
        <v-col cols="12">
          <v-card flat subtitle="Landmarks & General"></v-card>
        </v-col>
        <v-col
          class="mt-n2 mb-2"
          cols="3"
          v-for="icon in filteredGeneral"
          :key="icon.imgSrc"
        >
          <v-hover>
            <template v-slot:default="{ isHovering, props }">
              <v-card
                flat
                width="50"
                height="50"
                class="mx-4 my-1"
                v-bind="props"
                :color="isHovering ? 'primary' : undefined"
              >
                <v-container>
                  <v-row align="center" justify="center">
                    <v-img
                      @click="imageSelected"
                      style="height: auto; width: 42px"
                      :src="icon.imgSrc"
                    ></v-img>
                  </v-row>
                </v-container>
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
    const { getIcons } = useIconService(props.civ);
    const searchText = ref("");
    const ecoBuildings = getIcons("building_eco").concat(
      getIcons("building_religious")
    );
    const militaryBuildings = getIcons("building_military").concat(
      getIcons("building_tech")
    );
    const ecoUnits = getIcons("unit_eco").concat(getIcons("unit_religious"));
    const militaryUnits = getIcons("unit_military");
    const ecoTechnologies = getIcons("tech_eco");
    const militaryTechnologies = getIcons("tech_military");
    const general = getIcons("landmark").concat(getIcons("general"));

    const filteredEcoBuildings = computed(() =>
      ecoBuildings.filter((item) =>
        item.title.toLowerCase().includes(searchText.value?.toLowerCase())
      )
    );
    const filteredMilitaryBuildings = computed(() =>
      militaryBuildings.filter((item) =>
        item.title.toLowerCase().includes(searchText.value?.toLowerCase())
      )
    );
    const filteredEcoUnits = computed(() =>
      ecoUnits.filter((item) =>
        item.title.toLowerCase().includes(searchText.value?.toLowerCase())
      )
    );
    const filteredMilitaryUnits = computed(() =>
      militaryUnits.filter((item) =>
        item.title.toLowerCase().includes(searchText.value?.toLowerCase())
      )
    );
    const filteredEcoTechnologies = computed(() =>
      ecoTechnologies.filter((item) =>
        item.title.toLowerCase().includes(searchText.value?.toLowerCase())
      )
    );
    const filteredMilitaryTechnologies = computed(() =>
      militaryTechnologies.filter((item) =>
        item.title.toLowerCase().includes(searchText.value?.toLowerCase())
      )
    );
    const filteredGeneral = computed(() =>
      general.filter((item) =>
        item.title.toLowerCase().includes(searchText.value?.toLowerCase())
      )
    );

    const imageSelected = (e) => {
      context.emit("iconSelected", e.target.src);
    };

    return {
      filteredEcoBuildings,
      filteredMilitaryBuildings,
      filteredEcoUnits,
      filteredMilitaryUnits,
      filteredEcoTechnologies,
      filteredMilitaryTechnologies,
      filteredGeneral,
      searchText,
      imageSelected,
    };
  },
};
</script>
