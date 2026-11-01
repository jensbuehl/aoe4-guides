<template>
  <!-- Phones: a toolbar over the list, and the fields in a bottom sheet.
       An inline panel pushed every result off screen while it was open, so a
       change could not be seen without scrolling away from the controls that
       made it. The sheet keeps the list in place underneath, and the draft and
       its "Show N results" count are the sheet's natural model: nothing
       reaches the list until it is applied, and closing the sheet any other
       way drops the draft.

       Sticky, so the filters stay one tap away deep into a list. Its parent
       must be the column holding the list: a sticky element only travels
       inside its parent's box, which is why the pages render it first in the
       list column rather than in a column of its own.

       From md up the same row is the list's header, count and sort only: the
       fields stay in the sidebar card, but Sort sits where it does on a phone,
       over the list it orders. -->
  <div
    v-if="smAndDown || placement === 'list'"
    ref="toolbar"
    v-bind="$attrs"
    :class="['fl-toolbar', { 'fl-toolbar--header': !smAndDown }]"
    :style="{ top: stickyTop }"
  >
    <div class="fl-toolbar-row">
      <v-btn
        v-if="smAndDown"
        ref="filtersBtn"
        variant="flat"
        color="surface"
        rounded="lg"
        class="fl-toolbar-btn"
        :aria-label="activeCount ? `Filters, ${activeCount} active` : 'Filters'"
        @click="openSheet"
      >
        <!-- Drawn like Sort beside it and the cards below; when a filter is
             set, the count badge is what makes this button stand out. -->
        <template #prepend><v-icon color="primary">mdi-filter-variant</v-icon></template>
        Filters
        <v-badge
          v-if="activeCount"
          :content="activeCount"
          color="primary"
          inline
          aria-hidden="true"
        />
      </v-btn>
      <span
        :class="[
          'fl-toolbar-count',
          {
            'fl-toolbar-count--end': context === 'civ-locked',
            'fl-toolbar-count--start': !smAndDown,
          },
        ]"
        aria-live="polite"
      >
        <template v-if="count != null">
          {{ count }} {{ count === 1 ? "build" : "builds" }}
        </template>
      </span>
      <!-- Sorting is not filtering: it applies at once, with no draft, and so
           lives out here rather than in the sheet or the sidebar card.

           Its box is drawn at rest, and that box is what sits on the list's
           right edge. As a text button the ▾ stood 17px inside the edge behind
           padding nobody could see; pulling the button out to put the ▾ on the
           edge instead pushed the hover fill and the menu past it. Surface and
           rounded="lg", the cards' own colour and corners: tonal derived a
           grey that matched nothing around it, and the default 4px radius read
           as a different kind of object beside 8px cards. -->
      <v-menu v-if="context !== 'civ-locked'" location="bottom end">
        <template #activator="{ props: menuProps }">
          <v-btn
            v-bind="menuProps"
            variant="flat"
            color="surface"
            rounded="lg"
            class="fl-toolbar-btn"
            :aria-label="`Sort by ${sortTitle}`"
          >
            <template #prepend><v-icon color="primary">mdi-sort</v-icon></template>
            {{ sortTitle }}
            <template #append><v-icon>mdi-menu-down</v-icon></template>
          </v-btn>
        </template>
        <v-list density="comfortable">
          <v-list-item
            v-for="option in sortOptions"
            :key="option.id"
            :title="option.title"
            :active="option.id === appliedConfig.orderBy"
            color="primary"
            @click="applySort(option.id)"
          />
        </v-list>
      </v-menu>
    </div>
    <!-- What is applied, not a draft: the sheet is closed whenever these are
         visible, so a tap removes the filter outright. -->
    <FilterChips
      v-if="smAndDown"
      :draft="appliedConfig"
      :dirtyFields="noneDirty"
      :applied="appliedConfig"
      :context="context"
      scroll
      @remove-chip="removeApplied"
      @emptied="focusFiltersBtn"
    />

    <v-bottom-sheet
      v-if="smAndDown"
      v-model="sheetOpen"
      scrollable
      :aria-labelledby="sheetTitleId"
      @after-leave="onSheetGone"
    >
      <v-card rounded="t-lg" class="fl-sheet">
        <div class="fl-sheet-header">
          <v-icon color="primary">mdi-filter-variant</v-icon>
          <span :id="sheetTitleId" class="fl-header-label">Filters</span>
          <v-spacer />
          <v-btn
            icon="mdi-close"
            variant="text"
            aria-label="Close filters"
            @click="sheetOpen = false"
          />
        </div>
        <v-divider />
        <v-card-text class="fl-sheet-body">
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
            <template #item="{ props: itemProps, item }">
              <v-list-item v-bind="itemProps">
                <template #prepend><CivFlag :civ="item.raw.shortName" class="mr-3" /></template>
              </v-list-item>
            </template>
            <template #selection="{ item }">
              <CivFlag :civ="item.raw.shortName" class="mr-2" />{{ item.title }}
            </template>
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
            <template #item="{ props: itemProps, item }">
              <SeasonListItem :item-props="itemProps" :title="item.raw.title" :selected="(draft.seasons || []).includes(item.raw.title)" />
            </template>
            <template v-if="dirtyFields.seasons" #append-inner>
              <span class="fl-dot" />
            </template>
          </v-select>
          <!-- Map and Strategy are short, fixed lists: every option on show is
               one tap each, where a select took three and hid the rest. -->
          <div v-for="facet in chipFacets" :key="facet.field" class="fl-facet">
            <div :id="`${sheetTitleId}-${facet.field}`" class="fl-facet-label">
              <v-icon size="20">{{ facet.icon }}</v-icon>
              <span>{{ facet.label }}</span>
              <span v-if="dirtyFields[facet.field]" class="fl-dot" />
            </div>
            <v-chip-group
              v-model="draft[facet.field]"
              multiple
              column
              selected-class="text-primary"
              :aria-labelledby="`${sheetTitleId}-${facet.field}`"
            >
              <v-chip
                v-for="option in facet.items"
                :key="option.title"
                :value="option.title"
                filter
                variant="outlined"
                class="fl-facet-chip"
              >
                {{ option.title }}
              </v-chip>
            </v-chip-group>
          </div>
        </v-card-text>
        <div class="fl-sheet-footer">
          <v-btn variant="text" :disabled="!draftHasFilters" @click="clearDraft">
            Clear all
          </v-btn>
          <v-btn color="primary" variant="flat" class="flex-grow-1" @click="applySheet">
            {{ applyLabel }}
          </v-btn>
        </div>
      </v-card>
    </v-bottom-sheet>
  </div>

  <v-card v-else ref="card" v-bind="$attrs" rounded="lg" flat>
    <!-- Header: desktop card title with inline Reset -->
    <div class="fl-card-header px-4 pt-3 pb-1 d-flex align-center justify-space-between">
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

    <!-- Desktop: direct fields -->
    <v-card-text class="pb-0">
      <FilterChips
        :draft="draft"
        :dirtyFields="dirtyFields"
        :applied="appliedConfig"
        :context="context"
        class="mb-1"
        @remove-chip="onRemoveChip"
        @emptied="focusAfterChips"
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
        <template #item="{ props: itemProps, item }">
          <v-list-item v-bind="itemProps">
            <template #prepend><CivFlag :civ="item.raw.shortName" class="mr-3" /></template>
          </v-list-item>
        </template>
        <template #selection="{ item }">
          <CivFlag :civ="item.raw.shortName" class="mr-2" />{{ item.title }}
        </template>
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
        <template #item="{ props: itemProps, item }">
          <SeasonListItem :item-props="itemProps" :title="item.raw.title" :selected="(draft.seasons || []).includes(item.raw.title)" />
        </template>
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
    </v-card-text>

    <!-- The list header beside this card already says how many builds are
         showing, so here the footer is only the apply button, and only while
         there is something to apply. The civ page has no list header and keeps
         its count line. -->
    <FilterApplyBar
      v-if="isDirty || context === 'civ-locked'"
      ref="applyBar"
      :showCount="context === 'civ-locked'"
      :isDirty="isDirty"
      :appliedCount="count"
      :previewCount="previewCount"
      :previewLoading="previewLoading"
      @apply="handleApply"
    />
  </v-card>
