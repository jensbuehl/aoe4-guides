<template>
  <v-card rounded="lg" flat>
    <!-- Header: desktop card title with inline Reset -->
    <div v-if="!smAndDown" class="fl-card-header px-4 pt-3 pb-1 d-flex align-center justify-space-between">
      <div class="d-flex align-center" style="gap: 6px;">
        <v-icon color="primary">mdi-filter-variant</v-icon>
        <span class="fl-header-label">Filters</span>
      </div>
      <v-btn
        v-if="showReset"
        variant="plain"
        size="small"
        @click="handleReset"
      >
        <template #prepend><v-icon color="primary" size="14">mdi-close</v-icon></template>
        Reset
      </v-btn>
    </div>

    <!-- Mobile: collapsible expansion panel -->
    <template v-if="smAndDown">
      <v-expansion-panels>
        <v-expansion-panel :elevation="0">
          <v-expansion-panel-title>
            <div class="d-flex align-center justify-space-between pr-2" style="width: 100%;">
              <div class="d-flex align-center" style="gap: 6px;">
                <v-icon color="primary">mdi-filter-variant</v-icon>
                <span class="fl-header-label">Filters</span>
              </div>
              <v-btn
                v-if="showReset"
                variant="plain"
                size="small"
                @click.stop="handleReset"
              >
                <template #prepend><v-icon color="primary" size="14">mdi-close</v-icon></template>
                Reset
              </v-btn>
            </div>
          </v-expansion-panel-title>
          <v-expansion-panel-text class="mt-2">
              <FilterChips
                :draft="draft"
                :dirtyFields="dirtyFields"
                :applied="appliedConfig"
                :context="context"
                class="mb-2"
                @remove-chip="onRemoveChip"
              />
              <v-select
                v-if="context !== 'civ-locked'"
                v-model="draft.civs"
                label="Civilization"
                density="compact"
                :items="civs"
                item-value="shortName"
                item-title="title"
                clearable
                prepend-inner-icon="mdi-earth"
              >
                <template v-if="dirtyFields.civs" #append-inner>
                  <span class="fl-dot" />
                </template>
              </v-select>
              <v-select
                v-model="draft.creator"
                prepend-inner-icon="mdi-youtube"
                label="Video Creator"
                density="compact"
                :items="creators"
                item-value="creatorId"
                :item-title="(item) => (item.creatorDisplayTitle ? item.creatorDisplayTitle : item.creatorTitle)"
                clearable
              >
                <template v-if="dirtyFields.creator" #append-inner>
                  <span class="fl-dot" />
                </template>
              </v-select>
              <v-select
                v-model="draft.seasons"
                prepend-inner-icon="mdi-trophy"
                label="Season"
                density="compact"
                :items="seasons"
                item-value="title"
                item-title="title"
                clearable
                multiple
              >
                <template v-if="dirtyFields.seasons" #append-inner>
                  <span class="fl-dot" />
                </template>
              </v-select>
              <v-select
                v-model="draft.maps"
                prepend-inner-icon="mdi-map"
                label="Map"
                density="compact"
                :items="maps"
                item-value="title"
                item-title="title"
                clearable
                multiple
              >
                <template v-if="dirtyFields.maps" #append-inner>
                  <span class="fl-dot" />
                </template>
              </v-select>
              <v-select
                v-model="draft.strategies"
                prepend-inner-icon="mdi-strategy"
                label="Strategy"
                density="compact"
                :items="strategies"
                item-value="title"
                item-title="title"
                clearable
                multiple
              >
                <template v-if="dirtyFields.strategies" #append-inner>
                  <span class="fl-dot" />
                </template>
              </v-select>
              <FilterSortGroup
                v-if="context !== 'civ-locked'"
                v-model="draft.orderBy"
                :dirty="dirtyFields.orderBy"
                :sortOptions="sortOptions"
              />
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </template>

    <!-- Desktop: direct fields -->
    <template v-else>
      <v-card-text class="pb-0">
        <FilterChips
          :draft="draft"
          :dirtyFields="dirtyFields"
          :applied="appliedConfig"
          :context="context"
          class="mb-1"
          @remove-chip="onRemoveChip"
        />
        <v-autocomplete
          v-if="context !== 'civ-locked'"
          v-model="draft.civs"
          label="Civilization"
          density="compact"
          :items="civs"
          item-value="shortName"
          item-title="title"
          clearable
          prepend-inner-icon="mdi-earth"
        >
          <template v-if="dirtyFields.civs" #append-inner>
            <span class="fl-dot" />
          </template>
        </v-autocomplete>
        <v-autocomplete
          v-model="draft.creator"
          prepend-inner-icon="mdi-youtube"
          label="Video Creator"
          density="compact"
          :items="creators"
          item-value="creatorId"
          :item-title="(item) => (item.creatorDisplayTitle ? item.creatorDisplayTitle : item.creatorTitle)"
          clearable
        >
          <template v-if="dirtyFields.creator" #append-inner>
            <span class="fl-dot" />
          </template>
        </v-autocomplete>
        <v-autocomplete
          v-model="draft.seasons"
          prepend-inner-icon="mdi-trophy"
          label="Season"
          density="compact"
          :items="seasons"
          item-value="title"
          item-title="title"
          clearable
          multiple
        >
          <template v-if="dirtyFields.seasons" #append-inner>
            <span class="fl-dot" />
          </template>
        </v-autocomplete>
        <v-autocomplete
          v-model="draft.maps"
          prepend-inner-icon="mdi-map"
          label="Map"
          density="compact"
          :items="maps"
          item-value="title"
          item-title="title"
          clearable
          multiple
        >
          <template v-if="dirtyFields.maps" #append-inner>
            <span class="fl-dot" />
          </template>
        </v-autocomplete>
        <v-autocomplete
          v-model="draft.strategies"
          prepend-inner-icon="mdi-strategy"
          label="Strategy"
          density="compact"
          :items="strategies"
          item-value="title"
          item-title="title"
          clearable
          multiple
        >
          <template v-if="dirtyFields.strategies" #append-inner>
            <span class="fl-dot" />
          </template>
        </v-autocomplete>
        <FilterSortGroup
          v-if="context !== 'civ-locked'"
          v-model="draft.orderBy"
          :dirty="dirtyFields.orderBy"
          :sortOptions="sortOptions"
        />
      </v-card-text>
    </template>

    <FilterApplyBar
      :isDirty="isDirty"
      :appliedCount="count"
      :previewEnabled="previewEnabled"
      :previewCount="previewCount"
      :previewLoading="previewLoading"
      @apply="handleApply"
    />
  </v-card>
