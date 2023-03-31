<template>
  <v-container v-if="!user && authIsReady">
    <v-card class="d-flex" height="96" rounded="lg">
      <v-row class="justify-center align-center">
        <v-card-title
          >Please login to create and share your own build orders.</v-card-title
        >
      </v-row>
    </v-card>
  </v-container>
  <v-container v-if="user">
    <v-row class="justify-center">
      <v-col>
        <v-card class="d-flex align-center" rounded="lg">
          <v-col v-if="build.civ" cols="3" class="pa-0 ma-0">
            <v-img
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
            <v-card-title>{{ build.title }}</v-card-title>
          </v-col>
          <v-card-actions class="hidden-sm-and-down">
            <v-btn
              variant="text"
              color="primary"
              prepend-icon="mdi-content-save"
              @click="handleSubmit"
              >Save</v-btn
            >
          </v-card-actions>
        </v-card>

        <v-row>
          <v-col cols="12" md="8">
            <v-card rounded="lg" class="mt-4" fluid fill-height>
              <v-text-field
                class="pa-4"
                label="Title"
                v-model="build.title"
                :value="build.title"
              ></v-text-field>

              <v-textarea
                label="Description"
                class="pa-4"
                rows="1"
                auto-grow
                v-model="build.description"
                :value="build.description"
              ></v-textarea>

              <v-text-field
                label="Video"
                class="pa-4"
                @input="handleVideoInput($event)"
                :value="build.video"
                v-model="build.video"
              ></v-text-field> </v-card
          ></v-col>
          <v-col cols="12" md="4">
            <v-card rounded="lg" class="mt-n2 mt-md-4 ml-md-n2">
              <v-card-text>
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
              </v-card-text> </v-card
          ></v-col>
        </v-row>

        <v-card rounded="lg" class="mt-4">
          <div v-if="!build.steps.length" class="text-center">
            <v-btn
              variant="text"
              color="primary"
              prepend-icon="mdi-plus"
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
                <th class="text-center ma-0 pa-0" width="50px">
                  <v-img
                    class="mx-auto"
                    width="42"
                    src="/assets/resources/time.png"
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
                <th class="text-right hidden-sm-and-down"></th>
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
                <td width="140" class="text-right hidden-sm-and-down">
                  <v-btn
                    v-show="index === hoverRowIndex"
                    variant="plain"
                    color="primary"
                    @click="removeStep(index)"
                    icon="mdi-delete"
                  ></v-btn>
                  <v-btn
                    v-show="index === hoverRowIndex"
                    variant="plain"
                    color="primary"
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
import { ref, computed, watch } from "vue";
import { useStore } from "vuex";
import { useRouter } from "vue-router";
import getCivs from "../../composables/getCivs";
import getSeasons from "../../composables/getMaps";
import useCollection from "../../composables/useCollection";
import getMaps from "../../composables/getMaps";
import getStrategies from "../../composables/getStrategies";

export default {
  name: "BuildNew",
  setup() {
    window.scrollTo(0, 0);

    const { add, error } = useCollection("builds");
    const civs = getCivs().civs;
    const maps = getMaps().maps;
    const strategies = getStrategies().strategies;
    const seasons = getSeasons().seasons;
    const store = useStore();
    const user = computed(() => store.state.user);
    const router = useRouter();

    const build = ref({
      author: "",
      authorUid: "",
      description: "",
      title: "",
      sortTitle: "", //Since firestore does not support case-insensitive sorting
      steps: [],
      video: "",
      civ: "",
      map: "",
      strategy: "",
      timeCreated: null,
      timeUpdated: null,
    });

    const handleSubmit = async () => {
      build.value.sortTitle =
        build.value.title.toLowerCase() + crypto.randomUUID();
      build.value.authorUid = user.value.uid;
      build.value.author = user.value.displayName;
      const id = await add(build.value);
      if (!error.value) {
        router.push("/builds/" + id);
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
      error,
      civs,
      maps,
      strategies,
      seasons,
      user,
      authIsReady: computed(() => store.state.authIsReady),
      handleSubmit,
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
      hoverRowIndex: false,
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
