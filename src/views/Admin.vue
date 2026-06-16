<template>
  <v-container>
    <div
      v-if="authIsReady && isAdmin"
      class="d-flex justify-center"
    >
      <v-row align="center" justify="center">
        <!-- Main Content -->
        <v-col cols="12" sm="9" align-self="start">
          <v-card flat rounded="lg" class="mb-6 pa-2">
            <div class="d-flex align-center justify-space-between pa-4 pb-2">
              <span class="text-subtitle-1 font-weight-medium">Sync Data with AOE4WORLD</span>
              <v-btn
                v-if="syncPhase === 'idle'"
                color="primary"
                variant="tonal"
                size="small"
                prepend-icon="mdi-play"
                @click="startSync()"
              >Run</v-btn>
              <div v-if="syncPhase === 'preview'" class="d-flex align-center" style="gap: 8px">
                <v-btn
                  v-if="canSaveAny"
                  color="primary"
                  variant="tonal"
                  size="small"
                  prepend-icon="mdi-download-multiple"
                  @click="saveAll()"
                >Save All</v-btn>
                <v-btn
                  variant="text"
                  size="small"
                  prepend-icon="mdi-refresh"
                  @click="resetSync()"
                >New Sync</v-btn>
              </div>
            </div>

            <!-- fetching: per-source progress chips -->
            <div v-if="syncPhase === 'fetching'" class="px-4 pb-4">
              <p class="text-body-2 text-center mb-3">Fetching from AOE4World…</p>
              <div
                v-for="source in ['units', 'buildings', 'technologies', 'abilities']"
                :key="source"
                class="d-flex align-center justify-space-between mb-2"
              >
                <span class="text-body-2 text-capitalize">{{ source }}</span>
                <v-chip
                  :color="fetchStatus[source] === 'success' ? 'success' : fetchStatus[source] === 'error' ? 'error' : 'grey'"
                  size="small"
                  variant="tonal"
                >
                  {{ fetchStatus[source] === 'success' ? '✓' : fetchStatus[source] === 'error' ? '✗' : '···' }}
                </v-chip>
              </div>
            </div>

            <!-- preview: collapsible per-category panels -->
            <div v-if="syncPhase === 'preview'" class="pb-2">
              <v-expansion-panels variant="accordion" multiple v-model="openPanels">
                <v-expansion-panel
                  v-for="category in categoryResults"
                  :key="category.key"
                  :value="category.key"
                >
                  <v-expansion-panel-title>
                    <div class="d-flex align-center" style="gap: 8px; min-width: 0; flex: 1; padding-right: 4px">
                      <span class="text-body-2 font-weight-medium" style="flex-shrink: 0">{{ category.key }}</span>
                      <div class="d-flex align-center flex-wrap" style="gap: 4px; flex: 1">
                        <v-chip v-if="category.errored" color="error" size="x-small" variant="tonal">fetch failed</v-chip>
                        <template v-else>
                          <v-chip color="success" size="x-small" variant="tonal">{{ category.matched.length + category.resolved.length }} matched</v-chip>
                          <v-chip v-if="category.unmatched.length" color="warning" size="x-small" variant="tonal">{{ category.unmatched.length }} unmatched</v-chip>
                          <v-chip v-if="category.skipped.length || category.previouslySkipped.some(e => e.syncSkip)" size="x-small" variant="tonal">{{ category.skipped.length + category.previouslySkipped.filter(e => e.syncSkip).length }} skipped</v-chip>
                          <v-chip v-if="category.previouslySkipped.some(e => e.deprecated)" size="x-small" variant="tonal">{{ category.previouslySkipped.filter(e => e.deprecated).length }} deprecated</v-chip>
                        </template>
                      </div>
                      <v-btn
                        v-if="!category.errored"
                        size="x-small"
                        :color="category.downloaded ? 'success' : 'primary'"
                        variant="tonal"
                        :prepend-icon="category.downloaded ? 'mdi-check' : 'mdi-download'"
                        @click.stop="downloadCategory(category)"
                        style="flex-shrink: 0"
                      >{{ category.downloaded ? 'Saved' : 'Save' }}</v-btn>
                    </div>
                  </v-expansion-panel-title>

                  <v-expansion-panel-text>
                  <div :data-category="category.key">
                    <!-- Unmatched entries -->
                    <div
                      v-for="entry in category.unmatched"
                      :key="entry.title"
                      class="d-flex align-center justify-space-between mt-2"
                    >
                      <div class="d-flex align-center" style="gap: 6px; min-width: 0">
                        <img
                          v-if="entry.imgSrc"
                          :src="entry.imgSrc"
                          width="24"
                          height="24"
                          style="object-fit: contain; flex-shrink: 0"
                        />
                        <span class="text-caption text-medium-emphasis text-truncate">{{ entry.title }}</span>
                      </div>
                      <div class="d-flex align-center" style="flex-shrink: 0; gap: 8px">
                        <v-autocomplete
                          :items="getCategorySourceItems(category)"
                          item-title="name"
                          item-value="id"
                          return-object
                          :custom-filter="filterSourceItems"
                          @update:search="q => (autocompleteSearch[category.key + ':' + entry.title] = q || '')"
                          @update:model-value="(val) => val && resolveEntry(category.key, entry, val)"
                          placeholder="Search…"
                          density="compact"
                          variant="outlined"
                          hide-details
                          style="width: 280px"
                        >
                          <template #no-data>
                            <v-list-item
                              :title="(autocompleteSearch[category.key + ':' + entry.title] || '').length >= 2 ? 'No matching items found' : 'Type 2+ characters to search'"
                              class="text-medium-emphasis"
                            />
                          </template>
                          <template #item="{ item, props }">
                            <v-list-item v-bind="props" lines="two">
                              <template #subtitle>
                                <span style="line-height: 1.6">{{ getItemSubtitle(item.raw) }}</span>
                              </template>
                              <template #prepend>
                                <img
                                  v-if="findLocalIconByName(item.raw)"
                                  :src="findLocalIconByName(item.raw)"
                                  width="24"
                                  height="24"
                                  style="object-fit: contain; margin-right: 8px; flex-shrink: 0"
                                />
                              </template>
                            </v-list-item>
                          </template>
                        </v-autocomplete>
                        <v-btn
                          variant="text"
                          size="small"
                          density="compact"
                          style="width: 56px"
                          @click="skipEntry(category.key, entry)"
                        >Skip</v-btn>
                      </div>
                    </div>

                    <!-- Resolved summary -->
                    <v-chip
                      v-if="category.resolved.length"
                      size="x-small"
                      color="info"
                      variant="tonal"
                      class="mt-2"
                    >{{ category.resolved.length }} resolved manually</v-chip>

                    <!-- Skipped group (current session + syncSkip) -->
                    <template v-if="category.skipped.length || category.previouslySkipped.some(e => e.syncSkip)">
                      <div class="text-caption text-medium-emphasis mt-3 mb-1">Skipped</div>
                      <div
                        v-for="entry in [...category.skipped, ...category.previouslySkipped.filter(e => e.syncSkip)]"
                        :key="'skip-' + entry.title"
                        class="d-flex align-center justify-space-between mt-1"
                      >
                        <div class="d-flex align-center" style="gap: 6px; min-width: 0">
                          <img v-if="entry.imgSrc" :src="entry.imgSrc" width="24" height="24" style="object-fit: contain; flex-shrink: 0; opacity: 0.45" />
                          <span class="text-caption text-medium-emphasis text-truncate" style="text-decoration: line-through">{{ entry.title }}</span>
                        </div>
                        <v-btn variant="text" size="small" density="compact" @click="unskipEntry(category.key, entry)">Unskip</v-btn>
                      </div>
                    </template>

                    <!-- Deprecated group -->
                    <template v-if="category.previouslySkipped.some(e => e.deprecated)">
                      <div class="text-caption text-medium-emphasis mt-3 mb-1">Deprecated</div>
                      <div
                        v-for="entry in category.previouslySkipped.filter(e => e.deprecated)"
                        :key="'dep-' + entry.title"
                        class="d-flex align-center justify-space-between mt-1"
                      >
                        <div class="d-flex align-center" style="gap: 6px; min-width: 0">
                          <img v-if="entry.imgSrc" :src="entry.imgSrc" width="24" height="24" style="object-fit: contain; flex-shrink: 0; opacity: 0.45" />
                          <span class="text-caption text-medium-emphasis text-truncate" style="text-decoration: line-through">{{ entry.title }}</span>
                        </div>
                        <v-btn variant="text" size="small" density="compact" @click="unskipEntry(category.key, entry)">Restore</v-btn>
                      </div>
                    </template>
                  </div>
                  </v-expansion-panel-text>
                </v-expansion-panel>
              </v-expansion-panels>
            </div>
          </v-card>
        </v-col>

      </v-row>
    </div>
  </v-container>
