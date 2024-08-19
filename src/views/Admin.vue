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
              >Initialize Contributors</v-btn
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
import { httpsCallable } from "firebase/functions";
import {
  functions,
} from "@/firebase";

//Composables
import { getDefaultConfig } from "@/composables/filter/configDefaultProvider";
import { getBuilds } from "@/composables/data/buildService";
import { addContributor } from "@/composables/data/contributorService";

import unitEco from "@/composables/builds/icons/json/unitEco.json" with { type: "json" };
import unitReligious from "@/composables/builds/icons/json/unitReligious.json" with { type: "json" };
import unitMilitary from "@/composables/builds/icons/json/unitMilitary.json" with { type: "json" };
import unitHero from "@/composables/builds/icons/json/unitHero.json" with { type: "json" };

import techEco from "@/composables/builds/icons/json/techEco.json" with { type: "json" };
import techMilitary from "@/composables/builds/icons/json/techMilitary.json" with { type: "json" };

import landmarks from "@/composables/builds/icons/json/landmarks.json" with { type: "json" };
import buildingEco from "@/composables/builds/icons/json/buildingEco.json" with { type: "json" };
import buildingReligious from "@/composables/builds/icons/json/buildingReligious.json" with { type: "json" };
import buildingTech from "@/composables/builds/icons/json/buildingTech.json" with { type: "json" };
import buildingMilitary from "@/composables/builds/icons/json/buildingMilitary.json" with { type: "json" };

export default {
  name: "Admin",
  setup() {
    var builds = null;
    var users = null;

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

    function sortByNameCompareFunction(a, b) {
      var nameA = a.toUpperCase();
      var nameB = b.toUpperCase();
      if (nameA < nameB) {
        return -1;
      }
      if (nameA > nameB) {
        return 1;
      }
      return 0;
    }

    async function downloadObjectAsJSONFile(object, filename) {
      if (!filename.endsWith(".json")) {
        filename = `${filename}.json`;
      }
      const json = JSON.stringify(object);
      const blob = new Blob([json], { type: "application/json" });
      const href = await URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = href;
      link.download = filename;
      link.position = "absolute";
      link.left = "200vw";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    async function syncData(source, target, type) {
      target.forEach((element) => {
        var match = source.find((unit) => {
          if (unit.id === element.id || unit.name === element.title) {
            return true;
          }
        });

        if (match) {
          //Sync and enrich data
          console.log("match", match, element);

          element.description = match.description;
          element.age = match.age;
          element.id = match.id;
          element.civ = element.civ.sort(sortByNameCompareFunction);
          element.type = match.type;

          if (type) {
            element.exploreUrl =
              "https://aoe4world.com/explorer/civs/all/" + type + "/" + match.baseId;
          }
          if (match.costs.total > 0) {
            element.costs = match.costs;
          }
          if (match.influence) {
            element.influences = match.influences;
          }
        } else {
          if (!element.deprecated) console.warn("match not found for", element);
        }
      });
    }

    async function updateImageMetaData() {
      var units = null;
      var buildings = null;
      var techs = null;
      var abilities = null;

      //Fetch data from aoe4world
      await fetch("https://data.aoe4world.com/units/all.json")
        .then((response) => response.json())
        .then((data) => {
          units = data.data;
        });
      console.log("units", units);

      await fetch("https://data.aoe4world.com/buildings/all.json")
        .then((response) => response.json())
        .then((data) => {
          buildings = data.data;
        });
      console.log("buildings", buildings);

      await fetch("https://data.aoe4world.com/technologies/all.json")
        .then((response) => response.json())
        .then((data) => {
          techs = data.data;
        });
      console.log("techs", techs);

      await fetch("https://data.aoe4world.com/abilities/all.json")
        .then((response) => response.json())
        .then((data) => {
          abilities = data.data;
        });
      console.log("abilities", abilities);

      syncData(units, unitEco, "units");
      downloadObjectAsJSONFile(unitEco, "unitEco.json");

      syncData(units, unitReligious, "units");
      downloadObjectAsJSONFile(unitReligious, "unitReligious.json");

      syncData(units, unitMilitary, "units");
      downloadObjectAsJSONFile(unitMilitary, "unitMilitary.json");

      syncData(units, unitHero, "units");
      downloadObjectAsJSONFile(unitHero, "unitHero.json");

      syncData(buildings, buildingEco, "buildings");
      downloadObjectAsJSONFile(buildingEco, "buildingEco.json");

      syncData(buildings, buildingMilitary, "buildings");
      downloadObjectAsJSONFile(buildingMilitary, "buildingMilitary.json");

      syncData(buildings, buildingReligious, "buildings");
      downloadObjectAsJSONFile(buildingReligious, "buildingReligious.json");

      syncData(buildings, buildingTech, "buildings");
      downloadObjectAsJSONFile(buildingTech, "buildingTech.json");

      syncData(buildings.concat(techs), landmarks, "buildings");
      downloadObjectAsJSONFile(landmarks, "landmarks.json");

      syncData(techs, techEco, "technologies");
      downloadObjectAsJSONFile(techEco, "techEco.json");

      syncData(techs, techMilitary, "technologies");
      downloadObjectAsJSONFile(techMilitary, "techMilitary.json");

      syncData(abilities.concat(techs), abilityHero);
      downloadObjectAsJSONFile(abilityHero, "abilityHero.json");

      //If you pause for a second between each 10 downloads, all of them will work in Chrome.
      //Automatic download is limited to 10.
    }

    function runMigration() {
      users.forEach((user, index) => {
        setTimeout(() => {
          customActionPerUser(user);
        }, index * 1000);
      });
    }

    async function customActionPerUser(user) {
      var contributorBuilds = builds.filter((build) => build.authorUid === user.id);
      const boCount = contributorBuilds.length;
      const viewCount = contributorBuilds.reduce((a, b) => a + b.views, 0);

      var contributor = {
        authorId: user.id,
        displayName: user.displayName,
        boCount: boCount,
        viewCount: viewCount
      };

      console.log(contributor);

      //add contributor to db
      await addContributor(contributor, user.id);
    }

    async function initData() {
      //init builds, filter based on use case
      builds = await getBuilds();

      //init users
      const getUsers = httpsCallable(
            functions,
            "getUsers"
          );
      users = (await getUsers()).data;
    }

    return {
      builds,
      user,
      authIsReady: computed(() => store.state.authIsReady),
      error,
      runMigration,
      updateImageMetaData,
      sortByNameCompareFunction,
    };
  },
};
</script>
