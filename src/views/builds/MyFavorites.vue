<template>
  <v-container>
    <v-row>
      <v-col cols="12" md="8">
        <!-- The phone's filter toolbar and, from md up, the list header with
             Sort. Sticky on phones, so it lives in the list's column. -->
        <FilterConfig placement="list" context="default" :countFn="myFavoritesCountFn" @configChanged="configChanged"> </FilterConfig>
        <div v-if="builds" v-for="item in builds">
          <router-link
            style="text-decoration: none"
            :to="{
              name: item.loading ? 'MyFavorites' : 'BuildDetails',
              params: { id: !item.loading ? item.id : null },
            }"
          >
            <BuildListCard
              :build="item"
              :filter-config="filterConfig"
            ></BuildListCard>
          </router-link>
        </div>
        <div style="text-align: center" v-if="emptyReason">
          <NoFilterResults :favorites="emptyReason" :retrying="retrying" @retry="retry"></NoFilterResults>
        </div>
        <div style="text-align: center" v-else-if="!loading && count === 0">
          <NoFilterResults @cleared="configChanged"></NoFilterResults>
        </div>

        <v-pagination
          v-if="paginationConfig.totalPages > 1"
          @next="nextPage"
          @prev="previousPage"
          v-model="paginationConfig.currentPage"
          :length="paginationConfig.totalPages"
          total-visible="1"
          rounded="lg"
        ></v-pagination>
      </v-col>

      <v-col cols="12" md="4" class="hidden-sm-and-down">
        <FilterConfig context="default" :countFn="myFavoritesCountFn" @configChanged="configChanged"> </FilterConfig>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
//External
import { useStore } from "vuex";
import { ref, computed, onMounted, watch } from "vue";

//Components
import FilterConfig from "@/components/filter/FilterConfig.vue";
import BuildListCard from "@/components/builds/BuildListCard.vue";
import NoFilterResults from "@/components/notifications/NoFilterResults.vue";
import { useRetry } from "@/composables/useRetry";

//Composables
import { getMostRecentBuildsConfig } from "@/composables/filter/configDefaultProvider";
import { getUserFavorites as getUserFavoritesArray } from "@/composables/data/favoriteService";
import { getBuildsByIds } from "@/composables/data/buildService";
import { applyListConfig } from "@/composables/data/applyListConfig";

