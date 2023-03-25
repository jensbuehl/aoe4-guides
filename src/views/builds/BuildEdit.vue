<template>
  <v-container v-if="user && build">
    <v-row class="justify-center">
      <v-col>
        <v-card class="d-flex" height="96" rounded="lg">
          <v-col cols="3" class="pa-0 ma-0">
            <v-img
              v-if="build.civ"
              :src="
                '/' +
                civs.find((item) => {
                  return item.shortName === build.civ;
                }).flagLarge
              "
              :lazy-src="
                '/' +
                civs.find((item) => {
                  return item.shortName === build.civ;
                }).flagSmall
              "
              gradient="to right, transparent, #222222"
              alt="{{build.civ}}"
              cover
            >
              <template v-slot:placeholder>
                <v-row class="fill-height ma-0" align="center" justify="center">
                  <v-progress-circular
                    indeterminate
                    color="grey lighten-5"
                  ></v-progress-circular>
                </v-row>
              </template>
            </v-img>
          </v-col>
          <v-col>
            <v-card-title class="py-0">{{ build.title }}</v-card-title>
            <v-card-text class="mt-0">
              <v-chip-group>
                <v-chip label size="small" disabled
                  >Author: {{ build.author }}</v-chip
                >
                <v-chip v-if="build.timeCreated" label size="small" disabled
                  >Created:
                  {{ build.timeCreated?.toDate().toDateString() }}</v-chip
                >
                <v-chip v-if="build.map" label size="small" disabled>{{
                  build.map
                }}</v-chip>
                <v-chip v-if="build.strategy" label size="small" disabled>{{
                  build.strategy
                }}</v-chip>
              </v-chip-group>
            </v-card-text>
          </v-col>
          <v-card-actions>
            <v-btn prepend-icon="mdi-content-save" @click="handleSave"
              >Save</v-btn
            >
          </v-card-actions>
        </v-card>

        <v-row>
          <v-col>
            <v-card rounded="lg" class="mt-4" fluid fill-height>
              <v-card-title>Title</v-card-title>
              <v-text-field
                rows="4"
                auto-grow
                v-model="build.title"
                :value="build.title"
              ></v-text-field>
            </v-card>
            <v-card rounded="lg" class="mt-4" fluid fill-height>
              <v-card-title>Description</v-card-title>
              <v-textarea
                rows="4"
                auto-grow
                v-model="build.description"
                :value="build.description"
              ></v-textarea>
            </v-card>
            <v-card rounded="lg" class="mt-4">
              <v-card-title>Video</v-card-title>
              <v-text-field
                @input="handleVideoInput($event)"
                :value="build.video"
                v-model="build.video"
              ></v-text-field>
              </v-card
          ></v-col>
          <v-col cols="4">
            <v-card rounded="lg" class="mt-4 pt-6" fill-height>
              <v-list>
                <v-list-item>
                  <v-autocomplete
                    prepend-icon="mdi-filter-variant"
                    label="Civilization"
                    :items="civs"
                    v-model="build.civ"
                    density="compact"
                    item-value="shortName"
                    item-title="title"
                    clearable
                  >
                  </v-autocomplete>
                </v-list-item>
                <v-list-item>
                  <v-autocomplete
                    prepend-icon="mdi-map"
                    label="Map"
                    :items="maps"
                    v-model="build.map"
                    density="compact"
                    item-value="title"
                    item-title="title"
                    clearable
                  >
                  </v-autocomplete>
                </v-list-item>
                <v-list-item>
                  <v-autocomplete
                    prepend-icon="mdi-strategy"
                    label="Strategy"
                    :items="strategies"
                    v-model="build.strategy"
                    density="compact"
                    item-value="title"
                    item-title="title"
                    clearable
                  >
                  </v-autocomplete>
                </v-list-item>
              </v-list> </v-card
          ></v-col>
        </v-row>

        <v-card rounded="lg" class="mt-4">
          <div v-if="!build.steps.length" class="text-center">
            <v-btn
              prepend-icon="mdi-plus"
              variant="plain"
              class="pt-5 pb-10"
              @click="addStep(0)"
              >Add your first build step</v-btn
            >
          </div>
          <v-table
            v-if="build.steps.length"
            style="line-height: 50px"
            class="ma-2"
          >
            <thead>
              <tr>
                <th class="text-center" width="70px">Time</th>
                <th class="text-center" width="70px">Food</th>
                <th class="text-center" width="70px">Wood</th>
                <th class="text-center" width="70px">Gold</th>
                <th class="text-center" width="70px">Stone</th>
                <th class="text-left">Description</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(item, index) in build.steps"
                :key="index"
                @mouseover="selectItem(index)"
                @mouseleave="unSelectItem()"
              >
                <td
                  @focusout="updateStepTime($event, index)"
                  contenteditable="true"
                  class="text-center"
                  v-html="item.time"
                ></td>
                <td
                  @focusout="updateStepFood($event, index)"
                  contenteditable="true"
                  class="text-center"
                  v-html="item.food"
                ></td>
                <td
                  @focusout="updateStepWood($event, index)"
                  contenteditable="true"
                  class="text-center"
                  v-html="item.wood"
                ></td>
                <td
                  @focusout="updateStepGold($event, index)"
                  contenteditable="true"
                  class="text-center"
                  v-html="item.gold"
                ></td>
                <td
                  @focusout="updateStepStone($event, index)"
                  contenteditable="true"
                  class="text-center"
                  v-html="item.stone"
                ></td>
                <td
                  @focusout="updateStepDescription($event, index)"
                  contenteditable="true"
                  class="text-left"
                  v-html="item.description"
                ></td>
                <td width="140" class="text-right">
                  <v-btn
                    v-show="index === hoverRowIndex"
                    variant="plain"
                    @click="removeStep(index)"
                    icon="mdi-delete"
                  ></v-btn>
                  <v-btn
                    v-show="index === hoverRowIndex"
                    variant="plain"
                    @click="addStep(index)"
                    icon="mdi-plus"
                  ></v-btn>
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { ref, computed, onMounted } from "vue";
import { useStore } from "vuex";
import { useRouter } from "vue-router";
import useCollection from "../../composables/useCollection";
import getCivs from "../../composables/getCivs";
import getMaps from "../../composables/getMaps";
import getStrategies from "../../composables/getStrategies";

