<template>
  <v-container>
    <div
      v-if="authIsReady && isAdmin"
      class="d-flex justify-center"
    >
      <v-row align="center" justify="center">
        <!-- Main Content -->
        <v-col cols="12" sm="9" align-self="start">

          <!-- ── Card 1: Sync Data ── -->
          <v-card flat rounded="lg" class="mb-6 pa-2">
            <div class="d-flex align-center justify-space-between pa-4 pb-2">
              <div class="d-flex align-center" style="gap: 6px">
                <span class="text-subtitle-1 font-weight-medium">AOE4World Sync</span>
                <v-tooltip text="Fetches units, buildings, technologies and abilities from the AOE4World API and matches them against local icon JSON files. For each match you can review the diff and save the updated entry." location="bottom" max-width="320">
                  <template #activator="{ props }">
                    <v-icon v-bind="props" size="16" color="medium-emphasis">mdi-information-outline</v-icon>
                  </template>
                </v-tooltip>
              </div>
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

          <!-- ── Card 2: Icon Gap Sync ── -->
          <v-card flat rounded="lg" class="mb-6 pa-2">
            <div class="d-flex align-center justify-space-between pa-4 pb-2">
              <div class="d-flex align-center" style="gap: 6px">
                <span class="text-subtitle-1 font-weight-medium">Icon Gap Scanner</span>
                <v-tooltip text="Scans AOE4World for items not yet represented in local icon JSON files. Detects two kinds of gaps: new items (no local entry) and civ extensions (entry exists but a specific civilization is missing). Lets you assign categories, pre-fill image folders, and download updated JSONs and a processed icon zip." location="bottom" max-width="320">
                  <template #activator="{ props }">
                    <v-icon v-bind="props" size="16" color="medium-emphasis">mdi-information-outline</v-icon>
                  </template>
                </v-tooltip>
              </div>
              <div class="d-flex align-center" style="gap: 8px">
                <v-btn
                  v-if="gapPhase === 'idle'"
                  color="primary"
                  variant="tonal"
                  size="small"
                  prepend-icon="mdi-magnify"
                  @click="startGapScan()"
                >Scan</v-btn>
                <v-btn
                  v-if="gapPhase === 'results'"
                  variant="text"
                  size="small"
                  prepend-icon="mdi-refresh"
                  @click="resetGapScan()"
                >Reset</v-btn>
              </div>
            </div>

            <!-- idle: intentionally empty -->

            <!-- scanning -->
            <div v-if="gapPhase === 'scanning'" class="px-4 pb-4 text-center">
              <v-progress-circular indeterminate size="24" class="mb-2" />
              <p class="text-body-2 text-medium-emphasis">Scanning for gaps…</p>
            </div>

            <!-- results -->
            <div v-if="gapPhase === 'results'" class="pb-2">

              <!-- Unmapped civ codes warning -->
              <div v-if="gapUnmappedCivs.length" class="px-4 pb-2">
                <v-alert type="warning" density="compact" variant="tonal">
                  Unknown civ codes — add to CIV_SLUG_MAP: <strong>{{ gapUnmappedCivs.join(', ') }}</strong>
                </v-alert>
              </div>

              <!-- Summary + filters -->
              <div class="px-4 pb-3">
                <!-- Kind filter (also acts as summary) -->
                <div class="d-flex align-center flex-wrap mb-2" style="gap: 6px">
                  <span class="text-caption text-medium-emphasis" style="flex-shrink: 0">Kind:</span>
                  <v-chip
                    v-if="gapNewCount > 0"
                    color="warning" size="small"
                    :variant="gapKindFilter.includes('new') ? 'flat' : 'tonal'"
                    style="cursor: pointer"
                    @click="toggleKindFilter('new')"
                  >{{ gapNewCount }} NEW</v-chip>
                  <v-chip
                    v-if="gapCivPlusCount > 0"
                    color="info" size="small"
                    :variant="gapKindFilter.includes('civ-extension') ? 'flat' : 'tonal'"
                    style="cursor: pointer"
                    @click="toggleKindFilter('civ-extension')"
                  >{{ gapCivPlusCount }} CIV+</v-chip>
                  <v-chip
                    v-if="gapCivMinusCount > 0"
                    color="error" size="small"
                    :variant="gapKindFilter.includes('civ-removal') ? 'flat' : 'tonal'"
                    style="cursor: pointer"
                    @click="toggleKindFilter('civ-removal')"
                  >{{ gapCivMinusCount }} CIV-</v-chip>
                  <v-chip
                    v-if="gapKindFilter.length"
                    size="small" variant="text" color="secondary"
                    style="cursor: pointer"
                    @click="gapKindFilter = []"
                  >clear</v-chip>
                </div>
                <!-- Civ filter -->
                <div class="d-flex align-center flex-wrap" style="gap: 4px">
                  <span class="text-caption text-medium-emphasis" style="flex-shrink: 0">Civ:</span>
                  <v-chip
                    size="small"
                    :variant="gapCivFilter === null ? 'flat' : 'tonal'"
                    @click="gapCivFilter = null"
                  >All</v-chip>
                  <v-chip
                    v-for="civ in gapCivOptions"
                    :key="civ"
                    size="small"
                    :variant="gapCivFilter === civ ? 'flat' : 'tonal'"
                    @click="gapCivFilter = civ"
                  >{{ CIV_DISPLAY_NAME[civ] ?? civ }}</v-chip>
                </div>
              </div>

              <!-- Fetch errors -->
              <div v-if="Object.keys(gapFetchErrors).length" class="px-4 pb-2">
                <v-alert type="error" density="compact" variant="tonal" class="mb-1"
                  v-for="(msg, src) in gapFetchErrors" :key="src"
                >{{ src }}: {{ msg }}</v-alert>
              </div>

              <!-- Empty state -->
              <div v-if="filteredGapItems.length === 0" class="px-4 pb-4 text-center">
                <template v-if="gapItems.length === 0">
                  <p v-if="gapSourceCount === 0" class="text-body-2 text-medium-emphasis">
                    No gaps found — either all items are covered or all fetches failed (see errors above).
                  </p>
                  <p v-else class="text-body-2 text-medium-emphasis">
                    All items are already covered — no gaps found.
                    <span class="text-caption d-block mt-1">({{ gapSourceCount.toLocaleString() }} (item, civ) pairs scanned)</span>
                  </p>
                </template>
                <p v-else class="text-body-2 text-medium-emphasis">
                  No gaps match the active filters.
                </p>
              </div>

              <!-- Gap list -->
              <template v-else>
                <div
                  v-for="group in visibleGapGroups"
                  :key="group.id"
                  class="d-flex align-center justify-space-between px-4 py-2"
                  style="gap: 8px; border-bottom: 1px solid rgba(128,128,128,0.12)"
                >
                  <!-- Left: kind badge + icon + name + civ chips + meta -->
                  <div class="d-flex align-center" style="gap: 6px; min-width: 0; flex: 1">
                    <v-chip
                      :color="group.kind === 'new' ? 'warning' : group.kind === 'civ-removal' ? 'error' : 'info'"
                      size="x-small"
                      variant="tonal"
                      style="flex-shrink: 0"
                    >{{ group.kind === 'new' ? 'NEW' : group.kind === 'civ-removal' ? 'CIV-' : 'CIV+' }}</v-chip>
                    <img
                      v-if="findLocalIconByName(group)"
                      :src="findLocalIconByName(group)"
                      width="20"
                      height="20"
                      style="object-fit: contain; flex-shrink: 0"
                    />
                    <img
                      v-else
                      :src="gapCdnIconUrl(group)"
                      width="20"
                      height="20"
                      style="object-fit: contain; flex-shrink: 0; opacity: 0.7"
                      @error="(e) => { e.target.style.display = 'none'; markGapNoIcon(group); }"
                    />
                    <div style="min-width: 0">
                      <div class="text-caption font-weight-medium text-truncate">{{ group.name }}</div>
                      <div class="d-flex align-center flex-wrap" style="gap: 3px">
                        <v-chip
                          v-for="item in group.allCivs"
                          :key="item.civ"
                          size="x-small"
                          variant="tonal"
                        >{{ item.civCode }}</v-chip>
                        <span class="text-caption text-medium-emphasis">{{ group.age ? '· Age ' + (['I','II','III','IV'][group.age - 1] ?? group.age) : '' }} · {{ group.type }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- Right: category + folder + status (keyed on first civ) -->
                  <div class="d-flex align-center" style="gap: 6px; flex-shrink: 0">

                    <!-- Civ-extension: show fixed category -->
                    <v-chip
                      v-if="group.kind === 'civ-extension'"
                      size="x-small"
                      variant="tonal"
                      color="success"
                    >{{ gapAssignments[group.id + ':' + group.allCivs[0].civ]?.categoryKey }}</v-chip>

                    <!-- New item: auto-suggested chip OR manual dropdown -->
                    <template v-else>
                      <v-chip
                        v-if="gapAssignments[group.id + ':' + group.allCivs[0].civ]?.confirmed"
                        size="x-small"
                        variant="tonal"
                        color="primary"
                      >{{ gapAssignments[group.id + ':' + group.allCivs[0].civ]?.categoryKey }}</v-chip>
                      <v-select
                        v-else
                        :model-value="gapAssignments[group.id + ':' + group.allCivs[0].civ]?.categoryKey || null"
                        :items="gapCategoryKeys"
                        placeholder="Assign…"
                        density="compact"
                        variant="outlined"
                        hide-details
                        style="width: 160px"
                        @update:model-value="(val) => val && confirmGroupCategory(group, val)"
                      />
                    </template>

                    <!-- Image folder — new items only (first civ representative) -->
                    <template v-if="group.kind === 'new'">
                      <v-chip
                        v-if="gapAssignments[group.id + ':' + group.allCivs[0].civ]?.imageFolder"
                        size="x-small"
                        variant="tonal"
                      >{{ gapAssignments[group.id + ':' + group.allCivs[0].civ]?.imageFolder }}</v-chip>
                      <v-text-field
                        v-else
                        :model-value="gapAssignments[group.id + ':' + group.allCivs[0].civ]?.imageFolderInput"
                        placeholder="folder…"
                        density="compact"
                        variant="outlined"
                        hide-details
                        style="width: 150px"
                        @update:model-value="(val) => setImageFolder(group.id + ':' + group.allCivs[0].civ, val)"
                        @blur="(e) => confirmImageFolder(group.id + ':' + group.allCivs[0].civ, e.target.value)"
                      />
                    </template>

                    <!-- Per-item image status (first civ representative) -->
                    <v-progress-circular
                      v-if="gapImageStatus[group.id + ':' + group.allCivs[0].civ] === 'processing'"
                      indeterminate size="16" width="2"
                    />
                    <v-chip
                      v-else-if="gapImageStatus[group.id + ':' + group.allCivs[0].civ] === 'done'"
                      size="x-small" color="success" variant="tonal"
                    >✓ image</v-chip>
                    <v-chip
                      v-else-if="gapImageStatus[group.id + ':' + group.allCivs[0].civ] === 'exists'"
                      size="x-small" variant="tonal"
                    >icon exists</v-chip>
                    <v-chip
                      v-else-if="gapImageStatus[group.id + ':' + group.allCivs[0].civ] === 'error'"
                      size="x-small" color="error" variant="tonal"
                      :title="gapImageErrors[group.id + ':' + group.allCivs[0].civ]"
                    >error</v-chip>

                    <!-- Per-item icon download (new items with CDN icon only) -->
                    <v-btn
                      v-if="group.kind === 'new' && group.icon"
                      :loading="gapGroupDownloading[group.id + ':' + group.kind]"
                      icon="mdi-download"
                      size="x-small"
                      variant="text"
                      title="Download icon as WebP"
                      @click="downloadGroupImage(group)"
                    />

                    <!-- Per-item copy JSON -->
                    <v-btn
                      :icon="gapGroupCopied[group.id + ':' + group.kind] ? 'mdi-check' : 'mdi-content-copy'"
                      :color="gapGroupCopied[group.id + ':' + group.kind] ? 'success' : undefined"
                      size="x-small"
                      variant="text"
                      title="Copy JSON entry to clipboard"
                      @click="copyGroupJson(group)"
                    />
                    <v-btn
                      icon="mdi-eye-off-outline"
                      size="x-small"
                      variant="text"
                      title="Ignore this item (add to syncIgnore.json)"
                      @click="skipGapItem(group)"
                    />
                  </div>
                </div>

                <!-- Skipped: no CDN icon found -->
                <template v-if="visibleSkippedGroups.length">
                  <div class="px-4 pt-3 pb-1 text-caption text-medium-emphasis" style="border-top: 1px solid rgba(128,128,128,0.12)">
                    No icon found — skipped ({{ visibleSkippedGroups.length }})
                  </div>
                  <div
                    v-for="group in visibleSkippedGroups"
                    :key="group.id"
                    class="d-flex align-center justify-space-between px-4 py-2"
                    style="gap: 8px; border-bottom: 1px solid rgba(128,128,128,0.12); opacity: 0.6"
                  >
                    <div class="d-flex align-center" style="gap: 6px; min-width: 0; flex: 1">
                      <v-chip
                        :color="group.kind === 'new' ? 'warning' : group.kind === 'civ-removal' ? 'error' : 'info'"
                        size="x-small"
                        variant="tonal"
                        style="flex-shrink: 0"
                      >{{ group.kind === 'new' ? 'NEW' : group.kind === 'civ-removal' ? 'CIV-' : 'CIV+' }}</v-chip>
                      <div style="min-width: 0">
                        <div class="text-caption font-weight-medium text-truncate">{{ group.name }}</div>
                        <div class="d-flex align-center flex-wrap" style="gap: 3px">
                          <v-chip
                            v-for="item in group.allCivs"
                            :key="item.civ"
                            size="x-small"
                            variant="tonal"
                          >{{ item.civCode }}</v-chip>
                          <span class="text-caption text-medium-emphasis">{{ group.age ? '· Age ' + (['I','II','III','IV'][group.age - 1] ?? group.age) : '' }} · {{ group.type }}</span>
                        </div>
                      </div>
                    </div>
                    <div class="d-flex align-center" style="gap: 6px; flex-shrink: 0">
                      <v-chip
                        v-if="group.kind === 'civ-extension'"
                        size="x-small" variant="tonal" color="success"
                      >{{ gapAssignments[group.id + ':' + group.allCivs[0].civ]?.categoryKey }}</v-chip>
                      <template v-else>
                        <v-chip
                          v-if="gapAssignments[group.id + ':' + group.allCivs[0].civ]?.confirmed"
                          size="x-small" variant="tonal" color="primary"
                        >{{ gapAssignments[group.id + ':' + group.allCivs[0].civ]?.categoryKey }}</v-chip>
                        <v-select
                          v-else
                          :model-value="gapAssignments[group.id + ':' + group.allCivs[0].civ]?.categoryKey || null"
                          :items="gapCategoryKeys"
                          placeholder="Assign…"
                          density="compact"
                          variant="outlined"
                          hide-details
                          style="width: 160px"
                          @update:model-value="(val) => val && confirmGroupCategory(group, val)"
                        />
                      </template>
                      <v-btn
                        :icon="gapGroupCopied[group.id + ':' + group.kind] ? 'mdi-check' : 'mdi-content-copy'"
                        :color="gapGroupCopied[group.id + ':' + group.kind] ? 'success' : undefined"
                        size="x-small"
                        variant="text"
                        title="Copy JSON entry to clipboard"
                        @click="copyGroupJson(group)"
                      />
                      <v-btn
                        icon="mdi-eye-off-outline"
                        size="x-small"
                        variant="text"
                        title="Ignore this item (add to syncIgnore.json)"
                        @click="skipGapItem(group)"
                      />
                    </div>
                  </div>
                </template>

                <!-- Ignored items -->
                <template v-if="ignoredGroups.length">
                  <div class="px-4 pt-3 pb-1 text-caption text-medium-emphasis" style="border-top: 1px solid rgba(128,128,128,0.12)">
                    Ignored ({{ ignoredGroups.length }})
                  </div>
                  <div
                    v-for="group in ignoredGroups"
                    :key="'ignored-' + group.id"
                    class="d-flex align-center justify-space-between px-4 py-2"
                    style="gap: 8px; border-bottom: 1px solid rgba(128,128,128,0.12); opacity: 0.45"
                  >
                    <div class="d-flex align-center" style="gap: 6px; min-width: 0; flex: 1">
                      <v-chip
                        :color="group.kind === 'new' ? 'warning' : group.kind === 'civ-removal' ? 'error' : 'info'"
                        size="x-small"
                        variant="tonal"
                        style="flex-shrink: 0"
                      >{{ group.kind === 'new' ? 'NEW' : group.kind === 'civ-removal' ? 'CIV-' : 'CIV+' }}</v-chip>
                      <div style="min-width: 0">
                        <div class="text-caption font-weight-medium text-truncate" style="text-decoration: line-through">{{ group.name }}</div>
                        <div class="d-flex align-center flex-wrap" style="gap: 3px">
                          <v-chip
                            v-for="item in group.allCivs"
                            :key="item.civ"
                            size="x-small"
                            variant="tonal"
                          >{{ item.civCode }}</v-chip>
                          <span class="text-caption text-medium-emphasis">{{ group.age ? '· Age ' + (['I','II','III','IV'][group.age - 1] ?? group.age) : '' }} · {{ group.type }}</span>
                        </div>
                      </div>
                    </div>
                    <v-btn
                      icon="mdi-eye-outline"
                      size="x-small"
                      variant="text"
                      title="Restore to gap list"
                      @click="unskipGapItem(group.id)"
                    />
                  </div>
                </template>

                <!-- Footer actions -->
                <div class="d-flex align-center justify-end pa-4" style="gap: 8px; flex-wrap: wrap">
                  <v-chip
                    v-if="Object.values(gapJsonSaved).some(v => v)"
                    size="x-small" color="success" variant="tonal"
                  >JSONs saved</v-chip>
                  <v-btn
                    v-if="canDownloadJsons"
                    color="primary" variant="tonal" size="small"
                    prepend-icon="mdi-download"
                    @click="downloadGapJsons()"
                  >Download JSONs</v-btn>
                  <v-chip
                    v-if="gapZipSaved"
                    size="x-small" color="success" variant="tonal"
                  >zip saved</v-chip>
                  <v-chip
                    v-if="gapZipNoFiles"
                    size="x-small" color="warning" variant="tonal"
                  >no images to download</v-chip>
                  <v-btn
                    v-if="canDownloadImages"
                    :loading="gapZipProcessing"
                    color="secondary" variant="tonal" size="small"
                    prepend-icon="mdi-image-multiple"
                    @click="downloadGapImagesZip()"
                  >Download Images Zip</v-btn>
                  <v-btn
                    v-if="gapSyncIgnore.length"
                    color="secondary" variant="tonal" size="small"
                    prepend-icon="mdi-eye-off-outline"
                    @click="downloadSyncIgnore()"
                  >syncIgnore.json</v-btn>
                </div>
              </template>

            </div>
          </v-card>

          <!-- ── Card 3: Check Images ── -->
          <v-card flat rounded="lg" class="mb-6 pa-2">
            <div class="d-flex align-center justify-space-between pa-4 pb-2">
              <div class="d-flex align-center" style="gap: 6px">
                <span class="text-subtitle-1 font-weight-medium">Check Images</span>
                <v-tooltip text="Scans all local icon entries with imgSrc set and tests whether each image resolves. For broken entries, previews the replacement from AOE4World and lets you download individual images or a zip in the correct folder structure." location="bottom" max-width="320">
                  <template #activator="{ props }">
                    <v-icon v-bind="props" size="16" color="medium-emphasis">mdi-information-outline</v-icon>
                  </template>
                </v-tooltip>
              </div>
              <div class="d-flex align-center" style="gap: 8px">
                <v-btn
                  v-if="checkImgPhase === 'idle'"
                  color="primary" variant="tonal" size="small"
                  prepend-icon="mdi-image-search"
                  @click="startCheckImages()"
                >Scan</v-btn>
                <v-btn
                  v-if="checkImgPhase === 'results'"
                  variant="text" size="small"
                  prepend-icon="mdi-refresh"
                  @click="resetCheckImages()"
                >Reset</v-btn>
              </div>
            </div>

            <!-- scanning -->
            <div v-if="checkImgPhase === 'scanning'" class="px-4 pb-4 text-center">
              <v-progress-circular indeterminate size="24" class="mb-2" />
              <p class="text-body-2 text-medium-emphasis">Scanning local images…</p>
            </div>

            <!-- results -->
            <div v-if="checkImgPhase === 'results'" class="pb-2">

              <!-- Fetch errors -->
              <div v-if="Object.keys(checkImgFetchErrors).length" class="px-4 pb-2">
                <v-alert type="error" density="compact" variant="tonal" class="mb-1"
                  v-for="(msg, src) in checkImgFetchErrors" :key="src"
                >{{ src }}: {{ msg }}</v-alert>
              </div>

              <!-- Empty state -->
              <div v-if="checkImgItems.length === 0" class="px-4 pb-4 text-center">
                <p class="text-body-2 text-medium-emphasis">All images resolved — no broken icons found.</p>
              </div>

              <!-- Broken image list -->
              <template v-else>
                <div class="px-4 pb-2 text-caption text-medium-emphasis">
                  {{ checkImgItems.length }} broken icon{{ checkImgItems.length !== 1 ? 's' : '' }} found
                </div>

                <div
                  v-for="item in checkImgItems"
                  :key="item.key"
                  class="d-flex align-center justify-space-between px-4 py-2"
                  style="gap: 8px; border-bottom: 1px solid rgba(128,128,128,0.12)"
                >
                  <!-- Left: broken placeholder + CDN preview + name + path -->
                  <div class="d-flex align-center" style="gap: 8px; min-width: 0; flex: 1">
                    <div
                      style="width: 20px; height: 20px; border: 1px dashed rgba(200,50,50,0.5); border-radius: 2px; flex-shrink: 0; display: flex; align-items: center; justify-content: center"
                    >
                      <v-icon size="12" color="error">mdi-image-broken-variant</v-icon>
                    </div>
                    <img
                      v-if="item.icon"
                      :src="item.icon"
                      width="20"
                      height="20"
                      style="object-fit: contain; flex-shrink: 0; opacity: 0.85"
                    />
                    <div style="min-width: 0">
                      <div class="text-caption font-weight-medium text-truncate">{{ item.entry.title }}</div>
                      <div class="d-flex align-center flex-wrap" style="gap: 4px">
                        <v-chip size="x-small" variant="tonal">{{ item.config.key }}</v-chip>
                        <span class="text-caption text-medium-emphasis text-truncate" style="max-width: 260px">{{ item.entry.imgSrc }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- Right: single download or warning -->
                  <div class="d-flex align-center" style="gap: 6px; flex-shrink: 0">
                    <v-btn
                      v-if="item.icon"
                      :loading="checkImgDownloading[item.key]"
                      icon="mdi-download"
                      size="x-small"
                      variant="text"
                      title="Download replacement image as WebP"
                      @click="downloadCheckImage(item)"
                    />
                    <v-chip v-else size="x-small" color="warning" variant="tonal">no CDN icon</v-chip>
                  </div>
                </div>

                <!-- Footer -->
                <div class="d-flex align-center justify-end pa-4" style="gap: 8px; flex-wrap: wrap">
                  <v-chip v-if="checkImgZipSaved" size="x-small" color="success" variant="tonal">zip saved</v-chip>
                  <v-chip v-if="checkImgZipNoFiles" size="x-small" color="warning" variant="tonal">no images to download</v-chip>
                  <v-btn
                    v-if="checkImgItems.some(i => i.icon)"
                    :loading="checkImgZipProcessing"
                    color="secondary" variant="tonal" size="small"
                    prepend-icon="mdi-image-multiple"
                    @click="downloadCheckImagesZip()"
                  >Download Images Zip</v-btn>
                </div>
              </template>

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
import JSZip from "jszip";

import { getDefaultConfig } from "@/composables/filter/configDefaultProvider";
import { getCivById } from "@/composables/filter/civDefaultProvider";

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
import syncIgnoreData from "@/composables/builds/icons/json/syncIgnore.json" with { type: "json" };

export default {
  name: "Admin",
  setup() {
    const store = useStore();
    const filterConfig = computed(() => store.state.filterConfig);

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

    // ── Sync pipeline state ──────────────────────────────────────────────────
    const syncPhase = ref("idle");
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

      openPanels.value = categoryResults.value
        .filter((c) => c.unmatched.length > 0 || c.errored)
        .map((c) => c.key);

      syncPhase.value = "preview";
    }

    async function resolveEntry(categoryKey, localEntry, sourceEntry) {
      const cat = categoryResults.value.find((c) => c.key === categoryKey);
      if (!cat) return;
      const idx = cat.unmatched.indexOf(localEntry);
      if (idx === -1) return;
      cat.unmatched.splice(idx, 1);
      cat.resolved.push({ local: localEntry, source: sourceEntry });

      await nextTick();
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

      category.skipped.forEach((local) => {
        const idx = category.localEntries.indexOf(local);
        if (idx !== -1) enriched[idx].syncSkip = true;
      });

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

    // === ICON GAP SYNC =========================================================

    // T002 — AOE4World civ code → local 3-letter code
    // Codes come from item.civs[] in the API response.
    const CIV_SLUG_MAP = {
      ab:  "ABB",  // abbasid
      ay:  "AYY",  // ayyubids
      by:  "BYZ",  // byzantines
      ch:  "CHI",  // chinese
      de:  "DEL",  // delhi
      en:  "ENG",  // english
      fr:  "FRE",  // french
      gol: "GOH",  // golden horde
      hr:  "HRE",  // hre
      ja:  "JAP",  // japanese
      je:  "JDA",  // jeanne d'arc
      jin: "JIN",  // jin dynasty
      hl:  "HOL",  // house of lancaster
      mac: "MAC",  // macedonian dynasty
      ma:  "MAL",  // malians
      mo:  "MON",  // mongols
      od:  "DRA",  // order of the dragon
      ot:  "OTT",  // ottomans
      ru:  "RUS",  // rus
      kt:  "KTE",  // knights templar
      sen: "SEN",  // sengoku
      tug: "TUG",  // tughluq sultanate
      zx:  "ZXL",  // zhuxi legacists
    };

    // API short code → folder suffix used in public/assets/pictures/ (e.g. "hl" → "lancaster")
    const CIV_FOLDER_SLUG = {
      ab:  "abbasid",      ay:  "ayyubids",     by:  "byzantines",
      ch:  "chinese",      de:  "delhi",        en:  "english",
      fr:  "french",       gol: "golden_horde", hr:  "hre",
      ja:  "japanese",     je:  "jeanne",       jin: "jin",
      hl:  "lancaster",    mac: "macedonian",   ma:  "malians",
      mo:  "mongols",      od:  "dragon",       ot:  "ottomans",
      ru:  "rus",          kt:  "templar",      sen: "sengoku",
      tug: "tughluq",      zx:  "zhuxi",
    };

    // API short code → full display name (e.g. "ab" → "Abbasid Dynasty")
    const CIV_DISPLAY_NAME = Object.fromEntries(
      Object.entries(CIV_SLUG_MAP).map(([short, code]) => [short, getCivById(code)?.title ?? short])
    );

    const TYPE_PLURAL = { unit: "units", building: "buildings", technology: "technologies", ability: "abilities" };

    function toggleKindFilter(kind) {
      const cur = gapKindFilter.value;
      gapKindFilter.value = cur.includes(kind) ? cur.filter((k) => k !== kind) : [...cur, kind];
    }

    function gapCdnIconUrl(gap) {
      return gap.icon ?? null;
    }

    // T003 — Gap sync state
    const gapPhase         = ref("idle");  // 'idle' | 'scanning' | 'results'
    const gapItems         = ref([]);
    const gapSourceCount   = ref(0);       // how many (item, civ) pairs were scanned
    const gapUnmappedCivs  = ref([]);      // civ short codes not in CIV_SLUG_MAP
    const gapFetchErrors   = ref({});      // { [source]: errorMessage }
    const gapCivFilter   = ref(null);
    const gapKindFilter  = ref([]);   // [] = show all; else only matching kinds
    const gapAssignments = ref({});      // { [gapKey]: { categoryKey, autoSuggested, confirmed, imageFolder, imageFolderInput, imgSrc } }
    const gapImageStatus = ref({});      // { [gapKey]: 'pending'|'processing'|'done'|'exists'|'skipped'|'error' }
    const gapImageErrors = ref({});
    const gapJsonSaved   = ref({});
    const gapZipSaved        = ref(false);
    const gapZipProcessing   = ref(false);
    const gapZipNoFiles      = ref(false);
    const gapGroupDownloading = ref({});
    const gapGroupCopied     = ref({});
    const gapSyncIgnore      = ref([...syncIgnoreData]);

    // T004 — Derived computeds
    const filteredGapItems = computed(() => {
      let items = gapItems.value;
      if (gapSyncIgnore.value.length) {
        const ignoredSet = new Set(gapSyncIgnore.value);
        items = items.filter((g) => !ignoredSet.has(g.id));
      }
      if (gapCivFilter.value) items = items.filter((g) => g.civ === gapCivFilter.value);
      if (gapKindFilter.value.length) items = items.filter((g) => gapKindFilter.value.includes(g.kind));
      return items;
    });

    const gapCivOptions = computed(() => {
      const ignoredSet = new Set(gapSyncIgnore.value);
      return [...new Set(gapItems.value.filter((g) => !ignoredSet.has(g.id)).map((g) => g.civ))].sort();
    });

    const canDownloadJsons = computed(() =>
      gapItems.value.some((g) => gapAssignments.value[g.id + ":" + g.civ]?.confirmed)
    );

    const canDownloadImages = computed(() =>
      gapItems.value.some((g) => {
        const a = gapAssignments.value[g.id + ":" + g.civ];
        return a?.confirmed && g.kind === "new" && a.imageFolder;
      })
    );

    const gapCategoryKeys = CATEGORY_CONFIG.map((c) => c.key);

    // Items whose CDN icon could not be found (all age suffixes tried)
    const gapNoIconKeys = ref({});

    function markGapNoIcon(group) {
      const update = {};
      for (const item of group.allCivs) update[item.id + ":" + item.civ] = true;
      gapNoIconKeys.value = { ...gapNoIconKeys.value, ...update };
    }

    function groupGapItems(items) {
      const groups = new Map();
      for (const item of items) {
        const key = item.id + ":" + item.kind;
        if (!groups.has(key)) {
          groups.set(key, { ...item, allCivs: [item] });
        } else {
          groups.get(key).allCivs.push(item);
        }
      }
      return [...groups.values()];
    }

    const filteredGapGroups = computed(() =>
      groupGapItems(filteredGapItems.value.filter((g) => !gapNoIconKeys.value[g.id + ":" + g.civ]))
    );

    const filteredSkippedGroups = computed(() =>
      groupGapItems(filteredGapItems.value.filter((g) => gapNoIconKeys.value[g.id + ":" + g.civ]))
    );

    const visibleGapGroups = filteredGapGroups;
    const visibleSkippedGroups = filteredSkippedGroups;

    const ignoredGroups = computed(() => {
      if (!gapSyncIgnore.value.length) return [];
      const ignoredSet = new Set(gapSyncIgnore.value);
      return groupGapItems(gapItems.value.filter((g) => ignoredSet.has(g.id)));
    });

    const gapNewCount = computed(() => {
      const ignoredSet = new Set(gapSyncIgnore.value);
      return new Set(gapItems.value.filter((g) => g.kind === "new" && !ignoredSet.has(g.id)).map((g) => g.id)).size;
    });
    const gapCivPlusCount = computed(() => {
      const ignoredSet = new Set(gapSyncIgnore.value);
      return new Set(gapItems.value.filter((g) => g.kind === "civ-extension" && !ignoredSet.has(g.id)).map((g) => g.id)).size;
    });
    const gapCivMinusCount = computed(() => {
      const ignoredSet = new Set(gapSyncIgnore.value);
      return new Set(gapItems.value.filter((g) => g.kind === "civ-removal" && !ignoredSet.has(g.id)).map((g) => g.id)).size;
    });

    function confirmGroupCategory(group, categoryKey) {
      for (const item of group.allCivs) {
        const key = item.id + ":" + item.civ;
        if (!gapAssignments.value[key]) initAssignment(item);
        gapAssignments.value[key] = { ...gapAssignments.value[key], categoryKey, confirmed: true, autoSuggested: false };
      }
    }

    // T005 — Gap detection
    // Unified endpoint format: each item appears once with civs: [...] listing all its civs.
    // civCountById pre-pass is kept for robustness in case any source mixes formats.
    function buildGapList(sourceData) {
      const allSourceItems = [
        ...(sourceData.units || []),
        ...(sourceData.buildings || []),
        ...(sourceData.technologies || []),
        ...(sourceData.abilities || []),
      ];

      // Count unique civs per item id across all per-civ entries
      const civCountById = new Map();
      for (const item of allSourceItems) {
        for (const civShort of (item.civs ?? [])) {
          if (!civCountById.has(item.id)) civCountById.set(item.id, new Set());
          civCountById.get(item.id).add(civShort);
        }
      }

      const localAll = CATEGORY_CONFIG.flatMap((c) => c.data);
      const seen = new Set();
      const gaps = [];
      const unmappedCivs = new Set();
      let scanned = 0;

      for (const sourceItem of allSourceItems) {
        const civs = sourceItem.civs ?? [];
        if (!civs.length) continue;

        const civCount = civCountById.get(sourceItem.id)?.size ?? civs.length;
        const typePlural = TYPE_PLURAL[sourceItem.type] || sourceItem.type + "s";
        const exploreUrl = `https://aoe4world.com/explorer/civs/all/${typePlural}/${sourceItem.baseId || sourceItem.id}`;

        // Collect ALL matching local entries — same item can have multiple entries
        // with civ-specific icons (e.g. two Longbowman entries: one BYZ, one ENG).
        const nameLC = sourceItem.name?.toLowerCase();
        const localEntries = localAll.filter((e) => {
          if (e.id) {
            if (e.id === sourceItem.id) return true;
            // local ids carry an age suffix (e.g. "palisade-1"); strip it to compare against baseId
            const eBaseId = e.id.replace(/-\d+$/, "");
            if (eBaseId === sourceItem.baseId || eBaseId === sourceItem.id) return true;
          }
          if (e.title && nameLC) {
            if (e.title === sourceItem.name) return true;
            if (e.title.toLowerCase() === nameLC) return true;
          }
          return false;
        });

        for (const civShort of civs) {
          const gapKey = sourceItem.id + ":" + civShort;
          if (seen.has(gapKey)) continue;
          seen.add(gapKey);

          const civCode = CIV_SLUG_MAP[civShort];
          if (!civCode) { unmappedCivs.add(civShort); continue; }
          scanned++;

          // Check if ANY existing entry already covers this civ
          const coveredEntry = localEntries.find(
            (e) => Array.isArray(e.civ) && e.civ.includes(civCode)
          );
          if (coveredEntry) continue;

          if (localEntries.length === 0) {
            gaps.push({
              id: sourceItem.id, baseId: sourceItem.baseId || sourceItem.id,
              name: sourceItem.name, type: sourceItem.type, age: sourceItem.age,
              icon: sourceItem.icon || null,
              civ: civShort, civCode, civCount,
              description: sourceItem.description || "",
              costs: sourceItem.costs ?? sourceItem.variations?.[0]?.costs ?? null,
              exploreUrl,
              kind: "new", localEntry: null, localCategory: null,
            });
          } else {
            // Use the first existing entry as the anchor for the civ-extension
            const localEntry = localEntries[0];
            const localCat = CATEGORY_CONFIG.find((c) => c.data.includes(localEntry));
            gaps.push({
              id: sourceItem.id, baseId: sourceItem.baseId || sourceItem.id,
              name: sourceItem.name, type: sourceItem.type, age: sourceItem.age,
              icon: sourceItem.icon || null,
              civ: civShort, civCode, civCount,
              description: sourceItem.description || "",
              costs: sourceItem.costs ?? sourceItem.variations?.[0]?.costs ?? null,
              exploreUrl,
              kind: "civ-extension", localEntry, localCategory: localCat,
            });
          }
        }
      }

      // CIV- detection: local civ assignments not supported by AOE4World
      // Build lookup: source baseId → { sourceItem, Set<civCode> }
      const sourceByBaseId = new Map();
      for (const sourceItem of allSourceItems) {
        const key = sourceItem.baseId || sourceItem.id;
        if (!sourceByBaseId.has(key)) {
          sourceByBaseId.set(key, { sourceItem, civCodes: new Set() });
        }
        for (const c of (sourceItem.civs ?? [])) {
          const code = CIV_SLUG_MAP[c];
          if (code) sourceByBaseId.get(key).civCodes.add(code);
        }
      }
      const sourceByName = new Map(
        [...sourceByBaseId.values()].map(({ sourceItem }) => [sourceItem.name?.toLowerCase(), sourceItem])
      );

      for (const localEntry of localAll) {
        if (!Array.isArray(localEntry.civ) || localEntry.civ.length === 0) continue;

        const localBaseId = localEntry.id?.replace(/-\d+$/, "") ?? localEntry.id;
        const match = sourceByBaseId.get(localEntry.id)
          ?? sourceByBaseId.get(localBaseId)
          ?? (localEntry.title ? (() => {
               const s = sourceByName.get(localEntry.title.toLowerCase());
               return s ? sourceByBaseId.get(s.baseId || s.id) : undefined;
             })() : undefined);
        if (!match) continue;

        const { sourceItem, civCodes: aoe4CivCodes } = match;
        const typePlural = TYPE_PLURAL[sourceItem.type] || sourceItem.type + "s";
        const exploreUrl = `https://aoe4world.com/explorer/civs/all/${typePlural}/${sourceItem.baseId || sourceItem.id}`;

        for (const localCivCode of localEntry.civ) {
          if (aoe4CivCodes.has(localCivCode)) continue;
          const civShort = Object.entries(CIV_SLUG_MAP).find(([, v]) => v === localCivCode)?.[0];
          if (!civShort) continue;
          const gapKey = "civ-:" + (localEntry.id || sourceItem.id) + ":" + civShort;
          if (seen.has(gapKey)) continue;
          seen.add(gapKey);
          const localCat = CATEGORY_CONFIG.find((c) => c.data.includes(localEntry));
          gaps.push({
            id: localEntry.id || sourceItem.id,
            baseId: sourceItem.baseId || sourceItem.id,
            name: localEntry.title || sourceItem.name,
            type: sourceItem.type, age: sourceItem.age, icon: sourceItem.icon || null,
            civ: civShort, civCode: localCivCode, civCount: sourceItem.civs?.length ?? 0,
            description: sourceItem.description || "", costs: sourceItem.costs ?? sourceItem.variations?.[0]?.costs ?? null,
            exploreUrl,
            kind: "civ-removal", localEntry, localCategory: localCat,
          });
        }
      }

      gapSourceCount.value = scanned;
      gapUnmappedCivs.value = [...unmappedCivs].sort();
      if (unmappedCivs.size) {
        console.warn("[gap-sync] unmapped civ codes:", gapUnmappedCivs.value.join(", "));
      }
      return gaps;
    }

    // T006 — Scan orchestration (fetches independently of the sync card)
    async function startGapScan() {
      gapPhase.value = "scanning";

      const urls = {
        units:        "https://data.aoe4world.com/units/all-optimized.json",
        buildings:    "https://data.aoe4world.com/buildings/all-optimized.json",
        technologies: "https://data.aoe4world.com/technologies/all-optimized.json",
        abilities:    "https://data.aoe4world.com/abilities/all-optimized.json",
      };

      const fetchedData = {};
      gapFetchErrors.value = {};
      await Promise.all(
        Object.keys(urls).map(async (source) => {
          try {
            const response = await fetch(urls[source]);
            if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);
            const json = await response.json();
            fetchedData[source] = Array.isArray(json) ? json : (json.data ?? []);
          } catch (err) {
            gapFetchErrors.value[source] = err.message;
            console.error(`[gap-sync] fetch failed for ${source}:`, err.message);
          }
        })
      );

      gapItems.value = buildGapList(fetchedData);
      gapItems.value.forEach((gap) => initAssignment(gap));
      gapPhase.value = "results";
    }

    function resetGapScan() {
      gapPhase.value = "idle";
      gapItems.value = [];
      gapSourceCount.value = 0;
      gapUnmappedCivs.value = [];
      gapFetchErrors.value = {};
      gapCivFilter.value = null;
      gapKindFilter.value = [];
      gapAssignments.value = {};
      gapImageStatus.value = {};
      gapImageErrors.value = {};
      gapJsonSaved.value = {};
      gapZipSaved.value = false;
      gapZipProcessing.value = false;
      gapZipNoFiles.value = false;
      gapGroupDownloading.value = {};
      gapGroupCopied.value = {};
      gapNoIconKeys.value = {};
      gapSyncIgnore.value = [...syncIgnoreData];
    }

    // T008 — Category auto-suggestion
    function suggestCategory(gap) {
      if (gap.kind === "civ-extension" || gap.kind === "civ-removal") {
        return gap.localCategory?.key ?? null;
      }
      const name = gap.name?.toLowerCase() ?? "";
      const type = gap.type;

      if (type === "ability") return "abilityHero";

      if (type === "technology") {
        if (/farm|trade|gold|food|wood|eco|market|granary/.test(name)) return "techEco";
        return "techMilitary";
      }

      if (type === "unit") {
        if (/villager|worker|builder|fishing/.test(name)) return "unitEco";
        if (/monk|priest|imam|scholar|cleric|warrior monk/.test(name)) return "unitReligious";
        if (/hero|khan|sultan|daimyo|leader|general|champion|jeanne/.test(name)) return "unitHero";
        return "unitMilitary";
      }

      if (type === "building") {
        if (/landmark/.test(name)) return "landmarks";
        if (/mosque|church|temple|shrine|monastery|sacred/.test(name)) return "buildingReligious";
        if (/mill|farm|market|dock|storehouse|granary|house|stable_eco/.test(name)) return "buildingEco";
        if (/barracks|stable|archery|siege|camp|keep|outpost/.test(name)) return "buildingMilitary";
        if (/university|blacksmith|armory|workshop/.test(name)) return "buildingTech";
        return null;
      }

      return null;
    }

    // T009 — Initialize assignment for one gap item
    function initAssignment(gap) {
      const gapKey = gap.id + ":" + gap.civ;
      const categoryKey = suggestCategory(gap);
      const imageFolder = gap.kind === "new" ? resolveImageFolder(gap) : null;
      const imgSrc = gap.kind === "civ-extension" ? (gap.localEntry?.imgSrc ?? "") : "";
      gapAssignments.value[gapKey] = {
        categoryKey,
        autoSuggested: categoryKey !== null,
        confirmed: categoryKey !== null,
        imageFolder,
        imageFolderInput: imageFolder ?? (gap.type ? gap.type + "_" : ""),
        imgSrc,
      };
    }

    // T010 — Manual category confirmation
    function confirmManualCategory(gapKey, categoryKey) {
      if (!gapAssignments.value[gapKey]) return;
      gapAssignments.value[gapKey] = {
        ...gapAssignments.value[gapKey],
        categoryKey,
        autoSuggested: false,
        confirmed: true,
      };
    }

    function setImageFolder(gapKey, val) {
      if (!gapAssignments.value[gapKey]) return;
      gapAssignments.value[gapKey] = { ...gapAssignments.value[gapKey], imageFolderInput: val };
    }

    function confirmImageFolder(gapKey, val) {
      if (!val?.trim() || !gapAssignments.value[gapKey]) return;
      gapAssignments.value[gapKey] = { ...gapAssignments.value[gapKey], imageFolder: val.trim() };
    }

    // T011 — JSON download
    async function downloadGapJsons() {
      const ignoredSet = new Set(gapSyncIgnore.value);
      const byCategory = {};

      for (const gap of gapItems.value) {
        if (ignoredSet.has(gap.id)) continue;
        const gapKey = gap.id + ":" + gap.civ;
        const assignment = gapAssignments.value[gapKey];
        if (!assignment?.confirmed) continue;
        if (!byCategory[assignment.categoryKey]) byCategory[assignment.categoryKey] = [];
        byCategory[assignment.categoryKey].push({ gap, assignment });
      }

      for (const [catKey, entries] of Object.entries(byCategory)) {
        const config = CATEGORY_CONFIG.find((c) => c.key === catKey);
        if (!config) continue;
        const arr = JSON.parse(JSON.stringify(config.data));

        // Merge all civs for the same new item into one entry
        const newById = new Map();
        for (const { gap, assignment } of entries) {
          if (gap.kind !== "new") continue;
          if (!newById.has(gap.id)) newById.set(gap.id, { gap, assignment, civCodes: new Set() });
          newById.get(gap.id).civCodes.add(gap.civCode);
        }
        for (const { gap, assignment, civCodes } of newById.values()) {
          arr.push({
            title: gap.name,
            civ: [...civCodes].sort(),
            age: gap.age,
            id: gap.id,
            type: gap.type,
            description: gap.description,
            costs: gap.costs,
            exploreUrl: gap.exploreUrl,
            imgSrc: assignment.imgSrc || (assignment.imageFolder ? `/assets/pictures/${assignment.imageFolder}/${gap.id}.webp` : ""),
          });
        }

        for (const { gap, assignment } of entries) {
          if (gap.kind === "civ-extension") {
            const idx = arr.findIndex((e) => (e.id && e.id === gap.id) || e.title === gap.name);
            if (idx !== -1 && Array.isArray(arr[idx].civ)) {
              if (!arr[idx].civ.includes(gap.civCode)) {
                arr[idx].civ = [...arr[idx].civ, gap.civCode].sort();
              }
              if (gap.costs) arr[idx].costs = gap.costs;
            }
          } else if (gap.kind === "civ-removal") {
            const idx = arr.findIndex((e) => (e.id && e.id === gap.id) || e.title === gap.name);
            if (idx !== -1 && Array.isArray(arr[idx].civ)) {
              arr[idx].civ = arr[idx].civ.filter((c) => c !== gap.civCode);
              if (gap.costs) arr[idx].costs = gap.costs;
            }
          }
        }

        await downloadObjectAsJSONFile(arr, config.filename);
        gapJsonSaved.value = { ...gapJsonSaved.value, [catKey]: true };
      }
    }

    // T013 — Image folder resolution
    function resolveImageFolder(gap) {
      const prefixMap = { unit: "unit_", building: "building_", technology: "technology_", ability: "ability_" };
      const prefix = prefixMap[gap.type];
      if (!prefix) return null;

      if (gap.civCount <= 3) {
        return prefix + (CIV_FOLDER_SLUG[gap.civ] ?? gap.civ);
      }

      const name = gap.name?.toLowerCase() ?? "";

      if (prefix === "unit_") {
        if (/cavalry|horseman|knight|lancer|raider|ghulam|camel/.test(name)) return "unit_cavalry";
        if (/infantry|spear|sword|man-at-arms|footman|archer|crossbow|handcannoneer/.test(name)) return "unit_infantry";
        if (/siege|trebuchet|cannon|mangonel|ram|bombard/.test(name)) return "unit_siege";
        if (/ship|galley|dhow|hulk|junk|lodya|galleass/.test(name)) return "unit_ship";
        if (/villager|worker/.test(name)) return "unit_worker";
        if (/monk|priest|imam|scholar/.test(name)) return "unit_religious";
      }

      if (prefix === "building_") {
        if (/mill|granary|market|house|dock|storehouse|farm/.test(name)) return "building_economy";
        if (/barracks|stable|archery|keep|siege workshop/.test(name)) return "building_military";
        if (/wall|gate|palisade|outpost|tower/.test(name)) return "building_defensive";
        if (/mosque|church|temple|monastery/.test(name)) return "building_religious";
        if (/university|blacksmith|armory|workshop/.test(name)) return "building_technology";
      }

      if (prefix === "technology_") {
        if (/farm|trade|eco|food|wood|gold|market|economy/.test(name)) return "technology_economy";
        if (/wall|fortif|tower|defensive|stone/.test(name)) return "technology_defensive";
        if (/ship|naval|fleet/.test(name)) return "technology_naval";
        if (/monk|religious|sacred|prayer/.test(name)) return "technology_religious";
        if (/unit|veteran|elite|upgrade/.test(name)) return "technology_units";
        return "technology_military";
      }

      if (prefix === "ability_") return "abilities";

      return null;
    }

    // T014 — Image processing (fetch CDN → canvas 48×48 → WebP 80%)
    async function processGapImage(gap, assignment) {
      if (gap.kind === "civ-extension" || gap.kind === "civ-removal") {
        return { skip: true, reason: "civ-extension" };
      }

      const existingIcon = findLocalIconByName(gap);
      if (existingIcon) {
        assignment.imgSrc = existingIcon;
        return { skip: true, reason: "icon-exists" };
      }

      if (!gap.icon) return { skip: false, error: "No icon URL in source data" };

      let pngBlob;
      try {
        const r = await fetch(gap.icon);
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        pngBlob = await r.blob();
      } catch (err) {
        return { skip: false, error: err.message };
      }

      const bitmapUrl = URL.createObjectURL(pngBlob);
      const img = await new Promise((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = () => reject(new Error("Image load failed"));
        el.src = bitmapUrl;
      });
      URL.revokeObjectURL(bitmapUrl);

      const canvas = document.createElement("canvas");
      canvas.width = 48;
      canvas.height = 48;
      canvas.getContext("2d").drawImage(img, 0, 0, 48, 48);

      const webpBlob = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/webp", 0.8)
      );

      const folder = assignment.imageFolder;
      const zipPath = `${folder}/${gap.id}.webp`;
      assignment.imgSrc = `/assets/pictures/${zipPath}`;
      return { skip: false, blob: webpBlob, zipPath };
    }

    // T015 — Build and download images zip
    async function downloadGapImagesZip() {
      const zip = new JSZip();
      let hasFiles = false;
      gapZipProcessing.value = true;
      gapZipNoFiles.value = false;
      const ignoredSet = new Set(gapSyncIgnore.value);
      const processedIds = new Set();

      try {
        for (const gap of gapItems.value) {
          if (gap.kind !== "new") continue;
          if (ignoredSet.has(gap.id)) continue;
          if (processedIds.has(gap.id)) continue;  // each image only once regardless of civ count
          const gapKey = gap.id + ":" + gap.civ;
          const assignment = gapAssignments.value[gapKey];
          if (!assignment?.confirmed || !assignment.imageFolder) continue;

          gapImageStatus.value = { ...gapImageStatus.value, [gapKey]: "processing" };

          const result = await processGapImage(gap, assignment);

          if (result.skip) {
            const reason = result.reason === "civ-extension" ? "skipped" : "exists";
            gapImageStatus.value = { ...gapImageStatus.value, [gapKey]: reason };
          } else if (result.error) {
            gapImageStatus.value = { ...gapImageStatus.value, [gapKey]: "error" };
            gapImageErrors.value = { ...gapImageErrors.value, [gapKey]: result.error };
          } else {
            zip.file(result.zipPath, result.blob);
            hasFiles = true;
            processedIds.add(gap.id);
            gapImageStatus.value = { ...gapImageStatus.value, [gapKey]: "done" };
            gapAssignments.value[gapKey] = { ...assignment };
          }
        }

        if (hasFiles) {
          const zipBlob = await zip.generateAsync({ type: "blob" });
          const href = URL.createObjectURL(zipBlob);
          const link = document.createElement("a");
          link.href = href;
          link.download = "icon-gap-sync.zip";
          link.style.position = "absolute";
          link.style.left = "200vw";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(href);
          gapZipSaved.value = true;
        } else {
          gapZipNoFiles.value = true;
        }
      } finally {
        gapZipProcessing.value = false;
      }
    }

    // Per-group image download (single WebP file)
    async function downloadGroupImage(group) {
      const key = group.id + ":" + group.kind;
      if (!group.icon) return;
      gapGroupDownloading.value = { ...gapGroupDownloading.value, [key]: true };
      try {
        const r = await fetch(group.icon);
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const pngBlob = await r.blob();
        const bitmapUrl = URL.createObjectURL(pngBlob);
        const img = await new Promise((resolve, reject) => {
          const el = new Image();
          el.onload = () => resolve(el);
          el.onerror = () => reject(new Error("Image load failed"));
          el.src = bitmapUrl;
        });
        URL.revokeObjectURL(bitmapUrl);
        const canvas = document.createElement("canvas");
        canvas.width = 48;
        canvas.height = 48;
        canvas.getContext("2d").drawImage(img, 0, 0, 48, 48);
        const webpBlob = await new Promise((resolve) =>
          canvas.toBlob(resolve, "image/webp", 0.8)
        );
        const href = URL.createObjectURL(webpBlob);
        const link = document.createElement("a");
        link.href = href;
        link.download = `${group.id}.webp`;
        link.style.position = "absolute";
        link.style.left = "200vw";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(href);
      } catch (_) {
        // silently fail — row already shows error state from image preview
      } finally {
        gapGroupDownloading.value = { ...gapGroupDownloading.value, [key]: false };
      }
    }

    // Per-group JSON copy
    function buildGroupJsonEntry(group) {
      const firstCiv = group.allCivs[0];
      const assignment = gapAssignments.value[firstCiv.id + ":" + firstCiv.civ];
      if (group.kind === "new") {
        return {
          title: group.name,
          civ: group.allCivs.map((i) => i.civCode),
          age: group.age,
          id: group.id,
          type: group.type,
          description: group.description || "",
          costs: group.costs || {},
          exploreUrl: group.exploreUrl || "",
          imgSrc: assignment?.imgSrc || (assignment?.imageFolder ? `/assets/pictures/${assignment.imageFolder}/${group.id}.webp` : ""),
        };
      }
      if (group.kind === "civ-extension") {
        const localEntry = group.localEntry;
        if (!localEntry) return null;
        return {
          ...localEntry,
          civ: [...(localEntry.civ || []), ...group.allCivs.map((i) => i.civCode)].sort(),
          ...(group.costs ? { costs: group.costs } : {}),
        };
      }
      if (group.kind === "civ-removal") {
        const localEntry = group.localEntry;
        if (!localEntry) return null;
        const civsToRemove = new Set(group.allCivs.map((i) => i.civCode));
        return {
          ...localEntry,
          civ: (localEntry.civ || []).filter((c) => !civsToRemove.has(c)),
          ...(group.costs ? { costs: group.costs } : {}),
        };
      }
      return null;
    }

    async function copyGroupJson(group) {
      const key = group.id + ":" + group.kind;
      const entry = buildGroupJsonEntry(group);
      if (!entry) return;
      try {
        await navigator.clipboard.writeText(JSON.stringify(entry, null, 2));
        gapGroupCopied.value = { ...gapGroupCopied.value, [key]: true };
        setTimeout(() => {
          gapGroupCopied.value = { ...gapGroupCopied.value, [key]: false };
        }, 2000);
      } catch (_) {
        // clipboard API may be unavailable in non-secure contexts
      }
    }

    function skipGapItem(group) {
      if (!gapSyncIgnore.value.includes(group.id)) {
        gapSyncIgnore.value = [...gapSyncIgnore.value, group.id];
      }
    }

    function unskipGapItem(id) {
      gapSyncIgnore.value = gapSyncIgnore.value.filter((i) => i !== id);
    }

    async function downloadSyncIgnore() {
      await downloadObjectAsJSONFile(gapSyncIgnore.value, "syncIgnore.json");
    }

    // === CHECK IMAGES ===========================================================

    const checkImgPhase       = ref("idle");  // 'idle' | 'scanning' | 'results'
    const checkImgItems       = ref([]);       // { entry, config, icon, folder, filename, key }[]
    const checkImgDownloading = ref({});       // { [key]: boolean }
    const checkImgZipProcessing = ref(false);
    const checkImgZipSaved      = ref(false);
    const checkImgZipNoFiles    = ref(false);
    const checkImgFetchErrors   = ref({});

    async function startCheckImages() {
      checkImgPhase.value = "scanning";
      checkImgFetchErrors.value = {};
      checkImgItems.value = [];
      checkImgZipSaved.value = false;
      checkImgZipNoFiles.value = false;

      // 1. Collect every local entry that has an imgSrc
      const allEntries = [];
      for (const config of CATEGORY_CONFIG) {
        for (const entry of config.data) {
          if (entry.imgSrc) allEntries.push({ entry, config });
        }
      }

      // 2. Test each imgSrc by trying to load it as an image
      const broken = [];
      await Promise.all(
        allEntries.map(
          ({ entry, config }) =>
            new Promise((resolve) => {
              const img = new Image();
              img.onload = () => resolve();
              img.onerror = () => { broken.push({ entry, config }); resolve(); };
              img.src = entry.imgSrc;
            })
        )
      );

      if (broken.length === 0) {
        checkImgPhase.value = "results";
        return;
      }

      // 3. Fetch AOE4World optimized data to resolve CDN icon URLs for broken entries
      const urls = {
        units:        "https://data.aoe4world.com/units/all-optimized.json",
        buildings:    "https://data.aoe4world.com/buildings/all-optimized.json",
        technologies: "https://data.aoe4world.com/technologies/all-optimized.json",
        abilities:    "https://data.aoe4world.com/abilities/all-optimized.json",
      };
      const fetchedSource = {};
      await Promise.all(
        Object.keys(urls).map(async (source) => {
          try {
            const r = await fetch(urls[source]);
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            const json = await r.json();
            fetchedSource[source] = Array.isArray(json) ? json : (json.data ?? []);
          } catch (err) {
            checkImgFetchErrors.value[source] = err.message;
          }
        })
      );

      const allSource = [
        ...(fetchedSource.units        || []),
        ...(fetchedSource.buildings    || []),
        ...(fetchedSource.technologies || []),
        ...(fetchedSource.abilities    || []),
      ];

      // 4. Match broken local entries to source items for CDN icon URL
      checkImgItems.value = broken.map(({ entry, config }) => {
        const nameLC = entry.title?.toLowerCase();
        const localBaseId = entry.id?.replace(/-\d+$/, "") ?? entry.id;
        const sourceItem = allSource.find((s) => {
          const sBase = s.baseId || s.id;
          return (
            s.id === entry.id || sBase === entry.id ||
            s.id === localBaseId || sBase === localBaseId ||
            s.name === entry.title || s.name?.toLowerCase() === nameLC
          );
        });
        // Derive folder + filename from imgSrc: /assets/pictures/{folder}/{filename}
        const rel = entry.imgSrc.replace(/^\/assets\/pictures\//, "");
        const lastSlash = rel.lastIndexOf("/");
        const folder   = lastSlash !== -1 ? rel.slice(0, lastSlash)  : "";
        const filename = lastSlash !== -1 ? rel.slice(lastSlash + 1) : rel;
        return {
          entry,
          config,
          icon: sourceItem?.icon ?? null,
          folder,
          filename,
          key: config.key + ":" + (entry.id || entry.title),
        };
      });

      checkImgPhase.value = "results";
    }

    function resetCheckImages() {
      checkImgPhase.value = "idle";
      checkImgItems.value = [];
      checkImgDownloading.value = {};
      checkImgZipProcessing.value = false;
      checkImgZipSaved.value = false;
      checkImgZipNoFiles.value = false;
      checkImgFetchErrors.value = {};
    }

    async function _fetchAndConvertWebP(iconUrl) {
      const r = await fetch(iconUrl);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const pngBlob = await r.blob();
      const bitmapUrl = URL.createObjectURL(pngBlob);
      const imgEl = await new Promise((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = () => reject(new Error("Image load failed"));
        el.src = bitmapUrl;
      });
      URL.revokeObjectURL(bitmapUrl);
      const canvas = document.createElement("canvas");
      canvas.width = 48; canvas.height = 48;
      canvas.getContext("2d").drawImage(imgEl, 0, 0, 48, 48);
      return new Promise((resolve) => canvas.toBlob(resolve, "image/webp", 0.8));
    }

    async function downloadCheckImage(item) {
      if (!item.icon) return;
      checkImgDownloading.value = { ...checkImgDownloading.value, [item.key]: true };
      try {
        const webpBlob = await _fetchAndConvertWebP(item.icon);
        const outName = item.filename.replace(/\.[^.]+$/, ".webp");
        const href = URL.createObjectURL(webpBlob);
        const link = document.createElement("a");
        link.href = href; link.download = outName;
        link.style.position = "absolute"; link.style.left = "200vw";
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
        URL.revokeObjectURL(href);
      } catch (_) {
        // silently fail — user sees "no CDN icon" chip instead
      } finally {
        checkImgDownloading.value = { ...checkImgDownloading.value, [item.key]: false };
      }
    }

    async function downloadCheckImagesZip() {
      const zip = new JSZip();
      let hasFiles = false;
      checkImgZipProcessing.value = true;
      checkImgZipNoFiles.value = false;
      checkImgZipSaved.value = false;
      try {
        for (const item of checkImgItems.value) {
          if (!item.icon) continue;
          try {
            const webpBlob = await _fetchAndConvertWebP(item.icon);
            const outName = item.filename.replace(/\.[^.]+$/, ".webp");
            zip.file(item.folder ? `${item.folder}/${outName}` : outName, webpBlob);
            hasFiles = true;
          } catch (_) {
            // skip this item on error
          }
        }
        if (hasFiles) {
          const zipBlob = await zip.generateAsync({ type: "blob" });
          const href = URL.createObjectURL(zipBlob);
          const link = document.createElement("a");
          link.href = href; link.download = "check-images.zip";
          link.style.position = "absolute"; link.style.left = "200vw";
          document.body.appendChild(link); link.click(); document.body.removeChild(link);
          URL.revokeObjectURL(href);
          checkImgZipSaved.value = true;
        } else {
          checkImgZipNoFiles.value = true;
        }
      } finally {
        checkImgZipProcessing.value = false;
      }
    }

    // ===========================================================================

    return {
      authIsReady: computed(() => store.state.authIsReady),
      isAdmin: computed(() => store.state.isAdmin),
      // Sync pipeline
      syncPhase, fetchStatus, sourceData, categoryResults, openPanels, autocompleteSearch, canSaveAny,
      startSync, resetSync, saveAll,
      resolveEntry, skipEntry, unskipEntry,
      getCategorySourceItems, filterSourceItems, findLocalIconByName, getItemSubtitle, downloadCategory,
      // Icon Gap Sync
      CIV_DISPLAY_NAME,
      gapPhase, gapItems, gapSourceCount, gapUnmappedCivs, gapFetchErrors, gapCivFilter, gapKindFilter, gapAssignments, gapImageStatus, gapImageErrors, gapJsonSaved, gapZipSaved,
      gapZipProcessing, gapZipNoFiles, gapGroupDownloading, gapGroupCopied,
      filteredGapItems, gapCivOptions, canDownloadJsons, canDownloadImages, gapCategoryKeys,
      gapNoIconKeys, filteredGapGroups, filteredSkippedGroups,
      startGapScan, resetGapScan, gapCdnIconUrl, markGapNoIcon, confirmGroupCategory, toggleKindFilter,
      confirmManualCategory, setImageFolder, confirmImageFolder,
      downloadGapJsons, downloadGapImagesZip, downloadGroupImage, copyGroupJson,
      gapSyncIgnore, ignoredGroups, visibleGapGroups, visibleSkippedGroups,
      skipGapItem, unskipGapItem, downloadSyncIgnore,
      gapNewCount, gapCivPlusCount, gapCivMinusCount,
      // Check Images
      checkImgPhase, checkImgItems, checkImgDownloading,
      checkImgZipProcessing, checkImgZipSaved, checkImgZipNoFiles, checkImgFetchErrors,
      startCheckImages, resetCheckImages, downloadCheckImage, downloadCheckImagesZip,
    };
  },
};
</script>
