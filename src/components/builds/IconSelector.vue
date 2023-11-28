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
    <v-tabs align-tabs="center" v-model="tab" class="mb-5" color="accent">
      <v-tooltip location="top">
        <span
          :style="{
            color: $vuetify.theme.current.colors.primary,
          }"
          >Workers & Resources</span
        >
        <template v-slot:activator="{ props }">
          <v-tab v-bind="props" value="general">
            <v-img
              class="icon-default-selector"
              src="/assets/pictures/unit_worker/villager.png"
            ></v-img>
          </v-tab>
        </template>
      </v-tooltip>
      <v-tooltip location="top">
        <span
          :style="{
            color: $vuetify.theme.current.colors.primary,
          }"
          >Landmarks, Actions & Flags</span
        >
        <template v-slot:activator="{ props }">
          <v-tab v-bind="props" value="landmarks">
            <v-img
              class="icon-landmark-selector"
              src="/assets/pictures/landmark_english/council-hall.png"
            ></v-img>
          </v-tab>
        </template>
      </v-tooltip>
      <v-tooltip location="top">
        <span
          :style="{
            color: $vuetify.theme.current.colors.primary,
          }"
          >Military Units</span
        >
        <template v-slot:activator="{ props }">
          <v-tab v-bind="props" value="units_military"
            ><v-img
              class="icon-military-selector"
              src="/assets/pictures/unit_cavalry/scout.png"
            ></v-img
          ></v-tab>
        </template>
      </v-tooltip>
      <v-tooltip location="top">
        <span
          :style="{
            color: $vuetify.theme.current.colors.primary,
          }"
          >Economic Buildings</span
        >
        <template v-slot:activator="{ props }">
          <v-tab v-bind="props" value="buildings_eco"
            ><v-img
              class="icon-default-selector"
              src="/assets/pictures/building_economy/house.png"
            ></v-img
          ></v-tab>
        </template>
      </v-tooltip>
      <v-tooltip location="top">
        <span
          :style="{
            color: $vuetify.theme.current.colors.primary,
          }"
          >Military Buildings</span
        >
        <template v-slot:activator="{ props }">
          <v-tab v-bind="props" value="buildings_military"
            ><v-img
              class="icon-military-selector"
              src="/assets/pictures/building_military/barracks.png"
            ></v-img
          ></v-tab>
        </template>
      </v-tooltip>
      <v-tooltip location="top">
        <span
          :style="{
            color: $vuetify.theme.current.colors.primary,
          }"
          >Economic Technologies</span
        >
        <template v-slot:activator="{ props }">
          <v-tab v-bind="props" value="tech_eco"
            ><v-img
              class="icon-tech-selector"
              src="/assets/pictures/technology_economy/wheelbarrow.png"
            ></v-img
          ></v-tab>
        </template>
      </v-tooltip>
      <v-tooltip location="top">
        <span
          :style="{
            color: $vuetify.theme.current.colors.primary,
          }"
          >Military Technologies</span
        >
        <template v-slot:activator="{ props }">
          <v-tab v-bind="props" value="tech_military"
            ><v-img
              class="icon-tech-selector"
              src="/assets/pictures/technology_military/incendiary-arrows.png"
            ></v-img
          ></v-tab>
        </template>
      </v-tooltip>
      <v-tooltip location="top">
        <span
          :style="{
            color: $vuetify.theme.current.colors.primary,
          }"
          >Economic Technologies</span
        >
        <template v-slot:activator="{ props }">
          <v-tab v-bind="props" value="abilities" v-show="heroes.length"
            ><v-img
              class="icon-ability-selector"
              src="/assets/pictures/ability_jeanne/ability-divine-arrow-1.png"
            ></v-img
          ></v-tab>
        </template>
      </v-tooltip>
    </v-tabs>
    <v-divider></v-divider>
    <v-card
      fluid
      class="overflow-y-auto pb-2"
      min-height="400"
      max-height="400"
      flat
    >
      <v-window v-model="tab" v-if="!searchText">
        <v-window-item value="general">
          <v-row v-show="general.length" no-gutters align="center">
            <v-col cols="12">
              <v-card
                class="text-center"
                flat
                title="Workers & Resources"
              ></v-card>
            </v-col>
            <v-col
              class="mt-n2 mb-2"
              cols="3"
              v-for="icon in general"
              :key="icon.imgSrc"
            >
              <v-container>
                <v-row align="center" justify="center">
                  <v-tooltip class="custom-tooltip">
                    <span
                      :style="{
                        color: $vuetify.theme.current.colors.primary,
                      }"
                      >{{ icon.title }}</span
                    ><br /><span
                      v-if="icon.shorthand"
                      :style="{
                        color: $vuetify.theme.current.colors.primary,
                      }"
                      >({{ getFormattedShorthands(icon.shorthand) }})</span
                    >
                    <template v-slot:activator="{ props }">
                      <v-btn
                        color="primary"
                        v-bind="props"
                        variant="text"
                        @click="
                          imageSelected(icon.imgSrc, icon.title, icon.class)
                        "
                        height="60"
                        width="60"
                      >
                        <v-img
                          v-bind:class="{
                            'icon-landmark-selector': icon.class == 'landmark',
                            'icon-tech-selector': icon.class == 'tech',
                            'icon-ability-selector': icon.class == 'ability',
                            'icon-military-selector': icon.class == 'military',
                            'icon-default-selector': icon.class == 'default',
                            'icon-none-selector': icon.class == 'none',
                            'icon-selector': !icon.class,
                          }"
                          style="height: 48px; width: 48px"
                          :src="icon.imgSrc"
                        ></v-img>
                      </v-btn>
                    </template>
                  </v-tooltip>
                </v-row>
              </v-container>
            </v-col>
          </v-row>
        </v-window-item>
        <v-window-item value="abilities"
          ><v-row no-gutters align="center">
            <v-col cols="12">
              <v-card
                class="text-center"
                flat
                title="Heroes & Abilities"
              ></v-card>
            </v-col>
            <v-col
              class="mt-n2 mb-2"
              cols="3"
              v-for="icon in heroes"
              :key="icon.imgSrc"
            >
              <v-container>
                <v-row align="center" justify="center">
                  <v-tooltip>
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
                        @click="
                          imageSelected(icon.imgSrc, icon.title, icon.class)
                        "
                        height="60"
                        width="60"
                      >
                        <v-img
                          v-bind:class="{
                            'icon-landmark-selector': icon.class == 'landmark',
                            'icon-tech-selector': icon.class == 'tech',
                            'icon-ability-selector': icon.class == 'ability',
                            'icon-military-selector': icon.class == 'military',
                            'icon-default-selector': icon.class == 'default',
                            'icon-none-selector': icon.class == 'none',
                            'icon-selector': !icon.class,
                          }"
                          style="height: 48px; width: 48px"
                          :src="icon.imgSrc"
                        ></v-img>
                      </v-btn>
                    </template>
                  </v-tooltip>
                </v-row>
              </v-container>
            </v-col> </v-row
        ></v-window-item>
        <v-window-item value="landmarks"
          ><v-row v-show="landmarks.length" no-gutters align="center">
            <v-col cols="12">
              <v-card
                class="text-center"
                flat
                title="Landmarks, Actions & Flags"
              ></v-card>
            </v-col>
            <v-col
              class="mt-n2 mb-2"
              cols="3"
              v-for="icon in landmarks"
              :key="icon.imgSrc"
            >
              <v-container>
                <v-row align="center" justify="center">
                  <v-tooltip>
                    <span
                      :style="{
                        color: $vuetify.theme.current.colors.primary,
                      }"
                      >{{ icon.title }}</span
                    ><br /><span
                      v-if="icon.shorthand"
                      :style="{
                        color: $vuetify.theme.current.colors.primary,
                      }"
                      >({{ getFormattedShorthands(icon.shorthand) }})</span
                    >
                    <template v-slot:activator="{ props }">
                      <v-btn
                        color="primary"
                        v-bind="props"
                        variant="text"
                        @click="
                          imageSelected(icon.imgSrc, icon.title, icon.class)
                        "
                        height="60"
                        width="60"
                      >
                        <v-img
                          v-bind:class="{
                            'icon-landmark-selector': icon.class == 'landmark',
                            'icon-tech-selector': icon.class == 'tech',
                            'icon-ability-selector': icon.class == 'ability',
                            'icon-military-selector': icon.class == 'military',
                            'icon-default-selector': icon.class == 'default',
                            'icon-none-selector': icon.class == 'none',
                            'icon-selector': !icon.class,
                          }"
                          style="height: 48px; width: 48px"
                          :src="icon.imgSrc"
                        ></v-img>
                      </v-btn>
                    </template>
                  </v-tooltip>
                </v-row>
              </v-container>
            </v-col> </v-row
        ></v-window-item>
        <v-window-item value="buildings_eco"
          ><v-row v-show="ecoBuildings.length" no-gutters align="center">
            <v-col cols="12">
              <v-card
                class="text-center"
                flat
                title="Economic Buildings"
              ></v-card>
            </v-col>
            <v-col
              class="mt-n2 mb-2"
              cols="3"
              v-for="icon in ecoBuildings"
              :key="icon.imgSrc"
            >
              <v-container>
                <v-row align="center" justify="center">
                  <v-tooltip>
                    <span
                      :style="{
                        color: $vuetify.theme.current.colors.primary,
                      }"
                      >{{ icon.title }}</span
                    ><br /><span
                      v-if="icon.shorthand"
                      :style="{
                        color: $vuetify.theme.current.colors.primary,
                      }"
                      >({{ getFormattedShorthands(icon.shorthand) }})</span
                    >
                    <template v-slot:activator="{ props }">
                      <v-btn
                        color="primary"
                        v-bind="props"
                        variant="text"
                        @click="
                          imageSelected(icon.imgSrc, icon.title, icon.class)
                        "
                        height="60"
                        width="60"
                      >
                        <v-img
                          v-bind:class="{
                            'icon-landmark-selector': icon.class == 'landmark',
                            'icon-tech-selector': icon.class == 'tech',
                            'icon-ability-selector': icon.class == 'ability',
                            'icon-military-selector': icon.class == 'military',
                            'icon-default-selector': icon.class == 'default',
                            'icon-none-selector': icon.class == 'none',
                            'icon-selector': !icon.class,
                          }"
                          style="height: 48px; width: 48px"
                          :src="icon.imgSrc"
                        ></v-img>
                      </v-btn>
                    </template>
                  </v-tooltip>
                </v-row>
              </v-container>
            </v-col> </v-row
        ></v-window-item>
        <v-window-item value="buildings_military"
          ><v-row v-show="militaryBuildings.length" no-gutters align="center">
            <v-col cols="12">
              <v-card
                class="text-center"
                flat
                title="Military Buildings"
              ></v-card>
            </v-col>
            <v-col
              class="mt-n2 mb-2"
              cols="3"
              v-for="icon in militaryBuildings"
              :key="icon.imgSrc"
            >
              <v-container>
                <v-row align="center" justify="center">
                  <v-tooltip>
                    <span
                      :style="{
                        color: $vuetify.theme.current.colors.primary,
                      }"
                      >{{ icon.title }}</span
                    ><br /><span
                      v-if="icon.shorthand"
                      :style="{
                        color: $vuetify.theme.current.colors.primary,
                      }"
                      >({{ getFormattedShorthands(icon.shorthand) }})</span
                    >
                    <template v-slot:activator="{ props }">
                      <v-btn
                        color="primary"
                        v-bind="props"
                        variant="text"
                        @click="
                          imageSelected(icon.imgSrc, icon.title, icon.class)
                        "
                        height="60"
                        width="60"
                      >
                        <v-img
                          v-bind:class="{
                            'icon-landmark-selector': icon.class == 'landmark',
                            'icon-tech-selector': icon.class == 'tech',
                            'icon-ability-selector': icon.class == 'ability',
                            'icon-military-selector': icon.class == 'military',
                            'icon-default-selector': icon.class == 'default',
                            'icon-none-selector': icon.class == 'none',
                            'icon-selector': !icon.class,
                          }"
                          style="height: 48px; width: 48px"
                          :src="icon.imgSrc"
                        ></v-img>
                      </v-btn>
                    </template>
                  </v-tooltip>
                </v-row>
              </v-container>
            </v-col> </v-row
        ></v-window-item>
        <v-window-item value="tech_eco"
          ><v-row v-show="ecoTechnologies.length" no-gutters align="center">
            <v-col cols="12">
              <v-card
                class="text-center"
                flat
                title="Economic Technologies"
              ></v-card>
            </v-col>
            <v-col
              class="mt-n2 mb-2"
              cols="3"
              v-for="icon in ecoTechnologies"
              :key="icon.imgSrc"
            >
              <v-container>
                <v-row align="center" justify="center">
                  <v-tooltip>
                    <span
                      :style="{
                        color: $vuetify.theme.current.colors.primary,
                      }"
                      >{{ icon.title }}</span
                    ><br /><span
                      v-if="icon.shorthand"
                      :style="{
                        color: $vuetify.theme.current.colors.primary,
                      }"
                      >({{ getFormattedShorthands(icon.shorthand) }})</span
                    >
                    <template v-slot:activator="{ props }">
                      <v-btn
                        color="primary"
                        v-bind="props"
                        variant="text"
                        @click="
                          imageSelected(icon.imgSrc, icon.title, icon.class)
                        "
                        height="60"
                        width="60"
                      >
                        <v-img
                          v-bind:class="{
                            'icon-landmark-selector': icon.class == 'landmark',
                            'icon-tech-selector': icon.class == 'tech',
                            'icon-ability-selector': icon.class == 'ability',
                            'icon-military-selector': icon.class == 'military',
                            'icon-default-selector': icon.class == 'default',
                            'icon-none-selector': icon.class == 'none',
                            'icon-selector': !icon.class,
                          }"
                          style="height: 48px; width: 48px"
                          :src="icon.imgSrc"
                        ></v-img>
                      </v-btn>
                    </template>
                  </v-tooltip>
                </v-row>
              </v-container>
            </v-col> </v-row
        ></v-window-item>
        <v-window-item value="tech_military"
          ><v-row
            v-show="militaryTechnologies.length"
            no-gutters
            align="center"
          >
            <v-col cols="12">
              <v-card
                class="text-center"
                flat
                title="Military Technologies"
              ></v-card>
            </v-col>
            <v-col
              class="mt-n2 mb-2"
              cols="3"
              v-for="icon in militaryTechnologies"
              :key="icon.imgSrc"
            >
              <v-container>
                <v-row align="center" justify="center">
                  <v-tooltip>
                    <span
                      :style="{
                        color: $vuetify.theme.current.colors.primary,
                      }"
                      >{{ icon.title }}</span
                    ><br /><span
                      v-if="icon.shorthand"
                      :style="{
                        color: $vuetify.theme.current.colors.primary,
                      }"
                      >({{ getFormattedShorthands(icon.shorthand) }})</span
                    >
                    <template v-slot:activator="{ props }">
                      <v-btn
                        color="primary"
                        v-bind="props"
                        variant="text"
                        @click="
                          imageSelected(icon.imgSrc, icon.title, icon.class)
                        "
                        height="60"
                        width="60"
                      >
                        <v-img
                          v-bind:class="{
                            'icon-landmark-selector': icon.class == 'landmark',
                            'icon-tech-selector': icon.class == 'tech',
                            'icon-ability-selector': icon.class == 'ability',
                            'icon-military-selector': icon.class == 'military',
                            'icon-default-selector': icon.class == 'default',
                            'icon-none-selector': icon.class == 'none',
                            'icon-selector': !icon.class,
                          }"
                          style="height: 48px; width: 48px"
                          :src="icon.imgSrc"
                        ></v-img>
                      </v-btn>
                    </template>
                  </v-tooltip>
                </v-row>
              </v-container>
            </v-col> </v-row
        ></v-window-item>
        <v-window-item value="units_military"
          ><v-row v-show="militaryUnits.length" no-gutters align="center">
            <v-col cols="12">
              <v-card class="text-center" flat title="Military Units"></v-card>
            </v-col>
            <v-col
              class="mt-n2 mb-2"
              cols="3"
              v-for="icon in militaryUnits"
              :key="icon.imgSrc"
            >
              <v-container>
                <v-row align="center" justify="center">
                  <v-tooltip>
                    <span
                      :style="{
                        color: $vuetify.theme.current.colors.primary,
                      }"
                      >{{ icon.title }}</span
                    ><br /><span
                      v-if="icon.shorthand"
                      :style="{
                        color: $vuetify.theme.current.colors.primary,
                      }"
                      >({{ getFormattedShorthands(icon.shorthand) }})</span
                    >
                    <template v-slot:activator="{ props }">
                      <v-btn
                        color="primary"
                        v-bind="props"
                        variant="text"
                        @click="
                          imageSelected(icon.imgSrc, icon.title, icon.class)
                        "
                        height="60"
                        width="60"
                      >
                        <v-img
                          v-bind:class="{
                            'icon-landmark-selector': icon.class == 'landmark',
                            'icon-tech-selector': icon.class == 'tech',
                            'icon-ability-selector': icon.class == 'ability',
                            'icon-military-selector': icon.class == 'military',
                            'icon-default-selector': icon.class == 'default',
                            'icon-none-selector': icon.class == 'none',
                            'icon-selector': !icon.class,
                          }"
                          style="height: 48px; width: 48px"
                          :src="icon.imgSrc"
                        ></v-img>
                      </v-btn>
                    </template>
                  </v-tooltip>
                </v-row>
              </v-container>
            </v-col> </v-row
        ></v-window-item>
      </v-window>
      <v-row v-if="searchText" no-gutters align="center">
        <v-col cols="12">
          <v-card class="text-center" flat title="Search Results"></v-card>
        </v-col>
        <v-col
          class="mt-n2 mb-2"
          cols="3"
          v-for="icon in searchResults"
          :key="icon.imgSrc"
        >
          <v-container>
            <v-row align="center" justify="center">
              <v-tooltip class="custom-tooltip">
                <span
                  :style="{
                    color: $vuetify.theme.current.colors.primary,
                  }"
                  >{{ icon.title }}</span
                ><br /><span
                  v-if="icon.shorthand"
                  :style="{
                    color: $vuetify.theme.current.colors.primary,
                  }"
                  >({{ getFormattedShorthands(icon.shorthand) }})</span
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
                        'icon-ability-selector': icon.class == 'ability',
                        'icon-military-selector': icon.class == 'military',
                        'icon-default-selector': icon.class == 'default',
                        'icon-none-selector': icon.class == 'none',
                        'icon-selector': !icon.class,
                      }"
                      style="height: 48px; width: 48px"
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
    const tab = ref(null);

    //unfiltered raw data
    const ecoBuildings = getIcons("building_eco")
      .concat(getIcons("building_religious"))
      .concat(getIcons("building_tech"));
    const militaryBuildings = getIcons("building_military");
    const general = getIcons("unit_eco").concat(
      getIcons("unit_religious").concat(getIcons("resource"))
    );
    const militaryUnits = getIcons("unit_military").concat(
      getIcons("unit_religious")
    );
    const ecoTechnologies = getIcons("tech_eco");
    const militaryTechnologies = getIcons("tech_military");
    const landmarks = getIcons("landmark").concat(getIcons("general"));
    const heroes = getIcons("unit_hero").concat(getIcons("ability_hero"));
    const all = getIcons();

    //filtered data
    const searchResults = computed(() => filter(all));
    const filter = (unfiltered) => {
      if (searchText.value?.length >= 2) {
        return unfiltered.filter((item) =>
          item.title.toLowerCase().includes(searchText.value?.toLowerCase())
        );
      } else {
        return unfiltered;
      }
    };

    const getFormattedShorthands = (shorthand) => {
      if (Array.isArray(shorthand)) {
        const withColon = shorthand.map((x) => ":" + x);
        const joined = withColon.join(", ");
        return joined;
      } else {
        return ":" + shorthand;
      }
    };

    const imageSelected = (imgSrc, tooltip, imgClass) => {
      context.emit("iconSelected", imgSrc, tooltip, imgClass);
    };

    return {
      ecoBuildings,
      militaryBuildings,
      general,
      militaryUnits,
      ecoTechnologies,
      militaryTechnologies,
      landmarks,
      heroes,
      searchResults,
      searchText,
      filter,
      getFormattedShorthands,
      imageSelected,
      tab,
    };
  },
};
</script>
<style>
.icon {
  vertical-align: middle;
  height: auto;
  width: 48px;
  border-radius: 4px;
}
.icon-ability-selector {
  vertical-align: middle;
  height: auto;
  width: 48px;
  border-radius: 4px;
  background: radial-gradient(circle at top center, #5c457b, #4d366e);
}
.icon-tech-selector {
  vertical-align: middle;
  height: auto;
  width: 48px;
  border-radius: 4px;
  background: radial-gradient(circle at top center, #469586, #266d5b);
}
.icon-military-selector {
  vertical-align: middle;
  height: 48px;
  width: 48px;
  border-radius: 4px;
  background: radial-gradient(circle at top center, #8b5d44, #683a22);
}
.icon-landmark-selector {
  vertical-align: middle;
  height: auto;
  width: 48px;
  border-radius: 4px;
  background: radial-gradient(circle at top center, #232e3e, #0c0f17);
}
.icon-none-selector {
  vertical-align: middle;
  height: auto;
  width: 48px;
  border-radius: 4px;
  background: radial-gradient(
    circle at top center,
    rgb(var(--v-theme-icon-background-highlight)),
    rgb(var(--v-theme-icon-background))
  );
}
.icon-default-selector {
  vertical-align: middle;
  height: auto;
  width: 48px;
  border-radius: 4px;
  background: radial-gradient(circle at top center, #4b6382, #1d2432);
}
</style>
