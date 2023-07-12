<template>
  <v-card>
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
    <v-card fluid class="overflow-y-auto pb-2" max-height="400">
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
                    color: $vuetify.theme.themes.customDarkTheme.colors.primary,
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
                        'icon-landmark': icon.class == 'landmark',
                        'icon-tech': icon.class == 'tech',
                        'icon-military': icon.class == 'military',
                        'icon-default': icon.class == 'default',
                        'icon-none': icon.class == 'none',
                        'icon': !icon.class,
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
                    color: $vuetify.theme.themes.customDarkTheme.colors.primary,
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
                        'icon-landmark': icon.class == 'landmark',
                        'icon-tech': icon.class == 'tech',
                        'icon-military': icon.class == 'military',
                        'icon-default': icon.class == 'default',
                        'icon-none': icon.class == 'none',
                        'icon': !icon.class,
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
                    color: $vuetify.theme.themes.customDarkTheme.colors.primary,
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
                        'icon-landmark': icon.class == 'landmark',
                        'icon-tech': icon.class == 'tech',
                        'icon-military': icon.class == 'military',
                        'icon-default': icon.class == 'default',
                        'icon-none': icon.class == 'none',
                        'icon': !icon.class,
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
                    color: $vuetify.theme.themes.customDarkTheme.colors.primary,
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
                        'icon-landmark': icon.class == 'landmark',
                        'icon-tech': icon.class == 'tech',
                        'icon-military': icon.class == 'military',
                        'icon-default': icon.class == 'default',
                        'icon-none': icon.class == 'none',
                        'icon': !icon.class,
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
                    color: $vuetify.theme.themes.customDarkTheme.colors.primary,
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
                        'icon-landmark': icon.class == 'landmark',
                        'icon-tech': icon.class == 'tech',
                        'icon-military': icon.class == 'military',
                        'icon-default': icon.class == 'default',
                        'icon-none': icon.class == 'none',
                        'icon': !icon.class,
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
                    color: $vuetify.theme.themes.customDarkTheme.colors.primary,
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
                        'icon-landmark': icon.class == 'landmark',
                        'icon-tech': icon.class == 'tech',
                        'icon-military': icon.class == 'military',
                        'icon-default': icon.class == 'default',
                        'icon-none': icon.class == 'none',
                        'icon': !icon.class,
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
                    color: $vuetify.theme.themes.customDarkTheme.colors.primary,
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
                        'icon-landmark': icon.class == 'landmark',
                        'icon-tech': icon.class == 'tech',
                        'icon-military': icon.class == 'military',
                        'icon-default': icon.class == 'default',
                        'icon-none': icon.class == 'none',
                        'icon': !icon.class,
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
import useIconService from "../composables/useIconService.js";

export default {
  name: "StepsEditor",
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
    const militaryUnits = getIcons("unit_military").concat(getIcons("unit_religious"));
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
  background: radial-gradient(circle at top center, #3d516b, #23303f);
}
.icon-tech {
  vertical-align: middle;
  height: auto;
  width: 42px;
  border-radius: 4px;
  background: radial-gradient(circle at top center, #469586, #266d5b);
}
.icon-military {
  vertical-align: middle;
  height: 42px;
  width: 42px;
  border-radius: 4px;
  background: radial-gradient(circle at top center, #8b5d44, #683a22);
}
.icon-landmark {
  vertical-align: middle;
  height: auto;
  width: 42px;
  border-radius: 4px;
  background: radial-gradient(circle at top center, #232e3e, #0c0f17);
}
.icon-none {
  vertical-align: middle;
  height: auto;
  width: 42px;
  border-radius: 4px;
}
.icon-default {
  vertical-align: middle;
  height: auto;
  width: 42px;
  border-radius: 4px;
  background: radial-gradient(circle at top center, #3d516b, #23303f);
}
</style>
