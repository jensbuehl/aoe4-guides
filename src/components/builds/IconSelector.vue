<template>
  <v-card flat>
    <v-row>
      <v-col cols="12">
        <v-text-field
          autofocus
          v-model="searchText"
          label="Search..."
          clearable
        ></v-text-field>
      </v-col>
    </v-row>
    <v-card fluid class="overflow-y-auto pb-2" max-height="400" flat>
      <v-row v-show="filteredGeneral.length" no-gutters align="center">
        <v-col cols="12">
          <v-card flat subtitle="Workers & Resources"></v-card>
        </v-col>
        <v-col
          class="mt-n2 mb-2"
          cols="3"
          v-for="icon in filteredGeneral"
          :key="icon.imgSrc"
        >
          <v-container>
            <v-row align="center" justify="center">
              <v-tooltip location="top">
                <span
                  :style="{
                    color: $vuetify.theme.current.colors.primary,
                  }"
                  >{{ icon.title }}</span
                >
                <template v-slot:activator="{ props }">
                  <v-btn
                    color="primary"
                    v-bind="props"
                    variant="text"
                    @click="imageSelected(icon.imgSrc, icon.title, icon.class)"
                    height="60"
                    width="60"
                  >
                    <v-img
                      v-bind:class="{
                        'icon-landmark-selector': icon.class == 'landmark',
                        'icon-tech-selector': icon.class == 'tech',
                        'icon-military-selector': icon.class == 'military',
                        'icon-default-selector': icon.class == 'default',
                        'icon-none-selector': icon.class == 'none',
                        'icon-selector': !icon.class,
                      }"
                      style="height: 42px; width: 42px"
                      :src="icon.imgSrc"
                    ></v-img>
                  </v-btn>
                </template>
              </v-tooltip>
            </v-row>
          </v-container>
        </v-col>
      </v-row>
      <v-row v-show="filteredLandmarks.length" no-gutters align="center">
        <v-col cols="12">
          <v-card flat subtitle="Landmarks, Actions, and Flags"></v-card>
        </v-col>
        <v-col
          class="mt-n2 mb-2"
          cols="3"
          v-for="icon in filteredLandmarks"
          :key="icon.imgSrc"
        >
          <v-container>
            <v-row align="center" justify="center">
              <v-tooltip location="top">
                <span
                  :style="{
                    color: $vuetify.theme.current.colors.primary,
                  }"
                  >{{ icon.title }}</span
                >
                <template v-slot:activator="{ props }">
                  <v-btn
                    color="primary"
                    v-bind="props"
                    variant="text"
                    @click="imageSelected(icon.imgSrc, icon.title, icon.class)"
                    height="60"
                    width="60"
                  >
                  <v-img
                      v-bind:class="{
                        'icon-landmark-selector': icon.class == 'landmark',
                        'icon-tech-selector': icon.class == 'tech',
                        'icon-military-selector': icon.class == 'military',
                        'icon-default-selector': icon.class == 'default',
                        'icon-none-selector': icon.class == 'none',
                        'icon-selector': !icon.class,
                      }"
                      style="height: 42px; width: 42px"
                      :src="icon.imgSrc"
                    ></v-img>
                  </v-btn>
                </template>
              </v-tooltip>
            </v-row>
          </v-container>
        </v-col>
      </v-row>
      <v-row v-show="filteredEcoBuildings.length" no-gutters align="center">
        <v-col cols="12">
          <v-card flat subtitle="Civil Buildings"></v-card>
        </v-col>
        <v-col
          class="mt-n2 mb-2"
          cols="3"
          v-for="icon in filteredEcoBuildings"
          :key="icon.imgSrc"
        >
          <v-container>
            <v-row align="center" justify="center">
              <v-tooltip location="top">
                <span
                  :style="{
                    color: $vuetify.theme.current.colors.primary,
                  }"
                  >{{ icon.title }}</span
                >
                <template v-slot:activator="{ props }">
                  <v-btn
                    color="primary"
                    v-bind="props"
                    variant="text"
                    @click="imageSelected(icon.imgSrc, icon.title, icon.class)"
                    height="60"
                    width="60"
                  >
                  <v-img
                      v-bind:class="{
                        'icon-landmark-selector': icon.class == 'landmark',
                        'icon-tech-selector': icon.class == 'tech',
                        'icon-military-selector': icon.class == 'military',
                        'icon-default-selector': icon.class == 'default',
                        'icon-none-selector': icon.class == 'none',
                        'icon-selector': !icon.class,
                      }"
                      style="height: 42px; width: 42px"
                      :src="icon.imgSrc"
                    ></v-img>
                  </v-btn>
                </template>
              </v-tooltip>
            </v-row>
          </v-container>
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
          <v-container>
            <v-row align="center" justify="center">
              <v-tooltip location="top">
                <span
                  :style="{
                    color: $vuetify.theme.current.colors.primary,
                  }"
                  >{{ icon.title }}</span
                >
                <template v-slot:activator="{ props }">
                  <v-btn
                    color="primary"
                    v-bind="props"
                    variant="text"
                    @click="imageSelected(icon.imgSrc, icon.title, icon.class)"
                    height="60"
                    width="60"
                  >
                  <v-img
                      v-bind:class="{
                        'icon-landmark-selector': icon.class == 'landmark',
                        'icon-tech-selector': icon.class == 'tech',
                        'icon-military-selector': icon.class == 'military',
                        'icon-default-selector': icon.class == 'default',
                        'icon-none-selector': icon.class == 'none',
                        'icon-selector': !icon.class,
                      }"
                      style="height: 42px; width: 42px"
                      :src="icon.imgSrc"
                    ></v-img>
                  </v-btn>
                </template>
              </v-tooltip>
            </v-row>
          </v-container>
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
          <v-container>
            <v-row align="center" justify="center">
              <v-tooltip location="top">
                <span
                  :style="{
                    color: $vuetify.theme.current.colors.primary,
                  }"
                  >{{ icon.title }}</span
                >
                <template v-slot:activator="{ props }">
                  <v-btn
                    color="primary"
                    v-bind="props"
                    variant="text"
                    @click="imageSelected(icon.imgSrc, icon.title, icon.class)"
                    height="60"
                    width="60"
                  >
                  <v-img
                      v-bind:class="{
                        'icon-landmark-selector': icon.class == 'landmark',
                        'icon-tech-selector': icon.class == 'tech',
                        'icon-military-selector': icon.class == 'military',
                        'icon-default-selector': icon.class == 'default',
                        'icon-none-selector': icon.class == 'none',
                        'icon-selector': !icon.class,
                      }"
                      style="height: 42px; width: 42px"
                      :src="icon.imgSrc"
                    ></v-img>
                  </v-btn>
                </template>
              </v-tooltip>
            </v-row>
          </v-container>
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
          <v-container>
            <v-row align="center" justify="center">
              <v-tooltip location="top">
                <span
                  :style="{
                    color: $vuetify.theme.current.colors.primary,
                  }"
                  >{{ icon.title }}</span
                >
                <template v-slot:activator="{ props }">
                  <v-btn
                    color="primary"
                    v-bind="props"
                    variant="text"
                    @click="imageSelected(icon.imgSrc, icon.title, icon.class)"
                    height="60"
                    width="60"
                  >
                  <v-img
                      v-bind:class="{
                        'icon-landmark-selector': icon.class == 'landmark',
                        'icon-tech-selector': icon.class == 'tech',
                        'icon-military-selector': icon.class == 'military',
                        'icon-default-selector': icon.class == 'default',
                        'icon-none-selector': icon.class == 'none',
                        'icon-selector': !icon.class,
                      }"
                      style="height: 42px; width: 42px"
                      :src="icon.imgSrc"
                    ></v-img>
                  </v-btn>
                </template>
              </v-tooltip>
            </v-row>
          </v-container>
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
          <v-container>
            <v-row align="center" justify="center">
              <v-tooltip location="top">
                <span
                  :style="{
                    color: $vuetify.theme.current.colors.primary,
                  }"
                  >{{ icon.title }}</span
                >
                <template v-slot:activator="{ props }">
                  <v-btn
                    color="primary"
                    v-bind="props"
                    variant="text"
                    @click="imageSelected(icon.imgSrc, icon.title, icon.class)"
                    height="60"
                    width="60"
                  >
                  <v-img
                      v-bind:class="{
                        'icon-landmark-selector': icon.class == 'landmark',
                        'icon-tech-selector': icon.class == 'tech',
                        'icon-military-selector': icon.class == 'military',
                        'icon-default-selector': icon.class == 'default',
                        'icon-none-selector': icon.class == 'none',
                        'icon-selector': !icon.class,
                      }"
                      style="height: 42px; width: 42px"
                      :src="icon.imgSrc"
                    ></v-img>
                  </v-btn>
                </template>
              </v-tooltip>
            </v-row>
          </v-container>
        </v-col>
      </v-row>
    </v-card>
  </v-card>
