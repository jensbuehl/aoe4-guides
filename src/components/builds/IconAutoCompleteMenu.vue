<template>
  <v-overlay
    :attach="'body'"
    :target="pos || null"
    :scrim="false"
    :style="{ left: `${pos[0]}px`, top: `${pos[1]}px` }"
    absolute
    :close-on-content-click="true"
    :location-strategy="absoluteLocationStrategy"
    scroll-strategy="none"
    v-model="show"
  >
    <v-card style="max-height: 250px; min-width: 350px; overflow-y: auto"
      ><v-virtual-scroll :items="searchResults" height="250">
        <template #default="{ item, index }">
          <v-list-item
            :key="index"
            :active="index === selectedItemIndex"
            :id="'autocomplete-item-' + index"
            @click="imageSelected(item.imgSrc, item.title, item.class)"
          >
            <v-row align="center" justify="center">
              <v-col cols="auto">
                <v-img
                  v-bind:class="{
                    'icon-landmark-selector': item.class == 'landmark',
                    'icon-tech-selector': item.class == 'tech',
                    'icon-ability-selector': item.class == 'ability',
                    'icon-military-selector': item.class == 'military',
                    'icon-default-selector': item.class == 'default',
                    'icon-none-selector': item.class == 'none',
                    'icon-selector': !item.class,
                  }"
                  :src="item.imgSrc"
                ></v-img
              ></v-col>
              <v-col
                >{{ item.title
                }}<!--The shorthand, so the list teaches what to type next time. Only
                    some icons have one; the rest are found by title.--><span
                  v-if="item.shorthand"
                  class="ac-shorthand"
                  >{{ formatShorthand(item.shorthand) }}</span
                ></v-col
              >
            </v-row>
          </v-list-item>
        </template></v-virtual-scroll
      >
    </v-card>
  </v-overlay>
</template>

<script>
//External
import { watch, ref, computed } from "vue";
import scrollIntoView from "scroll-into-view-if-needed";
import { useEventListener } from "@vueuse/core";

//Component

//Composables
import iconService from "@/composables/builds/icons/iconService.js";
import { rankIcons, formatShorthand } from "@/composables/builds/contentEditableHelper.js";

export default {
  name: "IconAutoCompleteMenu",
  props: ["civ", "searchText", "pos"],
  emits: ["iconSelected"],
  setup(props, context) {
    const searchText = ref(props.searchText);
    const selectedItemIndex = ref(0);

    //unfiltered raw data
    var civIconService = iconService(props.civ);
    var allIcons = civIconService.getIcons();

    useEventListener(document, "keydown", (e) => {
      if (e.code === "ArrowUp" && searchText.value) {
        selectedItemIndex.value = Math.max(0, selectedItemIndex.value - 1);
        var selectedNode = document.getElementById("autocomplete-item-" + selectedItemIndex.value);
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
        var selectedNode = document.getElementById("autocomplete-item-" + selectedItemIndex.value);
        scrollIntoView(selectedNode, {
          scrollMode: "if-needed",
          block: "end",
          inline: "end",
        });
        e.stopPropagation();
        e.preventDefault();
      } else if (
        (e.code === "Enter" || e.code === "Space") &&
        searchText.value &&
        !e.altKey &&
        !e.isComposing
      ) {
        //Space accepts too, and takes the highlighted entry. It used to be left
        //to the field's keyup, which picked its own best match, so an entry
        //reached with the arrow keys was not the one Space inserted.
        //A bare "::" is not a choice, though: Space there is just a space, and
        //nothing goes in. Enter still takes the highlighted entry, as before.
        if (e.code === "Space" && searchText.value == "::") return;
        var icon = searchResults.value[selectedItemIndex.value];
        //No match: the keys do what they normally do.
        if (!icon) return;
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
        civIconService = iconService(value);
        allIcons = civIconService.getIcons();
      }
    );

    //update show (show allIcons when only colon, show filtered else)
    const show = ref(false);

    //filtered data
    const searchResults = computed(() => filter(allIcons));
    //A bare "::" browses everything in list order. Anything typed after it is
    //ranked exactly as Space ranks it; see rankIcons().
    const filter = (unfiltered) => {
      if (!searchText.value) return [];
      if (searchText.value == "::") return unfiltered;
      return rankIcons(unfiltered, searchText.value);
    };

    const imageSelected = (imgSrc, title, imgClass) => {
      context.emit("iconSelected", imgSrc, title, imgClass);
    };

    function absoluteLocationStrategy(data, props, contentStyles) {
      Object.assign(contentStyles.value, {
        position: 'absolute'
      })

      function updateLocation() {
      }

      return { updateLocation }
    }

    return {
      searchResults,
      searchText,
      filter,
      imageSelected,
      show,
      selectedItemIndex,
      absoluteLocationStrategy,
      formatShorthand,
    };
  },
};
</script>
<style>
/* Unscoped like the rest of this block, so the name is prefixed. */
.ac-shorthand {
  margin-left: 8px;
  font-size: 12px;
  opacity: 0.6;
}
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