</template>

<script>
import { useStore } from "vuex";
import { ref, computed, onMounted, nextTick } from "vue";

import { getDefaultConfig } from "@/composables/filter/configDefaultProvider";

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
import abilityHero from "@/composables/builds/icons/json/abilityHero.json" with { type: "json" };

export default {
  name: "Admin",
  setup() {
    const store = useStore();
    const filterConfig = computed(() => store.state.filterConfig);

    // T001: Static mapping of 12 local JSON categories to their AOE4World source(s)
    const CATEGORY_CONFIG = [
      { key: "unitEco",           filename: "unitEco.json",          sourceKeys: ["units"],                     exploreType: "units",        data: unitEco },
      { key: "unitReligious",     filename: "unitReligious.json",    sourceKeys: ["units"],                     exploreType: "units",        data: unitReligious },
      { key: "unitMilitary",      filename: "unitMilitary.json",     sourceKeys: ["units"],                     exploreType: "units",        data: unitMilitary },
      { key: "unitHero",          filename: "unitHero.json",         sourceKeys: ["units"],                     exploreType: "units",        data: unitHero },
      { key: "buildingEco",       filename: "buildingEco.json",      sourceKeys: ["buildings"],                 exploreType: "buildings",    data: buildingEco },
      { key: "buildingMilitary",  filename: "buildingMilitary.json", sourceKeys: ["buildings"],                 exploreType: "buildings",    data: buildingMilitary },
      { key: "buildingReligious", filename: "buildingReligious.json",sourceKeys: ["buildings"],                 exploreType: "buildings",    data: buildingReligious },
      { key: "buildingTech",      filename: "buildingTech.json",     sourceKeys: ["buildings"],                 exploreType: "buildings",    data: buildingTech },
      { key: "landmarks",         filename: "landmarks.json",        sourceKeys: ["buildings", "technologies"], exploreType: "buildings",    data: landmarks },
      { key: "techEco",           filename: "techEco.json",          sourceKeys: ["technologies"],              exploreType: "technologies", data: techEco },
      { key: "techMilitary",      filename: "techMilitary.json",     sourceKeys: ["technologies"],              exploreType: "technologies", data: techMilitary },
      { key: "abilityHero",       filename: "abilityHero.json",      sourceKeys: ["abilities", "technologies"], exploreType: null,           data: abilityHero },
    ];

    // T002: Sync session state — ephemeral, not persisted
    const syncPhase = ref("idle"); // 'idle' | 'fetching' | 'preview'
    const fetchStatus = ref({ units: "idle", buildings: "idle", technologies: "idle", abilities: "idle" });
    const sourceData = ref({ units: null, buildings: null, technologies: null, abilities: null });
    const categoryResults = ref([]);
    const openPanels = ref([]);
    const autocompleteSearch = ref({});

    onMounted(() => {
      if (!filterConfig.value) {
        store.commit("setFilterConfig", getDefaultConfig());
      }
    });

    // T003: Pure match function — no mutation, returns matched/unmatched/previouslySkipped split
    function runMatchPass(sourceArray, localEntries) {
      const matched = [];
      const unmatched = [];
      const previouslySkipped = [];
      localEntries.forEach((entry) => {
        if (entry.deprecated || entry.syncSkip) {
          previouslySkipped.push(entry);
          return;
        }
        const match = sourceArray.find((s) => s.id === entry.id || s.name === entry.title);
        if (match) {
          matched.push({ local: entry, source: match });
        } else {
          unmatched.push(entry);
        }
      });
      return { matched, unmatched, previouslySkipped };
    }


    // T005: Phase 1 — fetch all 4 sources in parallel with per-source status, then build preview
    async function startSync() {
      syncPhase.value = "fetching";
      fetchStatus.value = { units: "idle", buildings: "idle", technologies: "idle", abilities: "idle" };
      sourceData.value = { units: null, buildings: null, technologies: null, abilities: null };

      const urls = {
        units: "https://data.aoe4world.com/units/all.json",
        buildings: "https://data.aoe4world.com/buildings/all.json",
        technologies: "https://data.aoe4world.com/technologies/all.json",
        abilities: "https://data.aoe4world.com/abilities/all.json",
      };

      await Promise.all(
        Object.keys(urls).map(async (source) => {
          fetchStatus.value[source] = "loading";
          try {
            const response = await fetch(urls[source]);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            sourceData.value[source] = data.data;
            fetchStatus.value[source] = "success";
          } catch {
            fetchStatus.value[source] = "error";
          }
        })
      );

      categoryResults.value = CATEGORY_CONFIG.map((config) => {
        const errored = config.sourceKeys.some((k) => fetchStatus.value[k] === "error");
        const localEntries = JSON.parse(JSON.stringify(config.data));

        if (errored) {
          return {
            key: config.key, filename: config.filename, sourceKeys: config.sourceKeys,
            exploreType: config.exploreType, localEntries,
            matched: [], unmatched: [], resolved: [], skipped: [], previouslySkipped: [], errored: true, downloaded: false,
          };
        }

        const sourceArray = config.sourceKeys.flatMap((k) => sourceData.value[k] || []);
        const { matched, unmatched, previouslySkipped } = runMatchPass(sourceArray, localEntries);
        return {
          key: config.key, filename: config.filename, sourceKeys: config.sourceKeys,
          exploreType: config.exploreType, localEntries,
          matched, unmatched, resolved: [], skipped: [], previouslySkipped, errored: false, downloaded: false,
        };
      });

      // Auto-open panels that need attention
      openPanels.value = categoryResults.value
        .filter((c) => c.unmatched.length > 0 || c.errored)
        .map((c) => c.key);

      syncPhase.value = "preview";
    }

    // T008: Move unmatched entries to resolved (manual mapping) or skipped
    async function resolveEntry(categoryKey, localEntry, sourceEntry) {
      const cat = categoryResults.value.find((c) => c.key === categoryKey);
      if (!cat) return;
      const idx = cat.unmatched.indexOf(localEntry);
      if (idx === -1) return;
      cat.unmatched.splice(idx, 1);
      cat.resolved.push({ local: localEntry, source: sourceEntry });

      await nextTick();
      // Focus next input in same category first, then fall back to first globally
      const next =
        document.querySelector(`[data-category="${categoryKey}"] .v-autocomplete input`) ||
        document.querySelector("[data-category] .v-autocomplete input");
      if (next) next.focus();
    }

    function skipEntry(categoryKey, localEntry) {
      const cat = categoryResults.value.find((c) => c.key === categoryKey);
      if (!cat) return;
      const idx = cat.unmatched.indexOf(localEntry);
      if (idx === -1) return;
      cat.unmatched.splice(idx, 1);
      cat.skipped.push(localEntry);
    }

    function unskipEntry(categoryKey, entry) {
      const cat = categoryResults.value.find((c) => c.key === categoryKey);
      if (!cat) return;
      const fromSkipped = cat.skipped.indexOf(entry);
      const fromPreviously = cat.previouslySkipped.indexOf(entry);
      if (fromSkipped !== -1) {
        cat.skipped.splice(fromSkipped, 1);
      } else if (fromPreviously !== -1) {
        cat.previouslySkipped.splice(fromPreviously, 1);
      } else return;

      // Try auto-match; if no match, send to unmatched and ensure panel is open
      const sourceArray = cat.sourceKeys.flatMap((k) => sourceData.value[k] || []);
      const match = sourceArray.find((s) => s.id === entry.id || s.name === entry.title);
      if (match) {
        cat.matched.push({ local: entry, source: match });
      } else {
        cat.unmatched.push(entry);
        if (!openPanels.value.includes(categoryKey)) {
          openPanels.value.push(categoryKey);
        }
      }
    }

    // T009: Autocomplete helpers — combined source items, deduplicated by id, 2-char minimum filter
    function getCategorySourceItems(category) {
      const items = category.sourceKeys.flatMap((k) => sourceData.value[k] || []);
      const seen = new Set();
      return items.filter((item) => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      });
    }

    function filterSourceItems(value, queryText) {
      if (!queryText || queryText.length < 2) return false;
      return value.toLowerCase().includes(queryText.toLowerCase());
    }

    // Cross-reference a source item back to a local entry's icon (API doesn't carry image URLs)
    function findLocalIconByName(sourceItem) {
      const nameLC = sourceItem.name?.toLowerCase();
      for (const config of CATEGORY_CONFIG) {
        const entry = config.data.find(
          (e) =>
            (e.id && (e.id === sourceItem.id || e.id === sourceItem.baseId)) ||
            (e.title && (e.title === sourceItem.name || e.title.toLowerCase() === nameLC))
        );
        if (entry?.imgSrc) return entry.imgSrc;
      }
      return null;
    }

    function getItemSubtitle(item) {
      const parts = [];
      if (item.age) parts.push(`Age ${ ['I','II','III','IV'][item.age - 1] ?? item.age }`);
      if (item.type) parts.push(item.type);
      return parts.join(' · ') || undefined;
    }

    // Enrich a single entry with AOE4World source fields (same field set as original syncData)
    function applyEnrichment(entry, source, exploreType) {
      delete entry.syncSkip;
      delete entry.deprecated;
      entry.description = source.description;
      entry.age = source.age;
      entry.id = source.id;
      entry.type = source.type;
      if (Array.isArray(entry.civ)) {
        entry.civ = entry.civ.slice().sort((a, b) => a.toUpperCase().localeCompare(b.toUpperCase()));
      }
      if (exploreType) {
        entry.exploreUrl = `https://aoe4world.com/explorer/civs/all/${exploreType}/${source.baseId}`;
      }
      if (source.costs && source.costs.total > 0) {
        entry.costs = source.costs;
      }
      if (source.influence) {
        entry.influences = source.influences;
      }
    }

    // Apply enrichment and download a single category file
    async function downloadCategory(category) {
      const enriched = JSON.parse(JSON.stringify(category.localEntries));

      category.matched.forEach(({ local, source }) => {
        const idx = category.localEntries.indexOf(local);
        if (idx !== -1) applyEnrichment(enriched[idx], source, category.exploreType);
      });

      category.resolved.forEach(({ local, source }) => {
        const idx = category.localEntries.indexOf(local);
        if (idx !== -1) applyEnrichment(enriched[idx], source, category.exploreType);
      });

      // skipped (this session) — mark syncSkip so future runs skip them without treating as deprecated
      category.skipped.forEach((local) => {
        const idx = category.localEntries.indexOf(local);
        if (idx !== -1) enriched[idx].syncSkip = true;
      });

      // previouslySkipped — already carry syncSkip:true, preserved by the deep-clone

      await downloadObjectAsJSONFile(enriched, category.filename);
      category.downloaded = true;
    }

    function resetSync() {
      syncPhase.value = "idle";
      categoryResults.value = [];
      sourceData.value = { units: null, buildings: null, technologies: null, abilities: null };
      fetchStatus.value = { units: "idle", buildings: "idle", technologies: "idle", abilities: "idle" };
      openPanels.value = [];
      autocompleteSearch.value = {};
    }

    const canSaveAny = computed(() =>
      categoryResults.value.some((c) => !c.errored && !c.downloaded)
    );

    async function saveAll() {
      const ready = categoryResults.value.filter((c) => !c.errored && !c.downloaded);
      for (const cat of ready) await downloadCategory(cat);
    }

    async function downloadObjectAsJSONFile(object, filename) {
      if (!filename.endsWith(".json")) {
        filename = `${filename}.json`;
      }
      const json = JSON.stringify(object, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const href = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = href;
      link.download = filename;
      link.position = "absolute";
      link.left = "200vw";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    return {
      authIsReady: computed(() => store.state.authIsReady),
      isAdmin: computed(() => store.state.isAdmin),
      syncPhase,
      fetchStatus,
      categoryResults,
      openPanels,
      autocompleteSearch,
      canSaveAny,
      startSync,
      resetSync,
      saveAll,
      resolveEntry,
      skipEntry,
      unskipEntry,
      getCategorySourceItems,
      filterSourceItems,
      findLocalIconByName,
      getItemSubtitle,
      downloadCategory,
    };
  },
};
</script>
