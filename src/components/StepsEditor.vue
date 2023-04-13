<template>
  <v-card rounded="lg" class="mt-4">
    <v-card-title>Build Order</v-card-title>
    <div v-if="!steps.length && !readonly" class="text-center">
      <v-btn
        variant="text"
        color="primary"
        prepend-icon="mdi-plus"
        class="pt-5 pb-10"
        @click="addStep(0)"
        >Add your first build step</v-btn
      >
    </div>
    <v-table v-if="steps.length" class="ma-2">
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
          <th v-if="!readonly" class="text-right hidden-sm-and-down"></th>
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
            @focusout="updateStepTime($event, index)"
            :contenteditable="!readonly"
            class="text-center"
            v-html="item.time"
          ></td>
          <td
            :contenteditable="!readonly"
            class="text-center"
            disabled
            v-html="item.villagers ? item.villagers : aggregateVillagers(index)"
          ></td>
          <td
            @focusout="updateStepBuilders($event, index)"
            :contenteditable="!readonly"
            class="text-center"
            v-html="item.builders ? item.builders : ''"
          ></td>
          <td
            @focusout="updateStepFood($event, index)"
            :contenteditable="!readonly"
            class="text-center"
            v-html="item.food"
          ></td>
          <td
            @focusout="updateStepWood($event, index)"
            :contenteditable="!readonly"
            class="text-center"
            v-html="item.wood"
          ></td>
          <td
            @focusout="updateStepGold($event, index)"
            :contenteditable="!readonly"
            class="text-center"
            v-html="item.gold"
          ></td>
          <td
            @focusout="updateStepStone($event, index)"
            :contenteditable="!readonly"
            class="text-center"
            v-html="item.stone"
          ></td>
          <td
            @paste="handlePaste"
            @focusout="updateStepDescription($event, index)"
            :contenteditable="!readonly"
            class="text-left"
            v-html="item.description"
          ></td>
          <td
            v-if="!readonly"
            width="140"
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

export default {
  name: "StepsEditor",
  props: ["steps", "readonly"],
  setup(props) {
    const steps = ref(props.steps);
    const readonly = props.readonly;
    const hoverRowIndex = ref(null);

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
      steps.value[index].description = event.target.innerHTML;
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
    };
    const removeStep = (index) => {
      steps.value.splice(index, 1);
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
      console.log(dirty);
      console.log(clean);

      //sanitize HTML
      //steps.value[0].description = clean;
      document.execCommand("insertHTML", false, clean);

      e.stopPropagation();
      e.preventDefault();
    };

    return {
      steps,
      readonly,
      hoverRowIndex,
      sanitizeHtml,
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
    };
  },
};
</script>

<style scoped>
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
}
</style>
