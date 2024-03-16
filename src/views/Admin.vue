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
      <v-row no-gutters class="fill-height" align="center" justify="center">
        <v-col cols="12" sm="6" lg="4">
          <v-card flat rounded="lg" class="d-flex align-center mb-4">
            <v-row
              no-gutters
              class="fill-height"
              align="center"
              justify="center"
            >
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
          <v-card flat rounded="lg" class="d-flex align-center mb-4">
            <v-row
              no-gutters
              class="fill-height"
              align="center"
              justify="center"
            >
              <v-col cols="12">
                <v-card-title>Actions</v-card-title>
                <v-btn
                  color="primary"
                  variant="text"
                  @click="processBuilds()"
                  >Inline Creator Names</v-btn
                >
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
import { getDefaultConfig } from "@/composables/filter/defaultConfigService";
import useCollection from "@/composables/useCollection";
import queryService from "@/composables/useQueryService";

export default {
  name: "Admin",
  setup() {
    var builds = null;

    const { getAll, getQuery, getSize, update } = useCollection("builds");
    const creators = computed(() => store.state.cache.creators);
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

    const processBuilds = () => {
      builds.forEach((build, index) => {
        setTimeout(() => {
          inlineCreatorName(build);
        }, index * 1000);
      });
    };

    const inlineCreatorName = async (element) => {
      console.log("Build id:", element.id);

      if (element.creatorId) {
        //TODO: Get creator name and write to document

        //Save to database
        update(element.id, element);
      }
    };

    const initData = async () => {
      //get all builds
      const allDocuments = getQuery(
        queryService.getQueryParametersFromConfig(filterConfig.value)
      );

      console.log(await getSize(allDocuments));

      //TODO: get all builds that contain a creatorId
      //TODO: use limit for testing to not pull hundreds of documents!
      //const res = await getAll(allDocuments);
      //builds = res;
    };

    return {
      builds,
      user,
      authIsReady: computed(() => store.state.authIsReady),
      error,
      processBuilds,
    };
  },
};
</script>
