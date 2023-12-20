<template>
  <v-overlay
    :attach="'body'"
    :target="pos"
    :scrim="false"
    :style="{ left: `${pos[0]}px`, top: `${pos[1]}px` }"
    absolute
    :close-on-content-click="true"
    location-strategy="connected"
    scroll-strategy="reposition"
    v-model="show"
  >
    <v-card style="max-height: 250px; min-width: 350px; overflow-y: auto"
      ><v-list>
        <v-list-item
          v-for="(icon, index) in searchResults"
          :key="index"
          :active="index === selectedItemIndex"
          :id="'autocomplete-item-' + index"

        >
          <v-row align="center" justify="center">
            <v-col cols="auto">
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
                :src="icon.imgSrc"
              ></v-img
            ></v-col>
            <v-col>{{ icon.title }}</v-col>
          </v-row>
        </v-list-item>
      </v-list>
    </v-card>
  </v-overlay>
</template>

<script>
import { watch, ref, computed } from "vue";
import useIconService from "../../composables/builds/useIconService.js";
import scrollIntoView from "scroll-into-view-if-needed";

export default {
  name: "IconAutoCompleteMenu",
  props: ["civ", "searchText", "pos"],
  emits: ["iconSelected"],
  setup(props, context) {
    const searchText = ref(props.searchText);
    const pos = ref(props.pos);
    const selectedItemIndex = ref(0);

    //unfiltered raw data
    var iconService = useIconService(props.civ);
    var all = iconService.getIcons();

    document.addEventListener("keydown", (e) => {
      if (e.code === "ArrowUp" && searchText.value) {
        selectedItemIndex.value = Math.max(0, selectedItemIndex.value - 1);
        var selectedNode = document.getElementById(
          "autocomplete-item-" + selectedItemIndex.value
        );
        scrollIntoView(selectedNode, {
          scrollMode: "if-needed",
          block: "start",
          inline: "start",
        });
        e.stopPropagation();
        e.preventDefault();
      } else if (e.code === "ArrowDown" && searchText.value) {
        selectedItemIndex.value = Math.min(
          searchResults.value.length - 1,
          selectedItemIndex.value + 1
        );
        var selectedNode = document.getElementById(
          "autocomplete-item-" + selectedItemIndex.value
        );
        scrollIntoView(selectedNode, {
          scrollMode: "if-needed",
          block: "end",
          inline: "end",
        });
        e.stopPropagation();
        e.preventDefault();
      } else if (e.code === "Enter" && searchText.value) {
        var icon = searchResults.value[selectedItemIndex.value];
        context.emit("iconSelected", icon.imgSrc, icon.title, icon.class);
        e.stopPropagation();
        e.preventDefault();
      }
    });

    watch(
      () => props.searchText,
      (value, previousValue) => {
        searchText.value = value;
        selectedItemIndex.value = 0;
        show.value = value != null;
      }
    );

    watch(
      () => props.civ,
      (value, previousValue) => {
        iconService = useIconService(value);
        all = iconService.getIcons();
      }
    );

    watch(
      () => props.pos,
      (value, previousValue) => {
        pos.value = value;
      }
    );

    //update show (show all when only colon, show filtered else)
    const show = ref(false);

    //filtered data
    const searchResults = computed(() => filter(all));
    const filter = (unfiltered) => {
      return unfiltered.filter((item) => {
        if (!searchText.value) return false;
        if (searchText.value == ":") return true;
        var elementFound = false;
        //Search by shorthand first
        if (Array.isArray(item.shorthand)) {
          elementFound =
            -1 !=
            item.shorthand.findIndex((element) =>
              element.startsWith(searchText.value)
            );
        } else {
          elementFound = item.shorthand?.startsWith(searchText.value);
        }
        //Search by title second
        if (!elementFound) {
          var title = item.title.replace(/ +/g, "").toLowerCase();
          elementFound = title.includes(searchText.value);
        }
        return elementFound;
      });
    };

    const imageSelected = (imgSrc, title, imgClass) => {
      context.emit("iconSelected", imgSrc, title, imgClass);
    };

    return {
      searchResults,
      searchText,
      filter,
      imageSelected,
      pos,
      show,
      selectedItemIndex,
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