// My Favorites loads every favourited build by id, once per visit, and then
// filters, sorts, counts and pages them in memory (spec 042). It used to ask
// Firestore for "these ids AND these filters", one page at a time, which broke
// on two Firestore limits: an `in` filter takes at most 30 values (hence the
// old 30-favourite cap — and 5 accounts above it could not load this page at
// all), and a query at most 30 disjunctions across its `in` filters
// multiplied together (20 favourites × 2 seasons was refused). Lists are short
// (median 2, max 58 in 2026-11), so this also reads less than a page + count.
export default {
  name: "Builds",
  components: { FilterConfig, BuildListCard, NoFilterResults },
  setup() {
    // Every favourited build that could be loaded, or null before the read.
    const all = ref(null);
    // Why the list is empty before any filter applies: "none" or "unreadable"
    // (see NoFilterResults). Null while unknown, so nothing claims "no
    // favorites" before the read has answered.
    const emptyReason = ref(null);
    const store = useStore();
    const user = computed(() => store.state.user);
    const filterConfig = computed(() => store.state.filterConfig);
    const count = computed(() => store.state.resultsCount);
    const loading = computed(() => store.state.loading);
    const paginationConfig = ref({
      currentPage: 1,
      totalPages: null,
      limit: 10,
    });

    const filtered = computed(() => (all.value ? applyListConfig(all.value, filterConfig.value) : null));

    const skeleton = () => Array(paginationConfig.value.limit).fill({ loading: true });
    const builds = computed(() => {
      if (emptyReason.value) return null;
      if (!filtered.value) return skeleton();
      const from = (paginationConfig.value.currentPage - 1) * paginationConfig.value.limit;
      return filtered.value.slice(from, from + paginationConfig.value.limit);
    });

    watch(
      () => user.value,
      () => {
        if (!filterConfig.value) {
          store.commit("setFilterConfig", getMostRecentBuildsConfig());
        }
        load();
      }
    );

    onMounted(() => {
      store.commit("setFilterConfig", getMostRecentBuildsConfig());
      store.commit("setMyFavoritesList", null);
      if (user.value) {
        load();
      }
    });

    // The drawer's live count: in memory, so a filter preview costs no read.
    const myFavoritesCountFn = (config) =>
      Promise.resolve(all.value ? applyListConfig(all.value, config).length : 0);

    // A filter or sort change recomputes from the loaded builds: no read (FR-021).
    const configChanged = () => {
      paginationConfig.value.currentPage = 1;
      applyCounts();
    };

    const applyCounts = () => {
      if (!filtered.value) return;
      store.commit("setResultsCount", filtered.value.length);
      paginationConfig.value.totalPages = Math.ceil(filtered.value.length / paginationConfig.value.limit);
      if (paginationConfig.value.currentPage > Math.max(1, paginationConfig.value.totalPages)) {
        paginationConfig.value.currentPage = 1;
      }
    };

    // The empty state stays up while the read is out (load sets emptyReason
    // only once it answers), so the button carries the spinner.
    const { retrying, retry } = useRetry(() => load());

    const load = async () => {
      // The user watch also fires on sign-out, before the route guard leaves.
      if (!user.value) return;

      store.commit("setLoading", true);

      //reset results count
      store.commit("setResultsCount", null);

      //reset author filter
      store.commit("setAuthor", null);

      // Within a visit, the loaded builds are kept (a heart elsewhere clears
      // this cache, so it never outlives a change to the list).
      const cached = store.state.cache.myFavoritesList;
      if (Array.isArray(cached)) {
        all.value = cached;
        emptyReason.value = null;
        applyCounts();
        store.commit("setLoading", false);
        return;
      }

      // A missing document already reads as an empty list; only a failed read
      // comes back undefined.
      const favoritesDoc = await getUserFavoritesArray(user.value.uid);
      const ids = favoritesDoc?.favorites ?? [];
      emptyReason.value = !favoritesDoc ? "unreadable" : ids.length ? null : "none";
      if (emptyReason.value) {
        // "0 builds" in the filter strip, as My Builds shows. Not for an
        // unreadable list: its count is unknown, not zero.
        if (emptyReason.value === "none") store.commit("setResultsCount", 0);
        all.value = null;
        store.commit("setLoading", false);
        return;
      }

      all.value = null; // skeletons while the builds load
      const loaded = await getBuildsByIds(ids);

      // The favorites document was readable but the builds it names were not
      // (getAll passes a refused read back as undefined): the same honest state
      // as an unreadable document, with its retry.
      if (!Array.isArray(loaded)) {
        emptyReason.value = "unreadable";
        store.commit("setLoading", false);
        return;
      }

      // Ids whose build was deleted simply did not come back (FR-020); if none
      // did, the filter strip says 0 and NoFilterResults offers to clear filters.
      all.value = loaded;
      store.commit("setMyFavoritesList", loaded);
      paginationConfig.value.currentPage = 1;
      applyCounts();
      store.commit("setLoading", false);
    };

    // v-pagination has already moved currentPage; the page is a slice of the
    // loaded builds, so paging reads nothing.
    const nextPage = () => window.scrollTo(0, 0);
    const previousPage = () => window.scrollTo(0, 0);

    return {
      builds,
      emptyReason,
      user,
      count,
      loading,
      paginationConfig,
      filterConfig,
      configChanged,
      retrying,
      retry,
      myFavoritesCountFn,
      nextPage,
      previousPage,
    };
  },
};
</script>
