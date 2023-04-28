<template>
  <!--Common delete confirmation dialog)-->
  <v-dialog v-model="dialog" width="auto">
    <v-card rounded="lg" class="text-center primary">
      <v-card-title>Delete Comment</v-card-title>
      <v-card-text>
        Do you really want to delete this build step?<br />
        The action cannot be undone.
      </v-card-text>
      <v-card-actions>
        <v-btn color="error" block @click="removeStep(delteRowIndex)">Delete</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
  <!--Mobile UI (XS)-->
  <v-card rounded="lg" class="mt-4 hidden-sm-and-up">
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
    <v-row v-if="steps?.length" no-gutters align="center" justify="center">
      <v-col cols="12">
        <v-row no-gutters align="center" justify="center">
          <v-col cols="2">
            <v-container class="pa-6">
              <v-row align="center" justify="center">
                <v-img
                  class="titleIconSmaller"
                  src="/assets/resources/time.png"
                ></v-img>
              </v-row>
            </v-container>
          </v-col>
          <v-col>
            <v-container>
              <v-row align="center" justify="center">
                <v-img
                  class="titleIcon"
                  src="/assets/resources/villager.png"
                ></v-img>
              </v-row>
            </v-container>
          </v-col>
          <v-col>
            <v-container>
              <v-row align="center" justify="center">
                <v-img
                  class="titleIcon"
                  src="/assets/resources/repair.png"
                ></v-img>
              </v-row>
            </v-container>
          </v-col>
          <v-col>
            <v-container>
              <v-row align="center" justify="center">
                <v-img
                  class="titleIcon"
                  src="/assets/resources/food.png"
                ></v-img>
              </v-row>
            </v-container>
          </v-col>
          <v-col>
            <v-container>
              <v-row align="center" justify="center">
                <v-img
                  class="titleIcon"
                  src="/assets/resources/wood.png"
                ></v-img>
              </v-row>
            </v-container>
          </v-col>
          <v-col>
            <v-container>
              <v-row align="center" justify="center">
                <v-img
                  class="titleIcon"
                  src="/assets/resources/gold.png"
                ></v-img>
              </v-row>
            </v-container>
          </v-col>
          <v-col>
            <v-card variant="flat" height="50"
              ><v-container>
                <v-row align="center" justify="center">
                  <v-img
                    class="titleIcon"
                    src="/assets/resources/stone.png"
                  ></v-img>
                </v-row>
              </v-container>
            </v-card>
          </v-col>
        </v-row>
      </v-col>
      <v-col cols="9" class="hidden-sm-and-down">
        <v-card variant="flat" height="50">Description</v-card>
      </v-col>
      <v-col v-if="!readonly" cols="12">
        <v-card variant="flat" height="50"
          ><div v-if="!readonly" class="text-right pr-4">
            <v-menu
              v-if="selection"
              :close-on-content-click="false"
              location="bottom"
            >
              <template v-slot:activator="{ props }">
                <v-btn
                  class="mr-n4"
                  prepend-icon="mdi-image-plus"
                  color="primary"
                  v-bind="props"
                  variant="text"
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
            </v-menu></div
        ></v-card>
      </v-col>
    </v-row>
    <v-row
      no-gutters
      justify="center"
      v-for="(item, index) in steps"
      :key="index"
      v-on:keyup.enter.alt="addStep(index)"
      v-on:keyup.delete.alt="dialog = true; delteRowIndex = index; delteRowIndex = index"
      @mouseover="selectItem(index)"
      @mouseleave="unSelectItem()"
    >
      <v-divider></v-divider>
      <v-col cols="12">
        <v-row no-gutters justify="center">
          <v-col cols="2">
            <v-card variant="flat" rounded="0"
              ><v-card-text
                @paste="handlePaste"
                @focusout="updateStepTime($event, index)"
                :contenteditable="!readonly"
                class="text-center"
                v-html="item.time"
              ></v-card-text
            ></v-card>
          </v-col>
          <v-col>
            <v-card align="center" variant="flat" rounded="0"
              ><v-card-text
                class="text-center villager"
                disabled
                v-html="
                  item.villagers ? item.villagers : aggregateVillagers(index)
                "
              ></v-card-text
            ></v-card>
          </v-col>
          <v-col>
            <v-card variant="flat" rounded="0" class="fill-height"
              ><v-card-text
                @paste="handlePaste"
                @focusout="updateStepBuilders($event, index)"
                :contenteditable="!readonly"
                class="text-center"
                v-html="item.builders ? item.builders : ''"
              ></v-card-text
            ></v-card>
          </v-col>
          <v-col>
            <v-card
              variant="flat"
              rounded="0"
              class="fill-height"
              style="background-color: #ff000034"
              ><v-card-text
                @paste="handlePaste"
                @focusout="updateStepFood($event, index)"
                :contenteditable="!readonly"
                class="text-center"
                v-html="item.food"
              ></v-card-text
            ></v-card>
          </v-col>
          <v-col>
            <v-card
              variant="flat"
              rounded="0"
              class="fill-height"
              style="background-color: #75400c5b"
              ><v-card-text
                @paste="handlePaste"
                @focusout="updateStepWood($event, index)"
                :contenteditable="!readonly"
                class="text-center"
                v-html="item.wood"
              ></v-card-text
            ></v-card>
          </v-col>
          <v-col>
            <v-card
              variant="flat"
              rounded="0"
              class="fill-height"
              style="background-color: #edbe003e"
              ><v-card-text
                @paste="handlePaste"
                @focusout="updateStepGold($event, index)"
                :contenteditable="!readonly"
                class="text-center"
                v-html="item.gold"
              ></v-card-text
            ></v-card>
          </v-col>
          <v-col>
            <v-card
              variant="flat"
              rounded="0"
              class="fill-height"
              style="background-color: #7a7a7b69"
              ><v-card-text
                @paste="handlePaste"
                @focusout="updateStepStone($event, index)"
                :contenteditable="!readonly"
                class="text-center"
                v-html="item.stone"
              ></v-card-text
            ></v-card>
          </v-col>
        </v-row>
      </v-col>
      <v-divider></v-divider>
      <v-col v-if="readonly" cols="12">
        <v-card variant="flat" rounded="0" class="my-2 mx-2">
          <v-table width="100%">
            <tbody>
              <tr>
                <td
                  @keyup="saveSelection"
                  @click="saveSelection"
                  @paste="handlePaste"
                  @focusout="updateStepDescription($event, index)"
                  :contenteditable="!readonly"
                  class="text-left py-1"
                  v-html="item.description"
                ></td>
              </tr>
            </tbody> </v-table
        ></v-card>
      </v-col>
      <v-col v-if="!readonly" cols="8">
        <v-card variant="flat" rounded="0" class="my-2 mx-2">
          <v-table width="100%">
            <tbody>
              <tr>
                <td
                  @keyup="saveSelection"
                  @click="saveSelection"
                  @paste="handlePaste"
                  @focusout="updateStepDescription($event, index)"
                  :contenteditable="!readonly"
                  class="text-left py-1"
                  v-html="item.description"
                ></td>
              </tr>
            </tbody> </v-table
        ></v-card>
      </v-col>
      <v-col v-if="!readonly" cols="4">
        <v-card variant="flat" class="my-2">
          <div class="text-right">
            <v-tooltip location="top" text="Remove current step (ALT + DEL)">
              <template v-slot:activator="{ props }">
                <v-btn
                  v-bind="props"
                  v-if="index === hoverRowIndex"
                  variant="plain"
                  color="primary"
                  @click="dialog = true; delteRowIndex = index"
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
            </v-tooltip></div
        ></v-card>
      </v-col>
    </v-row>
  </v-card>
  <!--Desktop UI-->
  <v-card rounded="lg" class="mt-4 hidden-xs">
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
              class="mx-auto titleIconSmaller"
              src="/assets/resources/time.png"
            ></v-img>
          </th>
          <v-tooltip location="top" text="Aggregated Villager Count">
            <template v-slot:activator="{ props }">
              <th v-bind="props" class="text-center ma-0 pa-0" width="56px">
                <v-img
                  class="mx-auto titleIcon"
                  src="/assets/resources/villager.png"
                ></v-img>
              </th>
            </template>
          </v-tooltip>
          <th class="text-center ma-0 pa-0" width="56px">
            <v-img
              class="mx-auto titleIcon"
              src="/assets/resources/repair.png"
            ></v-img>
          </th>
          <th class="text-center ma-0 pa-0" width="50px">
            <v-img
              class="mx-auto titleIcon"
              src="/assets/resources/food.png"
            ></v-img>
          </th>
          <th class="text-center ma-0 pa-0" width="50px">
            <v-img
              class="mx-auto titleIcon"
              src="/assets/resources/wood.png"
            ></v-img>
          </th>
          <th class="text-center ma-0 pa-0" width="50px">
            <v-img
              class="mx-auto titleIcon"
              src="/assets/resources/gold.png"
            ></v-img>
          </th>
          <th class="text-center ma-0 pa-0" width="50px">
            <v-img
              class="mx-auto titleIcon"
              src="/assets/resources/stone.png"
            ></v-img>
          </th>
          <th class="text-left hidden">Description</th>
          <th v-if="!readonly" class="text-right">
            <v-menu
              v-if="selection"
              :close-on-content-click="false"
              location="bottom"
            >
              <template v-slot:activator="{ props }">
                <v-btn
                  class="mr-n4"
                  prepend-icon="mdi-image-plus"
                  color="primary"
                  v-bind="props"
                  variant="text"
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
      <tbody ref="stepsTable">
        <tr
          v-for="(item, index) in steps"
          :key="index"
          v-on:keyup.enter.alt="addStep(index)"
          v-on:keyup.delete.alt="dialog = true; delteRowIndex = index"
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
            @keyup="saveSelection"
            @click="saveSelection"
            @paste="handlePaste"
            @focusout="updateStepDescription($event, index)"
            :contenteditable="!readonly"
            class="text-left py-1"
            v-html="item.description"
          ></td>
          <td v-if="!readonly" width="180" class="text-right">
            <v-tooltip location="top" text="Remove current step (ALT + DEL)">
              <template v-slot:activator="{ props }">
                <v-btn
                  v-bind="props"
                  v-if="index === hoverRowIndex"
                  variant="plain"
                  color="primary"
                  @click="dialog = true; delteRowIndex = index"
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
import { ref, computed, reactive } from "vue";
import sanitizeHtml from "sanitize-html";
import IconSelector from "../components/IconSelector.vue";

