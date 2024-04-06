<template>
  <v-container>
    <div
      v-if="
        authIsReady &&
        user &&
        (user.uid === 'beJM1k8sm8TVm5fHQZfKUniL8Hp1' ||
          user.uid === '6mzuhMzRCySxaFcaSrXamwHjVm02' ||
          user.uid === 'zZqq3rZZJZdKPN5TFWBr6jNzJRS2')
      "
      class="d-flex justify-center"
    >
      <v-row align="center" justify="center">
        <!-- Main Content -->
        <v-col cols="12" sm="6" align-self="start">
          <v-card flat rounded="lg" class="mb-6 pa-2 text-center">
            <v-card-title>Helper Functions</v-card-title>
            <v-btn color="primary" variant="text" @click="updateImageMetaData()"
              >Sync Data with AOE4WORLD</v-btn
            >
          </v-card>

          <v-card flat rounded="lg" class="mb-6 pa-2 text-center">
            <v-card-title>Migrations</v-card-title>
            <v-btn color="primary" variant="text" @click="runMigration()"
              >Embed comments count</v-btn
            >
          </v-card>
        </v-col>

        <!-- Side Bar -->
        <v-col cols="12" sm="4">
          <v-card flat rounded="lg" class="d-flex align-center mb-4">
            <v-row no-gutters class="fill-height" align="center" justify="center">
              <v-col cols="12">
                <v-card-title class="mb-4">Admin Console</v-card-title>
              </v-col>
              <v-col cols="12">
                <v-text-field
                  class="text-grey"
                  name="displayname"
                  label="Display name"
                  type="text"
                  v-model="user.displayName"
                  placeholder="Your display name"
                  readonly
                ></v-text-field>
                <v-text-field
                  class="text-grey"
                  name="email"
                  label="Email"
                  type="email"
                  v-model="user.email"
                  placeholder="Your email"
                  readonly
                ></v-text-field>
                <v-text-field
                  class="text-grey"
                  name="user id"
                  label="User ID"
                  type="text"
                  v-model="user.uid"
                  placeholder="Your user id"
                  readonly
                ></v-text-field>
                <v-card flat v-if="error" rounded="lg" color="error">
                  <v-card-text>{{ error }}</v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </v-card>
        </v-col>
      </v-row>
    </div>
  </v-container>
</template>

<script>
import { useStore } from "vuex";
import { ref, computed, onMounted } from "vue";

//Composables
import { getDefaultConfig } from "@/composables/filter/configDefaultProvider";
import { getCommentsCount } from "@/composables/data/commentService";
import { getBuilds, updateBuild } from "@/composables/data/buildService";

export default {
  name: "Admin",
  setup() {
    var builds = null;

    const error = ref(null);
    const store = useStore();
    const filterConfig = computed(() => store.state.filterConfig);
    const user = computed(() => store.state.user);

    onMounted(() => {
      if (!filterConfig.value) {
        store.commit("setFilterConfig", getDefaultConfig());
      }
      initData();
    });

    async function updateImageMetaData() {
      var units = null;
      var buildings = null;
      var techs = null;
      var abilities = null;
      //TODO: Remove "age" property for now since not used
      //TODO: Only include description, influence, and costs for now
      //TODO: Add missing resource icons (e.g. olive oil)
      //TODO: Design tooltip and visualize data. Consider adding ID to each img entry starting now for ID lookup instead of imgSrc lookup.

      await fetch("https://data.aoe4world.com/units/all.json")
        .then((response) => response.json())
        .then((data) => {
          units = data.data;
        });
      console.log("units", units);
      //TODO: Map entries via name "similarity" if no ID, else use ID
      //TODO: Get infoService data and enrich unitEco, unitMilitary, unitReligious, unitHero
      //TODO: Download updated json to be included in iconService

      await fetch("https://data.aoe4world.com/buildings/all.json")
        .then((response) => response.json())
        .then((data) => {
          buildings = data.data;
        });
      console.log("buildings", buildings);
      //TODO: Map entries via name "similarity" if no ID, else use ID
      //TODO: Get infoService data and enrich landmarks, buildingEco, buildingReligious, buildingTech, buildingMilitary
      //TODO: Download updated json to be included in iconService

      await fetch("https://data.aoe4world.com/upgrades/all.json")
        .then((response) => response.json())
        .then((data) => {
          techs = data.data;
        });
      console.log("techs", techs);
      //TODO: Map entries via name "similarity" if no ID, else use ID
      //TODO: Get infoService data and enrich techEco, techMilitary
      //TODO: Download updated json to be included in iconService

      await fetch("https://data.aoe4world.com/upgrades/all.json")
        .then((response) => response.json())
        .then((data) => {
          abilities = data.data;
        });
      console.log("abilities", abilities);
      //TODO: Map entries via name "similarity" if no ID, else use ID
      //TODO: Get infoService data and enrich abilityHero
      //TODO: Download updated json to be included in iconService
    }

    function runMigration() {
      builds.forEach((build, index) => {
        setTimeout(() => {
          customActionPerBuild(build);
        }, index * 1000);
      });
    }

    async function customActionPerBuild(build) {
      console.log("Build id:", build.id);

      const commentsCount = await getCommentsCount(build.id);
      build.comments = commentsCount || 0;

      updateBuild(build.id, build);
    }

    async function initData() {
      //init builds, filter based on use case
      //builds = await getBuilds();
    }

    return {
      builds,
      user,
      authIsReady: computed(() => store.state.authIsReady),
      error,
      runMigration,
      updateImageMetaData,
    };
  },
};
</script>