export default {
  name: "BuildEdit",
  props: ["id"],
  setup(props) {
    const store = useStore();
    const router = useRouter();
    const user = computed(() => store.state.user);
    const civs = getCivs().civs;
    const maps = getMaps().maps;
    const strategies = getStrategies().strategies;
    const build = ref(null);
    const { get, update, error } = useCollection("builds");
    onMounted(async () => {
      const res = await get(props.id);
      window.scrollTo(0, 0);
      build.value = res;
    });

    const handleSave = async () => {
      build.value.sortTitle = build.value.title.toLowerCase();
      await update(props.id, build.value);
      if (!error.value) {
        router.push("/builds/" + props.id);
      }
    };

    const updateStepTime = (event, index) => {
      build.value.steps[index].time = event.target.innerHTML;
    };
    const updateStepFood = (event, index) => {
      build.value.steps[index].food = event.target.innerHTML;
    };
    const updateStepWood = (event, index) => {
      build.value.steps[index].wood = event.target.innerHTML;
    };
    const updateStepGold = (event, index) => {
      build.value.steps[index].gold = event.target.innerHTML;
    };
    const updateStepStone = (event, index) => {
      build.value.steps[index].stone = event.target.innerHTML;
    };
    const updateStepDescription = (event, index) => {
      build.value.steps[index].description = event.target.innerHTML;
    };
    const addStep = (index) => {
      build.value.steps.splice(++index, 0, {
        time: "",
        food: "",
        wood: "",
        gold: "",
        stone: "",
        description: "",
      });
    };
    const removeStep = (index) => {
      build.value.steps.splice(index, 1);
    };
    const handleVideoInput = () => {
      build.value.video = build.value.video.replace(/watch\?v=/, "embed/");
    };

    return {
      build,
      user,
      civs,
      maps,
      strategies,
      handleSave,
      handleVideoInput,
      updateStepDescription,
      updateStepStone,
      updateStepGold,
      updateStepWood,
      updateStepFood,
      updateStepTime,
      removeStep,
      addStep,
    };
  },
  data() {
    return {
      hoverRowIndex: null,
    };
  },
  methods: {
    selectItem(index) {
      this.hoverRowIndex = index;
    },
    unSelectItem() {
      this.hoverRowIndex = null;
    },
  },
};
</script>
