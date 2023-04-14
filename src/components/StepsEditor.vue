<template>
  <v-card rounded="lg" class="mt-4">
    <v-card-title>Build Order</v-card-title>
    <div v-if="!steps?.length && !readonly" class="text-center">
      <v-btn
        variant="text"
        color="primary"
        prepend-icon="mdi-plus"
        class="pt-5 pb-10"
        @click="addStep(0)"
        >Add your first build step</v-btn
      >
    </div>
    <v-table v-if="steps?.length" class="ma-4">
      <thead>
        <tr>
          <th class="text-center ma-0 pa-0" width="50px">
            <v-img
              class="mx-auto"
              width="32"
              src="/assets/resources/time.png"
            ></v-img>
          </th>
          <v-tooltip location="top" text="Aggregated Villager Count">
            <template v-slot:activator="{ props }">
              <th v-bind="props" class="text-center ma-0 pa-0" width="50px">
                <v-img
                  class="mx-auto"
                  width="32"
                  src="/assets/resources/villager.png"
                ></v-img>
              </th>
            </template>
          </v-tooltip>
          <th class="text-center ma-0 pa-0" width="50px">
            <v-img
              class="mx-auto"
              width="32"
              src="/assets/resources/repair.png"
            ></v-img>
          </th>
          <th class="text-center ma-0 pa-0" width="50px">
            <v-img
              class="mx-auto"
              width="42"
              src="/assets/resources/food.png"
            ></v-img>
          </th>
          <th class="text-center ma-0 pa-0" width="50px">
            <v-img
              class="mx-auto"
              width="42"
              src="/assets/resources/wood.png"
            ></v-img>
          </th>
          <th class="text-center ma-0 pa-0" width="50px">
            <v-img
              class="mx-auto"
              width="42"
              src="/assets/resources/gold.png"
            ></v-img>
          </th>
          <th class="text-center ma-0 pa-0" width="50px">
            <v-img
              class="mx-auto"
              width="42"
              src="/assets/resources/stone.png"
            ></v-img>
          </th>
          <th class="text-left hidden-sm-and-down">Description</th>
          <th class="text-left hidden-md-and-up" width="100%">Description</th>
          <th v-if="!readonly" class="text-right hidden-sm-and-down">
            <v-menu :close-on-content-click="false" location="bottom">
              <template v-slot:activator="{ props }">
                <v-btn class="mr-n4"
                  prepend-icon="mdi-image-plus"
                  color="primary"
                  variant="text"
                  v-bind="props"
                  append-icon="mdi-menu-down"
                  >Add Icon</v-btn
                >
              </template>
              <v-card rounded="lg" class="mt-4" width="350px">
                <IconSelector
                  @iconSelected="(iconPath) => handleIconSelected(iconPath)"
                  :civ="civ"
                ></IconSelector>
              </v-card>
            </v-menu>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(item, index) in steps"
          :key="index"
          v-on:keyup.enter.alt="addStep(index)"
          v-on:keyup.delete.alt="removeStep(index)"
          @mouseover="selectItem(index)"
          @mouseleave="unSelectItem()"
        >
          <td
            @paste="handlePaste"
            @focusout="updateStepTime($event, index)"
            :contenteditable="!readonly"
            class="text-center"
            v-html="item.time"
          ></td>
          <td
            class="text-center"
            disabled
            v-html="item.villagers ? item.villagers : aggregateVillagers(index)"
          ></td>
          <td
            @paste="handlePaste"
            @focusout="updateStepBuilders($event, index)"
            :contenteditable="!readonly"
            class="text-center"
            v-html="item.builders ? item.builders : ''"
          ></td>
          <td
            @paste="handlePaste"
            @focusout="updateStepFood($event, index)"
            :contenteditable="!readonly"
            class="text-center"
            v-html="item.food"
          ></td>
          <td
            @paste="handlePaste"
            @focusout="updateStepWood($event, index)"
            :contenteditable="!readonly"
            class="text-center"
            v-html="item.wood"
          ></td>
          <td
            @paste="handlePaste"
            @focusout="updateStepGold($event, index)"
            :contenteditable="!readonly"
            class="text-center"
            v-html="item.gold"
          ></td>
          <td
            @paste="handlePaste"
            @focusout="updateStepStone($event, index)"
            :contenteditable="!readonly"
            class="text-center"
            v-html="item.stone"
          ></td>
          <td
            @mouseleave="saveSelection"
            @paste="handlePaste"
            @focusout="updateStepDescription($event, index)"
            :contenteditable="!readonly"
            class="text-left"
            v-html="item.description"
          ></td>
          <td
            v-if="!readonly"
            width="180"
            class="text-right hidden-sm-and-down"
          >
            <v-tooltip location="top" text="Remove current step (ALT + DEL)">
              <template v-slot:activator="{ props }">
                <v-btn
                  v-bind="props"
                  v-if="index === hoverRowIndex"
                  variant="plain"
                  color="primary"
                  @click="removeStep(index)"
                  icon="mdi-delete"
                >
                </v-btn>
              </template>
            </v-tooltip>

            <v-tooltip location="top" text="Add new step below (ALT + ENTER)">
              <template v-slot:activator="{ props }">
                <v-btn
                  v-bind="props"
                  v-show="index === hoverRowIndex"
                  variant="plain"
                  color="primary"
                  @click="addStep(index)"
                  icon="mdi-plus"
                >
                </v-btn>
              </template>
            </v-tooltip>
          </td>
        </tr>
      </tbody>
    </v-table>
  </v-card>