</template>

<script>
import { ref, computed, onMounted } from "vue";
import { useStore } from "vuex";
import { useRoute } from "vue-router";
import { useDisplay } from "vuetify";

import { civs as allCivs } from "@/composables/filter/civDefaultProvider";
import { featuredCreators } from "@/composables/filter/featuredCreatorDefaultProvider";
import { maps } from "@/composables/filter/mapDefaultProvider";
import { seasons } from "@/composables/filter/seasonDefaultProvider";
import { getDefaultConfig } from "@/composables/filter/configDefaultProvider";
import { strategies } from "@/composables/filter/strategyDefaultProvider";
import { useDraftFilterConfig } from "@/composables/filter/useDraftFilterConfig";
import { useFilterCountPreview } from "@/composables/filter/useFilterCountPreview";

import FilterChips from "@/components/filter/FilterChips.vue";
import FilterApplyBar from "@/components/filter/FilterApplyBar.vue";
import FilterSortGroup from "@/components/filter/FilterSortGroup.vue";

export default {
  name: "FilterConfig",
  inheritAttrs: false,
  emits: ["configChanged"],
  components: { FilterChips, FilterApplyBar, FilterSortGroup },
  props: {
    context: { type: String, default: "default" },
    civName: { type: String, default: null },
    countFn: { type: Function, default: null },
  },
  setup(props, context) {
    const store = useStore();
    const civs = allCivs.value.filter((el) => el.shortName !== "ANY");
    const creators = featuredCreators;
    const route = useRoute();
    const loading = computed(() => store.state.loading);
    const count = computed(() => store.state.resultsCount);
    const appliedConfig = computed(() => store.state.filterConfig);
    const { smAndDown } = useDisplay();

    const { draft, dirtyFields, dirtyCount, isDirty, resetField, applyDraft } =
      useDraftFilterConfig();

    const previewEnabled = ref(true);
    const { previewCount, previewLoading } = useFilterCountPreview(draft, {
      enabled: previewEnabled,
      countFn: props.countFn,
    });

    const initQueryParameters = async () => {
      if (route.query.civ) draft.value.civs = route.query.civ;
      if (route.query.creator) draft.value.creator = route.query.creator;
    };

    onMounted(async () => {
      await initQueryParameters();
    });

    const showReset = computed(() => {
      const cfg = store.state.filterConfig;
      const def = getDefaultConfig();
      const civCheck = props.context === "civ-locked" ? false : cfg?.civs != def.civs;
      return (
        civCheck ||
        cfg?.creator != def.creator ||
        JSON.stringify(cfg?.maps) !== JSON.stringify(def.maps) ||
        JSON.stringify(cfg?.strategies) !== JSON.stringify(def.strategies) ||
        JSON.stringify(cfg?.seasons) !== JSON.stringify(def.seasons) ||
        cfg?.orderBy !== def.orderBy
      );
    });

    const sortOptions = ref([
      { title: "All Time Score", id: "scoreAllTime" },
      { title: "Views", id: "views" },
      { title: "Trending", id: "score" },
      { title: "Time Created", id: "timeCreated" },
      { title: "Favorites", id: "likes" },
      { title: "Title", id: "sortTitle" },
    ]);

    const handleApply = () => applyDraft(context.emit);

    const handleReset = () => {
      const def = getDefaultConfig();
      if (props.context !== "civ-locked") {
        draft.value.civs = def.civs;
        store.commit("setCivs", def.civs);
      }
      draft.value.creator = def.creator;
      draft.value.maps = def.maps;
      draft.value.strategies = def.strategies;
      draft.value.seasons = def.seasons;
      draft.value.orderBy = def.orderBy;

      store.commit("setCreator", def.creator);
      store.commit("setMaps", def.maps);
      store.commit("setStrategies", def.strategies);
      store.commit("setSeasons", def.seasons);
      store.commit("setOrderBy", def.orderBy);

      store.commit("setAllBuildsList", null);
      store.commit("setMyBuildsList", null);
      store.commit("setMyFavoritesList", null);

      context.emit("configChanged");
    };

    const onRemoveChip = ({ field }) => {
      draft.value[field] = getDefaultConfig()[field];
    };

    return {
      sortOptions,
      civs,
      maps,
      seasons,
      creators,
      strategies,
      draft,
      dirtyFields,
      dirtyCount,
      isDirty,
      appliedConfig,
      count,
      loading,
      handleReset,
      handleApply,
      showReset,
      onRemoveChip,
      previewEnabled,
      previewCount,
      previewLoading,
      smAndDown,
    };
  },
};
</script>

<style scoped>
.fl-header-label {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.fl-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: rgb(var(--v-theme-primary));
  flex-shrink: 0;
  align-self: center;
}
</style>
