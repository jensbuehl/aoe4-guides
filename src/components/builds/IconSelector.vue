<template>
  <v-card flat :class="{ 'icon-selector--sheet': sheet }">
    <v-row>
      <v-col cols="12">
        <v-text-field :autofocus="autofocus" v-model="searchText" label="Search..." clearable enterkeyhint="search"></v-text-field>
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
    <p v-if="sheet && anyCiv" class="text-caption text-medium-emphasis px-4 pt-2 mb-0">
      Choose a civilization to see only its icons.
    </p>
    <!--Desktop: a fixed 400px window under a menu, as it has always been. Sheet:
        the grid takes whatever height the fullscreen dialog leaves under the
        search and the tabs, and is the only part that scrolls, so the search and
        the tab strip stay in reach however far down the author has gone.-->
    <v-card
      fluid
      class="overflow-y-auto pb-2"
      :class="{ 'icon-grid--sheet': sheet }"
      :min-height="sheet ? undefined : 400"
      :max-height="sheet ? undefined : 400"
      flat
    >
      <v-window v-model="tab" v-if="!searching">
        <v-window-item v-for="pane in panes" :key="pane.value" :value="pane.value">
          <!--Sheet tiles name their icon. A phone never opens a hover tooltip, and
              the name was the only thing telling one villager portrait from the
              next. The tile is AvatarPicker's civ tile: a text card, image over
              a caption — wrapped to up to three lines here rather than truncated
              to one, because unit and tech names run to twice the length of a
              civ's.-->
          <v-row v-if="sheet" dense class="mt-1 mx-1">
            <v-col cols="3" v-for="icon in pane.icons" :key="icon.imgSrc">
              <v-card
                variant="text"
                rounded="lg"
                class="pa-1 icon-tile"
                @click="imageSelected(icon.imgSrc, icon.title, icon.class)"
              >
                <v-img :class="iconClass(icon)" class="mx-auto" style="height: 48px; width: 48px" :src="icon.imgSrc"></v-img>
                <p class="text-caption text-center mt-1 icon-tile-name">{{ icon.title }}</p>
              </v-card>
            </v-col>
          </v-row>
          <v-row v-else class="mt-2 mx-2 mx-sm-8" no-gutters align="center">
            <v-col class="mb-2" cols="2" v-for="icon in pane.icons" :key="icon.imgSrc">
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
                        <v-img :class="iconClass(icon)" style="height: 48px; width: 48px" :src="icon.imgSrc"></v-img>
                      </v-btn>
                    </template>
                  </v-tooltip>
                </v-row>
              </v-container>
            </v-col>
          </v-row>
        </v-window-item>
      </v-window>
      <template v-if="searching">
        <v-row v-if="sheet" dense class="mt-1 mx-1">
          <v-col cols="3" v-for="icon in searchResults" :key="icon.imgSrc">
            <v-card
              variant="text"
              rounded="lg"
              class="pa-1 icon-tile"
              @click="imageSelected(icon.imgSrc, icon.title, icon.class)"
            >
              <v-img :class="iconClass(icon)" class="mx-auto" style="height: 48px; width: 48px" :src="icon.imgSrc"></v-img>
              <p class="text-caption text-center mt-1 icon-tile-name">{{ icon.title }}</p>
            </v-card>
          </v-col>
        </v-row>
        <v-row v-else class="mt-2 mx-2 mx-sm-8" no-gutters align="center">
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
                      <v-img :class="iconClass(icon)" style="height: 48px; width: 48px" :src="icon.imgSrc"></v-img>
                    </v-btn>
                  </template>
                </v-tooltip>
              </v-row>
            </v-container>
          </v-col>
        </v-row>
      </template>
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
  props: {
    civ: { default: null },
    //The phone layout: named tiles in a grid that fills its container's height,
    //for a fullscreen dialog. Off, this is the desktop menu exactly as it was.
    sheet: { type: Boolean, default: false },
  },
  emits: ["iconSelected"],
  components: { IconToolTip },
  setup(props, context) {
    const { getIcons } = iconService(props.civ);
    const searchText = ref("");
    const tab = ref(null);

    //Focusing the search on open suits a mouse, where the author picks by name.
    //On a touch screen focus is the on-screen keyboard, which comes up over the
    //grid the picker was opened to show — so the search waits to be tapped.
    //Asked of the primary pointer rather than of touch support, so a laptop
    //with a touchscreen still gets the focused field it has always had.
    const autofocus = !props.sheet && !window.matchMedia("(pointer: coarse)").matches;

    //unfiltered raw data
    const ecoBuildings = getIcons("buildingEco")
      .concat(getIcons("buildingReligious"))
      .concat(getIcons("buildingTech"));
    const militaryBuildings = getIcons("buildingMilitary");
    const general = getIcons("unitEco").concat(
      getIcons("unitReligious").concat(getIcons("resource"))
    );
    // Grouped by kind, ships last: the file order only says when an entry was
    // added. unitGroup comes from AOE4World's classes (set by the Admin gap
    // sync); religious units are known by their file. Stable within a group.
    // An entry without a known group sits with "mixed", ahead of siege and ships.
    const UNIT_GROUP_ORDER = ["infantry-melee", "infantry-ranged", "cavalry", "mixed", "religious", "siege", "ship"];
    const religiousUnits = getIcons("unitReligious");
    const unitRank = (icon) => {
      const group = icon.unitGroup ?? (religiousUnits.includes(icon) ? "religious" : "mixed");
      const rank = UNIT_GROUP_ORDER.indexOf(group);
      return rank === -1 ? UNIT_GROUP_ORDER.indexOf("mixed") : rank;
    };
    const militaryUnits = getIcons("unitMilitary")
      .concat(religiousUnits)
      .map((icon, index) => ({ icon, index }))
      .sort((a, b) => unitRank(a.icon) - unitRank(b.icon) || a.index - b.index)
      .map(({ icon }) => icon);
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

    //Below two letters the filter matches everything, so the desktop menu shows
    //the whole vocabulary, as it always has. The sheet keeps the current tab
    //instead: its named tiles are heavier, and all ~1,100 of them took over two
    //seconds to render on the first keystroke, and fourteen on a throttled CPU.
    const searching = computed(() =>
      props.sheet ? searchText.value?.length >= 2 : Boolean(searchText.value)
    );
    //No civ means every civ's variant of a unit — eight villagers, all named
    //"Villager". Said once in the sheet, where the names make it visible.
    const anyCiv = !props.civ || props.civ === "ANY";

    //The tabs' windows, in the order they have always been declared in.
    const panes = [
      { value: "general", icons: general },
      { value: "abilities", icons: heroes },
      { value: "landmarks", icons: landmarks },
      { value: "buildings_eco", icons: ecoBuildings },
      { value: "buildings_military", icons: militaryBuildings },
      { value: "techEco", icons: ecoTechnologies },
      { value: "techMilitary", icons: militaryTechnologies },
      { value: "units_military", icons: militaryUnits },
    ];

    const iconClass = (icon) => ({
      "icon-landmark-selector": icon.class == "landmark",
      "icon-tech-selector": icon.class == "tech",
      "icon-ability-selector": icon.class == "ability",
      "icon-military-selector": icon.class == "military",
      "icon-default-selector": icon.class == "default",
      "icon-none-selector": icon.class == "none",
      "icon-selector": !icon.class,
    });

    const imageSelected = (imgSrc, tooltip, imgClass) => {
      context.emit("iconSelected", imgSrc, tooltip, imgClass);
    };

    return {
      autofocus,
      panes,
      iconClass,
      ecoBuildings,
      militaryBuildings,
      general,
      militaryUnits,
      ecoTechnologies,
      militaryTechnologies,
      landmarks,
      heroes,
      searchResults,
      searching,
      anyCiv,
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

/* Sheet layout. The dialog's card is a flex column of a fixed height, so the
   selector takes what the title leaves and hands the grid what the search and
   tabs leave; min-height: 0 is what lets each of them be shorter than its
   content, which is the condition for the grid to scroll instead of the page.
   The search row opts out of v-row's flex: 1 1 auto, which in a column would
   grow it to an equal share of the height. */
.icon-selector--sheet {
  display: flex;
  flex-direction: column;
  flex: 1 1 0;
  min-height: 0;
}
.icon-selector--sheet > .v-row {
  flex: 0 0 auto;
}
.icon-grid--sheet {
  flex: 1 1 0;
  min-height: 0;
}
/* Room for two lines on every tile, so most rows line up whatever the length
   of the names in them, and up to three: a clipped name is the one thing the
   tile is there to show, and a tenth of the military techs need a third line
   at 360px. A word too long for the tile is hyphenated rather than cut. */
.icon-tile-name {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.25;
  min-height: 2.5em;
  overflow-wrap: anywhere;
  hyphens: auto;
}
</style>