</template>

<script>
import { ref } from "vue";
import sanitizeHtml from "sanitize-html";
import IconSelector from "../components/IconSelector.vue";

export default {
  name: "StepsEditor",
  props: ["steps", "readonly", "civ"],
  emits: ["stepsChanged"],
  components: { IconSelector },
  setup(props, context) {
    const steps = ref(props.steps);
    //Hacky deep copy of object since working on the reference broke the current selection
    const stepsCopy = ref(JSON.parse(JSON.stringify(props.steps)));
    const readonly = props.readonly;
    const civ = ref(props.civ);
    const hoverRowIndex = ref(null);
    const selection = ref(null);

    const saveSelection = () => {
      if (window.getSelection) {
        var sel = window.getSelection();
        if (sel.getRangeAt && sel.rangeCount) {
          selection.value = sel.getRangeAt(0);
        }
      } else if (document.selection && document.selection.createRange) {
        selection.value = document.selection.createRange();
      }
    };

    const restoreSelection = () => {
      if (selection.value) {
        if (window.getSelection) {
          var sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(selection.value);
        } else if (document.selection && selection.value.select) {
          selection.value.select();
        }
      }
    };

    const handleIconSelected = (iconPath) => {
      console.log(iconPath);
      restoreSelection();
      const img = '<img src="' + iconPath + '" class="icon"></img>';
      document.execCommand("insertHTML", false, img);
    };

    const aggregateVillagers = (index) => {
      const step = steps.value[index];
      const builders = parseInt(step.builders) || 0;
      const food = parseInt(step.food) || 0;
      const wood = parseInt(step.wood) || 0;
      const gold = parseInt(step.gold) || 0;
      const stone = parseInt(step.stone) || 0;

      step.villagers = builders + food + wood + gold + stone;
    };
    const updateStepTime = (event, index) => {
      steps.value[index].time = event.target.innerHTML;
    };
    const updateStepBuilders = (event, index) => {
      steps.value[index].builders = event.target.innerHTML;
      aggregateVillagers(index);
    };
    const updateStepFood = (event, index) => {
      steps.value[index].food = event.target.innerHTML;
      aggregateVillagers(index);
    };
    const updateStepWood = (event, index) => {
      steps.value[index].wood = event.target.innerHTML;
      aggregateVillagers(index);
    };
    const updateStepGold = (event, index) => {
      steps.value[index].gold = event.target.innerHTML;
      aggregateVillagers(index);
    };
    const updateStepStone = (event, index) => {
      steps.value[index].stone = event.target.innerHTML;
      aggregateVillagers(index);
    };
    const updateStepDescription = (event, index) => {
      console.log(event.target.innerHTML);
      stepsCopy.value[index].description = event.target.innerHTML;
      context.emit("stepsChanged", stepsCopy.value);
    };
    const addStep = (index) => {
      steps.value.splice(++index, 0, {
        time: "",
        villagers: "",
        builders: "",
        food: "",
        wood: "",
        gold: "",
        stone: "",
        description: "",
      });
      stepsCopy.value.splice(++index, 0, {
        time: "",
        villagers: "",
        builders: "",
        food: "",
        wood: "",
        gold: "",
        stone: "",
        description: "",
      });
    };
    const removeStep = (index) => {
      steps.value.splice(index, 1);
      stepsCopy.value.splice(index, 1);
    };
    const selectItem = (index) => {
      hoverRowIndex.value = index;
    };
    const unSelectItem = () => {
      hoverRowIndex.value = null;
    };
    const handlePaste = async (e) => {
      const dirty = e.clipboardData.getData("text/html");
      const clean = sanitizeHtml(dirty, {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img"]),
        allowedClasses: {
          img: ["icon"],
        },
        allowedAttributes: {
          img: ["style", "class", "src"],
        },
        allowedStyles: {
          "*": {
            "vertical-align": [/^middle$/],
          },
        },
      });

      document.execCommand("insertHTML", false, clean);
      e.stopPropagation();
      e.preventDefault();
    };

    return {
      steps,
      stepsCopy,
      civ,
      readonly,
      hoverRowIndex,
      sanitizeHtml,
      selection,
      handlePaste,
      aggregateVillagers,
      updateStepDescription,
      updateStepStone,
      updateStepGold,
      updateStepWood,
      updateStepFood,
      updateStepBuilders,
      updateStepTime,
      removeStep,
      addStep,
      selectItem,
      unSelectItem,
      saveSelection,
      restoreSelection,
      handleIconSelected,
    };
  },
};
</script>

<style>
table tbody tr td:nth-child(2) {
  color: #828282;
}

table tbody tr td:nth-child(3) {
  background: #5b5b5b69;
}

table tbody tr td:nth-child(4) {
  background: #ff000034;
}

table tbody tr td:nth-child(5) {
  background: #75400c5b;
}

table tbody tr td:nth-child(6) {
  background: #edbe003e;
}

table tbody tr td:nth-child(7) {
  background: #7a7a7b69;
}

td:empty {
  line-height: 50px;
}

.icon {
  cursor: move;
  vertical-align: middle;
  height: auto;
  width: 42px;
}
</style>