</template>

<script>
import { ref, computed } from "vue";
import useIconService from "../../composables/builds/useIconService.js";

export default {
  name: "IconSelector",
  props: ["civ"],
  emits: ["iconSelected"],
  setup(props, context) {
    const { getIcons } = useIconService(props.civ);
    const searchText = ref("");

    //unfiltered raw data
    const ecoBuildings = getIcons("building_eco")
      .concat(getIcons("building_religious"))
      .concat(getIcons("building_tech"));
    const militaryBuildings = getIcons("building_military");
    const general = getIcons("unit_eco").concat(
      getIcons("unit_religious").concat(getIcons("resource"))
    );
    const militaryUnits = getIcons("unit_military").concat(getIcons("unit_religious").concat(getIcons("unit_hero")));
    const ecoTechnologies = getIcons("tech_eco");
    const militaryTechnologies = getIcons("tech_military");
    const landmarks = getIcons("landmark").concat(getIcons("general"));

    //filtered data
    const filteredEcoBuildings = computed(() => filter(ecoBuildings));
    const filteredMilitaryBuildings = computed(() => filter(militaryBuildings));
    const filteredGeneral = computed(() => filter(general));
    const filteredMilitaryUnits = computed(() => filter(militaryUnits));
    const filteredEcoTechnologies = computed(() => filter(ecoTechnologies));
    const filteredMilitaryTechnologies = computed(() =>
      filter(militaryTechnologies)
    );
    const filteredLandmarks = computed(() => filter(landmarks));

    const filter = (unfiltered) => {
      if (searchText.value?.length >= 2) {
        return unfiltered.filter((item) =>
          item.title.toLowerCase().includes(searchText.value?.toLowerCase())
        );
      } else {
        return unfiltered;
      }
    };

    const imageSelected = (imgSrc, tooltip, imgClass) => {
      context.emit("iconSelected", imgSrc, tooltip, imgClass);
    };

    return {
      filteredEcoBuildings,
      filteredMilitaryBuildings,
      filteredGeneral,
      filteredMilitaryUnits,
      filteredEcoTechnologies,
      filteredMilitaryTechnologies,
      filteredLandmarks,
      searchText,
      filter,
      imageSelected,
    };
  },
};
</script>
<style>
.icon {
  vertical-align: middle;
  height: auto;
  width: 42px;
  border-radius: 4px;
}
.icon-tech-selector {
  vertical-align: middle;
  height: auto;
  width: 42px;
  border-radius: 4px;
  background: radial-gradient(circle at top center, #469586, #266d5b);
}
.icon-military-selector {
  vertical-align: middle;
  height: 42px;
  width: 42px;
  border-radius: 4px;
  background: radial-gradient(circle at top center, #8b5d44, #683a22);
}
.icon-landmark-selector {
  vertical-align: middle;
  height: auto;
  width: 42px;
  border-radius: 4px;
  background: radial-gradient(circle at top center, #232e3e, #0c0f17);
}
.icon-none-selector {
  vertical-align: middle;
  height: auto;
  width: 42px;
  border-radius: 4px;
  background: radial-gradient(circle at top center, rgb(var(--v-theme-icon-background-highlight)), rgb(var(--v-theme-icon-background)));
}
.icon-default-selector {
  vertical-align: middle;
  height: auto;
  width: 42px;
  border-radius: 4px;
  background: radial-gradient(circle at top center, #4b6382, #1D2432);
}
</style>