</template>

<script>
import { ref, computed, watch, onMounted, useId } from "vue";
import { useStore } from "vuex";
import { useRoute } from "vue-router";
import { useDisplay } from "vuetify";

import { appBarHidden } from "@/components/Header.vue";

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
import CivFlag from "@/components/common/CivFlag.vue";
import SeasonListItem from "@/components/common/SeasonListItem.vue";

export default {
  name: "FilterConfig",
  inheritAttrs: false,
  emits: ["configChanged"],
  components: { FilterChips, FilterApplyBar, CivFlag, SeasonListItem },
  props: {
    context: { type: String, default: "default" },
    // "list" for the instance at the top of the list column, which is the
    // toolbar on phones and the list header from md up; "sidebar" for the
    // card. The civ page has no sort, so its list instance stays phone-only.
    placement: { type: String, default: "sidebar" },
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

    // Only fetch the preview count while the draft differs from the applied
    // config — the apply bar (its only consumer) is hidden otherwise. This
    // also keeps store-driven draft re-syncs (mount, route navigation) from
    // firing a redundant count aggregation per FilterConfig instance.
    const { previewCount, previewLoading } = useFilterCountPreview(draft, {
      enabled: isDirty,
      countFn: props.countFn,
    });

    const initQueryParameters = async () => {
      if (route.query.civ) draft.value.civs = route.query.civ;
      if (route.query.creator) draft.value.creator = route.query.creator;
    };

    onMounted(async () => {
      await initQueryParameters();
    });

    // Filters only, like the sheet's "Clear all": the sort is no longer in
    // this card, and resetting something the reader cannot see here would be
    // a surprise.
    const showReset = computed(() => {
      const cfg = store.state.filterConfig;
      const def = getDefaultConfig();
      const civCheck = props.context === "civ-locked" ? false : cfg?.civs != def.civs;
      return (
        civCheck ||
        cfg?.creator != def.creator ||
        JSON.stringify(cfg?.maps) !== JSON.stringify(def.maps) ||
        JSON.stringify(cfg?.strategies) !== JSON.stringify(def.strategies) ||
        JSON.stringify(cfg?.seasons) !== JSON.stringify(def.seasons)
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

      store.commit("setCreator", def.creator);
      store.commit("setMaps", def.maps);
      store.commit("setStrategies", def.strategies);
      store.commit("setSeasons", def.seasons);

      store.commit("setAllBuildsList", null);
      store.commit("setMyBuildsList", null);
      store.commit("setMyFavoritesList", null);

      context.emit("configChanged");
    };

    // A chip is one value, so its removal takes only that value out of a
    // multi-select field — resetting the field took every sibling chip with it.
    // `value` is the stored value (title, shortName, creatorId), not the label.
    const onRemoveChip = ({ field, value }) => {
      const current = draft.value[field];
      draft.value[field] = Array.isArray(current)
        ? current.filter((v) => v !== value)
        : getDefaultConfig()[field];
    };

    // The last chip went by keyboard: focus "Show N results", the step that
    // follows. Removing a chip only drafted back to what is applied leaves no
    // such button, so fall back to the first control in the card rather than
    // letting focus drop to <body>. Desktop only; the phone has its own below.
    const card = ref(null);
    const applyBar = ref(null);
    const focusAfterChips = () => {
      if (applyBar.value?.focus()) return;
      card.value?.$el.querySelector("button, input")?.focus();
    };

    // --- Phones: toolbar and sheet ---

    const toolbar = ref(null);
    const filtersBtn = ref(null);
    const sheetOpen = ref(false);
    const sheetTitleId = useId();
    // The toolbar's chips show what is applied, so none of them is pending.
    const noneDirty = {};

    const chipFacets = [
      { field: "maps", label: "Map", icon: "mdi-map", items: maps.value },
      { field: "strategies", label: "Strategy", icon: "mdi-strategy", items: strategies.value },
    ];

    // One per chip, so the badge and the row under it always agree.
    const activeCount = computed(() => {
      const cfg = appliedConfig.value;
      return (
        (cfg.civs && props.context !== "civ-locked" ? 1 : 0) +
        (cfg.creator ? 1 : 0) +
        (cfg.seasons?.length ?? 0) +
        (cfg.maps?.length ?? 0) +
        (cfg.strategies?.length ?? 0)
      );
    });

    const sortTitle = computed(
      () => sortOptions.value.find((o) => o.id === appliedConfig.value.orderBy)?.title ?? "Sort"
    );

    // The bar slides away on a handheld scrolling down (Header.vue). Following
    // it means parking the toolbar its own height above the screen. `top` and
    // not a transform: a sticky offset only moves the element once it is
    // stuck, so a toolbar still in its place on the page — below the civ card,
    // say — stays put instead of jumping up over what is above it. Read when
    // the bar moves, which is the only moment the height matters.
    const stickyTop = computed(() =>
      appBarHidden.value ? `${-(toolbar.value?.offsetHeight ?? 0)}px` : "var(--v-layout-top)"
    );

    // An apply replaces the list from its start, so a reader deep in it is
    // taken back to where the results begin, just under the toolbar. That is
    // the top of the toolbar's parent — the list column — less the header.
    const scrollToResults = () => {
      const el = toolbar.value;
      const parent = el?.parentElement;
      if (!parent) return;
      const start =
        parent.getBoundingClientRect().top +
        window.scrollY +
        parseFloat(getComputedStyle(parent).paddingTop) -
        (parseFloat(getComputedStyle(el).getPropertyValue("--v-layout-top")) || 0);
      if (window.scrollY > start) window.scrollTo({ top: start, behavior: "instant" });
    };

    const openSheet = () => {
      draft.value = { ...appliedConfig.value };
      sheetOpen.value = true;
    };

    // Closed by ✕, the scrim, a swipe or Back, the sheet drops its draft: the
    // toolbar's chips must show what is applied the next time they are seen.
    watch(sheetOpen, (open) => {
      if (!open) draft.value = { ...appliedConfig.value };
    });

    const draftHasFilters = computed(() => {
      const d = draft.value;
      return !!(
        (d.civs && props.context !== "civ-locked") ||
        d.creator ||
        d.seasons?.length ||
        d.maps?.length ||
        d.strategies?.length
      );
    });

    // Clears the filters only. The sort is not in the sheet, and clearing
    // something the reader cannot see would be a surprise. A field already
    // empty is left alone: rewriting null as the default's undefined would
    // mark it changed.
    const clearDraft = () => {
      const def = getDefaultConfig();
      const d = draft.value;
      if (d.civs && props.context !== "civ-locked") d.civs = def.civs;
      if (d.creator) d.creator = def.creator;
      if (d.seasons?.length) d.seasons = def.seasons;
      if (d.maps?.length) d.maps = def.maps;
      if (d.strategies?.length) d.strategies = def.strategies;
    };

    const applyLabel = computed(() => {
      const n = isDirty.value ? previewCount.value : count.value;
      if (isDirty.value && previewLoading.value) return "Counting…";
      if (n === null || n === undefined) return "Show results";
      return `Show ${n} ${n === 1 ? "result" : "results"}`;
    });

    // Unchanged, the button only closes the sheet: applying would reload a
    // list that is already showing exactly this.
    //
    // The scroll waits for the sheet to be gone. While open it locks the page
    // and, on closing, puts back the position it locked at — so a scroll made
    // at the moment of applying was undone, and the reader stayed deep in a
    // list that had just been replaced.
    let scrollWhenGone = false;
    const applySheet = () => {
      scrollWhenGone = isDirty.value;
      if (scrollWhenGone) handleApply();
      sheetOpen.value = false;
    };
    const onSheetGone = () => {
      if (scrollWhenGone) scrollToResults();
      scrollWhenGone = false;
    };

    const applySort = (orderBy) => {
      if (orderBy === appliedConfig.value.orderBy) return;
      draft.value = { ...appliedConfig.value, orderBy };
      handleApply();
      scrollToResults();
    };

    const removeApplied = (chip) => {
      draft.value = { ...appliedConfig.value };
      onRemoveChip(chip);
      handleApply();
      scrollToResults();
    };

    // The last chip went by keyboard; the Filters button is the next control.
    const focusFiltersBtn = () => filtersBtn.value?.$el.focus();

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
      focusAfterChips,
      card,
      applyBar,
      previewCount,
      previewLoading,
      smAndDown,
      toolbar,
      filtersBtn,
      sheetOpen,
      sheetTitleId,
      noneDirty,
      chipFacets,
      activeCount,
      sortTitle,
      stickyTop,
      openSheet,
      draftHasFilters,
      clearDraft,
      applyLabel,
      applySheet,
      onSheetGone,
      applySort,
      removeApplied,
      focusFiltersBtn,
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
  /* Gold, which accent is not on the light theme — there it carries text and
     is slate, and a slate dot would sink into the slate controls around it,
     which is exactly what this dot exists to stand out from. gold-ink rather
     than the fill gold: the dot is the only sign a filter is active, so as a
     non-text mark it needs 3:1, and the fill gold is 1.6:1 on the light
     surface. */
  background: rgb(var(--v-theme-gold-ink));
  flex-shrink: 0;
  align-self: center;
}

/* Full-bleed: the negative margin undoes the 16px a v-container and a v-col
   leave on either side at phone widths (container 16, row -12, column 12), so
   the list scrolls under the toolbar rather than past its edges, and the rows
   put the gutter back inside. The page's own background, so at rest it reads
   as part of the page rather than as one more card. Below the app bar
   (z-index 1004) so it slides out from under the bar, not over it. */
.fl-toolbar {
  position: sticky;
  z-index: 4;
  margin: 0 -16px 12px;
  background: rgb(var(--v-theme-background));
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  /* The app bar's own timing (VToolbar.css), so the two move as one. */
  transition: top 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.fl-toolbar-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 56px;
  padding: 0 16px;
}

/* Drawn 36px tall; the hit area reaches 44 inside the row's height. ::before,
   because a v-btn's ::after is its focus ring and has pointer events off. */
.fl-toolbar-btn::before {
  content: "";
  position: absolute;
  inset: -4px 0;
}

.fl-toolbar-btn {
  min-width: 0;
  flex-shrink: 1;
  text-transform: none;
  letter-spacing: normal;
}

/* A long sort name gives way before the buttons do. */
.fl-toolbar-btn :deep(.v-btn__content) {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.fl-toolbar-count {
  flex: 1 1 auto;
  min-width: 0;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  font-size: 12px;
  color: rgba(var(--v-theme-on-background), var(--v-medium-emphasis-opacity));
}

/* With no sort to sit between (the civ page), the count takes the end. */
.fl-toolbar-count--end {
  text-align: end;
}

/* From md up: the list's header, not a toolbar. Nothing hides the app bar on
   desktop and the fields are in the sidebar, so it neither sticks nor bleeds
   to the edges; it lines up with the cards under it. With no Filters button
   before it, the count opens the row. */
.fl-toolbar--header {
  position: static;
  margin: 0 0 8px;
  background: transparent;
}

/* No height of its own: the row is the button's height, so the Sort box's
   top is the column's top, level with the sidebar card's. The gap to the
   rule goes below. */
.fl-toolbar--header .fl-toolbar-row {
  min-height: 0;
  padding: 0 0 8px;
}

.fl-toolbar-count--start {
  text-align: start;
}

/* As a header it is the list's title, not a toolbar's aside: the size and
   emphasis of the sidebar card's body text rather than a 12px caption. */
.fl-toolbar--header .fl-toolbar-count {
  font-size: 14px;
  color: rgba(var(--v-theme-on-background), var(--v-high-emphasis-opacity));
}

.fl-sheet-header {
  display: flex;
  align-items: center;
  gap: 6px;
  min-height: 56px;
  padding: 4px 4px 4px 20px;
}

.fl-sheet-body {
  padding-top: 20px !important;
}

/* The same label a select draws, for the fields that are chips instead. */
.fl-facet-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
}

.fl-facet + .fl-facet {
  margin-top: 8px;
}

/* Drawn 32px tall with a 44px hit area: the overhang needs 12px between
   wrapped rows so neighbouring rows' areas do not overlap (FilterChips does
   the same at its own size). v-chip clips its children, so the clip moves to
   the label. */
.fl-facet-chip {
  overflow: visible;
  margin-block: 6px;
}

.fl-facet-chip::before {
  content: "";
  position: absolute;
  inset: -6px 0;
}

.fl-facet-chip :deep(.v-chip__content) {
  min-width: 0;
  overflow: hidden;
}

/* Clear of the home indicator on phones without a button bar. */
.fl-sheet-footer {
  display: flex;
  gap: 8px;
  padding: 12px 16px calc(12px + env(safe-area-inset-bottom));
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
</style>
