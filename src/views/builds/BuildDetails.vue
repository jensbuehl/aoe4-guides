<template>
  <v-container v-if="build">
    <v-card rounded="lg">
      <v-row class="d-flex align-center">
        <v-col cols="3" class="pa-0 ma-0 hidden-sm-and-down">
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
          <v-card-title class="py-0 mb-4">{{ build.title }}</v-card-title>
          <v-item-group class="ml-4 py-2">
            <v-chip
              class="mr-2"
              label
              size="small"
              disabled
              v-show="build.views"
              >Views: {{ build.views }}</v-chip
            >
            <v-chip
              class="mr-2"
              v-if="build.timeCreated"
              label
              size="small"
              disabled
              >Created: {{ build.timeCreated.toDate().toDateString() }}</v-chip
            >
            <v-chip
              class="mr-2"
              v-if="build.timeCreated"
              label
              size="small"
              disabled
              >Updated: {{ build.timeUpdated.toDate().toDateString() }}</v-chip
            >
          </v-item-group>
          <v-item-group class="ml-4 pb-2">
            <v-chip color="primary" class="mr-2" label size="small"
              >Author: {{ build.author }}</v-chip
            >
            <v-chip
              class="mr-2"
              color="primary"
              v-if="build.map"
              label
              size="small"
              >{{ build.map }}</v-chip
            >
            <v-chip
              color="primary"
              class="mr-2"
              v-if="build.strategy"
              label
              size="small"
              >{{ build.strategy }}</v-chip
            >
          </v-item-group>
        </v-col>
        <v-col cols="auto" align="right">
          <v-card-actions class="hidden-sm-and-down">
            <v-btn
              color="primary"
              v-show="user.uid === build.authorUid"
              prepend-icon="mdi-pencil"
              :to="{ name: 'BuildEdit', params: { id: props.id } }"
              >Edit</v-btn
            >
            <v-btn
              color="primary"
              v-show="user.uid === build.authorUid"
              prepend-icon="mdi-delete"
              @click="dialog = true"
              >Delete</v-btn
            >
            <v-dialog v-model="dialog" width="auto">
              <v-card rounded="lg" class="text-center primary">
                <v-card-title>Delete Build</v-card-title>
                <v-card-text>
                  Do you really want to delete this build?<br />
                  The action cannot be undone.
                </v-card-text>
                <v-card-actions>
                  <v-btn color="error" block @click="handleDelete"
                    >Delete</v-btn
                  >
                </v-card-actions>
              </v-card>
            </v-dialog>
          </v-card-actions>
        </v-col>
      </v-row>
    </v-card>

    <v-card v-if="build.description" rounded="lg" class="mt-4">
      <v-card-title>Description</v-card-title>
      <v-card-text style="white-space: pre-line">{{
        build.description
      }}</v-card-text>
    </v-card>

    <v-card v-if="build.video" rounded="lg" class="mt-4">
      <v-card-title>Video</v-card-title>
      <div align="center">
        <iframe
          width="100%"
          height="300px"
          :src="build.video"
          frameborder="0"
          class="mb-3"
          allowfullscreen
        ></iframe>
      </div>
    </v-card>

    <v-card v-if="build.steps.length" rounded="lg" class="mt-4">
      <v-table class="ma-2">
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
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in build.steps" :key="item.description">
            <td class="text-center">{{ item.time }}</td>
            <td class="text-center">{{ item.food }}</td>
            <td class="text-center">{{ item.wood }}</td>
            <td class="text-center">{{ item.gold }}</td>
            <td class="text-center">{{ item.stone }}</td>
            <td class="text-left">{{ item.description }}</td>
          </tr>
        </tbody>
      </v-table>
    </v-card>
  </v-container>
</template>

<script>
import { ref, onMounted, computed } from "vue";
import { useStore } from "vuex";
import { useRouter } from "vue-router";
import useCollection from "../../composables/useCollection";
import getCivs from "../../composables/getCivs";

export default {
  name: "BuildDetails",
  props: ["id"],
  setup(props) {
    const store = useStore();
    const user = computed(() => store.state.user);
    const router = useRouter();
    const civs = getCivs().civs;
    const build = ref(null);
    const dialog = ref(false);
    const { get, del, incrementViews, error } = useCollection("builds");

    onMounted(async () => {
      const res = await get(props.id);
      window.scrollTo(0, 0);
      build.value = res;
      //Note: You can update a single document only once per second.
      //If you need to update your counter above this rate, see Distributed counters
      incrementViews(props.id);
    });

    const handleDelete = async () => {
      dialog.value = false;
      await del(props.id);
      if (!error.value) {
        router.push("/");
      }
    };

    return {
      build,
      props,
      user,
      civs,
      error,
      dialog,
      handleDelete,
    };
  },
};
</script>
