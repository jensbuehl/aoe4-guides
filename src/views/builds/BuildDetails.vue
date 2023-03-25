<template>
  <v-container v-if="build">
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
          <v-card-actions v-if="user">
            <v-btn
              v-show="user.uid === build.authorUid"
              prepend-icon="mdi-pencil"
              :to="{ name: 'BuildEdit', params: { id: props.id } }"
              >Edit</v-btn
            >
            <v-btn
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
        </v-card>

        <v-card v-if="build.description" rounded="lg" class="mt-4">
          <v-card-title>Description</v-card-title>
          <v-card-text>{{ build.description }}</v-card-text>
        </v-card>

        <v-card v-if="build.video" rounded="lg" class="mt-4">
          <v-card-title>Video</v-card-title>
          <div align="center">
            <iframe
              width="560"
              height="315"
              :src="build.video"
              frameborder="0"
              class="mb-3"
              allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen
            ></iframe>
          </div>
        </v-card>

        <v-card rounded="lg" class="mt-4">
          <v-table class="ma-2">
            <thead>
              <tr>
                <th class="text-center" width="70px">Time</th>
                <th class="text-center" width="70px">Food</th>
                <th class="text-center" width="70px">Wood</th>
                <th class="text-center" width="70px">Gold</th>
                <th class="text-center" width="70px">Stone</th>
                <th class="text-left">Description</th>
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
      </v-col>
    </v-row>
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
    const { get, del, error } = useCollection("builds");

    onMounted(async () => {
      const res = await get(props.id);
      window.scrollTo(0, 0);
      build.value = res;
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
