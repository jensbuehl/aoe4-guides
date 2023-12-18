<template>
  <v-overlay
    :attach="'body'"
    :target="pos"
    :scrim="false"
    :style="{ left: `${pos[0]}px`, top: `${pos[1]}px` }"
    absolute
    location-strategy="connected"
    scroll-strategy="reposition"
    v-model="show"
  >
    <v-card style="height: 250px; min-width: 250px; overflow-y: auto"
      ><v-list v-for="icon in searchResults">
        <v-list-item>
          <v-btn
            color="primary"
            variant="text"
            @click="imageSelected(icon.imgSrc, icon.title, icon.class)"
            height="60"
            width="60"
          >
            <v-img style="height: 48px; width: 48px" :src="icon.imgSrc"></v-img>
          </v-btn>
          {{ icon.title }}
        </v-list-item>
      </v-list>
    </v-card>
  </v-overlay>
</template>

<script>
import { watch, ref, computed } from "vue";
import useIconService from "../../composables/builds/useIconService.js";

export default {
  name: "IconAutoCompleteMenu",
  props: ["civ", "searchText", "pos"],
  emits: ["iconSelected"],
  setup(props, context) {
    const { getIcons } = useIconService(props.civ);

    const searchText = ref(props.searchText);
    const pos = ref(props.pos);

    watch(
      () => props.searchText,
      (value, previousValue) => {
        searchText.value = value;
        show.value = value != null;
      }
    );

    watch(
      () => props.pos,
      (value, previousValue) => {
        pos.value = value;
      }
    );

    //unfiltered raw data
    const all = getIcons();

    //update show (show all when only colon, show filtered else)
    const show = ref(false)

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

    const imageSelected = (imgSrc, tooltip, imgClass) => {
      context.emit("iconSelected", imgSrc, tooltip, imgClass);
    };

    return {
      searchResults,
      searchText,
      filter,
      imageSelected,
      pos,
      show,
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
