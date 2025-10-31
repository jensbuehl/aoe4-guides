<template>
  <v-card flat>
    <v-row>
      <v-col cols="12">
        <v-text-field autofocus v-model="searchText" label="Search..." clearable></v-text-field>
      </v-col>
    </v-row>
    <v-tabs center-active show-arrows class="mt-n4" v-model="tab" color="accent">
      <v-tooltip location="top">
        <span
          :style="{
            color: $vuetify.theme.current.colors.primary,
          }"
          >Workers & Resources</span
        >
        <template v-slot:activator="{ props }">
          <v-tab v-bind="props" value="general"> Resources </v-tab>
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
          <v-tab v-bind="props" value="landmarks">Landmarks</v-tab>
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
          <v-tab v-bind="props" value="units_military">Military Units</v-tab>
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
          <v-tab v-bind="props" value="buildings_eco">Eco Buildings</v-tab>
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
          <v-tab v-bind="props" value="buildings_military">Military Buildings</v-tab>
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
          <v-tab v-bind="props" value="techEco">Eco Tec</v-tab>
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
          <v-tab v-bind="props" value="techMilitary">Military Tec</v-tab>
        </template>
      </v-tooltip>
      <v-tooltip location="top">
        <span
          :style="{
            color: $vuetify.theme.current.colors.primary,
          }"
          >Heroes & Abilities</span
        >
        <template v-slot:activator="{ props }">
          <v-tab v-bind="props" value="abilities" v-show="heroes.length">Abilities</v-tab>
        </template>
      </v-tooltip>
    </v-tabs>
    <v-card fluid class="overflow-y-auto pb-2" min-height="400" max-height="400" flat>
      <v-window v-model="tab" v-if="!searchText">
        <v-window-item value="general">
          <v-row class="mt-2 mx-2 mx-sm-8" v-show="general.length" no-gutters align="center">
            <v-col class="mb-2" cols="2" v-for="icon in general" :key="icon.imgSrc">
              <v-container>
                <v-row align="center" justify="center">
                  <v-tooltip location="top">
                    <IconToolTip :icon="icon"></IconToolTip>
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
        </v-window-item>
        <v-window-item value="abilities">
          <v-row class="mt-2 mx-2 mx-sm-8" v-show="general.length" no-gutters align="center">
            <v-col class="mb-2" cols="2" v-for="icon in heroes" :key="icon.imgSrc">
              <v-container>
                <v-row align="center" justify="center">
                  <v-tooltip location="top">
                    <IconToolTip :icon="icon"></IconToolTip>
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
            </v-col> </v-row
        ></v-window-item>
        <v-window-item value="landmarks">
          <v-row class="mt-2 mx-2 mx-sm-8" v-show="general.length" no-gutters align="center">
            <v-col class="mb-2" cols="2" v-for="icon in landmarks" :key="icon.imgSrc">
              <v-container>
                <v-row align="center" justify="center">
                  <v-tooltip location="top">
                    <IconToolTip :icon="icon"></IconToolTip>
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
            </v-col> </v-row
        ></v-window-item>
        <v-window-item value="buildings_eco">
          <v-row class="mt-2 mx-2 mx-sm-8" v-show="general.length" no-gutters align="center">
            <v-col class="mb-2" cols="2" v-for="icon in ecoBuildings" :key="icon.imgSrc">
              <v-container>
                <v-row align="center" justify="center">
                  <v-tooltip location="top">
                    <IconToolTip :icon="icon"></IconToolTip>
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
            </v-col> </v-row
        ></v-window-item>
        <v-window-item value="buildings_military">
          <v-row class="mt-2 mx-2 mx-sm-8" v-show="general.length" no-gutters align="center">
            <v-col class="mb-2" cols="2" v-for="icon in militaryBuildings" :key="icon.imgSrc">
              <v-container>
                <v-row align="center" justify="center">
                  <v-tooltip location="top">
                    <IconToolTip :icon="icon"></IconToolTip>
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
            </v-col> </v-row
        ></v-window-item>
        <v-window-item value="techEco">
          <v-row class="mt-2 mx-2 mx-sm-8" v-show="general.length" no-gutters align="center">
            <v-col class="mb-2" cols="2" v-for="icon in ecoTechnologies" :key="icon.imgSrc">
              <v-container>
                <v-row align="center" justify="center">
                  <v-tooltip location="top">
                    <IconToolTip :icon="icon"></IconToolTip>
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
            </v-col> </v-row
        ></v-window-item>
        <v-window-item value="techMilitary">
          <v-row class="mt-2 mx-2 mx-sm-8" v-show="general.length" no-gutters align="center">
            <v-col class="mb-2" cols="2" v-for="icon in militaryTechnologies" :key="icon.imgSrc">
              <v-container>
                <v-row align="center" justify="center">
                  <v-tooltip location="top">
                    <IconToolTip :icon="icon"></IconToolTip>
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
            </v-col> </v-row
        ></v-window-item>
        <v-window-item value="units_military">
          <v-row class="mt-2 mx-2 mx-sm-8" v-show="general.length" no-gutters align="center">
            <v-col class="mb-2" cols="2" v-for="icon in militaryUnits" :key="icon.imgSrc">
              <v-container>
                <v-row align="center" justify="center">
                  <v-tooltip location="top">
                    <IconToolTip :icon="icon"></IconToolTip>
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
            </v-col> </v-row
        ></v-window-item>
      </v-window>
      <v-row class="mt-2 mx-2 mx-sm-8" v-if="searchText" no-gutters align="center">
        <v-col class="mb-2" cols="2" v-for="icon in searchResults" :key="icon.imgSrc">
          <v-container>
            <v-row align="center" justify="center">
              <v-tooltip location="top">
                <IconToolTip :icon="icon"></IconToolTip>
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
//External
import { ref, computed } from "vue";

//Components
import IconToolTip from "@/components/builds/IconToolTip.vue";

//Composables
import iconService from "@/composables/builds/icons/iconService.js";

export default {
  name: "IconSelector",
  props: ["civ"],
  emits: ["iconSelected"],
  components: { IconToolTip },
  setup(props, context) {
    const { getIcons } = iconService(props.civ);
    const searchText = ref("");
    const tab = ref(null);

    //unfiltered raw data
    const ecoBuildings = getIcons("buildingEco")
      .concat(getIcons("buildingReligious"))
      .concat(getIcons("buildingTech"));
    const militaryBuildings = getIcons("buildingMilitary");
    const general = getIcons("unitEco").concat(
      getIcons("unitReligious").concat(getIcons("resource"))
    );
    const militaryUnits = getIcons("unitMilitary").concat(getIcons("unitReligious"));
    const ecoTechnologies = getIcons("techEco");
    const militaryTechnologies = getIcons("techMilitary");
    const landmarks = getIcons("landmark").concat(getIcons("general"));
    const heroes = getIcons("unitHero").concat(getIcons("abilityHero"));
    const allIcons = getIcons();

    //filtered data
    const searchResults = computed(() => filter(allIcons));
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
