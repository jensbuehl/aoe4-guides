<template>
  <v-container>
    <v-row>
      <v-col>
        <v-row>
          <v-col v-for="item in builds" :key="item.id">
            <router-link
              style="text-decoration: none"
              :to="{ name: 'BuildDetails', params: { id: item.id } }"
            >
              <SingleBuild :build="item" ></SingleBuild>
            </router-link>
          </v-col>
        </v-row>
      </v-col>
      <v-col class="hidden-sm-and-down" cols="4">
        <div style="position: sticky; top: 128px">
          <BuildsConfig @configChanged="configChanged"> </BuildsConfig>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import BuildsConfig from "../../components/BuildsConfig.vue";
import getDefaultConfig from "../../composables/getDefaultConfig";
import SingleBuild from "../../components/SingleBuild.vue";
import useCollection from "../../composables/useCollection";
import queryService from "../../composables/queryService";
import { useStore } from "vuex";
import { ref, computed, onMounted } from "vue";

export default {
  name: "Builds",
  components: { BuildsConfig, SingleBuild },
  setup() {
    window.scrollTo(0,0);

    const { getCustom, getQuery } = useCollection("builds");
    const builds = ref(null);
    const store = useStore();
    const user = computed(() => store.state.user);

    onMounted (()=>{
        initData(getDefaultConfig());
    })

    const configChanged = ((config) => {
      console.log("config changed:", config)
      initData(config)
    })

    const initData = (async (config) => {
      const query = getQuery(queryService.getQueryParametersAllBuilds(config));
      const res = await getCustom(query);
      builds.value = res;
    })

    return {
      builds,
      user,
      authIsReady: computed(() => store.state.authIsReady),
      configChanged
    };
  },
};
</script>