export default {
  name: "StepsEditor",
  props: ["steps", "readonly", "civ"],
  emits: ["stepsChanged"],
  components: { IconSelector },
  setup(props, context) {
    //Hacky deep copy of object since working on the reference broke the current selection
    //Copy needs to be kepts in sync and is used only for the description field :(
    const steps = reactive(JSON.parse(JSON.stringify(props.steps)));
    const stepsCopy = reactive(JSON.parse(JSON.stringify(props.steps)));
    const readonly = props.readonly;
    const hoverRowIndex = ref(null);
    const delteRowIndex = ref(null)
    const selection = ref(null);
    const stepsTable = ref(null);
    const dialog = ref(false);

    const civ = computed(() => {
      return props.civ;
    });

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
      restoreSelection();
      const img = '<img src="' + iconPath + '" class="icon"><\/img>';
      document.execCommand("insertHTML", false, img);
      saveSelection();
    };

    const aggregateVillagers = (index) => {
      const step = steps[index];
      const builders = parseInt(step.builders) || 0;
      const food = parseInt(step.food) || 0;
      const wood = parseInt(step.wood) || 0;
      const gold = parseInt(step.gold) || 0;
      const stone = parseInt(step.stone) || 0;

      step.villagers = builders + food + wood + gold + stone;
    };
    const updateStepTime = (event, index) => {
      steps[index].time = event.target.innerHTML;
      stepsCopy[index].time = event.target.innerHTML;

      context.emit("stepsChanged", steps);
    };
    const updateStepBuilders = (event, index) => {
      steps[index].builders = event.target.innerHTML;
      stepsCopy[index].builders = event.target.innerHTML;

      aggregateVillagers(index);
      context.emit("stepsChanged", steps);
    };
    const updateStepFood = (event, index) => {
      steps[index].food = event.target.innerHTML;
      stepsCopy[index].food = event.target.innerHTML;

      aggregateVillagers(index);
      context.emit("stepsChanged", steps);
    };
    const updateStepWood = (event, index) => {
      steps[index].wood = event.target.innerHTML;
      stepsCopy[index].wood = event.target.innerHTML;

      aggregateVillagers(index);
      context.emit("stepsChanged", steps);
    };
    const updateStepGold = (event, index) => {
      steps[index].gold = event.target.innerHTML;
      stepsCopy[index].gold = event.target.innerHTML;

      aggregateVillagers(index);
      context.emit("stepsChanged", steps);
    };
    const updateStepStone = (event, index) => {
      steps[index].stone = event.target.innerHTML;
      stepsCopy[index].stone = event.target.innerHTML;

      aggregateVillagers(index);
      context.emit("stepsChanged", steps);
    };
    const updateStepDescription = (event, index) => {
      stepsCopy[index].description = event.target.innerHTML;
      context.emit("stepsChanged", stepsCopy);
    };
    const addStep = (index) => {
      var table = stepsTable.value;
      if (table) {
        //Pull display text into model
        for (var i = 0, row; (row = table.rows[i]); i++) {
          steps[i].description = row.cells[7].innerHTML;
        }
      }

      //Add row
      const addIndex = index + 1;
      stepsCopy.splice(addIndex, 0, {
        time: "",
        villagers: "",
        builders: "",
        food: "",
        wood: "",
        gold: "",
        stone: "",
        description: "",
      });
      steps.splice(addIndex, 0, {
        time: "",
        villagers: "",
        builders: "",
        food: "",
        wood: "",
        gold: "",
        stone: "",
        description: "",
      });

      if (table) {
        //Sync display text again with model
        for (var i = 0, row; (row = table.rows[i]); i++) {
          row.cells[7].innerHTML = steps[i].description;
        }
      }
      context.emit("stepsChanged", steps);
    };

    const removeStep = (currentIndex) => {
      var table = stepsTable.value;
      if (table) {
        //Pull display text into model
        for (var i = 0, row; (row = table.rows[i]); i++) {
          steps[i].description = row.cells[7].innerHTML;
        }
      }

      //remove row
      stepsCopy.splice(currentIndex, 1);
      steps.splice(currentIndex, 1);

      context.emit("stepsChanged", steps);
      dialog.value = false;
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
      stepsCopy,
      steps,
      stepsTable,
      civ,
      readonly,
      hoverRowIndex,
      sanitizeHtml,
      selection,
      delteRowIndex,
      dialog,
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

.villager {
  color: #828282;
}

td:empty {
  line-height: 44px;
}

.tablecell {
  height: 50px;
  vertical-align: middle;
  display: table-cell;
  align-items: center;
}

.icon {
  vertical-align: middle;
  height: auto;
  width: 42px;
}
.titleIcon {
  vertical-align: middle;
  width: auto;
  height: 40px;
}
.titleIconSmaller {
  vertical-align: middle;
  width: auto;
  height: 24px;
}
</style>
